import type { TireCategory } from '../data/tire-sizes';
import { compareTires, getTireSpecs, type TireComparison, type TireSpecs } from './tire-math';
import type { PremiumSpecCard } from './tire-size-hub-content';
import { hubPagePath, comparisonPagePath } from './tire-size-url';
import type { TireSizeHubData } from './tire-size-hub';
import {
  buildAbsoluteRideComfortCopy,
  buildAbsoluteFuelEconomyCopy,
  buildAbsoluteGroundClearanceCopy,
  buildAbsoluteHandlingCopy,
  buildFuelEconomyImpactCopy,
  buildGroundClearanceImpactCopy,
  buildHandlingImpactCopy,
  buildRideComfortImpactCopy,
  buildRpmImpactCopy,
  buildSpeedometerImpactCopy,
  formatImpactCopy,
} from './tire-real-world-impact';
import { rpmAtSpeed } from './tire-comparison-units';
import { getTireSizeEntry } from './tire-size-hub';
import type { HubIconName } from './hub-icons';
import { getPremiumOverride } from './tire-size-premium-overrides';
import { buildPopularComparisonsForSize, isValidComparisonPair } from './tire-comparison-links';
import { classifyTireBadge, parseLoadIndex } from './tire-classification';

export interface PremiumUpgradeCard {
  size: string;
  diameterDiffPercent: number;
  groundClearanceGainIn: number;
  speedoErrorPercent: number;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  href: string;
  comparisonHref: string;
}

export interface CostTier {
  label: string;
  perTire: string;
  setOfFour: string;
  note: string;
}

export type ImpactMetricTone =
  | 'positive'
  | 'info'
  | 'rpm'
  | 'fuel'
  | 'comfort';

export interface ImpactMetric {
  icon: HubIconName;
  label: string;
  value: string;
  meaning: string;
  tone: ImpactMetricTone;
}

export type HeroSpecCard = PremiumSpecCard & {
  icon: PremiumSpecCard['icon'] | 'wheel';
};

function upgradeDifficulty(pct: number): PremiumUpgradeCard['difficulty'] {
  if (Math.abs(pct) <= 2.5) return 'Easy';
  if (Math.abs(pct) <= 5) return 'Moderate';
  return 'Advanced';
}

function buildUpgradeCard(baseSize: string, target: string): PremiumUpgradeCard {
  const cmp = compareTires(baseSize, target, 60);
  const pct = cmp.diameterDiffPercent;
  const hasHub = !!getTireSizeEntry(target);
  return {
    size: target,
    diameterDiffPercent: pct,
    groundClearanceGainIn: cmp.groundClearanceChangeIn,
    speedoErrorPercent: cmp.speedometer.errorPercent,
    difficulty: upgradeDifficulty(pct),
    href: hasHub ? hubPagePath(target) : comparisonPagePath(baseSize, target),
    comparisonHref: comparisonPagePath(baseSize, target),
  };
}

/** Upgrade cards from hub upgrade paths or override targets. */
export function buildAftermarketUpgradeCards(hub: TireSizeHubData): PremiumUpgradeCard[] {
  const override = getPremiumOverride(hub.entry.size);
  const targets = (
    override?.upgradeTargets ??
    hub.upgradePathsUp.slice(0, 3).map((p) => p.size)
  ).filter((target) => isValidComparisonPair(hub.entry.size, target));

  if (targets.length === 0) {
    return hub.quickComparisons
      .slice(0, 3)
      .map((q) => q.size)
      .filter((target) => isValidComparisonPair(hub.entry.size, target))
      .map((t) => buildUpgradeCard(hub.entry.size, t));
  }

  return targets.map((t) => buildUpgradeCard(hub.entry.size, t));
}

export function buildPopularComparisons(hub: TireSizeHubData): { target: string }[] {
  return buildPopularComparisonsForSize(hub.entry.size, 3).map((link) => ({
    target: link.new,
  }));
}

export function buildDefaultCompareTarget(
  hub: TireSizeHubData,
  allSizes: string[],
): string {
  const preferred =
    hub.quickComparisons[0]?.size ??
    hub.equivalents[0]?.size ??
    hub.upgradePathsUp[0]?.size;

  if (preferred && allSizes.includes(preferred)) return preferred;
  return allSizes[0] ?? hub.entry.size;
}

