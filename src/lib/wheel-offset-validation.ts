import type { WheelSetupFields } from './wheel-offset-math';

export const WHEEL_WIDTH_MIN_IN = 4;
export const WHEEL_WIDTH_MAX_IN = 20;
export const WHEEL_DIAMETER_MIN_IN = 10;
export const WHEEL_DIAMETER_MAX_IN = 30;
export const WHEEL_OFFSET_MIN_MM = -100;
export const WHEEL_OFFSET_MAX_MM = 100;

export type WheelFieldKey = keyof WheelSetupFields;

export interface WheelFieldValidation {
  valid: boolean;
  message: string | null;
}

const FIELD_LABELS: Record<WheelFieldKey, string> = {
  widthIn: 'wheel width',
  diameterIn: 'wheel diameter',
  offsetMm: 'offset',
};

/** Normalize pasted input: trim and strip common unit suffixes. */
export function normalizeWheelInput(raw: string): string {
  return raw
    .trim()
    .replace(/\s*(in|inch|inches|mm|")\s*$/i, '')
    .replace(/\s+/g, '');
}

function parseNumericInput(raw: string): number | null {
  const normalized = normalizeWheelInput(raw);
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function validateWheelField(
  key: WheelFieldKey,
  raw: string,
  { showEmptyError = false }: { showEmptyError?: boolean } = {},
): WheelFieldValidation {
  const normalized = normalizeWheelInput(raw);

  if (normalized === '') {
    return {
      valid: false,
      message: showEmptyError ? `Enter a ${FIELD_LABELS[key]}.` : null,
    };
  }

  const value = parseNumericInput(raw);
  if (value == null) {
    return { valid: false, message: `Enter a valid ${FIELD_LABELS[key]}.` };
  }

  switch (key) {
    case 'widthIn':
      if (value < WHEEL_WIDTH_MIN_IN || value > WHEEL_WIDTH_MAX_IN) {
        return {
          valid: false,
          message: `Enter a wheel width between ${WHEEL_WIDTH_MIN_IN} and ${WHEEL_WIDTH_MAX_IN} inches.`,
        };
      }
      break;
    case 'diameterIn':
      if (value < WHEEL_DIAMETER_MIN_IN || value > WHEEL_DIAMETER_MAX_IN) {
        return {
          valid: false,
          message: `Enter a wheel diameter between ${WHEEL_DIAMETER_MIN_IN} and ${WHEEL_DIAMETER_MAX_IN} inches.`,
        };
      }
      break;
    case 'offsetMm':
      if (value < WHEEL_OFFSET_MIN_MM || value > WHEEL_OFFSET_MAX_MM) {
        return {
          valid: false,
          message: `Enter an offset between ${WHEEL_OFFSET_MIN_MM} mm and +${WHEEL_OFFSET_MAX_MM} mm.`,
        };
      }
      break;
  }

  return { valid: true, message: null };
}

export function validateWheelSetup(
  fields: WheelSetupFields,
  touched: Partial<Record<WheelFieldKey, boolean>> = {},
): { valid: boolean; errors: Partial<Record<WheelFieldKey, string | null>> } {
  const keys: WheelFieldKey[] = ['widthIn', 'diameterIn', 'offsetMm'];
  const errors: Partial<Record<WheelFieldKey, string | null>> = {};
  let valid = true;

  for (const key of keys) {
    const result = validateWheelField(key, fields[key], { showEmptyError: Boolean(touched[key]) });
    if (!result.valid) {
      valid = false;
      if (touched[key] || fields[key].trim() !== '') {
        errors[key] = result.message;
      }
    } else {
      errors[key] = null;
    }
  }

  return { valid, errors };
}

export function isWheelSetupParseable(fields: WheelSetupFields): boolean {
  return validateWheelSetup(fields, {
    widthIn: true,
    diameterIn: true,
    offsetMm: true,
  }).valid;
}
