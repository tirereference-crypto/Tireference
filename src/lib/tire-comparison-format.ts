/** Shared number formatting for comparison copy — single source for prose and cards. */

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

export function fmtDiffWithPct(signedIn: number, pct: number): string {
  const sign = signedIn > 0 ? '+' : signedIn < 0 ? '−' : '+';
  return `${sign}${Math.abs(signedIn).toFixed(2)}" (${fmtPct(pct)})`;
}
