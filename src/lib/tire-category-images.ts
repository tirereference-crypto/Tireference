import type { TireCategory } from '../data/tire-sizes';
import type { ImageMetadata } from 'astro';
import passengerImg from '../assets/tires/tire-passenger.png';
import performanceImg from '../assets/tires/tire-performance.png';
import suvImg from '../assets/tires/tire-suv.png';
import lightTruckImg from '../assets/tires/tire-light-truck.png';
import offRoadImg from '../assets/tires/tire-off-road.png';

export interface TireCategoryImage {
  src: ImageMetadata;
  alt: string;
}

const TIRE_CATEGORY_IMAGES: Record<TireCategory, TireCategoryImage> = {
  passenger: {
    src: passengerImg,
    alt: 'Passenger tire side profile',
  },
  performance: {
    src: performanceImg,
    alt: 'Performance tire side profile',
  },
  SUV: {
    src: suvImg,
    alt: 'SUV tire side profile',
  },
  'light-truck': {
    src: lightTruckImg,
    alt: 'Light truck tire side profile',
  },
  'off-road': {
    src: offRoadImg,
    alt: 'Off-road tire side profile',
  },
};

/** Dedicated transparent tire render for each category. */
export function getTireCategoryImage(category: TireCategory): TireCategoryImage {
  return TIRE_CATEGORY_IMAGES[category];
}
