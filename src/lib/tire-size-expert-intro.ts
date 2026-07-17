/**
 * Expert hero intro for tire-size detail pages.
 * Hand-written override for 275/70R18; category-aware builders for other sizes.
 */

import type { TireCategory } from '../data/tire-sizes';
import { TIRE_SIZES } from '../data/tire-sizes';
import type { TireSpecs } from './tire-math';
import {
  getProductsForTireSize,
  getTireSizeDataCoverage,
  type TireProduct,
  type TireSizeDataCoverage,
} from './tire-size-products';

export interface ExpertIntroSizeData {
  size: string;
  specs: TireSpecs;
  category?: TireCategory;
}

export interface ExpertIntroBlock {
  paragraph: string;
  fitmentNotes: string[];
}

/**
 * Expert hero intro paragraph for a tire size.
 */
export function getExpertIntroForTireSize(
  sizeData: ExpertIntroSizeData,
  productCoverage?: TireSizeDataCoverage | null,
): string | null {
  return getExpertIntroBlockForTireSize(sizeData, productCoverage)?.paragraph ?? null;
}

/** Alias required by rollout brief. */
export function buildExpertIntroForTireSize(
  sizeData: ExpertIntroSizeData,
  productCoverage?: TireSizeDataCoverage | null,
): ExpertIntroBlock {
  return (
    getExpertIntroBlockForTireSize(sizeData, productCoverage) ?? {
      paragraph: `${sizeData.size} is a radial tire size defined by section width, aspect ratio, and rim diameter. Use the specs and comparisons on this page to judge diameter change, clearance, and load tradeoffs before switching sizes.`,
      fitmentNotes: [
        'Confirm the size against the door placard and wheel diameter before buying.',
        'Load range and speed rating vary by model — match them to your vehicle and use case.',
        'Diameter changes affect speedometer reading, gearing feel, and clearance.',
      ],
    }
  );
}

/** Paragraph + fitment notes for hero presentation. */
export function getExpertIntroBlockForTireSize(
  sizeData: ExpertIntroSizeData,
  productCoverage?: TireSizeDataCoverage | null,
): ExpertIntroBlock | null {
  const sizeKey = normalizeSizeKey(sizeData.size);
  if (sizeKey === '275/70R18') {
    return buildExpertIntroBlock27570R18(sizeData.specs, productCoverage);
  }
  const category =
    sizeData.category ??
    TIRE_SIZES.find((e) => e.size.toUpperCase() === sizeKey)?.category ??
    'passenger';
  return buildExpertIntroBlockGeneric(sizeData.size, sizeData.specs, category, productCoverage);
}

function normalizeSizeKey(size: string): string {
  return size.replace(/^lt/i, 'LT').replace(/^p/i, 'P').toUpperCase();
}

/** Merge exact + LT variants for truck sizes when useful. */
function productsForExpertIntro(size: string, category: TireCategory): TireProduct[] {
  const key = normalizeSizeKey(size);
  const exact = getProductsForTireSize(size);
  const shouldEnrichLt =
    key === '275/70R18' ||
    category === 'off-road' ||
    category === 'light-truck' ||
    (!key.startsWith('LT') && (key.includes('70R') || key.includes('75R')));

  if (!shouldEnrichLt || key.startsWith('LT')) {
    return dedupe(exact);
  }

  const base = key.replace(/^P/, '');
  return dedupe([
    ...exact,
    ...getProductsForTireSize(`LT${base}`),
    ...getProductsForTireSize(`LT${base}/E`),
  ]);
}

function dedupe(products: TireProduct[]): TireProduct[] {
  const seen = new Set<string>();
  const out: TireProduct[] = [];
  for (const p of products) {
    const k = [
      p.brand.trim().toLowerCase(),
      p.model.trim().toLowerCase(),
      (p.load_range || '').trim().toLowerCase(),
      (p.service_description || '').trim().toLowerCase(),
    ].join('|');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

function uniqueUpper(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim().toUpperCase()).filter(Boolean))];
}

function categoryAvailabilityPhrase(products: TireProduct[]): string | null {
  if (products.length === 0) return null;
  const blob = products
    .map((p) => `${p.product_category} ${p.model} ${p.season}`)
    .join(' ')
    .toLowerCase();
  const parts: string[] = [];
  if (/all.?terrain|a\/t|rugged|mud/.test(blob)) parts.push('all-terrain');
  if (/highway|touring|h\/t/.test(blob)) parts.push('highway-terrain');
  if (/touring|all.?season|passenger|suv/.test(blob) && !parts.includes('highway-terrain')) {
    parts.push('touring');
  }
  if (/performance|summer|ultra.?high|uwp|potenza|pilot/.test(blob)) parts.push('performance');
  if (/winter|snow|ice|alpin|blizzak|nordic/.test(blob)) parts.push('winter');
  if (parts.length === 0) return null;
  if (parts.length === 1) {
    return `Products indexed for this size include ${parts[0]} options.`;
  }
  if (parts.length === 2) {
    return `Products indexed for this size include ${parts[0]} and ${parts[1]} options.`;
  }
  const last = parts[parts.length - 1];
  return `Products indexed for this size include ${parts.slice(0, -1).join(', ')}, and ${last} options depending on actual coverage.`;
}

