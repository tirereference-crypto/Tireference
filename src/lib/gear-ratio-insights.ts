import type { GearRatioFields, GearRatioResult } from './gear-ratio-math';
import { commonAxleRatiosAround, formatAxleRatio } from './gear-ratio-math';
import { CALCULATOR_PATHS, getRelatedCalculators, type RelatedCalculatorItem } from './calculator-links';

export type { RelatedCalculatorItem };

/** Prefer gearing-adjacent tools; exclude broken/unpublished routes. */
export const RELATED_CALCULATOR_LINKS: RelatedCalculatorItem[] = [
  CALCULATOR_PATHS.tireSize,
  CALCULATOR_PATHS.tireComparison,
  CALCULATOR_PATHS.wheelOffset,
  CALCULATOR_PATHS.tireDiameter,
]
  .map((href) => getRelatedCalculators(CALCULATOR_PATHS.gearRatio).find((item) => item.href === href))
  .filter((item): item is RelatedCalculatorItem => Boolean(item));

export interface GearFaq {
  question: string;
  answer: string;
}

export const DEFAULT_GEAR_FIELDS: GearRatioFields = {
  currentDiameterIn: '31',
  stockGearRatio: '3.73',
  newDiameterIn: '35',
  transTopGear: '',
  firstGearRatio: '',
  transferLowRatio: '',
  speed: '',
  speedUnit: 'mph',
  lowSpeedBiasPercent: '5',
};

export const GEAR_RATIO_OPTIONS = [
  '3.08',
  '3.21',
  '3.31',
  '3.42',
  '3.55',
  '3.73',
  '3.90',
  '4.10',
  '4.11',
  '4.30',
  '4.56',
  '4.88',
  '5.13',
  '5.38',
];

export const LOW_SPEED_BIAS_OPTIONS_LABELS = [
  { value: '0', label: '0%' },
  { value: '3', label: '3%' },
  { value: '5', label: '5%' },
  { value: '8', label: '8%' },
  { value: '10', label: '10%' },
] as const;

export type GearingChangeMagnitude =
  | 'Minimal Gearing Change'
  | 'Small Gearing Change'
  | 'Noticeable Gearing Change'
  | 'Large Gearing Change'
  | 'Very Large Gearing Change';

export type GearingChangeTone = 'neutral' | 'info' | 'caution';

export interface GearingChangeSummary {
  eyebrow: string;
  heading: GearingChangeMagnitude;
  summary: string;
  tone: GearingChangeTone;
  absChangePct: number;
}

export function buildGearingChangeSummary(result: GearRatioResult): GearingChangeSummary {
  const abs = Math.abs(result.effectiveChangePercent);
  const current = formatDiameterLabel(result.currentDiameterIn);
  const next = formatDiameterLabel(result.newDiameterIn);
  const stock = formatAxleRatio(result.input.stockGearRatio);
  const pct = abs.toFixed(1);
  const direction = result.effectiveChangePercent < 0 ? 'taller' : 'deeper';

  let heading: GearingChangeMagnitude;
  let tone: GearingChangeTone;
  if (abs < 3) {
    heading = 'Minimal Gearing Change';
    tone = 'neutral';
  } else if (abs < 6) {
    heading = 'Small Gearing Change';
    tone = 'info';
  } else if (abs < 10) {
    heading = 'Noticeable Gearing Change';
    tone = 'info';
  } else if (abs < 15) {
    heading = 'Large Gearing Change';
    tone = 'caution';
  } else {
    heading = 'Very Large Gearing Change';
    tone = 'caution';
  }

  const summary =
    abs < 0.05
      ? `Current and new tire diameters are effectively the same with ${stock} axle gears, so effective gearing is unchanged.`
      : `Moving from ${current}-inch to ${next}-inch tires with ${stock} axle gears makes the effective gearing approximately ${pct}% ${direction}. This ${
          direction === 'taller' ? 'lowers' : 'raises'
        } engine RPM and wheel multiplication at the same road speed. Regearing may be worth considering when acceleration, towing or low-speed control are priorities.`;

  return {
    eyebrow: 'Effective Gearing Change',
    heading,
    summary,
    tone,
    absChangePct: abs,
  };
}

