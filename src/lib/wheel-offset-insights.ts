import type { WheelOffsetComparison } from './wheel-offset-math';
import { CALCULATOR_PATHS, getRelatedCalculators, type RelatedCalculatorItem } from './calculator-links';

export type { RelatedCalculatorItem };

/** Display mm without unnecessary trailing .0 */
export function formatMmDisplay(value: number): string {
  const abs = Math.abs(value);
  const rounded = Math.round(abs * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1);
}

export type PositionChangeMagnitude =
  | 'Minimal'
  | 'Small'
  | 'Moderate'
  | 'Large'
  | 'Very Large';

export type PositionChangeTone = 'neutral' | 'info' | 'caution';

export interface PositionChangeRow {
  id: string;
  label: string;
  detail: string;
  tone: PositionChangeTone;
}

export interface WheelPositionSummary {
  magnitude: PositionChangeMagnitude;
  heading: string;
  summary: string;
  rows: PositionChangeRow[];
}

export interface OffsetComparisonPreset {
  id: string;
  label: string;
  currentOffsetMm: number;
  newOffsetMm: number;
}

export interface OffsetFaq {
  question: string;
  answer: string;
}

export const DEFAULT_CURRENT_WHEEL = {
  widthIn: '8',
  diameterIn: '18',
  offsetMm: '35',
};

export const DEFAULT_NEW_WHEEL = {
  widthIn: '9',
  diameterIn: '18',
  offsetMm: '20',
};

export function getPositionChangeMagnitude(
  innerClearanceChangeMm: number,
  outerPositionChangeMm: number,
): PositionChangeMagnitude {
  const maxAbs =
    Math.round(
      Math.max(Math.abs(innerClearanceChangeMm), Math.abs(outerPositionChangeMm)) * 10,
    ) / 10;
  if (maxAbs <= 5) return 'Minimal';
  if (maxAbs <= 10) return 'Small';
  if (maxAbs <= 20) return 'Moderate';
  if (maxAbs <= 30) return 'Large';
  return 'Very Large';
}

export function getPositionChangeHeading(magnitude: PositionChangeMagnitude): string {
  return `${magnitude} Position Change`;
}

function toneForMagnitude(magnitude: PositionChangeMagnitude): PositionChangeTone {
  switch (magnitude) {
    case 'Minimal':
    case 'Small':
      return 'neutral';
    case 'Moderate':
      return 'info';
    default:
      return 'caution';
  }
}

export function describeOuterPosition(outerMm: number): string {
  const v = formatMmDisplay(outerMm);
  if (Math.abs(outerMm) < 0.05) return 'keeps the same outer position';
  if (outerMm > 0) return `sits ${v} mm farther outward`;
  return `sits ${v} mm farther inward`;
}

export function describeInnerPosition(innerMm: number): string {
  const v = formatMmDisplay(innerMm);
  if (Math.abs(innerMm) < 0.05) return 'keeps the same inner position';
  // Positive innerClearanceChangeMm = closer to suspension (more backspacing).
  if (innerMm > 0) return `sits ${v} mm closer to the suspension`;
  return `provides ${v} mm more inner clearance`;
}

export function describeOuterStance(outerMm: number): string | null {
  if (Math.abs(outerMm) < 0.05) return null;
  if (outerMm > 0) return 'This creates a wider stance.';
  return 'This creates a more tucked-in stance.';
}

export function formatInnerPositionDetail(innerMm: number): string {
  const v = formatMmDisplay(innerMm);
  if (Math.abs(innerMm) < 0.05) return 'No change from current wheel';
  if (innerMm > 0) return `${v} mm closer to the suspension`;
  return `${v} mm more clearance than current`;
}

export function formatOuterPositionDetail(outerMm: number): string {
  const v = formatMmDisplay(outerMm);
  if (Math.abs(outerMm) < 0.05) return 'No change from current wheel';
  if (outerMm > 0) return `${v} mm farther outward`;
  return `${v} mm farther inward`;
}

export function formatTrackWidthDetail(trackMm: number): string {
  const v = formatMmDisplay(trackMm);
  if (Math.abs(trackMm) < 0.05) return 'No estimated track-width change';
  if (trackMm > 0) return `Approximately ${v} mm wider across the axle`;
  return `Approximately ${v} mm narrower across the axle`;
}

export function buildWheelPositionSummary(
  comparison: WheelOffsetComparison,
): WheelPositionSummary {
  const { innerClearanceChangeMm: inner, outerPositionChangeMm: outer } = comparison;
  const magnitude = getPositionChangeMagnitude(inner, outer);
  const heading = getPositionChangeHeading(magnitude);
  const stance = describeOuterStance(outer);
  const summary = [
    `The new wheel ${describeOuterPosition(outer)} and ${describeInnerPosition(inner)}.`,
    stance,
    'Confirm your vehicle’s actual fender and suspension clearances before purchasing.',
  ]
    .filter(Boolean)
    .join(' ');

  const rows: PositionChangeRow[] = [
    {
      id: 'inner',
      label: 'Inner Position',
      detail: formatInnerPositionDetail(inner),
      tone: 'neutral',
    },
    {
      id: 'outer',
      label: 'Outer Position',
      detail: formatOuterPositionDetail(outer),
      tone: 'neutral',
    },
    {
      id: 'track',
      label: 'Estimated Track Width',
      detail: formatTrackWidthDetail(comparison.trackWidthChangeMm),
      tone: 'neutral',
    },
    {
      id: 'magnitude',
      label: 'Change Magnitude',
      detail: magnitude,
      tone: toneForMagnitude(magnitude),
    },
    {
      id: 'vehicle',
      label: 'Vehicle-Specific Clearance',
      detail: 'Not evaluated',
      tone: 'info',
    },
  ];

  return { magnitude, heading, summary, rows };
}

