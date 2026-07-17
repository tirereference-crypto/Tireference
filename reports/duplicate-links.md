# Tire Reference — Duplicate Internal-Link Audit

_Generated 2026-07-17T14:22:43.086Z from the production build (`dist/client`, read-only audit)._

## Summary

| Metric | Value |
|---|---|
| Total pages scanned | 174 |
| Pages with errors | 0 |
| Pages with warnings | 55 |
| Total accidental-duplicate findings (errors) | 0 |
| Total broken links | 0 |
| Total empty / `#` links | 0 |
| Total nested-anchor problems | 0 |

### Findings by type

| Severity | Finding type | Count |
|---|---|---|
| WARNING | cross-section-duplicate | 212 |

- **card-duplicate** — an image/title/button/list-item inside one card all link to the same destination.
- **related-list-duplicate** — a related/product/upgrade list repeats the same destination (often several catalog items that resolve to the same tire-size or comparison route).
- **same-section-duplicate** — the same destination is linked more than once inside one labelled section.
- **cross-section-duplicate** (warning) — the same destination is reachable from two or more different content sections.

### How links were normalized

- Trailing slash, `index.html`, absolute vs relative, and encoded/decoded paths collapsed to one destination.
- `utm_*`, `ref`, `fbclid`, `gclid`, and similar tracking params stripped before comparison.
- Hash fragments removed for page-destination comparison; pure in-page `#anchor` links reported separately as same-page anchor navigation.
- Query-only differences treated as the same page destination, except explicitly allowlisted calculator preset groups whose distinct `from`/`to` state is the section’s purpose.
- Header, footer, breadcrumb, and single contextual links are treated as distinct navigation purposes (allowed).

### Classification model

- **ERROR (accidental duplicate):** nested anchors; multiple anchors to one destination inside a single card/adjacent block; the same destination repeated inside one labelled section; duplicate footer/breadcrumb entries; empty/`#`/broken links.
- **WARNING (potentially unnecessary):** the same destination reached from two different content sections, or repeated across the main content while spread apart.
- **ALLOWED:** the same route appearing once each in header, footer, breadcrumb, or as one contextual link; responsive desktop/mobile nav variants (only one visible per viewport).

## Most frequently duplicated destinations

“Duplicated on N pages” counts pages where the destination appears 2+ times (includes allowed global-nav repetition such as header+footer).

| Destination | Duplicated on N pages |
|---|---|
| `/` | 174 |
| `/tire-size/275-70r18/` | 174 |
| `/tire-size/285-70r17/` | 174 |
| `/tire-size/285-75r16/` | 174 |
| `/tire-size/265-70r17/` | 174 |
| `/calculators/tire-size-calculator/` | 174 |
| `/tire-sizes/` | 174 |
| `/calculators/tire-comparison-calculator/` | 174 |
| `/calculators/tire-diameter-calculator/` | 174 |
| `/calculators/wheel-offset-calculator/` | 174 |
| `/calculators/speedometer-error-calculator/` | 174 |
| `/calculators/gear-ratio-calculator/` | 174 |
| `/about/` | 174 |
| `/contact/` | 174 |
| `/report-an-issue/` | 126 |
| `/data-standards/` | 124 |
| `/tire-size/225-50r17/` | 8 |
| `/tire-size/235-45r18/` | 8 |
| `/tire-size/275-65r18/` | 6 |
| `/privacy-policy/` | 5 |
| `/tire-size/255-35r19/` | 5 |
| `/tire-size/245-45r18/` | 5 |
| `/tire-size/285-55r20/` | 5 |
| `/tire-size/285-65r20/` | 5 |
| `/tire-size/305-70r18/` | 5 |

## Global navigation (allowed, site-wide)

Every page renders the shared header (desktop nav + mobile panel + search input ×3 responsive variants), footer, and breadcrumbs. These produce the high site-wide duplicate counts above and are **allowed**. Below, per-page sections list only ERROR and WARNING findings plus same-page anchors; allowed nav duplicates are counted but not itemized.

## Pages with errors

## Pages with warnings only

