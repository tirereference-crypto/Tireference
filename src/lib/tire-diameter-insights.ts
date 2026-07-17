import { getVehicleFitment } from '../data/vehicle-fitment';
import {
  getTireDiameterCatalog,
  searchTiresByDiameter,
  type TireDiameterMatch,
  type TireDiameterSearchParams,
  type WheelDiameterOption,
} from './tire-diameter-search';
import {
  publishedComparisonSlugPath,
  buildCuratedPopularComparisons,
  filterValidComparisonLabels,
  isValidComparisonPair,
  MOST_SEARCHED_COMPARISON_PAIRS,
} from './tire-comparison-links';
import { hubPagePath } from './tire-size-url';
import { getTireSpecs } from './tire-math';
import { CALCULATOR_PATHS, calculatorPathWithQuery, getRelatedCalculators, type RelatedCalculatorItem } from './calculator-links';

export type { RelatedCalculatorItem };

export interface DiameterPreset {
  diameterIn: number;
  label: string;
  description: string;
}

export interface DiameterImpactCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface PopularTireDiameterItem {
  diameterIn: number;
  label: string;
  description: string;
}

export interface PopularDiameterSearch {
  label: string;
  description: string;
  diameterIn: number;
}

export interface NearDiameterSizeCard {
  size: string;
  diameterIn: number;
  hubHref: string;
}

export interface EqualToDiameterContent {
  heading: string;
  body: string;
}

export interface PopularComparisonItem {
  label: string;
  href: string;
}

export interface DiameterFaq {
  question: string;
  answer: string;
}

export interface DiameterSeoContent {
  title: string;
  metaDescription: string;
  bestSizesHeading: string;
  bestSizesBody: string;
  vehiclesHeading: string;
  vehiclesBody: string;
  wheelComboHeading: string;
  wheelComboBody: string;
  equivalentsHeading: string;
  equivalentsBody: string;
}

export const DIAMETER_PRESETS: DiameterPreset[] = [
  { diameterIn: 31, label: '31"', description: 'Common truck-size range' },
  { diameterIn: 33, label: '33"', description: 'Frequently searched diameter' },
  { diameterIn: 35, label: '35"', description: 'Larger off-road diameter' },
];

export const POPULAR_DIAMETER_SEARCHES: PopularDiameterSearch[] = [
  { label: '31" Tires', description: 'Common truck-size range', diameterIn: 31 },
  { label: '33" Tires', description: 'Frequently searched diameter', diameterIn: 33 },
  { label: '35" Tires', description: 'Larger off-road diameter', diameterIn: 35 },
];

export const POPULAR_TIRE_DIAMETERS: PopularTireDiameterItem[] = [
  { diameterIn: 31, label: '31-inch tires', description: '' },
  { diameterIn: 33, label: '33-inch tires', description: '' },
  { diameterIn: 35, label: '35-inch tires', description: '' },
];

export function diameterLandingHref(
  diameterIn: number,
  wheelIn: WheelDiameterOption = 18,
): string {
  return calculatorPathWithQuery(CALCULATOR_PATHS.tireDiameter, {
    d: String(diameterIn),
    rim: String(wheelIn),
  });
}

export const POPULAR_COMPARISONS: PopularComparisonItem[] = filterValidComparisonLabels(
  buildCuratedPopularComparisons(6).map(({ label, href }) => ({ label, href })),
);

export function tireMatchesDiameterSearch(
  size: string,
  params: TireDiameterSearchParams,
): boolean {
  try {
    const specs = getTireSpecs(size);
    if (Math.round(specs.wheelDiameterIn) !== params.wheelDiameterIn) return false;
    return Math.abs(specs.overallDiameterIn - params.targetDiameterIn) <= params.toleranceIn;
  } catch {
    return false;
  }
}

function buildMatchDerivedComparisons(
  params: TireDiameterSearchParams,
  limit: number,
  seen: Set<string>,
): PopularComparisonItem[] {
  const { matches } = searchTiresByDiameter(params);
  const qualifying = matches.filter((match) => tireMatchesDiameterSearch(match.size, params));
  const results: PopularComparisonItem[] = [];

  for (let i = 0; i < qualifying.length && results.length < limit; i++) {
    for (let j = i + 1; j < qualifying.length && results.length < limit; j++) {
      const sizeA = qualifying[i].size;
      const sizeB = qualifying[j].size;
      if (!isValidComparisonPair(sizeA, sizeB)) continue;

      const href = publishedComparisonSlugPath(sizeA, sizeB);
      if (!href) continue;

      if (seen.has(href)) continue;
      seen.add(href);

      results.push({
        label: `${sizeA} vs ${sizeB}`,
        href,
      });
    }
  }

  return results;
}

