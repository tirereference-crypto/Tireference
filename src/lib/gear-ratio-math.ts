/** Gear ratio math — effective gearing, stock-like targets, RPM, and crawl ratio. */

export type SpeedUnit = 'mph' | 'kmh';

export const MPH_PER_KMH = 0.621371;
/** Classic engine-RPM constant: speed × axle × trans × 336 ÷ diameter (inches, mph). */
export const RPM_CONSTANT = 336;

/**
 * Commonly encountered axle / differential ratios.
 * Not a claim that any ratio is available for a specific axle.
 */
export const COMMON_AXLE_RATIOS = [
  3.08, 3.21, 3.31, 3.42, 3.55, 3.73, 3.9, 4.1, 4.11, 4.3, 4.56, 4.88, 5.13, 5.38,
] as const;

/** @deprecated Prefer COMMON_AXLE_RATIOS */
export const AVAILABLE_GEAR_RATIOS = [...COMMON_AXLE_RATIOS];

export const LOW_SPEED_BIAS_OPTIONS = [0, 3, 5, 8, 10] as const;
export type LowSpeedBiasPercent = (typeof LOW_SPEED_BIAS_OPTIONS)[number];

export const GEAR_DIAMETER_RANGE = { min: 15, max: 60 } as const;
export const GEAR_AXLE_RATIO_RANGE = { min: 2, max: 7.5 } as const;
export const GEAR_TOP_GEAR_RANGE = { min: 0.4, max: 1.2 } as const;
export const GEAR_FIRST_GEAR_RANGE = { min: 2, max: 8 } as const;
export const GEAR_TRANSFER_LOW_RANGE = { min: 1.5, max: 5 } as const;
export const GEAR_CRUISE_SPEED_MPH_RANGE = { min: 20, max: 100 } as const;

export interface GearRatioFields {
  currentDiameterIn: string;
  stockGearRatio: string;
  newDiameterIn: string;
  /** Advanced — empty means not supplied */
  transTopGear: string;
  firstGearRatio: string;
  transferLowRatio: string;
  speed: string;
  speedUnit: SpeedUnit;
  /** Additional low-speed bias percent: 0 | 3 | 5 | 8 | 10 */
  lowSpeedBiasPercent: string;
}

export interface GearRatioInput {
  currentDiameterIn: number;
  stockGearRatio: number;
  newDiameterIn: number;
  transTopGear: number | null;
  firstGearRatio: number | null;
  transferLowRatio: number | null;
  speedMph: number | null;
  speedUnit: SpeedUnit;
  lowSpeedBiasPercent: LowSpeedBiasPercent;
}

export interface GearRpmBreakdown {
  originalSetup: number;
  newTiresCurrentGears: number;
  newTiresStockLike: number;
  newTiresDeeper: number;
  nearbyStockLike: number;
  nearbyDeeper: number;
}

export interface GearCrawlBreakdown {
  currentAxle: number;
  stockLike: number;
  deeper: number;
  nearbyStockLike: number;
  nearbyDeeper: number;
}

export interface GearRatioResult {
  input: GearRatioInput;
  /** Same measurement type as entered — no hidden squat correction. */
  currentDiameterIn: number;
  newDiameterIn: number;
  /** Alias for UI layers that still reference effective diameters. */
  effectiveCurrentDiameterIn: number;
  effectiveNewDiameterIn: number;
  /** currentAxle × currentTire ÷ newTire */
  effectiveRatio: number;
  /** currentAxle × newTire ÷ currentTire */
  stockLikeTarget: number;
  /** stockLikeTarget × (1 + bias/100) */
  deeperTarget: number;
  /** Common nearby example nearest to stock-like target */
  nearbyStockLikeExample: number;
  /** Common nearby example nearest to deeper-use target */
  nearbyDeeperExample: number;
  /**
   * ((currentTire ÷ newTire) − 1) × 100
   * Negative = taller effective gearing.
   */
  effectiveChangePercent: number;
  /**
   * Positive when the new tire makes gearing taller (more “loss” of mechanical advantage).
   * Equals −effectiveChangePercent when taller; 0 when unchanged; negative when shorter.
   */
  gearingLossPct: number;
  /** Aliases for existing summary / comparison UI */
  idealGearRaw: number;
  idealGear: number;
  performanceGear: number;
  rpmReady: boolean;
  crawlReady: boolean;
  estimatedRpm: GearRpmBreakdown | null;
  crawlRatios: GearCrawlBreakdown | null;
  /** Legacy absolute RPM fields used by comparison table / verdict */
  currentRpm: number;
  newRpmSameGear: number;
  idealRpm: number;
  performanceRpm: number;
  rpmChange: number;
  rpmChangePct: number;
  speedoDiffPct: number;
  currentCircumferenceIn: number;
  newCircumferenceIn: number;
  circumferenceChangePct: number;
  currentCrawlRatio: number | null;
  performanceCrawlRatio: number | null;
  stockLikeCrawlRatio: number | null;
}