### `/about/`
*About Tire Reference* · Warnings: 3 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/contact/` (3×)
  - same destination appears in 3 different content sections
  - “contact page” — _main_ · section[about-who-title] · viewport: both/unknown
    - DOM: `div.info-shell > section.info-section > div.info-section__body > p > a`
  - “Contact” — _main_ · section[about-corrections-title] · viewport: both/unknown
    - DOM: `section.info-section > div.info-section__body > ul > li > a`
  - “Get in touch” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `main.flex-1 > div.info-page > div.info-shell > p.info-closing > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/data-standards/` (2×)
  - same destination appears in 2 different content sections
  - “data and calculation standards” — _main_ · section[about-tools-title] · viewport: both/unknown
    - DOM: `div.info-shell > section.info-section > div.info-section__body > p > a`
  - “Data & Calculation Standards” — _main_ · section[about-corrections-title] · viewport: both/unknown
    - DOM: `section.info-section > div.info-section__body > ul > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/report-an-issue/` (2×)
  - same destination appears in 2 different content sections
  - “Report a calculation or data issue” — _main_ · section[about-corrections-title] · viewport: both/unknown
    - DOM: `section.info-section > div.info-section__body > ul > li > a`
  - “report an issue” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `main.flex-1 > div.info-page > div.info-shell > p.info-closing > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/calculators/tire-diameter-calculator/`
*Tire Diameter Calculator \| Tire Reference* · Warnings: 4 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (3×)
  - same destination appears in 3 different content sections
  - “View Tire Guide” — _main_ · section[Closest indexed tire size] · viewport: both/unknown
    - DOM: `div.dia-results-anchor > section.dia-closest > div.dia-closest__main > div.dia-closest__actions > a.dia-closest__guide-link`
  - “View Tire Models” — _main_ · section[Top matching tire sizes] · viewport: both/unknown
    - DOM: `section.dia-match-cards > div.dia-match-cards__row > article.dia-match-card > div.dia-match-card__footer > a.dia-match-card__link`
  - “View all 24 unique tire models” — _main_ · section[Popular tires available in 275/70R18] · viewport: both/unknown
    - DOM: `div.dia-results-anchor > div > section.tsc-popular > div.tsc-popular__header > a.tsc-popular__view-all`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-size-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Use 275/70R18” — _main_ · section[Closest indexed tire size] · viewport: both/unknown
    - DOM: `div.dia-results-anchor > section.dia-closest > div.dia-closest__main > div.dia-closest__actions > a.dia-btn`
  - “Tire Size CalculatorConvert a size code into diameter, width, and revs/mile.→” — _main_ · section[Related calculators] · viewport: both/unknown
    - DOM: `div.cmp-page > div.cmp-shell > section.dia-related > div.dia-related__grid > a.dia-related__card`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare With Another Size” — _main_ · section[Closest indexed tire size] · viewport: both/unknown
    - DOM: `div.dia-results-anchor > section.dia-closest > div.dia-closest__main > div.dia-closest__actions > a.dia-btn`
  - “Tire Comparison CalculatorCompare two sizes for diameter change and fitment.→” — _main_ · section[Related calculators] · viewport: both/unknown
    - DOM: `div.cmp-page > div.cmp-shell > section.dia-related > div.dia-related__grid > a.dia-related__card`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/data-standards/` (2×)
  - same destination appears in 2 different content sections
  - “Data standards” — _main_ · section[Popular tires available in 275/70R18] · viewport: both/unknown
    - DOM: `div.dia-results-anchor > div > section.tsc-popular > p.tsc-popular__provenance > a`
  - “Data & Calculation Standards” — _main_ · section[Trust and calculation source] · viewport: both/unknown
    - DOM: `div.cmp-shell > section.dia-trust > ul.dia-trust__list > li.dia-trust__item > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/calculators/tire-size-calculator/`
*Tire Size Calculator – Specs & Diameter \| Tire Reference* · Warnings: 3 · Same-page anchors: 1

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “View Tire Guide” — _main_ · section[Next steps] · viewport: both/unknown
    - DOM: `div.tsc-actions__grid > article.tsc-action-card > div.tsc-action-card__body > div.tsc-action-card__text > a.tsc-action-card__cta`
  - “View all 24 unique tire models” — _main_ · section[Popular tires available in 275/70R18] · viewport: both/unknown
    - DOM: `div.tsc-page > div.tsc-stack > section.tsc-popular > div.tsc-popular__header > a.tsc-popular__view-all`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (3×)
  - same destination appears in 3 different content sections
  - “Compare Tire Sizes” — _main_ · section[Next steps] · viewport: both/unknown
    - DOM: `div.tsc-actions__grid > article.tsc-action-card > div.tsc-action-card__body > div.tsc-action-card__text > a.tsc-action-card__cta`
  - “Tire Comparison CalculatorCompare two sizes side by side with diameter, width, sidewall, and speedometer effect.Open tool” — _main_ · section[Related calculators and tools] · viewport: both/unknown
    - DOM: `astro > div.tsc-page > section.tsc-tools > div.tsc-tools__grid > a.tsc-tools__card`
  - “Compare This Size” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `astro > div.tsc-page > div.calc-sticky-bar > div.tsc-sticky-bar__inner > a.tsc-sticky-bar__cta`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/data-standards/` (2×)
  - same destination appears in 2 different content sections
  - “Learn about Tire Reference&#x27;s data and calculation standards” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `div.tsc-notice-stack > details.tsc-method-disclosure > div.tsc-method-disclosure__body > p.tsc-method-disclosure__link-row > a.tsc-method-disclosure__link`
  - “Data and Calculation Standards” — _main_ · section[Popular tires available in 275/70R18] · viewport: both/unknown
    - DOM: `div.tsc-page > div.tsc-stack > section.tsc-popular > p.tsc-popular__provenance > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-35-r19-vs-235-40-r18/`
*255/35R19 vs 235/40R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup235/45R18Diameter difference+1.15%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-35-r19-vs-235-45-r18/`
*255/35R19 vs 235/45R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup235/45R18Diameter difference+1.15%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-35-r19-vs-245-40-r18/`
*255/35R19 vs 245/40R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup235/45R18Diameter difference+1.15%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-35-r19-vs-245-45-r18/`
*255/35R19 vs 245/45R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup235/45R18Diameter difference+1.15%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-55-r19-vs-235-55-r18/`
*255/55R19 vs 235/55R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup245/60R18Diameter difference-1.56%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-55-r19-vs-245-60-r18/`
*255/55R19 vs 245/60R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup245/60R18Diameter difference-1.56%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-55-r19-vs-265-60-r18/`
*255/55R19 vs 265/60R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup245/60R18Diameter difference-1.56%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-55-r19-vs-265-65-r18/`
*255/55R19 vs 265/65R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup245/60R18Diameter difference-1.56%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-55-r19-vs-275-55-r20/`
*255/55R19 vs 275/55R20 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup245/60R18Diameter difference-1.56%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-55-r19-vs-275-65-r18/`
*255/55R19 vs 275/65R18 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup245/60R18Diameter difference-1.56%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/compare/255-55-r19-vs-285-55-r20/`
*255/55R19 vs 285/55R20 Tire Size Comparison \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Different-wheel setup245/60R18Diameter difference-1.56%18 wheelDifferent WheelCompare →” — _main_ · section[Alternative comparison paths] · viewport: both/unknown
    - DOM: `div.cmp-below-dashboard__left > section.cmp-card > div.cmp-alt-paths__wrap > div.cmp-alt-paths__row > a.cmp-alt-paths__card`
  - “View all tire comparisons” — _main_ · section[Popular comparison pairs] · viewport: both/unknown
    - DOM: `div.cmp-shell > div.cmp-fullwidth > section.cmp-lower-section > p.cmp-popular-pairs__footer > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/contact/`
*Contact Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/report-an-issue/` (2×)
  - same destination linked 2x within main content
  - “Report an Issue” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `div.info-contact-layout > div.info-contact-meta > div.info-section > p.info-note > a`
  - “Report an Issue” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `div.info-contact-layout > div.info-form-panel > form.info-form > p.info-form__privacy > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/disclaimer/`
