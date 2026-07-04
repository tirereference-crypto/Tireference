import { getVehicleFitment } from '../data/vehicle-fitment';
import {
  getTireDiameterCatalog,
  searchTiresByDiameter,
  type TireDiameterMatch,
  type TireDiameterSearchParams,
  type WheelDiameterOption,
} from './tire-diameter-search';
import {
  comparisonSlugPath,
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
  { diameterIn: 31, label: '31"', description: 'Stock Truck' },
  { diameterIn: 33, label: '33"', description: 'Popular Upgrade' },
  { diameterIn: 35, label: '35"', description: 'Off-Road Favorite' },
  { diameterIn: 37, label: '37"', description: 'Serious Build' },
  { diameterIn: 40, label: '40"', description: 'Extreme Setup' },
];

export const POPULAR_DIAMETER_SEARCHES: PopularDiameterSearch[] = [
  { label: '31" Tires', description: 'Stock-friendly truck upgrade', diameterIn: 31 },
  { label: '33" Tires', description: 'Most popular off-road upgrade', diameterIn: 33 },
  { label: '35" Tires', description: 'Lifted truck favorite', diameterIn: 35 },
  { label: '37" Tires', description: 'Serious trail build', diameterIn: 37 },
  { label: '40" Tires', description: 'Extreme off-road setup', diameterIn: 40 },
];

export const POPULAR_TIRE_DIAMETERS: PopularTireDiameterItem[] = [
  {
    diameterIn: 31,
    label: '31" Tires',
    description: 'Mid-size SUVs, Jeep Cherokee, stock Tacoma',
  },
  {
    diameterIn: 33,
    label: '33" Tires',
    description: 'Tacoma, 4Runner, Wrangler, Bronco',
  },
  {
    diameterIn: 35,
    label: '35" Tires',
    description: 'Lifted F-150, Silverado, Gladiator',
  },
  {
    diameterIn: 37,
    label: '37" Tires',
    description: 'Heavy-duty off-road builds, Ram 2500, Super Duty',
  },
  {
    diameterIn: 40,
    label: '40" Tires',
    description: 'Extreme rock crawlers and custom builds',
  },
];