/** Popular comparisons where at least one tire matches the active diameter search settings. */
export function buildPopularComparisonsForDiameterSearch(
  params: TireDiameterSearchParams,
  limit = 6,
): PopularComparisonItem[] {
  const seen = new Set<string>();
  const ranked = MOST_SEARCHED_COMPARISON_PAIRS.map(([sizeA, sizeB], index) => {
    if (!isValidComparisonPair(sizeA, sizeB)) return null;

    const aMatch = tireMatchesDiameterSearch(sizeA, params);
    const bMatch = tireMatchesDiameterSearch(sizeB, params);
    if (!aMatch && !bMatch) return null;

    const matchScore = (aMatch ? 1 : 0) + (bMatch ? 1 : 0);
    const closeness = [sizeA, sizeB]
      .filter((size, idx) => (idx === 0 ? aMatch : bMatch))
      .map((size) => Math.abs(getTireSpecs(size).overallDiameterIn - params.targetDiameterIn))
      .reduce((best, diff) => Math.min(best, diff), Number.POSITIVE_INFINITY);

    return { sizeA, sizeB, index, matchScore, closeness };
  })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (a.closeness !== b.closeness) return a.closeness - b.closeness;
      return a.index - b.index;
    });

  const curated = ranked.slice(0, limit).flatMap(({ sizeA, sizeB }) => {
    const href = publishedComparisonSlugPath(sizeA, sizeB);
    if (!href) return [];
    seen.add(href);
    return [{
      label: `${sizeA} vs ${sizeB}`,
      href,
    }];
  });

  if (curated.length >= limit) return filterValidComparisonLabels(curated);

  return filterValidComparisonLabels([
    ...curated,
    ...buildMatchDerivedComparisons(params, limit - curated.length, seen),
  ]);
}

/** Popular hub-linked sizes closest to a target diameter (cross-wheel, for internal linking). */
export function buildPopularSizesNearDiameter(
  targetDiameterIn: number,
  limit = 4,
  excludeSizes: string[] = [],
): NearDiameterSizeCard[] {
  const exclude = new Set(excludeSizes.map((size) => size.toUpperCase()));

  return getTireDiameterCatalog()
    .filter((entry) => !exclude.has(entry.size.toUpperCase()))
    .sort((a, b) => {
      const diffA = Math.abs(a.specs.overallDiameterIn - targetDiameterIn);
      const diffB = Math.abs(b.specs.overallDiameterIn - targetDiameterIn);
      if (diffA !== diffB) return diffA - diffB;
      return b.popularity - a.popularity;
    })
    .slice(0, limit)
    .map((entry) => ({
      size: entry.size,
      diameterIn: entry.specs.overallDiameterIn,
      hubHref: hubPagePath(entry.size),
    }));
}

export const RELATED_CALCULATOR_LINKS = getRelatedCalculators(CALCULATOR_PATHS.tireDiameter);

export const DIAMETER_FAQ_PRIMARY_COUNT = 6;

export interface BuildDiameterFaqsInput {
  targetDiameterIn: number;
  wheelDiameterIn: number | 'any';
  closestSize?: string | null;
  closestDiameterIn?: number | null;
  toleranceIn?: number;
}

function fmtIn(value: number, digits = 2): string {
  return `${value.toFixed(digits)}"`;
}

/**
 * Dynamic Expert FAQ for the Tire Diameter Calculator.
 * Primary (6) are always rendered; remaining sit behind “Show more”.
 * FAQPage JSON-LD should include only the currently rendered set.
 */