*Disclaimer \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/privacy-policy/` (2×)
  - same destination linked 2x within main content
  - “Privacy Policy” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `div.info-page > div.info-shell > article.info-legal > p.legal-dormant > a`
  - “Privacy Policy” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `div.info-page > div.info-shell > article.info-legal > p > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/`
*Tire Reference \| Tire Size Calculators, Wheel Fitment & Comparison Tools* · Warnings: 7 · Same-page anchors: 1

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “Off-Road Trails, rocks and rough terrain” — _main_ · section[home-categories-title] · viewport: both/unknown
    - DOM: `div.home-sections > section.home-section > div.home-categories__panel > div.home-categories__grid > a.home-categories__card`
  - “275/70R18” — _main_ · section[home-popular-sizes-title] · viewport: both/unknown
    - DOM: `div.home-popular__grid > div.home-popular__col > ul.home-popular__chips > li > a.home-popular__chip`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-75r16/` (2×)
  - same destination appears in 2 different content sections
  - “Truck Towing, hauling and work” — _main_ · section[home-categories-title] · viewport: both/unknown
    - DOM: `div.home-sections > section.home-section > div.home-categories__panel > div.home-categories__grid > a.home-categories__card`
  - “285/75R16” — _main_ · section[home-popular-sizes-title] · viewport: both/unknown
    - DOM: `div.home-popular__grid > div.home-popular__col > ul.home-popular__chips > li > a.home-popular__chip`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-size-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Tire Size Calculator Convert tire size into diameter, width, and revs per mile.” — _main_ · section[calculators] · viewport: both/unknown
    - DOM: `div.home-hero-stack > section.home-quick-actions > div.home-quick-actions__shell > div.home-quick-actions__grid > a.home-quick-actions__card`
  - “Daily Driving Choose practical sizes with confidence” — _main_ · section[home-explore-title] · viewport: both/unknown
    - DOM: `div.home-explore__panel > div.home-explore__grid > div.home-explore__use-cases > div.home-explore__cards > a.home-explore__card`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (4×)
  - same destination appears in 4 different content sections
  - “Compare Tire Sizes” — _main_ · section[home-hero-title] · viewport: both/unknown
    - DOM: `div.home-hero-stack > section.home-hero > div.home-hero__cta-band > div.home-hero__cta-row > a.home-hero__cta`
  - “Tire Size Comparison Compare two sizes for diameter, clearance, and speedometer change.” — _main_ · section[calculators] · viewport: both/unknown
    - DOM: `div.home-hero-stack > section.home-quick-actions > div.home-quick-actions__shell > div.home-quick-actions__grid > a.home-quick-actions__card`
  - “Compare Tire Sizes” — _main_ · section[home-featured-title] · viewport: both/unknown
    - DOM: `section.home-section > div.home-featured__panel > div.home-featured__grid > div.home-featured__copy > a.home-featured__cta`
  - “Lift & Level Plan larger tire and wheel changes” — _main_ · section[home-explore-title] · viewport: both/unknown
    - DOM: `div.home-explore__panel > div.home-explore__grid > div.home-explore__use-cases > div.home-explore__cards > a.home-explore__card`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/speedometer-error-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Speedometer Error Calculator See how tire-size changes affect indicated speed and odometer accuracy.” — _main_ · section[calculators] · viewport: both/unknown
    - DOM: `div.home-hero-stack > section.home-quick-actions > div.home-quick-actions__shell > div.home-quick-actions__grid > a.home-quick-actions__card`
  - “Speed & Performance Compare diameter and speedometer effects” — _main_ · section[home-explore-title] · viewport: both/unknown
    - DOM: `div.home-explore__panel > div.home-explore__grid > div.home-explore__use-cases > div.home-explore__cards > a.home-explore__card`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/gear-ratio-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Gear Ratio Calculator Restore effective gearing after a tire size change.” — _main_ · section[calculators] · viewport: both/unknown
    - DOM: `div.home-hero-stack > section.home-quick-actions > div.home-quick-actions__shell > div.home-quick-actions__grid > a.home-quick-actions__card`
  - “Towing & Hauling Understand gearing and tire impact” — _main_ · section[home-explore-title] · viewport: both/unknown
    - DOM: `div.home-explore__panel > div.home-explore__grid > div.home-explore__use-cases > div.home-explore__cards > a.home-explore__card`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-45r17/` (2×)
  - same destination appears in 2 different content sections
  - “Performance Grip, precision and speed” — _main_ · section[home-categories-title] · viewport: both/unknown
    - DOM: `div.home-sections > section.home-section > div.home-categories__panel > div.home-categories__grid > a.home-categories__card`
  - “225/45R17” — _main_ · section[home-popular-sizes-title] · viewport: both/unknown
    - DOM: `div.home-popular__grid > div.home-popular__col > ul.home-popular__chips > li > a.home-popular__chip`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/privacy-policy/`