function formatDiameterLabel(inches: number): string {
  return Number.isInteger(inches) || Math.abs(inches - Math.round(inches)) < 0.05
    ? String(Math.round(inches))
    : inches.toFixed(1);
}

export function formatDiameterInchesLabel(inches: number): string {
  return formatDiameterLabel(inches);
}

export interface NearbyRatioExample {
  ratio: number;
  comparison: string;
  direction: 'taller' | 'deeper' | 'match';
  side: 'below' | 'above';
  /** True only when this example is uniquely closest to the exact target. */
  isClosest: boolean;
}

/** Compact nearby common-ratio chips for the primary answer panel. */
export function buildNearbyRatioExamples(result: GearRatioResult): NearbyRatioExample[] {
  const { below, above } = commonAxleRatiosAround(result.stockLikeTarget);
  const sides: Array<{ ratio: number; side: 'below' | 'above' }> = [];
  if (below != null) sides.push({ ratio: below, side: 'below' });
  if (above != null) sides.push({ ratio: above, side: 'above' });
  if (sides.length === 0) return [];

  const distances = sides.map((item) => Math.abs(item.ratio - result.stockLikeTarget));
  const minDistance = Math.min(...distances);
  const closestCount = distances.filter((d) => Math.abs(d - minDistance) < 1e-9).length;

  return sides.map((item) => {
    const pct = effectiveVsOriginalPercent(item.ratio, result);
    let comparison = 'Matches original';
    let direction: NearbyRatioExample['direction'] = 'match';
    if (Math.abs(pct) >= 0.05) {
      const abs = Math.abs(pct).toFixed(1);
      if (pct < 0) {
        comparison = `${abs}% taller than original`;
        direction = 'taller';
      } else {
        comparison = `${abs}% deeper than original`;
        direction = 'deeper';
      }
    }
    return {
      ratio: item.ratio,
      comparison,
      direction,
      side: item.side,
      isClosest:
        closestCount === 1 &&
        Math.abs(Math.abs(item.ratio - result.stockLikeTarget) - minDistance) < 1e-9,
    };
  });
}

export type GearScaleRole =
  | 'current-effective'
  | 'nearby-lower'
  | 'exact'
  | 'nearby-higher'
  | 'deeper';

export interface GearScaleMarker {
  id: string;
  role: GearScaleRole;
  value: number;
  label: string;
  /** Signed percent vs original effective gearing for axle-target markers; for current-effective uses result change. */
  percentFromOriginal: number;
  percentLabel: string;
  /** 0–100 position along the numerical scale. */
  positionPercent: number;
}