export function diameterLandingHref(
  diameterIn: number,
  wheelIn: WheelDiameterOption = 18,
): string {
  const params = new URLSearchParams({
    diameter: String(diameterIn),
    wheel: String(wheelIn),
  });
  return calculatorPathWithQuery(CALCULATOR_PATHS.tireDiameter, params);
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

      const href = comparisonSlugPath(sizeA, sizeB);
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

  const curated = ranked.slice(0, limit).map(({ sizeA, sizeB }) => {
    const href = comparisonSlugPath(sizeA, sizeB);
    seen.add(href);
    return {
      label: `${sizeA} vs ${sizeB}`,
      href,
    };
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

export const DIAMETER_FAQS: DiameterFaq[] = [
  {
    question: 'What tire size is 33 inches tall?',
    answer:
      'There is no single metric code for “33 inches” — owners use that number to describe overall mounted height, while tire labels still use width, aspect ratio, and wheel diameter (for example 275/70R18). Several verified sizes land near 33" depending on wheel diameter and construction. On 18" wheels, 275/70R18 calculates to about 33.16" overall; on 17" wheels, 285/70R17 is roughly 32.71" and 315/70R17 pushes past 34". Flotation sizes such as 33x12.50R15 or 33x12.50R17 are named for their approximate outside diameter but still vary by brand and tread depth. Two tires marketed as “33s” can differ by more than an inch in real mounted height because section width, aspect ratio, and tread block height all shift the final number. That is why reverse diameter search matters: you pick the height you want first, then filter by wheel size and tolerance to see which codes actually hit your target. Always confirm fitment separately — diameter alone does not guarantee clearance at full lock or under compression.',
  },
  {
    question: 'How is tire diameter calculated?',
    answer:
      'Overall diameter is calculated from the metric size printed on the sidewall, not measured from the wheel alone. Start with section width in millimeters and aspect ratio (sidewall height as a percent of width). Sidewall height in inches = (width × aspect ratio ÷ 100) ÷ 25.4. Overall diameter = wheel diameter + (2 × sidewall height). Example: 275/70R18 → sidewall = (275 × 0.70) ÷ 25.4 ≈ 7.58" per side → overall ≈ 18 + 15.16 ≈ 33.16". Tire Reference uses this same ISO/ETRTO-based math as our Tire Size Calculator, then derives circumference (π × diameter) and revolutions per mile (63,360 ÷ circumference in inches) for speedometer and gearing estimates. Published diameter specs are nominal values for a new tire at recommended pressure; they are the correct baseline for comparing sizes before purchase, but they are not identical to a tape-measure reading on your driveway. Use calculated diameter to shortlist metric codes, then validate with a comparison or fitment check before buying.',
  },
  {
    question: 'Does wheel diameter equal tire diameter?',
    answer:
      'No — and confusing the two is one of the most common fitment mistakes. The number after the R in a size such as 275/70R18 is rim diameter only: the bead seat where the tire mounts, measured in inches. Overall tire diameter includes both sidewalls, the tread crown, and any tread block height above the carcass — typically 8–15 inches taller than the wheel alone on light trucks and SUVs. An 18" wheel on a 33" tall tire means roughly 7.5" of sidewall contributes above and below the rim lip (plus tread). That extra height drives speedometer error, effective gearing, ground clearance, and fender clearance — none of which change if you only look at the R-number. Two different metric sizes can share the same wheel diameter but differ substantially in overall height (compare 275/55R20 vs 275/65R18). When shopping, think in two layers: wheel diameter for bolt-on compatibility, overall diameter for how the vehicle drives and fits. Our diameter search bridges that gap by finding metric codes that match your target outside height on your chosen wheel size.',
  },
  {
    question: 'Why do my measured and calculated diameters differ?',
    answer:
      'A tape-measure reading on a mounted tire often disagrees with the calculated nominal diameter by 1–3%, and sometimes more — that does not necessarily mean the math is wrong. Calculated specs assume a new tire at recommended inflation on a standardized measuring rim; your vehicle adds real-world variables. Tread depth changes outside diameter over the life of the tire — a worn tire can measure noticeably shorter than the same model new. Under-inflation lets the sidewall squat and reduces mounted height; over-inflation can round the profile and read taller. Load (vehicle weight, cargo, trailer tongue weight) compresses the contact patch and can shift height slightly. Manufacturer construction tolerances, extra-deep tread blocks on aggressive all-terrains, and even temperature all play a role. Measure on level ground, at recommended cold pressure, with a vertical line from ground to tread crown (not the rim) for the most consistent result. Use calculated diameter to compare sizes and predict speedometer/gearing impact; use physical measurement to validate fitment on your specific wheel, offset, and suspension. If the gap exceeds ~3%, double-check size labeling, wear, and pressure before assuming a catalog error.',
  },
  {
    question: 'How does overall tire diameter affect speedometer accuracy and gearing?',
    answer:
      'Your speedometer and odometer assume a fixed rolling circumference from the factory tire. When overall diameter grows, each revolution travels farther, so the vehicle moves faster than the cluster indicates at the same wheel speed — and the engine turns fewer RPM for a given road speed. A tire roughly 3% taller typically produces about 3% speedometer error (often within OEM tolerance) but a meaningful shift in highway cruising RPM and effective axle ratio. Exceed ~3–5% without recalibration and you may notice cruise control drift, navigation ETA errors, and accumulated odometer discrepancy. Gearing feels taller: less torque at the wheels off-road, slower acceleration, but lower RPM on the highway. The opposite happens when you downsize diameter. Re-gearing (ring and pinion) is common on dedicated off-road builds that jump multiple diameter classes; mild upgrades often live with the error or use programmer/speedometer correction where supported. Search by target diameter first, then compare candidate sizes to see exact circumference and revolutions-per-mile deltas before committing.',
  },
  {
    question: 'What wheel size do I need for a target tire diameter?',
    answer:
      'Wheel diameter sets the anchor point — overall height is wheel diameter plus twice the sidewall. You cannot hit a 33" overall target on a 15" wheel with the same metric codes that work on 18" wheels; aspect ratio and section width must change to compensate. Larger wheels (18", 20") typically need lower aspect ratios to stay near a given outside diameter, which firms up ride and reduces sidewall flex. Smaller wheels (16", 17") allow taller sidewall percentages for the same overall height, which many overlanders prefer for air-down performance and impact absorption. When you change wheel diameter in the search above, the result set re-filters to sizes that actually mount on that rim and land near your target overall height. Match wheel width to section width (rough rule: tire width in mm ÷ 10 ≈ minimum wheel width in inches, with brand-specific ranges). Correct offset and backspacing still matter as much as diameter — a tire that calculates correctly can rub if the wheel pushes the footprint outward into the fender.',
  },
];

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
  wheelIn: WheelDiameterOption;
  overallDiameterIn: number;
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
  const onWheel = catalog.filter((entry) => Math.round(entry.specs.wheelDiameterIn) === wheelIn);

  if (options.preferredSize) {
    const preferred = onWheel.find((entry) => entry.size === options.preferredSize);
    if (preferred) {
      return {
        exampleSize: preferred.size,
        wheelIn,
        overallDiameterIn: preferred.specs.overallDiameterIn,
      };
    }
  }

  if (options.targetDiameterIn && onWheel.length > 0) {
    const closest = [...onWheel].sort(
      (a, b) =>
        Math.abs(a.specs.overallDiameterIn - options.targetDiameterIn!) -
        Math.abs(b.specs.overallDiameterIn - options.targetDiameterIn!),
    )[0];
    return {
      exampleSize: closest.size,
      wheelIn,
      overallDiameterIn: closest.specs.overallDiameterIn,
    };
  }

  const popular = [...onWheel].sort((a, b) => b.popularity - a.popularity)[0];
  if (popular) {
    return {
      exampleSize: popular.size,
      wheelIn,
      overallDiameterIn: popular.specs.overallDiameterIn,
    };
  }

  const fallbackSize = `275/70R${wheelIn}`;
  const fallbackSpecs = getTireSpecs(fallbackSize);
  return {
    exampleSize: fallbackSize,
    wheelIn,
    overallDiameterIn: fallbackSpecs.overallDiameterIn,
  };
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
    'Park on level ground with tires inflated to recommended pressure.',
    'Measure vertically from the ground to the top of the tread (not the rim).',
    'Alternatively, measure circumference at the tread centerline and divide by π.',
    'Compare your measurement to calculated values — expect 1–3% real-world variance.',
  ],

  affectsIntro:
    'Overall tire diameter sits at the center of several driving characteristics. Changing it without adjusting other variables tends to shift the balance of your build.',
};
