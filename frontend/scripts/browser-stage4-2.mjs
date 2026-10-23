/** Stage 4.2: local browser UI + real health/catalog; offline POST replay only. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve(".."),
  out = path.join(root, "artifacts/stage4_2");
const fixture = JSON.parse(
  await readFile(
    path.join(root, "artifacts/stage4_1/offline-fixtures.json"),
    "utf8",
  ),
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [],
  audits = [],
  layouts = [],
  requests = [],
  errors = [],
  network = [],
  contrasts = [];
function check(label, ok) {
  assert.ok(ok, label);
  checks.push(label);
}
async function shot(page, name, fullPage = true) {
  await page.screenshot({ path: path.join(out, name + ".png"), fullPage });
  if (name.endsWith("-390")) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: path.join(out, name + "-viewport.png"),
      fullPage: false,
    });
  }
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
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
    manual_review_needed: result.incomplete.map((v) => v.id),
  });
  check(name + " axe", result.violations.length === 0);
}
async function layout(page, name, width) {
  const result = await page.evaluate(() => {
    const visible = (e) =>
      e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
    const controls = [
      ...document.querySelectorAll("button,input,textarea,summary"),
    ]
      .filter(visible)
      .map((e) => {
        const target = e.matches('input[type="checkbox"]')
          ? e.closest("label") || e
          : e;
        const r = target.getBoundingClientRect();
        return {
          name:
            e.getAttribute("aria-label") ||
            e.textContent.trim().slice(0, 45) ||
            e.type,
          width: r.width,
          height: r.height,
        };
      });
    const fields = [
      ...document.querySelectorAll('input:not([type="checkbox"]),textarea'),
    ]
      .filter(visible)
      .map((e) => ({
        font: parseFloat(getComputedStyle(e).fontSize),
        rect: e.getBoundingClientRect().toJSON(),
      }));
    const overlaps = [];
    for (let i = 0; i < fields.length; i++)
      for (let j = i + 1; j < fields.length; j++) {
        const a = fields[i].rect,
          b = fields[j].rect;
        if (a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y)
          overlaps.push([i, j]);
      }
    return {
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      controls,
      fields,
      overlaps,
    };
  });
  layouts.push({ screen: name, ...result });
  check(name + " no horizontal overflow", result.scrollWidth <= width);
  check(name + " no overlapping entry fields", result.overlaps.length === 0);
  check(
    name + " controls at least 44px",
    result.controls.every((c) => c.width >= 43.5 && c.height >= 43.5),
  );
  if (width <= 760)
    check(
      name + " mobile inputs at least 16px",
      result.fields.every((f) => f.font >= 16),
    );
}
async function contrast(page) {
  // Composite actual computed ancestor fills; no pixel sampling or assumed transparent color.
  const pairs = await page.evaluate(() => {
    const rgba = (s) => {
      const n = s.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
      return [n[0], n[1], n[2], n[3] ?? 1];
    };
    const mix = (a, b) =>
      a
        .slice(0, 3)
        .map((v, i) => v * a[3] + b[i] * (1 - a[3]))
        .concat(1);
    const bg = (e) => {
      const chain = [];
      for (let n = e; n; n = n.parentElement) chain.unshift(n);
      let color = [255, 255, 255, 1];
      for (const n of chain)
        color = mix(rgba(getComputedStyle(n).backgroundColor), color);
      return color;
    };
    const selections = [
      ["Body text", "body", "color", 4.5],
      ["Supporting text", ".quick-start > p", "color", 4.5],
      ["Small label", ".optional", "color", 4.5],
      ["Button", ".primary", "color", 4.5],
      ["Link", ".text-button", "color", 4.5],
      ["Input text", 'input[type="number"]', "color", 4.5],
      ["Input border", 'input[type="number"]', "borderTopColor", 3],
      ["Example button boundary", ".example-option", "borderLeftColor", 3],
      ["Focus indicator", ".example-option", "outlineColor", 3],
      ["Disabled step", ".sidebar button:disabled", "color", 4.5],
    ];
    const result = selections.map(([label, selector, prop, threshold]) => {
      const e = document.querySelector(selector),
        s = getComputedStyle(e);
      const background = bg(e);
      return {
        label,
        selector,
        property: prop,
        foreground: mix(rgba(s[prop]), background).slice(0, 3),
        background: background.slice(0, 3),
        threshold,
      };
    });
    for (const status of ["pass", "unknown", "fail"]) {
      const e = document.createElement("span");
      e.className = "badge " + status;
      e.textContent = "Contrast sample";
      document.querySelector("main").append(e);
      const background = bg(e);
      result.push({
        label: "Status " + status,
        property: "color",
        foreground: mix(rgba(getComputedStyle(e).color), background).slice(
          0,
          3,
        ),
        background: background.slice(0, 3),
        threshold: 4.5,
      });
      e.remove();
    }
    return result;
  });
  const lum = (a) =>
    a
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  for (const pair of pairs) {
    const a = lum(pair.foreground),
      b = lum(pair.background);
    pair.ratio = Number(
      ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2),
    );
    contrasts.push(pair);
    check(pair.label + " contrast", pair.ratio >= pair.threshold);
  }
}
try {
  for (const width of [1440, 768, 430, 390, 360, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: width > 760 ? 1050 : 844 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const posts = [];
    await page.route("**/*", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      network.push({ origin: url.origin, type: req.resourceType() });
      if (url.origin !== "http://127.0.0.1:5173") return route.abort();
      if (!url.pathname.startsWith("/api/")) return route.continue();
      if (
        req.method() === "GET" &&
        ["/api/health", "/api/programs"].includes(url.pathname)
      )
        return route.continue();
      if (
        req.method() !== "POST" ||
        !["/api/recommend", "/api/journey"].includes(url.pathname)
      )
        return route.abort();
      const body = req.postDataJSON();
      posts.push(url.pathname);
      requests.push({
        width,
        path: url.pathname,
        body,
        kind: "offline replay",
      });
      if (url.pathname === "/api/recommend") {
        assert.equal(body.max_program_fee, 400);
        assert.equal(body.max_duration_minutes, 90);
        assert.equal(body.assume_usd, true);
        assert.equal(body.budget_currency, "USD");
        assert.deepEqual(body.grades, [4]);
        assert.equal(body.student_count, 24);
        assert.deepEqual(body.preferences, [
          "Force and motion",
          "engineering design",
          "experimentation",
        ]);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        assert.equal(body.program_id, "ewm-catapult");
        assert.equal(body.teacher_selected, true);
        assert.equal(
          req.headers()["x-workflow-token"],
          "offline-test-capability-only",
        );
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          url.pathname === "/api/recommend"
            ? fixture.cases.provided.response
            : fixture.journey,
        ),
      });
    });
    await page.goto("http://127.0.0.1:5173");
    await page
      .getByRole("button", { name: "Load Explore Force & Motion example" })
      .waitFor();
    await page
      .getByRole("button", { name: "Load Explore Force & Motion example" })
      .focus();
    check(
      width + " visible keyboard focus",
      await page
        .getByRole("button", { name: "Load Explore Force & Motion example" })
        .evaluate(
          (e) =>
            getComputedStyle(e).outlineStyle === "solid" &&
            getComputedStyle(e).outlineWidth === "3px",
        ),
    );
    if (width === 1440) await contrast(page);
    await page.keyboard.press("Enter");
    check(width + " Quick Start does not infer", posts.length === 0);
    check(
      width + " preset USD remains unchecked",
      !(await page
        .getByRole("checkbox", { name: /I accept the USD/ })
        .isChecked()),
    );
    check(
      width + " explicit numeric input modes",
      (await page
        .getByRole("spinbutton", { name: "Maximum program-fee budget" })
        .getAttribute("inputmode")) === "decimal",
    );
    if (width <= 760) {
      check(
        width + " compact step indicator",
        await page.getByText("Step 1 of 5", { exact: true }).isVisible(),
      );
      check(
        width + " steps initially collapsed",
        !(await page
          .getByRole("navigation", { name: "Planning steps" })
          .isVisible()),
      );
      await page.getByRole("button", { name: "Show steps" }).click();
      check(
        width + " future steps disabled",
        await page
          .getByRole("navigation", { name: "Planning steps" })
          .getByRole("button", { name: /Learning Journey/ })
          .isDisabled(),
      );
      await page.getByRole("button", { name: "Hide steps" }).click();
    }
    await page.getByRole("button", { name: /Discover Programs/ }).click();
    check(
      width + " USD consent blocks submission",
      (await page.getByRole("alert").isVisible()) && posts.length === 0,
    );
    await page.getByRole("checkbox", { name: /I accept the USD/ }).check();
    await layout(page, `${width} intake`, width);
    await audit(page, `${width} intake`);
    await shot(page, `intake-${width}`);
    await page.getByRole("button", { name: /Discover Programs/ }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Finding connections" })
      .waitFor();
    check(
      width + " loading prevents duplicate submit",
      await page
        .getByRole("button", { name: /Finding thoughtful matches/ })
        .isDisabled(),
    );
    await page
      .getByText("Find your class’s next discovery.", { exact: true })
      .waitFor();
    await layout(page, `${width} recommendations`, width);
    await audit(page, `${width} recommendations`);
    if ([1440, 390].includes(width))
      await shot(page, `recommendations-${width}`);
    const catapult = page.locator("article").filter({
      has: page.getByRole("heading", { name: "Catapult", exact: true }),
    });
    check(
      width + " official source visible without expansion",
      await catapult
        .getByRole("link", { name: "Official museum program page ↗" })
        .first()
        .isVisible(),
    );
    check(
      width + " secondary evidence collapsed",
      (await catapult.locator(".source-details").getAttribute("open")) === null,
    );
    for (const name of ["Rubber Band Car", "Bridges"]) {
      const card = page
        .locator("article")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
      check(
        width + " " + name + " mandatory uncertainty visible",
        (await card
          .getByText("Needs Confirmation", { exact: true })
          .isVisible()) &&
          (await card
            .getByText(
              /Workshop duration is not published or has not been verified/,
            )
            .isVisible()),
      );
    }
    await catapult
      .getByText("Additional Source Details", { exact: true })
      .click();
    check(
      width + " evidence dates accessible",
      await catapult.getByText(/Source review:/).isVisible(),
    );
    check(
      width + " evidence lacks developer codes",
      !/program_page|grade_levels|\/description|grade:4/.test(
        await catapult.innerText(),
      ),
    );
    await catapult
      .getByText("Additional Source Details", { exact: true })
      .click();
    await page.getByRole("button", { name: "Compare Programs (3)" }).click();
    if (width <= 760) {
      const region = page.getByRole("region", {
        name: "Program comparison by attribute",
      });
      check(
        width + " readable vertical comparison",
        (await region.isVisible()) &&
          !(await page.getByRole("table").isVisible()),
      );
      check(
        width + " three selection choices",
        (await region.getByRole("button", { name: /Select / }).count()) === 3,
      );
    } else
      check(
        width + " desktop table retained",
        await page.getByRole("table").isVisible(),
      );
    await layout(page, `${width} comparison`, width);
    if ([1440, 390, 320].includes(width)) {
      await audit(page, `${width} comparison`);
      await shot(page, `comparison-${width}`);
    }
    if (width === 390) {
      await page
        .getByRole("region", { name: "Program comparison by attribute" })
        .getByRole("heading", { name: "Class program fee", exact: true })
        .evaluate((el) => el.scrollIntoView({ block: "start" }));
      await page.screenshot({
        path: path.join(out, "comparison-fees-390.png"),
        fullPage: false,
      });
    }
    await catapult.getByRole("button", { name: "Select This Program" }).click();
    check(
      width + " explicit review step without Designer call",
      posts.length === 1,
    );
    await layout(page, `${width} selection`, width);
    if ([1440, 390].includes(width)) await shot(page, `selection-${width}`);
    await page
      .getByRole("button", { name: "Generate Learning Journey" })
      .click();
    await page
      .getByText("A journey beyond the workshop", { exact: true })
      .waitFor();
    check(
      width + " all phases present",
      (await page.locator(".phase").count()) === 3,
    );
    const field = page.getByRole("textbox", {
      name: "BEFORE Learning objectives 1",
    });
    await field.fill(
      "Explain force and motion using an actual workshop observation.",
    );
    check(
      width + " editor displays full text",
      await field.evaluate((e) => e.clientHeight >= e.scrollHeight - 2),
    );
    await layout(page, `${width} journey`, width);
    if ([1440, 390].includes(width)) {
      await audit(page, `${width} journey`);
      await shot(page, `journey-${width}`);
      if (width === 390) {
        await page
          .locator(".phase.before")
          .evaluate((el) => el.scrollIntoView({ block: "start" }));
        await page.screenshot({
          path: path.join(out, "editing-390.png"),
          fullPage: false,
        });
      }
    }
    await page
      .getByRole("button", { name: "Review & Export", exact: true })
      .click();
    check(
      width + " edit preserved in review",
      await page
        .getByText(
          "Explain force and motion using an actual workshop observation.",
          { exact: true },
        )
        .isVisible(),
    );
    await page
      .getByRole("button", { name: "Return to Editing", exact: true })
      .click();
    check(
      width + " edit preserved on return",
      (await field.inputValue()) ===
        "Explain force and motion using an actual workshop observation.",
    );
    await page
      .getByRole("button", { name: "Review & Export", exact: true })
      .click();
    await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
    await layout(page, `${width} review`, width);
    await audit(page, `${width} review`);
    if ([1440, 390, 768].includes(width)) await shot(page, `review-${width}`);
    if (width === 1440)
      await page.pdf({
        path: path.join(out, "learning-plan.pdf"),
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", bottom: "12mm", left: "14mm", right: "14mm" },
      });
    check(width + " no extra inference actions", posts.length === 2);
    check(
      width + " temporary token not exposed",
      await page.evaluate(
        () =>
          !document.documentElement.outerHTML.includes(
            "offline-test-capability-only",
          ) &&
          localStorage.length === 0 &&
          sessionStorage.length === 0 &&
          !location.href.includes("workflow"),
      ),
    );
    check(
      width + " reduced motion honored",
      await page
        .locator(".primary")
        .first()
        .evaluate((e) => getComputedStyle(e).transitionDuration === "0s"),
    );
    await context.close();
  }
  // Controlled error response on a phone, without contacting the provider.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.route("**/api/recommend", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "provider_unavailable" } }),
    }),
  );
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Use force & motion example" })
    .click();
  await page.getByRole("button", { name: /Discover Programs/ }).click();
  await page.getByRole("alert").waitFor();
  check(
    "Phone controlled error and restart path",
    (await page
      .getByRole("alert")
      .getByText(/temporarily unavailable/)
      .isVisible()) &&
      (await page
        .getByRole("button", { name: "Return to requirements / new search" })
        .isVisible()),
  );
  await audit(page, "390 controlled provider error");
  await shot(page, "error-390");
  await context.close();
  check("No browser JavaScript errors", errors.length === 0);
  check(
    "Application requested no external assets or services",
    network.every((n) => n.origin === "http://127.0.0.1:5173"),
  );
} finally {
  await writeFile(
    path.join(out, "browser-regression.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        execution_kind:
          "Offline POST replay; actual local UI and backend health/catalog; no Portkey",
        checks,
        requests,
        audits,
        layouts,
        contrasts,
        errors,
        network_origins: [...new Set(network.map((n) => n.origin))],
      },
      null,
      2,
    ) + "\n",
  );
  await browser.close();
}
console.log(
  `${checks.length} assertions; ${audits.length} axe audits; ${layouts.length} layout checks; no model inference.`,
);
