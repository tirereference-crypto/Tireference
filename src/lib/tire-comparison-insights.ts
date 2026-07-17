import type { UnitSystem } from './calculator-types';
import { getVehicleFitment, type VehicleFitment } from '../data/vehicle-fitment';
import {
  buildPopularComparisonsForSize,
  buildUpgradePathsFromDatabase,
  comparisonSlugFromSizes,
  POPULAR_COMPARISON_LIMIT,
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
} from './tire-comparison-units';
import { fmtDiffWithPct, fmtInQuote, fmtPct, fmtSigned } from './tire-comparison-format';
import {
  FITMENT_DIAMETER_PCT,
  FITMENT_WIDTH_PCT,
  fitmentLabelFromScore,
  fitmentStatusFromThreshold,
  overallFitStatusFromScore,
  overallFitStatusLabelFromScore,
  recommendationFromScore,
  rubbingRiskStatus,
  suspensionClearanceStatus,
  verdictLabelFromScore,
  type FitmentStatus,
} from './tire-comparison-fitment';
import {
  buildComparisonAnalysis,
  buildEngineeringPersonalityBullets,
  buildMeasuredBenefits,
  buildMeasuredConsiderations,
  synthesizeUpgradeRecommendation,
  synthesizeWhatThisChangeMeans,
  type ComparisonMeasurements,
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
    'Compare two tire sizes side by side to see differences in overall diameter, section width, sidewall height, circumference, revolutions per mile, speedometer error, and wheel requirements.',
};

export function buildComparisonPageIntro(_sizeA?: string, _sizeB?: string): ComparisonPageIntro {
  return COMPARISON_PAGE_INTRO_FALLBACK;
}

export function willThisFitStatusLabel(status: FitmentStatus): 'Safe' | 'Check' | 'Not Recommended' {
  if (status === 'pass') return 'Safe';
  if (status === 'warning') return 'Check';
  return 'Not Recommended';
}

function summaryChipTone(absPct: number, pass: number, warning: number): ComparisonSummaryChip['tone'] {
  if (absPct <= pass) return 'within';
  if (absPct <= warning) return 'caution';
  return 'neutral';
}

