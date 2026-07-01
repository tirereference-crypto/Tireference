import type { TireCategory } from '../data/tire-sizes';
import type { TireSpecs } from './tire-math';

export type TireVisualCategory =
  | 'passenger'
  | 'performance'
  | 'suv'
  | 'light-truck'
  | 'all-terrain'
  | 'mud-terrain';

/** Category-specific tire diagram assets. */
export interface TireDiagramImages {
  visualCategory: TireVisualCategory;
  front: string;
  side: string;
  frontAlt: string;
  sideAlt: string;
  styleClass: string;
}

/** True horizontal side profile (1001×998). */
const HERO_TIRE_SIDE_SRC = '/images/tires/tire-flat-side-view.png';
/** True front tread view (307×842). */
const HERO_TIRE_FRONT_SRC = '/images/tire-front.webp';

const VISUAL_DIAGRAMS: Record<TireVisualCategory, Omit<TireDiagramImages, 'visualCategory'>> = {
  passenger: {
    front: HERO_TIRE_FRONT_SRC,
    side: HERO_TIRE_SIDE_SRC,
    frontAlt: 'Tire tread front view showing section width',
    sideAlt: 'Tire side profile showing overall diameter',
    styleClass: 'tire-diagram--passenger',
  },
  performance: {
    front: HERO_TIRE_FRONT_SRC,
    side: HERO_TIRE_SIDE_SRC,
    frontAlt: 'Tire tread front view showing section width',
    sideAlt: 'Tire side profile showing overall diameter',
    styleClass: 'tire-diagram--performance',
  },
  suv: {
    front: HERO_TIRE_FRONT_SRC,
    side: HERO_TIRE_SIDE_SRC,
    frontAlt: 'Tire tread front view showing section width',
    sideAlt: 'Tire side profile showing overall diameter',
    styleClass: 'tire-diagram--suv',
  },
  'light-truck': {
    front: HERO_TIRE_FRONT_SRC,
    side: HERO_TIRE_SIDE_SRC,
    frontAlt: 'Tire tread front view showing section width',
    sideAlt: 'Tire side profile showing overall diameter',
    styleClass: 'tire-diagram--light-truck',
  },
  'all-terrain': {
    front: HERO_TIRE_FRONT_SRC,
    side: HERO_TIRE_SIDE_SRC,
    frontAlt: 'Tire tread front view showing section width',
    sideAlt: 'Tire side profile showing overall diameter',
    styleClass: 'tire-diagram--all-terrain',
  },
  'mud-terrain': {
    front: HERO_TIRE_FRONT_SRC,
    side: HERO_TIRE_SIDE_SRC,
    frontAlt: 'Tire tread front view showing section width',
    sideAlt: 'Tire side profile showing overall diameter',
    styleClass: 'tire-diagram--mud-terrain',
  },
};

const MUD_TERRAIN_SIZES = new Set(['305/70R18', '315/70R17']);

export function resolveTireVisualCategory(
  category: TireCategory,
  size: string,
  specs: TireSpecs,
): TireVisualCategory {
  switch (category) {
    case 'passenger':
      return 'passenger';
    case 'performance':
      return 'performance';
    case 'SUV':
      return 'suv';
    case 'light-truck':
      return 'light-truck';
    case 'off-road':
      if (
        MUD_TERRAIN_SIZES.has(size.toUpperCase()) ||
        specs.widthMm >= 315 ||
        (specs.widthMm >= 305 && specs.aspectRatio >= 70)
      ) {
        return 'mud-terrain';
      }
      return 'all-terrain';
  }
}

export function getTireDiagramImages(
  category: TireCategory,
  size: string,
  specs: TireSpecs,
): TireDiagramImages {
  const visualCategory = resolveTireVisualCategory(category, size, specs);
  return {
    visualCategory,
    ...VISUAL_DIAGRAMS[visualCategory],
  };
}