/** Ordered markers for the visual gear-ratio scale (numerical position only). */
export function buildGearRatioScaleMarkers(result: GearRatioResult): GearScaleMarker[] {
  const { below, above } = commonAxleRatiosAround(result.stockLikeTarget);

  const percentLabelFor = (pct: number): string => {
    if (Math.abs(pct) < 0.05) return 'Matches original';
    const abs = Math.abs(pct).toFixed(1);
    return pct < 0 ? `${abs}% taller than original` : `${abs}% deeper than original`;
  };

  const raw: Array<Omit<GearScaleMarker, 'positionPercent'>> = [
    {
      id: 'current-effective',
      role: 'current-effective',
      value: result.effectiveRatio,
      label: 'Current effective',
      percentFromOriginal: result.effectiveChangePercent,
      percentLabel: percentLabelFor(result.effectiveChangePercent),
    },
  ];
  if (below != null) {
    const pct = effectiveVsOriginalPercent(below, result);
    raw.push({
      id: `nearby-lower-${below}`,
      role: 'nearby-lower',
      value: below,
      label: 'Nearby example',
      percentFromOriginal: pct,
      percentLabel: percentLabelFor(pct),
    });
  }
  raw.push({
    id: 'exact',
    role: 'exact',
    value: result.stockLikeTarget,
    label: 'Exact target',
    percentFromOriginal: 0,
    percentLabel: 'Matches original',
  });
  if (above != null) {
    const pct = effectiveVsOriginalPercent(above, result);
    raw.push({
      id: `nearby-higher-${above}`,
      role: 'nearby-higher',
      value: above,
      label: 'Nearby example',
      percentFromOriginal: pct,
      percentLabel: percentLabelFor(pct),
    });
  }
  {
    const pct = effectiveVsOriginalPercent(result.deeperTarget, result);
    raw.push({
      id: 'deeper',
      role: 'deeper',
      value: result.deeperTarget,
      label: 'Deeper target',
      percentFromOriginal: pct,
      percentLabel: percentLabelFor(pct),
    });
  }

  const values = raw.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  /** Keep edge labels inside the track (avoids clipping “Deeper target”). */
  const edgeInsetPercent = 7;

  return raw
    .map((item) => ({
      ...item,
      positionPercent:
        edgeInsetPercent + ((item.value - min) / span) * (100 - 2 * edgeInsetPercent),
    }))
    .sort((a, b) => a.value - b.value || a.positionPercent - b.positionPercent);
}

export function buildPrimaryAnswerCopy(result: GearRatioResult): {
  explanation: string;
  supportLine: string;
  currentGearsSecondary: string;
  currentGearsHelper: string;
  deeperSecondary: string;
  deeperHelper: string;
} {
  const current = formatDiameterLabel(result.currentDiameterIn);
  const next = formatDiameterLabel(result.newDiameterIn);
  const stock = formatAxleRatio(result.input.stockGearRatio);
  const target = formatAxleRatio(result.stockLikeTarget);
  const abs = Math.abs(result.effectiveChangePercent).toFixed(1);
  const taller = result.effectiveChangePercent < 0;
  const bias = result.input.lowSpeedBiasPercent;

  return {
    explanation: `Changing from ${current}-inch to ${next}-inch tires with ${stock} gears produces an exact stock-like target of ${target}.`,
    supportLine: 'Restores the original geometric gearing relationship',
    currentGearsSecondary: `${abs}% ${taller ? 'taller' : 'deeper'} than the original setup`,
    currentGearsHelper: taller
      ? 'Lower RPM and low-speed multiplication at the same road speed'
      : 'Higher RPM and low-speed multiplication at the same road speed',
    deeperSecondary: `${bias}% deeper than the stock-like target`,
    deeperHelper: 'Higher RPM and low-speed multiplication',
  };
}


/** Percent change in effective gearing vs original when using an axle ratio on the new tires. */
export function effectiveVsOriginalPercent(
  axleRatio: number,
  result: GearRatioResult,
): number {
  const effective = axleRatio * (result.currentDiameterIn / result.newDiameterIn);
  return ((effective / result.input.stockGearRatio) - 1) * 100;
}

export function formatTallerDeeperPercent(pctFromOriginal: number): string {
  if (Math.abs(pctFromOriginal) < 0.05) return 'Matches original effective gearing';
  const abs = Math.abs(pctFromOriginal).toFixed(1);
  if (pctFromOriginal < 0) return `Approximately ${abs}% taller than the original effective gearing`;
  return `Approximately ${abs}% deeper than the original effective gearing`;
}

export function formatPctLowerHigher(changePercent: number): string {
  if (Math.abs(changePercent) < 0.05) return 'Unchanged';
  const abs = Math.abs(changePercent).toFixed(1);
  return changePercent < 0 ? `${abs}% lower` : `${abs}% higher`;
}

export type FactualRelation =
  | 'Original reference'
  | 'Matches original mathematically'
  | string;

