import type { TireRatings } from '../data/tire-sizes';

/**
 * Standard ISO/ETRTO load index → maximum load per tire (kg). Covers the
 * practical range for passenger, SUV, and light-truck tires (71–130).
 */
const LOAD_INDEX_KG: Record<number, number> = {
  71: 345, 72: 355, 73: 365, 74: 375, 75: 387, 76: 400, 77: 412, 78: 425,
  79: 437, 80: 450, 81: 462, 82: 475, 83: 487, 84: 500, 85: 515, 86: 530,
  87: 545, 88: 560, 89: 580, 90: 600, 91: 615, 92: 630, 93: 650, 94: 670,
  95: 690, 96: 710, 97: 730, 98: 750, 99: 775, 100: 800, 101: 825, 102: 850,
  103: 875, 104: 900, 105: 925, 106: 950, 107: 975, 108: 1000, 109: 1030,
  110: 1060, 111: 1090, 112: 1120, 113: 1150, 114: 1180, 115: 1215, 116: 1250,
  117: 1285, 118: 1320, 119: 1360, 120: 1400, 121: 1450, 122: 1500, 123: 1550,
  124: 1600, 125: 1650, 126: 1700, 127: 1750, 128: 1800, 129: 1850, 130: 1900,
};

/** Speed rating symbol → maximum sustained speed (km/h). */
const SPEED_RATING_KMH: Record<string, number> = {
  L: 120, M: 130, N: 140, P: 150, Q: 160, R: 170, S: 180, T: 190, U: 200,
  H: 210, V: 240, W: 270, Y: 300,
};

/** LT / flotation load range letter → ply-rating equivalent. */
const LOAD_RANGE_PLY: Record<string, string> = {
  B: '4-ply rated',
  C: '6-ply rated',
  D: '8-ply rated',
  E: '10-ply rated',
  F: '12-ply rated',
  G: '14-ply rated',
};

export interface ResolvedTireRatings {
  /** Load index as authored, e.g. "91" or "123/120". */
  loadIndex?: string;
  /** Speed rating symbol, e.g. "T". */
  speedRating?: string;
  /** Derived max sustained speed, e.g. "190 km/h (118 mph)". */
  speedRatingLabel?: string;
  /** Load range letter, e.g. "E". */
  loadRange?: string;
  /** Derived ply-rating equivalent for the load range, e.g. "10-ply rated". */
  loadRangePly?: string;
  /** Maximum load per tire (lb) — derived from the load index unless overridden. */
  maxLoadLbs?: number;
  /** Maximum load per tire (kg). */
  maxLoadKg?: number;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.2046226);
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.2046226);
}

function kmhToMph(kmh: number): number {
  return Math.round(kmh / 1.609344);
}

/** Parse the primary (single-application) index from "123/120" or "91". */
export function parsePrimaryLoadIndex(loadIndex: string): number | null {
  const first = loadIndex.split('/')[0]?.trim();
  const value = Number(first);
  return Number.isFinite(value) ? value : null;
}

/** Standard load index → maximum load per tire in kg (null if out of table). */
export function loadIndexToKg(index: number): number | null {
  return LOAD_INDEX_KG[index] ?? null;
}

/**
 * Normalize authored ratings into display-ready values, deriving max load from
 * the load index and max speed from the speed symbol. Returns `null` when no
 * usable field is present so callers can hide the section entirely.
 */
export function resolveTireRatings(
  ratings?: TireRatings,
): ResolvedTireRatings | null {
  if (!ratings) return null;

  const resolved: ResolvedTireRatings = {};

  if (ratings.loadIndex) {
    resolved.loadIndex = ratings.loadIndex;
  }

  if (ratings.speedRating) {
    const symbol = ratings.speedRating.toUpperCase();
    resolved.speedRating = symbol;
    const kmh = SPEED_RATING_KMH[symbol];
    if (kmh) {
      resolved.speedRatingLabel = `${kmh} km/h (${kmhToMph(kmh)} mph)`;
    }
  }

  if (ratings.loadRange) {
    const letter = ratings.loadRange.toUpperCase();
    resolved.loadRange = letter;
    const ply = LOAD_RANGE_PLY[letter];
    if (ply) {
      resolved.loadRangePly = ply;
    }
  }

  // Maximum load: explicit override wins, otherwise derive from the load index.
  let maxLbs: number | null = ratings.maxLoadLbs ?? null;
  let maxKg: number | null = null;
  if (maxLbs != null) {
    maxKg = lbsToKg(maxLbs);
  } else if (ratings.loadIndex) {
    const index = parsePrimaryLoadIndex(ratings.loadIndex);
    if (index != null) {
      maxKg = loadIndexToKg(index);
      if (maxKg != null) maxLbs = kgToLbs(maxKg);
    }
  }
  if (maxLbs != null) resolved.maxLoadLbs = maxLbs;
  if (maxKg != null) resolved.maxLoadKg = maxKg;

  const hasAnyField =
    resolved.loadIndex != null ||
    resolved.speedRating != null ||
    resolved.loadRange != null ||
    resolved.maxLoadLbs != null;

  return hasAnyField ? resolved : null;
}
