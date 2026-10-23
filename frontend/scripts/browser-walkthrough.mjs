/** Explicit live Chrome walkthrough. Uses real localhost APIs; never mocks inference.
 * Run from frontend: node scripts/browser-walkthrough.mjs --live
 * Requires both servers and server-side Portkey configuration. Makes ONE advisor
 * and ONE designer request. Selects Catapult through visible UI (user-approved demo).
 */
import { chromium } from "playwright";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
if (!process.argv.includes("--live"))
  throw Error("Pass --live explicitly: this spends real course model usage.");
const root = path.resolve(".."),
  out = path.join(root, "artifacts/stage4");
await mkdir(out, { recursive: true });
try {
  await access(path.join(out, "browser-live.json"));
  throw Error(
    "Live evidence already exists; do not overwrite or repeat inference.",
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const context = await chromium.launchPersistentContext(
  path.join(root, ".runtime/browser-live"),
  {
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1050 },
    permissions: ["clipboard-read", "clipboard-write"],
  },
);
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [],
  calls = [],
  records = [],
  pending = [];
page.on("pageerror", () => errors.push("Browser page error (details omitted)"));
page.on("request", (r) => {
  if (r.url().includes("/api/") && r.method() === "POST")
    calls.push(new URL(r.url()).pathname);
});
const clean = (value) =>
  Array.isArray(value)
    ? value.map(clean)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value).map(([k, v]) => [
            k,
            /^(workflow_token|.*secret.*|.*api.key.*|authorization)$/i.test(k)
              ? "[REDACTED]"
              : clean(v),
          ]),
        )
      : value;