export function buildDiameterFaqs(input: BuildDiameterFaqsInput): DiameterFaq[] {
  const target = input.targetDiameterIn;
  const targetLabel = target.toFixed(1);
  const wheelLabel =
    input.wheelDiameterIn === 'any' ? 'any wheel diameter' : `${input.wheelDiameterIn}" wheels`;
  const closestSize = input.closestSize?.trim() || null;
  const closestDia = input.closestDiameterIn;
  const tol = input.toleranceIn ?? 1;

  const closestSentence = closestSize
    ? closestDia != null
      ? `For your ${targetLabel}" target on ${wheelLabel}, the closest indexed size is ${closestSize} at about ${fmtIn(closestDia)} overall.`
      : `For your ${targetLabel}" target on ${wheelLabel}, the closest indexed size currently shown is ${closestSize}.`
    : `Run a search for ${targetLabel}" on ${wheelLabel} to surface the closest indexed production sizes in our database.`;

  const primary: DiameterFaq[] = [
    {
      question: `What tire size is closest to ${targetLabel} inches tall?`,
      answer: [
        closestSize
          ? `${closestSize} is the closest indexed production size to ${targetLabel}" on ${wheelLabel} in the current reverse search.`
          : `There is no single metric code for “${targetLabel} inches” — the closest size depends on wheel diameter, aspect ratio, and the sizes indexed in TireReference’s database.`,
        closestSentence,
        `Overall height is calculated from the size code (section width, aspect ratio, and wheel diameter), then ranked by absolute difference from your target. Published model catalogs can still list a slightly different diameter for a specific product.`,
        `Diameter matching is not a fitment confirmation — confirm clearance, load rating, and vehicle requirements separately before purchase.`,
      ].join(' '),
    },
    {
      question: 'How is tire diameter calculated?',
      answer: [
        `Nominal overall diameter is calculated from the tire-size geometry: sidewall height = (section width × aspect ratio ÷ 100), then overall diameter = wheel diameter + 2 × sidewall height (with millimetres converted at 25.4 mm per inch).`,
        `Example path for a metric size such as 275/70R18: sidewall ≈ 7.58", overall ≈ 33.16". Circumference is π × overall diameter, and revolutions per mile equal 63,360 ÷ circumference in inches.`,
        `TireReference uses these nominal calculations for reverse-search ranking. They are not the same as a tape measurement on a loaded vehicle, and they are not substituted with individual product-model published diameters for generic size ranking.`,
      ].join(' '),
    },
    {
      question: 'Does wheel diameter equal tire diameter?',
      answer: [
        `No. Wheel diameter (the R-number) is only the rim bead-seat diameter; overall tire diameter includes both sidewalls and the tread height.`,
        `An ${input.wheelDiameterIn === 'any' ? '18' : String(input.wheelDiameterIn)}-inch wheel does not mean an ${input.wheelDiameterIn === 'any' ? '18' : String(input.wheelDiameterIn)}-inch tire.`,
        closestSize && closestDia != null
          ? `Your current closest match ${closestSize} calculates to about ${fmtIn(closestDia)} overall — taller than the wheel alone by two sidewalls.`
          : `Two sizes can share the same wheel diameter yet differ by several inches overall when aspect ratio or width changes.`,
        `Use wheel diameter for mount compatibility and overall diameter for height, speedometer, gearing, and clearance estimates.`,
      ].join(' '),
    },
    {
      question: 'Why do measured and calculated diameters differ?',
      answer: [
        `Calculated diameter is a nominal size-code value for reverse-search comparison; a driveway tape measure reflects construction, inflation, load, remaining tread depth, and measuring-rim width.`,
        `Those real-world factors can make a mounted reading higher or lower than the nominal figure without meaning the size code is wrong.`,
        `Compare measured height to the calculator result as a screening check, not as proof of catalog error. Confirm critical fitment with your specific wheel, pressure, and vehicle setup.`,
      ].join(' '),
    },
    {
      question: 'How does overall tire diameter affect speedometer accuracy?',
      answer: [
        `Speedometers assume a fixed rolling circumference. When overall diameter increases, each revolution covers more ground, so true speed is typically higher than indicated at the same wheel RPM; the reverse happens when diameter decreases.`,
        closestSize && closestDia != null
          ? `Against your ${targetLabel}" target, ${closestSize} at ~${fmtIn(closestDia)} changes circumference (and therefore indicated-vs-true speed) in proportion to that diameter difference.`
          : `The percentage change in overall diameter is the geometric first-order estimate for circumference and theoretical speedometer error before any cluster recalibration.`,
        `Wear, load, temperature, and OEM calibration can still shift real cluster behaviour. This tool does not recalibrate your instrument cluster.`,
      ].join(' '),
    },
    {
      question: 'What wheel size do I need for a target tire diameter?',
      answer: [
        `Choose the wheel diameter you will actually mount, then search for metric (or flotation) sizes whose calculated overall diameter lands near your ${targetLabel}" target.`,
        `Overall height equals wheel diameter plus two sidewalls, so the same overall target requires different aspect ratios and widths on different rim diameters.`,
        input.wheelDiameterIn === 'any'
          ? `With “Any” wheel selected, results can span supported rim diameters; pick a specific wheel (for example 17" or 18") when you already know the rim you will run.`
          : `Your search is currently filtered to ${input.wheelDiameterIn}" wheels — change the wheel selector if the rim size is still undecided.`,
        `Wheel width, offset, bolt pattern, and brake clearance remain separate from overall diameter.`,
      ].join(' '),
    },
  ];

  const secondary: DiameterFaq[] = [
    {
      question: 'How does tire diameter affect effective gearing?',
      answer: [
        `Larger overall diameter raises effective gearing: for a given transmission and axle ratio, engine RPM at a road speed tends to fall, and torque at the ground is reduced for the same engine torque.`,
        `Smaller diameter does the opposite. Re-gearing is a separate mechanical choice; this calculator only estimates diameter-driven RPM and circumference effects from nominal size math.`,
      ].join(' '),
    },
    {
      question: 'Why can two tires with the same size have different published diameters?',
      answer: [
        `The size code defines nominal geometry; brand catalogs can publish molded or measured diameters that differ slightly because of tread pattern, carcass design, and approved measuring conditions.`,
        `TireReference reverse search ranks using consistent nominal size-to-size calculations so sizes remain comparable. Use product pages for brand-specific published specifications when available.`,
      ].join(' '),
    },
    {
      question: 'What does revolutions per mile mean?',
      answer: [
        `Revolutions per mile (or per kilometre) is how many times the tire rotates to cover that distance, derived from rolling circumference (π × overall diameter).`,
        `Higher revs/mile means a shorter rolling circumference. Speedometer and gearing estimates track the change in revs when diameter changes.`,
      ].join(' '),
    },
    {
      question: 'Does this calculator confirm vehicle fitment?',
      answer: [
        `No. It reverse-searches indexed production sizes near a target overall diameter and wheel diameter; it does not verify your VIN, lift, fenders, brakes, or load requirements.`,
        `Treat results as a size shortlist. Confirm fitment with your vehicle maker, tire maker, or a professional installer before buying.`,
      ].join(' '),
    },
    {
      question: 'How much diameter difference is acceptable?',
      answer: [
        `A percentage such as ±3% is a common screening guideline, not a guarantee of vehicle compatibility.`,
        `Your current maximum diameter difference setting (±${tol.toFixed(1)}") only controls which indexed sizes appear in results — it is not a fitment approval for any specific vehicle.`,
        `Acceptable change still depends on OEM tolerance, speedometer policy, ABS/ESC assumptions, clearance, and intended use.`,
      ].join(' '),
    },
    {
      question: 'Are flotation-size diameters exact?',
      answer: [
        `Flotation labels such as 33×12.50R15 state approximate overall diameter and section width, but brand construction and tread can still change the mounted height.`,
        `Treat flotation numbers as naming conventions, then confirm calculated or published specifications for the exact product you will buy.`,
      ].join(' '),
    },
  ];

  return [...primary, ...secondary];
}

