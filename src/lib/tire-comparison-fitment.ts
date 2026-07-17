/**
 * Unified fitment score bands and dimensional check thresholds.
 * All verdict labels, fitment labels, and recommendation copy derive from here.
 */
import type { TireComparison, TireSpecs } from './tire-math';

export type FitmentStatus = 'pass' | 'warning' | 'fail';

/** Fitment score bands — single source for every comparison verdict surface. */
export const FITMENT_SCORE = {
  /** Score at or above this → good upgrade tier. */
  GOOD: 8,
  /** Score at or above this → workable tier (below GOOD). */
  WORKABLE: 5,
} as const;

/** Revs/mile delta treated as meaningful for fuel and RPM copy. */
export const REVS_PER_MILE_THRESHOLD = 3;

/** Dimensional pass/warn/fail thresholds used by fitment tables. */
export const FITMENT_DIAMETER_PCT = { pass: 3, warning: 5 } as const;
export const FITMENT_WIDTH_PCT = { pass: 3, warning: 7 } as const;
export const FITMENT_RUBBING = {
  warnDiameterPct: 3,
  failDiameterPct: 5,
  warnWidthPct: 5,
  failWidthPct: 8,
} as const;

export type VerdictLevel = 'excellent' | 'good' | 'caution' | 'not-recommended';

export type FitmentVerdictTier = 'good' | 'workable' | 'aggressive';

export interface FitmentVerdict {
  tier: FitmentVerdictTier;
  /** SEO block heading under "Is B a good upgrade from A?" */
  headline: string;
  /** Quick verdict badge label */
  shortLabel: string;
  tone: 'green' | 'yellow' | 'red';
  indicator: string;
  fitmentLabel: string;
  level: VerdictLevel;
}

/** Map fitment score to the single verdict copy used across the comparison page. */
export function fitmentVerdictFromScore(score: number): FitmentVerdict {
  if (score >= FITMENT_SCORE.GOOD) {
    return {
      tier: 'good',
      headline: 'Very close dimensional match — vehicle checks still apply',
      shortLabel: 'Very close dimensional match',
      tone: 'green',
      indicator: '🟢',
      fitmentLabel: 'Close dimensional match',
      level: 'excellent',
    };
  }
  if (score >= FITMENT_SCORE.WORKABLE) {
    return {
      tier: 'workable',
      headline: 'Moderate dimensional change — vehicle checks required',
      shortLabel: 'Moderate change — vehicle checks required',
      tone: 'yellow',
      indicator: '🟡',
      fitmentLabel: 'Moderate dimensional change',
      level: 'good',
    };
  }
  return {
    tier: 'aggressive',
    headline: 'Significant dimensional change — vehicle checks required',
    shortLabel: 'Significant dimensional change',
    tone: 'red',
    indicator: '🔴',
    fitmentLabel: 'Significant dimensional change',
    level: 'not-recommended',
  };
}

export function fitmentLabelFromScore(score: number): {
  score: number;
  tone: 'green' | 'yellow' | 'red';
  label: string;
} {
  const verdict = fitmentVerdictFromScore(score);
  return { score, tone: verdict.tone, label: verdict.fitmentLabel };
}

export function recommendationFromScore(score: number): { level: VerdictLevel; label: string } {
  const verdict = fitmentVerdictFromScore(score);
  return { level: verdict.level, label: verdict.shortLabel };
}

export function verdictLabelFromScore(score: number): {
  label: string;
  tone: 'green' | 'yellow' | 'red';
  indicator: string;
} {
  const verdict = fitmentVerdictFromScore(score);
  return {
    label: verdict.shortLabel,
    tone: verdict.tone,
    indicator: verdict.indicator,
  };
}

/** Overall Will This Fit row status derived from the same score bands. */
export function overallFitStatusFromScore(score: number): FitmentStatus {
  if (score >= FITMENT_SCORE.GOOD) return 'pass';
  if (score >= FITMENT_SCORE.WORKABLE) return 'warning';
  return 'fail';
}

export function overallFitStatusLabelFromScore(score: number): string {
  return fitmentVerdictFromScore(score).shortLabel;
}

export function fitmentStatusFromThreshold(
  absPercent: number,
  passMax: number,
  failMin: number,
): FitmentStatus {
  if (absPercent <= passMax) return 'pass';
  if (absPercent <= failMin) return 'warning';
  return 'fail';
}

export function rubbingRiskStatus(diamPct: number, widthPct: number): FitmentStatus {
  const d = Math.abs(diamPct);
  const w = Math.abs(widthPct);
  if (d > FITMENT_RUBBING.failDiameterPct || w > FITMENT_RUBBING.failWidthPct) return 'fail';
  if (d > FITMENT_RUBBING.warnDiameterPct || w > FITMENT_RUBBING.warnWidthPct) return 'warning';
  return 'pass';
}

export function suspensionClearanceStatus(diamPct: number): FitmentStatus {
  return fitmentStatusFromThreshold(
    Math.abs(diamPct),
    FITMENT_DIAMETER_PCT.pass,
    FITMENT_DIAMETER_PCT.warning,
  );
}

/** SEO upgrade headline — score tier plus numeric score for consistency across surfaces. */
export function upgradeHeadlineFromScore(score: number): string {
  const verdict = fitmentVerdictFromScore(score);
  return `${verdict.headline} — dimensional compatibility ${score.toFixed(1)}/10`;
}

/** Fitment score from dimensional deltas — single source for every comparison surface. */
export function computeFitmentScore(
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

/** @deprecated Use upgradeHeadlineFromScore — kept for callers passing dimensional context. */
export function upgradeHeadlineFromAnalysis(
  fitmentScore: number,
  _diameterDiffPercent?: number,
  _widthPct?: number,
  _sizeA?: string,
  _sizeB?: string,
): string {
  return upgradeHeadlineFromScore(fitmentScore);
}
