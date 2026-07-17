import { TIRE_SIZES } from '../data/tire-sizes';
import { getTireSpecs, parseTireSize } from './tire-math';
import type { TireSizeInputFields } from './calculator-types';
import { fieldsToTireSizeString } from './tire-size-input';
import {
  getSizeProductStats,
  isCommonProductionSize,
  isInProductDatabase,
} from './size-production-status';

export type TireSizeValidationTone = 'green' | 'amber' | 'red' | 'none';

export type TireSizeValidationStatus =
  | 'empty'
  | 'common'
  | 'uncommon'
  | 'custom'
  | 'invalid';

export interface TireSizeValidationResult {
  status: TireSizeValidationStatus;
  tone: TireSizeValidationTone;
  badgeLabel: string;
  normalizedInput: string;
  canonicalSize: string | null;
  suggestions: string[];
  showSuggestions: boolean;
}

/** Hub-page tire size catalog (editorial). Product DB coverage is separate. */
const HUB_CATALOG_SIZES = new Set(
  TIRE_SIZES.map((entry) => normalizeSizeKey(entry.size)),
);

const POPULARITY_SCORES: Record<string, number> = {
  '275/70R18': 100,
  '285/70R17': 98,
  '265/70R17': 96,
  '275/65R18': 94,
  '265/65R18': 92,
  '265/60R18': 90,
  '245/60R18': 88,
  '235/60R18': 86,
  '225/65R17': 84,
  '285/65R20': 82,
  '275/60R20': 80,
  '305/70R18': 78,
  '315/70R17': 76,
  '285/75R16': 74,
  'LT265/75R16': 72,
};

function normalizeSizeKey(size: string): string {
  return size.trim().toUpperCase().replace(/\s+/g, '');
}

export const normalizeTireSizeKey = normalizeSizeKey;

export function isProductionTireSize(size: string): boolean {
  return HUB_CATALOG_SIZES.has(normalizeSizeKey(size));
}

function isKnownCatalogSize(size: string): boolean {
  return HUB_CATALOG_SIZES.has(normalizeSizeKey(size)) || isInProductDatabase(size);
}