/** Default FAQs for SSR / schema when no live search context is available. */
export const DIAMETER_FAQS: DiameterFaq[] = buildDiameterFaqs({
  targetDiameterIn: 33,
  wheelDiameterIn: 18,
  closestSize: '275/70R18',
  closestDiameterIn: 33.16,
  toleranceIn: 1,
});

export const ABOUT_DIAMETER_AFFECTS = [
  'Speedometer accuracy',
  'Ground clearance',
  'Gearing & RPM',
  'Fuel economy',
  'Ride comfort',
  'Handling & steering effort',
];

export const DIAMETER_IMPACT_CARDS: DiameterImpactCard[] = [
  {
    id: 'speedometer',
    title: 'Speedometer Accuracy',
    description: 'Larger diameter = speedometer reads slower than actual speed.',
    icon: '⏱',
  },
  {
    id: 'gearing',
    title: 'Gearing & RPM',
    description: 'Taller tires raise effective gearing and lower cruise RPM.',
    icon: '⚙',
  },
  {
    id: 'clearance',
    title: 'Ground Clearance',
    description: 'Each inch of diameter adds roughly 0.5" of ride height.',
    icon: '⛰',
  },
  {
    id: 'fuel',
    title: 'Fuel Economy',
    description: 'Heavier, wider tires increase rolling resistance and reduce MPG.',
    icon: '⛽',
  },
  {
    id: 'comfort',
    title: 'Ride Comfort',
    description: 'Taller sidewalls absorb bumps; shorter sidewalls feel firmer.',
    icon: '🛋',
  },
  {
    id: 'handling',
    title: 'Handling',
    description: 'Wider and taller tires increase steering effort and turning radius.',
    icon: '🎯',
  },
];