const COST_TIERS_BY_CATEGORY: Record<TireCategory, CostTier[]> = {
  passenger: [
    { label: 'Budget', perTire: '$65 – $95', setOfFour: '$260 – $380', note: 'Economy touring lines, 50k–60k mi treadwear.' },
    { label: 'Mid-range', perTire: '$100 – $140', setOfFour: '$400 – $560', note: 'Michelin Defender, Continental PureContact, Goodyear Assurance.' },
    { label: 'Premium', perTire: '$145 – $195', setOfFour: '$580 – $780', note: 'Low-noise touring compounds with long treadlife warranties.' },
  ],
  performance: [
    { label: 'Budget', perTire: '$95 – $130', setOfFour: '$380 – $520', note: 'UHP value lines with solid dry grip.' },
    { label: 'Mid-range', perTire: '$140 – $200', setOfFour: '$560 – $800', note: 'Michelin Pilot Sport, Continental ExtremeContact, Bridgestone Potenza.' },
    { label: 'Premium', perTire: '$210 – $320', setOfFour: '$840 – $1,280', note: 'Max-performance summer or track-capable compounds.' },
  ],
  SUV: [
    { label: 'Budget', perTire: '$110 – $150', setOfFour: '$440 – $600', note: 'Crossover all-season replacements, 55k–65k mi ratings.' },
    { label: 'Mid-range', perTire: '$155 – $220', setOfFour: '$620 – $880', note: 'Falken Ziex, Michelin CrossClimate, Goodyear Assurance WeatherReady.' },
    { label: 'Premium', perTire: '$225 – $310', setOfFour: '$900 – $1,240', note: '3PMSF-rated all-weather or premium touring SUV compounds.' },
  ],
  'light-truck': [
    { label: 'Budget', perTire: '$140 – $185', setOfFour: '$560 – $740', note: 'Highway-terrain truck tires, 50k–55k mi treadwear.' },
    { label: 'Mid-range', perTire: '$195 – $275', setOfFour: '$780 – $1,100', note: 'Load Range E all-terrain: Falken Wildpeak, Toyo Open Country AT III.' },
    { label: 'Premium', perTire: '$285 – $380', setOfFour: '$1,140 – $1,520', note: 'Heavy-duty towing-rated or 3PMSF premium truck compounds.' },
  ],
  'off-road': [
    { label: 'Budget', perTire: '$165 – $210', setOfFour: '$660 – $840', note: 'Entry all-terrain lines, 40k–50k mi treadwear ratings.' },
    { label: 'Mid-range', perTire: '$230 – $310', setOfFour: '$920 – $1,240', note: 'BFG All-Terrain KO2, Falken Wildpeak AT3W, Toyo Open Country AT III.' },
    { label: 'Premium', perTire: '$320 – $420', setOfFour: '$1,280 – $1,680', note: 'Load Range E, 3PMSF-rated, or dedicated mud-terrain compounds.' },
  ],
};

function buildTypicalUsesExplanation(hub: TireSizeHubData): string {
  const override = getPremiumOverride(hub.entry.size);
  if (override?.typicalUsesExplanation) return override.typicalUsesExplanation;

  const size = hub.displaySize;
  const category = hub.entry.category;

  switch (category) {
    case 'off-road':
      return `${size} is a practical upgrade for owners who want more trail capability and stance without jumping into extreme lift-and-gear builds that punish daily driving.`;
    case 'light-truck':
      return `${size} suits truck owners who need confident load and towing performance while keeping reasonable highway manners and replacement availability.`;
    case 'SUV':
      return `${size} fits crossover and SUV drivers who want a balanced mix of comfort, all-weather confidence, and light trail versatility in one daily setup.`;
    case 'performance':
      return `${size} targets enthusiasts who prioritize steering response and cornering grip over maximum ride softness or all-terrain versatility.`;
    default:
      return `${size} is a strong daily-driver choice when comfort, efficiency, and predictable wet-weather behavior matter more than off-road clearance or track-focused grip.`;
  }
}

