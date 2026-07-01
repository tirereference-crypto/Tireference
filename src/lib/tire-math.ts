/** Core tire dimension math — pure functions only. */

export type TireSizeType = 'metric' | 'flotation';

export interface ParsedTireSize {
  type: TireSizeType;
  widthMm: number;
  aspectRatio: number;
  wheelDiameterIn: number;
  construction: string;
}

export interface TireSpecs extends ParsedTireSize {
  sidewallMm: number;
  overallDiameterMm: number;
  overallDiameterIn: number;
  sectionWidthIn: number;
  sidewallIn: number;
  circumferenceIn: number;
  circumferenceMm: number;
  revsPerMile: number;
  revsPerKm: number;
}

export interface SpeedometerComparison {
  indicatedSpeed: number;
  trueSpeed: number;
  errorPercent: number;
}

export interface TireComparison {
  diameterDiffMm: number;
  diameterDiffIn: number;
  diameterDiffPercent: number;
  widthDiffMm: number;
  sidewallDiffMm: number;
  circumferenceDiffIn: number;
  revsPerMileDiff: number;
  revsPerMileDiffPercent: number;
  speedometer: SpeedometerComparison;
  groundClearanceChangeIn: number;
}

const METRIC_PATTERN =
  /^(?:P|LT)?(\d+)\/(\d+)([A-Z])(\d+(?:\.\d+)?)$/i;
const FLOTATION_PATTERN =
  /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)([A-Z])(\d+(?:\.\d+)?)$/i;

function flotationDimensionsToMetric(
  overallDiameterIn: number,
  sectionWidthIn: number,
  wheelDiameterIn: number,
): Pick<ParsedTireSize, 'widthMm' | 'aspectRatio'> {
  const sidewallIn = (overallDiameterIn - wheelDiameterIn) / 2;
  const widthMm = sectionWidthIn * 25.4;
  const aspectRatio = (sidewallIn / sectionWidthIn) * 100;
  return { widthMm, aspectRatio };
}

/** Parse metric (275/70R18, P275/70R18, LT265/75R16) or flotation (33x12.50R15) sizes. */
export function parseTireSize(size: string): ParsedTireSize {
  const trimmed = size.trim();

  const metricMatch = trimmed.match(METRIC_PATTERN);
  if (metricMatch) {
    const [, width, aspect, construction, wheel] = metricMatch;
    return {
      type: 'metric',
      widthMm: Number(width),
      aspectRatio: Number(aspect),
      wheelDiameterIn: Number(wheel),
      construction: construction.toUpperCase(),
    };
  }

  const flotationMatch = trimmed.match(FLOTATION_PATTERN);
  if (flotationMatch) {
    const [, overallIn, sectionIn, construction, wheel] = flotationMatch;
    const overallDiameterIn = Number(overallIn);
    const sectionWidthIn = Number(sectionIn);
    const wheelDiameterIn = Number(wheel);
    const { widthMm, aspectRatio } = flotationDimensionsToMetric(
      overallDiameterIn,
      sectionWidthIn,
      wheelDiameterIn,
    );
    return {
      type: 'flotation',
      widthMm,
      aspectRatio,
      wheelDiameterIn,
      construction: construction.toUpperCase(),
    };
  }

  throw new Error(`Invalid tire size: "${size}"`);
}

/** Full tire specifications from a size string (metric or flotation). */
export function getTireSpecs(size: string): TireSpecs {
  const parsed = parseTireSize(size);

  const sidewallMm = parsed.widthMm * (parsed.aspectRatio / 100);
  const overallDiameterMm =
    parsed.wheelDiameterIn * 25.4 + 2 * sidewallMm;
  const overallDiameterIn = overallDiameterMm / 25.4;
  const sectionWidthIn = parsed.widthMm / 25.4;
  const sidewallIn = sidewallMm / 25.4;
  const circumferenceIn = overallDiameterIn * Math.PI;
  const circumferenceMm = circumferenceIn * 25.4;
  const revsPerMile = 63360 / circumferenceIn;
  const revsPerKm = 100000 / (circumferenceIn * 2.54);

  return {
    ...parsed,
    sidewallMm,
    overallDiameterMm,
    overallDiameterIn,
    sectionWidthIn,
    sidewallIn,
    circumferenceIn,
    circumferenceMm,
    revsPerMile,
    revsPerKm,
  };
}

function percentChange(newValue: number, referenceValue: number): number {
  return ((newValue - referenceValue) / referenceValue) * 100;
}

/** Compare reference tire (sizeA) to new tire (sizeB). */
export function compareTires(
  sizeA: string,
  sizeB: string,
  indicatedSpeed = 60,
): TireComparison {
  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);

  const diameterDiffMm =
    specsB.overallDiameterMm - specsA.overallDiameterMm;
  const diameterDiffIn =
    specsB.overallDiameterIn - specsA.overallDiameterIn;
  const diameterDiffPercent = percentChange(
    specsB.overallDiameterIn,
    specsA.overallDiameterIn,
  );

  const trueSpeed =
    indicatedSpeed * (specsB.overallDiameterIn / specsA.overallDiameterIn);
  const errorPercent = percentChange(trueSpeed, indicatedSpeed);

  return {
    diameterDiffMm: Math.abs(diameterDiffMm),
    diameterDiffIn: Math.abs(diameterDiffIn),
    diameterDiffPercent,
    widthDiffMm: specsB.widthMm - specsA.widthMm,
    sidewallDiffMm: specsB.sidewallMm - specsA.sidewallMm,
    circumferenceDiffIn: specsB.circumferenceIn - specsA.circumferenceIn,
    revsPerMileDiff: specsB.revsPerMile - specsA.revsPerMile,
    revsPerMileDiffPercent: percentChange(
      specsB.revsPerMile,
      specsA.revsPerMile,
    ),
    speedometer: {
      indicatedSpeed,
      trueSpeed,
      errorPercent,
    },
    groundClearanceChangeIn:
      (specsB.overallDiameterIn - specsA.overallDiameterIn) / 2,
  };
}

function formatFlotationNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Convert a metric size string to flotation notation (e.g. 33x10.8R18). */
export function metricToFlotation(size: string): string {
  const specs = getTireSpecs(size);
  const overall = formatFlotationNumber(specs.overallDiameterIn);
  const section = formatFlotationNumber(specs.sectionWidthIn);
  const wheel = formatFlotationNumber(specs.wheelDiameterIn);
  return `${overall}x${section}${specs.construction}${wheel}`;
}

/** Convert a flotation size string to metric notation (e.g. 275/70R18). */
export function flotationToMetric(size: string): string {
  const parsed = parseTireSize(size);
  const width = Math.round(parsed.widthMm);
  const aspect = Math.round(parsed.aspectRatio);
  const wheel =
    parsed.wheelDiameterIn % 1 === 0
      ? String(parsed.wheelDiameterIn)
      : parsed.wheelDiameterIn.toFixed(1);
  return `${width}/${aspect}${parsed.construction}${wheel}`;
}
