/** Gear ratio math — effective gearing, ideal/performance ratios, cruise RPM, and verdicts. */

export type SpeedUnit = 'mph' | 'kmh';

export const MPH_PER_KMH = 0.621371;
/** Classic engine-RPM constant: 63360 in/mi ÷ (60 min/hr × π). */
export const RPM_CONSTANT = 336.135;

/** Common rear-axle / differential ratios offered by manufacturers and gear vendors. */
export const AVAILABLE_GEAR_RATIOS = [
  3.08, 3.23, 3.42, 3.55, 3.73, 3.92, 4.1, 4.3, 4.56, 4.88, 5.13, 5.38, 5.71,
];

export interface GearRatioFields {
  currentDiameterIn: string;
  stockGearRatio: string;
  transTopGear: string;
  newDiameterIn: string;
  speed: string;
  speedUnit: SpeedUnit;
  cruiseRpm: string;
  desiredRpm: string;
  squatEnabled: boolean;
  squatPercent: string;
  crawlEnabled: boolean;
  firstGearRatio: string;
  transferLowRatio: string;
}

export interface GearRatioInput {
  currentDiameterIn: number;
  stockGearRatio: number;
  transTopGear: number;
  newDiameterIn: number;
  speedMph: number;
  speedUnit: SpeedUnit;
  cruiseRpm: number;
  desiredRpm: number;
  squatEnabled: boolean;
  squatPercent: number;
  crawlEnabled: boolean;
  firstGearRatio: number;
  transferLowRatio: number;
}

export type GearVerdictLabel =
  | 'Stock Gears Are Fine'
  | 'Mild Performance Loss'
  | 'Worth Regearing'
  | 'Regear Recommended';

export type GearVerdictTone = 'green' | 'yellow' | 'orange' | 'red';

export interface GearImpactRow {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  icon: string;
}

export interface GearVerdict {
  label: GearVerdictLabel;
  tone: GearVerdictTone;
  summary: string;
  rows: GearImpactRow[];
}

export interface GearRatioResult {
  input: GearRatioInput;
  /** New tire diameter after optional squat correction. */
  effectiveNewDiameterIn: number;
  effectiveCurrentDiameterIn: number;
  /** Effective gearing once the bigger tire is fitted but stock gears are kept. */
  effectiveRatio: number;
  /** Gear ratio that restores the original effective gearing. */
  idealGearRaw: number;
  idealGear: number;
  /** Deeper ratio better suited to towing, crawling, and heavy loads. */
  performanceGear: number;
  /** Positive = taller gearing / torque loss from the larger tire. */
  gearingLossPct: number;
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
  gearForDesiredRpm: number;
  currentCrawlRatio: number | null;
  performanceCrawlRatio: number | null;
}

function isFilled(value: string): boolean {
  return value.trim() !== '';
}

