/** Actual local UI + health/catalog HTTP; POST responses replayed OFFLINE. No model calls. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(".."),
  out = path.join(root, "artifacts/stage4_1");
const fixture = JSON.parse(
  await readFile(path.join(out, "offline-fixtures.json"), "utf8"),
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const checks = [],
  requests = [],
  audits = [],
  errors = [];
const noCodes =
  /grade_levels|program_page|source_id|\/description|\/subjects|\/duration|grade:4|— pass|— unknown/;
function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
}
async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(out, name + ".png"),
    fullPage: true,
  });
}
async function audit(page, name) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  audits.push({
    screen: name,
    violations: result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => n.target),
    })),
  });
  check(name + " automated accessibility", result.violations.length === 0);
}
try {
  const health = await context.request.get("http://127.0.0.1:5173/api/health");
  const catalog = await context.request.get(
    "http://127.0.0.1:5173/api/programs",
  );
  check("Real proxied backend health HTTP 200", health.status() === 200);
  check(
    "Real proxied catalog contains 20 programs",
    catalog.status() === 200 && (await catalog.json()).programs.length === 20,
  );
  for (const name of ["provided", "blank", "edited"]) {
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const current = fixture.cases[name];
    await page.route("**/api/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (
        request.method() === "GET" &&
        ["/api/health", "/api/programs"].includes(url.pathname)
      )
        return route.continue();
      if (
        request.method() !== "POST" ||
        !["/api/recommend", "/api/journey"].includes(url.pathname)
      )
        return route.abort();
      const body = request.postDataJSON();
      requests.push({
        case: name,
        route: url.pathname,
        request: body,
        execution_kind: "offline replay",
      });
      if (url.pathname === "/api/recommend")
        assert.deepEqual(body, current.request);
      if (url.pathname === "/api/journey") {
        check(
          "Explicit selected Catapult sent to journey endpoint",
          body.program_id === "ewm-catapult" &&
            body.teacher_selected === true &&
            body.acknowledge_unknown === false,
        );
        check(
          "Temporary test capability sent in header",
          request.headers()["x-workflow-token"] ===
            "offline-test-capability-only",
        );
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          url.pathname === "/api/recommend"
            ? current.response
            : fixture.journey,
        ),
      });
    });
    await page.goto("http://127.0.0.1:5173");
    await page
      .getByRole("textbox", { name: /Learning goal/ })
      .fill(current.request.learning_goal);
    const budget = page.getByRole("spinbutton", {
        name: "Maximum program-fee budget",
      }),
      time = page.getByRole("spinbutton", {
        name: "Maximum workshop duration",
      });
    check(
      name + " initial optional inputs blank",
      (await budget.inputValue()) === "" && (await time.inputValue()) === "",
    );
    check(
      name + " examples clearly labeled",
      (await budget.getAttribute("placeholder")) === "e.g., 400" &&
        (await time.getAttribute("placeholder")) === "e.g., 90",
    );
    if (name !== "blank") {
      await budget.fill("400");
      await time.fill("90");
      await page.getByRole("checkbox", { name: /I accept the USD/ }).check();
      if (name === "edited") {
        await budget.fill("600");
        await time.fill("120");
      }
    }
    if (name === "provided") {
      await screenshot(page, "intake-applied");
      await audit(page, "intake desktop");
    }
    if (name === "blank") await screenshot(page, "intake-blank");
    await page.getByRole("button", { name: /Discover Programs/ }).click();
    await page
      .getByRole("heading", { name: "Find your class’s next discovery." })
      .waitFor();
    const strip = await page.locator(".request-strip").innerText();
    check(
      name + " limits displayed accurately",
      name === "blank"
        ? strip.includes("No maximum program-fee budget specified") &&
            strip.includes("No maximum workshop duration specified")
        : strip.includes(
            `USD ${current.request.max_program_fee} program-fee budget`,
          ) &&
            strip.includes(
              `${current.request.max_duration_minutes} minutes maximum`,
            ),
    );
    for (const program of ["Rubber Band Car", "Bridges"]) {
      const card = page
        .locator("article")
        .filter({
          has: page.getByRole("heading", { name: program, exact: true }),
        });
      check(
        name + " " + program + " correct missing-duration classification",
        (await card.innerText()).includes(
          name === "blank" ? "Program Requirements Met" : "Needs Confirmation",
        ),
      );
      check(
        name + " " + program + " unpublished duration visible",
        (await card.innerText()).includes("Not published"),
      );
    }
    if (name !== "provided") {
      await screenshot(page, `recommendations-${name}`);
      if (name === "blank") {
        await page
          .locator("article")
          .filter({
            has: page.getByRole("heading", {
              name: "Rubber Band Car",
              exact: true,
            }),
          })
          .getByRole("button", { name: "Select This Program" })
          .click();
        check(
          "Rubber Band Car duration question retained without hard time limit",
          await page
            .getByText("What is the workshop duration?", { exact: true })
            .isVisible(),
        );
        await page.setViewportSize({ width: 390, height: 844 });
        await screenshot(page, "mobile-missing-duration");
        await audit(page, "missing duration mobile");
      }
      await page.close();
      continue;
    }
    const catapult = page
      .locator("article")
      .filter({
        has: page.getByRole("heading", { name: "Catapult", exact: true }),
      });
    check(
      "Catapult real matching subtotal $336",
      (await catapult.innerText()).includes("USD 336.00"),
    );
    await screenshot(page, "recommendations-provided");
    await page.getByRole("button", { name: "Compare Programs (3)" }).click();
    check(
      "Three-program comparison",
      (await page.getByRole("columnheader").count()) === 4,
    );
    await page
      .locator(".comparison")
      .screenshot({ path: path.join(out, "comparison.png") });
    await catapult.getByText("Sources & Verification", { exact: true }).click();
    await catapult
      .getByText("Information still to confirm", { exact: true })
      .click();
    check(
      "Expanded evidence is human readable",
      !noCodes.test(await catapult.innerText()),
    );
    await catapult.screenshot({ path: path.join(out, "source-evidence.png") });
    const all = page.locator(".all-checks");
    check(
      "Catalog collapsed by default",
      (await all.getAttribute("open")) === null,
    );
    await page.getByText("How were programs checked?", { exact: true }).click();
    await all.screenshot({ path: path.join(out, "catalog-summary.png") });
    for (const group of await all.locator(".check-group > summary").all())
      await group.click();
    for (const more of await all
      .getByRole("button", { name: /Show all/ })
      .all())
      await more.click();
    check(
      "All 20 catalog decisions remain available",
      (await all.locator(".check-row").count()) === 20,
    );
    await all.locator(".check-row details summary").first().click();
    check(
      "Full catalog has no developer codes",
      !noCodes.test(await all.innerText()),
    );
    await screenshot(page, "catalog-expanded");
    await page.getByText("How were programs checked?", { exact: true }).click();
    await catapult.getByRole("button", { name: "Select This Program" }).click();
    check(
      "No journey before teacher confirmation",
      requests.filter((r) => r.route === "/api/journey").length === 0,
    );
    await page
      .getByRole("button", { name: "Generate Learning Journey" })
      .click();
    await page
      .getByText("A journey beyond the workshop", { exact: true })
      .waitFor();
    check(
      "Untouched content labeled AI generated",
      await page
        .getByText("AI-Generated Teaching Suggestions", { exact: true })
        .isVisible(),
    );
    check(
      "Three learning phases",
      (await page.locator(".phase").count()) === 3,
    );
    await screenshot(page, "journey-untouched");
    await page.pdf({
      path: path.join(out, "plan-untouched.pdf"),
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "14mm", right: "14mm" },
    });
    await page
      .getByRole("textbox", { name: "BEFORE Learning objectives 1" })
      .fill("Explain force and motion using an actual workshop observation.");
    check(
      "Actual edit changes attribution",
      await page
        .getByText("Teacher-Edited Teaching Suggestions", { exact: true })
        .isVisible(),
    );
    await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
    check(
      "Teacher review independently acknowledged",
      await page.getByText("Reviewed by Teacher", { exact: true }).isVisible(),
    );
    await page
      .getByRole("button", { name: "Review & Export", exact: true })
      .click();
    check(
      "Edits persist in review",
      await page
        .getByText(
          "Explain force and motion using an actual workshop observation.",
          { exact: true },
        )
        .isVisible(),
    );
    check(
      "Inquiry retains museum questions",
      (
        await page
          .getByRole("textbox", { name: "Museum inquiry draft" })
          .inputValue()
      ).includes("Can you accommodate our class of 24 students?"),
    );
    await page
      .getByRole("textbox", { name: "Museum inquiry draft" })
      .fill(
        (await page
          .getByRole("textbox", { name: "Museum inquiry draft" })
          .inputValue()) + "\nPlease advise on available dates.",
      );
    await screenshot(page, "review-desktop");
    await audit(page, "review desktop");
    check(
      "No raw source pointers in learning plan",
      !noCodes.test(await page.locator(".learning-plan").innerText()),
    );
    await page.pdf({
      path: path.join(out, "plan-reviewed.pdf"),
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "14mm", right: "14mm" },
    });
    await page.emulateMedia({ media: "print" });
    check(
      "Print hides navigation and inquiry controls",
      !(await page.locator(".sidebar").isVisible()) &&
        !(await page.locator(".inquiry").isVisible()),
    );
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot(page, "review-mobile");
    await audit(page, "review mobile");
    check(
      "Mobile no page overflow",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    check(
      "Capabilities absent from DOM and storage",
      await page.evaluate(
        () =>
          !document.documentElement.outerHTML.includes(
            "offline-test-capability-only",
          ) &&
          localStorage.length === 0 &&
          sessionStorage.length === 0,
      ),
    );
    check(
      "Navigation/edit/review/print caused no extra POSTs",
      requests.length === 2,
    );
    await page.close();
  }
  check(
    "Three recommendation replays plus one journey replay only",
    requests.length === 4,
  );
  check("No browser JavaScript errors", errors.length === 0);
} finally {
  await writeFile(
    path.join(out, "browser-regression.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        execution_kind:
          "offline POST replay; real local UI and proxied health/catalog; no new Portkey inference",
        checks,
        requests,
        audits,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  await browser.close();
}
console.log(
  `${checks.length} browser assertions passed; ${audits.length} accessibility screens; no model inference.`,
);
