/**
 * Expert FAQ builders for tire-size detail pages.
 * Hand-written set for 275/70R18; category-aware sets for other sizes.
 */

import type { TireCategory } from '../data/tire-sizes';
import { TIRE_SIZES } from '../data/tire-sizes';
import { formatInchWheel } from './inch-article';
import type { TireSpecs } from './tire-math';
import { getTireSpecs } from './tire-math';
import type { HubFaqItem } from './tire-size-hub';
import type { TireSizeDataCoverage } from './tire-size-products';

export interface ExpertFaqSizeData {
  size: string;
  specs: TireSpecs;
  /** Unique load ranges already computed for this size (e.g. C, D, E). */
  loadRanges?: string[];
  /** Brand names indexed for this size from the master database. */
  brands?: string[];
  category?: TireCategory;
  /** Nearby size used in the comparison FAQ when available. */
  compareTarget?: string | null;
  coverage?: TireSizeDataCoverage | null;
}

/**
 * Expert FAQ set for a tire-size page.
 * Always returns up to 6 size-aware FAQs.
 */
export function getExpertFaqsForTireSize(
  sizeData: ExpertFaqSizeData,
  productCoverage?: TireSizeDataCoverage | null,
): HubFaqItem[] {
  return buildExpertFaqsForTireSize(sizeData, productCoverage);
}

/** Alias required by rollout brief. */
export function buildExpertFaqsForTireSize(
  sizeData: ExpertFaqSizeData,
  productCoverage?: TireSizeDataCoverage | null,
): HubFaqItem[] {
  const sizeKey = sizeData.size.replace(/^lt/i, 'LT').replace(/^p/i, 'P').toUpperCase();
  if (sizeKey === '275/70R18') {
    return buildExpertFaqs27570R18(sizeData);
  }
  return buildExpertFaqsGeneric(sizeData, productCoverage);
}

function formatBrandList(brands: string[]): string {
  const cleaned = brands.map((b) => b.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return 'Michelin, Goodyear, BFGoodrich, Toyo, and Falken where available in the master index';
  }
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(', ')}, and ${cleaned[cleaned.length - 1]}`;
}

function formatRangeList(loadRanges: string[]): string {
  const rangesRaw =
    loadRanges.length > 0
      ? loadRanges.map((r) => r.toUpperCase()).filter(Boolean)
      : [];
  if (rangesRaw.length === 0) return '';
  const preferredOrder = ['E', 'D', 'C', 'F', 'XL', 'SL'];
  const ranges = [
    ...preferredOrder.filter((r) => rangesRaw.includes(r)),
    ...rangesRaw.filter((r) => !preferredOrder.includes(r)),
  ];
  if (ranges.length === 1) return ranges[0];
  if (ranges.length === 2) return `${ranges[0]} and ${ranges[1]}`;
  return `${ranges.slice(0, -1).join(', ')}, and ${ranges[ranges.length - 1]}`;
}

function mainUseCaseLabel(category: TireCategory): string {
  if (category === 'performance') return 'performance driving';
  if (category === 'passenger') return 'daily driving';
  if (category === 'SUV') return 'SUV and crossover use';
  return 'off-road and truck use';
}

function buildExpertFaqs27570R18(sizeData: ExpertFaqSizeData): HubFaqItem[] {
  const { specs, loadRanges = [], brands = [] } = sizeData;
  const diameter = specs.overallDiameterIn.toFixed(2);
  const sidewall = specs.sidewallIn.toFixed(2);
  const rim = specs.wheelDiameterIn;
  const brandList = formatBrandList(brands);

  let compareAnswer =
    '275/70R18 is taller, wider, and usually heavier than 265/70R17. It gives more ground clearance and a larger tire footprint, but it can also slow acceleration slightly, add steering weight, and make the speedometer read lower than actual speed. It is a capability-focused upgrade, not a fuel-economy-focused one.';
  try {
    const other = getTireSpecs('265/70R17');
    const deltaIn = specs.overallDiameterIn - other.overallDiameterIn;
    const deltaPct = (deltaIn / other.overallDiameterIn) * 100;
    compareAnswer =
      `275/70R18 is taller, wider, and usually heavier than 265/70R17 (${diameter}" vs ${other.overallDiameterIn.toFixed(2)}" overall, about +${deltaIn.toFixed(1)}" / +${deltaPct.toFixed(1)}%). ` +
      'It gives more ground clearance and a larger tire footprint, but it can also slow acceleration slightly, add steering weight, and make the speedometer read lower than actual speed. It is a capability-focused upgrade, not a fuel-economy-focused one.';
  } catch {
    /* keep static fallback */
  }

  const rangeList = formatRangeList(loadRanges) || 'C, D, and E';

  return [
    {
      question: 'Is 275/70R18 good for off-road?',
      answer:
        `Yes — 275/70R18 is a strong off-road and overland size because it gives a tall sidewall (about ${sidewall}") on ${formatInchWheel(rim)} while staying below true 35-inch territory (roughly ${diameter}" overall). The extra sidewall helps with rough-road compliance, aired-down traction, and rim protection compared with lower-profile highway sizes. It works especially well when paired with all-terrain, rugged-terrain, or mud-terrain tires.`,
    },
    {
      question: 'What vehicles use 275/70R18 tires?',
      answer:
        '275/70R18 is most often seen on full-size pickups, body-on-frame SUVs, and off-road-oriented truck builds. It is commonly upgraded to on vehicles such as the Ford F-150, Ram 1500, Toyota 4Runner, Chevrolet Silverado 1500, GMC Sierra 1500, and similar 4x4 platforms. Always confirm clearance, wheel offset, trim package, and load requirements before treating it as a direct factory replacement.',
    },
    {
      question: 'What load ranges are available?',
      answer:
        `The most useful load ranges indexed for 275/70R18 are ${rangeList}, depending on the tire model and brand. E-load options are especially common in all-terrain and light-truck products, while some highway or SUV-oriented tires may use lighter-duty service descriptions. Match the load range to your GVWR and intended towing or payload use — not just the size code.`,
    },
    {
      question: 'Which brands make 275/70R18 tires?',
      answer:
        `Indexed master-database coverage for this size includes ${brandList}. Availability still varies by load range, tread type, and season — check the product cards and full-spec table on this page for models currently listed.`,
    },
    {
      question: 'How does 275/70R18 compare to 265/70R17?',
      answer: compareAnswer,
    },
    {
      question: 'What is the load capacity of 275/70R18?',
      answer:
        'Load capacity depends on the exact tire, load index, and load range — not the size alone. Many 275/70R18 light-truck tires are available in E-load versions, often with service descriptions around 125/122, making them suitable for towing, payload, and heavier truck use. Always use the tire manufacturer’s load table and the vehicle placard when setting pressure or carrying heavy loads.',
    },
  ];
}