export function normalizeTireSizeInput(raw: string): string {
  let input = raw.trim().toUpperCase();
  if (!input) return '';

  const prefixMatch = input.match(/^(LT|P)(.+)$/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  let body = prefixMatch ? prefixMatch[2] : input;

  if (body.includes('X')) {
    return `${prefix}${body.replace(/[\s-]+/g, '')}`;
  }

  body = body.replace(/[\s-]+/g, '/').replace(/\/+/g, '/');

  const compact = body.replace(/\//g, '');

  const compactWithR = compact.match(/^(\d{3})(\d{2})R(\d+(?:\.\d+)?)$/);
  if (compactWithR) {
    const [, width, aspect, wheel] = compactWithR;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }

  const digitsOnly = compact.match(/^(\d{3})(\d{2})(\d{1,2}(?:\.\d+)?)$/);
  if (digitsOnly) {
    const [, width, aspect, wheel] = digitsOnly;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }

  const threePart = body.match(/^(\d+)\/(\d+)\/(\d+(?:\.\d+)?)$/);
  if (threePart) {
    const [, width, aspect, wheel] = threePart;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }

  const missingConstruction = body.match(/^(\d+)\/(\d+)(\d+(?:\.\d+)?)$/);
  if (missingConstruction) {
    const [, width, aspect, wheel] = missingConstruction;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }

  if (!/[A-Z]/.test(body)) {
    body = body.replace(/(\d)\/(\d)(?=\d)/, '$1/$2R');
  }

  return `${prefix}${body}`;
}

function formatCanonicalSize(size: string): string {
  const normalized = normalizeTireSizeInput(size);
  try {
    const parsed = parseTireSize(normalized);
    const width = Math.round(parsed.widthMm);
    const aspect = Math.round(parsed.aspectRatio);
    const wheel =
      parsed.wheelDiameterIn % 1 === 0
        ? String(parsed.wheelDiameterIn)
        : parsed.wheelDiameterIn.toFixed(1);
    const prefix = normalized.startsWith('LT')
      ? 'LT'
      : normalized.startsWith('P') && !normalized.startsWith('LT')
        ? 'P'
        : '';
    return `${prefix}${width}/${aspect}${parsed.construction}${wheel}`;
  } catch {
    return normalized;
  }
}

function tryParseDimensions(input: string) {
  try {
    const normalized = normalizeTireSizeInput(input);
    const parsed = parseTireSize(normalized);
    return {
      normalized,
      canonical: formatCanonicalSize(normalized),
      widthMm: parsed.widthMm,
      aspectRatio: parsed.aspectRatio,
      wheelDiameterIn: parsed.wheelDiameterIn,
    };
  } catch {
    return null;
  }
}

function getPopularityScore(size: string): number {
  const key = normalizeSizeKey(size);
  if (POPULARITY_SCORES[key] !== undefined) return POPULARITY_SCORES[key];
  if (isCommonProductionSize(size)) return 70;
  const stats = getSizeProductStats(size);
  if (stats) return Math.min(60, 20 + stats.modelCount);
  if (HUB_CATALOG_SIZES.has(key)) return 45;
  return 0;
}

function scoreSuggestion(
  query: {
    widthMm: number;
    aspectRatio: number;
    wheelDiameterIn: number;
  } | null,
  candidateSize: string,
): number {
  const key = normalizeSizeKey(candidateSize);
  let score = getPopularityScore(key);

  if (!query) return score;

  try {
    const candidate = getTireSpecs(candidateSize);
    score -= Math.abs(candidate.widthMm - query.widthMm) * 2.4;
    score -= Math.abs(candidate.aspectRatio - query.aspectRatio) * 3.2;
    score -= Math.abs(candidate.wheelDiameterIn - query.wheelDiameterIn) * 8;
  } catch {
    return -Infinity;
  }

  return score;
}

export function suggestTireSizes(
  input: string,
  fields: TireSizeInputFields,
  limit = 3,
): string[] {
  const fieldSize = fieldsToTireSizeString(fields);
  const parsed =
    tryParseDimensions(input) ??
    (fieldSize ? tryParseDimensions(fieldSize) : null);

  const query = parsed
    ? {
        widthMm: parsed.widthMm,
        aspectRatio: parsed.aspectRatio,
        wheelDiameterIn: parsed.wheelDiameterIn,
      }
    : null;

  const canonical = parsed?.canonical ?? null;
  const ranked = TIRE_SIZES.map((entry) => entry.size)
    .filter((size) => normalizeSizeKey(size) !== normalizeSizeKey(canonical ?? ''))
    .map((size) => ({
      size: formatCanonicalSize(size),
      score: scoreSuggestion(query, size),
    }))
    .sort((a, b) => b.score - a.score);

  const unique: string[] = [];
  for (const item of ranked) {
    const key = normalizeSizeKey(item.size);
    if (unique.some((existing) => normalizeSizeKey(existing) === key)) continue;
    unique.push(item.size);
    if (unique.length >= limit) break;
  }

  return unique;
}

export function getTireSizeValidation(
  input: string,
  fields: TireSizeInputFields,
): TireSizeValidationResult {
  const trimmed = input.trim();
  const fieldSize = fieldsToTireSizeString(fields);
  const hasAnyField =
    fields.width.trim() !== '' ||
    fields.aspectRatio.trim() !== '' ||
    fields.wheelDiameter.trim() !== '';

  if (!trimmed && !hasAnyField) {
    return {
      status: 'empty',
      tone: 'none',
      badgeLabel: '',
      normalizedInput: '',
      canonicalSize: null,
      suggestions: [],
      showSuggestions: false,
    };
  }

  const source = trimmed || fieldSize || '';
  const normalizedInput = normalizeTireSizeInput(source);
  const parsed = tryParseDimensions(source);

  if (!parsed) {
    return {
      status: 'invalid',
      tone: 'red',
      badgeLabel: 'No exact tire size found',
      normalizedInput,
      canonicalSize: null,
      suggestions: suggestTireSizes(source, fields),
      showSuggestions: true,
    };
  }

  if (!isKnownCatalogSize(parsed.canonical)) {
    return {
      status: 'custom',
      tone: 'red',
      badgeLabel: 'No exact tire size found',
      normalizedInput: parsed.normalized,
      canonicalSize: parsed.canonical,
      suggestions: suggestTireSizes(source, fields),
      showSuggestions: true,
    };
  }

  if (isCommonProductionSize(parsed.canonical)) {
    return {
      status: 'common',
      tone: 'green',
      badgeLabel: 'Common Production Tire Size',
      normalizedInput: parsed.normalized,
      canonicalSize: parsed.canonical,
      suggestions: [],
      showSuggestions: false,
    };
  }

  return {
    status: 'uncommon',
    tone: 'amber',
    badgeLabel: 'Limited Availability',
    normalizedInput: parsed.normalized,
    canonicalSize: parsed.canonical,
    suggestions: [],
    showSuggestions: false,
  };
}
