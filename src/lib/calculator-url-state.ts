import type { GearRatioFields } from './gear-ratio-math';
import { DEFAULT_GEAR_FIELDS } from './gear-ratio-insights';
import {
  WHEEL_DIAMETER_OPTIONS,
  type WheelDiameterOption,
} from './tire-diameter-search';
import { parseTireSize } from './tire-math';
import { parseFullSizeToFields, type TireSizeInputFields } from './tire-size-input';
import { normalizeTireSizeInput } from './tire-size-validation';
import { normalizeTireSize } from './tire-size-primitives';

/** True when the string parses as metric or flotation tire size. */
function isParsableTireSize(size: string): boolean {
  try {
    parseTireSize(normalizeTireSizeInput(size));
    return true;
  } catch {
    return false;
  }
}
import type { WheelSetupFields } from './wheel-offset-math';
import { DEFAULT_CURRENT_WHEEL, DEFAULT_NEW_WHEEL } from './wheel-offset-insights';

export const TIRE_SIZE_URL_KEYS = ['size'] as const;
export const TIRE_COMPARISON_URL_KEYS = ['from', 'to', 'third'] as const;
export const TIRE_COMPARISON_LEGACY_KEYS = ['current', 'new'] as const;
export const TIRE_DIAMETER_URL_KEYS = ['d', 'rim', 'unit', 'tol'] as const;
export const TIRE_DIAMETER_LEGACY_KEYS = ['diameter', 'wheel'] as const;
export const GEAR_RATIO_URL_KEYS = [
  'stock',
  'new',
  'ratio',
  'speed',
  'speedUnit',
  'top',
  'first',
  'low',
  'bias',
] as const;
export const GEAR_RATIO_LEGACY_KEYS = [
  'squat',
  'squatpct',
  'cruise',
  'desired',
  'sunit',
  'tcase',
] as const;
export const WHEEL_OFFSET_URL_KEYS = ['w1', 'o1', 'w2', 'o2', 'rim', 'rim2'] as const;

