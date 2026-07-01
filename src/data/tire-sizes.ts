/** Tire size hub dataset — add entries here to expand the library. */

export type TireCategory =
  | 'passenger'
  | 'performance'
  | 'SUV'
  | 'light-truck'
  | 'off-road';

export interface TireSizeEntry {
  /** Metric size string, e.g. "275/70R18" */
  size: string;
  category: TireCategory;
}

/** Infer category from width (mm), aspect ratio, and wheel diameter (in). */
export function inferTireCategory(
  widthMm: number,
  aspectRatio: number,
  wheelIn: number,
): TireCategory {
  if (aspectRatio <= 45 && widthMm >= 235) return 'performance';
  if (aspectRatio >= 70 && widthMm >= 265) return 'off-road';
  if (aspectRatio >= 75 || (widthMm >= 285 && aspectRatio >= 65)) {
    return 'light-truck';
  }
  if (aspectRatio >= 60 && widthMm >= 225) return 'SUV';
  return 'passenger';
}

/**
 * Common metric sizes across passenger, performance, SUV, truck, and off-road.
 * Category is stored explicitly for editorial control; use inferTireCategory when adding new rows.
 */
export const TIRE_SIZES: TireSizeEntry[] = [
  { size: '185/65R15', category: 'passenger' },
  { size: '195/60R15', category: 'passenger' },
  { size: '195/65R15', category: 'passenger' },
  { size: '205/55R16', category: 'passenger' },
  { size: '205/60R16', category: 'passenger' },
  { size: '215/55R17', category: 'passenger' },
  { size: '215/60R16', category: 'passenger' },
  { size: '225/45R17', category: 'performance' },
  { size: '225/50R17', category: 'performance' },
  { size: '225/55R17', category: 'passenger' },
  { size: '225/65R17', category: 'SUV' },
  { size: '235/40R18', category: 'performance' },
  { size: '235/45R18', category: 'performance' },
  { size: '235/55R18', category: 'SUV' },
  { size: '235/60R18', category: 'SUV' },
  { size: '235/65R17', category: 'SUV' },
  { size: '245/40R18', category: 'performance' },
  { size: '245/45R18', category: 'performance' },
  { size: '245/60R18', category: 'SUV' },
  { size: '255/35R19', category: 'performance' },
  { size: '255/55R19', category: 'SUV' },
  { size: '265/60R18', category: 'SUV' },
  { size: '265/65R18', category: 'SUV' },
  { size: '265/70R17', category: 'off-road' },
  { size: '275/55R20', category: 'SUV' },
  { size: '275/60R20', category: 'SUV' },
  { size: '275/65R18', category: 'SUV' },
  { size: '275/70R18', category: 'off-road' },
  { size: '285/55R20', category: 'SUV' },
  { size: '285/65R20', category: 'light-truck' },
  { size: '285/70R17', category: 'off-road' },
  { size: '285/75R16', category: 'light-truck' },
  { size: '295/35R21', category: 'performance' },
  { size: '305/55R20', category: 'light-truck' },
  { size: '305/70R18', category: 'off-road' },
  { size: '315/70R17', category: 'off-road' },
  { size: 'LT265/75R16', category: 'light-truck' },
];

export const TIRE_CATEGORY_LABELS: Record<TireCategory, string> = {
  passenger: 'Passenger',
  performance: 'Performance',
  SUV: 'SUV / Crossover',
  'light-truck': 'Light Truck',
  'off-road': 'Off-Road / All-Terrain',
};

export const TIRE_CATEGORY_ORDER: TireCategory[] = [
  'passenger',
  'performance',
  'SUV',
  'light-truck',
  'off-road',
];
