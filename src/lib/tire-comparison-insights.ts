import type { UnitSystem } from './calculator-types';
import { getVehicleFitment, type VehicleFitment } from '../data/vehicle-fitment';
import {
  buildPopularComparisonsForSize,
  buildUpgradePathsFromDatabase,
  type UpgradePathCard,
  type UpgradePathsData,
} from './tire-comparison-links';
import { compareTires, getTireSpecs, type TireComparison, type TireSpecs } from './tire-math';
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
import { fmtDiffWithPct, fmtInQuote, fmtPct, fmtSigned } from './tire-comparison-format';
import {
  FITMENT_DIAMETER_PCT,
  FITMENT_WIDTH_PCT,
  fitmentLabelFromScore,
  fitmentStatusFromThreshold,
  recommendationFromScore,
  rubbingRiskStatus,
  suspensionClearanceStatus,
  verdictLabelFromScore,
  type FitmentStatus,
} from './tire-comparison-fitment';
import {
  buildEngineeringAnalysis,
  buildEngineeringPersonalityBullets,
  buildMeasuredBenefits,
  buildMeasuredConsiderations,
  synthesizeUnderstandingDifference,
  synthesizeUpgradeRecommendation,
  synthesizeWhatChanges,
  synthesizeWhoShouldChoose,
  type EngineeringAnalysis,
} from './tire-comparison-engineering-analysis';
import { applyComparisonQualityGate, type ComparisonQualityResult } from './tire-comparison-quality-validator';
import {
  buildCategoryPersonalityProfile,
  buildCategoryUseCaseTags,
  buildRecommendationContext,
  scoreCategoryPersonalityCards,
} from './tire-comparison-recommendations';
import { buildComparisonPerformanceImpactCards } from './tire-real-world-impact';
import { buildComparisonFaqs, buildFitmentConsiderations } from './tire-comparison-section-copy';
import type {
  ComparisonInsights,
  ComparisonPageIntro,
  ComparisonSummaryChip,
  ComparisonSeoContent,
  FitmentCheckRow,
  KpiCard,
  PerformanceImpactCard,
  PersonalityCard,
  QuickComparisonVerdict,
  SpecTableRow,
  UpgradePersonality,
  VehicleCompatibility,
  VehicleFitmentDisplay,
  WillThisFitRow,
  VerdictLevel,
} from './tire-comparison-types';

export type {
  ComparisonInsights,
  ComparisonPageIntro,
  ComparisonSeoContent,
  ComparisonSummaryChip,
  FitmentCheckRow,
  FitmentStatus,
  KpiCard,
  PerformanceImpactCard,
  PersonalityCard,
  QuickComparisonVerdict,
  SpecTableRow,
  UpgradePersonality,
  VehicleCompatibility,
  VehicleFitmentDisplay,
  VerdictLevel,
  WillThisFitRow,
} from './tire-comparison-types';
export type { UpgradePathCard, UpgradePathsData } from './tire-comparison-links';
export type UpgradePathDifficulty = import('./tire-comparison-links').UpgradePathDifficulty;
export type { ComparisonQualityResult };

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
  analysis: EngineeringAnalysis,
): PersonalityCard[] {
  const bullets = buildEngineeringPersonalityBullets(analysis);
  const categoryScores = scoreCategoryPersonalityCards(recommendationContextFromAnalysis(analysis));

  const cards: Array<PersonalityCard & { score: number }> = [
    {
      id: 'sportier',
      title: 'SPORTIER',
      bullets: bullets.sportier,
      isPrimary: false,
      score: categoryScores.sportier,
    },
    {
      id: 'comfort',
      title: 'COMFORT',
      bullets: bullets.comfort,
      isPrimary: false,
      score: categoryScores.comfort,
    },
    {
      id: 'offroad',
      title: 'OFF-ROAD',
      bullets: bullets.offroad,
      isPrimary: false,
      score: categoryScores.offroad,
    },
  ];

  const sorted = [...cards].sort((a, b) => b.score - a.score);
  const primaryId = sorted[0]?.score ? sorted[0].id : 'comfort';

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
      status: suspensionClearanceStatus(diamPct),
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
      status: fitmentStatusFromThreshold(widthPct, FITMENT_WIDTH_PCT.pass, FITMENT_WIDTH_PCT.warning),
    },
    {
      id: 'suspension',
      label: 'Suspension Clearance',
      status: suspensionClearanceStatus(diamPct),
    },
    {
      id: 'rubbing',
      label: 'Rubbing Risk',
      status: rubbingRiskStatus(diamPct, widthPct),
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


function toneFromSigned(n: number): 'positive' | 'negative' | 'neutral' {
  if (Math.abs(n) < 0.001) return 'neutral';
  return n > 0 ? 'positive' : 'negative';
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

  return fitmentLabelFromScore(score);
}

function recommendationContextFromAnalysis(analysis: EngineeringAnalysis) {
  const m = analysis.measurements;
  return buildRecommendationContext(m.sizeA, m.sizeB, m.comparison, m.specsA, m.specsB, {
    fitmentScore: m.fitmentScore,
    unitSystem: m.unitSystem,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    indicatedSpeed: m.indicatedSpeed,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct,
  });
}

function buildVerdictBestFor(analysis: EngineeringAnalysis): string[] {
  return buildCategoryUseCaseTags(recommendationContextFromAnalysis(analysis));
}

function buildQuickVerdict(
  score: number,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  analysis: EngineeringAnalysis,
): QuickComparisonVerdict {
  const { label, tone, indicator } = verdictLabelFromScore(score);

  return {
    label,
    tone,
    indicator,
    score,
    benefits: buildMeasuredBenefits(analysis),
    considerations: buildMeasuredConsiderations(analysis),
    bestFor: buildVerdictBestFor(analysis),
  };
}

function buildPersonalityProBullets(analysis: EngineeringAnalysis): string[] {
  const ctx = recommendationContextFromAnalysis(analysis);
  const scores = scoreCategoryPersonalityCards(ctx);
  const primary = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    'comfort') as 'sportier' | 'comfort' | 'offroad';
  const bullets = buildEngineeringPersonalityBullets(analysis);
  return bullets[primary].slice(0, 3);
}

