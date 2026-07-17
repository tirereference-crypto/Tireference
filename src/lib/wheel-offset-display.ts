import type { WheelOffsetComparison } from './wheel-offset-math';
import { formatMmDisplay } from './wheel-offset-insights';

const NEAR_ZERO_MM = 0.05;
const NEAR_ZERO_IN = 0.005;

/** Display inches with up to two decimals; trim trailing zeros. */
export function formatInDisplay(value: number, maxDecimals = 2): string {
  const abs = Math.abs(value);
  const rounded = Math.round(abs * 10 ** maxDecimals) / 10 ** maxDecimals;
  const fixed = rounded.toFixed(maxDecimals);
  return fixed.replace(/\.?0+$/, '');
}

function isNearZeroMm(value: number): boolean {
  return Math.abs(value) < NEAR_ZERO_MM;
}

function isNearZeroIn(value: number): boolean {
  return Math.abs(value) < NEAR_ZERO_IN;
}

/** Primary metric card label for offset difference (new − current). */
export function formatOffsetChangePrimary(offsetDifferenceMm: number): string {
  if (isNearZeroMm(offsetDifferenceMm)) return 'No offset change';
  const v = formatMmDisplay(offsetDifferenceMm);
  if (offsetDifferenceMm < 0) return `${v} mm lower offset`;
  return `${v} mm higher offset`;
}

/** Supporting text explaining offset direction (not a repeat of the primary). */
export function formatOffsetChangeSecondary(offsetDifferenceMm: number): string {
  if (isNearZeroMm(offsetDifferenceMm)) return 'Mounting position remains unchanged';
  if (offsetDifferenceMm < 0) return 'Mounting position shifts outward';
  return 'Mounting position shifts inward';
}

/** Positive innerClearanceChangeMm = closer to suspension. */
export function formatInnerChangePrimary(innerClearanceChangeMm: number): string {
  if (isNearZeroMm(innerClearanceChangeMm)) return 'No inner position change';
  const v = formatMmDisplay(innerClearanceChangeMm);
  if (innerClearanceChangeMm > 0) return `${v} mm closer to suspension`;
  return `${v} mm more inner clearance`;
}

export function formatInnerChangeSecondary(innerClearanceChangeMm: number): string {
  if (isNearZeroMm(innerClearanceChangeMm)) return 'Same inner position as current';
  if (innerClearanceChangeMm > 0) return 'Reduced space toward the suspension';
  return 'More room toward the suspension';
}

export function formatOuterChangePrimary(outerPositionChangeMm: number): string {
  if (isNearZeroMm(outerPositionChangeMm)) return 'No outer position change';
  const v = formatMmDisplay(outerPositionChangeMm);
  if (outerPositionChangeMm > 0) return `${v} mm farther outward`;
  return `${v} mm farther inward`;
}

export function formatOuterChangeSecondary(outerPositionChangeMm: number): string {
  if (isNearZeroMm(outerPositionChangeMm)) return 'Same outer position as current';
  if (outerPositionChangeMm > 0) return 'Extends farther toward the fender';
  return 'Sits farther inside the wheel arch';
}

export function formatTrackWidthPrimary(trackWidthChangeMm: number): string {
  if (isNearZeroMm(trackWidthChangeMm)) return 'No estimated track-width change';
  const v = formatMmDisplay(trackWidthChangeMm);
  if (trackWidthChangeMm > 0) return `${v} mm wider across the axle`;
  return `${v} mm narrower across the axle`;
}

export function formatTrackWidthSecondary(trackWidthChangeMm: number): string {
  if (isNearZeroMm(trackWidthChangeMm)) return 'Outer wheel position is unchanged';
  return 'Estimated when fitted on both sides';
}

export function formatBackspacingPrimary(backspacingDifferenceIn: number): string {
  if (isNearZeroIn(backspacingDifferenceIn)) return 'No backspacing change';
  const v = formatInDisplay(Math.abs(backspacingDifferenceIn));
  if (backspacingDifferenceIn < 0) return `${v} in less backspacing`;
  return `${v} in more backspacing`;
}

/** Supporting text shows the new absolute backspacing value. */
export function formatBackspacingSecondary(newBackspacingIn: number): string {
  return `New backspacing: ${formatInDisplay(newBackspacingIn)} in`;
}

export function buildDiagramAriaDescription(comparison: WheelOffsetComparison): string {
  const inner = formatInnerChangePrimary(comparison.innerClearanceChangeMm);
  const outer = formatOuterChangePrimary(comparison.outerPositionChangeMm);
  const track = formatTrackWidthPrimary(comparison.trackWidthChangeMm);

  const parts = [
    'Wheel position comparison diagram.',
    `Inner position: ${inner}.`,
    `Outer position: ${outer}.`,
    `Estimated track width: ${track}.`,
  ];

  return parts.join(' ');
}

/** One-line share title summarizing the comparison. */
export function buildWheelOffsetShareTitle(comparison: WheelOffsetComparison): string {
  const outer = formatOuterChangePrimary(comparison.outerPositionChangeMm);
  const inner = formatInnerChangePrimary(comparison.innerClearanceChangeMm);
  return `Wheel Offset — ${outer}; ${inner}`;
}