export interface DiameterVsWheelExample {
  exampleSize: string;
  wheelIn: number;
  overallDiameterIn: number;
  sidewallIn: number;
}

export interface BuildDiameterVsWheelExampleOptions {
  targetDiameterIn?: number | null;
  preferredSize?: string | null;
}

export function buildDiameterVsWheelExample(
  wheelIn: WheelDiameterOption,
  options: BuildDiameterVsWheelExampleOptions = {},
): DiameterVsWheelExample {
  const catalog = getTireDiameterCatalog();

  if (options.preferredSize) {
    const preferred = catalog.find((entry) => entry.size === options.preferredSize);
    if (preferred) {
      return {
        exampleSize: preferred.size,
        wheelIn: preferred.specs.wheelDiameterIn,
        overallDiameterIn: preferred.specs.overallDiameterIn,
        sidewallIn: preferred.specs.sidewallIn,
      };
    }
  }

  const onWheel = catalog.filter((entry) => Math.round(entry.specs.wheelDiameterIn) === wheelIn);

  if (options.targetDiameterIn && onWheel.length > 0) {
    const closest = [...onWheel].sort(
      (a, b) =>
        Math.abs(a.specs.overallDiameterIn - options.targetDiameterIn!) -
        Math.abs(b.specs.overallDiameterIn - options.targetDiameterIn!),
    )[0];
    return {
      exampleSize: closest.size,
      wheelIn: closest.specs.wheelDiameterIn,
      overallDiameterIn: closest.specs.overallDiameterIn,
      sidewallIn: closest.specs.sidewallIn,
    };
  }

  const popular = [...onWheel].sort((a, b) => b.popularity - a.popularity)[0];
  if (popular) {
    return {
      exampleSize: popular.size,
      wheelIn: popular.specs.wheelDiameterIn,
      overallDiameterIn: popular.specs.overallDiameterIn,
      sidewallIn: popular.specs.sidewallIn,
    };
  }

  const fallbackSize = `275/70R${wheelIn}`;
  const fallbackSpecs = getTireSpecs(fallbackSize);
  return {
    exampleSize: fallbackSize,
    wheelIn: fallbackSpecs.wheelDiameterIn,
    overallDiameterIn: fallbackSpecs.overallDiameterIn,
    sidewallIn: fallbackSpecs.sidewallIn,
  };
}

/**
 * Shared diameter-group membership for hero chips, Popular Tire Diameters,
 * and diameter landing pages.
 *
 * A “33-inch size” means the catalog size’s **nominal overall diameter**
 * (formula-calculated, inches) rounds to 33 with `Math.round` —
 * for positive values this is the nearest-inch bucket ≈ [32.5, 33.5).
 *
 * Counts catalog tire-size codes across **all wheel diameters** — not models
 * or product SKUs. Callers that need a wheel-filtered count must apply that
 * filter explicitly and label it (e.g. “indexed 18-inch sizes”).
 *
 * The optional `bandIn` parameter is ignored (retained for call-site compat).
 */
export function isCatalogSizeInDiameterGroup(
  overallDiameterIn: number,
  diameterGroupIn: number,
): boolean {
  return Math.round(overallDiameterIn) === Math.round(diameterGroupIn);
}

