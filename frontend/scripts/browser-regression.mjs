/** Offline visual/accessibility regression: saved responses are REPLAYED, no inference. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(".."),
  out = path.join(root, "artifacts/stage4");
const live = JSON.parse(
  await readFile(path.join(out, "browser-live.json"), "utf8"),
);
const catalog = JSON.parse(
  await readFile(path.join(root, "data/programs.json"), "utf8"),
);
const rec = structuredClone(
  live.records.find((r) => r.route === "/api/recommend").response,
);
rec.workflow_token = "offline-browser-test-only";
const journey = live.records.find((r) => r.route === "/api/journey").response;
const context = await chromium.launchPersistentContext(
  path.join(root, ".runtime/browser-offline"),
  {
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1050 },
  },
);
const page = await context.newPage();
const audits = [],
  checks = [];
let posts = 0;
await page.route("**/api/**", async (route) => {
  const url = new URL(route.request().url());
  if (route.request().method() === "POST") posts++;
  const body =
    url.pathname === "/api/health"
      ? { status: "ok" }
      : url.pathname === "/api/programs"
        ? catalog
        : url.pathname === "/api/recommend"
          ? rec
          : url.pathname === "/api/journey"
            ? journey
            : live.records[1].run_trace;
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
});
async function audit(screen) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  audits.push({
    screen,
    violations: result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
    incomplete: result.incomplete.map((v) => ({
      id: v.id,
      node_count: v.nodes.length,
    })),
  });
}
try {
  await page.goto("http://127.0.0.1:5173");
  await page.getByText("Local service connected").waitFor();
  await audit("intake desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(out, "intake-mobile-offline.png") });
  await audit("intake mobile");
  checks.push({
    name: "intake mobile no horizontal overflow",
    passed: await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page
    .getByRole("button", { name: "Use force & motion example" })
    .click();
  await page.getByRole("checkbox", { name: /I accept the USD/ }).check();
  await page.getByRole("button", { name: "Discover Programs" }).click();
  await page.getByText("Find your class’s next discovery.").waitFor();
  await audit("discovery");
  await page.getByRole("button", { name: /Compare Programs/ }).click();
  await audit("comparison");
  await page
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: "Catapult", exact: true }),
    })
    .getByRole("button", { name: "Select This Program" })
    .click();
  await audit("selection");
  await page.getByRole("button", { name: "Generate Learning Journey" }).click();
  await page.getByText("A journey beyond the workshop").waitFor();
  await audit("editable journey");
  checks.push({name:"editable suggestions fully visible without internal clipping",passed:await page.locator(".phase textarea").evaluateAll(nodes=>nodes.every(n=>n.scrollHeight<=n.clientHeight+3))});
  await page
    .locator(".phase.before")
    .screenshot({ path: path.join(out, "phase-before-offline.png") });
  await page
    .getByRole("button", { name: "Review & Export", exact: true })
    .click();
  await audit("review");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(out, "review-mobile-offline.png") });
  await audit("review mobile");
  checks.push({
    name: "review mobile no horizontal overflow",
    passed: await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: path.join(out, "learning-plan-final-offline.pdf"),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
  checks.push({
    name: "print hides navigation and controls",
    passed:
      !(await page.locator(".sidebar").isVisible()) &&
      !(await page
        .getByRole("button", { name: "Copy Inquiry Draft" })
        .isVisible()),
  });
  checks.push({
    name: "exactly two mocked POSTs; no actual provider access",
    passed: posts === 2,
  });
} finally {
  const report = {
    timestamp: new Date().toISOString(),
    execution_kind: "offline_browser_replay",
    note: "Saved live responses replayed through mocked API routes; not new Portkey inference. Automated accessibility scanning does not establish complete WCAG conformance.",
    audits,
    checks,
  };
  await writeFile(
    path.join(out, "browser-offline.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  await context.close();
}
if (audits.some((a) => a.violations.length) || checks.some((c) => !c.passed))
  process.exitCode = 1;
