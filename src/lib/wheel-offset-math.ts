/** Wheel fitment math — offset, backspacing, and position deltas. */

export interface WheelSpec {
  widthIn: number;
  diameterIn: number;
  offsetMm: number;
}

export interface WheelSetupFields {
  widthIn: string;
  diameterIn: string;
  offsetMm: string;
}

export interface WheelOffsetComparison {
  current: WheelSpec;
  newSetup: WheelSpec;
  currentBackspacingIn: number;
  newBackspacingIn: number;
  offsetDifferenceMm: number;
  backspacingDifferenceIn: number;
  /** Positive = wheel moves toward suspension (inner clearance reduced). */
  innerClearanceChangeMm: number;
  /** Positive = wheel pokes farther outward. */
  outerPositionChangeMm: number;
  /** Combined change at both outer lips. */
  trackWidthChangeMm: number;
}

export type BackspacingDirection = 'offset-to-backspacing' | 'backspacing-to-offset';

export interface BackspacingConversion {
  widthIn: number;
  offsetMm: number;
  backspacingIn: number;
}

const MM_PER_IN = 25.4;

export function parseWheelSpec(fields: WheelSetupFields): WheelSpec | null {
  const widthIn = Number(fields.widthIn);
  const diameterIn = Number(fields.diameterIn);
  const offsetMm = Number(fields.offsetMm);

  if (
    fields.widthIn.trim() === '' ||
    fields.diameterIn.trim() === '' ||
    fields.offsetMm.trim() === ''
  ) {
    return null;
  }

  if (!Number.isFinite(widthIn) || !Number.isFinite(diameterIn) || !Number.isFinite(offsetMm)) {
    return null;
  }

  if (widthIn <= 0 || diameterIn <= 0) {
    return null;
  }

  return { widthIn, diameterIn, offsetMm };
}

/** Backspacing from the inboard mounting surface to the inner rim lip (inches). */
export function backspacingInches(widthIn: number, offsetMm: number): number {
  return widthIn / 2 + offsetMm / MM_PER_IN;
}

/** Offset (mm) from wheel width and backspacing (inches). */
export function offsetFromBackspacing(widthIn: number, backspacingIn: number): number {
  return (backspacingIn - widthIn / 2) * MM_PER_IN;
}

/** Hub face to outboard rim lip (mm). */
export function outboardPositionMm(widthIn: number, offsetMm: number): number {
  return (widthIn * MM_PER_IN) / 2 - offsetMm;
}

export function convertBackspacing(
  widthIn: number,
  value: number,
  direction: BackspacingDirection,
): BackspacingConversion | null {
  if (!Number.isFinite(widthIn) || widthIn <= 0 || !Number.isFinite(value)) {
    return null;
  }

  if (direction === 'offset-to-backspacing') {
    return {
      widthIn,
      offsetMm: value,
      backspacingIn: backspacingInches(widthIn, value),
    };
  }

  return {
    widthIn,
    backspacingIn: value,
    offsetMm: offsetFromBackspacing(widthIn, value),
  };
}

export function compareWheelSetups(
  current: WheelSpec,
  newSetup: WheelSpec,
): WheelOffsetComparison {
  const currentBackspacingIn = backspacingInches(current.widthIn, current.offsetMm);
  const newBackspacingIn = backspacingInches(newSetup.widthIn, newSetup.offsetMm);

  const backspacingDifferenceIn = newBackspacingIn - currentBackspacingIn;
  const innerClearanceChangeMm = backspacingDifferenceIn * MM_PER_IN;

  const currentOuterMm = outboardPositionMm(current.widthIn, current.offsetMm);
  const newOuterMm = outboardPositionMm(newSetup.widthIn, newSetup.offsetMm);
  const outerPositionChangeMm = newOuterMm - currentOuterMm;

  return {
    current,
    newSetup,
    currentBackspacingIn,
    newBackspacingIn,
    offsetDifferenceMm: newSetup.offsetMm - current.offsetMm,
    backspacingDifferenceIn,
    innerClearanceChangeMm,
    outerPositionChangeMm,
    trackWidthChangeMm: outerPositionChangeMm * 2,
  };
}

export function formatSignedMm(value: number, digits = 0): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)} mm`;
}

export function formatSignedIn(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}"`;
}
