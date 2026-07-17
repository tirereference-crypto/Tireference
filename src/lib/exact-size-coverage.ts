/**
 * Exact-size product coverage — single source of truth for calculator + hub counts.
 *
 * Definitions (exact normalized size only; nearby sizes never included):
 *
 * - uniqueModelCount: unique marketed models after normalizing
 *   `brand|model` (case-insensitive). Load-index, speed-rating, and load-range
 *   variants of the same brand+model do NOT create additional unique models.
 *
 * - exactRecordCount: exact-size product/SKU rows in the master index for that
 *   size (each row is one catalog record, often a service/load variant).
 *
 * - serviceVariantCount: same as exactRecordCount — every exact-size product
 *   row is treated as a service/SKU variant record. Prefer this label when
 *   distinguishing variants from unique models.
 *
 * - brandCount: unique brands offering at least one exact-size record.
 *
 * Values are read from size-availability-slim.json fields bc/mc/pc, which are
 * generated from the full master product database (not the UI sample `m[]`).
 */
import {
  getSizeProductStats,
  type SizeProductStats,
} from './size-production-status';

export interface ExactSizeCoverage {
  uniqueModelCount: number;
  exactRecordCount: number;
  serviceVariantCount: number;
  brandCount: number;
}

/** Alias used by UI / docs — same shape as ExactSizeCoverage. */
export type TireProductCounts = ExactSizeCoverage;

export const EMPTY_EXACT_SIZE_COVERAGE: ExactSizeCoverage = {
  uniqueModelCount: 0,
  exactRecordCount: 0,
  serviceVariantCount: 0,
  brandCount: 0,
};

/** Normalize brand+model into the unique-model dedupe key (size is implied by lookup). */
export function uniqueModelKey(brand: string, model: string): string {
  return `${brand.trim().toLowerCase()}|${model
    .replace(/[®™]/g, '')
    .trim()
    .toLowerCase()}`;
}

function fromStats(stats: SizeProductStats | null): ExactSizeCoverage {
  if (!stats) return { ...EMPTY_EXACT_SIZE_COVERAGE };
  return {
    uniqueModelCount: stats.modelCount,
    exactRecordCount: stats.productCount,
    serviceVariantCount: stats.productCount,
    brandCount: stats.brandCount,
  };
}

/**
 * Exact-size coverage for a tire size label (e.g. 275/70R18).
 * Returns zeros when the size has no product-index rows.
 */
export function getExactSizeCoverage(size: string): ExactSizeCoverage {
  return fromStats(getSizeProductStats(size));
}

/** True when at least one unique model is indexed for the exact size. */
export function hasExactSizeModels(size: string): boolean {
  return getExactSizeCoverage(size).uniqueModelCount > 0;
}

export function formatUniqueModelCountLabel(count: number): string {
  if (count <= 0) return 'No unique tire models indexed';
  return `${count} unique tire model${count === 1 ? '' : 's'}`;
}

export function formatServiceVariantCountLabel(count: number): string {
  if (count <= 0) return 'No service variants indexed';
  return `${count} service variant${count === 1 ? '' : 's'}`;
}

export function formatBrandCountLabel(count: number): string {
  if (count <= 0) return 'No brands indexed';
  return `${count} brand${count === 1 ? '' : 's'} indexed`;
}

export function formatExactRecordCountLabel(count: number): string {
  if (count <= 0) return 'No exact-size records indexed';
  return `${count} exact-size record${count === 1 ? '' : 's'}`;
}

/** Compact multi-part coverage line — never labels records/variants as “models”. */
export function formatTireProductCountsLine(counts: TireProductCounts): string {
  const parts: string[] = [];
  if (counts.uniqueModelCount > 0) {
    parts.push(formatUniqueModelCountLabel(counts.uniqueModelCount));
  }
  if (
    counts.serviceVariantCount > 0 &&
    counts.serviceVariantCount !== counts.uniqueModelCount
  ) {
    parts.push(formatServiceVariantCountLabel(counts.serviceVariantCount));
  }
  if (counts.brandCount > 0) {
    parts.push(formatBrandCountLabel(counts.brandCount));
  }
  return parts.length > 0 ? parts.join(' · ') : 'No products indexed';
}
