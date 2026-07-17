/**
 * Client-safe production-status helpers from the slim master-product index.
 * Counts (bc/mc/pc) reflect the full master tire database for each size.
 * Does NOT import master_size_to_products.json.
 */
import slimIndex from '../data/generated/size-availability-slim.json';
import { tireSizeSlug } from './tire-size-url';

type SlimRow = {
  b?: string[];
  c?: string[];
  m?: unknown[];
  /** Full master brand count for this size. */
  bc?: number;
  /** Full master unique model count for this size. */
  mc?: number;
  /** Full master product/SKU count for this size. */
  pc?: number;
};

const INDEX = slimIndex as Record<string, SlimRow>;

/** Common = broad coverage in the master tire database. */
export const COMMON_PRODUCTION_MIN_BRANDS = 3;
export const COMMON_PRODUCTION_MIN_MODELS = 12;

export interface SizeProductStats {
  brandCount: number;
  modelCount: number;
  productCount: number;
}

function candidateSlugs(size: string): string[] {
  const raw = size.trim();
  if (!raw) return [];
  const compact = raw.toUpperCase().replace(/\s+/g, '');
  const keys = new Set<string>();

  for (const candidate of [raw, compact]) {
    try {
      keys.add(tireSizeSlug(candidate));
    } catch {
      /* try next */
    }
  }

  // Manual fallback: 275/70R18 → 275-70r18
  const manual = compact
    .toLowerCase()
    .replace(/^p(?=\d)/, '')
    .replace(/\//g, '-');
  if (manual) keys.add(manual);

  return [...keys];
}

export function getSizeProductStats(size: string): SizeProductStats | null {
  for (const key of candidateSlugs(size)) {
    const row = INDEX[key];
    if (!row) continue;
    const brandCount = row.bc ?? row.b?.length ?? 0;
    const modelCount = row.mc ?? (Array.isArray(row.m) ? row.m.length : 0);
    const productCount = row.pc ?? 0;
    if (brandCount === 0 && modelCount === 0 && productCount === 0) continue;
    return { brandCount, modelCount, productCount };
  }
  return null;
}

export function isInProductDatabase(size: string): boolean {
  return getSizeProductStats(size) !== null;
}

export function isCommonProductionSize(size: string): boolean {
  const stats = getSizeProductStats(size);
  if (!stats) return false;
  return (
    stats.brandCount >= COMMON_PRODUCTION_MIN_BRANDS &&
    stats.modelCount >= COMMON_PRODUCTION_MIN_MODELS
  );
}

export type DatabaseProductionLabel =
  | 'Common production size'
  | 'Limited production size';

export function getDatabaseProductionLabel(size: string): DatabaseProductionLabel | null {
  const stats = getSizeProductStats(size);
  if (!stats) return null;
  if (
    stats.brandCount >= COMMON_PRODUCTION_MIN_BRANDS &&
    stats.modelCount >= COMMON_PRODUCTION_MIN_MODELS
  ) {
    return 'Common production size';
  }
  return 'Limited production size';
}