function buildExpertFaqsGeneric(
  sizeData: ExpertFaqSizeData,
  productCoverage?: TireSizeDataCoverage | null,
): HubFaqItem[] {
  const size = sizeData.size.toUpperCase().replace(/^LT/, 'LT');
  const { specs, loadRanges = [], brands = [] } = sizeData;
  const category =
    sizeData.category ??
    TIRE_SIZES.find((e) => e.size.toUpperCase() === size)?.category ??
    'passenger';
  const coverage = productCoverage ?? sizeData.coverage ?? null;
  const brandList = formatBrandList(
    brands.length ? brands : coverage?.brands ?? [],
  );
  const rangeList = formatRangeList(loadRanges);
  const diameter = specs.overallDiameterIn.toFixed(2);
  const sidewall = specs.sidewallIn.toFixed(2);
  const rim = specs.wheelDiameterIn;
  const wheelPhrase = formatInchWheel(rim);
  const useCase = mainUseCaseLabel(category);
  const compareTarget = sizeData.compareTarget?.toUpperCase() ?? null;

  const useCaseAnswer =
    category === 'performance'
      ? `${size} can be a strong choice for ${useCase} when you want sharper steering and a wider contact patch on ${wheelPhrase} (about ${diameter}" overall, ~${sidewall}" sidewall). It is less ideal if ride comfort, winter traction, or lower replacement cost matter more than dry-road response. Match speed rating and load index to the vehicle placard.`
      : category === 'passenger'
        ? `${size} is generally a solid ${useCase} size — roughly ${diameter}" overall with about ${sidewall}" of sidewall on ${wheelPhrase}. It favors quiet commuting and replacement availability over truck clearance or max performance grip. Always confirm the door placard size before replacing tires.`
        : category === 'SUV'
          ? `${size} works well for ${useCase} when you need a bit more footprint than a compact passenger tire without jumping to a tall truck flotation size. Overall diameter is about ${diameter}" with ~${sidewall}" of sidewall on ${wheelPhrase}. Confirm load range if you tow or haul regularly.`
          : `${size} is a capable ${useCase} size when clearance, load capacity, or mixed trail use matter. At roughly ${diameter}" overall (~${sidewall}" sidewall on ${wheelPhrase}), it sits in the truck/SUV capability band rather than a pure fuel-economy size. Pair it with the right tread and load range for your mileage mix.`;

  const vehiclesAnswer =
    category === 'performance'
      ? `${size} is commonly seen on sporty cars, performance trims, and plus-size upgrades that keep the same ${rim}" rim diameter. Exact OE fitment varies by year and package — treat vehicle lists as directional, not a guarantee. Confirm wheel width, offset, and speed rating before switching.`
      : category === 'passenger'
        ? `${size} shows up as OE or common replacement fitment on many sedans, hatchbacks, and compact crossovers that use ${rim}" wheels. Trim packages and regional markets differ, so verify the placard and tire load/speed markings rather than assuming every model year matches.`
        : `${size} is commonly seen on or upgraded to by owners of trucks, SUVs, and crossover platforms that can clear this diameter. Exact factory fitment depends on trim, wheel offset, and suspension height — confirm clearance and load requirements before treating it as a direct replacement.`;

  const loadAnswer = rangeList
    ? `Indexed products for ${size} include load ranges such as ${rangeList}, depending on brand and model. Load capacity still comes from the load index and inflation table on the specific tire — not the size code alone. Match the load range to your GVWR and intended payload or towing use.`
    : `Load capacity for ${size} depends on the exact tire’s load index, load range, and inflation — not the size alone. When manufacturer rows are sparse for this size, use the sidewall markings and the vehicle placard together. Do not assume every tire in this size shares the same max load.`;

  const brandsAnswer =
    brands.length > 0 || (coverage?.brands?.length ?? 0) > 0
      ? `Indexed master-database coverage for ${size} includes ${brandList}. Availability still varies by load range, tread type, and season — check the product cards and full-spec table on this page for models currently listed.`
      : `We index manufacturer products from Michelin, Goodyear, BFGoodrich, Toyo, and Falken where available. Coverage for ${size} is still limited in the master database, so brand availability may expand as more official rows are imported.`;

  let compareAnswer: string;
  if (compareTarget) {
    try {
      const other = getTireSpecs(compareTarget);
      const deltaIn = specs.overallDiameterIn - other.overallDiameterIn;
      const deltaPct = (deltaIn / other.overallDiameterIn) * 100;
      const taller = deltaIn > 0.05;
      const shorter = deltaIn < -0.05;
      compareAnswer =
        `${size} measures about ${diameter}" overall versus ${other.overallDiameterIn.toFixed(2)}" for ${compareTarget} (${taller ? '+' : ''}${deltaIn.toFixed(1)}" / ${taller ? '+' : ''}${deltaPct.toFixed(1)}%). ` +
        (taller
          ? 'The taller size usually adds clearance and can make the speedometer read lower than actual speed, with a bit more rotational mass.'
          : shorter
            ? 'The shorter size usually trims rotational mass and can raise the speedometer reading relative to actual speed, with less ground clearance.'
            : 'Diameter stays close, so speedometer and clearance changes are typically modest — width and sidewall feel may still differ.') +
        ' Always check fender clearance and load rating before switching.';
    } catch {
      compareAnswer =
        `Compare ${size} against nearby sizes with the tire comparison tools on this site to see diameter change, speedometer impact, and clearance tradeoffs. Even small percentage differences can matter on lowered cars or lifted trucks. Confirm wheel diameter and load markings before you buy.`;
    }
  } else {
    compareAnswer =
      `Use the equivalent and upgrade chips on this page to compare ${size} with nearby sizes. Diameter change drives speedometer error and clearance; width and aspect ratio change stance and ride. Keep jumps modest unless you have verified fender and suspension clearance.`;
  }

  const capacityAnswer =
    'Load capacity depends on the exact tire, load index, and inflation pressure — not the size code alone. Check the manufacturer load table and your vehicle placard when setting pressure or carrying heavy loads. If multiple load ranges exist for this size, choose the one that meets or exceeds the placard requirement.';

  return [
    {
      question: `Is ${size} good for ${useCase}?`,
      answer: useCaseAnswer,
    },
    {
      question: `What vehicles use ${size} tires?`,
      answer: vehiclesAnswer,
    },
    {
      question: 'What load ranges are available?',
      answer: loadAnswer,
    },
    {
      question: `Which brands make ${size} tires?`,
      answer: brandsAnswer,
    },
    {
      question: compareTarget
        ? `How does ${size} compare to ${compareTarget}?`
        : `How does ${size} compare to nearby sizes?`,
      answer: compareAnswer,
    },
    {
      question: `What is the load capacity of ${size}?`,
      answer: capacityAnswer,
    },
  ];
}
