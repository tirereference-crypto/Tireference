/**
 * Client-safe related tire sizes for the calculator island.
 * Avoids tire-size-products / hub imports that pull multi-MB JSON.
 */
import { TIRE_SIZES } from '../data/tire-sizes';
import { publishedComparePath } from './comparison-redirect';
import { hasTireSizeGuide } from './has-tire-size-guide';
import { getTireSpecs, parseTireSize, type TireSpecs } from './tire-math';
import { tireSizeCalculatorPath, tireSizePath } from './tire-size-url';
import { normalizeTireSizeKey } from './tire-size-validation';

export type RelatedWheelTag = 'same_wheel' | 'different_wheel';

export type RelatedSizeRole =
  | 'nearest_same_wheel'
  | 'narrower_same_wheel'
  | 'wider_same_wheel'
  | 'smaller_diameter'
  | 'larger_diameter'
  | 'different_wheel';

export interface CalculatorRelatedSize {
  size: string;
  href: string;
  /** Published `/compare/` page when available; otherwise null (never parameterized). */
  compareHref: string | null;
  diameterDiffPercent: number;
  widthDiffMm: number;
  sidewallDiffIn: number;
  /** Diameter-based estimated speedometer difference vs the current size. */
  speedometerDiffPercent: number;
  rimIn: number;
  sameWheel: boolean;
  tag: RelatedWheelTag;
  role: RelatedSizeRole;
}

function percentDiameterDiff(base: number, other: number): number {
  return ((other - base) / base) * 100;
}

function sizeHref(size: string): string {
  return hasTireSizeGuide(size) ? tireSizePath(size) : tireSizeCalculatorPath(size);
}

interface Candidate {
  size: string;
  specs: TireSpecs;
  diameterDiffPercent: number;
  widthDiffMm: number;
  sidewallDiffIn: number;
  rimIn: number;
  sameWheel: boolean;
  absDia: number;
  absWidth: number;
}

function gatherCandidates(baseSize: string): { base: TireSpecs; baseWheel: number; rows: Candidate[] } | null {
  let baseSpecs: TireSpecs;
  let baseWheel: number;
  try {
    baseSpecs = getTireSpecs(baseSize);
    baseWheel = parseTireSize(baseSize).wheelDiameterIn;
  } catch {
    return null;
  }

  const baseKey = normalizeTireSizeKey(baseSize);
  const rows: Candidate[] = [];

  for (const entry of TIRE_SIZES) {
    if (normalizeTireSizeKey(entry.size) === baseKey) continue;
    try {
      const specs = getTireSpecs(entry.size);
      const parsed = parseTireSize(entry.size);
      const diameterDiffPercent = percentDiameterDiff(
        baseSpecs.overallDiameterIn,
        specs.overallDiameterIn,
      );
      const widthDiffMm = specs.widthMm - baseSpecs.widthMm;
      const sidewallDiffIn = specs.sidewallIn - baseSpecs.sidewallIn;
      const sameWheel = parsed.wheelDiameterIn === baseWheel;
      const absDia = Math.abs(diameterDiffPercent);
      const absWidth = Math.abs(widthDiffMm);

      if (absDia > 6) continue;
      if (Math.abs(parsed.wheelDiameterIn - baseWheel) > 1) continue;
      if (absWidth > 40) continue;

      rows.push({
        size: entry.size,
        specs,
        diameterDiffPercent,
        widthDiffMm,
        sidewallDiffIn,
        rimIn: parsed.wheelDiameterIn,
        sameWheel,
        absDia,
        absWidth,
      });
    } catch {
      /* skip invalid */
    }
  }

  return { base: baseSpecs, baseWheel, rows };
}

function pickUnique(
  picked: Candidate[],
  candidates: Candidate[],
  predicate: (row: Candidate) => boolean,
  sort: (a: Candidate, b: Candidate) => number,
): Candidate | null {
  const pool = candidates
    .filter((row) => !picked.some((p) => p.size === row.size))
    .filter(predicate)
    .sort(sort);
  return pool[0] ?? null;
}