export interface FactualComparisonRow {
  id: string;
  setup: string;
  axleRatio: string;
  effectiveRatio: string;
  differenceFromOriginal: string;
  /** Signed percent vs original effective gearing; 0 for the original reference. */
  differencePercent: number;
  interpretation: string;
  emphasis: 'reference' | 'primary' | 'example' | 'secondary' | 'none';
  tone: 'slate' | 'amber' | 'exact' | 'cyan' | 'magenta';
}

function formatDiffCell(pctFromOriginal: number): string {
  if (Math.abs(pctFromOriginal) < 0.05) return '0% difference';
  const abs = Math.abs(pctFromOriginal).toFixed(1);
  return pctFromOriginal < 0 ? `${abs}% taller` : `${abs}% deeper`;
}

/**
 * Compact setup comparison — at most five core rows, plus optional compared ratios.
 * Interpretation chips describe geometric difference; deeper target uses bias vs stock-like.
 */
export function buildFactualComparisonRows(
  result: GearRatioResult,
  extraAxleRatios: number[] = [],
): FactualComparisonRow[] {
  const stock = result.input.stockGearRatio;
  const scale = result.currentDiameterIn / result.newDiameterIn;
  const nearEq = (a: number, b: number) => Math.abs(a - b) < 0.005;

  const rows: Array<{
    id: string;
    setup: string;
    axle: number;
    onNewTires: boolean;
    emphasis: FactualComparisonRow['emphasis'];
    tone: FactualComparisonRow['tone'];
  }> = [
    {
      id: 'original',
      setup: 'Original setup',
      axle: stock,
      onNewTires: false,
      emphasis: 'reference',
      tone: 'slate',
    },
    {
      id: 'new-current',
      setup: 'New tires with current gears',
      axle: stock,
      onNewTires: true,
      emphasis: 'none',
      tone: 'amber',
    },
    {
      id: 'stock-like',
      setup: 'New tires with exact stock-like target',
      axle: result.stockLikeTarget,
      onNewTires: true,
      emphasis: 'primary',
      tone: 'exact',
    },
  ];

  if (!nearEq(result.nearbyStockLikeExample, result.stockLikeTarget)) {
    rows.push({
      id: 'nearby-stock',
      setup: 'New tires with nearest common-ratio example',
      axle: result.nearbyStockLikeExample,
      onNewTires: true,
      emphasis: 'example',
      tone: 'cyan',
    });
  }

  if (!nearEq(result.deeperTarget, result.stockLikeTarget)) {
    rows.push({
      id: 'deeper',
      setup: 'New tires with optional deeper target',
      axle: result.deeperTarget,
      onNewTires: true,
      emphasis: 'secondary',
      tone: 'magenta',
    });
  }

  const existingAxles = rows.map((row) => row.axle);
  for (const ratio of extraAxleRatios) {
    if (!Number.isFinite(ratio)) continue;
    if (existingAxles.some((axle) => nearEq(axle, ratio))) continue;
    existingAxles.push(ratio);
    rows.push({
      id: `compare-${formatAxleRatio(ratio)}`,
      setup: `Compared ratio ${formatAxleRatio(ratio)}`,
      axle: ratio,
      onNewTires: true,
      emphasis: 'example',
      tone: 'cyan',
    });
  }

  return rows.map((row) => {
    const effective = row.onNewTires ? row.axle * scale : row.axle;
    const pctFromOriginal = ((effective / stock) - 1) * 100;

    let interpretation: string;
    if (row.id === 'original') interpretation = 'Original reference';
    else if (row.id === 'stock-like') interpretation = 'Original gearing restored mathematically';
    else if (row.id === 'deeper') interpretation = 'Deeper target';
    else if (row.id.startsWith('compare-')) {
      interpretation =
        Math.abs(pctFromOriginal) < 0.05
          ? 'Matches mathematically'
          : pctFromOriginal < 0
            ? 'Taller than original'
            : 'Deeper than original';
    } else if (row.id === 'nearby-stock') {
      const abs = Math.abs(pctFromOriginal);
      if (abs < 0.05) interpretation = 'Matches mathematically';
      else if (abs < 3) {
        interpretation = pctFromOriginal < 0 ? 'Slightly taller' : 'Slightly deeper';
      } else {
        interpretation = pctFromOriginal < 0 ? 'Taller than original' : 'Deeper than original';
      }
    } else {
      interpretation =
        Math.abs(pctFromOriginal) < 0.05
          ? 'Matches mathematically'
          : pctFromOriginal < 0
            ? 'Taller than original'
            : 'Deeper than original';
    }

    const isExactTarget = row.id === 'stock-like';
    const isZeroDiff = row.id === 'original' || isExactTarget || Math.abs(pctFromOriginal) < 0.05;

    return {
      id: row.id,
      setup: row.setup,
      axleRatio: formatAxleRatio(row.axle),
      effectiveRatio: formatAxleRatio(effective),
      differenceFromOriginal: isExactTarget
        ? '0% difference'
        : row.id === 'original'
          ? '0% / Original'
          : formatDiffCell(pctFromOriginal),
      differencePercent: isZeroDiff ? 0 : pctFromOriginal,
      interpretation,
      emphasis: row.emphasis,
      tone: row.tone,
    };
  });
}

