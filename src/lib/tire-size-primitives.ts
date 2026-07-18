/**
 * Layer 1: pure tire-size identity primitives for comparison URLs.
 *
 * Responsible only for parsing, validating, normalizing, displaying, and
 * slugifying a single tire size. Must not import content generation, page
 * components, link collections, comparison insights, or product data.
 *
 * Slug dialect (comparison): `225-45-r17`, `lt-265-75-r16`, `33-x-12.50-r17`.
 * This is intentionally distinct from the hub slug dialect (`275-70r18`).
 */

export type ComparisonTireSizeType = 'metric' | 'flotation';

export interface ParsedTireSize {
  type: ComparisonTireSizeType;
  prefix: '' | 'P' | 'LT';
  normalized: string;
  display: string;
  slug: string;
  widthMm: number;
  aspectRatio: number;
  wheelDiameterIn: number;
  overallDiameterIn: number;
}

/** @deprecated Prefer ParsedTireSize — kept for existing imports. */
export type ParsedComparisonTireSize = ParsedTireSize;

const METRIC_INPUT =
  /^(?:(LT|P)\s*)?(\d{3})\s*[/-]\s*(\d{2})\s*R\s*(\d{2}(?:\.\d)?)$/i;
const FLOTATION_INPUT =
  /^(?:(LT)\s*)?(\d{2}(?:\.\d)?)\s*X\s*(\d{1,2}(?:\.\d{1,2})?)\s*R\s*(\d{2}(?:\.\d)?)$/i;
const METRIC_SLUG = /^(?:(lt|p)-)?(\d{3})-(\d{2})-r(\d{2}(?:\.\d)?)$/i;
const FLOTATION_SLUG =
  /^(?:(lt)-)?(\d{2}(?:\.\d)?)-x-(\d{1,2}(?:\.\d{1,2})?)-r(\d{2}(?:\.\d)?)$/i;

function decodeTireSizeInput(input: string): string | null {
  try {
    return decodeURIComponent(input).trim();
  } catch {
    return null;
  }
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function isPositive(...values: number[]): boolean {
  return values.every((value) => Number.isFinite(value) && value > 0);
}

function buildMetricSize(
  prefixInput: string | undefined,
  widthInput: string,
  aspectInput: string,
  wheelInput: string,
): ParsedTireSize | null {
  const prefix = (prefixInput?.toUpperCase() ?? '') as '' | 'P' | 'LT';
  const widthMm = Number(widthInput);
  const aspectRatio = Number(aspectInput);
  const wheelDiameterIn = Number(wheelInput);
  if (!isPositive(widthMm, aspectRatio, wheelDiameterIn)) return null;

  const wheel = formatNumber(wheelDiameterIn);
  const normalized = `${prefix}${widthInput}/${aspectInput}R${wheel}`;
  const slugPrefix = prefix ? `${prefix.toLowerCase()}-` : '';
  const slug = `${slugPrefix}${widthInput}-${aspectInput}-r${wheel}`.toLowerCase();
  const overallDiameterIn =
    wheelDiameterIn + (2 * widthMm * (aspectRatio / 100)) / 25.4;

  return {
    type: 'metric',
    prefix,
    normalized,
    display: normalized,
    slug,
    widthMm,
    aspectRatio,
    wheelDiameterIn,
    overallDiameterIn,
  };
}

function buildFlotationSize(
  prefixInput: string | undefined,
  overallInput: string,
  widthInput: string,
  wheelInput: string,
): ParsedTireSize | null {
  const prefix = (prefixInput?.toUpperCase() ?? '') as '' | 'LT';
  const overallDiameterIn = Number(overallInput);
  const sectionWidthIn = Number(widthInput);
  const wheelDiameterIn = Number(wheelInput);
  if (!isPositive(overallDiameterIn, sectionWidthIn, wheelDiameterIn)) return null;
  if (overallDiameterIn <= wheelDiameterIn) return null;

  const overall = formatNumber(overallDiameterIn);
  const section = sectionWidthIn.toFixed(2);
  const wheel = formatNumber(wheelDiameterIn);
  const normalized = `${prefix}${overall}x${section}R${wheel}`;
  const slugPrefix = prefix ? 'lt-' : '';
  const slug = `${slugPrefix}${overall}-x-${section}-r${wheel}`.toLowerCase();
  const widthMm = sectionWidthIn * 25.4;
  const aspectRatio =
    (((overallDiameterIn - wheelDiameterIn) / 2) / sectionWidthIn) * 100;

  return {
    type: 'flotation',
    prefix,
    normalized,
    display: normalized,
    slug,
    widthMm,
    aspectRatio,
    wheelDiameterIn,
    overallDiameterIn,
  };
}

/** Parse and strictly validate a tire size used by comparison URLs. */
export function parseTireSize(
  input: string | null | undefined,
): ParsedTireSize | null {
  if (input == null) return null;
  const decoded = decodeTireSizeInput(input);
  if (!decoded) return null;

  const metric = decoded.match(METRIC_INPUT);
  if (metric) return buildMetricSize(metric[1], metric[2], metric[3], metric[4]);

  const flotation = decoded.match(FLOTATION_INPUT);
  if (flotation) {
    return buildFlotationSize(
      flotation[1],
      flotation[2],
      flotation[3],
      flotation[4],
    );
  }

  return null;
}

export function isValidTireSize(input: string | null | undefined): boolean {
  return parseTireSize(input) !== null;
}

export function normalizeTireSize(
  input: string | null | undefined,
): string | null {
  return parseTireSize(input)?.normalized ?? null;
}

export function formatDisplaySize(
  input: string | null | undefined,
): string | null {
  return parseTireSize(input)?.display ?? null;
}

export function formatSizeSlug(
  input: string | null | undefined,
): string | null {
  return parseTireSize(input)?.slug ?? null;
}

/** Parse one comparison tire-size slug back to its normalized display value. */
export function parseSizeSlug(slug: string): ParsedTireSize | null {
  const normalizedSlug = slug.trim().toLowerCase();

  const metric = normalizedSlug.match(METRIC_SLUG);
  if (metric) return buildMetricSize(metric[1], metric[2], metric[3], metric[4]);

  const flotation = normalizedSlug.match(FLOTATION_SLUG);
  if (flotation) {
    return buildFlotationSize(
      flotation[1],
      flotation[2],
      flotation[3],
      flotation[4],
    );
  }

  return null;
}

/** @deprecated Prefer parseTireSize. */
export const parseComparisonTireSize = parseTireSize;
/** @deprecated Prefer isValidTireSize. */
export const isValidComparisonTireSize = isValidTireSize;
/** @deprecated Prefer normalizeTireSize. */
export const normalizeComparisonTireSize = normalizeTireSize;
/** @deprecated Prefer formatDisplaySize. */
export const formatComparisonTireSize = formatDisplaySize;
/** @deprecated Prefer formatSizeSlug. */
export const tireSizeComparisonSlug = formatSizeSlug;
/** @deprecated Prefer parseSizeSlug. */
export const parseTireSizeComparisonSlug = parseSizeSlug;