function toRelated(row: Candidate, role: RelatedSizeRole, baseSize: string): CalculatorRelatedSize {
  return {
    size: row.size,
    href: sizeHref(row.size),
    compareHref: publishedComparePath(baseSize, row.size),
    diameterDiffPercent: row.diameterDiffPercent,
    widthDiffMm: row.widthDiffMm,
    sidewallDiffIn: row.sidewallDiffIn,
    speedometerDiffPercent: row.diameterDiffPercent,
    rimIn: row.rimIn,
    sameWheel: row.sameWheel,
    tag: row.sameWheel ? 'same_wheel' : 'different_wheel',
    role,
  };
}

/**
 * Prioritized related sizes:
 * 1. Nearest same-wheel
 * 2. Slightly narrower same-wheel
 * 3. Slightly wider same-wheel
 * 4. Smaller-diameter
 * 5. Larger-diameter
 * 6. Different-wheel (only when labelled)
 */
export function getCalculatorRelatedSizes(
  baseSize: string,
  limit = 6,
): CalculatorRelatedSize[] {
  const gathered = gatherCandidates(baseSize);
  if (!gathered) return [];
  const { rows } = gathered;
  if (rows.length === 0) return [];

  const picked: Array<{ row: Candidate; role: RelatedSizeRole }> = [];

  const nearest = pickUnique(
    picked.map((p) => p.row),
    rows,
    (row) => row.sameWheel,
    (a, b) => a.absDia - b.absDia || a.absWidth - b.absWidth,
  );
  if (nearest) picked.push({ row: nearest, role: 'nearest_same_wheel' });

  const narrower = pickUnique(
    picked.map((p) => p.row),
    rows,
    (row) => row.sameWheel && row.widthDiffMm < -5,
    (a, b) => a.absWidth - b.absWidth || a.absDia - b.absDia,
  );
  if (narrower) picked.push({ row: narrower, role: 'narrower_same_wheel' });

  const wider = pickUnique(
    picked.map((p) => p.row),
    rows,
    (row) => row.sameWheel && row.widthDiffMm > 5,
    (a, b) => a.absWidth - b.absWidth || a.absDia - b.absDia,
  );
  if (wider) picked.push({ row: wider, role: 'wider_same_wheel' });

  const smaller = pickUnique(
    picked.map((p) => p.row),
    rows,
    (row) => row.sameWheel && row.diameterDiffPercent < -0.4,
    (a, b) => a.absDia - b.absDia || a.absWidth - b.absWidth,
  );
  if (smaller) picked.push({ row: smaller, role: 'smaller_diameter' });

  const larger = pickUnique(
    picked.map((p) => p.row),
    rows,
    (row) => row.sameWheel && row.diameterDiffPercent > 0.4,
    (a, b) => a.absDia - b.absDia || a.absWidth - b.absWidth,
  );
  if (larger) picked.push({ row: larger, role: 'larger_diameter' });

  const different = pickUnique(
    picked.map((p) => p.row),
    rows,
    (row) => !row.sameWheel,
    (a, b) => a.absDia - b.absDia || a.absWidth - b.absWidth,
  );
  if (different && picked.length < limit) {
    picked.push({ row: different, role: 'different_wheel' });
  }

  // Fill remaining slots with nearest remaining same-wheel options
  while (picked.length < limit) {
    const fill = pickUnique(
      picked.map((p) => p.row),
      rows,
      (row) => row.sameWheel,
      (a, b) => a.absDia - b.absDia || a.absWidth - b.absWidth,
    );
    if (!fill) break;
    picked.push({ row: fill, role: 'nearest_same_wheel' });
  }

  return picked.slice(0, limit).map(({ row, role }) => toRelated(row, role, baseSize));
}