function isFilled(value: string): boolean {
  return value.trim() !== '';
}

function parseOptionalInRange(
  raw: string,
  range: { min: number; max: number },
): number | null {
  if (!isFilled(raw)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (value < range.min || value > range.max) return null;
  return value;
}

function parseBias(raw: string): LowSpeedBiasPercent {
  const value = Number(raw);
  if ((LOW_SPEED_BIAS_OPTIONS as readonly number[]).includes(value)) {
    return value as LowSpeedBiasPercent;
  }
  return 5;
}

/** Parse primary + optional advanced fields. Primary must be valid. */
export function parseGearRatioInput(fields: GearRatioFields): GearRatioInput | null {
  if (
    !isFilled(fields.currentDiameterIn) ||
    !isFilled(fields.newDiameterIn) ||
    !isFilled(fields.stockGearRatio)
  ) {
    return null;
  }

  const currentDiameterIn = Number(fields.currentDiameterIn);
  const newDiameterIn = Number(fields.newDiameterIn);
  const stockGearRatio = Number(fields.stockGearRatio);

  if (
    !Number.isFinite(currentDiameterIn) ||
    !Number.isFinite(newDiameterIn) ||
    !Number.isFinite(stockGearRatio)
  ) {
    return null;
  }

  if (
    currentDiameterIn < GEAR_DIAMETER_RANGE.min ||
    currentDiameterIn > GEAR_DIAMETER_RANGE.max ||
    newDiameterIn < GEAR_DIAMETER_RANGE.min ||
    newDiameterIn > GEAR_DIAMETER_RANGE.max ||
    stockGearRatio < GEAR_AXLE_RATIO_RANGE.min ||
    stockGearRatio > GEAR_AXLE_RATIO_RANGE.max
  ) {
    return null;
  }

  const speedRaw = Number(fields.speed);
  let speedMph: number | null = null;
  if (isFilled(fields.speed) && Number.isFinite(speedRaw) && speedRaw > 0) {
    const mph = fields.speedUnit === 'kmh' ? speedRaw * MPH_PER_KMH : speedRaw;
    if (mph >= GEAR_CRUISE_SPEED_MPH_RANGE.min && mph <= GEAR_CRUISE_SPEED_MPH_RANGE.max) {
      speedMph = mph;
    }
  }

  return {
    currentDiameterIn,
    stockGearRatio,
    newDiameterIn,
    transTopGear: parseOptionalInRange(fields.transTopGear, GEAR_TOP_GEAR_RANGE),
    firstGearRatio: parseOptionalInRange(fields.firstGearRatio, GEAR_FIRST_GEAR_RANGE),
    transferLowRatio: parseOptionalInRange(fields.transferLowRatio, GEAR_TRANSFER_LOW_RANGE),
    speedMph,
    speedUnit: fields.speedUnit,
    lowSpeedBiasPercent: parseBias(fields.lowSpeedBiasPercent),
  };
}

export type GearFieldKey = keyof GearRatioFields;

export function validateGearField(
  key: GearFieldKey,
  fields: GearRatioFields,
): string | null {
  const raw = fields[key];
  if (typeof raw !== 'string') return null;
  if (!isFilled(raw)) {
    if (key === 'currentDiameterIn' || key === 'newDiameterIn' || key === 'stockGearRatio') {
      return 'Required';
    }
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) return 'Enter a valid number';

  switch (key) {
    case 'currentDiameterIn':
    case 'newDiameterIn':
      if (value < GEAR_DIAMETER_RANGE.min || value > GEAR_DIAMETER_RANGE.max) {
        return `Enter a diameter between ${GEAR_DIAMETER_RANGE.min} and ${GEAR_DIAMETER_RANGE.max} in`;
      }
      return null;
    case 'stockGearRatio':
      if (value < GEAR_AXLE_RATIO_RANGE.min || value > GEAR_AXLE_RATIO_RANGE.max) {
        return `Enter an axle ratio between ${GEAR_AXLE_RATIO_RANGE.min.toFixed(2)} and ${GEAR_AXLE_RATIO_RANGE.max.toFixed(2)}`;
      }
      return null;
    case 'transTopGear':
      if (value < GEAR_TOP_GEAR_RANGE.min || value > GEAR_TOP_GEAR_RANGE.max) {
        return `Enter a top-gear ratio between ${GEAR_TOP_GEAR_RANGE.min.toFixed(2)} and ${GEAR_TOP_GEAR_RANGE.max.toFixed(2)}`;
      }
      return null;
    case 'firstGearRatio':
      if (value < GEAR_FIRST_GEAR_RANGE.min || value > GEAR_FIRST_GEAR_RANGE.max) {
        return `Enter a first-gear ratio between ${GEAR_FIRST_GEAR_RANGE.min.toFixed(2)} and ${GEAR_FIRST_GEAR_RANGE.max.toFixed(2)}`;
      }
      return null;
    case 'transferLowRatio':
      if (value < GEAR_TRANSFER_LOW_RANGE.min || value > GEAR_TRANSFER_LOW_RANGE.max) {
        return `Enter a low-range ratio between ${GEAR_TRANSFER_LOW_RANGE.min.toFixed(2)} and ${GEAR_TRANSFER_LOW_RANGE.max.toFixed(2)}`;
      }
      return null;
    case 'speed': {
      const mph = fields.speedUnit === 'kmh' ? value * MPH_PER_KMH : value;
      if (mph < GEAR_CRUISE_SPEED_MPH_RANGE.min || mph > GEAR_CRUISE_SPEED_MPH_RANGE.max) {
        return fields.speedUnit === 'kmh'
          ? 'Enter a cruising speed between about 32 and 160 km/h'
          : `Enter a cruising speed between ${GEAR_CRUISE_SPEED_MPH_RANGE.min} and ${GEAR_CRUISE_SPEED_MPH_RANGE.max} mph`;
      }
      return null;
    }
    default:
      return null;
  }
}

/** Numerically closest common axle-ratio example (not availability). */
export function closestCommonAxleRatio(target: number): number {
  return COMMON_AXLE_RATIOS.reduce((best, ratio) =>
    Math.abs(ratio - target) < Math.abs(best - target) ? ratio : best,
  );
}

/**
 * Common ratios immediately below and above a target.
 * When the target equals a listed ratio, both neighbors are still returned.
 */
export function commonAxleRatiosAround(target: number): {
  below: number | null;
  above: number | null;
} {
  let below: number | null = null;
  let above: number | null = null;
  for (const ratio of COMMON_AXLE_RATIOS) {
    if (ratio < target - 1e-9) below = ratio;
    else if (ratio > target + 1e-9) {
      above = ratio;
      break;
    }
  }
  return { below, above };
}

/** @deprecated Prefer closestCommonAxleRatio */
export function closestAvailableRatio(target: number): number {
  return closestCommonAxleRatio(target);
}

/** Engine RPM at a cruise speed for a given gearing and tire diameter (inches). */
export function cruiseRpm(
  speedMph: number,
  axleRatio: number,
  transTopGear: number,
  diameterIn: number,
): number {
  if (diameterIn <= 0) return 0;
  return (speedMph * axleRatio * transTopGear * RPM_CONSTANT) / diameterIn;
}

export function crawlRatio(
  firstGear: number,
  transferLow: number,
  axleRatio: number,
): number {
  return firstGear * transferLow * axleRatio;
}

export function computeGearRatio(input: GearRatioInput): GearRatioResult {
  const currentDiameterIn = input.currentDiameterIn;
  const newDiameterIn = input.newDiameterIn;

  const effectiveRatio =
    input.stockGearRatio * (currentDiameterIn / newDiameterIn);
  const stockLikeTarget =
    input.stockGearRatio * (newDiameterIn / currentDiameterIn);
  const deeperTarget = stockLikeTarget * (1 + input.lowSpeedBiasPercent / 100);

  const nearbyStockLikeExample = closestCommonAxleRatio(stockLikeTarget);
  const nearbyDeeperExample = closestCommonAxleRatio(deeperTarget);

  const effectiveChangePercent = (currentDiameterIn / newDiameterIn - 1) * 100;
  const gearingLossPct = -effectiveChangePercent;

  const rpmReady =
    input.speedMph != null &&
    input.transTopGear != null &&
    input.speedMph > 0 &&
    input.transTopGear > 0;

  const crawlReady = input.firstGearRatio != null && input.transferLowRatio != null;

  let estimatedRpm: GearRpmBreakdown | null = null;
  let currentRpm = 0;
  let newRpmSameGear = 0;
  let idealRpm = 0;
  let performanceRpm = 0;
  let rpmChange = 0;
  let rpmChangePct = 0;

  if (rpmReady && input.speedMph != null && input.transTopGear != null) {
    const speed = input.speedMph;
    const top = input.transTopGear;
    estimatedRpm = {
      originalSetup: cruiseRpm(speed, input.stockGearRatio, top, currentDiameterIn),
      newTiresCurrentGears: cruiseRpm(speed, input.stockGearRatio, top, newDiameterIn),
      newTiresStockLike: cruiseRpm(speed, stockLikeTarget, top, newDiameterIn),
      newTiresDeeper: cruiseRpm(speed, deeperTarget, top, newDiameterIn),
      nearbyStockLike: cruiseRpm(speed, nearbyStockLikeExample, top, newDiameterIn),
      nearbyDeeper: cruiseRpm(speed, nearbyDeeperExample, top, newDiameterIn),
    };
    currentRpm = estimatedRpm.originalSetup;
    newRpmSameGear = estimatedRpm.newTiresCurrentGears;
    idealRpm = estimatedRpm.newTiresStockLike;
    performanceRpm = estimatedRpm.newTiresDeeper;
    rpmChange = newRpmSameGear - currentRpm;
    rpmChangePct = currentRpm > 0 ? (rpmChange / currentRpm) * 100 : 0;
  }

  let crawlRatios: GearCrawlBreakdown | null = null;
  let currentCrawlRatio: number | null = null;
  let performanceCrawlRatio: number | null = null;
  let stockLikeCrawlRatio: number | null = null;

  if (crawlReady && input.firstGearRatio != null && input.transferLowRatio != null) {
    const first = input.firstGearRatio;
    const tcase = input.transferLowRatio;
    crawlRatios = {
      currentAxle: crawlRatio(first, tcase, input.stockGearRatio),
      stockLike: crawlRatio(first, tcase, stockLikeTarget),
      deeper: crawlRatio(first, tcase, deeperTarget),
      nearbyStockLike: crawlRatio(first, tcase, nearbyStockLikeExample),
      nearbyDeeper: crawlRatio(first, tcase, nearbyDeeperExample),
    };
    currentCrawlRatio = crawlRatios.currentAxle;
    stockLikeCrawlRatio = crawlRatios.stockLike;
    performanceCrawlRatio = crawlRatios.deeper;
  }

  const speedoDiffPct = ((newDiameterIn - currentDiameterIn) / currentDiameterIn) * 100;
  const currentCircumferenceIn = Math.PI * currentDiameterIn;
  const newCircumferenceIn = Math.PI * newDiameterIn;
  const circumferenceChangePct =
    ((newCircumferenceIn - currentCircumferenceIn) / currentCircumferenceIn) * 100;

  return {
    input,
    currentDiameterIn,
    newDiameterIn,
    effectiveCurrentDiameterIn: currentDiameterIn,
    effectiveNewDiameterIn: newDiameterIn,
    effectiveRatio,
    stockLikeTarget,
    deeperTarget,
    nearbyStockLikeExample,
    nearbyDeeperExample,
    effectiveChangePercent,
    gearingLossPct,
    idealGearRaw: stockLikeTarget,
    idealGear: nearbyStockLikeExample,
    performanceGear: deeperTarget,
    rpmReady,
    crawlReady,
    estimatedRpm,
    crawlRatios,
    currentRpm,
    newRpmSameGear,
    idealRpm,
    performanceRpm,
    rpmChange,
    rpmChangePct,
    speedoDiffPct,
    currentCircumferenceIn,
    newCircumferenceIn,
    circumferenceChangePct,
    currentCrawlRatio,
    performanceCrawlRatio,
    stockLikeCrawlRatio,
  };
}

export function formatRatio(value: number, digits = 2): string {
  return value.toFixed(digits);
}

/**
 * Shared display formatter for axle / gear ratios.
 * Always two decimal places (3.73, 4.10, 4.00) — never strips trailing zeros.
 * Does not change internal calculation precision.
 */
export function formatAxleRatio(value: number | string): string {
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  if (!Number.isFinite(n)) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : '—';
  }
  return n.toFixed(2);
}

export function formatSignedPct(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatRpm(value: number): string {
  return `${Math.round(value).toLocaleString()}`;
}

export function formatSignedRpm(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value).toLocaleString()}`;
}

export function formatEffectiveGearingChange(effectiveChangePercent: number): string {
  if (Math.abs(effectiveChangePercent) < 0.05) return '0% change';
  const abs = Math.abs(effectiveChangePercent).toFixed(1);
  if (effectiveChangePercent < 0) return `${abs}% taller effective gearing`;
  return `${abs}% deeper effective gearing`;
}
