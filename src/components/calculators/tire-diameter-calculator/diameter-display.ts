import type { TireDiameterMatch } from '../../../lib/tire-diameter-search';

export function getAbsDiffPercent(match: TireDiameterMatch, targetIn: number): number {
  if (targetIn <= 0) return Math.abs(match.diameterDiffPercent);
  return Math.abs((match.diameterDiffIn / targetIn) * 100);
}

export function getDiffTone(pct: number): 'green' | 'amber' | 'red' {
  if (pct <= 1) return 'green';
  if (pct <= 3) return 'amber';
  return 'red';
}

export function formatIn(value: number, digits = 2): string {
  return `${value.toFixed(digits)} in`;
}