export interface TireChangeInterpretation {
  heading: string;
  summary: string;
  direction: 'taller' | 'deeper' | 'unchanged';
  effectivePrimary: string;
  effectiveHelper: string;
  rpmPrimary: string;
  rpmHelper: string;
  multiplicationPrimary: string;
  multiplicationHelper: string;
  interpretation: string;
  notice: string;
  relationship: [string, string, string];
}

export function buildTireChangeInterpretation(result: GearRatioResult): TireChangeInterpretation {
  const current = formatDiameterInchesLabel(result.currentDiameterIn);
  const next = formatDiameterInchesLabel(result.newDiameterIn);
  const stock = formatAxleRatio(result.input.stockGearRatio);
  const abs = Math.abs(result.effectiveChangePercent).toFixed(1);
  const taller = result.effectiveChangePercent < 0;
  const unchanged = Math.abs(result.effectiveChangePercent) < 0.05;
  const direction: TireChangeInterpretation['direction'] = unchanged
    ? 'unchanged'
    : taller
      ? 'taller'
      : 'deeper';

  const summary = unchanged
    ? `Moving from ${current}-inch to ${next}-inch tires produces no effective gearing change when the existing ${stock} gears are retained.`
    : `Moving from ${current}-inch to ${next}-inch tires makes the effective gearing ${abs}% ${
        taller ? 'taller' : 'deeper'
      } when the existing ${stock} gears are retained.`;

  const relationship: TireChangeInterpretation['relationship'] = unchanged
    ? ['Same tire diameter', 'Same distance per revolution', 'No effective gearing change']
    : taller
      ? ['Larger tire', 'More distance per revolution', 'Taller effective gearing']
      : ['Smaller tire', 'Less distance per revolution', 'Deeper effective gearing'];

  return {
    heading: 'What Changes With the New Tires?',
    summary,
    direction,
    effectivePrimary: unchanged
      ? 'No effective gearing change'
      : `${abs}% ${taller ? 'taller' : 'deeper'}`,
    effectiveHelper: `Current gears behave like a ${formatAxleRatio(result.effectiveRatio)} ratio`,
    rpmPrimary: unchanged
      ? 'No change'
      : `Approximately ${abs}% ${taller ? 'lower' : 'higher'}`,
    rpmHelper: 'At the same road speed',
    multiplicationPrimary: unchanged
      ? 'No change'
      : `Approximately ${abs}% ${taller ? 'lower' : 'higher'}`,
    multiplicationHelper: 'Relative to the original setup',
    interpretation: unchanged
      ? 'Keeping the current axle ratio leaves geometric gearing effectively unchanged.'
      : taller
        ? 'Keeping the current axle ratio means lower RPM and less low-speed multiplication at the same road speed.'
        : 'Keeping the current axle ratio means higher RPM and more low-speed multiplication at the same road speed.',
    notice:
      'These figures describe geometric tire-diameter and axle-ratio relationships only. They are not vehicle-specific fitment or availability claims.',
    relationship,
  };
}