page.on("response", (response) => {
  if (
    ["/api/recommend", "/api/journey"].includes(
      new URL(response.url()).pathname,
    )
  ) {
    pending.push(
      (async () => {
        const body = await response.json();
        const route = new URL(response.url()).pathname;
        records.push({
          route,
          http_status: response.status(),
          request: JSON.parse(response.request().postData() || "{}"),
          response: body,
        });
      })(),
    );
  }
});
const report = {
  timestamp: new Date().toISOString(),
  execution_kind: "real_portkey_browser",
  browser: "Google Chrome via Playwright, headless",
  checks: [],
  errors,
};
function check(condition, label) {
  if (!condition) throw Error(label);
  report.checks.push(label);
}
try {
  await page.goto("http://127.0.0.1:5173");
  await page.getByText("Local service connected").waitFor();
  await page
    .getByRole("button", { name: "Use force & motion example" })
    .click();
  await page
    .getByRole("spinbutton", {
      name: "Maximum program-fee budget",
      exact: true,
    })
    .fill("400");
  await page.getByRole("checkbox", { name: /I accept the USD/ }).check();
  await page
    .getByRole("spinbutton", { name: /Maximum workshop duration/ })
    .fill("90");
  await page.screenshot({
    path: path.join(out, "intake-live.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Discover Programs" }).click();
  await page
    .getByText("Find your class’s next discovery.")
    .waitFor({ timeout: 100000 });
  await Promise.all(pending);
  const advisor = records.find((r) => r.route === "/api/recommend");
  check(advisor?.http_status === 200, "Real Advisor response succeeded");
  check(calls.length === 1, "No Designer call before explicit selection");
  await page.screenshot({
    path: path.join(out, "recommendations-live.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Compare Programs/ }).click();
  check(
    await page.getByRole("table").isVisible(),
    "Real program comparison visible",
  );
  await page
    .getByRole("region", { name: "Program comparison" })
    .screenshot({ path: path.join(out, "comparison-live.png") });
  const card = page
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: "Catapult", exact: true }),
    });
  check((await card.count()) === 1, "Catapult returned as a genuine candidate");
  await card.getByRole("button", { name: "Select This Program" }).click();
  check(
    calls.length === 1,
    "Selection review does not run Designer automatically",
  );
  await page.screenshot({
    path: path.join(out, "selection-live.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Generate Learning Journey" }).click();
  await page
    .getByText("A journey beyond the workshop")
    .waitFor({ timeout: 100000 });
  await Promise.all(pending);
  const designer = records.find((r) => r.route === "/api/journey");
  check(designer?.http_status === 200, "Real Designer response succeeded");
  for (const name of [
    "Prepare & Wonder",
    "Explore & Observe",
    "Reflect & Extend",
  ])
    check(
      await page.getByRole("heading", { name }).isVisible(),
      `${name} rendered`,
    );
  await page.screenshot({
    path: path.join(out, "journey-live.png"),
    fullPage: true,
  });
  const field = page.getByRole("textbox", {
    name: "BEFORE Learning objectives 1",
  });
  const original = await field.inputValue();
  await field.fill(original + " Use an actual visit observation as evidence.");
  check(
    (await page
      .getByRole("textbox", { name: "Teacher notes and actual observations" })
      .inputValue()) === "",
    "Observation notes initially blank",
  );
  await page
    .getByRole("button", { name: "Review & Export", exact: true })
    .click();
  check(
    await page
      .getByText(original + " Use an actual visit observation as evidence.", {
        exact: true,
      })
      .isVisible(),
    "Teacher edit persists in review",
  );
  await page
    .getByRole("checkbox", { name: /I have reviewed these teaching/ })
    .check();
  await page.screenshot({
    path: path.join(out, "review-live.png"),
    fullPage: true,
  });
  // Chrome's headless print path uses the same print CSS; no native OS dialog claimed.
  await page.getByRole("button", { name: "Print / Save as PDF" }).click();
  await page.emulateMedia({ media: "print" });
  check(
    !(await page.locator(".site-header").isVisible()),
    "Print stylesheet hides navigation",
  );
  check(
    !(await page
      .getByRole("button", { name: "Copy Inquiry Draft" })
      .isVisible()),
    "Print stylesheet hides export controls",
  );
  check(
    await page.locator(".print-heading").isVisible(),
    "Print heading appears",
  );
  await page.pdf({
    path: path.join(out, "learning-plan-live.pdf"),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.screenshot({
    path: path.join(out, "print-layout-live.png"),
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  const inquiry = page.getByRole("textbox", { name: "Museum inquiry draft" });
  await inquiry.fill(
    (await inquiry.inputValue()) + "\nPlease advise on the next inquiry steps.",
  );
  await page.getByRole("button", { name: "Copy Inquiry Draft" }).click();
  await page.getByText("Draft copied. Nothing has been sent.").waitFor();
  check(
    (await page.evaluate(() => navigator.clipboard.readText())).includes(
      "Please advise on the next inquiry steps.",
    ),
    "Edited inquiry copied locally",
  );
  await page
    .locator(".inquiry")
    .screenshot({ path: path.join(out, "inquiry-live.png") });
  await page.getByText("Planning activity", { exact: true }).click();
  await page.getByRole("button", { name: "Load latest activity" }).click();
  await page
    .getByText(/Learning Journey Designer · Output checks passed/)
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(out, "review-mobile-live.png"),
    fullPage: true,
  });
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Mobile view has no document overflow",
  );
  check(
    await page.evaluate(
      () => localStorage.length === 0 && sessionStorage.length === 0,
    ),
    "No capability stored in browser storage",
  );
  check(
    !(await page.content()).includes(advisor.response.workflow_token),
    "Workflow capability absent from DOM",
  );
  check(
    calls.join(",") === "/api/recommend,/api/journey",
    "Exactly two deliberate inference actions; none for editing, comparison, printing or copying",
  );
  for (const record of records) {
    if (record.response.run_id) {
      const response = await page.request.get(
        "http://127.0.0.1:5173/api/runs/" + record.response.run_id,
        { headers: { "X-Workflow-Token": advisor.response.workflow_token } },
      );
      check(response.ok(), "Authenticated actual run trace retrieved");
      record.run_trace = await response.json();
      check(
        record.run_trace.output_validation === "passed",
        "Independent backend output validation passed",
      );
    }
  }
  check(errors.length === 0, "No browser page errors");
  report.status = "passed";
  await writeFile(
    path.join(out, "teacher-edited-content.json"),
    JSON.stringify(
      {
        execution_kind: "browser_edited_real_output",
        program_id: "ewm-catapult",
        edited_objective:
          original + " Use an actual visit observation as evidence.",
        inquiry: await inquiry.inputValue(),
        observations: "",
        note: "Browser walkthrough edits; not measured student outcomes.",
      },
      null,
      2,
    ) + "\n",
  );
} catch (e) {
  report.status = "failed";
  report.failure = String(e.message).replace(/http[^\s]*/g, "[local address]");
  await page.screenshot({
    path: path.join(out, "browser-failure.png"),
    fullPage: true,
  });
} finally {
  await Promise.allSettled(pending);
  report.calls = calls;
  report.records = clean(records);
  await writeFile(
    path.join(out, "browser-live.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        status: report.status,
        checks: report.checks,
        calls,
        errors,
        failure: report.failure,
        usage: records.map((r) => ({
          route: r.route,
          usage: r.run_trace?.usage,
          requests: r.run_trace?.model_request_count,
          latency: r.run_trace?.latency_seconds,
        })),
      },
      null,
      2,
    ),
  );
  await context.close();
}
if (report.status !== "passed") process.exitCode = 1;