export function parseGearRatioInput(fields: GearRatioFields): GearRatioInput | null {
  const currentDiameterIn = Number(fields.currentDiameterIn);
  const stockGearRatio = Number(fields.stockGearRatio);
  const transTopGear = Number(fields.transTopGear);
  const newDiameterIn = Number(fields.newDiameterIn);
  const speed = Number(fields.speed);
  const cruiseRpm = Number(fields.cruiseRpm);
  const desiredRpm = Number(fields.desiredRpm);
  const squatPercent = Number(fields.squatPercent);
  const firstGearRatio = Number(fields.firstGearRatio);
  const transferLowRatio = Number(fields.transferLowRatio);

  const required = [
    fields.currentDiameterIn,
    fields.stockGearRatio,
    fields.transTopGear,
    fields.newDiameterIn,
    fields.speed,
    fields.cruiseRpm,
  ];
  if (required.some((value) => !isFilled(value))) return null;

  const numbers = [
    currentDiameterIn,
    stockGearRatio,
    transTopGear,
    newDiameterIn,
    speed,
    cruiseRpm,
  ];
  if (numbers.some((value) => !Number.isFinite(value))) return null;

  if (currentDiameterIn <= 0 || newDiameterIn <= 0 || stockGearRatio <= 0) return null;
  if (transTopGear <= 0 || speed <= 0 || cruiseRpm <= 0) return null;

  return {
    currentDiameterIn,
    stockGearRatio,
    transTopGear,
    newDiameterIn,
    speedMph: fields.speedUnit === 'kmh' ? speed * MPH_PER_KMH : speed,
    speedUnit: fields.speedUnit,
    cruiseRpm,
    desiredRpm: Number.isFinite(desiredRpm) && desiredRpm > 0 ? desiredRpm : cruiseRpm,
    squatEnabled: fields.squatEnabled,
    squatPercent: Number.isFinite(squatPercent) ? clamp(squatPercent, 0, 5) : 0,
    crawlEnabled: fields.crawlEnabled,
    firstGearRatio: Number.isFinite(firstGearRatio) && firstGearRatio > 0 ? firstGearRatio : 0,
    transferLowRatio:
      Number.isFinite(transferLowRatio) && transferLowRatio > 0 ? transferLowRatio : 1,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function closestAvailableRatio(target: number): number {
  return AVAILABLE_GEAR_RATIOS.reduce((best, ratio) =>
    Math.abs(ratio - target) < Math.abs(best - target) ? ratio : best,
  );
}

/** Next available ratio numerically deeper (greater) than a reference ratio. */
export function nextDeeperRatio(reference: number): number {
  const deeper = AVAILABLE_GEAR_RATIOS.find((ratio) => ratio > reference + 0.001);
  return deeper ?? AVAILABLE_GEAR_RATIOS[AVAILABLE_GEAR_RATIOS.length - 1];
}

/** Engine RPM at a cruise speed for a given gearing and tire diameter. */
export function cruiseRpm(
  speedMph: number,
  axleRatio: number,
  transTopGear: number,
  diameterIn: number,
): number {
  if (diameterIn <= 0) return 0;
  return (speedMph * axleRatio * transTopGear * RPM_CONSTANT) / diameterIn;
}

export function computeGearRatio(input: GearRatioInput): GearRatioResult {
  const squatFactor = input.squatEnabled ? 1 - input.squatPercent / 100 : 1;
  const effectiveNewDiameterIn = input.newDiameterIn * squatFactor;
  const effectiveCurrentDiameterIn = input.currentDiameterIn;

  const effectiveRatio =
    input.stockGearRatio * (effectiveCurrentDiameterIn / effectiveNewDiameterIn);
  const idealGearRaw =
    input.stockGearRatio * (effectiveNewDiameterIn / effectiveCurrentDiameterIn);
  const idealGear = closestAvailableRatio(idealGearRaw);
  const performanceGear = nextDeeperRatio(idealGear);

  const gearingLossPct = (1 - effectiveRatio / input.stockGearRatio) * 100;

  const baseScale = effectiveCurrentDiameterIn / effectiveNewDiameterIn;
  const currentRpm = input.cruiseRpm;
  const newRpmSameGear = currentRpm * baseScale;
  const idealRpm = currentRpm * baseScale * (idealGear / input.stockGearRatio);
  const performanceRpm = currentRpm * baseScale * (performanceGear / input.stockGearRatio);
  const rpmChange = newRpmSameGear - currentRpm;
  const rpmChangePct = currentRpm > 0 ? (rpmChange / currentRpm) * 100 : 0;

  const speedoDiffPct =
    ((effectiveNewDiameterIn - effectiveCurrentDiameterIn) / effectiveCurrentDiameterIn) * 100;

  const currentCircumferenceIn = Math.PI * effectiveCurrentDiameterIn;
  const newCircumferenceIn = Math.PI * effectiveNewDiameterIn;
  const circumferenceChangePct =
    ((newCircumferenceIn - currentCircumferenceIn) / currentCircumferenceIn) * 100;

  const gearForDesiredRpm =
    input.stockGearRatio *
    (effectiveNewDiameterIn / effectiveCurrentDiameterIn) *
    (input.desiredRpm / input.cruiseRpm);

  const crawlReady = input.crawlEnabled && input.firstGearRatio > 0;
  const currentCrawlRatio = crawlReady
    ? input.stockGearRatio * input.firstGearRatio * input.transferLowRatio
    : null;
  const performanceCrawlRatio = crawlReady
    ? performanceGear * input.firstGearRatio * input.transferLowRatio
    : null;

  return {
    input,
    effectiveNewDiameterIn,
    effectiveCurrentDiameterIn,
    effectiveRatio,
    idealGearRaw,
    idealGear,
    performanceGear,
    gearingLossPct,
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
    gearForDesiredRpm: closestAvailableRatio(gearForDesiredRpm),
    currentCrawlRatio,
    performanceCrawlRatio,
  };
}

export function formatRatio(value: number, digits = 2): string {
  return value.toFixed(digits);
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