*Privacy Policy \| Tire Reference* · Warnings: 1 · Same-page anchors: 0

- **WARNING — cross-section-duplicate** → `/contact/` (2×)
  - same destination linked 2x within main content
  - “contact page” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `div.info-page > div.info-shell > article.info-legal > p > a`
  - “contact page” — _main_ · main[flex-1] · viewport: both/unknown
    - DOM: `div.info-page > div.info-shell > article.info-legal > p > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/185-65r15/`
*185/65R15 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 4 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/195-60r15/` (2×)
  - same destination appears in 2 different content sections
  - “195/60R15 -1.05%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “195/60R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-55r16/` (3×)
  - same destination appears in 3 different content sections
  - “205/55R16 +1.67%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/55R16 +1.67%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/55R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/195-65r15/` (3×)
  - same destination appears in 3 different content sections
  - “195/65R15 +2.09%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “195/65R15 +2.09%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “195/65R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/195-60r15/`
*195/60R15 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 4 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/185-65r15/` (3×)
  - same destination appears in 3 different content sections
  - “185/65R15 +1.06%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “185/65R15 +1.06%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “185/65R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-55r16/` (3×)
  - same destination appears in 3 different content sections
  - “205/55R16 +2.75%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/55R16 +2.75%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/55R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/195-65r15/` (2×)
  - same destination appears in 2 different content sections
  - “195/65R15 +3.17%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “195/65R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/195-65r15/`
*195/65R15 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 4 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-55r16/` (2×)
  - same destination appears in 2 different content sections
  - “205/55R16 -0.41%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/55R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/185-65r15/` (2×)
  - same destination appears in 2 different content sections
  - “185/65R15 -2.05%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “185/65R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-60r16/` (3×)
  - same destination appears in 3 different content sections
  - “205/60R16 +2.82%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/60R16 +2.82%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/60R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/205-55r16/`
*205/55R16 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-45r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/45R17 +0.38%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/45R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/195-65r15/` (2×)
  - same destination appears in 2 different content sections
  - “195/65R15 +0.41%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “195/65R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/185-65r15/` (2×)
  - same destination appears in 2 different content sections
  - “185/65R15 -1.65%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “185/65R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/195-60r15/` (2×)
  - same destination appears in 2 different content sections
  - “195/60R15 -2.67%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “195/60R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-60r16/` (2×)
  - same destination appears in 2 different content sections
  - “205/60R16 +3.24%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/60R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/205-60r16/`
*205/60R16 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (3×)
  - same destination appears in 3 different content sections
  - “225/50R17 +0.67%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17 +0.67%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/215-60r16/` (3×)
  - same destination appears in 3 different content sections
  - “215/60R16 +1.84%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/60R16 +1.84%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/60R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/215-55r17/` (3×)
  - same destination appears in 3 different content sections
  - “215/55R17 +2.44%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/55R17 +2.44%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/55R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/195-65r15/` (2×)
  - same destination appears in 2 different content sections
  - “195/65R15 -2.74%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “195/65R15” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/215-55r17/`
*215/55R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/45R18 +0.06%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/215-60r16/` (2×)
  - same destination appears in 2 different content sections
  - “215/60R16 -0.58%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/60R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-55r17/` (3×)
  - same destination appears in 3 different content sections
  - “225/55R17 +1.65%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/55R17 +1.65%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/55R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/50R17 -1.72%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-60r16/` (2×)
  - same destination appears in 2 different content sections
  - “205/60R16 -2.38%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/60R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/215-60r16/`
*215/60R16 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/215-55r17/` (3×)
  - same destination appears in 3 different content sections
  - “215/55R17 +0.59%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/55R17 +0.59%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/55R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (3×)
  - same destination appears in 3 different content sections
  - “235/45R18 +0.65%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18 +0.65%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18 +0.6%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/50R17 -1.14%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-60r16/` (2×)
  - same destination appears in 2 different content sections
  - “205/60R16 -1.81%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/60R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-55r17/` (3×)
  - same destination appears in 3 different content sections
  - “225/55R17 +2.24%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/55R17 +2.24%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/55R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/225-45r17/`
*225/45R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/205-55r16/` (2×)
  - same destination appears in 2 different content sections
  - “205/55R16 -0.38%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “205/55R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-40r18/` (3×)
  - same destination appears in 3 different content sections
  - “235/40R18 +1.72%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/40R18 +1.72%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-40r18/` (3×)
  - same destination appears in 3 different content sections
  - “245/40R18 +2.98%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/40R18 +2.98%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/50R17 +3.55%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/225-50r17/`
*225/50R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 7 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-40r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/40R18 -0.55%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-35r19/` (3×)
  - same destination appears in 3 different content sections
  - “255/35R19 +0.65%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19 +0.65%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/215-55r17/` (3×)
  - same destination appears in 3 different content sections
  - “215/55R17 +1.75%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/55R17 +1.75%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/55R17 +1.8%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-40r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/40R18 -1.77%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/45R18 +1.81%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/45R18 +3.18%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/45R18 +3.2%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/225-55r17/`
