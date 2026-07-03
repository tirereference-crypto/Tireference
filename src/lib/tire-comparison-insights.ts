import type { UnitSystem } from './calculator-types';
import { getVehicleFitment, type VehicleFitment } from '../data/vehicle-fitment';
import {
  buildPopularComparisonsForSize,
  buildUpgradePathsFromDatabase,
  type PopularComparisonLink,
  type UpgradePathCard,
  type UpgradePathsData,
} from './tire-comparison-links';
import { getTireSpecs, type TireComparison, type TireSpecs } from './tire-math';
import {
  formatCircumference,
  formatCircumferenceDiff,
  formatDimension,
  formatDimensionDiff,
  formatRevsDiff,
  formatRevsLabel,
  formatRevsValue,
  rpmAtSpeed,
  speedUnitLabel,
} from './tire-comparison-units';

export type FitmentStatus = 'pass' | 'warning' | 'fail';
export type VerdictLevel = 'excellent' | 'good' | 'caution' | 'not-recommended';
export type UpgradePersonalityType =
  | 'Comfort Upgrade'
  | 'Off-Road Upgrade'
  | 'Aggressive Street Setup'
  | 'Fuel Economy Focused'
  | 'Balanced Daily Driver';

export interface KpiCard {
  id: string;
  label: string;
  diffAmount: string;
  diffPercent: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface PerformanceImpactCard {
  id: string;
  title: string;
  value: string;
  status: string;
  explanation: string;
  icon: string;
  subtitle?: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'warning';
  badgeStyle?: 'none' | 'dot' | 'diamond' | 'check';
  gaugeNeedle?: number;
}

export interface FitmentCheckRow {
  id: string;
  label: string;
  status: FitmentStatus;
  statusLabel: string;
  explanation: string;
}

export interface UpgradePersonality {
  type: UpgradePersonalityType;
  badge: string;
  summary: string;
  pros: string[];
  cons: string[];
}

export interface SpecTableRow {
  label: string;
  current: string;
  newTire: string;
  difference: string;
  tone: 'positive' | 'negative' | 'neutral';
  differenceVariant?: 'info';
}

export interface ComparisonPageIntro {
  sentence: string;
}

export interface PersonalityCard {
  id: 'sportier' | 'comfort' | 'offroad';
  title: string;
  bullets: string[];
  isPrimary: boolean;
}

export interface WillThisFitRow {
  id: string;
  label: string;
  status: FitmentStatus;
  statusLabel: 'Safe' | 'Check' | 'Not Recommended';
}

export type { UpgradePathCard, UpgradePathsData } from './tire-comparison-links';
export type UpgradePathDifficulty = import('./tire-comparison-links').UpgradePathDifficulty;

export interface VehicleFitmentDisplay {
  label: string;
  detail: string;
}

export interface VehicleCompatibility {
  current: VehicleFitmentDisplay[];
  newTire: VehicleFitmentDisplay[];
}

export interface ComparisonSummaryChip {
  id: string;
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface ComparisonSeoContent {
  title: string;
  metaDescription: string;
  h1: string;
  whatChanges: string;
  isGoodUpgrade: { headline: string; body: string };
  whoShouldChoose: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface QuickComparisonVerdict {
  label: string;
  tone: 'green' | 'yellow' | 'orange' | 'red';
  indicator: string;
  score: number;
  benefits: string[];
  considerations: string[];
  bestFor: string[];
}

export interface ComparisonInsights {
  fitmentScore: number;
  fitmentLabel: string;
  fitmentTone: 'green' | 'yellow' | 'red';
  starRating: number;
  recommendation: VerdictLevel;
  recommendationLabel: string;
  kpiCards: KpiCard[];
  performanceCards: PerformanceImpactCard[];
  fitmentChecks: FitmentCheckRow[];
  thingsToConsider: string[];
  personality: UpgradePersonality;
  specRows: SpecTableRow[];
  quickVerdict: QuickComparisonVerdict;
  pageIntro: ComparisonPageIntro;
  summaryChips: ComparisonSummaryChip[];
  understandingDifference: string;
  personalityCards: PersonalityCard[];
  willThisFitRows: WillThisFitRow[];
  upgradePaths: UpgradePathsData | null;
  popularComparisons: PopularComparisonLink[];
  vehicleCompatibility: VehicleCompatibility;
  seo: ComparisonSeoContent;
}

export const COMPARISON_PAGE_INTRO_FALLBACK: ComparisonPageIntro = {
  sentence:
    'Compare two tire sizes to see differences in overall diameter, width, sidewall height, circumference, speedometer accuracy, and real-world fitment impact.',
};

export function buildComparisonPageIntro(sizeA: string, sizeB: string): ComparisonPageIntro {
  const sentence = `Compare ${sizeA} vs ${sizeB} to see differences in overall diameter, width, sidewall height, circumference, speedometer accuracy, and real-world fitment impact.`;
  return {
    sentence: sentence.length <= 160 ? sentence : `${sentence.slice(0, 157).trimEnd()}…`,
  };
}

export function willThisFitStatusLabel(status: FitmentStatus): 'Safe' | 'Check' | 'Not Recommended' {
  if (status === 'pass') return 'Safe';
  if (status === 'warning') return 'Check';
  return 'Not Recommended';
}

function buildSummaryChips(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ComparisonSummaryChip[] {
  const widthPct = ((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100;

  return [
    {
      id: 'diameter',
      label: 'Diameter',
      value: fmtPct(comparison.diameterDiffPercent),
      tone: toneFromSigned(comparison.diameterDiffPercent),
    },
    {
      id: 'width',
      label: 'Width',
      value: fmtPct(widthPct),
      tone: toneFromSigned(specsB.widthMm - specsA.widthMm),
    },
    {
      id: 'speedometer',
      label: 'Speedometer',
      value: fmtPct(comparison.speedometer.errorPercent),
      tone: toneFromSigned(comparison.speedometer.errorPercent),
    },
  ];
}

function buildPersonalityCards(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): PersonalityCard[] {
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDelta = specsB.widthMm - specsA.widthMm;

  const cards: Array<PersonalityCard & { score: number }> = [
    {
      id: 'sportier',
      title: 'SPORTIER',
      bullets: [
        'Sharper steering response',
        'Lower sidewall feel',
        'Better cornering stability',
      ],
      isPrimary: false,
      score: 0,
    },
    {
      id: 'comfort',
      title: 'COMFORT',
      bullets: [
        'Softer ride quality',
        'Better pothole absorption',
        'Reduced road harshness',
      ],
      isPrimary: false,
      score: 0,
    },
    {
      id: 'offroad',
      title: 'OFF-ROAD',
      bullets: [
        'More ground clearance',
        'Better aired-down capability',
        'Improved trail performance',
      ],
      isPrimary: false,
      score: 0,
    },
  ];

  if (sidewallDiff < -0.05) cards[0].score += 4;
  if (specsB.aspectRatio < specsA.aspectRatio - 2) cards[0].score += 3;
  if (widthDelta > 0 && specsB.aspectRatio <= specsA.aspectRatio) cards[0].score += 2;

  if (sidewallDiff > 0.05) cards[1].score += 4;
  if (specsB.aspectRatio > specsA.aspectRatio + 2) cards[1].score += 3;
  if (specsB.overallDiameterIn > specsA.overallDiameterIn && sidewallDiff > 0) cards[1].score += 1;

  if (comparison.diameterDiffPercent > 2) cards[2].score += 4;
  if (comparison.diameterDiffPercent > 0.75 && sidewallDiff > 0) cards[2].score += 3;
  if (specsB.overallDiameterIn > specsA.overallDiameterIn + 0.35) cards[2].score += 2;

  const sorted = [...cards].sort((a, b) => b.score - a.score);
  const primaryId = sorted[0]?.score ? sorted[0].id : 'sportier';

  return cards.map(({ score: _score, ...card }) => ({
    ...card,
    isPrimary: card.id === primaryId,
  }));
}

function buildWillThisFitRows(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): WillThisFitRow[] {
  const diamPct = Math.abs(comparison.diameterDiffPercent);
  const speedoPct = Math.abs(comparison.speedometer.errorPercent);
  const widthPct = Math.abs(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100);
  const wheelDelta = specsB.wheelDiameterIn - specsA.wheelDiameterIn;

  const rows: Array<{ id: string; label: string; status: FitmentStatus }> = [
    {
      id: 'diameter',
      label: 'Diameter Change',
      status: diamPct < 3 ? 'pass' : diamPct <= 5 ? 'warning' : 'fail',
    },
    {
      id: 'speedo',
      label: 'Speedometer Accuracy',
      status: speedoPct < 3 ? 'pass' : speedoPct <= 5 ? 'warning' : 'fail',
    },
    {
      id: 'wheel',
      label: 'Wheel Compatibility',
      status: wheelDelta === 0 ? 'pass' : wheelDelta === 1 || wheelDelta === -1 ? 'warning' : 'fail',
    },
    {
      id: 'fender',
      label: 'Fender Clearance',
      status: fitmentStatusFromThreshold(widthPct, 3, 7),
    },
    {
      id: 'suspension',
      label: 'Suspension Clearance',
      status: fitmentStatusFromThreshold(diamPct, 3, 5),
    },
    {
      id: 'rubbing',
      label: 'Rubbing Risk',
      status:
        diamPct > 5 || widthPct > 8
          ? 'fail'
          : diamPct > 3 || widthPct > 5
            ? 'warning'
            : 'pass',
    },
  ];

  return rows.map((row) => ({
    ...row,
    statusLabel: willThisFitStatusLabel(row.status),
  }));
}

function formatVehicleDisplay(entry: VehicleFitment): VehicleFitmentDisplay {
  return {
    label: `${entry.manufacturer} ${entry.model}`,
    detail: [entry.trim, entry.yearRange].filter(Boolean).join(' · '),
  };
}

function buildVehicleCompatibility(sizeA: string, sizeB: string): VehicleCompatibility {
  return {
    current: getVehicleFitment(sizeA).map(formatVehicleDisplay),
    newTire: getVehicleFitment(sizeB).map(formatVehicleDisplay),
  };
}

function buildUnderstandingDifference(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): string {
  const signedDiamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDeltaMm = specsB.widthMm - specsA.widthMm;

  // Technical reasoning only — the raw deltas live in the KPI/spec table and
  // performance cards, so this block explains the *mechanisms* rather than
  // repeating the numbers.
  const diamReasoning =
    Math.abs(comparison.diameterDiffPercent) < 0.1
      ? 'keeps the rolling diameter almost identical, so effective gearing, speedometer calibration, and cruising RPM all carry over unchanged'
      : signedDiamDiffIn > 0
        ? 'raises the rolling diameter, which lengthens every revolution and effectively lowers the axle ratio — acceleration softens a little while highway RPM eases down'
        : 'shortens the rolling diameter, which quickens the effective axle ratio — acceleration feels slightly sharper while highway RPM rises';

  const sidewallReasoning =
    Math.abs(sidewallDiff) < 0.1
      ? 'Because sidewall height barely moves, ride compliance and steering precision stay close to the original.'
      : sidewallDiff > 0
        ? 'A taller sidewall behaves like a larger air spring: it absorbs impacts better but flexes more under cornering load, trading a little steering sharpness for ride comfort.'
        : 'A shorter sidewall flexes less under load, sharpening turn-in and steering feedback at the cost of transmitting more road texture into the cabin.';

  const widthReasoning =
    Math.abs(widthDeltaMm) < 2
      ? 'Section width is essentially carried over, so contact patch, grip balance, and steering effort stay familiar.'
      : widthDeltaMm > 0
        ? 'The wider tread enlarges the contact patch, adding dry grip and braking bite but raising steering effort and sensitivity to standing water.'
        : 'The narrower tread trims the contact patch, lowering rolling resistance and improving snow traction while reducing ultimate dry grip.';

  return [
    `Understanding the move from ${sizeA} to ${sizeB} starts with one figure — the ${fmtPct(comparison.diameterDiffPercent)} change in overall diameter — because the rest of the behaviour flows from it and the width and sidewall shifts that accompany it.`,
    `That diameter change ${diamReasoning}.`,
    sidewallReasoning,
    widthReasoning,
    `These effects never act in isolation: diameter drives gearing and speedometer accuracy, sidewall sets the comfort-versus-response balance, and width decides the grip-versus-efficiency trade. The right choice depends on whether you prioritise comfort, sharper response, efficiency, or clearance for how you actually drive.`,
  ].join(' ');
}

function fmtIn(n: number, digits = 2) {
  return `${n.toFixed(digits)} in`;
}

function fmtInQuote(n: number, digits = 2) {
  return `${n.toFixed(digits)}"`;
}

function fmtDiffWithPct(signed: number, pct: number, digits = 2) {
  return `${fmtSigned(signed, digits, '"')} (${fmtPct(pct)})`;
}

function fmtPct(n: number) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function fmtSigned(n: number, digits = 2, suffix = '') {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}${suffix}`;
}

function toneFromSigned(n: number): 'positive' | 'negative' | 'neutral' {
  if (Math.abs(n) < 0.001) return 'neutral';
  return n > 0 ? 'positive' : 'negative';
}

function fitmentStatusFromThreshold(
  value: number,
  passMax: number,
  warnMax: number,
): FitmentStatus {
  const abs = Math.abs(value);
  if (abs <= passMax) return 'pass';
  if (abs <= warnMax) return 'warning';
  return 'fail';
}

type TireClass = 'truck' | 'performance' | 'passenger';

/**
 * Infer the broad vehicle class a tire size belongs to purely from its
 * computed dimensions. Used to keep use-case advice honest — e.g. never
 * recommending overlanding for a sports-car tire or track use for a truck tire.
 */
function classifyTireClass(specs: TireSpecs): TireClass {
  const diameter = specs.overallDiameterIn;
  const aspect = specs.aspectRatio;
  const width = specs.sectionWidthIn;

  if (diameter >= 29 || (aspect >= 60 && width >= 8.5) || (aspect >= 68 && diameter >= 27)) {
    return 'truck';
  }
  if (aspect <= 50 && diameter <= 28) {
    return 'performance';
  }
  return 'passenger';
}

function computeFitmentScore(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): { score: number; tone: 'green' | 'yellow' | 'red'; label: string } {
  let score = 10;
  const diamPct = Math.abs(comparison.diameterDiffPercent);
  const widthPct = Math.abs(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100);
  const speedo = Math.abs(comparison.speedometer.errorPercent);

  score -= diamPct * 0.35;
  score -= widthPct * 0.12;
  score -= speedo * 0.18;
  if (specsB.wheelDiameterIn !== specsA.wheelDiameterIn) score -= 0.6;

  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  if (score >= 8.5) return { score, tone: 'green', label: 'Excellent Fit' };
  if (score >= 6.5) return { score, tone: 'yellow', label: 'Acceptable Fit' };
  return { score, tone: 'red', label: 'Use Caution' };
}

/**
 * Single source of truth for the verdict. Both the recommendation label and
 * the quick-verdict badge derive from the same score bands so they can never
 * disagree:
 *   ≥ 9.5  → Excellent Upgrade
 *   8–9.5  → Good Upgrade
 *   6–8    → Consider Carefully
 *   < 6    → Not Recommended
 */
function recommendationFromScore(score: number): { level: VerdictLevel; label: string } {
  if (score >= 9.5) return { level: 'excellent', label: 'Excellent Upgrade' };
  if (score >= 8) return { level: 'good', label: 'Good Upgrade' };
  if (score >= 6) return { level: 'caution', label: 'Consider Carefully' };
  return { level: 'not-recommended', label: 'Not Recommended' };
}

function verdictLabelFromScore(score: number): Pick<QuickComparisonVerdict, 'label' | 'tone' | 'indicator'> {
  if (score >= 9.5) return { label: 'Excellent Upgrade', tone: 'green', indicator: '🟢' };
  if (score >= 8) return { label: 'Good Upgrade', tone: 'green', indicator: '🟢' };
  if (score >= 6) return { label: 'Consider Carefully', tone: 'yellow', indicator: '🟡' };
  return { label: 'Not Recommended', tone: 'red', indicator: '🔴' };
}

function buildVerdictBenefits(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): string[] {
  const benefits: string[] = [];
  const speedoOk = Math.abs(comparison.speedometer.errorPercent) < 3;
  const widthUp = specsB.widthMm > specsA.widthMm + 3;
  const diamUp = specsB.overallDiameterIn > specsA.overallDiameterIn + 0.05;
  const revsDown = comparison.revsPerMileDiff < -5;
  const sidewallDown = specsB.sidewallIn < specsA.sidewallIn - 0.05;
  const sameWheel = specsB.wheelDiameterIn === specsA.wheelDiameterIn;

  if (speedoOk) benefits.push('Within safe speedometer range');
  if (widthUp) benefits.push('Wider contact patch');
  if (widthUp || diamUp) benefits.push('Improved road presence');
  if (revsDown) benefits.push('Lower highway RPM');
  if (diamUp) benefits.push('Increased ground clearance');
  if (comparison.diameterDiffPercent > 2 && specsB.sidewallIn >= specsA.sidewallIn - 0.05) {
    benefits.push('Better off-road capability');
  }
  if (sidewallDown && (widthUp || specsB.aspectRatio < specsA.aspectRatio - 2)) {
    benefits.push('Improved steering response');
  }
  if (sameWheel && comparison.diameterDiffPercent > 0 && comparison.diameterDiffPercent <= 3) {
    benefits.push('Plus-size on same wheel diameter');
  }
  if (comparison.revsPerMileDiffPercent < -1 && !revsDown) {
    benefits.push('Slightly lower cruising RPM');
  }

  return [...new Set(benefits)].slice(0, 3);
}

function buildVerdictConsiderations(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): string[] {
  const considerations: string[] = [];
  const sidewallDown = specsB.sidewallIn < specsA.sidewallIn - 0.05;
  const widthUp = specsB.widthMm > specsA.widthMm + 5;
  const diamUp = specsB.overallDiameterIn > specsA.overallDiameterIn + 0.05;
  const diamPct = Math.abs(comparison.diameterDiffPercent);
  const widthPct = Math.abs(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100);
  const revsUp = comparison.revsPerMileDiff > 5;
  const wheelDiff = specsB.wheelDiameterIn !== specsA.wheelDiameterIn;

  if (sidewallDown) considerations.push('Firmer ride quality');
  if (diamPct > 3 || widthPct > 5) considerations.push('Possible rubbing risk');
  if (widthUp) considerations.push('Fender clearance should be checked');
  if (widthUp && specsB.widthMm > specsA.widthMm + 8) considerations.push('Increased steering effort');
  if (revsUp || (widthUp && diamUp)) considerations.push('Reduced fuel economy');
  if (diamPct > 5 || (wheelDiff && diamPct > 2)) {
    considerations.push('Suspension modifications may be required');
  }
  if (Math.abs(comparison.speedometer.errorPercent) > 3) {
    considerations.push('Speedometer recalibration may be needed');
  }
  if (wheelDiff && !considerations.some((c) => c.includes('Suspension'))) {
    considerations.push('New wheels required for this tire size');
  }

  return [...new Set(considerations)].slice(0, 3);
}

function buildVerdictBestFor(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): string[] {
  const tags: string[] = [];
  const cls = classifyTireClass(specsB);
  const diamPct = comparison.diameterDiffPercent;
  const balanced =
    Math.abs(diamPct) < 2 && Math.abs(specsB.widthMm - specsA.widthMm) < 8;
  const sport =
    specsB.aspectRatio < specsA.aspectRatio - 2 && specsB.widthMm >= specsA.widthMm - 2;
  const offroad = diamPct > 2 && specsB.sidewallIn >= specsA.sidewallIn - 0.05;
  const overlanding = diamPct > 3;
  const towing = specsB.widthMm > specsA.widthMm + 10;
  const highway =
    comparison.revsPerMileDiff < -3 && Math.abs(comparison.speedometer.errorPercent) < 3;
  const winter =
    specsB.widthMm < specsA.widthMm - 3 ||
    (specsB.sidewallIn > specsA.sidewallIn + 0.1 && specsB.widthMm <= specsA.widthMm);

  if (balanced) tags.push('Daily Driving');
  if (highway) tags.push('Highway Cruising');
  // Handling/track tags apply to car-class tires, never trucks.
  if (sport && cls !== 'truck') tags.push('Sporty Handling');
  if (sport && cls === 'performance') tags.push('Track Days');
  // Off-road / overlanding / towing apply only to truck-class tires.
  if (offroad && cls === 'truck') tags.push('Off-Road Builds');
  if (overlanding && cls === 'truck') tags.push('Overlanding');
  if (towing && cls === 'truck') tags.push('Towing');
  if (winter) tags.push('Winter Driving');

  if (tags.length === 0) tags.push('Daily Driving');

  return [...new Set(tags)].slice(0, 4);
}

function buildQuickVerdict(
  score: number,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): QuickComparisonVerdict {
  const { label, tone, indicator } = verdictLabelFromScore(score);

  return {
    label,
    tone,
    indicator,
    score,
    benefits: buildVerdictBenefits(comparison, specsA, specsB),
    considerations: buildVerdictConsiderations(comparison, specsA, specsB),
    bestFor: buildVerdictBestFor(comparison, specsA, specsB),
  };
}

function buildPersonality(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): UpgradePersonality {
  const diamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDeltaMm = specsB.widthMm - specsA.widthMm;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;

  const taller = diamDiffIn > 0.05;
  const shorter = diamDiffIn < -0.05;
  const wider = widthDeltaMm > 3;
  const narrower = widthDeltaMm < -3;
  const softer = sidewallDiff > 0.1 || aspectDiff > 3;
  const firmer = sidewallDiff < -0.1 || aspectDiff < -3;
  const revsDown = comparison.revsPerMileDiff < -2;
  const revsUp = comparison.revsPerMileDiff > 2;
  const speedoHigh = Math.abs(comparison.speedometer.errorPercent) > 3;
  const cls = classifyTireClass(specsB);

  // Pros — every entry is gated on an actual computed delta, so a benefit is
  // only ever shown when the dimensions truly support it.
  const pros: string[] = [];
  if (taller) pros.push('More ground clearance', 'Better obstacle rollover');
  if (shorter) pros.push('Lower stance and center of gravity', 'Quicker acceleration feel');
  if (wider) pros.push('Larger contact patch for grip');
  if (narrower) pros.push('Lower rolling resistance', 'Better snow and slush traction');
  if (softer) pros.push('Softer ride over bumps');
  if (firmer) pros.push('Sharper steering response');
  if (revsDown) pros.push('Lower highway cruising RPM');
  if (!speedoHigh) pros.push('Speedometer stays within tolerance');

  // Cons — mirror the same deltas so they can never contradict the pros
  // (e.g. "Less ground clearance" only appears when the tire is smaller,
  // "Smaller contact patch" only when the tire is narrower).
  const cons: string[] = [];
  if (taller) cons.push('Slightly slower acceleration', 'Verify fender and liner clearance');
  if (shorter) cons.push('Less ground clearance');
  if (wider) cons.push('Heavier steering effort', 'Rubbing checks at full lock');
  if (narrower) cons.push('Smaller contact patch');
  if (softer) cons.push('More body roll in corners');
  if (firmer) cons.push('Firmer ride quality');
  if (revsUp) cons.push('Higher cruising RPM and fuel use');
  if (speedoHigh) cons.push('Speedometer recalibration advised');

  const prosList = [...new Set(pros)];
  const consList = [...new Set(cons)];
  if (prosList.length === 0) prosList.push('Keeps factory-like drivability');
  if (consList.length === 0) consList.push('Minimal real-world change');

  // Archetype label — category-aware so a truck swap is never called an
  // "Aggressive Street Setup" and a car swap is never called "Off-Road".
  let type: UpgradePersonalityType;
  let badge: string;
  let summary: string;

  if (cls === 'truck' && taller && (wider || softer)) {
    type = 'Off-Road Upgrade';
    badge = 'Trail Ready';
    summary =
      'This swap adds diameter and footprint for clearance-focused truck and SUV builds.';
  } else if (cls !== 'truck' && firmer && wider) {
    type = 'Aggressive Street Setup';
    badge = 'Performance';
    summary =
      'A lower-profile, wider setup that sharpens response and fills out the fenders.';
  } else if ((narrower || (shorter && !wider)) && !taller) {
    type = 'Fuel Economy Focused';
    badge = 'Efficiency';
    summary =
      'A smaller or narrower footprint that trims rolling resistance for lighter daily driving.';
  } else if (softer && !firmer) {
    type = 'Comfort Upgrade';
    badge = 'Comfort';
    summary =
      'Taller sidewalls absorb more impact energy for a smoother ride on rough roads.';
  } else {
    type = 'Balanced Daily Driver';
    badge = 'Balanced';
    summary =
      'A moderate dimensional change that preserves everyday drivability while adjusting stance.';
  }

  return {
    type,
    badge,
    summary,
    pros: prosList.slice(0, 3),
    cons: consList.slice(0, 3),
  };
}

function buildComparisonFaqs(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): Array<{ question: string; answer: string }> {
  const signedDiamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDiffIn = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const speedo = fmtPct(comparison.speedometer.errorPercent);
  const clearance = fmtSigned(comparison.groundClearanceChangeIn, 2, ' in');
  const diamDiff = fmtSigned(signedDiamDiffIn, 2, ' in');
  const widthDiff = fmtSigned(widthDiffIn, 2, ' in');
  const indicated = comparison.speedometer.indicatedSpeed;
  const trueSpeed = comparison.speedometer.trueSpeed.toFixed(1);
  const rpmA = Math.round((indicated * specsA.revsPerMile) / 60);
  const rpmB = Math.round((indicated * specsB.revsPerMile) / 60);
  const rpmDelta = rpmB - rpmA;
  const speedoWithinTolerance = Math.abs(comparison.speedometer.errorPercent) <= 3;
  const widthDeltaMm = specsB.widthMm - specsA.widthMm;
  const aggressiveFitment =
    comparison.diameterDiffPercent > 3 || widthDeltaMm > 10 || Math.abs(signedDiamDiffIn) > 0.75;
  const needsLift = comparison.groundClearanceChangeIn > 0.75;
  const sameWheel = specsB.wheelDiameterIn === specsA.wheelDiameterIn;
  const cls = classifyTireClass(specsB);

  const speedoAnswer = speedoWithinTolerance
    ? `That ${speedo} variance sits within the ±2–3% band most OEMs target for speedometer accuracy, so daily driving and typical enforcement margins are usually unaffected.`
    : `That ${speedo} variance exceeds the commonly cited ±3% OEM tolerance. At highway speeds, a ${Math.abs(comparison.speedometer.errorPercent).toFixed(1)}% error can translate to several mph of drift — enough to affect cruise control, navigation ETA logic, and speed-camera margins. Recalibration via dealer tools, FORScan/HP Tuners (where supported), or an aftermarket speedometer correction module is worth considering before committing long-term.`;

  const rubAnswer = aggressiveFitment
    ? `This is an aggressive dimensional step. A ${diamDiff} diameter increase combined with ${widthDiff} of section width enlarges the tire envelope in every direction — upward into the fender lip, inward toward the strut at full lock, and rearward into the inner liner under compression. Before purchase, cycle the suspension through full droop and full compression (or measure at ride height with a straightedge), check lock-to-lock clearance, and verify that brake caliper and rotor diameter still clear the inner sidewall. Budget for minor trimming, a mild lift, or revised wheel offset if any contact is found.`
    : `The dimensional delta is moderate — ${diamDiff} in diameter and ${widthDiff} in section width — so many vehicles with healthy factory clearance margins can accept this swap without modification. Still verify at full steering lock and under maximum suspension compression; even modest growth can contact the pinch weld or liner on tightly packaged platforms (especially performance sedans and lowered trucks). Wheel offset and backspacing matter as much as tire size.`;

  const liftAnswer = needsLift
    ? `A ${clearance} ground-clearance gain sounds modest on paper, but the effective tire envelope grows by roughly half the diameter change at each corner. On independent front suspension and multi-link rear setups, the tire also moves laterally through its arc during compression. Trucks and SUVs with limited inner-fender space often need a 1–2" lift, fender trimming, or negative-offset wheels to prevent contact at full articulation. Always mock-fit before mounting all four.`
    : `The ${clearance} change in static ride height is small enough that most factory-height vehicles can absorb it without a lift kit. You still gain the full diameter benefit for obstacle clearance and break-over angle — just confirm that the larger tire does not contact the fender, liner, or control arms at full suspension travel before relying on the extra clearance off-road.`;

  const fuelAnswer =
    comparison.revsPerMileDiffPercent > 0
      ? `Revs per mile increase by ${fmtSigned(comparison.revsPerMileDiff, 0)} (${fmtPct(comparison.revsPerMileDiffPercent)}), meaning the engine turns ${Math.abs(rpmDelta)} more RPM at ${indicated} mph (${rpmA} → ${rpmB} RPM). Higher cruising RPM raises internal friction losses and can trim highway fuel economy by 1–3% in real-world driving, though the effect varies with gearing, aerodynamics, and how much the wider contact patch increases rolling resistance. City driving impact is usually smaller because speeds are lower.`
      : `Revs per mile decrease by ${fmtSigned(comparison.revsPerMileDiff, 0)} (${fmtPct(comparison.revsPerMileDiffPercent)}), lowering highway RPM by about ${Math.abs(rpmDelta)} at ${indicated} mph (${rpmA} → ${rpmB} RPM). That can slightly improve fuel economy on long highway runs by reducing engine friction. However, a wider or heavier tire increases rolling resistance and rotational mass, which may partially offset the gain — net economy change is typically 0–2% either direction unless the width step is large.`;

  const wheelAnswer = sameWheel
    ? `Both ${sizeA} and ${sizeB} mount on ${specsA.wheelDiameterIn}" wheels, so your existing rims may work if the internal barrel width and offset support the ${specsB.widthMm} mm section width. As a rule of thumb, each 10 mm of tire width typically needs ~5 mm of additional wheel width. Verify that the new tire's load index and speed rating meet or exceed your vehicle's requirements, and confirm that the wheel's backspacing positions the bead correctly relative to the hub face — incorrect offset is a leading cause of rubbing even when the tire diameter fits.`
    : `These sizes use different wheel diameters (${specsA.wheelDiameterIn}" vs ${specsB.wheelDiameterIn}"), so factory wheels from ${sizeA} cannot mount ${sizeB}. Plus-sizing or minus-sizing requires a complete wheel set matched to the new bead seat diameter, correct hub bore, and load rating. The ${specsB.wheelDiameterIn}" wheel also changes brake clearance geometry — always confirm caliper-to-wheel clearance before purchase.`;

  return [
    {
      question: `How does switching from ${sizeA} to ${sizeB} affect speedometer accuracy and odometer readings?`,
      answer: `Your speedometer and odometer are calibrated to the rolling circumference of the factory tire (${fmtIn(specsA.circumferenceIn)} per revolution). Moving to ${sizeB} (${fmtIn(specsB.circumferenceIn)} circumference) changes revolutions per mile from ${specsA.revsPerMile.toFixed(1)} to ${specsB.revsPerMile.toFixed(1)} — a ${fmtSigned(comparison.revsPerMileDiff, 1)} rev/mi shift. At ${indicated} mph indicated on your cluster, true road speed becomes approximately ${trueSpeed} mph (${speedo} error). ${speedoAnswer} Odometer distance will also skew proportionally: over 10,000 miles, a ${Math.abs(comparison.speedometer.errorPercent).toFixed(1)}% error accumulates to roughly ${Math.abs(comparison.speedometer.errorPercent * 100).toFixed(0)} miles of discrepancy versus actual distance traveled.`,
    },
    {
      question: `What rubbing and fitment risks should I expect when upsizing from ${sizeA} to ${sizeB}?`,
      answer: `${rubAnswer} Key contact points to inspect: front inner fender liner at full lock, rear quarter panel lip under load, pinch weld on the unibody rail, and the leading edge of the rear bumper cutout on short-bed trucks. A wider tire (${widthDiff}, ${fmtPct(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100)}) increases scrub radius slightly, which can add steering effort and transmit more road noise through the rack. If your vehicle uses adaptive cruise, lane-keep, or automatic emergency braking, confirm that radar and camera calibrations are unaffected — some systems are sensitive to ride-height changes.`,
    },
    {
      question: `Do I need a lift kit or fender modification to fit ${sizeB} on a vehicle currently running ${sizeA}?`,
      answer: `${liftAnswer} Static ground clearance changes by ${clearance} because overall diameter shifts ${diamDiff} (${fmtPct(comparison.diameterDiffPercent)}). That half-diameter rule applies at each axle: a ${Math.abs(signedDiamDiffIn).toFixed(2)}" diameter change adds roughly ${Math.abs(signedDiamDiffIn / 2).toFixed(2)}" of clearance under the differential and rocker panels. Approach and departure angles improve proportionally, which matters for off-road and steep driveway transitions. For street-only vehicles, the priority is avoiding contact at full compression rather than maximizing lift height.`,
    },
    {
      question: `How will fuel economy and highway engine RPM change with ${sizeB} versus ${sizeA}?`,
      answer: `${fuelAnswer} Rolling circumference changed ${fmtSigned(comparison.circumferenceDiffIn, 2, ' in')} (${fmtPct(comparison.diameterDiffPercent)}), which is the primary driver of cruising RPM. Sidewall height changed ${fmtSigned(sidewallDiff, 2, ' in')} — ${sidewallDiff < -0.1 ? 'a shorter sidewall reduces flex and heat buildup at speed but transmits more road harshness' : sidewallDiff > 0.1 ? 'a taller sidewall absorbs more impact energy but adds unsprung mass and flex that can slightly increase rolling resistance' : 'sidewall height is nearly unchanged, so rolling resistance from sidewall flex should be minimal'}. For the most accurate estimate, track a full tank before and after the swap on your regular commute.`,
    },
    {
      question: `Can I reuse my factory wheels when switching from ${sizeA} to ${sizeB}?`,
      answer: wheelAnswer,
    },
    {
      question: `How much ground clearance and break-over angle do I gain going from ${sizeA} to ${sizeB}?`,
      answer: `Overall diameter increases ${diamDiff} (${fmtPct(comparison.diameterDiffPercent)}), from ${fmtInQuote(specsA.overallDiameterIn)} to ${fmtInQuote(specsB.overallDiameterIn)}. Static ground clearance at the lowest point (typically the differential pumpkin or exhaust crossmember) rises by approximately ${clearance} — half the diameter delta. Break-over angle improves because the contact patches move farther from the center of the vehicle, reducing the likelihood of high-centering on obstacles. ${signedDiamDiffIn > 0.3 ? (cls === 'truck' ? 'For overlanding and trail use, this is a meaningful gain; pair it with appropriate skid protection since the larger tire also reduces gear ratio effective torque at the wheels.' : 'The larger diameter raises ride height and mildly reduces effective gearing at the wheels; treat it as a stance and clearance change rather than an off-road upgrade.') : signedDiamDiffIn < -0.3 ? 'Note that a smaller diameter reduces clearance and increases break-over vulnerability — confirm this tradeoff aligns with your use case.' : 'The clearance change is modest; do not expect a dramatic capability shift from diameter alone.'}`,
    },
    {
      question: `Will ${sizeB} affect my ABS, traction control, or stability systems compared to ${sizeA}?`,
      answer: `Modern ABS and ESC systems compare wheel-speed sensor inputs across all four corners to detect slip. A ${fmtSigned(comparison.revsPerMileDiff, 1)} rev/mi change alters the expected wheel-speed ratio at any given road speed by ${fmtPct(comparison.revsPerMileDiffPercent)}. ${Math.abs(comparison.revsPerMileDiffPercent) > 3 ? 'Changes above ~3% can cause the ABS module to flag implausible sensor data, potentially triggering warning lights or reducing intervention effectiveness until the system relearns or is recalibrated.' : 'At this magnitude, most factory ABS/ESC modules tolerate the variance without fault codes, though a brief relearn drive cycle (10–15 minutes of mixed driving) helps the system establish new baselines.'} Traction control and hill-descent systems use the same wheel-speed data, so the same tolerance applies. If your vehicle has tire-pressure monitoring, confirm the new size is within the TPMS relearn parameters for your module.`,
    },
    {
      question: `How does the sidewall and width change from ${sizeA} to ${sizeB} affect ride quality and handling?`,
      answer: `Sidewall height moves from ${fmtInQuote(specsA.sidewallIn)} to ${fmtInQuote(specsB.sidewallIn)} (${fmtSigned(sidewallDiff, 2, '"')}, ${fmtPct(((specsB.sidewallIn - specsA.sidewallIn) / specsA.sidewallIn) * 100)}). ${Math.abs(sidewallDiff) > 0.3 ? (sidewallDiff > 0 ? 'Taller sidewalls act as a secondary spring, filtering high-frequency road input and improving comfort on broken pavement — at the cost of slower turn-in response, more body roll in transitions, and reduced steering feedback.' : 'Shorter sidewalls reduce sidewall flex under cornering load, sharpening turn-in and reducing tread squirm for more precise handling — but they transmit more impact energy to the suspension and are more vulnerable to pinch flats and rim damage on potholes.') : 'Sidewall height is similar, so ride/handling character should remain largely unchanged.'} Section width changes ${widthDiff} (${fmtPct(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100)}), which ${widthDiffIn > 0.2 ? 'widens the contact patch for improved dry grip and braking but increases hydroplaning speed threshold sensitivity and steering effort' : widthDiffIn < -0.2 ? 'narrows the footprint, potentially improving snow penetration and reducing rolling resistance at the expense of ultimate dry grip' : 'has minimal effect on contact patch area'}. Match tire compound and tread pattern to your climate and driving style for best results.`,
    },
  ];
}

function buildSeoContent(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  score: number,
): ComparisonSeoContent {
  const signedDiamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const speedo = fmtPct(comparison.speedometer.errorPercent);
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const cls = classifyTireClass(specsB);

  // Fitment-consequence angle. The exact deltas are shown in the KPI cards and
  // spec table directly above, so this block explains what those numbers mean
  // for the wheel well and what to verify — not the numbers themselves.
  const whatChanges = [
    `The specs above quantify exactly how ${sizeB} differs from ${sizeA}; this section covers what those differences do on the vehicle.`,
    signedDiamDiffIn > 0.05
      ? 'A taller tire pushes the tread closer to the fender lip and inner liner at full compression, so up-travel and steering clearance are the first things to verify.'
      : signedDiamDiffIn < -0.05
        ? 'A shorter tire frees up fender clearance but lowers ride height and trims break-over margin off-road.'
        : 'With diameter almost unchanged, fender and liner clearance should closely match the original tire.',
    (specsB.sectionWidthIn - specsA.sectionWidthIn) > 0.1
      ? 'The wider section eats into clearance at the fender edge, pinch weld, and suspension components, so wheel offset matters as much as tire size for this fit.'
      : (specsB.sectionWidthIn - specsA.sectionWidthIn) < -0.1
        ? 'The narrower section relaxes fender-edge clearance and slightly reduces steering effort.'
        : 'Section width is close enough that wheel and fender clearance behave much like the original setup.',
    'Because circumference changes, effective gearing and speedometer calibration shift too — which is why drivetrain feel and cluster readings can differ even when the tire looks similar.',
    `Treat these as calculated starting points: confirm inner fender, suspension, and brake clearance on your exact ${sizeB} wheel and offset before buying.`,
  ].join(' ');

  // Recommendation reasoning. This block explains *why* the fitment score lands
  // where it does — the raw deltas already appear in the KPIs, performance
  // cards, and FAQ, so they are not repeated here.
  let upgradeHeadline = 'Good upgrade for most daily drivers';
  let upgradeBody = [
    `With a fitment score of ${score.toFixed(1)}/10, ${sizeB} stays close enough to ${sizeA} that most vehicles can run it without major modifications.`,
    `That score is high because the change is proportional: no single dimension moves far enough to force a lift, new wheels, or a speedometer recalibration on a healthy factory platform.`,
    `In other words, the tire grows or shrinks evenly rather than pushing one measurement — diameter, width, or drivetrain gearing — past the point where it demands hardware to compensate.`,
    `"Good on paper" still isn't "confirmed on your car," though, so mock-fit at full lock and full compression before committing to a full set.`,
  ].join(' ');

  if (Math.abs(comparison.diameterDiffPercent) > 5) {
    upgradeHeadline = 'Aggressive upgrade — verify fitment carefully';
    upgradeBody = [
      `The ${score.toFixed(1)}/10 score reflects a large jump from ${sizeA} to ${sizeB}: big enough to deliver real clearance and stance gains, but too big to assume it simply bolts on.`,
      `The reason the score drops is compounding risk — when diameter and width grow together, the tire envelope expands in every direction at once, multiplying the chance of contact at the fender, liner, and strut.`,
      `Off-road and lifted builds routinely accept that trade; street vehicles running factory clearance usually need trimming, revised wheel offset, or a mild lift to make it work.`,
      `Plan for a mock-fit and, if diameter moved far, a speedometer or gearing correction before you buy all four.`,
    ].join(' ');
  } else if (Math.abs(comparison.diameterDiffPercent) < 1 && Math.abs(specsB.widthMm - specsA.widthMm) < 5) {
    upgradeHeadline = 'Minor change with limited real-world impact';
    upgradeBody = [
      `The ${score.toFixed(1)}/10 score is high simply because ${sizeB} is dimensionally almost identical to ${sizeA}.`,
      `That is the whole story here — the deltas are small enough that ride height, gearing, steering feel, and speedometer accuracy effectively carry over unchanged.`,
      `This is the ideal profile for a replacement-size, brand, or compound change when you want a slightly different tire without re-engineering fitment.`,
      `Confirm load index, speed rating, and inner clearance anyway, since even tiny growth can rub on lowered or tightly packaged vehicles.`,
    ].join(' ');
  } else if (score < 6) {
    upgradeHeadline = 'Not recommended without fitment planning';
    upgradeBody = [
      `The ${score.toFixed(1)}/10 score places this ${sizeA} to ${sizeB} swap in a higher-risk category.`,
      `It scores low because the diameter, width, and drivetrain changes each push toward the edge of — or past — common fitment and calibration tolerances rather than staying comfortably inside them.`,
      `Rubbing risk climbs fastest when diameter and width grow together, particularly at full lock and under compression.`,
      `Use the figures above to plan the build: expect to validate wheel offset, suspension travel, and fender clearance, and budget for correction hardware before purchasing four tires.`,
    ].join(' ');
  }

  const whoShouldChoose = [
    `Drivers comparing ${sizeA} and ${sizeB} should match the upgrade to how the vehicle is actually used.`,
    `${specsB.aspectRatio >= specsA.aspectRatio ? 'Commuters who want a slightly softer ride' : 'Drivers who prefer sharper response'} may appreciate this change if fitment margins are confirmed.`,
    `${
      specsB.overallDiameterIn > specsA.overallDiameterIn + 0.2
        ? cls === 'truck'
          ? 'Off-road and overlanding builds benefit from the added clearance and break-over improvement.'
          : 'The added diameter raises ride height slightly; confirm clearance if you want that stance.'
        : 'Drivers prioritizing clearance should note the limited diameter gain in this comparison.'
    }`,
    `${
      specsB.widthMm > specsA.widthMm + 5
        ? cls === 'truck'
          ? 'Towing and heavy-load users may prefer the wider footprint but should watch for rubbing at full lock.'
          : 'The wider footprint adds dry grip and stance but check fender clearance at full lock.'
        : 'Highway commuters can treat this as a balanced alternative if speedometer drift stays acceptable.'
    }`,
    `${Math.abs(comparison.speedometer.errorPercent) > 3 ? 'If you rely on precise indicated speed — towing, winter driving, or heavy highway miles — plan around the speedometer drift noted in the summary.' : 'For typical commuting, indicated speed stays close enough to true that most drivers will not notice a difference.'}`,
    `${sidewallDiff < -0.1 ? 'Performance-focused drivers who want firmer response and sharper turn-in are the natural fit for this direction.' : sidewallDiff > 0.1 ? 'Comfort-focused drivers who prioritise a compliant ride over ultimate sharpness are the natural fit for this direction.' : 'Drivers who want to keep the current balance of comfort and response will find this a safe, neutral change.'}`,
    `Anyone unsure about fitment should lean on the Will This Fit checks and a physical mock-fit — the dimensional math is the starting point, not the final answer.`,
  ].join(' ');

  const faqs = buildComparisonFaqs(sizeA, sizeB, comparison, specsA, specsB);

  return {
    title: `${sizeA} vs ${sizeB} Tire Size Comparison | Tire Reference`,
    metaDescription: `Compare ${sizeA} and ${sizeB}: ${fmtPct(comparison.diameterDiffPercent)} diameter change, ${speedo} speedometer impact, fitment score ${score.toFixed(1)}/10, and detailed specs.`,
    h1: 'Tire Size Comparison Calculator',
    whatChanges,
    isGoodUpgrade: { headline: upgradeHeadline, body: upgradeBody },
    whoShouldChoose,
    faqs,
  };
}

function fmtDiffWithPctUnit(signedIn: number, pct: number, unitSystem: UnitSystem) {
  if (unitSystem === 'metric') {
    return `${formatDimensionDiff(signedIn, unitSystem)} (${fmtPct(pct)})`;
  }
  return fmtDiffWithPct(signedIn, pct);
}

function fmtCircDiffWithPct(signedIn: number, pct: number, unitSystem: UnitSystem) {
  return `${formatCircumferenceDiff(signedIn, unitSystem)} (${fmtPct(pct)})`;
}

export function buildComparisonInsights(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem = 'imperial',
): ComparisonInsights {
  const signedDiamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDiffIn = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const widthPct = ((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const sidewallPct = ((specsB.sidewallIn - specsA.sidewallIn) / specsA.sidewallIn) * 100;

  const fitment = computeFitmentScore(comparison, specsA, specsB);
  const rec = recommendationFromScore(fitment.score);
  const speedUnit = speedUnitLabel(unitSystem);
  const indicatedSpeed = comparison.speedometer.indicatedSpeed;
  const trueSpeed = comparison.speedometer.trueSpeed;
  const rpmDelta = Math.round(rpmAtSpeed(indicatedSpeed, specsB, unitSystem) - rpmAtSpeed(indicatedSpeed, specsA, unitSystem));
  const revsDiffPct = unitSystem === 'metric'
    ? ((specsB.revsPerKm - specsA.revsPerKm) / specsA.revsPerKm) * 100
    : comparison.revsPerMileDiffPercent;

  const kpiCards: KpiCard[] = unitSystem === 'metric'
    ? [
        {
          id: 'diameter',
          label: 'Overall Diameter',
          diffAmount: formatDimensionDiff(signedDiamDiffIn, unitSystem),
          diffPercent: fmtPct(comparison.diameterDiffPercent),
          tone: toneFromSigned(comparison.diameterDiffPercent),
        },
        {
          id: 'width',
          label: 'Width',
          diffAmount: `${comparison.widthDiffMm >= 0 ? '+' : '−'}${Math.abs(comparison.widthDiffMm).toFixed(1)} mm`,
          diffPercent: fmtPct(widthPct),
          tone: toneFromSigned(comparison.widthDiffMm),
        },
        {
          id: 'sidewall',
          label: 'Sidewall Height',
          diffAmount: `${comparison.sidewallDiffMm >= 0 ? '+' : '−'}${Math.abs(comparison.sidewallDiffMm).toFixed(1)} mm`,
          diffPercent: fmtPct(sidewallPct),
          tone: toneFromSigned(comparison.sidewallDiffMm),
        },
        {
          id: 'circumference',
          label: 'Circumference',
          diffAmount: formatCircumferenceDiff(comparison.circumferenceDiffIn, unitSystem),
          diffPercent: fmtPct(comparison.diameterDiffPercent),
          tone: toneFromSigned(comparison.circumferenceDiffIn),
        },
        {
          id: 'speedo',
          label: 'Speedometer Error',
          diffAmount: fmtSigned(comparison.speedometer.errorPercent, 2, '%'),
          diffPercent: `${trueSpeed.toFixed(1)} ${speedUnit} true`,
          tone: toneFromSigned(comparison.speedometer.errorPercent),
        },
        {
          id: 'revs',
          label: formatRevsLabel(unitSystem),
          diffAmount: formatRevsDiff(comparison.revsPerMileDiff, unitSystem, specsA, specsB),
          diffPercent: fmtPct(revsDiffPct),
          tone: toneFromSigned(-comparison.revsPerMileDiff),
        },
      ]
    : [
    {
      id: 'diameter',
      label: 'Overall Diameter',
      diffAmount: fmtSigned(signedDiamDiffIn, 2, '"'),
      diffPercent: fmtPct(comparison.diameterDiffPercent),
      tone: toneFromSigned(comparison.diameterDiffPercent),
    },
    {
      id: 'width',
      label: 'Width',
      diffAmount: fmtSigned(widthDiffIn, 2, '"'),
      diffPercent: fmtPct(widthPct),
      tone: toneFromSigned(widthDiffIn),
    },
    {
      id: 'sidewall',
      label: 'Sidewall Height',
      diffAmount: fmtSigned(sidewallDiff, 2, '"'),
      diffPercent: fmtPct(sidewallPct),
      tone: toneFromSigned(sidewallDiff),
    },
    {
      id: 'circumference',
      label: 'Circumference',
      diffAmount: fmtSigned(comparison.circumferenceDiffIn, 2, '"'),
      diffPercent: fmtPct(comparison.diameterDiffPercent),
      tone: toneFromSigned(comparison.circumferenceDiffIn),
    },
    {
      id: 'speedo',
      label: 'Speedometer Error',
      diffAmount: fmtSigned(comparison.speedometer.errorPercent, 2, '%'),
      diffPercent: `${comparison.speedometer.trueSpeed.toFixed(1)} mph true`,
      tone: toneFromSigned(comparison.speedometer.errorPercent),
    },
    {
      id: 'revs',
      label: 'Revs Per Mile',
      diffAmount: fmtSigned(comparison.revsPerMileDiff, 0),
      diffPercent: fmtPct(comparison.revsPerMileDiffPercent),
      tone: toneFromSigned(-comparison.revsPerMileDiff),
    },
  ];

  const clearanceStatus = (changeIn: number) => {
    if (changeIn > 0) {
      return unitSystem === 'metric'
        ? `${(changeIn * 25.4).toFixed(1)} mm Higher`
        : `${changeIn.toFixed(2)}" Higher`;
    }
    if (changeIn < 0) {
      return unitSystem === 'metric'
        ? `${Math.abs(changeIn * 25.4).toFixed(1)} mm Lower`
        : `${Math.abs(changeIn).toFixed(2)}" Lower`;
    }
    return 'No change';
  };

  const performanceCards: PerformanceImpactCard[] = [
    {
      id: 'speedo',
      title: 'Speedometer Error',
      value: fmtPct(comparison.speedometer.errorPercent),
      subtitle: `At ${indicatedSpeed} ${speedUnit}`,
      status: `Actual: ${trueSpeed.toFixed(2)} ${speedUnit}`,
      explanation: `True speed ${trueSpeed.toFixed(1)} ${speedUnit} at ${indicatedSpeed} indicated.`,
      icon: 'speedo',
      tone: Math.abs(comparison.speedometer.errorPercent) <= 3 ? 'positive' : 'warning',
      gaugeNeedle: Math.min(100, Math.max(0, 50 + (comparison.speedometer.errorPercent / 5) * 50)),
    },
    {
      id: 'rpm',
      title: 'RPM Change',
      value: fmtSigned(rpmDelta, 0, ' RPM'),
      subtitle: `At ${indicatedSpeed} ${speedUnit}`,
      status: `Now: ${Math.round(rpmAtSpeed(indicatedSpeed, specsB, unitSystem)).toLocaleString()} RPM`,
      explanation: `${formatRevsDiff(comparison.revsPerMileDiff, unitSystem, specsA, specsB)} ${unitSystem === 'metric' ? 'revs/km' : 'revs/mi'} at highway speed.`,
      icon: 'rpm',
      tone: comparison.revsPerMileDiff > 0 ? 'negative' : comparison.revsPerMileDiff < 0 ? 'positive' : 'neutral',
      gaugeNeedle: Math.min(100, Math.max(0, 50 + (rpmDelta / 250) * 50)),
    },
    {
      id: 'clearance',
      title: 'Ground Clearance',
      value: formatDimensionDiff(comparison.groundClearanceChangeIn, unitSystem),
      status: clearanceStatus(comparison.groundClearanceChangeIn),
      explanation: 'Half the overall diameter difference transfers to axle height.',
      icon: 'clearance',
      tone: comparison.groundClearanceChangeIn > 0 ? 'positive' : comparison.groundClearanceChangeIn < 0 ? 'negative' : 'neutral',
    },
    {
      id: 'height',
      title: 'Ride Height Change',
      value: formatDimensionDiff(comparison.groundClearanceChangeIn, unitSystem),
      status: clearanceStatus(comparison.groundClearanceChangeIn),
      explanation: 'Effective ride height change from tire diameter.',
      icon: 'height',
      tone: comparison.groundClearanceChangeIn > 0 ? 'positive' : comparison.groundClearanceChangeIn < 0 ? 'negative' : 'neutral',
    },
    {
      id: 'handling',
      title: 'Handling Impact',
      value:
        specsB.aspectRatio < specsA.aspectRatio - 2
          ? 'Improved'
          : specsB.aspectRatio > specsA.aspectRatio + 2
            ? 'Softer'
            : 'Balanced',
      status:
        specsB.aspectRatio < specsA.aspectRatio - 2
          ? 'More grip'
          : specsB.aspectRatio > specsA.aspectRatio + 2
            ? 'More comfort'
            : 'Similar response',
      explanation: 'Lower profile sharpens response; taller sidewalls add compliance.',
      icon: 'handling',
      tone: specsB.aspectRatio < specsA.aspectRatio - 2 ? 'positive' : 'neutral',
      badgeStyle: specsB.aspectRatio < specsA.aspectRatio - 2 ? 'check' : 'none',
    },
    {
      id: 'gearing',
      title: 'Gearing Effect',
      value:
        comparison.diameterDiffPercent > 0.2
          ? 'Slightly Taller'
          : comparison.diameterDiffPercent < -0.2
            ? 'Slightly Shorter'
            : 'Neutral',
      status:
        comparison.diameterDiffPercent > 0.2
          ? 'Less acceleration'
          : comparison.diameterDiffPercent < -0.2
            ? 'More acceleration'
            : 'Similar gearing',
      explanation: 'Larger tires reduce effective axle ratio at the same road speed.',
      icon: 'gearing',
      tone: comparison.diameterDiffPercent > 0.2 ? 'warning' : comparison.diameterDiffPercent < -0.2 ? 'positive' : 'neutral',
      badgeStyle: comparison.diameterDiffPercent > 0.2 || comparison.diameterDiffPercent < -0.2 ? 'diamond' : 'none',
    },
  ];

  const fitmentChecks: FitmentCheckRow[] = [
    {
      id: 'suspension',
      label: 'Suspension Clearance',
      status: fitmentStatusFromThreshold(comparison.diameterDiffPercent, 2, 4),
      statusLabel: '',
      explanation: `${fmtPct(comparison.diameterDiffPercent)} diameter change affects up-travel clearance.`,
    },
    {
      id: 'fender',
      label: 'Fender Clearance',
      status: fitmentStatusFromThreshold(widthPct, 3, 7),
      statusLabel: '',
      explanation: `${unitSystem === 'metric' ? `${comparison.widthDiffMm >= 0 ? '+' : '−'}${Math.abs(comparison.widthDiffMm).toFixed(1)} mm` : fmtSigned(widthDiffIn, 2, '"')} width change affects outer clearance.`,
    },
    {
      id: 'steering',
      label: 'Steering Clearance',
      status: fitmentStatusFromThreshold(widthPct + comparison.diameterDiffPercent * 0.5, 4, 8),
      statusLabel: '',
      explanation: 'Combined width and diameter affect lock-to-lock clearance.',
    },
    {
      id: 'rubbing',
      label: 'Rubbing Risk',
      status:
        comparison.diameterDiffPercent > 4 || widthPct > 8
          ? 'fail'
          : comparison.diameterDiffPercent > 2.5 || widthPct > 5
            ? 'warning'
            : 'pass',
      statusLabel: '',
      explanation: 'Estimated based on dimensional deltas versus common fitment margins.',
    },
    {
      id: 'abs',
      label: 'ABS Compatibility',
      status: fitmentStatusFromThreshold(comparison.diameterDiffPercent, 3, 5),
      statusLabel: '',
      explanation: 'Large diameter jumps can affect wheel-speed sensor behavior.',
    },
    {
      id: 'speedo',
      label: 'Speedometer Tolerance',
      status: fitmentStatusFromThreshold(comparison.speedometer.errorPercent, 3, 5),
      statusLabel: '',
      explanation: `${fmtPct(comparison.speedometer.errorPercent)} indicated vs true speed error.`,
    },
  ].map((row) => ({
    ...row,
    statusLabel: row.status === 'pass' ? 'Pass' : row.status === 'warning' ? 'Warning' : 'Fail',
  }));

  const specRows: SpecTableRow[] = unitSystem === 'metric'
    ? [
        {
          label: 'Diameter',
          current: formatDimension(specsA.overallDiameterIn, unitSystem),
          newTire: formatDimension(specsB.overallDiameterIn, unitSystem),
          difference: fmtDiffWithPctUnit(signedDiamDiffIn, comparison.diameterDiffPercent, unitSystem),
          tone: toneFromSigned(signedDiamDiffIn),
        },
        {
          label: 'Width',
          current: formatDimension(specsA.sectionWidthIn, unitSystem),
          newTire: formatDimension(specsB.sectionWidthIn, unitSystem),
          difference: fmtDiffWithPctUnit(widthDiffIn, widthPct, unitSystem),
          tone: toneFromSigned(widthDiffIn),
        },
        {
          label: 'Sidewall',
          current: formatDimension(specsA.sidewallIn, unitSystem),
          newTire: formatDimension(specsB.sidewallIn, unitSystem),
          difference: fmtDiffWithPctUnit(sidewallDiff, sidewallPct, unitSystem),
          tone: toneFromSigned(sidewallDiff),
        },
        {
          label: 'Circumference',
          current: formatCircumference(specsA.circumferenceIn, unitSystem),
          newTire: formatCircumference(specsB.circumferenceIn, unitSystem),
          difference: fmtCircDiffWithPct(comparison.circumferenceDiffIn, comparison.diameterDiffPercent, unitSystem),
          tone: toneFromSigned(comparison.circumferenceDiffIn),
        },
        {
          label: formatRevsLabel(unitSystem),
          current: formatRevsValue(specsA, unitSystem),
          newTire: formatRevsValue(specsB, unitSystem),
          difference: `${formatRevsDiff(comparison.revsPerMileDiff, unitSystem, specsA, specsB)} (${fmtPct(revsDiffPct)})`,
          tone: toneFromSigned(-comparison.revsPerMileDiff),
        },
        {
          label: 'Speedo Error',
          current: '—',
          newTire: fmtPct(comparison.speedometer.errorPercent),
          difference: `At ${indicatedSpeed} ${speedUnit}`,
          tone: 'neutral',
          differenceVariant: 'info',
        },
      ]
    : [
    {
      label: 'Diameter',
      current: fmtInQuote(specsA.overallDiameterIn),
      newTire: fmtInQuote(specsB.overallDiameterIn),
      difference: fmtDiffWithPct(signedDiamDiffIn, comparison.diameterDiffPercent),
      tone: toneFromSigned(signedDiamDiffIn),
    },
    {
      label: 'Width',
      current: fmtInQuote(specsA.sectionWidthIn),
      newTire: fmtInQuote(specsB.sectionWidthIn),
      difference: fmtDiffWithPct(widthDiffIn, widthPct),
      tone: toneFromSigned(widthDiffIn),
    },
    {
      label: 'Sidewall',
      current: fmtInQuote(specsA.sidewallIn),
      newTire: fmtInQuote(specsB.sidewallIn),
      difference: fmtDiffWithPct(sidewallDiff, sidewallPct),
      tone: toneFromSigned(sidewallDiff),
    },
    {
      label: 'Circumference',
      current: fmtInQuote(specsA.circumferenceIn),
      newTire: fmtInQuote(specsB.circumferenceIn),
      difference: fmtDiffWithPct(comparison.circumferenceDiffIn, comparison.diameterDiffPercent),
      tone: toneFromSigned(comparison.circumferenceDiffIn),
    },
    {
      label: 'Revs per Mile',
      current: specsA.revsPerMile.toFixed(1),
      newTire: specsB.revsPerMile.toFixed(1),
      difference: `${fmtSigned(comparison.revsPerMileDiff, 1)} (${fmtPct(comparison.revsPerMileDiffPercent)})`,
      tone: toneFromSigned(-comparison.revsPerMileDiff),
    },
    {
      label: 'Speedo Error',
      current: '—',
      newTire: fmtPct(comparison.speedometer.errorPercent),
      difference: `At ${indicatedSpeed} ${speedUnit}`,
      tone: 'neutral',
      differenceVariant: 'info',
    },
  ];

  const personality = buildPersonality(comparison, specsA, specsB);

  const thingsToConsider = [
    ...personality.pros.map((p) => p),
    ...personality.cons.map((c) => `Tradeoff: ${c}`),
    widthDiffIn > 0.2
      ? 'Wider tire may increase road grip but needs fender clearance verification.'
      : 'Narrower profile may reduce rolling resistance on highway drives.',
    Math.abs(comparison.speedometer.errorPercent) > 3
      ? 'Speedometer error exceeds 3% — consider recalibration for daily driving.'
      : 'Speedometer drift stays within a typical daily-driver tolerance band.',
    signedDiamDiffIn > 0.25
      ? 'Taller tire adds ground clearance but can affect gearing and acceleration.'
      : signedDiamDiffIn < -0.25
        ? 'Smaller tire lowers ride height and may reduce off-road capability.'
        : 'Overall diameter change is moderate for most factory-fit vehicles.',
  ].slice(0, 6);

  const quickVerdict = buildQuickVerdict(fitment.score, comparison, specsA, specsB);

  return {
    fitmentScore: fitment.score,
    fitmentLabel: fitment.label,
    fitmentTone: fitment.tone,
    starRating: Math.max(1, Math.min(5, Math.round((fitment.score / 10) * 5 * 2) / 2)),
    recommendation: rec.level,
    recommendationLabel: rec.label,
    kpiCards,
    performanceCards,
    fitmentChecks,
    thingsToConsider,
    personality,
    specRows,
    quickVerdict,
    pageIntro: buildComparisonPageIntro(sizeA, sizeB),
    summaryChips: buildSummaryChips(comparison, specsA, specsB),
    understandingDifference: buildUnderstandingDifference(sizeA, sizeB, comparison, specsA, specsB),
    personalityCards: buildPersonalityCards(comparison, specsA, specsB),
    willThisFitRows: buildWillThisFitRows(comparison, specsA, specsB),
    upgradePaths: buildUpgradePathsFromDatabase(sizeA),
    popularComparisons: buildPopularComparisonsForSize(sizeA),
    vehicleCompatibility: buildVehicleCompatibility(sizeA, sizeB),
    seo: buildSeoContent(sizeA, sizeB, comparison, specsA, specsB, fitment.score),
  };
}
