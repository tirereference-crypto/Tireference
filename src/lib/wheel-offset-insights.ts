import type { WheelOffsetComparison } from './wheel-offset-math';
import { CALCULATOR_PATHS, getRelatedCalculators, type RelatedCalculatorItem } from './calculator-links';

export type { RelatedCalculatorItem };

export type FitmentVerdictLabel =
  | 'SAFE FIT'
  | 'MILDLY AGGRESSIVE'
  | 'FLUSH FITMENT'
  | 'CHECK CLEARANCES'
  | 'LIKELY RUBBING RISK';

export type FitmentVerdictTone = 'green' | 'yellow' | 'orange' | 'red';

export interface FitmentCheckRow {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
}

export interface WheelFitmentVerdict {
  label: FitmentVerdictLabel;
  tone: FitmentVerdictTone;
  summary: string;
  rows: FitmentCheckRow[];
}

export interface OffsetPresetOption {
  label: string;
  widthIn: number;
  diameterIn: number;
  offsetMm: number;
}

export interface VehicleOffsetPreset {
  vehicle: string;
  image: string;
  options: OffsetPresetOption[];
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

export const VEHICLE_OFFSET_PRESETS: VehicleOffsetPreset[] = [
  {
    vehicle: 'Toyota Tacoma',
    image: '/images/vehicles/vehicle-tacoma.png',
    options: [
      { label: 'Stock', widthIn: 7.5, diameterIn: 16, offsetMm: 30 },
      { label: 'Flush', widthIn: 8, diameterIn: 16, offsetMm: 20 },
      { label: 'Aggressive', widthIn: 8.5, diameterIn: 16, offsetMm: 0 },
    ],
  },
  {
    vehicle: 'Jeep Wrangler',
    image: '/images/vehicles/vehicle-wrangler.png',
    options: [
      { label: 'Stock', widthIn: 7.5, diameterIn: 17, offsetMm: 44 },
      { label: 'Flush', widthIn: 8.5, diameterIn: 17, offsetMm: 25 },
      { label: 'Aggressive', widthIn: 9, diameterIn: 17, offsetMm: -12 },
    ],
  },
  {
    vehicle: 'Ford F-150',
    image: '/images/vehicles/vehicle-f150.png',
    options: [
      { label: 'Stock', widthIn: 8, diameterIn: 18, offsetMm: 44 },
      { label: 'Flush', widthIn: 9, diameterIn: 18, offsetMm: 20 },
      { label: 'Aggressive', widthIn: 9, diameterIn: 18, offsetMm: 0 },
    ],
  },
  {
    vehicle: 'Toyota 4Runner',
    image: '/images/vehicles/vehicle-4runner.png',
    options: [
      { label: 'Stock', widthIn: 7.5, diameterIn: 17, offsetMm: 15 },
      { label: 'Flush', widthIn: 8, diameterIn: 17, offsetMm: 0 },
      { label: 'Aggressive', widthIn: 8.5, diameterIn: 17, offsetMm: -12 },
    ],
  },
  {
    vehicle: 'Ford Bronco',
    image: '/images/vehicles/vehicle-bronco.png',
    options: [
      { label: 'Stock', widthIn: 8, diameterIn: 17, offsetMm: 44 },
      { label: 'Flush', widthIn: 9, diameterIn: 17, offsetMm: 25 },
      { label: 'Aggressive', widthIn: 9, diameterIn: 17, offsetMm: 0 },
    ],
  },
];

export function formatOffsetValue(offsetMm: number): string {
  return `${offsetMm >= 0 ? '+' : ''}${offsetMm}`;
}

export const FITMENT_QUICK_GUIDE = [
  {
    range: 'Safe Range',
    detail: 'Offset change within ±10 mm',
    tone: 'safe' as const,
  },
  {
    range: 'Aggressive Range',
    detail: '±10 mm to ±25 mm offset change',
    tone: 'aggressive' as const,
  },
  {
    range: 'Extreme Range',
    detail: 'Beyond ±25 mm — verify on vehicle',
    tone: 'extreme' as const,
  },
];

export const POPULAR_VEHICLE_OFFSET_LINKS = [
  { label: 'Tacoma', vehicle: 'Toyota Tacoma' },
  { label: '4Runner', vehicle: 'Toyota 4Runner' },
  { label: 'Wrangler', vehicle: 'Jeep Wrangler' },
  { label: 'Bronco', vehicle: 'Ford Bronco' },
  { label: 'F-150', vehicle: 'Ford F-150' },
];

export const RELATED_CALCULATOR_LINKS = getRelatedCalculators(CALCULATOR_PATHS.wheelOffset);

export const OFFSET_FAQS: OffsetFaq[] = [
  {
    question: 'What is wheel offset?',
    answer:
      'Wheel offset (ET) is the distance in millimeters from the wheel\'s mounting surface to its centerline. Positive offset moves the wheel inward toward the suspension. Negative offset pushes the wheel outward toward the fender. Offset works with wheel width to determine backspacing — the distance from the hub face to the inner rim edge — which is what actually controls suspension clearance.',
  },
  {
    question: 'What is the difference between offset and backspacing?',
    answer:
      'Offset is measured from the wheel centerline to the hub mounting pad. Backspacing is measured from the inner rim lip to the hub pad. Wider wheels change backspacing even when offset stays the same. That is why two wheels with identical offset can fit differently if their widths differ. Use the converter on this page to translate between the two when shopping wheels listed either way.',
  },
  {
    question: 'Will lower offset make my wheels stick out?',
    answer:
      'Yes — reducing offset (moving toward zero or negative) pushes the wheel outward, increasing poke. The amount depends on how much offset changes and whether wheel width also increases. A 10 mm offset drop on the same width moves the outer lip outward by 10 mm. Adding width without adjusting offset can add even more outer poke because the centerline moves.',
  },
  {
    question: 'How much offset change is safe?',
    answer:
      'There is no universal safe number — it depends on your vehicle, suspension travel, tire width, and fender shape. Many trucks tolerate 5–10 mm of additional inward movement or 15–20 mm of poke without rubbing at stock height. Lowered vehicles and independent front suspension are far less forgiving. Treat calculator results as a starting point and confirm with a test fit at full steering lock and suspension compression.',
  },
  {
    question: 'What offset causes rubbing?',
    answer:
      'Rubbing usually happens when the tire envelope grows inward toward the strut, control arm, or pinch weld, or outward into the fender lip and liner. Aggressive combinations — wider wheels, lower offset, and wider tires together — compound the problem. Inner rubbing often appears at full lock; outer rubbing shows under compression or with heavy articulation. Spacers and lower offset both move the wheel outward and can cause the same fender contact.',
  },
  {
    question: 'Can I use wheel spacers instead of lower offset wheels?',
    answer:
      'Spacers move the entire wheel outward without changing the wheel\'s own offset spec. They increase outer poke and track width similar to reducing offset. Spacers do not fix an incorrect backspacing choice on a too-wide wheel — they shift everything outward. Use quality hub-centric spacers torqued to spec, and remember that spacers effectively reduce inner clearance to the suspension by the spacer thickness.',
  },
  {
    question: 'How does offset affect handling?',
    answer:
      'Offset changes the scrub radius and leverage on steering and bearing loads. More inward wheels (higher positive offset) can quicken steering response slightly but increase load on hub bearings. More outward wheels widen the track, which can improve stability but add steering kickback on rough roads. Large deviations from factory offset can change ABS and stability-control calibration feel even when tires fit physically.',
  },
  {
    question: 'What offset is best for a flush fitment?',
    answer:
      'Flush fitment means the outer wheel face sits near the fender edge without sticking past it. The right offset depends on wheel width, tire section width, and how far your fender lip sits from the hub. Start with your stock backspacing as a baseline, then adjust offset until the outer lip lands where you want visually. Most flush truck builds land 10–25 mm outward of stock — but measure your specific fender gap rather than copying forum offsets blindly.',
  },
  {
    question: 'Does offset affect tire wear?',
    answer:
      'Offset itself does not directly change tire compound wear, but it can change camber thrust and scrub radius enough to alter wear patterns over time. Wheels pushed far outward may run with different effective camber at the contact patch, especially on independent suspension. Extreme offset changes can also increase bearing load, which may cause uneven wear indirectly through alignment drift. Always re-check alignment after a significant offset or width change.',
  },
  {
    question: 'What offset is best for off-road vehicles?',
    answer:
      'Off-road builds often favor slightly negative or lower positive offset to widen track width and improve stability on uneven terrain. The trade-off is reduced inner clearance to control arms and brake lines at full articulation. Many Jeep and truck owners run ET 0 to +20 on wider wheels with lifted suspension. Always confirm inner clearance at full compression and steering lock before hitting trails — backspacing matters more than offset alone when tire width increases.',
  },
];

export interface FitmentImpactTopic {
  id: string;
  title: string;
  description: string;
}

export const FITMENT_IMPACT_TOPICS: FitmentImpactTopic[] = [
  {
    id: 'fender',
    title: 'Fender Clearance',
    description:
      'Lower offset and wider wheels push the tire outward toward the fender lip — the first place rubbing usually appears.',
  },
  {
    id: 'suspension',
    title: 'Suspension Clearance',
    description:
      'Higher backspacing moves the inner rim closer to struts, control arms, and brake lines at full steering lock.',
  },
  {
    id: 'handling',
    title: 'Handling',
    description:
      'Offset shifts the contact patch and scrub radius, subtly changing steering feel, stability, and bearing load.',
  },
  {
    id: 'rubbing',
    title: 'Tire Rubbing',
    description:
      'Rubbing happens when the tire envelope exceeds the wheel well at any point in suspension travel or steering angle.',
  },
  {
    id: 'poke',
    title: 'Wheel Poke',
    description:
      'Poke is how far the outer wheel lip sits past the fender plane — a visual stance choice with clearance trade-offs.',
  },
];

export const SEO_FITMENT_CONTENT = {
  heading: 'How Wheel Offset Affects Vehicle Fitment',
  paragraphs: [
    'Wheel offset controls where the rim sits relative to the hub — not how wide the tire is. Two wheels with the same diameter and width but different offset will place the tire in a different position inside the wheel well. That is why offset is a fitment variable, not just a spec-line detail.',
    'Fender clearance grows when the wheel moves outward and shrinks when it moves inward — but inward movement trades outer poke for suspension clearance. A wheel that clears the fender can still hit the strut or control arm at full lock if backspacing increased. Always evaluate both sides of the wheel position.',
    'Suspension clearance is driven primarily by backspacing. Adding width without compensating offset pulls the inner lip toward the suspension even when the outer face looks unchanged. Independent front suspension and performance sedans have the tightest inner packaging; body-on-frame trucks often have more inner room but still rub crash bars and pinch welds.',
    'Handling and steering feel change when offset moves the contact patch laterally. Moderate changes are usually subtle on street vehicles. Extreme negative offset widens track width visually but increases bearing load and can make the truck feel darty on highway grooves.',
    'Tire rubbing is rarely caused by offset alone — it is the combination of offset, wheel width, tire section width, and suspension travel. A calculator shows how far the wheel moved; you still need to cycle the suspension and steering on your actual vehicle to know if the new envelope clears.',
    'Wheel poke is the outward shift drivers notice first. Track width at the outer lips changes by twice the per-wheel outer movement. Wider stance can look right on a truck build but may push the tire past the fender line, requiring flares, trimming, or camber adjustment depending on local rules and your goals.',
  ],
};

function fitmentStatus(
  value: number,
  passMax: number,
  warnMax: number,
): 'pass' | 'warning' | 'fail' {
  const abs = Math.abs(value);
  if (abs <= passMax) return 'pass';
  if (abs <= warnMax) return 'warning';
  return 'fail';
}

export function buildWheelFitmentVerdict(comparison: WheelOffsetComparison): WheelFitmentVerdict {
  const { innerClearanceChangeMm: inner, outerPositionChangeMm: outer, offsetDifferenceMm: offsetDiff } =
    comparison;

  const innerRisk = Math.max(0, inner);
  const outerRisk = Math.max(0, outer);
  const totalRisk = innerRisk * 1.2 + outerRisk + Math.abs(offsetDiff) * 0.35;

  let label: FitmentVerdictLabel;
  let tone: FitmentVerdictTone;
  let summary: string;

  if (totalRisk <= 8 && innerRisk <= 4 && outerRisk <= 10) {
    label = 'SAFE FIT';
    tone = 'green';
    summary =
      'This wheel change stays close to your current setup. Suspension and fender margins should remain similar, but always confirm on your vehicle.';
  } else if (outerRisk >= 6 && outerRisk <= 28 && innerRisk <= 10) {
    label = 'FLUSH FITMENT';
    tone = 'yellow';
    summary =
      'The new setup pushes the wheel outward for a wider stance. Expect a more flush or slightly aggressive look — verify fender lip clearance.';
  } else if (totalRisk <= 20) {
    label = 'MILDLY AGGRESSIVE';
    tone = 'yellow';
    summary =
      'Offset and width changes are noticeable but still in a common aftermarket range. Check inner clearance at full lock before driving hard.';
  } else if (totalRisk <= 36) {
    label = 'CHECK CLEARANCES';
    tone = 'orange';
    summary =
      'This combination moves the wheel enough that rubbing is possible on stock suspension. Mock-fit and cycle steering before committing.';
  } else {
    label = 'LIKELY RUBBING RISK';
    tone = 'red';
    summary =
      'Large inward or outward movement increases rubbing risk on most stock-fit vehicles. Plan for lift, trimming, narrower tires, or revised offset.';
  }

  const suspensionStatus = fitmentStatus(inner, 5, 12);
  const fenderStatus = fitmentStatus(outer, 10, 25);
  const positionStatus: 'pass' | 'warning' | 'fail' =
    Math.abs(offsetDiff) <= 10 ? 'pass' : Math.abs(offsetDiff) <= 20 ? 'warning' : 'fail';
  const fitmentRisk: 'pass' | 'warning' | 'fail' =
    totalRisk <= 12 ? 'pass' : totalRisk <= 28 ? 'warning' : 'fail';

  const rows: FitmentCheckRow[] = [
    {
      id: 'suspension',
      label: 'Suspension Clearance',
      status: suspensionStatus,
      detail:
        inner > 5
          ? `Wheel moves ${Math.round(inner)} mm closer to suspension`
          : inner < -3
            ? `Gains ${Math.round(Math.abs(inner))} mm inner clearance`
            : 'Suspension clearance acceptable',
    },
    {
      id: 'fender',
      label: 'Fender Clearance',
      status: fenderStatus,
      detail:
        outer > 10
          ? `Wheel pokes ${Math.round(outer)} mm farther outward`
          : outer > 0
            ? 'Slight outward position change — check fender gap'
            : 'Minimal change to outer wheel position',
    },
    {
      id: 'position',
      label: 'Wheel Position',
      status: positionStatus,
      detail:
        offsetDiff < -5
          ? 'Lower offset widens stance toward the fender'
          : offsetDiff > 5
            ? 'Higher offset tucks wheel inward'
            : 'Offset change is moderate',
    },
    {
      id: 'risk',
      label: 'Fitment Risk',
      status: fitmentRisk,
      detail:
        fitmentRisk === 'pass'
          ? 'Within a typical aftermarket window'
          : fitmentRisk === 'warning'
            ? 'Aggressive offset may cause rubbing on stock suspension'
            : 'High risk without lift, trimming, or tire adjustment',
    },
  ];

  return { label, tone, summary, rows };
}

export function formatVerdictRowIcon(status: FitmentCheckRow['status']): string {
  switch (status) {
    case 'pass':
      return '✓';
    case 'warning':
      return '⚠';
    default:
      return '✕';
  }
}
