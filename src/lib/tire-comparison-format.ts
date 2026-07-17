/** Shared number formatting for comparison copy — single source for prose and cards. */
import type { TireSpecs } from './tire-math';

export function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtSigned(n: number, digits = 2, suffix = ''): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(digits)}${suffix}`;
}

export function fmtInQuote(n: number, digits = 2): string {
  return `${n.toFixed(digits)}"`;
}

export function nearZero(n: number, threshold: number): boolean {
  return Math.abs(n) < threshold;
}

/** Sidewall % change bands for ride/handling copy — matches spec-table sidewallPct (B − A). */
export const SIDEWALL_CHANGE_PCT = {
  /** |sidewallPct| below this → largely unchanged ride character. */
  UNCHANGED: 3,
  /** |sidewallPct| above this → significant ride/handling shift. */
  SIGNIFICANT: 10,
} as const;

export type SidewallRideTier = 'unchanged' | 'noticeable' | 'significant';

/** Signed sidewall percent change (B − A) / A × 100 — same formula as comparison measurements. */
export function sidewallPctFromSpecs(specsA: TireSpecs, specsB: TireSpecs): number {
  return ((specsB.sidewallIn - specsA.sidewallIn) / specsA.sidewallIn) * 100;
}

export function sidewallRideTier(sidewallPct: number): SidewallRideTier {
  const abs = Math.abs(sidewallPct);
  if (abs < SIDEWALL_CHANGE_PCT.UNCHANGED) return 'unchanged';
  if (abs <= SIDEWALL_CHANGE_PCT.SIGNIFICANT) return 'noticeable';
  return 'significant';
}

export function isSidewallRideUnchanged(sidewallPct: number): boolean {
  return sidewallRideTier(sidewallPct) === 'unchanged';
}

/** Combined handling card value from signed width and sidewall deltas (B − A). */
export function formatHandlingImpactValue(specsA: TireSpecs, specsB: TireSpecs): string {
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const sidewallPct = sidewallPctFromSpecs(specsA, specsB);
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const parts: string[] = [];

  if (!nearZero(widthDiffMm, 2)) {
    parts.push(widthDiffMm > 0 ? `+${widthDiffMm} mm width` : `${widthDiffMm} mm width`);
  }
  if (!isSidewallRideUnchanged(sidewallPct)) {
    parts.push(
      sidewallDiff > 0
        ? `+${sidewallDiff.toFixed(2)}" sidewall`
        : `${fmtSigned(sidewallDiff, 2, '"')} sidewall`,
    );
  }

  if (parts.length === 0) return 'Minimal change';
  return parts.join(' · ');
}

export function fmtDiffWithPct(signedIn: number, pct: number): string {
  const sign = signedIn > 0 ? '+' : signedIn < 0 ? '−' : '+';
  return `${sign}${Math.abs(signedIn).toFixed(2)}" (${fmtPct(pct)})`;
}
