/**
 * Size Snapshot card builder for the tire size calculator.
 * Keeps calculated geometry separate from dataset-backed facts.
 * Cards stay compact — short labels and 1–2 supporting lines only.
 */
import { TIRE_SIZES, type TireCategory } from '../data/tire-sizes';
import { getVehicleFitment } from '../data/vehicle-fitment';
import { getSizeAvailability } from './size-availability';
import {
  getDatabaseProductionLabel,
  type DatabaseProductionLabel,
} from './size-production-status';
import { getTireSpecs, type TireSpecs } from './tire-math';
import { normalizeTireSizeKey } from './tire-size-validation';

export type SnapshotSource = 'calculated' | 'dataset';

export type SnapshotIcon =
  | 'sidewall'
  | 'diameter'
  | 'speedometer'
  | 'vehicle'
  | 'categories'
  | 'production';

export interface SnapshotCard {
  id: string;
  title: string;
  value: string;
  detail: string;
  source: SnapshotSource;
  icon: SnapshotIcon;
  /** Visual status accent — only when data supports it. */
  statusTone?: 'positive' | 'neutral';
}

const VEHICLE_TYPE_BY_CATEGORY: Record<TireCategory, string> = {
  passenger: 'Passenger cars',
  performance: 'Passenger cars',
  SUV: 'Crossovers / full-size SUVs',
  'light-truck': 'Pickup trucks',
  'off-road': 'Pickup trucks / full-size SUVs',
};

function catalogEntry(sizeLabel: string) {
  const key = normalizeTireSizeKey(sizeLabel);
  return TIRE_SIZES.find((entry) => normalizeTireSizeKey(entry.size) === key) ?? null;
}

function sidewallProfileLine(aspect: number): string {
  if (aspect >= 70) return 'Relatively tall profile';
  if (aspect >= 55) return 'Mid-height profile';
  return 'Low-profile sidewall';
}

export type ProductionStatusLabel = DatabaseProductionLabel;

export function getProductionStatusLabel(sizeLabel: string): ProductionStatusLabel | null {
  return getDatabaseProductionLabel(sizeLabel);
}

export function buildSizeSnapshotCards(
  sizeLabel: string,
  specs: TireSpecs,
  options?: { baselineSize?: string | null },
): SnapshotCard[] {
  const cards: SnapshotCard[] = [];
  const entry = catalogEntry(sizeLabel);
  const availability = getSizeAvailability(sizeLabel);

  cards.push({
    id: 'sidewall',
    title: 'Sidewall Profile',
    value: `${specs.sidewallIn.toFixed(2)} in sidewall`,
    detail: sidewallProfileLine(specs.aspectRatio),
    source: 'calculated',
    icon: 'sidewall',
  });

  let diameterDetail = 'Nominal calculated diameter';
  if (options?.baselineSize) {
    try {
      const baseline = getTireSpecs(options.baselineSize);
      const diff = specs.overallDiameterIn - baseline.overallDiameterIn;
      const abs = Math.abs(diff);
      if (abs >= 0.05) {
        diameterDetail = `${abs.toFixed(2)} in ${diff >= 0 ? 'taller' : 'shorter'} than ${options.baselineSize}`;
      } else {
        diameterDetail = `Matches ${options.baselineSize} diameter`;
      }
    } catch {
      /* keep generic */
    }
  }

  cards.push({
    id: 'diameter',
    title: 'Overall Diameter',
    value: `${specs.overallDiameterIn.toFixed(2)} in`,
    detail: diameterDetail,
    source: 'calculated',
    icon: 'diameter',
  });

  if (options?.baselineSize) {
    try {
      const baseline = getTireSpecs(options.baselineSize);
      const deltaPct =
        ((specs.overallDiameterIn - baseline.overallDiameterIn) / baseline.overallDiameterIn) *
        100;
      cards.push({
        id: 'speedometer',
        title: 'Speedometer Relationship',
        value: `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}% diameter`,
        detail: `Versus ${options.baselineSize}`,
        source: 'calculated',
        icon: 'speedometer',
      });
    } catch {
      cards.push({
        id: 'speedometer',
        title: 'Speedometer Relationship',
        value: 'Depends on original size',
        detail: 'Compare against the vehicle’s factory tire.',
        source: 'calculated',
        icon: 'speedometer',
      });
    }
  } else {
    cards.push({
      id: 'speedometer',
      title: 'Speedometer Relationship',
      value: 'Depends on original size',
      detail: 'Compare against the vehicle’s factory tire.',
      source: 'calculated',
      icon: 'speedometer',
    });
  }

  if (entry) {
    const vehicles = getVehicleFitment(sizeLabel);
    const hasExamples = vehicles.length > 0;

    cards.push({
      id: 'vehicle-type',
      title: 'Common Vehicle Type',
      value: VEHICLE_TYPE_BY_CATEGORY[entry.category],
      detail: hasExamples
        ? 'Examples are indicative, not confirmed fitment.'
        : 'Size class only — not fitment confirmation.',
      source: 'dataset',
      icon: 'vehicle',
    });
  }

  const categories = availability?.categories ?? [];
  if (categories.length > 0) {
    cards.push({
      id: 'tire-categories',
      title: 'Typical Tire Categories',
      value: categories.slice(0, 3).join(' · '),
      detail: '',
      source: 'dataset',
      icon: 'categories',
    });
  }

  const production = getProductionStatusLabel(sizeLabel);
  if (production) {
    cards.push({
      id: 'production',
      title: 'Production Status',
      value: production,
      detail:
        production === 'Common production size'
          ? 'Based on brand and model coverage in our tire database'
          : 'Listed in our tire database with narrower coverage',
      source: 'dataset',
      icon: 'production',
      statusTone: production === 'Common production size' ? 'positive' : 'neutral',
    });
  }

  return cards;
}
