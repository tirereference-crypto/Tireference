import type { TireCategory } from '../data/tire-sizes';
import { compareTires, type TireComparison, type TireSpecs } from './tire-math';
import type { PremiumSpecCard } from './tire-size-hub-content';
import { hubPagePath, comparisonPagePath } from './tire-size-url';
import type { TireSizeHubData } from './tire-size-hub';
import { getTireSizeEntry } from './tire-size-hub';
import type { HubIconName } from './hub-icons';
import { getPremiumOverride } from './tire-size-premium-overrides';
import { isValidComparisonPair } from './tire-comparison-links';
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
  const override = getPremiumOverride(hub.entry.size);
  const targets = (
    override?.popularComparisons ??
    hub.quickComparisons.slice(0, 3).map((q) => q.size)
  ).filter((target) => isValidComparisonPair(hub.entry.size, target));

  return targets.map((target) => ({ target }));
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

function signedPctText(n: number): string {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`;
}

function magnitudeWord(
  abs: number,
  small: number,
  large: number,
  words: [string, string, string],
): string {
  if (abs < small) return words[0];
  if (abs < large) return words[1];
  return words[2];
}

/**
 * Real-World Impact card explanations. Each is generated from the calculated
 * dimensional deltas versus the reference size (`cmp`). When no reference size
 * exists the text is derived from the size's own absolute specs — never a
 * generic hardcoded sentence.
 */
function meaningGroundClearance(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
): string {
  if (!cmp || !refSize) {
    return `An overall diameter of ${specs.overallDiameterIn.toFixed(2)} in sets the baseline ride height and axle-to-ground clearance for this size.`;
  }
  const gc = cmp.groundClearanceChangeIn;
  if (Math.abs(gc) < 0.05) {
    return `Overall diameter stays within ${signedPctText(cmp.diameterDiffPercent)} of ${refSize}, so ride height and obstacle clearance are essentially unchanged.`;
  }
  const mag = magnitudeWord(Math.abs(gc), 0.4, 0.9, ['marginally', 'noticeably', 'significantly']);
  return `Ground clearance ${gc > 0 ? 'rises' : 'drops'} by ${Math.abs(gc).toFixed(2)} in (${Math.abs(gc * 25.4).toFixed(0)} mm) at the axle versus ${refSize} — about half the diameter change — ${mag} ${gc > 0 ? 'improving approach and break-over angles' : 'lowering stance and trimming off-road margin'}.`;
}

function meaningSpeedometer(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
): string {
  if (!cmp || !refSize) {
    return `On the factory calibration, indicated and true speed line up at this size's ${specs.overallDiameterIn.toFixed(2)} in diameter baseline.`;
  }
  const err = cmp.speedometer.errorPercent;
  if (Math.abs(err) < 0.1) {
    return `Diameter tracks ${refSize} closely enough that indicated speed stays within 0.1% of true speed — no recalibration needed.`;
  }
  const readsLow = err > 0;
  return `At 60 mph indicated, true speed is ${cmp.speedometer.trueSpeed.toFixed(1)} mph — the speedometer reads about ${Math.abs(err).toFixed(1)}% ${readsLow ? 'low, so you travel faster than the dial shows' : 'high, so you travel slower than the dial shows'}${Math.abs(err) > 3 ? ', enough to be worth recalibrating' : ''}.`;
}

function meaningRpm(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
): string {
  if (!cmp || !refSize) {
    return `At ${Math.round(specs.revsPerMile)} revolutions per mile, this size sets the baseline cruising RPM, effective gearing, and acceleration feel.`;
  }
  const d = cmp.revsPerMileDiff;
  if (Math.abs(d) < 3) {
    return `Revs per mile land within ${Math.round(Math.abs(d))} of ${refSize}, so cruising RPM, gearing, and acceleration feel are effectively unchanged.`;
  }
  const fewer = d < 0;
  const mag = magnitudeWord(Math.abs(cmp.revsPerMileDiffPercent), 1.5, 3.5, ['marginally', 'noticeably', 'substantially']);
  return `Revs per mile ${fewer ? 'fall' : 'rise'} by ${Math.round(Math.abs(d))} (${signedPctText(cmp.revsPerMileDiffPercent)}) versus ${refSize}, ${mag} ${fewer ? 'taller effective gearing — calmer highway RPM but slightly softer acceleration' : 'shorter effective gearing — quicker acceleration but higher highway RPM'}.`;
}