function buildPersonality(
  _comparison: TireComparison,
  _specsA: TireSpecs,
  _specsB: TireSpecs,
  analysis: EngineeringAnalysis,
): UpgradePersonality {
  const profile = buildCategoryPersonalityProfile(recommendationContextFromAnalysis(analysis));

  return {
    type: profile.type,
    badge: profile.badge,
    summary: profile.summary,
    pros: buildPersonalityProBullets(analysis),
    cons: buildMeasuredConsiderations(analysis),
  };
}

function buildSeoContent(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  score: number,
  analysis: EngineeringAnalysis,
): ComparisonSeoContent {
  const speedo = fmtPct(comparison.speedometer.errorPercent);
  const upgrade = synthesizeUpgradeRecommendation(analysis);

  const faqs = buildComparisonFaqs(sizeA, sizeB, comparison, specsA, specsB, analysis);

  return {
    title: `${sizeA} vs ${sizeB} Tire Size Comparison | Tire Reference`,
    metaDescription: `Compare ${sizeA} and ${sizeB}: ${fmtPct(comparison.diameterDiffPercent)} diameter change, ${speedo} speedometer impact, fitment score ${score.toFixed(1)}/10, and detailed specs.`,
    h1: 'Tire Size Comparison Calculator',
    whatChanges: synthesizeWhatChanges(analysis, sizeA, sizeB),
    isGoodUpgrade: { headline: upgrade.headline, body: upgrade.body },
    whoShouldChoose: synthesizeWhoShouldChoose(analysis, sizeA, sizeB),
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
  const engineeringAnalysis = buildEngineeringAnalysis(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
    fitment.score,
  );
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

  const performanceCards: PerformanceImpactCard[] = buildComparisonPerformanceImpactCards(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
  );

  const fitmentChecks: FitmentCheckRow[] = [
    {
      id: 'suspension',
      label: 'Suspension Clearance',
      status: suspensionClearanceStatus(comparison.diameterDiffPercent),
      statusLabel: '',
      explanation: `${fmtPct(comparison.diameterDiffPercent)} overall diameter change affects up-travel clearance.`,
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
      status: rubbingRiskStatus(comparison.diameterDiffPercent, widthPct),
      statusLabel: '',
      explanation: 'Estimated based on dimensional deltas versus common fitment margins.',
    },
    {
      id: 'abs',
      label: 'ABS Compatibility',
      status: suspensionClearanceStatus(comparison.diameterDiffPercent),
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

  const personality = buildPersonality(comparison, specsA, specsB, engineeringAnalysis);

  const thingsToConsider = buildFitmentConsiderations(sizeA, sizeB, comparison, specsA, specsB);

  const quickVerdict = buildQuickVerdict(fitment.score, comparison, specsA, specsB, engineeringAnalysis);

  const draft: ComparisonInsights = {
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
    understandingDifference: synthesizeUnderstandingDifference(engineeringAnalysis, sizeA, sizeB),
    personalityCards: buildPersonalityCards(engineeringAnalysis),
    willThisFitRows: buildWillThisFitRows(comparison, specsA, specsB),
    upgradePaths: buildUpgradePathsFromDatabase(sizeA),
    popularComparisons: buildPopularComparisonsForSize(sizeA),
    vehicleCompatibility: buildVehicleCompatibility(sizeA, sizeB),
    seo: buildSeoContent(sizeA, sizeB, comparison, specsA, specsB, fitment.score, engineeringAnalysis),
    engineeringAnalysis,
    qualityValidation: { approved: true },
  };

  const { insights, quality } = applyComparisonQualityGate(draft);
  return { ...insights, qualityValidation: quality };
}

/** Whether a comparison pair passes the content quality gate for publishing. */
export function isComparisonPublishable(sizeA: string, sizeB: string): boolean {
  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);
  const comparison = compareTires(sizeA, sizeB, 60);
  return buildComparisonInsights(sizeA, sizeB, comparison, specsA, specsB).qualityValidation.approved;
}