/** Count indexed catalog sizes in a popular inch-diameter group (all wheels). */
export function countIndexedSizesNearDiameter(diameterIn: number, _bandIn = 1): number {
  return getTireDiameterCatalog().filter((entry) =>
    isCatalogSizeInDiameterGroup(entry.specs.overallDiameterIn, diameterIn),
  ).length;
}

/**
 * Count indexed sizes in a diameter group, optionally filtered to a wheel diameter.
 * Does not change reverse-search matching — presentation counts only.
 */
export function countIndexedSizesInDiameterGroup(
  diameterGroupIn: number,
  wheelIn?: number | 'any' | null,
): number {
  return getTireDiameterCatalog().filter((entry) => {
    if (!isCatalogSizeInDiameterGroup(entry.specs.overallDiameterIn, diameterGroupIn)) {
      return false;
    }
    if (wheelIn == null || wheelIn === 'any') return true;
    return Math.round(entry.specs.wheelDiameterIn) === wheelIn;
  }).length;
}

export function formatDiameterGroupSizeCountLabel(count: number): string {
  if (count <= 0) return 'No indexed sizes across all wheels';
  return `${count} indexed size${count === 1 ? '' : 's'} across all wheels`;
}

/** Compact hero-chip metadata — short enough to keep pills on one row. */
export function formatDiameterTargetChipMeta(
  count: number,
  wheelIn: number | 'any' | null | undefined,
): string {
  if (count <= 0) {
    if (wheelIn != null && wheelIn !== 'any') {
      return `None on ${wheelIn}"`;
    }
    return 'None';
  }
  if (wheelIn != null && wheelIn !== 'any') {
    return `${count} on ${wheelIn}"`;
  }
  return `${count} size${count === 1 ? '' : 's'}`;
}

export function buildWhatIsTireDiameterLead(example: DiameterVsWheelExample): string {
  return `Tire diameter — more precisely, overall tire diameter — is the full height of a mounted tire measured from the ground to the top of the tread. It is not the same as wheel diameter, which only describes the rim inside the tire. For metric sizes such as ${example.exampleSize}, overall diameter is calculated from section width, aspect ratio, and ${example.wheelIn}-inch wheel diameter: the sidewall height is a percentage of the tread width, and two sidewalls plus the wheel equal the rolling height of the tire.`;
}

function uniqueVehicles(matches: TireDiameterMatch[], limit = 8): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const match of matches) {
    for (const vehicle of getVehicleFitment(match.size)) {
      const label = `${vehicle.manufacturer} ${vehicle.model}`;
      if (seen.has(label)) continue;
      seen.add(label);
      labels.push(label);
      if (labels.length >= limit) return labels;
    }
  }

  return labels;
}