function parsePositiveNumber(
  raw: string | null,
  { min = 0, max = 999 }: { min?: number; max?: number } = {},
): number | null {
  if (!raw?.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

function parseSignedNumber(
  raw: string | null,
  { min = -999, max = 999 }: { min?: number; max?: number } = {},
): number | null {
  if (!raw?.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

function formatNumberParam(value: number, decimals = 2): string {
  const rounded = Math.round(value * 10 ** decimals) / 10 ** decimals;
  return String(rounded);
}

/** Replace query params without navigation or extra history entries. */
export function syncCalculatorUrl(
  keys: readonly string[],
  values: Record<string, string | null | undefined>,
  legacyKeysToRemove: readonly string[] = [],
): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  for (const legacy of legacyKeysToRemove) params.delete(legacy);

  for (const key of keys) {
    if (!(key in values)) continue;
    const value = values[key];
    if (value == null || value === '') params.delete(key);
    else params.set(key, value);
  }

  const qs = params.toString();
  const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next !== current) window.history.replaceState(null, '', next);
}

export function parseTireSizeFromSearch(
  params: URLSearchParams,
  fallback?: string,
): string | undefined {
  const raw = params.get('size')?.trim();
  // Missing size → optional fallback. Invalid size → undefined (do not invent a demo size).
  if (!raw) return fallback;

  const normalized = normalizeTireSizeInput(raw);
  if (!isParsableTireSize(normalized)) return undefined;
  return normalized;
}

export function parseSizeFormatFromSearch(
  params: URLSearchParams,
): 'metric' | 'flotation' | null {
  const raw = params.get('format')?.trim().toLowerCase();
  if (raw === 'metric' || raw === 'flotation') return raw;
  return null;
}

export function parseDisplayUnitsFromSearch(
  params: URLSearchParams,
): 'imperial' | 'metric' | 'both' | null {
  const raw = params.get('units')?.trim().toLowerCase();
  if (raw === 'imperial' || raw === 'metric' || raw === 'both') return raw;
  if (raw === 'inches') return 'imperial';
  return null;
}

export function tireSizeUrlValues(sizeLabel: string | null | undefined): Record<string, string | null> {
  if (!sizeLabel || !isParsableTireSize(sizeLabel)) {
    return { size: null };
  }
  return { size: sizeLabel };
}

export function parseTireComparisonFromSearch(
  params: URLSearchParams,
  defaults: { from: string; to: string; third?: string },
): { from: string; to: string; third?: string } {
  const fromRaw = params.get('from') ?? params.get('current');
  const toRaw = params.get('to') ?? params.get('new');
  const thirdRaw = params.get('third');

  const from = fromRaw ? normalizeTireSize(fromRaw) : defaults.from;
  const to = toRaw ? normalizeTireSize(toRaw) : defaults.to;

  const result: { from: string; to: string; third?: string } = {
    from: from && parseFullSizeToFields(from) ? from : defaults.from,
    to: to && parseFullSizeToFields(to) ? to : defaults.to,
  };

  if (thirdRaw?.trim()) {
    const third = normalizeTireSize(thirdRaw);
    if (third && parseFullSizeToFields(third)) result.third = third;
  } else if (defaults.third && parseFullSizeToFields(defaults.third)) {
    result.third = defaults.third;
  }

  return result;
}

export function tireComparisonUrlValues(
  from: string | null | undefined,
  to: string | null | undefined,
  third?: string | null | undefined,
): Record<string, string | null> {
  const normalizedFrom = normalizeTireSize(from);
  const normalizedTo = normalizeTireSize(to);
  const normalizedThird = normalizeTireSize(third);
  if (!normalizedFrom || !normalizedTo) {
    return { from: null, to: null, third: null };
  }

  const values: Record<string, string | null> = {
    from: normalizedFrom,
    to: normalizedTo,
  };
  if (normalizedThird) values.third = normalizedThird;
  else values.third = null;
  return values;
}

export function parseTireDiameterFromSearch(
  params: URLSearchParams,
  defaults: { diameter: number; rim: WheelDiameterOption | 'any' },
): {
  diameter: number;
  rim: WheelDiameterOption | 'any';
  unit: 'imperial' | 'metric';
  tolerance: 0.5 | 1 | 2 | 3;
} {
  const diameterRaw = params.get('d') ?? params.get('diameter');
  const rimRaw = params.get('rim') ?? params.get('wheel');
  const unitRaw = params.get('unit')?.trim().toLowerCase();
  const tolRaw = params.get('tol');

  const parsedDiameter = diameterRaw ? Number(diameterRaw) : defaults.diameter;
  const diameter =
    Number.isFinite(parsedDiameter) && parsedDiameter > 0 && parsedDiameter <= 60
      ? parsedDiameter
      : defaults.diameter;

  let unit: 'imperial' | 'metric' = 'imperial';
  if (unitRaw === 'mm' || unitRaw === 'metric' || unitRaw === 'millimetres' || unitRaw === 'millimeters') {
    unit = 'metric';
  } else if (unitRaw === 'in' || unitRaw === 'inch' || unitRaw === 'inches' || unitRaw === 'imperial') {
    unit = 'imperial';
  }

  const TOLERANCE_SET = new Set([0.5, 1, 2, 3]);
  const parsedTol = tolRaw != null ? Number(tolRaw) : 1;
  const tolerance = (
    Number.isFinite(parsedTol) && TOLERANCE_SET.has(parsedTol) ? parsedTol : 1
  ) as 0.5 | 1 | 2 | 3;

  if (rimRaw?.trim().toLowerCase() === 'any') {
    return { diameter, rim: 'any', unit, tolerance };
  }

  const parsedRim = rimRaw ? Number(rimRaw) : typeof defaults.rim === 'number' ? defaults.rim : 18;
  const validWheels = WHEEL_DIAMETER_OPTIONS as readonly number[];
  const defaultRim = typeof defaults.rim === 'number' ? defaults.rim : 18;
  const rim = (
    validWheels.includes(parsedRim) ? parsedRim : defaultRim
  ) as WheelDiameterOption;

  return { diameter, rim, unit, tolerance };
}

export function tireDiameterUrlValues(
  diameterIn: number | null,
  rimIn: WheelDiameterOption | 'any' | null,
  unit: 'imperial' | 'metric' = 'imperial',
  tolerance: 0.5 | 1 | 2 | 3 = 1,
): Record<string, string | null> {
  if (diameterIn == null || !Number.isFinite(diameterIn) || diameterIn <= 0) {
    return { d: null, rim: null, unit: null, tol: null };
  }
  const unitParam = unit === 'metric' ? 'mm' : 'in';
  const tolParam = String(tolerance);
  if (rimIn === 'any') {
    return {
      d: formatNumberParam(diameterIn, 1),
      rim: 'any',
      unit: unitParam,
      tol: tolParam,
    };
  }
  if (rimIn == null || !(WHEEL_DIAMETER_OPTIONS as readonly number[]).includes(rimIn)) {
    return { d: null, rim: null, unit: null, tol: null };
  }
  return {
    d: formatNumberParam(diameterIn, 1),
    rim: String(rimIn),
    unit: unitParam,
    tol: tolParam,
  };
}

export function parseGearRatioFromSearch(
  params: URLSearchParams,
  defaults: GearRatioFields = DEFAULT_GEAR_FIELDS,
): GearRatioFields {
  const stock = parsePositiveNumber(params.get('stock'), { min: 15, max: 60 });
  const next = parsePositiveNumber(params.get('new'), { min: 15, max: 60 });
  const ratio = parsePositiveNumber(params.get('ratio'), { min: 2, max: 7.5 });
  const speed = parsePositiveNumber(params.get('speed'), { min: 20, max: 160 });
  const top = parsePositiveNumber(params.get('top'), { min: 0.4, max: 1.2 });
  const first = parsePositiveNumber(params.get('first'), { min: 2, max: 8 });
  const low = parsePositiveNumber(params.get('low') ?? params.get('tcase'), { min: 1.5, max: 5 });
  const bias = parsePositiveNumber(params.get('bias'), { min: 0, max: 10 });
  const sunitRaw = (params.get('speedUnit') ?? params.get('sunit'))?.trim().toLowerCase();
  const speedUnit =
    sunitRaw === 'kmh' || sunitRaw === 'mph' ? (sunitRaw as 'mph' | 'kmh') : defaults.speedUnit;

  // Legacy squat / cruise / sunit / tcase params are intentionally ignored or aliased above.
  return {
    ...defaults,
    ...(stock != null ? { currentDiameterIn: formatNumberParam(stock, 1) } : {}),
    ...(next != null ? { newDiameterIn: formatNumberParam(next, 1) } : {}),
    ...(ratio != null ? { stockGearRatio: formatNumberParam(ratio, 2) } : {}),
    ...(speed != null ? { speed: formatNumberParam(speed, 1) } : {}),
    ...(top != null ? { transTopGear: formatNumberParam(top, 2) } : {}),
    ...(first != null ? { firstGearRatio: formatNumberParam(first, 2) } : {}),
    ...(low != null ? { transferLowRatio: formatNumberParam(low, 2) } : {}),
    ...(bias != null ? { lowSpeedBiasPercent: String(Math.round(bias)) } : {}),
    speedUnit,
  };
}

export function gearRatioUrlValues(fields: GearRatioFields): Record<string, string | null> {
  const stock = parsePositiveNumber(fields.currentDiameterIn, { min: 15, max: 60 });
  const next = parsePositiveNumber(fields.newDiameterIn, { min: 15, max: 60 });
  const ratio = parsePositiveNumber(fields.stockGearRatio, { min: 2, max: 7.5 });

  if (stock == null || next == null || ratio == null) {
    return {
      stock: null,
      new: null,
      ratio: null,
      speed: null,
      speedUnit: null,
      top: null,
      first: null,
      low: null,
      bias: null,
    };
  }

  const speed = parsePositiveNumber(fields.speed, { min: 20, max: 160 });
  const top = parsePositiveNumber(fields.transTopGear, { min: 0.4, max: 1.2 });
  const first = parsePositiveNumber(fields.firstGearRatio, { min: 2, max: 8 });
  const low = parsePositiveNumber(fields.transferLowRatio, { min: 1.5, max: 5 });
  const bias = parsePositiveNumber(fields.lowSpeedBiasPercent, { min: 0, max: 10 });
  const biasIsDefault = bias === 5 || fields.lowSpeedBiasPercent.trim() === '';

  return {
    stock: formatNumberParam(stock, 1),
    new: formatNumberParam(next, 1),
    ratio: formatNumberParam(ratio, 2),
    speed: speed != null ? formatNumberParam(speed, 1) : null,
    speedUnit: speed != null && fields.speedUnit === 'kmh' ? 'kmh' : null,
    top: top != null ? formatNumberParam(top, 2) : null,
    first: first != null ? formatNumberParam(first, 2) : null,
    low: low != null ? formatNumberParam(low, 2) : null,
    bias: bias != null && !biasIsDefault ? String(Math.round(bias)) : null,
  };
}

export function parseWheelOffsetFromSearch(
  params: URLSearchParams,
  defaults: { current: WheelSetupFields; new: WheelSetupFields },
): { current: WheelSetupFields; new: WheelSetupFields } {
  const w1 = parsePositiveNumber(params.get('w1'), { min: 4, max: 20 });
  const o1 = parseSignedNumber(params.get('o1'), { min: -100, max: 100 });
  const w2 = parsePositiveNumber(params.get('w2'), { min: 4, max: 20 });
  const o2 = parseSignedNumber(params.get('o2'), { min: -100, max: 100 });
  // Prefer rim / rim2 (project convention). Accept d1 / d2 as aliases.
  const rim = parsePositiveNumber(
    params.get('rim') ?? params.get('rim1') ?? params.get('d1'),
    { min: 10, max: 30 },
  );
  const rim2 = parsePositiveNumber(
    params.get('rim2') ?? params.get('d2'),
    { min: 10, max: 30 },
  );

  const current: WheelSetupFields = {
    widthIn: w1 != null ? String(w1) : defaults.current.widthIn,
    offsetMm: o1 != null ? String(o1) : defaults.current.offsetMm,
    diameterIn: rim != null ? String(rim) : defaults.current.diameterIn,
  };

  const nextSetup: WheelSetupFields = {
    widthIn: w2 != null ? String(w2) : defaults.new.widthIn,
    offsetMm: o2 != null ? String(o2) : defaults.new.offsetMm,
    // Old links with only `rim` apply that diameter to both wheels.
    diameterIn:
      rim2 != null ? String(rim2) : rim != null ? String(rim) : defaults.new.diameterIn,
  };

  return { current, new: nextSetup };
}

export function wheelOffsetUrlValues(
  current: WheelSetupFields,
  nextSetup: WheelSetupFields,
): Record<string, string | null> {
  const w1 = parsePositiveNumber(current.widthIn, { min: 4, max: 20 });
  const o1 = parseSignedNumber(current.offsetMm, { min: -100, max: 100 });
  const w2 = parsePositiveNumber(nextSetup.widthIn, { min: 4, max: 20 });
  const o2 = parseSignedNumber(nextSetup.offsetMm, { min: -100, max: 100 });
  const rim = parsePositiveNumber(current.diameterIn, { min: 10, max: 30 });
  const rim2 = parsePositiveNumber(nextSetup.diameterIn, { min: 10, max: 30 });

  if (w1 == null || o1 == null || w2 == null || o2 == null || rim == null || rim2 == null) {
    return { w1: null, o1: null, w2: null, o2: null, rim: null, rim2: null };
  }

  // Always emit separate diameter params so shared URLs preserve both wheels.
  // Old links that only include `rim` still parse (both diameters use that value).
  return {
    w1: formatNumberParam(w1, 1),
    o1: formatNumberParam(o1, 1),
    w2: formatNumberParam(w2, 1),
    o2: formatNumberParam(o2, 1),
    rim: formatNumberParam(rim, 1),
    rim2: formatNumberParam(rim2, 1),
  };
}

export function fieldsFromTireSize(size: string): TireSizeInputFields | null {
  return parseFullSizeToFields(normalizeTireSizeInput(size));
}
