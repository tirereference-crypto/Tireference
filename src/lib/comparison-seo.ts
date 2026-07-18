/**
 * Pair-specific SEO copy for static /compare/ pages.
 * Built only from calculated dimensional facts — never generic filler.
 */
import type { TireComparison, TireSpecs } from './tire-math';
import { fmtDiffWithPct, fmtPct, fmtSigned, nearZero } from './tire-comparison-format';
import { formatDisplaySize } from './tire-size-primitives';

export interface ComparisonSeoFacts {
  sizeA: string;
  sizeB: string;
  diameterDiffIn: number;
  diameterDiffPercent: number;
  widthDiffMm: number;
  sidewallDiffIn: number;
  groundClearanceChangeIn: number;
  speedometerErrorPercent: number;
  requiresDifferentWheel: boolean;
  wheelA: number;
  wheelB: number;
}

export interface ComparisonSeoBundle {
  /** Document title without site suffix (Layout/SEO appends brand). */
  title: string;
  metaDescription: string;
  h1: string;
  /** Concise pair-specific answer rendered under the H1. */
  answer: string;
  /** Shared calculator section heading. */
  calculatorHeading: string;
}

export const COMPARISON_CALCULATOR_HEADING = 'Tire Size Comparison Calculator';

function displaySize(size: string): string {
  return formatDisplaySize(size) ?? size;
}

/** Collect the measured facts used by every pair-specific SEO sentence. */
export function buildComparisonSeoFacts(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ComparisonSeoFacts {
  return {
    sizeA: displaySize(sizeA),
    sizeB: displaySize(sizeB),
    diameterDiffIn: comparison.diameterDiffIn,
    diameterDiffPercent: comparison.diameterDiffPercent,
    widthDiffMm: specsB.widthMm - specsA.widthMm,
    sidewallDiffIn: specsB.sidewallIn - specsA.sidewallIn,
    groundClearanceChangeIn: comparison.groundClearanceChangeIn,
    speedometerErrorPercent: comparison.speedometer.errorPercent,
    requiresDifferentWheel: specsA.wheelDiameterIn !== specsB.wheelDiameterIn,
    wheelA: specsA.wheelDiameterIn,
    wheelB: specsB.wheelDiameterIn,
  };
}

export function buildComparisonPageHeading(sizeA: string, sizeB: string): string {
  return `${displaySize(sizeA)} vs ${displaySize(sizeB)} Tire Size Comparison`;
}

export function buildComparisonMetaTitle(sizeA: string, sizeB: string): string {
  return buildComparisonPageHeading(sizeA, sizeB);
}

function widthPhrase(widthDiffMm: number): string {
  if (nearZero(widthDiffMm, 0.5)) return 'section width is unchanged';
  return `section width changes by ${fmtSigned(widthDiffMm, 0, ' mm')}`;
}

function sidewallPhrase(sidewallDiffIn: number): string {
  if (nearZero(sidewallDiffIn, 0.005)) return 'sidewall height is unchanged';
  return `sidewall height changes by ${fmtSigned(sidewallDiffIn, 2, '"')}`;
}

function clearancePhrase(groundClearanceChangeIn: number): string {
  if (nearZero(groundClearanceChangeIn, 0.005)) {
    return 'static ground clearance is essentially unchanged';
  }
  return `static ground clearance shifts by about ${fmtSigned(groundClearanceChangeIn, 2, ' in')}`;
}

function wheelPhrase(facts: ComparisonSeoFacts): string {
  if (!facts.requiresDifferentWheel) {
    return `Both sizes use the same ${facts.wheelA}" wheel diameter.`;
  }
  return `This pair requires a different wheel diameter (${facts.wheelA}" → ${facts.wheelB}").`;
}

/**
 * One concise answer under the H1: calculated deltas only, plus an explicit
 * dimensional-vs-fitment disclaimer.
 */
export function buildComparisonAnswerSummary(facts: ComparisonSeoFacts): string {
  const diameter = nearZero(facts.diameterDiffIn, 0.005)
    ? 'overall diameter is essentially unchanged'
    : `overall diameter changes by ${fmtDiffWithPct(facts.diameterDiffIn, facts.diameterDiffPercent)}`;

  const speedo = nearZero(facts.speedometerErrorPercent, 0.05)
    ? 'Speedometer impact is negligible at 60 mph indicated'
    : `Speedometer impact is about ${fmtPct(facts.speedometerErrorPercent)} at 60 mph indicated`;

  return (
    `${facts.sizeA} vs ${facts.sizeB}: ${diameter}, ${widthPhrase(facts.widthDiffMm)}, ` +
    `${sidewallPhrase(facts.sidewallDiffIn)}, and ${clearancePhrase(facts.groundClearanceChangeIn)}. ` +
    `${speedo}. ${wheelPhrase(facts)} ` +
    `These figures are dimensional calculations only — they do not confirm vehicle fitment.`
  );
}

/** Meta description: densest calculated deltas, no filler marketing. */
export function buildComparisonMetaDescription(facts: ComparisonSeoFacts): string {
  const wheel = facts.requiresDifferentWheel
    ? `Requires ${facts.wheelA}"→${facts.wheelB}" wheels`
    : `Same ${facts.wheelA}" wheel`;

  return (
    `Compare ${facts.sizeA} and ${facts.sizeB}: ` +
    `${fmtDiffWithPct(facts.diameterDiffIn, facts.diameterDiffPercent)} diameter, ` +
    `${fmtSigned(facts.widthDiffMm, 0, ' mm')} width, ` +
    `${fmtSigned(facts.sidewallDiffIn, 2, '"')} sidewall, ` +
    `${fmtSigned(facts.groundClearanceChangeIn, 2, ' in')} clearance, ` +
    `${fmtPct(facts.speedometerErrorPercent)} speedometer. ${wheel}. ` +
    `Dimensional math only — not confirmed vehicle fitment.`
  );
}

export function buildComparisonSeoBundle(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ComparisonSeoBundle {
  const facts = buildComparisonSeoFacts(sizeA, sizeB, comparison, specsA, specsB);
  return {
    title: buildComparisonMetaTitle(sizeA, sizeB),
    metaDescription: buildComparisonMetaDescription(facts),
    h1: buildComparisonPageHeading(sizeA, sizeB),
    answer: buildComparisonAnswerSummary(facts),
    calculatorHeading: COMPARISON_CALCULATOR_HEADING,
  };
}