function meaningFuel(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
): string {
  if (!cmp || !refSize) {
    return `Rolling resistance here is driven by ${Math.round(specs.revsPerMile)} revs/mile and a ${specs.sectionWidthIn.toFixed(2)} in tread width, which set steady-state fuel use.`;
  }
  const revPct = cmp.revsPerMileDiffPercent;
  const widthMm = cmp.widthDiffMm;
  const parts: string[] = [];
  if (Math.abs(revPct) >= 0.5) {
    const fewer = revPct < 0;
    parts.push(
      `${Math.abs(revPct).toFixed(1)}% ${fewer ? 'fewer' : 'more'} revs/mile ${fewer ? 'eases highway RPM and can nudge mpg up' : 'raises highway RPM and can nudge mpg down'}`,
    );
  }
  if (Math.abs(widthMm) >= 5) {
    parts.push(
      `the ${Math.abs(widthMm).toFixed(0)} mm ${widthMm > 0 ? 'wider tread adds rolling resistance and mass' : 'narrower tread cuts rolling resistance'}`,
    );
  }
  if (parts.length === 0) {
    return `Revs per mile and tread width barely move versus ${refSize}, so real-world fuel economy should stay flat.`;
  }
  return `Versus ${refSize}, ${parts.join(', while ')} — net highway economy typically shifts within about 3%.`;
}

function meaningComfort(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
): string {
  if (!cmp || !refSize) {
    const tall = specs.aspectRatio >= 60;
    return `A ${specs.sidewallIn.toFixed(2)} in sidewall (${Math.round(specs.aspectRatio)}% aspect) gives this size a ${tall ? 'compliant, comfort-oriented' : 'firm, response-oriented'} baseline ride.`;
  }
  const swMm = cmp.sidewallDiffMm;
  if (Math.abs(swMm) < 2) {
    return `Sidewall height sits within ${Math.abs(swMm).toFixed(0)} mm of ${refSize}, so ride comfort and impact absorption feel familiar.`;
  }
  const taller = swMm > 0;
  const mag = magnitudeWord(Math.abs(swMm), 8, 18, ['slightly', 'noticeably', 'significantly']);
  return `Sidewall height ${taller ? 'increases' : 'decreases'} by ${Math.abs(swMm).toFixed(0)} mm versus ${refSize}, ${mag} ${taller ? 'improving impact absorption over rough roads and potholes' : 'firming the ride and transmitting more road texture'}.`;
}

function meaningHandling(
  specs: TireSpecs,
  cmp: TireComparison | null,
  refSize: string | null,
): string {
  if (!cmp || !refSize) {
    return `A ${specs.sectionWidthIn.toFixed(2)} in contact patch on a ${Math.round(specs.aspectRatio)}% sidewall sets the grip and steering response for this size.`;
  }
  const widthMm = cmp.widthDiffMm;
  const swMm = cmp.sidewallDiffMm;
  const parts: string[] = [];
  if (Math.abs(widthMm) >= 5) {
    const wider = widthMm > 0;
    parts.push(
      `${Math.abs(widthMm).toFixed(0)} mm ${wider ? 'more tread widens the contact patch for stronger grip and braking bite' : 'less tread narrows the contact patch, lightening steering and easing tramlining'}`,
    );
  }
  if (Math.abs(swMm) >= 3) {
    const shorter = swMm < 0;
    parts.push(
      `${Math.abs(swMm).toFixed(0)} mm ${shorter ? 'less sidewall sharpens turn-in and cuts flex under load' : 'more sidewall adds flex and softens turn-in'}`,
    );
  }
  if (parts.length === 0) {
    return `Width and sidewall stay close to ${refSize}, so handling balance and steering response carry over.`;
  }
  const suffix = widthMm > 5 ? ' Expect slightly higher steering effort and standing-water sensitivity.' : '';
  return `Versus ${refSize}, ${parts.join(' and ')}.${suffix}`;
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
      meaning: meaningGroundClearance(specs, cmp, refSize),
    },
    {
      icon: 'gauge',
      label: 'Speedometer Impact',
      tone: 'info',
      value: ref
        ? `${ref.speedoErrorPercent >= 0 ? '+' : ''}${ref.speedoErrorPercent.toFixed(1)}%`
        : '0% (baseline)',
      meaning: meaningSpeedometer(specs, cmp, refSize),
    },
    {
      icon: 'activity',
      label: 'Highway RPM',
      tone: 'rpm',
      value: `${Math.round(specs.revsPerMile)} revs/mi`,
      meaning: meaningRpm(specs, cmp, refSize),
    },
    {
      icon: 'fuel',
      label: 'Fuel Economy',
      tone: 'fuel',
      value: ref && cmp
        ? `${cmp.revsPerMileDiffPercent >= 0 ? '+' : ''}${cmp.revsPerMileDiffPercent.toFixed(1)}% revs`
        : 'Baseline',
      meaning: meaningFuel(specs, cmp, refSize),
    },
    {
      icon: 'arrow-up-down',
      label: 'Ride Comfort',
      tone: 'comfort',
      value: ref
        ? `${ref.sidewallDiffIn >= 0 ? '+' : ''}${ref.sidewallDiffIn.toFixed(2)} in sidewall`
        : specs.aspectRatio >= 60 ? 'Taller profile' : 'Lower profile',
      meaning: meaningComfort(specs, cmp, refSize),
    },
    {
      icon: capabilityBadge.icon,
      label: 'Capability Class',
      tone: 'positive',
      value: capabilityBadge.label,
      meaning: meaningHandling(specs, cmp, refSize),
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
export const build275PremiumExtras = buildPremiumExtras;
export const build275HeroSpecCards = buildHeroSpecCards;
