/** One-time design audit of public official pages. Not application/runtime scraping. */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pages = [];
const definitions = [
  [
    "https://www.eliwhitney.org/",
    [
      ["Header", "#header"],
      ["Navigation surface", "#dmenu"],
      ["Navigation link", '#dmenu a[href="/visit"]'],
      ["Home event surface", ".events"],
      ["Body", "body"],
    ],
  ],
  [
    "https://www.eliwhitney.org/workshop/school-programs",
    [
      ["Header", "#header"],
      ["Navigation surface", "#dmenu"],
      ["Title banner", "#pTitle"],
      ["Title text", "#pTitle h1"],
      ["Image banner", "#inner-banner-image"],
      ["Book a Program", ".view-filters > button"],
      ["Filter panel", ".view-filters"],
      ["Filter form", "#views-exposed-form-school-programs-new-page-1"],
      [
        "Filter input",
        '#views-exposed-form-school-programs-new-page-1 input[type="text"]',
      ],
      ["Program card", ".view-content .views-row"],
      ["Program title link", ".views-row .title a"],
      ["Kindergarten badge", '.views-row .key span[class="K"]'],
      ["Grade 4 badge", '.views-row .key span[class="4"]'],
      ["Grade 2 badge", '.views-row .key span[class="2"]'],
      ["Body", "body"],
    ],
  ],
  [
    "https://www.eliwhitney.org/catapult",
    [
      [
        "Detail booking button",
        'a[href="/form/school-programs-booking"] button',
      ],
      ["Detail title", "h1"],
      ["Detail grade link", 'a[href$="target_id=344"]'],
    ],
  ],
];
async function read(locator) {
  return locator.evaluate((el) => {
    const properties = [
      "color",
      "background-color",
      "background-image",
      "opacity",
      "border-top-color",
      "border-top-width",
      "border-top-style",
      "box-shadow",
    ];
    const computed = Object.fromEntries(
      properties.map((p) => [p, getComputedStyle(el).getPropertyValue(p)]),
    );
    const ancestry = [];
    let parent = el.parentElement;
    while (parent) {
      const s = getComputedStyle(parent);
      if (
        s.backgroundColor !== "rgba(0, 0, 0, 0)" ||
        s.backgroundImage !== "none"
      )
        ancestry.push({
          tag: parent.tagName,
          id: parent.id,
          class: parent.className,
          color: s.backgroundColor,
          image: s.backgroundImage,
          opacity: s.opacity,
        });
      parent = parent.parentElement;
    }
    const declarations = [],
      blockedStylesheets = [];
    function walk(rules, href, condition = "") {
      for (const rule of rules) {
        if (rule.selectorText) {
          try {
            if (el.matches(rule.selectorText)) {
              const values = Object.fromEntries(
                [...properties, "background", "border", "border-color"]
                  .filter((p) => rule.style.getPropertyValue(p))
                  .map((p) => [p, rule.style.getPropertyValue(p)]),
              );
              if (Object.keys(values).length)
                declarations.push({
                  href,
                  selector: rule.selectorText,
                  condition,
                  values,
                });
            }
          } catch {}
        } else if (rule.cssRules)
          walk(rule.cssRules, href, rule.conditionText || condition);
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        walk(sheet.cssRules, sheet.href || "inline stylesheet");
      } catch {
        blockedStylesheets.push(sheet.href);
      }
    }
    return {
      layout: {
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
      },
      computed,
      ancestry,
      inlineStyle: el.getAttribute("style"),
      declarations,
      blockedStylesheets,
      pseudoBefore: {
        background: getComputedStyle(el, "::before").background,
        content: getComputedStyle(el, "::before").content,
      },
      pseudoAfter: {
        background: getComputedStyle(el, "::after").background,
        content: getComputedStyle(el, "::after").content,
      },
    };
  });
}
for (const [url, elements] of definitions) {
  const record = { url, inspected_at: new Date().toISOString(), elements: [] };
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page
      .waitForLoadState("networkidle", { timeout: 12000 })
      .catch(() => {});
    for (const [label, selector] of elements) {
      const locator = page.locator(selector).first();
      if (!(await locator.count())) {
        record.elements.push({ label, selector, error: "No matching element" });
        continue;
      }
      await page.mouse.move(0, 0);
      const normal = await read(locator);
      let hover = null;
      if (/button|link/i.test(label) || label === "Book a Program") {
        await locator.hover();
        await page.waitForTimeout(350);
        hover = await read(locator);
      }
      record.elements.push({ label, selector, normal, hover });
    }
  } catch (e) {
    record.error = e.message.slice(0, 200);
  }
  pages.push(record);
}
await writeFile(
  "../artifacts/stage4_2/museum-computed-styles.json",
  JSON.stringify(
    {
      method:
        "Chrome DOM getComputedStyle; CSSOM matching declarations, not screenshot sampling",
      viewport: { width: 1440, height: 1000 },
      pages,
    },
    null,
    2,
  ) + "\n",
);
await browser.close();
console.log(
  JSON.stringify(
    pages.map((p) => ({
      url: p.url,
      error: p.error,
      elements: p.elements.map((e) => ({
        label: e.label,
        selector: e.selector,
        error: e.error,
        normal: e.normal?.computed,
        hover: e.hover?.computed,
        matchingDeclarations: e.normal?.declarations.length,
        blocked: e.normal?.blockedStylesheets,
      })),
    })),
    null,
    2,
  ),
);