/** @deprecated Prefer buildWheelPositionSummary — kept for transitional imports. */
export type WheelFitmentVerdict = WheelPositionSummary;
export type FitmentCheckRow = PositionChangeRow;

export function buildWheelFitmentVerdict(
  comparison: WheelOffsetComparison,
): WheelPositionSummary {
  return buildWheelPositionSummary(comparison);
}

export const POSITION_CHANGE_GUIDE = [
  {
    range: 'Small change',
    detail: 'Under 10 mm',
    note: 'Usually a subtle position difference, but actual clearance should still be checked.',
    tone: 'small' as const,
  },
  {
    range: 'Moderate change',
    detail: '10–20 mm',
    note: 'A noticeable change that may affect suspension or fender clearance.',
    tone: 'moderate' as const,
  },
  {
    range: 'Large change',
    detail: '20–30 mm',
    note: 'A substantial position change that requires careful measurement.',
    tone: 'large' as const,
  },
  {
    range: 'Very large change',
    detail: 'Over 30 mm',
    note: 'A major position change. Confirm vehicle-specific clearance, tire fitment, and wheel compatibility.',
    tone: 'extreme' as const,
  },
];

export const POSITION_CHANGE_GUIDE_NOTE =
  'Change magnitude does not guarantee vehicle fitment. Wheel width, tire size, suspension design, ride height, brakes, and bodywork all affect clearance.';

/** Example offset pairs — update offsets only; width and diameter are preserved. */
export const POPULAR_OFFSET_COMPARISONS: OffsetComparisonPreset[] = [
  { id: '45-35', label: '+45 mm to +35 mm', currentOffsetMm: 45, newOffsetMm: 35 },
  { id: '35-20', label: '+35 mm to +20 mm', currentOffsetMm: 35, newOffsetMm: 20 },
  { id: '30-15', label: '+30 mm to +15 mm', currentOffsetMm: 30, newOffsetMm: 15 },
  { id: '20-0', label: '+20 mm to 0 mm', currentOffsetMm: 20, newOffsetMm: 0 },
  { id: '10--10', label: '+10 mm to −10 mm', currentOffsetMm: 10, newOffsetMm: -10 },
  { id: '0--12', label: '0 mm to −12 mm', currentOffsetMm: 0, newOffsetMm: -12 },
];

export const RELATED_CALCULATOR_LINKS = getRelatedCalculators(CALCULATOR_PATHS.wheelOffset);

export const OFFSET_FAQS: OffsetFaq[] = [
  {
    question: 'How is wheel offset (ET) defined relative to the hub mounting face?',
    answer:
      'Offset (ET, from the German Einpresstiefe) is the signed distance in millimeters from the wheel centerline to the hub mounting pad. Positive ET places the pad toward the outer face of the wheel; negative ET places it toward the suspension side; zero ET puts the pad on the centerline.\n\nOffset alone does not locate the lips. Nominal wheel width sets how far each lip sits from the centerline, so the same ET on two different widths produces different inner and outer positions relative to the hub.',
  },
  {
    question: 'Why can a 0 mm offset change still move the wheel significantly?',
    answer:
      'Because inner and outer lip positions are functions of both width and offset. On a fixed offset, increasing width moves both lips outward from the centerline by half the width increase (in the same units).\n\nThis calculator therefore reports inner-position change, outer-position change, and estimated track-width change from the full current vs new setup—not from the offset delta alone. Treat a “same offset” swap onto a wider wheel as a geometry change that still needs clearance review.',
  },
  {
    question: 'How does this tool derive outer position and estimated track-width change?',
    answer:
      'Outer position is modeled as the hub-face-to-outer-lip distance from nominal width and offset. The per-wheel outer change is new outer position minus current outer position. Estimated track-width change is twice that value, which assumes the same wheel setup is fitted on both sides of the axle.\n\nThese are relative geometry deltas for the wheel assembly as specified. They are not measured tire-to-fender gaps, and they do not include tire section width, sidewall bulge, or suspension deflection.',
  },
  {
    question: 'What is the exact relationship between offset and backspacing?',
    answer:
      'Using nominal wheel width W (inches) and offset ET (mm): backspacing ≈ W/2 + ET/25.4 (inches from the hub pad to the inner rim lip). Solving for offset: ET ≈ (backspacing − W/2) × 25.4.\n\nWider wheels increase backspacing at the same ET because half-width grows. Catalog “backspace” figures can also differ slightly from this nominal conversion when manufacturers measure to a different flange reference, so treat the on-page converter as a nominal engineering translation—not a substitute for the wheel maker’s published datasheet.',
  },
  {
    question: 'Why can’t wheel width and offset alone prove suspension or fender clearance?',
    answer:
      'Clearance is a vehicle-state problem. Hub face location, strut and lower-control-arm packaging, brake caliper envelope, steering lock geometry, fender and liner shape, tire section and construction, load, inflation, camber, toe, and ride height all change the free space around the wheel.\n\nThis calculator compares relative wheel position between two specs and explicitly does not evaluate vehicle-specific clearance. Use the reported inner and outer deltas to decide where to measure, then verify on the vehicle at ride height and full lock.',
  },
  {
    question: 'When does a position-change magnitude warrant hands-on measurement?',
    answer:
      'Offset difference is a weak proxy when width also changes. Prefer the largest absolute lip movement (inner or outer) and the estimated track-width change. Minimal or small shifts are usually easier to package; moderate changes deserve targeted checks; large or very large changes justify measuring suspension/strut, brake/caliper, tire-to-fender, and steering-lock clearances before purchase.\n\nMagnitude labels describe relative geometry severity only. They are not fitment pass/fail verdicts and do not guarantee that a given vehicle will clear.',
  },
];
