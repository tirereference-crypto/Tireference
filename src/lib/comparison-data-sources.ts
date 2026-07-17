/**
 * Comparison data-source model.
 * Distinguishes formula-calculated nominal values, optional manufacturer-published
 * product fields, and vehicle-specific unknowns. Does not replace tire-math formulas.
 */
import {
  getFullSpecProductsForTireSize,
  type TireProduct,
} from './tire-size-products';
import type { TireSpecs } from './tire-math';

export type ComparisonValueSource =
  | 'formula_nominal'
  | 'database_published'
  | 'vehicle_unknown';

export type ComparisonSourceMode =
  | 'generic_vs_generic'
  | 'model_vs_model'
  | 'mixed_source';

/** Published manufacturer fields we may show separately from nominal calc. */
export interface PublishedTireMeasurements {
  brand: string;
  model: string;
  size: string;
  overallDiameterIn: number | null;
  sectionWidthIn: number | null;
  revsPerMile: number | null;
  loadRange: string | null;
  speedRating: string | null;
  loadIndex: string | null;
  /** Manufacturer approved rim-width range when present in the dataset. */
  approvedRimRange: string | null;
  maxLoadLb: number | null;
  weightLb: number | null;
  treadDepth32nds: number | null;
  sourceUrl: string | null;
  category: string | null;
}

export interface ComparisonDataSourceSummary {
  mode: ComparisonSourceMode;
  headlineUses: 'formula_nominal';
  note: string;
  publishedA: PublishedTireMeasurements | null;
  publishedB: PublishedTireMeasurements | null;
  canComparePublishedDiameters: boolean;
}

const VEHICLE_SPECIFIC_UNKNOWN_LABELS = [
  'Fender clearance',
  'Suspension clearance',
  'Brake clearance',
  'Wheel offset compatibility',
  'Hub compatibility',
  'Rubbing risk',
  'Vehicle fitment',
] as const;

export type VehicleSpecificUnknown = (typeof VEHICLE_SPECIFIC_UNKNOWN_LABELS)[number];

export function isVehicleSpecificUnknown(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return VEHICLE_SPECIFIC_UNKNOWN_LABELS.some((item) =>
    normalized.includes(item.toLowerCase().replace(' compatibility', '').replace(' risk', '')),
  );
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function parseLoadIndex(serviceDescription: string | null | undefined): string | null {
  if (!serviceDescription) return null;
  const match = String(serviceDescription).trim().match(/^(\d{2,3})/);
  return match ? match[1] : null;
}

export function publishedFromProduct(product: TireProduct): PublishedTireMeasurements {
  const record = product as TireProduct & {
    approved_rim_range?: string | null;
    rim_width_range?: string | null;
    measuring_rim?: string | null;
  };
  const rim =
    (record.approved_rim_range || record.rim_width_range || record.measuring_rim || '').trim() || null;

  return {
    brand: product.brand,
    model: product.model,
    size: product.display_size || product.tire_size,
    overallDiameterIn: toNumber(product.overall_diameter_in),
    sectionWidthIn: toNumber(product.section_width_in) ?? toNumber(product.overall_width_in),
    revsPerMile: toNumber(product.revs_per_mile),
    loadRange: product.load_range?.trim() || null,
    speedRating: product.speed_rating?.trim() || null,
    loadIndex: parseLoadIndex(product.service_description),
    approvedRimRange: rim,
    maxLoadLb: toNumber(product.max_load_lb),
    weightLb: toNumber(product.weight_lb),
    treadDepth32nds: toNumber(product.tread_depth_32nds),
    sourceUrl: product.source_url || null,
    category: product.product_category || null,
  };
}

/** Pick a representative full-spec product for a size when no model is selected. */
export function getRepresentativePublishedForSize(size: string): PublishedTireMeasurements | null {
  const products = getFullSpecProductsForTireSize(size);
  if (products.length === 0) return null;
  return publishedFromProduct(products[0]);
}

export function resolveComparisonDataSources(input: {
  sizeA: string;
  sizeB: string;
  /** Optional exact product selections (future). */
  productA?: TireProduct | null;
  productB?: TireProduct | null;
}): ComparisonDataSourceSummary {
  const publishedA = input.productA
    ? publishedFromProduct(input.productA)
    : null;
  const publishedB = input.productB
    ? publishedFromProduct(input.productB)
    : null;

  let mode: ComparisonSourceMode = 'generic_vs_generic';
  if (publishedA && publishedB) mode = 'model_vs_model';
  else if (publishedA || publishedB) mode = 'mixed_source';

  const canComparePublishedDiameters = Boolean(
    publishedA?.overallDiameterIn != null && publishedB?.overallDiameterIn != null,
  );

  const note =
    mode === 'generic_vs_generic'
      ? 'Comparison uses nominal dimensions calculated from the selected tire sizes. Actual manufacturer measurements may differ.'
      : mode === 'model_vs_model'
        ? 'Manufacturer-published specifications are available for both selected tires. Nominal calculated values are also shown where relevant.'
        : 'Published specifications are available for only one selected tire. Headline dimensional differences use consistent nominal calculations; published values are shown separately.';

  return {
    mode,
    headlineUses: 'formula_nominal',
    note,
    publishedA,
    publishedB,
    canComparePublishedDiameters,
  };
}

/** Formula-side label for UI provenance chips. */
export function formulaSourceLabel(): string {
  return 'Formula (nominal)';
}

export function vehicleUnknownStatusLabel(): string {
  return 'Check required — needs vehicle data';
}

/** Specs used for headline math must always come from getTireSpecs / compareTires. */
export type FormulaHeadlineSpecs = {
  a: TireSpecs;
  b: TireSpecs;
  source: 'formula_nominal';
};