*225/55R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/45R18 -0.24%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/45R18 -1.56%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/215-55r17/` (2×)
  - same destination appears in 2 different content sections
  - “215/55R17 -1.62%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/55R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/215-60r16/` (2×)
  - same destination appears in 2 different content sections
  - “215/60R16 -2.19%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “215/60R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/225-65r17/`
*225/65R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-55r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/55R18 -1.19%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/55R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-65r17/` (3×)
  - same destination appears in 3 different content sections
  - “235/65R17 +1.79%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/65R17 +1.79%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/65R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-60r18/` (3×)
  - same destination appears in 3 different content sections
  - “235/60R18 +2.06%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/60R18 +2.06%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-60r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/60R18 +3.71%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/235-40r18/`
*235/40R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-40r18/` (3×)
  - same destination appears in 3 different content sections
  - “245/40R18 +1.24%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/40R18 +1.24%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-45r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/45R17 -1.69%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/45R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/50R17 +1.80%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-35r19/` (3×)
  - same destination appears in 3 different content sections
  - “255/35R19 +2.46%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19 +2.46%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/45R18 +3.64%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/235-45r18/`
*235/45R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 4 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-35r19/` (2×)
  - same destination appears in 2 different content sections
  - “255/35R19 -1.14%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-45r18/` (3×)
  - same destination appears in 3 different content sections
  - “245/45R18 +1.35%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/45R18 +1.35%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/50R17 -1.78%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/235-55r18/`
*235/55R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 3 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-65r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/65R17 +1.20%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/65R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-60r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/60R18 +3.28%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/235-60r18/`
*235/60R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-65r17/` (2×)
  - same destination appears in 2 different content sections
  - “235/65R17 -0.26%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/65R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-60r18/` (3×)
  - same destination appears in 3 different content sections
  - “245/60R18 +1.62%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/60R18 +1.62%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-65r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/65R17 -2.02%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/65R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-55r19/` (2×)
  - same destination appears in 2 different content sections
  - “255/55R19 +3.23%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/55R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/235-65r17/`
*235/65R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-60r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/60R18 +0.26%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-65r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/65R17 -1.76%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/65R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-60r18/` (3×)
  - same destination appears in 3 different content sections
  - “245/60R18 +1.89%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/60R18 +1.89%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-55r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/55R18 -2.93%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/55R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-55r19/` (2×)
  - same destination appears in 2 different content sections
  - “255/55R19 +3.50%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/55R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/245-40r18/`
*245/40R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/50R17 +0.55%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-35r19/` (3×)
  - same destination appears in 3 different content sections
  - “255/35R19 +1.21%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19 +1.21%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-40r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/40R18 -1.22%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (3×)
  - same destination appears in 3 different content sections
  - “235/45R18 +2.37%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18 +2.37%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/45R18 +3.75%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/245-45r18/`
*245/45R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 4 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-55r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/55R17 +0.24%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/55R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/45R18 -1.33%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-35r19/` (2×)
  - same destination appears in 2 different content sections
  - “255/35R19 -2.45%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/35R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/245-60r18/`
*245/60R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-55r19/` (3×)
  - same destination appears in 3 different content sections
  - “255/55R19 +1.58%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/55R19 +1.58%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/55R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-60r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/60R18 -1.60%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-65r17/` (2×)
  - same destination appears in 2 different content sections
  - “235/65R17 -1.85%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/65R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-60r18/` (2×)
  - same destination appears in 2 different content sections
  - “265/60R18 +3.19%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/255-35r19/`
*255/35R19 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/225-50r17/` (2×)
  - same destination appears in 2 different content sections
  - “225/50R17 -0.65%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “225/50R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/45R18 +1.15%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-40r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/40R18 -1.19%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/235-40r18/` (2×)
  - same destination appears in 2 different content sections
  - “235/40R18 -2.41%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “235/40R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-45r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/45R18 +2.51%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/45R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/255-55r19/`
*255/55R19 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 3 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/245-60r18/` (2×)
  - same destination appears in 2 different content sections
  - “245/60R18 -1.56%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “245/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-60r18/` (2×)
  - same destination appears in 2 different content sections
  - “265/60R18 +1.59%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/60R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/265-60r18/`
*265/60R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 2 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/255-55r19/` (2×)
  - same destination appears in 2 different content sections
  - “255/55R19 -1.56%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “255/55R19” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/265-65r18/`