function buildExpertIntroBlock27570R18(
  specs: TireSpecs,
  productCoverage?: TireSizeDataCoverage | null,
): ExpertIntroBlock {
  const products = productsForExpertIntro('275/70R18', 'off-road');
  void productCoverage;
  void getTireSizeDataCoverage;

  const diameterRounded = (Math.round(specs.overallDiameterIn * 10) / 10).toFixed(1);
  const sidewall = specs.sidewallIn.toFixed(1).replace(/\.0$/, '');
  const rim = specs.wheelDiameterIn;
  const ranges = uniqueUpper(products.map((p) => p.load_range || ''));
  const hasE = ranges.includes('E');

  const paragraph =
    `275/70R18 sits in the sweet spot for full-size trucks and body-on-frame SUVs that need more sidewall and load capacity without stepping into true 35-inch territory. ` +
    `At roughly ${diameterRounded}" overall on an ${rim}" rim (~${sidewall}" sidewall), it adds clearance and a tougher footprint while staying close enough to common truck sizing for daily drivability.`;

  const fitmentNotes = [
    'Often selected for half-ton pickups, body-on-frame SUVs, and overland builds that want near-33" capability.',
    hasE
      ? 'Strong LT / E-load availability for towing, payload, and heavier truck use — match load range to your placard.'
      : 'Confirm load range and service description for towing or payload; LT constructions vary by model.',
    'Expect more rotational mass, slightly heavier steering, a small fuel-economy hit, and a speedometer that can read lower than actual speed vs shorter factory sizes.',
  ];

  return { paragraph, fitmentNotes };
}

function buildExpertIntroBlockGeneric(
  size: string,
  specs: TireSpecs,
  category: TireCategory,
  productCoverage?: TireSizeDataCoverage | null,
): ExpertIntroBlock {
  const display = size.toUpperCase().replace(/^LT/, 'LT');
  const products = productsForExpertIntro(size, category);
  const coverage = productCoverage ?? getTireSizeDataCoverage(size);
  const brandCount = coverage.brands?.length ?? new Set(products.map((p) => p.brand)).size;
  const fullSpec = coverage.fullSpecProducts ?? products.filter((p) => p.data_quality_status === 'full_specs').length;
  const diameter = (Math.round(specs.overallDiameterIn * 10) / 10).toFixed(1);
  const sidewall = specs.sidewallIn.toFixed(1).replace(/\.0$/, '');
  const rim = specs.wheelDiameterIn;
  const availability = categoryAvailabilityPhrase(products);

  let paragraph: string;
  if (category === 'performance') {
    paragraph =
      `${display} is a lower-profile performance size built around sharper steering response and a wider contact patch on an ${rim}" rim. ` +
      `At roughly ${diameter}" overall with about ${sidewall}" of sidewall, it favors dry-road grip and turn-in over the tall cushion of truck or touring sizes. ` +
      (availability ? `${availability} ` : '') +
      `Tradeoffs include a firmer ride and more sensitivity to potholes — confirm wheel diameter and speed rating before swapping.`;
  } else if (category === 'passenger') {
    paragraph =
      `${display} is a common passenger/touring size defined by ${specs.widthMm} mm section width, ${specs.aspectRatio}% aspect ratio, and an ${rim}" rim. ` +
      `At roughly ${diameter}" overall (~${sidewall}" sidewall), it prioritizes everyday ride comfort, wet manners, and replacement availability over truck clearance. ` +
      (availability ? `${availability} ` : '') +
      `Use the comparisons on this page when judging diameter change vs nearby sizes — do not treat marketing fitment lists as a guarantee.`;
  } else if (category === 'SUV') {
    paragraph =
      `${display} sits in the crossover/SUV band: enough sidewall for daily comfort with more footprint than compact passenger sizes. ` +
      `Roughly ${diameter}" overall on an ${rim}" rim (~${sidewall}" sidewall) suits mixed pavement, light gravel, and family hauling. ` +
      (availability ? `${availability} ` : '') +
      `Load range still varies by model — match placard requirements before towing or carrying heavy loads.`;
  } else {
    // off-road / light-truck
    paragraph =
      `${display} is a truck/SUV-oriented size that pairs ${specs.widthMm} mm width with a ${specs.aspectRatio}% sidewall on an ${rim}" rim. ` +
      `At roughly ${diameter}" overall (~${sidewall}" sidewall), it is typically chosen for clearance, load capacity, and mixed on/off-road use rather than max fuel economy. ` +
      (availability ? `${availability} ` : '') +
      `Expect heavier steering and a possible speedometer change vs shorter factory sizes — verify clearance and load range before upgrading.`;
  }

  // Keep to ~3–5 sentences / ~75–95 words when possible
  const words = paragraph.trim().split(/\s+/);
  if (words.length > 95) {
    paragraph = words.slice(0, 95).join(' ').replace(/[,:;]?$/, '.') ;
  }

  const useCaseNote =
    category === 'performance'
      ? 'Strong fit for sporty road use where steering response and dry grip matter more than max sidewall cushion.'
      : category === 'passenger'
        ? 'Strong fit for daily driving, commuting, and common sedan or hatchback replacements.'
        : category === 'SUV'
          ? 'Strong fit for crossovers and SUVs that mix pavement with light gravel or seasonal snow.'
          : 'Strong fit for trucks/SUVs, towing, gravel, trails, or overland use depending on tread choice.';

  const loadNote =
    products.length > 0
      ? `Indexed products include ${brandCount} brand${brandCount === 1 ? '' : 's'} and ${fullSpec} full-spec row${fullSpec === 1 ? '' : 's'}.`
      : 'Manufacturer product rows are still limited for this size — use diameter math and load tables carefully.';

  const tradeoffNote =
    category === 'performance'
      ? 'Tradeoffs may include ride comfort, winter traction, and pothole sensitivity versus taller touring sizes.'
      : category === 'passenger'
        ? 'Tradeoffs may include limited clearance and load capacity versus truck or plus-size upgrades.'
        : 'Tradeoffs may include ride comfort, steering weight, clearance, speedometer change, or fuel economy depending on the jump from stock.';

  return {
    paragraph: paragraph.trim(),
    fitmentNotes: [useCaseNote, loadNote, tradeoffNote],
  };
}