export interface ResultCardModel {
  variant: 'stock-like' | 'deeper' | 'current';
  eyebrow: string;
  primaryValue: string;
  primaryLabel: string;
  nearbyExample?: string;
  supporting: string[];
  note?: string;
}

export function buildResultCards(result: GearRatioResult): ResultCardModel[] {
  const bias = result.input.lowSpeedBiasPercent;
  const nearbyStockPct = effectiveVsOriginalPercent(result.nearbyStockLikeExample, result);
  const absChange = Math.abs(result.effectiveChangePercent).toFixed(1);
  const taller = result.effectiveChangePercent < 0;

  return [
    {
      variant: 'stock-like',
      eyebrow: 'Restore original effective gearing',
      primaryValue: formatAxleRatio(result.stockLikeTarget),
      primaryLabel: 'Exact stock-like target',
      nearbyExample: `Nearby example: ${formatAxleRatio(result.nearbyStockLikeExample)}`,
      supporting: [
        `${formatTallerDeeperPercent(nearbyStockPct)} when using ${formatAxleRatio(result.nearbyStockLikeExample)}.`,
      ],
      note: 'Confirm ratio availability for your axle.',
    },
    {
      variant: 'deeper',
      eyebrow: 'Additional low-speed bias',
      primaryValue: formatAxleRatio(result.deeperTarget),
      primaryLabel: `${bias}% deeper than stock-like target`,
      nearbyExample: `Nearby example: ${formatAxleRatio(result.nearbyDeeperExample)}`,
      supporting: [
        'Raises engine RPM and increases low-speed multiplication compared with the stock-like target.',
      ],
      note: 'Confirm ratio availability for your axle.',
    },
    {
      variant: 'current',
      eyebrow: 'Current gears with new tires',
      primaryValue: formatAxleRatio(result.effectiveRatio),
      primaryLabel: 'Effective axle ratio',
      supporting: [
        `${absChange}% ${taller ? 'taller' : 'deeper'} than original`,
        `Engine RPM at the same road speed changes by approximately ${taller ? '−' : '+'}${absChange}%`,
        `Low-speed multiplication changes by approximately ${taller ? '−' : '+'}${absChange}%`,
        taller
          ? 'Lower RPM and less wheel multiplication at the same road speed.'
          : 'Higher RPM and more wheel multiplication at the same road speed.',
      ],
    },
  ];
}



export interface RegearCostTier {
  key: string;
  name: string;
  range: string;
  unit: string;
  detail: string;
}

/** Broad US planning estimates already used on this calculator — not quotes. */
export const REGEAR_COSTS: RegearCostTier[] = [
  {
    key: 'parts',
    name: 'Parts only',
    range: '$300–700',
    unit: 'typical ring-and-pinion + install kit',
    detail: 'Does not include specialised tools, setup gauges or labour.',
  },
  {
    key: 'pro',
    name: 'Professional installation per axle',
    range: '$800–2,000',
    unit: 'parts and labour, one axle',
    detail: 'Includes precision setup such as pattern and backlash where quoted by the shop.',
  },
  {
    key: 'both',
    name: 'Front and rear axle regear',
    range: '$1,500–3,500+',
    unit: 'both axles, US shops',
    detail: 'Common total range when a 4WD or AWD vehicle needs matching front and rear ratios.',
  },
  {
    key: 'extras',
    name: 'Additional bearings, lockers or differential work',
    range: 'Adds to total',
    unit: 'vehicle-dependent',
    detail: 'Bearings, seals, lockers, carrier upgrades and damaged differential repair are priced separately.',
  },
];