*265/65R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/265-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “265/70R17 +0.14%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/lt265-75r16/` (2×)
  - same destination appears in 2 different content sections
  - “LT265/75R16 +0.27%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “LT265/75R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-55r20/` (3×)
  - same destination appears in 3 different content sections
  - “275/55R20 +1.10%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/55R20 +1.10%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-65r18/` (3×)
  - same destination appears in 3 different content sections
  - “275/65R18 +1.62%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18 +1.62%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/265-70r17/`
*265/70R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 7 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/70R18 +4.91%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18 +4.9%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “285/70R17 +3.49%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-75r16/` (2×)
  - same destination appears in 2 different content sections
  - “285/75R16 +3.87%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/75R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-65r18/` (2×)
  - same destination appears in 2 different content sections
  - “265/65R18 -0.14%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/lt265-75r16/` (2×)
  - same destination appears in 2 different content sections
  - “LT265/75R16 +0.14%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “LT265/75R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-65r18/` (3×)
  - same destination appears in 3 different content sections
  - “275/65R18 +1.48%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18 +1.48%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/275-55r20/`
*275/55R20 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 4 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-65r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/65R18 +0.52%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-65r18/` (2×)
  - same destination appears in 2 different content sections
  - “265/65R18 -1.09%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-55r20/` (3×)
  - same destination appears in 3 different content sections
  - “285/55R20 +1.36%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/55R20 +1.36%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/275-60r20/`
*275/60R20 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/70R18 +0.50%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “305/55R20 +0.66%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/55R20 -1.97%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-65r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/65R20 +4.83%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/65R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/275-65r18/`
*275/65R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/285-70r17/` (3×)
  - same destination appears in 3 different content sections
  - “285/70R17 +1.98%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/70R17 +1.98%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “265/70R17 -1.46%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “275/55R20 -0.52%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/55R20 +0.83%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-65r18/` (2×)
  - same destination appears in 2 different content sections
  - “265/65R18 -1.60%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/275-70r18/`
*275/70R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 9 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/285-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “285/70R17 -1.35%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-75r16/` (2×)
  - same destination appears in 2 different content sections
  - “285/75R16 -0.99%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/75R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “305/55R20 +0.15%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-60r20/` (2×)
  - same destination appears in 2 different content sections
  - “275/60R20 -0.50%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/60R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/55R20 -2.46%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/315-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “315/70R17 +3.63%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “315/70R17 +3.6%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-65r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/65R20 +4.31%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/65R20 +4.3%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “305/70R18 +4.99%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/70R18 +5.0%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/285-55r20/`
*285/55R20 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 7 · Same-page anchors: 7

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/70R18 +2.52%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-65r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/65R18 -0.83%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “275/55R20 -1.34%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-60r20/` (3×)
  - same destination appears in 3 different content sections
  - “275/60R20 +2.01%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/60R20 +2.01%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/60R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-55r20/` (3×)
  - same destination appears in 3 different content sections
  - “305/55R20 +2.68%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/55R20 +2.68%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-65r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/65R20 +6.94%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/65R20 +6.9%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/285-65r20/`
*285/65R20 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 2 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “305/70R18 +0.65%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/70R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/285-70r17/`
*285/70R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 6 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (3×)
  - same destination appears in 3 different content sections
  - “275/70R18 +1.37%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18 +1.37%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-75r16/` (2×)
  - same destination appears in 2 different content sections
  - “285/75R16 +0.37%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/75R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-65r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/65R18 -1.94%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/315-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “315/70R17 +5.06%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “315/70R17 +5.1%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “305/70R18 +6.43%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/70R18 +6.4%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/285-75r16/`
*285/75R16 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/70R18 +1.00%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “285/70R17 -0.37%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/315-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “315/70R17 +4.66%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “315/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “305/70R18 +6.03%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/70R18 +6.0%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/295-35r21/`
*295/35R21 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 1 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/305-55r20/`
*305/55R20 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 5 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/70R18 -0.15%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-60r20/` (2×)
  - same destination appears in 2 different content sections
  - “275/60R20 -0.65%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/60R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-55r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/55R20 -2.61%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/55R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-65r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/65R20 +4.15%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/65R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/305-70r18/`
*305/70R18 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 3 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-65r20/` (2×)
  - same destination appears in 2 different content sections
  - “285/65R20 -0.64%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/65R20” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/315-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “315/70R17 -1.29%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “315/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/315-70r17/`
*315/70R17 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 2 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/305-70r18/` (3×)
  - same destination appears in 3 different content sections
  - “305/70R18 +1.31%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/70R18 +1.31%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “305/70R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

### `/tire-size/lt265-75r16/`
*LT265/75R16 Tire Size — Diameter, Specs & Fitment \| Tire Reference* · Warnings: 7 · Same-page anchors: 8

- **WARNING — cross-section-duplicate** → `/tire-size/275-70r18/` (2×)
  - same destination appears in 2 different content sections
  - “275/70R18 +4.76%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/70R18 +4.8%” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “285/70R17 +3.35%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/285-75r16/` (2×)
  - same destination appears in 2 different content sections
  - “285/75R16 +3.73%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “285/75R16” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-70r17/` (2×)
  - same destination appears in 2 different content sections
  - “265/70R17 -0.14%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/70R17” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/calculators/tire-comparison-calculator/` (2×)
  - same destination appears in 2 different content sections
  - “Compare this size” — _main_ · section[closing-heading] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-closing > div.guide-closing__actions > a.guide-btn`
  - “Start Comparison” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-275__layout > aside.guide-275__sidebar > div.guide-sidebar-rail > div.guide-card > a.guide-btn`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/265-65r18/` (2×)
  - same destination appears in 2 different content sections
  - “265/65R18 -0.27%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “265/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.
