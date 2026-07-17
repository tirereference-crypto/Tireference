import type { TireCategory } from './tire-sizes';

export type TireModelCategory =
  | 'All-Terrain'
  | 'Mud-Terrain'
  | 'Highway'
  | 'Hybrid Terrain'
  | 'Performance';

export interface PopularTireModel {
  name: string;
  category: TireModelCategory;
}

/** Exact-size mappings for common calculator and hub sizes. */
export const POPULAR_TIRE_MODELS_BY_SIZE: Record<string, PopularTireModel[]> = {
  '225/45R17': [
    { name: 'Michelin Pilot Sport 4S', category: 'Performance' },
    { name: 'Continental ExtremeContact DWS06 Plus', category: 'Performance' },
    { name: 'Bridgestone Potenza Sport', category: 'Performance' },
  ],
  '235/40R18': [
    { name: 'Michelin Pilot Sport 4S', category: 'Performance' },
    { name: 'Continental ExtremeContact Sport 02', category: 'Performance' },
    { name: 'Pirelli P Zero', category: 'Performance' },
  ],
  '245/45R18': [
    { name: 'Michelin Pilot Sport All Season 4', category: 'Performance' },
    { name: 'Continental ExtremeContact DWS06 Plus', category: 'Performance' },
    { name: 'Goodyear Eagle Exhilarate', category: 'Performance' },
  ],
  '255/55R19': [
    { name: 'Michelin CrossClimate2', category: 'Highway' },
    { name: 'Continental CrossContact LX25', category: 'Highway' },
    { name: 'Pirelli Scorpion Verde All Season', category: 'Highway' },
  ],
  '265/60R18': [
    { name: 'Michelin Defender LTX M/S', category: 'Highway' },
    { name: 'Bridgestone Dueler H/L Alenza Plus', category: 'Highway' },
    { name: 'Goodyear Assurance WeatherReady 2', category: 'Highway' },
  ],
  '265/65R18': [
    { name: 'Falken Wildpeak A/T Trail', category: 'All-Terrain' },
    { name: 'Toyo Open Country A/T III', category: 'All-Terrain' },
    { name: 'Goodyear Discoverer AT3 4S', category: 'All-Terrain' },
  ],
  '265/70R17': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Toyo Open Country A/T III', category: 'All-Terrain' },
  ],
  '275/55R20': [
    { name: 'Michelin Defender LTX M/S', category: 'Highway' },
    { name: 'Bridgestone Dueler H/L Alenza Plus', category: 'Highway' },
    { name: 'Continental TerrainContact H/T', category: 'Highway' },
  ],
  '275/60R20': [
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Toyo Open Country A/T III', category: 'All-Terrain' },
    { name: 'Goodyear Discoverer AT3 XLT', category: 'All-Terrain' },
  ],
  '275/65R18': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Toyo Open Country A/T III', category: 'All-Terrain' },
  ],
  '275/70R18': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Toyo Open Country A/T III', category: 'All-Terrain' },
  ],
  '285/55R20': [
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Nitto Ridge Grappler', category: 'Hybrid Terrain' },
    { name: 'Toyo Open Country A/T III', category: 'All-Terrain' },
  ],
  '285/65R20': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Nitto Ridge Grappler', category: 'Hybrid Terrain' },
  ],
  '285/70R17': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Nitto Ridge Grappler', category: 'Hybrid Terrain' },
    { name: 'Goodyear Discoverer AT3 XLT', category: 'All-Terrain' },
  ],
  '285/75R16': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Goodyear Discoverer STT Pro', category: 'Mud-Terrain' },
  ],
  '295/35R21': [
    { name: 'Michelin Pilot Sport 4S', category: 'Performance' },
    { name: 'Pirelli P Zero', category: 'Performance' },
    { name: 'Continental ExtremeContact Sport 02', category: 'Performance' },
  ],
  '305/55R20': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Nitto Ridge Grappler', category: 'Hybrid Terrain' },
    { name: 'Toyo Open Country R/T Trail', category: 'Hybrid Terrain' },
  ],
  '305/70R18': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Toyo Open Country R/T Trail', category: 'Hybrid Terrain' },
    { name: 'Mickey Thompson Baja Boss A/T', category: 'Hybrid Terrain' },
  ],
  '315/70R17': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Toyo Open Country R/T Trail', category: 'Hybrid Terrain' },
    { name: 'Mickey Thompson Baja Boss A/T', category: 'Hybrid Terrain' },
  ],
  'LT265/75R16': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Goodyear Discoverer AT3 XLT', category: 'All-Terrain' },
  ],
};

const CATEGORY_FALLBACK_MODELS: Record<TireCategory, PopularTireModel[]> = {
  passenger: [
    { name: 'Michelin Defender T+H', category: 'Highway' },
    { name: 'Continental TrueContact Tour', category: 'Highway' },
    { name: 'Goodyear Assurance ComfortDrive', category: 'Highway' },
  ],
  performance: [
    { name: 'Michelin Pilot Sport 4S', category: 'Performance' },
    { name: 'Continental ExtremeContact Sport 02', category: 'Performance' },
    { name: 'Bridgestone Potenza Sport', category: 'Performance' },
  ],
  SUV: [
    { name: 'Michelin CrossClimate2', category: 'Highway' },
    { name: 'Falken Wildpeak A/T Trail', category: 'All-Terrain' },
    { name: 'Bridgestone Dueler H/L Alenza Plus', category: 'Highway' },
  ],
  'light-truck': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Falken Wildpeak A/T4W', category: 'All-Terrain' },
    { name: 'Goodyear Discoverer AT3 XLT', category: 'All-Terrain' },
  ],
  'off-road': [
    { name: 'BFGoodrich All-Terrain T/A KO3', category: 'All-Terrain' },
    { name: 'Toyo Open Country R/T Trail', category: 'Hybrid Terrain' },
    { name: 'Mickey Thompson Baja Boss A/T', category: 'Hybrid Terrain' },
  ],
};

function normalizeSizeKey(size: string): string {
  return size.trim().toUpperCase();
}

export function getPopularTireModels(
  sizeLabel: string,
  category: TireCategory,
): PopularTireModel[] {
  const key = normalizeSizeKey(sizeLabel);
  if (POPULAR_TIRE_MODELS_BY_SIZE[key]) {
    return POPULAR_TIRE_MODELS_BY_SIZE[key];
  }

  const withoutPrefix = key.replace(/^(LT|P)/, '');
  if (POPULAR_TIRE_MODELS_BY_SIZE[withoutPrefix]) {
    return POPULAR_TIRE_MODELS_BY_SIZE[withoutPrefix];
  }

  return CATEGORY_FALLBACK_MODELS[category];
}
