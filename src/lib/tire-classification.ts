import type { TireCategory } from '../data/tire-sizes';
import type { HubIconName } from './hub-icons';

/**
 * Inputs used to classify a tire. All of these come from real data on the
 * page (parsed size + dataset category + optional service description), so the
 * resulting badge always reflects the actual tire rather than a hardcoded
 * string attached to a template.
 */
export interface TireCharacteristics {
  /** Aspect ratio (e.g. 70 for 275/70R18). */
  aspectRatio: number;
  /** Section width in millimetres (e.g. 275). */
  widthMm: number;
  /** Overall (outer) diameter in inches. */
  overallDiameterIn: number;
  /** Editorial/overall category stored in the dataset. */
  category: TireCategory;
  /** Primary numeric load index if the service description is known. */
  loadIndex?: number | null;
}

export interface TireBadge {
  /** Human-readable capability label, e.g. "Trail Ready". */
  label: string;
  /** Icon that matches the class. */
  icon: HubIconName;
}

/**
 * Parse the leading numeric load index out of a raw service-description value
 * such as "125/122" or "116". Returns null when nothing usable is present.
 */
export function parseLoadIndex(raw?: string | number | null): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const match = raw.match(/\d{2,3}/);
  if (!match) return null;
  const value = Number.parseInt(match[0], 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * Classify a tire into an accurate capability badge from its physical
 * characteristics. The order of the checks encodes the priority of the
 * classification and — critically — guarantees that a passenger/performance
 * car tire can never fall into an off-road ("Trail Ready" / "All-Terrain")
 * branch, because those branches require genuine truck/SUV geometry and
 * explicitly exclude car categories.
 */
export function classifyTireBadge(t: TireCharacteristics): TireBadge {
  const { aspectRatio: ar, widthMm: w, overallDiameterIn: d, category } = t;
  const li = t.loadIndex ?? null;

  const veryLowProfile = ar <= 35;
  const lowProfile = ar <= 45;
  const mediumProfile = ar > 45 && ar < 60;
  const tallProfile = ar >= 60;
  const veryTallProfile = ar >= 68;

  const wide = w >= 255;
  const large = d >= 31;
  const veryLarge = d >= 33;

  // ~1320 kg+ per tire → light-truck / heavy-duty service.
  const heavyLoad = li != null && li >= 118;
  // A car can never be labelled with a truck/off-road class.
  const isCar = category === 'passenger' || category === 'performance';

  // 1) Off-road / all-terrain. Requires genuine tall + wide + large-diameter
  //    truck geometry (or an explicit off-road category) AND must not be a car.
  const hasOffRoadGeometry = veryTallProfile && wide && large;
  if (!isCar && (category === 'off-road' || hasOffRoadGeometry)) {
    if (veryLarge && (heavyLoad || wide)) {
      return { label: 'Trail Ready', icon: 'mountain' };
    }
    return { label: 'All-Terrain', icon: 'mountain' };
  }

  // 2) Heavy duty. Load-carrying truck tires that are not aggressive off-road.
  if (!isCar && (category === 'light-truck' || heavyLoad)) {
    return { label: 'Heavy Duty', icon: 'truck' };
  }

  // 3) Performance. Low profile on a wide section — true regardless of the
  //    stored category, so a sporty "passenger" size still reads correctly.
  if (lowProfile && w >= 225) {
    if (veryLowProfile && w >= 265) {
      return { label: 'Ultra-High Performance', icon: 'zap' };
    }
    if (ar <= 40) return { label: 'Max Performance', icon: 'zap' };
    return { label: 'High Performance', icon: 'zap' };
  }

  // 4) Sport touring. Sporty mid-profile cars (never trucks/SUVs, which fall
  //    through to the SUV/crossover branch below).
  if (isCar && mediumProfile && w >= 225 && !large) {
    return { label: 'Sport Touring', icon: 'gauge' };
  }

  // 5) SUV / crossover. Taller family-hauler geometry.
  if (category === 'SUV' || (tallProfile && w >= 225 && d >= 28)) {
    return { label: 'SUV / Crossover', icon: 'car-front' };
  }

  // 6) Default. Comfort-oriented daily passenger tire.
  return { label: 'Touring / Daily', icon: 'car-front' };
}