- **WARNING — cross-section-duplicate** → `/tire-size/275-65r18/` (3×)
  - same destination appears in 3 different content sections
  - “275/65R18 +1.34%” — _main_ · section[equivalent-sizes] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18 +1.34%” — _main_ · section[popular-upgrades] · viewport: both/unknown
    - DOM: `div.guide-275__layout > div.guide-275__main > section.guide-card > div.guide-chips > a.guide-chip`
  - “275/65R18” — _sidebar_ · aside[guide-275__sidebar] · viewport: both/unknown
    - DOM: `div.guide-sidebar-rail > div.guide-card > ul.guide-side-links > li > a`
  - Recommended: Review whether both contextual links are needed. Usually acceptable, but consider consolidating if they sit close together or serve the same intent.

## Same-page anchor navigation (reported separately, not failures)

40 pages use in-page table-of-contents / section anchors (e.g. `#results`, `#faq`). These are legitimate same-page navigation and are **not** counted as duplicate-destination errors.

| Page | Same-page anchors |
|---|---|
| `/calculators/gear-ratio-calculator/` | 3 |
| `/calculators/tire-size-calculator/` | 1 |
| `/` | 1 |
| `/tire-size/185-65r15/` | 8 |
| `/tire-size/195-60r15/` | 8 |
| `/tire-size/195-65r15/` | 8 |
| `/tire-size/205-55r16/` | 8 |
| `/tire-size/205-60r16/` | 8 |
| `/tire-size/215-55r17/` | 8 |
| `/tire-size/215-60r16/` | 8 |
| `/tire-size/225-45r17/` | 8 |
| `/tire-size/225-50r17/` | 8 |
| `/tire-size/225-55r17/` | 8 |
| `/tire-size/225-65r17/` | 8 |
| `/tire-size/235-40r18/` | 8 |
| `/tire-size/235-45r18/` | 8 |
| `/tire-size/235-55r18/` | 8 |
| `/tire-size/235-60r18/` | 8 |
| `/tire-size/235-65r17/` | 8 |
| `/tire-size/245-40r18/` | 8 |
| `/tire-size/245-45r18/` | 8 |
| `/tire-size/245-60r18/` | 8 |
| `/tire-size/255-35r19/` | 8 |
| `/tire-size/255-55r19/` | 8 |
| `/tire-size/265-60r18/` | 8 |
| `/tire-size/265-65r18/` | 8 |
| `/tire-size/265-70r17/` | 8 |
| `/tire-size/275-55r20/` | 8 |
| `/tire-size/275-60r20/` | 8 |
| `/tire-size/275-65r18/` | 8 |
| `/tire-size/275-70r18/` | 8 |
| `/tire-size/285-55r20/` | 7 |
| `/tire-size/285-65r20/` | 8 |
| `/tire-size/285-70r17/` | 8 |
| `/tire-size/285-75r16/` | 8 |
| `/tire-size/295-35r21/` | 8 |
| `/tire-size/305-55r20/` | 8 |
| `/tire-size/305-70r18/` | 8 |
| `/tire-size/315-70r17/` | 8 |
| `/tire-size/lt265-75r16/` | 8 |

## Clean pages (no errors or warnings)

