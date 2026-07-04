/**
 * Unified fitment score bands and dimensional check thresholds.
 * All verdict labels, fitment labels, and recommendation copy derive from here.
 */

export type FitmentStatus = 'pass' | 'warning' | 'fail';

/** Fitment score bands — aligned across label, verdict, and recommendation body. */
export const FITMENT_SCORE = {
  EXCELLENT: 8.5,
  ACCEPTABLE: 6.5,
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

export function fitmentLabelFromScore(score: number): {
  score: number;
  tone: 'green' | 'yellow' | 'red';
  label: string;
} {
  if (score >= FITMENT_SCORE.EXCELLENT) return { score, tone: 'green', label: 'Excellent Fit' };
  if (score >= FITMENT_SCORE.ACCEPTABLE) return { score, tone: 'yellow', label: 'Acceptable Fit' };
  return { score, tone: 'red', label: 'Use Caution' };
}

export function recommendationFromScore(score: number): { level: VerdictLevel; label: string } {
  if (score >= FITMENT_SCORE.EXCELLENT) return { level: 'excellent', label: 'Excellent Upgrade' };
  if (score >= FITMENT_SCORE.ACCEPTABLE) return { level: 'good', label: 'Good Upgrade' };
  return { level: 'not-recommended', label: 'Not Recommended' };
}

export function verdictLabelFromScore(score: number): {
  label: string;
  tone: 'green' | 'yellow' | 'red';
  indicator: string;
} {
  if (score >= FITMENT_SCORE.EXCELLENT) {
    return { label: 'Excellent Upgrade', tone: 'green', indicator: '🟢' };
  }
  if (score >= FITMENT_SCORE.ACCEPTABLE) {
    return { label: 'Good Upgrade', tone: 'yellow', indicator: '🟡' };
  }
  return { label: 'Not Recommended', tone: 'red', indicator: '🔴' };
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

/** SEO headline aligned with fitment score bands and dimensional step size. */
export function upgradeHeadlineFromAnalysis(
  fitmentScore: number,
  diameterDiffPercent: number,
  widthPct: number,
  sizeA: string,
  sizeB: string,
): string {
  const diam = Math.abs(diameterDiffPercent);
  const width = Math.abs(widthPct);

  if (fitmentScore < FITMENT_SCORE.ACCEPTABLE) {
    return `Higher-risk fitment — score ${fitmentScore.toFixed(1)}/10 needs planning`;
  }
  if (diam > FITMENT_DIAMETER_PCT.warning) {
    return `Large dimensional step — fitment score ${fitmentScore.toFixed(1)}/10 requires verification`;
  }
  if (diam < 1 && width < 2) {
    return `Minor dimensional change — fitment score ${fitmentScore.toFixed(1)}/10`;
  }
  if (fitmentScore >= FITMENT_SCORE.EXCELLENT) {
    return `Strong fit — score ${fitmentScore.toFixed(1)}/10 for ${sizeA} → ${sizeB}`;
  }
  return `Measured fit — score ${fitmentScore.toFixed(1)}/10 for ${sizeA} → ${sizeB}`;
}