export const GEAR_FAQS: GearFaq[] = [
  {
    question: 'What gear ratio do I need for larger tires?',
    answer:
      'Scale your current axle ratio by new tire diameter ÷ current tire diameter to get an exact stock-like target. That restores approximately the same geometric relationship as the original setup. Compare nearby manufactured ratios and confirm what your axle and differential support.',
  },
  {
    question: 'How do larger tires affect effective gear ratio?',
    answer:
      'A larger tire travels farther per wheel revolution, so the same axle ratio delivers taller effective gearing. Engine RPM and low-speed wheel multiplication both drop at a given road speed even though the stamped ring-and-pinion ratio is unchanged.',
  },
  {
    question: 'Does changing tire size change engine RPM?',
    answer:
      'Yes, at the same road speed and transmission gear. Larger tires generally lower engine RPM with the current axle ratio; smaller tires raise it. Estimated RPM also depends on top-gear ratio and the speed you choose for comparison.',
  },
  {
    question: 'Is the exact calculated ratio always available?',
    answer:
      'The exact mathematical target may not be manufactured for every axle. Compare nearby ratios and confirm compatibility with your axle and differential.',
  },
  {
    question: 'Should I use advertised or measured tire diameter?',
    answer:
      'Use the same measurement type for both tires. Advertised sizes can differ from mounted diameter under load. Actual mounted measurements improve accuracy for effective gearing and stock-like targets.',
  },
  {
    question: 'Do I need to regear both axles on a four-wheel-drive vehicle?',
    answer:
      'Front and rear axle ratios normally need to match when both axles are mechanically engaged. Confirm the requirements for your drivetrain before changing ratios.',
  },
];

export interface GearEduSection {
  id: string;
  title: string;
  points: string[];
  takeaway: string;
  icon: 'taller' | 'restore' | 'deeper' | 'limits';
}

export const GEAR_EDU_SECTIONS: GearEduSection[] = [
  {
    id: 'taller',
    icon: 'taller',
    title: 'Why larger tires make gearing taller',
    points: [
      'A larger tire travels farther with each wheel revolution, so the same axle ratio delivers taller effective gearing.',
      'Engine RPM and low-speed wheel multiplication both drop at a given road speed.',
      'The stamped numerical axle ratio itself does not change.',
    ],
    takeaway: 'Diameter change alters effective gearing without rewriting the axle stamp.',
  },
  {
    id: 'stock-like',
    icon: 'restore',
    title: 'Restoring stock-like gearing',
    points: [
      'The exact target scales the current axle ratio by the tire-diameter change.',
      'That restores the original geometric relationship between engine speed, axle rotation and tire travel.',
      'Using actual mounted tire diameter improves accuracy.',
    ],
    takeaway: 'Stock-like targets restore geometry — not a vehicle-specific recommendation.',
  },
  {
    id: 'deeper',
    icon: 'deeper',
    title: 'Choosing a deeper ratio',
    points: [
      'A numerically higher ratio raises engine RPM at a given road speed and increases low-speed multiplication.',
      'The best final ratio still depends on the vehicle and intended use.',
      'Availability depends on the axle and differential.',
    ],
    takeaway: 'Deeper is a mathematical bias option, not a universal upgrade.',
  },
  {
    id: 'limits',
    icon: 'limits',
    title: 'What the calculator cannot predict',
    points: [
      'It does not know engine torque curves, shift strategy, torque-converter behaviour or drivetrain losses.',
      'Vehicle weight, aerodynamics, terrain, towing load and driving style are outside the geometric model.',
      'It also cannot confirm axle-ratio availability or predict actual fuel economy.',
    ],
    takeaway: 'Use the numbers as geometry — verify parts and drivetrain with a specialist.',
  },
];