export function buildEqualToDiameterContent(
  targetDiameterIn: number,
  wheelIn: WheelDiameterOption,
  matches: TireDiameterMatch[],
): EqualToDiameterContent {
  const rounded = Math.round(targetDiameterIn);
  const best = matches[0];
  const alternates = matches.slice(1, 4);

  const bestSentence = best
    ? `For ${wheelIn}-inch wheels, ${best.size} measures ${best.diameterIn.toFixed(2)} inches overall — one of the closest verified matches to your ${rounded}-inch target.`
    : `Our database includes several metric sizes that approach ${rounded} inches on ${wheelIn}-inch wheels when you widen the tolerance.`;

  const alternateSentence =
    alternates.length > 0
      ? `Other popular alternatives at this wheel size include ${alternates.map((m) => `${m.size} (${m.diameterIn.toFixed(2)}")`).join(', ')}, each with slightly different width and sidewall profiles.`
      : 'Try adjusting wheel diameter or tolerance to surface additional verified sizes in this diameter class.';

  const closing =
    'Manufacturer construction, tread depth, and load rating can shift mounted height by roughly one to three percent, so always confirm fitment before purchase. Use the comparison tools linked above to evaluate speedometer drift, clearance, and upgrade paths between sizes.';

  return {
    heading: `Tire Sizes Equal To ${rounded} Inches`,
    body: `Several metric tire sizes are approximately ${rounded} inches tall when calculated from section width, aspect ratio, and wheel diameter. ${bestSentence} ${alternateSentence} ${closing}`,
  };
}

export function buildDiameterSeoContent(
  targetDiameterIn: number,
  wheelIn: WheelDiameterOption,
  matches: TireDiameterMatch[],
): DiameterSeoContent {
  const rounded = Math.round(targetDiameterIn);
  const topSizes = matches.slice(0, 5).map((m) => m.size);
  const vehicles = uniqueVehicles(matches);
  const sizeList = topSizes.length > 0 ? topSizes.join(', ') : 'sizes in our verified database';
  const vehicleList =
    vehicles.length > 0
      ? vehicles.join(', ')
      : 'trucks, SUVs, and off-road platforms that commonly run this diameter class';

  const equivalents = matches
    .slice(0, 6)
    .map((m) => `${m.size} (${m.diameterIn.toFixed(2)}")`)
    .join('; ');

  return {
    title: `${rounded} Inch Tire Sizes on ${wheelIn}" Wheels | Tire Reference`,
    metaDescription: `Find tire sizes near ${rounded}" overall diameter on ${wheelIn}" wheels. Compare verified metric sizes, diameter differences, and fitment guidance.`,
    bestSizesHeading: `Best ${rounded} Inch Tire Sizes`,
    bestSizesBody: `When you target approximately ${rounded}" overall diameter on ${wheelIn}" wheels, the closest verified matches in our database include ${sizeList}. These sizes are sorted by how closely their calculated overall diameter matches your target, using the same tire-math engine as our Tire Size Calculator. Smaller differences mean less speedometer drift and fewer unexpected fitment changes versus your current setup.`,
    vehiclesHeading: `What Vehicles Run ${rounded} Inch Tires?`,
    vehiclesBody: `Tire diameter is a build class as much as a number. Around ${rounded}" overall height, owners commonly equip ${vehicleList}. Exact OEM fitment varies by trim, suspension, and wheel offset — always confirm fender clearance, steering lock, and brake clearance before committing to a new size.`,
    wheelComboHeading: `${rounded} Inch Tires on ${wheelIn} Inch Wheels`,
    wheelComboBody: `Pairing a ~${rounded}" overall diameter with an ${wheelIn}" wheel rim is a popular combination for owners who want a larger contact patch and taller sidewall profile without jumping to the largest flotation sizes. On ${wheelIn}" wheels, sidewall height is determined by aspect ratio: a 70-series tire adds more sidewall than a 55-series at the same width. Use the results above to compare how each verified size lands relative to your ${rounded}" target.`,
    equivalentsHeading: `Common ${rounded} Inch Tire Equivalents`,
    equivalentsBody:
      equivalents.length > 0
        ? `These verified metric sizes are the nearest equivalents to a ${rounded}" overall diameter on ${wheelIn}" wheels in our database: ${equivalents}. Each links to a full tire size guide with specs, fitment notes, and comparison tools.`
        : `Browse our tire size library for metric equivalents near ${rounded}" on ${wheelIn}" wheels. Diameter is calculated from section width, aspect ratio, and wheel diameter — not from the rim size alone.`,
  };
}

export const EDUCATIONAL_CONTENT = {
  whatIsTireDiameterBody: `Overall diameter matters because it defines how far the vehicle moves with each revolution. That single dimension influences speedometer accuracy, effective gearing, ground clearance, and how the tire fits inside the wheel well. Two tires can share the same rim size yet differ by several inches in overall height — a 275/55R20 and a 275/65R18 may both use large wheels, but their outside diameters target very different driving goals.

When you shop for upgrades, owners often think in round numbers such as 33 or 35 inches because those heights correlate with trail clearance and visual stance. Metric tire codes remain the purchase specification, so a reverse diameter search bridges the gap between how people measure and how tires are labeled. Real-world mounted height can vary slightly with tread depth, load, and inflation, which is why Tire Reference uses calculated specs and shows difference from your target in inches and percent.

Use overall diameter alongside width and wheel size when comparing options. A tire that matches your target height on the wrong rim may not bolt on, and a correct rim with the wrong sidewall may rub at full compression. Searching by diameter helps you discover realistic metric codes before you open individual size guides or run a full comparison.`,

  howToMeasureSteps: [
    'Park on level ground',
    'Measure from the ground to the top of the tire through its centreline',
    'Record and compare with the calculated result',
  ],

  affectsIntro:
    'Overall tire diameter sits at the center of several driving characteristics. Changing it without adjusting other variables tends to shift the balance of your build.',
};
