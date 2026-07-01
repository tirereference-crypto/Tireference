import { parseTireSize, getTireSpecs, type TireSpecs } from './tire-math';
import type {
  CalculatorMessage,
  CalculatorStatus,
  TireSizeInputFields,
} from './calculator-types';
import { normalizeTireSizeInput } from './tire-size-validation';

const EMPTY_MESSAGE =
  'Enter width, aspect ratio, and wheel size — or paste a full size like 275/70R18.';
const INVALID_MESSAGE =
  'Enter valid positive numbers (e.g. width 275, aspect 70, wheel 18).';

export function fieldsToTireSizeString(
  fields: TireSizeInputFields,
): string | null {
  const width = Number(fields.width);
  const aspect = Number(fields.aspectRatio);
  const wheel = Number(fields.wheelDiameter);

  if (
    fields.width.trim() === '' ||
    fields.aspectRatio.trim() === '' ||
    fields.wheelDiameter.trim() === ''
  ) {
    return null;
  }

  if (!Number.isFinite(width) || !Number.isFinite(aspect) || !Number.isFinite(wheel)) {
    return null;
  }

  if (width <= 0 || aspect <= 0 || wheel <= 0) {
    return null;
  }

  const widthInt = Math.round(width);
  const aspectInt = Math.round(aspect);
  const wheelStr =
    wheel % 1 === 0 ? String(wheel) : String(Number(wheel.toFixed(1)));

  return `${widthInt}/${aspectInt}R${wheelStr}`;
}

/** Parse a pasted full size string into the three input fields. */
export function parseFullSizeToFields(
  size: string,
): TireSizeInputFields | null {
  const trimmed = normalizeTireSizeInput(size.trim());
  if (!trimmed) return null;

  try {
    const parsed = parseTireSize(trimmed);
    return {
      width: String(Math.round(parsed.widthMm)),
      aspectRatio: String(Math.round(parsed.aspectRatio)),
      wheelDiameter:
        parsed.wheelDiameterIn % 1 === 0
          ? String(parsed.wheelDiameterIn)
          : String(parsed.wheelDiameterIn),
    };
  } catch {
    return null;
  }
}

export function getCalculatorMessage(
  fields: TireSizeInputFields,
): CalculatorMessage {
  const hasAny =
    fields.width.trim() !== '' ||
    fields.aspectRatio.trim() !== '' ||
    fields.wheelDiameter.trim() !== '';

  if (!hasAny) {
    return { status: 'empty', text: EMPTY_MESSAGE };
  }

  const sizeString = fieldsToTireSizeString(fields);
  if (!sizeString) {
    return { status: 'invalid', text: INVALID_MESSAGE };
  }

  try {
    getTireSpecs(sizeString);
    return { status: 'ready', text: '' };
  } catch {
    return { status: 'invalid', text: INVALID_MESSAGE };
  }
}

export function getSpecsFromFields(
  fields: TireSizeInputFields,
): TireSpecs | null {
  const sizeString = fieldsToTireSizeString(fields);
  if (!sizeString) return null;

  try {
    return getTireSpecs(sizeString);
  } catch {
    return null;
  }
}

export function isCompleteFields(fields: TireSizeInputFields): boolean {
  return getCalculatorMessage(fields).status === 'ready';
}

export { EMPTY_MESSAGE, INVALID_MESSAGE };
export type { CalculatorStatus };
