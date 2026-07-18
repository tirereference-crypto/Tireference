/**
 * Indefinite articles for spoken inch measurements.
 * "18" → an, "17" → a (matches site validation rules).
 */

export function articleForInch(inches: number): 'a' | 'an' {
  const integer = Math.trunc(Math.abs(inches));
  return integer === 8 || integer === 11 || integer === 18 || (integer >= 80 && integer < 90)
    ? 'an'
    : 'a';
}

/** e.g. "an 18-inch wheel" / "a 17-inch wheel" */
export function formatInchWheel(inches: number, noun = 'wheel'): string {
  const value = Number.isInteger(inches) ? String(inches) : String(Number(inches.toFixed(2)));
  return `${articleForInch(inches)} ${value}-inch ${noun}`;
}

/** e.g. "an 18\"" / "a 17\"" when the quote form is preferred in prose. */
export function formatInchQuoted(inches: number): string {
  const value = Number.isInteger(inches) ? String(inches) : String(Number(inches.toFixed(2)));
  return `${articleForInch(inches)} ${value}"`;
}