function buildFitmentNotes(hub: TireSizeHubData) {
  const override = getPremiumOverride(hub.entry.size);
  if (override?.fitmentNotes) return override.fitmentNotes;

  const size = hub.displaySize;
  const category = hub.entry.category;
  const ref = hub.realWorldImpact;

  const clearanceLine = ref
    ? `Compared with ${ref.referenceSize}, expect roughly ${ref.groundClearanceChangeIn >= 0 ? '+' : ''}${ref.groundClearanceChangeIn.toFixed(2)} in ground clearance change and ${ref.speedoErrorPercent >= 0 ? '+' : ''}${ref.speedoErrorPercent.toFixed(1)}% speedometer difference.`
    : 'Verify clearance at full steering lock and under suspension compression before committing to a full set.';

  switch (category) {
    case 'off-road':
    case 'light-truck':
      return {
        title: `Will ${size} Fit My Vehicle?`,
        points: [
          'Confirm wheel-well clearance at full lock on your exact year, trim, and wheel offset before buying.',
          'Half-ton trucks often need a mild level or lift; full-size SUVs and ¾-ton platforms frequently accept this size with stock suspension.',
          clearanceLine,
          'Match load range and speed rating to your towing and highway use — especially when upsizing from P-metric OEM tires.',
        ],
      };
    case 'SUV':
      return {
        title: `Will ${size} Fit My SUV?`,
        points: [
          'Crossovers with factory plus-size packages usually accept this diameter; always test fitment on your exact wheel width and offset.',
          'Check inner-fender and strut clearance when moving from a shorter OEM size on the same wheel diameter.',
          clearanceLine,
          'Confirm TPMS, spare compatibility, and winter wheel clearance if you run a separate snow set.',
        ],
      };
    case 'performance':
      return {
        title: `Will ${size} Fit My Car?`,
        points: [
          'Verify brake caliper clearance and fender gap on your exact wheel — especially with aftermarket offsets.',
          'Lower-profile sizes can reduce ride comfort on rough roads; confirm your suspension is in good condition before upsizing.',
          clearanceLine,
          'Match speed rating and load index to your vehicle placard — do not downrate for track-day use without understanding tradeoffs.',
        ],
      };
    default:
      return {
        title: `Will ${size} Fit My Vehicle?`,
        points: [
          'Most sedans and compacts accept this size when it matches the OEM wheel diameter and load rating on the door placard.',
          'Upsizing width without changing diameter can affect steering effort and fuel economy — confirm offset stays near factory spec.',
          clearanceLine,
          'Check spare tire well and TPMS compatibility when switching brands or construction types.',
        ],
      };
  }
}

function meaningFromComparison(
  refSize: string,
  size: string,
  specs: TireSpecs,
  cmp: TireComparison,
  builder: (
    sizeA: string,
    sizeB: string,
    comparison: TireComparison,
    specsA: TireSpecs,
    specsB: TireSpecs,
  ) => { measurement: string; engineering: string; practical: string },
): string {
  const specsA = getTireSpecs(refSize);
  return formatImpactCopy(builder(refSize, size, cmp, specsA, specs));
}

function meaningGroundClearance(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
  size: string,
): string {
  if (!cmp || !refSize) {
    return formatImpactCopy(buildAbsoluteGroundClearanceCopy(specs));
  }
  return meaningFromComparison(refSize, size, specs, cmp, buildGroundClearanceImpactCopy);
}

function meaningSpeedometer(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
  size: string,
): string {
  if (!cmp || !refSize) {
    return formatImpactCopy({
      measurement: `Overall diameter ${specs.overallDiameterIn.toFixed(2)} in sets the speedometer calibration baseline.`,
      engineering: `Revs per mile are ${specs.revsPerMile.toFixed(1)} at ${specs.circumferenceIn.toFixed(2)} in circumference per revolution.`,
      practical: `Indicated and true speed align when this size is the factory reference.`,
    });
  }
  const specsA = getTireSpecs(refSize);
  return formatImpactCopy(buildSpeedometerImpactCopy(refSize, size, cmp, specsA, specs, 'imperial'));
}

function meaningRpm(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
  size: string,
): string {
  if (!cmp || !refSize) {
    return formatImpactCopy({
      measurement: `${Math.round(specs.revsPerMile)} revs/mile at ${specs.overallDiameterIn.toFixed(2)} in diameter.`,
      engineering: `Rolling radius ${(specs.overallDiameterIn / 2).toFixed(2)} in sets baseline cruising RPM and effective gearing.`,
      practical: `Highway engine load and acceleration feel reference this revs/mile value.`,
    });
  }
  const specsA = getTireSpecs(refSize);
  const rpmA = Math.round(rpmAtSpeed(60, specsA, 'imperial'));
  const rpmB = Math.round(rpmAtSpeed(60, specs, 'imperial'));
  return formatImpactCopy(
    buildRpmImpactCopy(refSize, size, cmp, specsA, specs, 'imperial', 60, rpmA, rpmB, rpmB - rpmA),
  );
}

function meaningFuel(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
  size: string,
): string {
  if (!cmp || !refSize) {
    return formatImpactCopy(buildAbsoluteFuelEconomyCopy(specs));
  }
  const specsA = getTireSpecs(refSize);
  return formatImpactCopy(buildFuelEconomyImpactCopy(refSize, size, cmp, specsA, specs, 'imperial'));
}

function meaningComfort(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
  size: string,
): string {
  if (!cmp || !refSize) {
    return formatImpactCopy(buildAbsoluteRideComfortCopy(specs));
  }
  return meaningFromComparison(refSize, size, specs, cmp, buildRideComfortImpactCopy);
}

function meaningHandling(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
  size: string,
): string {
  if (!cmp || !refSize) {
    return formatImpactCopy(buildAbsoluteHandlingCopy(specs));
  }
  return meaningFromComparison(refSize, size, specs, cmp, buildHandlingImpactCopy);
}