`/404/`, `/author/alex-morgan/`, `/author/jamie-chen/`, `/calculators/gear-ratio-calculator/`, `/calculators/speedometer-error-calculator/`, `/calculators/tire-comparison-calculator/`, `/calculators/wheel-offset-calculator/`, `/compare/185-65-r15-vs-195-65-r15/`, `/compare/185-65-r15-vs-205-55-r16/`, `/compare/185-65-r15-vs-215-60-r16/`, `/compare/195-60-r15-vs-205-55-r16/`, `/compare/195-60-r15-vs-205-60-r16/`, `/compare/195-65-r15-vs-185-65-r15/`, `/compare/195-65-r15-vs-205-55-r16/`, `/compare/205-55-r16-vs-185-65-r15/`, `/compare/205-55-r16-vs-195-60-r15/`, `/compare/205-55-r16-vs-195-65-r15/`, `/compare/205-55-r16-vs-215-55-r17/`, `/compare/205-55-r16-vs-215-60-r16/`, `/compare/205-55-r16-vs-225-55-r17/`, `/compare/205-60-r16-vs-195-60-r15/`, `/compare/205-60-r16-vs-195-65-r15/`, `/compare/205-60-r16-vs-215-55-r17/`, `/compare/205-60-r16-vs-215-60-r16/`, `/compare/215-55-r17-vs-205-55-r16/`, `/compare/215-55-r17-vs-205-60-r16/`, `/compare/215-55-r17-vs-225-55-r17/`, `/compare/215-60-r16-vs-185-65-r15/`, `/compare/215-60-r16-vs-205-55-r16/`, `/compare/215-60-r16-vs-205-60-r16/`, `/compare/215-60-r16-vs-225-55-r17/`, `/compare/225-45-r17-vs-235-40-r18/`, `/compare/225-45-r17-vs-235-45-r18/`, `/compare/225-45-r17-vs-245-40-r18/`, `/compare/225-45-r17-vs-245-45-r18/`, `/compare/225-50-r17-vs-235-40-r18/`, `/compare/225-50-r17-vs-235-45-r18/`, `/compare/225-50-r17-vs-245-40-r18/`, `/compare/225-55-r17-vs-205-55-r16/`, `/compare/225-55-r17-vs-215-55-r17/`, `/compare/225-55-r17-vs-215-60-r16/`, `/compare/225-65-r17-vs-235-55-r18/`, `/compare/225-65-r17-vs-235-60-r18/`, `/compare/225-65-r17-vs-235-65-r17/`, `/compare/225-65-r17-vs-265-60-r18/`, `/compare/235-40-r18-vs-225-45-r17/`, `/compare/235-40-r18-vs-225-50-r17/`, `/compare/235-40-r18-vs-245-40-r18/`, `/compare/235-40-r18-vs-245-45-r18/`, `/compare/235-40-r18-vs-255-35-r19/`, `/compare/235-45-r18-vs-225-45-r17/`, `/compare/235-45-r18-vs-225-50-r17/`, `/compare/235-45-r18-vs-245-40-r18/`, `/compare/235-45-r18-vs-245-45-r18/`, `/compare/235-45-r18-vs-255-35-r19/`, `/compare/235-55-r18-vs-225-65-r17/`, `/compare/235-55-r18-vs-245-60-r18/`, `/compare/235-55-r18-vs-255-55-r19/`, `/compare/235-60-r18-vs-225-65-r17/`, `/compare/235-60-r18-vs-245-60-r18/`, `/compare/235-60-r18-vs-265-60-r18/`, `/compare/235-65-r17-vs-225-65-r17/`, `/compare/235-65-r17-vs-245-60-r18/`, `/compare/235-65-r17-vs-265-60-r18/`, `/compare/245-40-r18-vs-225-45-r17/`, `/compare/245-40-r18-vs-225-50-r17/`, `/compare/245-40-r18-vs-235-40-r18/`, `/compare/245-40-r18-vs-235-45-r18/`, `/compare/245-40-r18-vs-255-35-r19/`, `/compare/245-45-r18-vs-225-45-r17/`, `/compare/245-45-r18-vs-235-40-r18/`, `/compare/245-45-r18-vs-235-45-r18/`, `/compare/245-45-r18-vs-255-35-r19/`, `/compare/245-60-r18-vs-235-55-r18/`, `/compare/245-60-r18-vs-235-60-r18/`, `/compare/245-60-r18-vs-235-65-r17/`, `/compare/245-60-r18-vs-255-55-r19/`, `/compare/245-60-r18-vs-265-60-r18/`, `/compare/245-60-r18-vs-265-65-r18/`, `/compare/265-60-r18-vs-225-65-r17/`, `/compare/265-60-r18-vs-235-60-r18/`, `/compare/265-60-r18-vs-235-65-r17/`, `/compare/265-60-r18-vs-245-60-r18/`, `/compare/265-60-r18-vs-255-55-r19/`, `/compare/265-60-r18-vs-275-65-r18/`, `/compare/265-65-r18-vs-245-60-r18/`, `/compare/265-65-r18-vs-255-55-r19/`, `/compare/265-65-r18-vs-275-65-r18/`, `/compare/265-70-r17-vs-275-70-r18/`, `/compare/265-70-r17-vs-285-70-r17/`, `/compare/275-55-r20-vs-255-55-r19/`, `/compare/275-55-r20-vs-285-55-r20/`, `/compare/275-60-r20-vs-285-55-r20/`, `/compare/275-65-r18-vs-255-55-r19/`, `/compare/275-65-r18-vs-265-60-r18/`, `/compare/275-65-r18-vs-265-65-r18/`, `/compare/275-70-r18-vs-265-70-r17/`, `/compare/275-70-r18-vs-285-70-r17/`, `/compare/275-70-r18-vs-305-70-r18/`, `/compare/275-70-r18-vs-315-70-r17/`, `/compare/285-55-r20-vs-255-55-r19/`, `/compare/285-55-r20-vs-275-55-r20/`, `/compare/285-55-r20-vs-275-60-r20/`, `/compare/285-65-r20-vs-305-55-r20/`, `/compare/285-70-r17-vs-265-70-r17/`, `/compare/285-70-r17-vs-275-70-r18/`, `/compare/285-70-r17-vs-305-70-r18/`, `/compare/285-70-r17-vs-315-70-r17/`, `/compare/305-55-r20-vs-285-65-r20/`, `/compare/305-70-r18-vs-275-70-r18/`, `/compare/305-70-r18-vs-285-70-r17/`, `/compare/305-70-r18-vs-315-70-r17/`, `/compare/315-70-r17-vs-275-70-r18/`, `/compare/315-70-r17-vs-285-70-r17/`, `/compare/315-70-r17-vs-305-70-r18/`, `/data-standards/`, `/report-an-issue/`, `/terms/`, `/tire-sizes/`

## Notes on broken / empty links

No broken internal links, empty `href`s, `#` placeholders, or nested `<a>` elements were found across the 174 rendered routes.
