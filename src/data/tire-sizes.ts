/** Tire size hub dataset — add entries here to expand the library. */

export type TireCategory =
  | 'passenger'
  | 'performance'
  | 'SUV'
  | 'light-truck'
  | 'off-road';

/**
 * Optional service-description ratings for a size. These vary by specific tire
 * model, so values reflect the most common OE / market service description for
 * the size. All fields are optional — anything omitted is hidden on the page
 * (never shown as a placeholder). Maximum load is derived from the load index
 * unless an explicit override is provided.
 */
export interface TireRatings {
  /** Load index — single (e.g. "91") or dual for LT sizes (e.g. "123/120"). */
  loadIndex?: string;
  /** Speed rating symbol, e.g. "T", "H", "V", "W", "Y". */
  speedRating?: string;
  /** LT / flotation load range letter, e.g. "C", "D", "E". */
  loadRange?: string;
  /** Explicit maximum load per tire in lb (overrides the load-index lookup). */
  maxLoadLbs?: number;
}

export interface TireSizeEntry {
  /** Metric size string, e.g. "275/70R18" */
  size: string;
  category: TireCategory;
  /** Optional service-description ratings (load index, speed, load range). */
  ratings?: TireRatings;
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
  { size: '185/65R15', category: 'passenger', ratings: { loadIndex: '88', speedRating: 'T' } },
  { size: '195/60R15', category: 'passenger', ratings: { loadIndex: '88', speedRating: 'H' } },
  { size: '195/65R15', category: 'passenger', ratings: { loadIndex: '91', speedRating: 'H' } },
  { size: '205/55R16', category: 'passenger', ratings: { loadIndex: '91', speedRating: 'V' } },
  { size: '205/60R16', category: 'passenger', ratings: { loadIndex: '92', speedRating: 'H' } },
  { size: '215/55R17', category: 'passenger', ratings: { loadIndex: '94', speedRating: 'V' } },
  { size: '215/60R16', category: 'passenger', ratings: { loadIndex: '95', speedRating: 'H' } },
  { size: '225/45R17', category: 'performance', ratings: { loadIndex: '91', speedRating: 'W' } },
  { size: '225/50R17', category: 'performance', ratings: { loadIndex: '94', speedRating: 'V' } },
  { size: '225/55R17', category: 'passenger', ratings: { loadIndex: '97', speedRating: 'W' } },
  { size: '225/65R17', category: 'SUV', ratings: { loadIndex: '102', speedRating: 'H' } },
  { size: '235/40R18', category: 'performance', ratings: { loadIndex: '95', speedRating: 'Y' } },
  { size: '235/45R18', category: 'performance', ratings: { loadIndex: '94', speedRating: 'W' } },
  { size: '235/55R18', category: 'SUV', ratings: { loadIndex: '100', speedRating: 'V' } },
  { size: '235/60R18', category: 'SUV', ratings: { loadIndex: '103', speedRating: 'V' } },
  { size: '235/65R17', category: 'SUV', ratings: { loadIndex: '104', speedRating: 'V' } },
  { size: '245/40R18', category: 'performance' },
  { size: '245/45R18', category: 'performance', ratings: { loadIndex: '96', speedRating: 'W' } },
  { size: '245/60R18', category: 'SUV', ratings: { loadIndex: '105', speedRating: 'H' } },
  { size: '255/35R19', category: 'performance', ratings: { loadIndex: '96', speedRating: 'Y' } },
  { size: '255/55R19', category: 'SUV', ratings: { loadIndex: '111', speedRating: 'V' } },
  { size: '265/60R18', category: 'SUV', ratings: { loadIndex: '110', speedRating: 'H' } },
  { size: '265/65R18', category: 'SUV', ratings: { loadIndex: '114', speedRating: 'H' } },
  { size: '265/70R17', category: 'off-road', ratings: { loadIndex: '115', speedRating: 'T' } },
  { size: '275/55R20', category: 'SUV', ratings: { loadIndex: '117', speedRating: 'H' } },
  { size: '275/60R20', category: 'SUV', ratings: { loadIndex: '115', speedRating: 'H' } },
  { size: '275/65R18', category: 'SUV', ratings: { loadIndex: '116', speedRating: 'T' } },
  { size: '275/70R18', category: 'off-road', ratings: { loadIndex: '125/122', speedRating: 'R', loadRange: 'E' } },
  { size: '285/55R20', category: 'SUV', ratings: { loadIndex: '122', speedRating: 'H' } },
  { size: '285/65R20', category: 'light-truck', ratings: { loadIndex: '127/124', speedRating: 'S', loadRange: 'E' } },
  { size: '285/70R17', category: 'off-road', ratings: { loadIndex: '121/118', speedRating: 'S', loadRange: 'D' } },
  { size: '285/75R16', category: 'light-truck', ratings: { loadIndex: '126/123', speedRating: 'R', loadRange: 'E' } },
  { size: '295/35R21', category: 'performance', ratings: { loadIndex: '107', speedRating: 'Y' } },
  { size: '305/55R20', category: 'light-truck' },
  { size: '305/70R18', category: 'off-road', ratings: { loadIndex: '126/123', speedRating: 'R', loadRange: 'E' } },
  { size: '315/70R17', category: 'off-road', ratings: { loadIndex: '121/118', speedRating: 'S', loadRange: 'D' } },
  { size: 'LT265/75R16', category: 'light-truck', ratings: { loadIndex: '123/120', speedRating: 'R', loadRange: 'E' } },
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
