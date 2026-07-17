import { parseTireSize, getTireSpecs, type TireSpecs } from './tire-math';
import type {
  CalculatorMessage,
  FlotationInputFields,
  SizeFormat,
  TireSizeInputFields,
} from './calculator-types';
import { normalizeTireSizeInput } from './tire-size-validation';

export type { FlotationInputFields, SizeFormat, TireSizeInputFields } from './calculator-types';

const EMPTY_MESSAGE =
  'Enter a tire size — for example 275/70R18 (metric) or 33x12.50R17 (flotation).';
const INVALID_MESSAGE =
  'Enter a valid tire size. Metric example: 275/70R18. Flotation example: 33x12.50R17.';

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

export function flotationFieldsToTireSizeString(
  fields: FlotationInputFields,
): string | null {
  const overall = Number(fields.overallDiameter);
  const section = Number(fields.sectionWidth);
  const wheel = Number(fields.wheelDiameter);

  if (
    fields.overallDiameter.trim() === '' ||
    fields.sectionWidth.trim() === '' ||
    fields.wheelDiameter.trim() === ''
  ) {
    return null;
  }

  if (!Number.isFinite(overall) || !Number.isFinite(section) || !Number.isFinite(wheel)) {
    return null;
  }

  if (overall <= 0 || section <= 0 || wheel <= 0) {
    return null;
  }

  const overallStr =
    overall % 1 === 0 ? String(overall) : String(Number(overall.toFixed(1)));
  const sectionStr = section.toFixed(2);
  const wheelStr =
    wheel % 1 === 0 ? String(wheel) : String(Number(wheel.toFixed(1)));

  return `${overallStr}x${sectionStr}R${wheelStr}`;
}

/** Parse a pasted full size string into metric input fields. */
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

/** Parse a pasted size into flotation input fields. */
export function parseFullSizeToFlotationFields(
  size: string,
): FlotationInputFields | null {
  const trimmed = normalizeTireSizeInput(size.trim());
  if (!trimmed) return null;

  try {
    const parsed = parseTireSize(trimmed);
    if (parsed.type === 'flotation') {
      const match = trimmed.match(
        /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)[A-Z](\d+(?:\.\d+)?)$/i,
      );
      if (!match) return null;
      const [, overall, section, wheel] = match;
      return {
        overallDiameter: overall,
        sectionWidth: Number(section).toFixed(2),
        wheelDiameter: wheel,
      };
    }

    const specs = getTireSpecs(trimmed);
    return {
      overallDiameter:
        Math.abs(specs.overallDiameterIn - Math.round(specs.overallDiameterIn)) < 0.05
          ? String(Math.round(specs.overallDiameterIn))
          : specs.overallDiameterIn.toFixed(1),
      sectionWidth: specs.sectionWidthIn.toFixed(2),
      wheelDiameter:
        parsed.wheelDiameterIn % 1 === 0
          ? String(parsed.wheelDiameterIn)
          : String(parsed.wheelDiameterIn),
    };
  } catch {
    return null;
  }
}

export function detectSizeFormat(size: string): SizeFormat {
  const normalized = normalizeTireSizeInput(size);
  return /x/i.test(normalized) ? 'flotation' : 'metric';
}

export function getCalculatorMessage(
  fields: TireSizeInputFields,
  flotationFields?: FlotationInputFields,
  sizeFormat: SizeFormat = 'metric',
): CalculatorMessage {
  if (sizeFormat === 'flotation' && flotationFields) {
    const hasAny =
      flotationFields.overallDiameter.trim() !== '' ||
      flotationFields.sectionWidth.trim() !== '' ||
      flotationFields.wheelDiameter.trim() !== '';

    if (!hasAny) {
      return { status: 'empty', text: EMPTY_MESSAGE };
    }

    const sizeString = flotationFieldsToTireSizeString(flotationFields);
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

export function getSpecsFromFlotationFields(
  fields: FlotationInputFields,
): TireSpecs | null {
  const sizeString = flotationFieldsToTireSizeString(fields);
  if (!sizeString) return null;

  try {
    return getTireSpecs(sizeString);
  } catch {
    return null;
  }
}