function buildSummaryChips(m: ComparisonMeasurements): ComparisonSummaryChip[] {
  const { comparison, widthPct, absDiamPct, absWidthPct, absSpeedoPct } = m;

  return [
    {
      id: 'diameter',
      label: 'Diameter difference',
      value: fmtPct(comparison.diameterDiffPercent),
      tone: summaryChipTone(absDiamPct, FITMENT_DIAMETER_PCT.pass, FITMENT_DIAMETER_PCT.warning),
    },
    {
      id: 'width',
      label: 'Width difference',
      value: fmtPct(widthPct),
      tone: summaryChipTone(absWidthPct, FITMENT_WIDTH_PCT.pass, FITMENT_WIDTH_PCT.warning),
    },
    {
      id: 'speedometer',
      label: 'Speedometer difference',
      value: fmtPct(comparison.speedometer.errorPercent),
      tone: summaryChipTone(absSpeedoPct, FITMENT_DIAMETER_PCT.pass, FITMENT_DIAMETER_PCT.warning),
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

function buildWillThisFitRows(m: ComparisonMeasurements): WillThisFitRow[] {
  const { comparison, fitmentScore, absDiamPct, absWidthPct, absSpeedoPct, wheelDelta } = m;

  const rows: Array<{ id: string; label: string; status: FitmentStatus }> = [
    {
      id: 'overall',
      label: 'Overall Fitment',
      status: overallFitStatusFromScore(fitmentScore),
    },
    {
      id: 'diameter',
      label: 'Diameter Change',
      status: suspensionClearanceStatus(absDiamPct),
    },
    {
      id: 'speedo',
      label: 'Speedometer Accuracy',
      status: absSpeedoPct < 3 ? 'pass' : absSpeedoPct <= 5 ? 'warning' : 'fail',
    },
    {
      id: 'wheel',
      label: 'Wheel Compatibility',
      status: wheelDelta === 0 ? 'pass' : wheelDelta === 1 || wheelDelta === -1 ? 'warning' : 'fail',
    },
    {
      id: 'fender',
      label: 'Fender Clearance',
      status: fitmentStatusFromThreshold(absWidthPct, FITMENT_WIDTH_PCT.pass, FITMENT_WIDTH_PCT.warning),
    },
    {
      id: 'suspension',
      label: 'Suspension Clearance',
      status: suspensionClearanceStatus(absDiamPct),
    },
    {
      id: 'rubbing',
      label: 'Rubbing Risk',
      status: rubbingRiskStatus(comparison.diameterDiffPercent, m.widthPct),
    },
  ];

  return rows.map((row) => ({
    ...row,
    statusLabel:
      row.id === 'overall'
        ? overallFitStatusLabelFromScore(m.fitmentScore)
        : willThisFitStatusLabel(row.status),
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

  const faqs = buildComparisonFaqs(sizeA, sizeB, analysis);

  return {
    title: `${sizeA} vs ${sizeB} Tire Size Comparison | Tire Reference`,
    metaDescription: `Compare ${sizeA} and ${sizeB}: ${fmtPct(comparison.diameterDiffPercent)} diameter change, ${speedo} speedometer impact, fitment score ${score.toFixed(1)}/10, and detailed specs.`,
    h1: 'Tire Size Comparison Calculator',
    isGoodUpgrade: { headline: upgrade.headline, body: upgrade.body },
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
  options?: { omitInternalLinks?: boolean },
): ComparisonInsights {
  const engineeringAnalysis = buildComparisonAnalysis(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
  );
  const m = engineeringAnalysis.measurements;
  const fitment = fitmentLabelFromScore(m.fitmentScore);
  const rec = recommendationFromScore(m.fitmentScore);

  const kpiCards: KpiCard[] = unitSystem === 'metric'
    ? [
        {
          id: 'diameter',
          label: 'Overall Diameter',
          diffAmount: formatDimensionDiff(m.diamDiffIn, unitSystem),
          diffPercent: fmtPct(comparison.diameterDiffPercent),
          originalValue: formatDimension(specsA.overallDiameterIn, unitSystem),
          newValue: formatDimension(specsB.overallDiameterIn, unitSystem),
          icon: 'diameter',
          tone: 'neutral',
        },
        {
          id: 'width',
          label: 'Section Width',
          diffAmount: `${m.widthDiffMm >= 0 ? '+' : '−'}${Math.abs(m.widthDiffMm).toFixed(1)} mm`,
          diffPercent: fmtPct(m.widthPct),
          originalValue: formatDimension(specsA.sectionWidthIn, unitSystem),
          newValue: formatDimension(specsB.sectionWidthIn, unitSystem),
          icon: 'width',
          tone: 'neutral',
        },
        {
          id: 'sidewall',
          label: 'Sidewall Height',
          diffAmount: `${m.sidewallDiffMm >= 0 ? '+' : '−'}${Math.abs(m.sidewallDiffMm).toFixed(1)} mm`,
          diffPercent: fmtPct(m.sidewallPct),
          originalValue: formatDimension(specsA.sidewallIn, unitSystem),
          newValue: formatDimension(specsB.sidewallIn, unitSystem),
          icon: 'sidewall',
          tone: 'neutral',
        },
        {
          id: 'circumference',
          label: 'Circumference',
          diffAmount: formatCircumferenceDiff(m.circumferenceDiffIn, unitSystem),
          diffPercent: fmtPct(comparison.diameterDiffPercent),
          originalValue: formatCircumference(specsA.circumferenceIn, unitSystem),
          newValue: formatCircumference(specsB.circumferenceIn, unitSystem),
          icon: 'circumference',
          tone: 'neutral',
        },
        {
          id: 'speedo',
          label: 'Speedometer Difference',
          diffAmount: fmtSigned(comparison.speedometer.errorPercent, 2, '%'),
          diffPercent: fmtPct(comparison.speedometer.errorPercent),
          originalValue: `${m.indicatedSpeed.toFixed(0)} ${m.speedUnit}`,
          newValue: `${m.trueSpeed.toFixed(1)} ${m.speedUnit} true`,
          icon: 'speedo',
          tone: 'neutral',
        },
        {
          id: 'revs',
          label: formatRevsLabel(unitSystem),
          diffAmount: formatRevsDiff(m.revsDiff, unitSystem, specsA, specsB),
          diffPercent: fmtPct(m.revsDiffPct),
          originalValue: formatRevsValue(specsA, unitSystem),
          newValue: formatRevsValue(specsB, unitSystem),
          icon: 'revs',
          tone: 'neutral',
        },
      ]
    : [
    {
      id: 'diameter',
      label: 'Overall Diameter',
      diffAmount: fmtSigned(m.diamDiffIn, 2, ' in'),
      diffPercent: fmtPct(comparison.diameterDiffPercent),
      originalValue: `${specsA.overallDiameterIn.toFixed(2)} in`,
      newValue: `${specsB.overallDiameterIn.toFixed(2)} in`,
      icon: 'diameter',
      tone: 'neutral',
    },
    {
      id: 'width',
      label: 'Section Width',
      diffAmount: fmtSigned(m.widthDiffIn, 2, ' in'),
      diffPercent: fmtPct(m.widthPct),
      originalValue: `${specsA.sectionWidthIn.toFixed(2)} in`,
      newValue: `${specsB.sectionWidthIn.toFixed(2)} in`,
      icon: 'width',
      tone: 'neutral',
    },
    {
      id: 'sidewall',
      label: 'Sidewall Height',
      diffAmount: fmtSigned(m.sidewallDiffIn, 2, ' in'),
      diffPercent: fmtPct(m.sidewallPct),
      originalValue: `${specsA.sidewallIn.toFixed(2)} in`,
      newValue: `${specsB.sidewallIn.toFixed(2)} in`,
      icon: 'sidewall',
      tone: 'neutral',
    },
    {
      id: 'circumference',
      label: 'Circumference',
      diffAmount: fmtSigned(m.circumferenceDiffIn, 2, ' in'),
      diffPercent: fmtPct(comparison.diameterDiffPercent),
      originalValue: `${specsA.circumferenceIn.toFixed(2)} in`,
      newValue: `${specsB.circumferenceIn.toFixed(2)} in`,
      icon: 'circumference',
      tone: 'neutral',
    },
    {
      id: 'speedo',
      label: 'Speedometer Difference',
      diffAmount: fmtSigned(comparison.speedometer.errorPercent, 2, '%'),
      diffPercent: fmtPct(comparison.speedometer.errorPercent),
      originalValue: `${m.indicatedSpeed.toFixed(0)} mph`,
      newValue: `${m.trueSpeed.toFixed(1)} mph true`,
      icon: 'speedo',
      tone: 'neutral',
    },
    {
      id: 'revs',
      label: 'Revolutions per Mile',
      diffAmount: fmtSigned(m.revsDiff, 0),
      diffPercent: fmtPct(m.revsDiffPct),
      originalValue: formatRevsValue(specsA, unitSystem),
      newValue: formatRevsValue(specsB, unitSystem),
      icon: 'revs',
      tone: 'neutral',
    },
  ];

  const performanceCards: PerformanceImpactCard[] = buildComparisonPerformanceImpactCards(
    engineeringAnalysis,
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
      status: fitmentStatusFromThreshold(m.absWidthPct, 3, 7),
      statusLabel: '',
      explanation: `${unitSystem === 'metric' ? `${m.widthDiffMm >= 0 ? '+' : '−'}${Math.abs(m.widthDiffMm).toFixed(1)} mm` : fmtSigned(m.widthDiffIn, 2, '"')} width change affects outer clearance.`,
    },
    {
      id: 'steering',
      label: 'Steering Clearance',
      status: fitmentStatusFromThreshold(m.absWidthPct + m.absDiamPct * 0.5, 4, 8),
      statusLabel: '',
      explanation: 'Combined width and diameter affect lock-to-lock clearance.',
    },
    {
      id: 'rubbing',
      label: 'Rubbing Risk',
      status: rubbingRiskStatus(comparison.diameterDiffPercent, m.widthPct),
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
      status: fitmentStatusFromThreshold(m.absSpeedoPct, 3, 5),
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
          difference: fmtDiffWithPctUnit(m.diamDiffIn, comparison.diameterDiffPercent, unitSystem),
          tone: toneFromSigned(m.diamDiffIn),
        },
        {
          label: 'Width',
          current: formatDimension(specsA.sectionWidthIn, unitSystem),
          newTire: formatDimension(specsB.sectionWidthIn, unitSystem),
          difference: fmtDiffWithPctUnit(m.widthDiffIn, m.widthPct, unitSystem),
          tone: toneFromSigned(m.widthDiffIn),
        },
        {
          label: 'Sidewall',
          current: formatDimension(specsA.sidewallIn, unitSystem),
          newTire: formatDimension(specsB.sidewallIn, unitSystem),
          difference: fmtDiffWithPctUnit(m.sidewallDiffIn, m.sidewallPct, unitSystem),
          tone: toneFromSigned(m.sidewallDiffIn),
        },
        {
          label: 'Circumference',
          current: formatCircumference(specsA.circumferenceIn, unitSystem),
          newTire: formatCircumference(specsB.circumferenceIn, unitSystem),
          difference: fmtCircDiffWithPct(m.circumferenceDiffIn, comparison.diameterDiffPercent, unitSystem),
          tone: toneFromSigned(m.circumferenceDiffIn),
        },
        {
          label: formatRevsLabel(unitSystem),
          current: formatRevsValue(specsA, unitSystem),
          newTire: formatRevsValue(specsB, unitSystem),
          difference: `${formatRevsDiff(m.revsDiff, unitSystem, specsA, specsB)} (${fmtPct(m.revsDiffPct)})`,
          tone: toneFromSigned(-m.revsDiff),
        },
        {
          label: 'Speedo Error',
          current: '—',
          newTire: fmtPct(comparison.speedometer.errorPercent),
          difference: `At ${m.indicatedSpeed} ${m.speedUnit}`,
          tone: 'neutral',
          differenceVariant: 'info',
        },
      ]
    : [
    {
      label: 'Diameter',
      current: fmtInQuote(specsA.overallDiameterIn),
      newTire: fmtInQuote(specsB.overallDiameterIn),
      difference: fmtDiffWithPct(m.diamDiffIn, comparison.diameterDiffPercent),
      tone: toneFromSigned(m.diamDiffIn),
    },
    {
      label: 'Width',
      current: fmtInQuote(specsA.sectionWidthIn),
      newTire: fmtInQuote(specsB.sectionWidthIn),
      difference: fmtDiffWithPct(m.widthDiffIn, m.widthPct),
      tone: toneFromSigned(m.widthDiffIn),
    },
    {
      label: 'Sidewall',
      current: fmtInQuote(specsA.sidewallIn),
      newTire: fmtInQuote(specsB.sidewallIn),
      difference: fmtDiffWithPct(m.sidewallDiffIn, m.sidewallPct),
      tone: toneFromSigned(m.sidewallDiffIn),
    },
    {
      label: 'Circumference',
      current: fmtInQuote(specsA.circumferenceIn),
      newTire: fmtInQuote(specsB.circumferenceIn),
      difference: fmtDiffWithPct(m.circumferenceDiffIn, comparison.diameterDiffPercent),
      tone: toneFromSigned(m.circumferenceDiffIn),
    },
    {
      label: 'Revs per Mile',
      current: specsA.revsPerMile.toFixed(1),
      newTire: specsB.revsPerMile.toFixed(1),
      difference: `${fmtSigned(m.revsDiff, 1)} (${fmtPct(m.revsDiffPct)})`,
      tone: toneFromSigned(-m.revsDiff),
    },
    {
      label: 'Speedo Error',
      current: '—',
      newTire: fmtPct(comparison.speedometer.errorPercent),
      difference: `At ${m.indicatedSpeed} ${m.speedUnit}`,
      tone: 'neutral',
      differenceVariant: 'info',
    },
  ];

  const personality = buildPersonality(comparison, specsA, specsB, engineeringAnalysis);

  const thingsToConsider = buildFitmentConsiderations(engineeringAnalysis);

  const quickVerdict = buildQuickVerdict(m.fitmentScore, comparison, specsA, specsB, engineeringAnalysis);

  const linkOptions = {
    requirePublished: true,
    excludePagePair: { current: sizeA, new: sizeB },
  } as const;

  const draft: ComparisonInsights = {
    fitmentScore: m.fitmentScore,
    fitmentLabel: fitment.label,
    fitmentTone: fitment.tone,
    starRating: Math.max(1, Math.min(5, Math.round((m.fitmentScore / 10) * 5 * 2) / 2)),
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
    summaryChips: buildSummaryChips(m),
    whatThisChangeMeans: synthesizeWhatThisChangeMeans(engineeringAnalysis, sizeA, sizeB),
    personalityCards: buildPersonalityCards(engineeringAnalysis),
    willThisFitRows: buildWillThisFitRows(m),
    upgradePaths: options?.omitInternalLinks
      ? null
      : buildUpgradePathsFromDatabase(sizeA, linkOptions),
    popularComparisons: options?.omitInternalLinks
      ? []
      : buildPopularComparisonsForSize(sizeA, POPULAR_COMPARISON_LIMIT, linkOptions),
    vehicleCompatibility: buildVehicleCompatibility(sizeA, sizeB),
    seo: buildSeoContent(sizeA, sizeB, comparison, specsA, specsB, m.fitmentScore, engineeringAnalysis),
    engineeringAnalysis,
    qualityValidation: { approved: true },
  };

  const { insights, quality } = applyComparisonQualityGate(draft);
  return { ...insights, qualityValidation: quality };
}

const publishableComparisonCache = new Map<string, boolean>();

/** Whether a comparison pair passes the content quality gate for publishing. */
export function isComparisonPublishable(sizeA: string, sizeB: string): boolean {
  const key = comparisonSlugFromSizes(sizeA, sizeB);
  const cached = publishableComparisonCache.get(key);
  if (cached !== undefined) return cached;

  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);
  const comparison = compareTires(sizeA, sizeB, 60);
  const approved = buildComparisonInsights(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    'imperial',
    { omitInternalLinks: true },
  ).qualityValidation.approved;

  publishableComparisonCache.set(key, approved);
  return approved;
}
