# Museum website visual reference

Inspected **October 23, 2026**, using desktop Chrome at 1440 × 1000. These are observed website styles, **not an official museum brand specification**. The prototype uses selected accents as inspiration and remains independent of the museum.

Official pages inspected directly:

- [Museum homepage](https://www.eliwhitney.org/)
- [School Programs catalog](https://www.eliwhitney.org/workshop/school-programs)
- [Catapult program page](https://www.eliwhitney.org/catapult)

## Method and inspectable evidence

`frontend/scripts/museum-style-audit.mjs` opens each official page in a real browser. It reads `window.getComputedStyle()` for the identified DOM elements, captures opacity, background image, color, border properties, visible dimensions and ancestor surfaces, and inspects matching CSSOM declarations. It also hovers actual links/buttons and reads the resulting computed styles after transitions settle. It never submits museum forms or books anything. This is a one-time design-research script, not a runtime application scraper.

Exact readings, timestamps, selectors, inline styles, ancestor surfaces and matching stylesheet URLs are preserved in [museum-computed-styles.json](../artifacts/stage4_2/museum-computed-styles.json). No screenshot pixel samples were used to claim CSS values. No museum logo, photograph, font or other external asset was added to the application.

## Verified computed styles

All solid fills below had computed opacity `1` and `background-image: none`. Transparent elements are labeled explicitly; their foreground colors do not constitute a background fill.

| Element / locator | Property | Computed value | HEX or interpretation | Official source |
| --- | --- | --- | --- | --- |
| Header, `#header` | `background-color` | `rgb(245, 245, 245)` | `#F5F5F5`, solid | [Home](https://www.eliwhitney.org/) / [catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Main navigation surface, `#dmenu` | `background-color` | `rgb(168, 181, 186)` | `#A8B5BA`, solid blue-gray | [Home](https://www.eliwhitney.org/) / [catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Navigation link, `#dmenu a[href="/visit"]` | `color`; `background-color` | `rgb(35, 38, 36)`; `rgba(0, 0, 0, 0)` | Text `#232624`; transparent over the navigation surface. Same sampled colors on hover. | [Home](https://www.eliwhitney.org/) |
| Book a Program, `.view-filters > button` | `background-color`; `color`; border | `rgb(149, 47, 43)`; `rgb(255, 255, 255)`; `1px solid rgb(149, 47, 43)` | Brick `#952F2B`, white text, matching brick border | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Book a Program, hovered | `background-color`; `color` | `rgb(120, 154, 91)`; `rgb(255, 255, 255)` | Olive `#789A5B`, white text | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Detail booking button, `a[href="/form/school-programs-booking"] button` | Normal / hovered `background-color` | `rgb(149, 47, 43)` / `rgb(120, 154, 91)` | Same brick-to-olive interaction | [Catapult](https://www.eliwhitney.org/catapult) |
| School Programs title surface, `#pTitle` | `background-color` | `rgb(120, 154, 91)` | `#789A5B`, solid; **not a gradient** | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Title text, `#pTitle h1` | `color`; `background-color` | `rgb(255, 255, 255)`; `rgba(0, 0, 0, 0)` | White `#FFFFFF` text over the separate title surface | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Image banner, `#inner-banner-image` | `background-color`; `background-image` | `rgba(0, 0, 0, 0)`; URL image | Visible 1440 × 350 element with a school-program photograph. Inline `background` uses centered `cover`, no-repeat. No single HEX represents the photograph; it was not reused. | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Program card, `.view-content .views-row` | `background-color`; top border | `rgb(238, 243, 245)`; `0px none` | `#EEF3F5`, pale blue-gray; no visible top border in sample | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Program title link, `.views-row .title a` | `color`; `background-color` | `rgb(149, 47, 43)`; `rgba(0, 0, 0, 0)` | Brick `#952F2B` text on the card's pale surface. Sampled colors unchanged on hover. | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Grade 4 badge, `.views-row .key span[class="4"]` | `background-color`; `color` | `rgb(120, 154, 91)`; `rgb(255, 255, 255)` | Olive `#789A5B`, white text | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Grade 2 badge, `.views-row .key span[class="2"]` | `background-color` | `rgb(94, 157, 209)` | `#5E9DD1`, blue; not adopted for eligibility status | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Kindergarten badge, `.views-row .key span[class="K"]` | `background-color` | `rgb(158, 129, 186)` | `#9E81BA`, purple; not adopted | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Filter surface, `.view-filters` | `background-color` | `rgb(168, 181, 186)` | `#A8B5BA`, solid. The contained form itself is transparent. | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Filter text input, `#views-exposed-form-school-programs-new-page-1 input[type="text"]` | Fill; text; top border | `rgb(255, 255, 255)`; `rgb(33, 37, 41)`; `2px solid rgb(149, 47, 43)` | White fill, `#212529` text, brick border | [Catalog](https://www.eliwhitney.org/workshop/school-programs) |
| Homepage event surface, `.events` | `background-color` | `rgb(214, 172, 111)` | `#D6AC6F`, warm ochre | [Home](https://www.eliwhitney.org/) |
| Body, `body` | `background-color`; `color` | `rgba(0, 0, 0, 0)`; `rgb(65, 70, 66)` | Body background is transparent, not a verified white fill; body text `#414642` | [Home](https://www.eliwhitney.org/) / [catalog](https://www.eliwhitney.org/workshop/school-programs) |

## Stylesheet traces and limitations

The official aggregated theme stylesheet `css_me6D-4LhDBy6DQq7C57XEQg11dJsuyzAO-dxQ7ywR9M.css` contains matching `.main-menu`, `.events`, and `.path-workshop.withOutImage .t-outer .pTitle` declarations. Full query-bearing source URLs are recorded in the JSON. The booking button matches `.button, .btn, button` rules in the theme and an inline stylesheet. The program card matches an inline `.view-school-programs-new .views-row` declaration. Grade colors match escaped numeric class selectors in an inline stylesheet. These are matching declarations, not a claim that every part of the cascade was reconstructed.

Chrome blocked CSSOM reads of two cross-origin stylesheets (Bootstrap CDN and Adobe Typekit). Computed styles remained readable. No gradients were observed in the sampled target elements. A photo URL on the banner and transparent nested links must not be flattened to a supposed single “brand color.” The audit describes this desktop rendering on this date; other breakpoints, future site changes and all possible interaction states were not exhaustively audited.

## Application choices

The interface draws visual inspiration from the museum's existing website while maintaining a distinct identity as an independent educational prototype.

- Retain deep green headings `#213D36`, warm page `#F6F5EF`, paper cards `#FFFEF9` and the original compass/diagram assets.
- Use brick `#952F2B` for a fine header rule, the first example accent and a high-contrast focus ring. Primary actions remain deep green `#214F44`.
- Use olive `#789A5B` and blue-gray `#A8B5BA` as restrained decorative example accents. They do not replace semantic eligibility states.
- Use pale `#EEF3F5` for example feedback, mobile comparison surfaces and the After phase.
- Use ochre `#D6AC6F` for the existing workshop illustration; During uses the app-created light tint `#F7EFDF`, and Before retains `#EFF3E8`. Those tints are application choices, not exact museum declarations.
- Use stronger app-specific control borders `#708077`; retain the existing labeled green/amber/red eligibility palettes. The museum's white-on-olive pairing is not copied for app text. Actual app pairings are checked separately in the Stage 4.2 validation report.

No museum logo, image, remote font, booking flow or claim of endorsement is introduced.