/** Premium extras for any tire size — computed metrics + category templates. */
export function buildPremiumExtras(hub: TireSizeHubData) {
  const specs = hub.specs;
  const size = hub.entry.size;
  const ref = hub.realWorldImpact;
  const cmp = ref ? compareTires(ref.referenceSize, size, 60) : null;
  const override = getPremiumOverride(size);
  const refSize = ref?.referenceSize ?? null;

  const capabilityBadge = classifyTireBadge({
    aspectRatio: specs.aspectRatio,
    widthMm: specs.widthMm,
    overallDiameterIn: specs.overallDiameterIn,
    category: hub.entry.category,
    loadIndex: parseLoadIndex(hub.ratings?.loadIndex),
  });

  const impactMetrics: ImpactMetric[] = [
    {
      icon: 'chevron-up',
      label: 'Ride Height',
      tone: 'positive',
      value: ref
        ? `${ref.groundClearanceChangeIn >= 0 ? '+' : ''}${ref.groundClearanceChangeIn.toFixed(2)} in`
        : 'Baseline',
      meaning: meaningGroundClearance(specs, cmp, refSize, size),
    },
    {
      icon: 'gauge',
      label: 'Speedometer Impact',
      tone: 'info',
      value: ref
        ? `${ref.speedoErrorPercent >= 0 ? '+' : ''}${ref.speedoErrorPercent.toFixed(1)}%`
        : '0% (baseline)',
      meaning: meaningSpeedometer(specs, cmp, refSize, size),
    },
    {
      icon: 'activity',
      label: 'Highway RPM',
      tone: 'rpm',
      value: `${Math.round(specs.revsPerMile)} revs/mi`,
      meaning: meaningRpm(specs, cmp, refSize, size),
    },
    {
      icon: 'fuel',
      label: 'Fuel Economy',
      tone: 'fuel',
      value: ref && cmp
        ? `${cmp.revsPerMileDiffPercent >= 0 ? '+' : ''}${cmp.revsPerMileDiffPercent.toFixed(1)}% revs`
        : 'Baseline',
      meaning: meaningFuel(specs, cmp, refSize, size),
    },
    {
      icon: 'arrow-up-down',
      label: 'Ride Comfort',
      tone: 'comfort',
      value: ref
        ? `${ref.sidewallDiffIn >= 0 ? '+' : ''}${ref.sidewallDiffIn.toFixed(2)} in sidewall`
        : specs.aspectRatio >= 60 ? 'Taller profile' : 'Lower profile',
      meaning: meaningComfort(specs, cmp, refSize, size),
    },
    {
      icon: capabilityBadge.icon,
      label: 'Capability Class',
      tone: 'positive',
      value: capabilityBadge.label,
      meaning: meaningHandling(specs, cmp, refSize, size),
    },
  ];

  const costTiers = override?.costTiers ?? COST_TIERS_BY_CATEGORY[hub.entry.category];

  const vehicles = hub.vehicleFitment.slice(0, 6);

  return {
    impactMetrics,
    impactExplanations: ref?.explanations ?? [],
    costTiers,
    vehicles,
    fitmentNotes: buildFitmentNotes(hub),
    typicalUsesExplanation: buildTypicalUsesExplanation(hub),
  };
}

/** Six hero specification cards — computed from specs. */
export function buildHeroSpecCards(specs: TireSpecs): HeroSpecCard[] {
  return [
    {
      icon: 'diameter',
      label: 'Overall Diameter',
      value: specs.overallDiameterIn.toFixed(2),
      unit: 'in',
      explanation: 'Affects ride height, gearing, and speedometer accuracy.',
    },
    {
      icon: 'width',
      label: 'Section Width',
      value: specs.sectionWidthIn.toFixed(2),
      unit: 'in',
      explanation: 'Affects traction footprint and steering effort.',
    },
    {
      icon: 'sidewall',
      label: 'Sidewall Height',
      value: specs.sidewallIn.toFixed(2),
      unit: 'in',
      explanation: 'Influences ride comfort and off-road compliance.',
    },
    {
      icon: 'circumference',
      label: 'Circumference',
      value: specs.circumferenceIn.toFixed(2),
      unit: 'in',
      explanation: 'Determines distance traveled per wheel revolution.',
    },
    {
      icon: 'revs',
      label: 'Revs Per Mile',
      value: String(Math.round(specs.revsPerMile)),
      unit: '',
      explanation: 'Used for speedometer and gearing calculations.',
    },
    {
      icon: 'wheel',
      label: 'Wheel Diameter',
      value: String(specs.wheelDiameterIn),
      unit: 'in',
      explanation: 'Determines wheel compatibility and fitment.',
    },
  ];
}

// Backward-compatible aliases