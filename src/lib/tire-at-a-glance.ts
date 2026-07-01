import type { TireSpecs } from './tire-math';

export type AtAGlanceIcon =
  | 'sofa'
  | 'fuel'
  | 'road'
  | 'mountain'
  | 'compass'
  | 'steering';

export interface AtAGlanceRating {
  id: string;
  label: string;
  icon: AtAGlanceIcon;
  rating: 1 | 2 | 3 | 4 | 5;
  helper: string;
}

export interface AtAGlanceQuickFacts {
  category: string;
  equivalentFlotation: string;
  typicalBuild: string;
  popularVehicles: string;
}

export interface AtAGlanceProfile {
  ratings: AtAGlanceRating[];
  bestFor: string;
  useCaseBadges: string[];
  tradeoffBullets: string[];
  quickFacts: AtAGlanceQuickFacts;
}

function clampRating(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function rideComfortRating(aspect: number): 1 | 2 | 3 | 4 | 5 {
  if (aspect >= 75) return 5;
  if (aspect >= 65) return 4;
  if (aspect >= 55) return 3;
  if (aspect >= 45) return 2;
  return 1;
}

function fuelEconomyRating(widthMm: number, diameterIn: number): 1 | 2 | 3 | 4 | 5 {
  const score = 5.6 - (diameterIn - 26) * 0.42 - (widthMm - 195) * 0.009;
  return clampRating(score);
}

function highwayStabilityRating(
  aspect: number,
  widthMm: number,
  diameterIn: number,
): 1 | 2 | 3 | 4 | 5 {
  let score = 3;
  if (aspect >= 40 && aspect <= 65) score += 1;
  if (diameterIn >= 27 && diameterIn <= 34) score += 0.5;
  if (widthMm >= 215 && widthMm <= 285) score += 0.5;
  if (aspect < 35 || aspect > 75) score -= 1;
  if (widthMm > 305 || diameterIn > 35) score -= 1;
  return clampRating(score);
}

function groundClearanceRating(diameterIn: number): 1 | 2 | 3 | 4 | 5 {
  if (diameterIn >= 34) return 5;
  if (diameterIn >= 33) return 4;
  if (diameterIn >= 32) return 4;
  if (diameterIn >= 31) return 3;
  if (diameterIn >= 29.5) return 2;
  return 1;
}

function offRoadRating(aspect: number, diameterIn: number): 1 | 2 | 3 | 4 | 5 {
  let score = 1;
  if (diameterIn >= 33 && aspect >= 70) score = 5;
  else if (diameterIn >= 32.5 && aspect >= 65) score = 4;
  else if (diameterIn >= 31.5 && aspect >= 60) score = 3;
  else if (diameterIn >= 30) score = 2;
  return clampRating(score);
}

function maneuverabilityRating(widthMm: number, diameterIn: number): 1 | 2 | 3 | 4 | 5 {
  let score = 5;
  if (diameterIn > 31) score -= 1;
  if (diameterIn > 32.5) score -= 1;
  if (diameterIn > 33.5) score -= 1;
  if (widthMm > 255) score -= 0.5;
  if (widthMm > 275) score -= 1;
  if (widthMm > 295) score -= 1;
  return clampRating(score);
}

function buildBestFor(
  ratings: AtAGlanceRating[],
  aspect: number,
  widthMm: number,
): string {
  const byId = Object.fromEntries(ratings.map((r) => [r.id, r.rating])) as Record<
    string,
    number
  >;
  const uses: string[] = [];

  if (byId.comfort >= 4) uses.push('daily commuting');
  if (byId.highway >= 4) uses.push('mixed highway driving');
  if (byId.offroad >= 4 || byId.clearance >= 4) {
    uses.push('overlanding');
    uses.push('mixed-terrain driving');
    uses.push('light off-road use');
  }
  if (widthMm >= 265 && aspect >= 60) uses.push('towing');
  if (byId.maneuverability >= 4) uses.push('city driving');
  if (aspect <= 45 && byId.highway >= 3) uses.push('spirited on-road driving');

  if (uses.length === 0) {
    return 'Versatile mixed-use driving where balanced tire dimensions matter more than one specialty.';
  }

  const unique = [...new Set(uses)];
  if (unique.length === 1) return unique[0].charAt(0).toUpperCase() + unique[0].slice(1) + '.';
  const last = unique.pop()!;
  return `${unique.join(', ')}, and ${last}.`.replace(/^./, (c) => c.toUpperCase());
}

function buildUseCaseBadges(
  ratings: AtAGlanceRating[],
  widthMm: number,
  aspectRatio: number,
): string[] {
  const byId = Object.fromEntries(ratings.map((r) => [r.id, r.rating])) as Record<
    string,
    number
  >;
  const badges: string[] = [];

  if (byId.comfort >= 3 || byId.maneuverability >= 3) badges.push('Daily Driving');
  if (aspectRatio <= 45 && byId.highway >= 3) badges.push('Performance Driving');
  if (byId.highway >= 4) badges.push('Highway Driving');
  if (byId.offroad >= 4 || byId.clearance >= 4) badges.push('Overlanding');
  if (widthMm >= 265 && aspectRatio >= 60) badges.push('Towing');
  if (byId.offroad >= 4 || (widthMm >= 275 && aspectRatio >= 65)) badges.push('Off-Road');
  if (byId.offroad >= 3 && byId.highway >= 3) badges.push('Mixed Terrain');
  if (byId.highway >= 4) badges.push('Long Highway Trips');
  if (byId.offroad >= 3) badges.push('Light Off-Road Use');

  if (badges.length === 0) badges.push('Daily Driving', 'Mixed Terrain');
  return [...new Set(badges)].slice(0, 6);
}

function buildTradeoffBullets(
  ratings: AtAGlanceRating[],
  widthMm: number,
  diameterIn: number,
  aspectRatio: number,
): string[] {
  const byId = Object.fromEntries(ratings.map((r) => [r.id, r.rating])) as Record<
    string,
    number
  >;
  const bullets: string[] = [];

  if (widthMm >= 265 || byId.maneuverability <= 3) {
    bullets.push('Heavier steering');
  }
  if (widthMm >= 255 && aspectRatio <= 55) {
    bullets.push('More road noise');
  }
  if (aspectRatio <= 50 || byId.comfort <= 2) {
    bullets.push('Reduced ride comfort');
  }
  if (byId.fuel <= 3) bullets.push('Fuel economy penalty');
  if (diameterIn >= 31.5 || widthMm >= 265) bullets.push('Larger turning footprint');

  if (bullets.length === 0) {
    bullets.push('Modest compromise versus smaller OEM sizes');
  }

  return bullets.slice(0, 4);
}

function buildTypicalBuild(categoryLabel: string, aspectRatio: number): string {
  if (categoryLabel.includes('Off-Road')) {
    return aspectRatio >= 65 ? 'All-terrain light truck' : 'Rugged trail-focused radial';
  }
  if (categoryLabel.includes('Light Truck')) {
    return 'Load-range highway or all-terrain';
  }
  if (categoryLabel.includes('SUV')) {
    return 'Highway all-season SUV';
  }
  if (categoryLabel.includes('Performance')) {
    return 'Performance summer radial';
  }
  return 'Standard touring radial';
}

export function buildAtAGlanceProfile(
  specs: TireSpecs,
  context: {
    sizeLabel: string;
    categoryLabel: string;
    equivalentFlotation: string;
    popularVehicles: string;
  },
): AtAGlanceProfile {
  const { aspectRatio, widthMm, overallDiameterIn } = specs;

  const comfort = rideComfortRating(aspectRatio);
  const fuel = fuelEconomyRating(widthMm, overallDiameterIn);
  const highway = highwayStabilityRating(aspectRatio, widthMm, overallDiameterIn);
  const clearance = groundClearanceRating(overallDiameterIn);
  const offroad = offRoadRating(aspectRatio, overallDiameterIn);
  const maneuverability = maneuverabilityRating(widthMm, overallDiameterIn);

  const ratings: AtAGlanceRating[] = [
    {
      id: 'comfort',
      label: 'Ride Comfort',
      icon: 'sofa',
      rating: comfort,
      helper:
        comfort >= 4
          ? 'Taller sidewalls generally absorb bumps better.'
          : comfort >= 3
            ? 'Balanced sidewall height offers moderate impact absorption.'
            : 'Shorter sidewalls prioritize response over cushioning.',
    },
    {
      id: 'fuel',
      label: 'Fuel Economy',
      icon: 'fuel',
      rating: fuel,
      helper:
        fuel >= 4
          ? 'Relatively efficient footprint for its class.'
          : fuel >= 3
            ? 'Moderate rolling resistance for a larger footprint.'
            : 'Larger tires can slightly reduce efficiency.',
    },
    {
      id: 'highway',
      label: 'Highway Stability',
      icon: 'road',
      rating: highway,
      helper:
        highway >= 4
          ? 'Maintains good straight-line stability.'
          : highway >= 3
            ? 'Stable enough for routine highway use with balanced sidewall flex.'
            : 'May feel busier or less settled at sustained highway speeds.',
    },
    {
      id: 'clearance',
      label: 'Ground Clearance',
      icon: 'mountain',
      rating: clearance,
      helper:
        clearance >= 4
          ? 'Larger overall diameter increases axle clearance.'
          : clearance >= 3
            ? 'Adds useful clearance without extreme lift requirements.'
            : 'Limited diameter gain versus common truck and SUV upgrades.',
    },
    {
      id: 'offroad',
      label: 'Off-Road Capability',
      icon: 'compass',
      rating: offroad,
      helper:
        offroad >= 4
          ? 'Provides additional clearance and sidewall protection.'
          : offroad >= 3
            ? 'Capable for gravel roads and moderate trail use.'
            : 'Better suited to pavement than aggressive off-road work.',
    },
    {
      id: 'maneuverability',
      label: 'Maneuverability',
      icon: 'steering',
      rating: maneuverability,
      helper:
        maneuverability >= 4
          ? 'Compact enough for parking lots and tight turning.'
          : maneuverability >= 3
            ? 'Manageable in daily driving despite a larger footprint.'
            : 'Larger tires can feel heavier at low speeds.',
    },
  ];

  return {
    ratings,
    bestFor: buildBestFor(ratings, aspectRatio, widthMm),
    useCaseBadges: buildUseCaseBadges(ratings, widthMm, aspectRatio),
    tradeoffBullets: buildTradeoffBullets(ratings, widthMm, overallDiameterIn, aspectRatio),
    quickFacts: {
      category: context.categoryLabel,
      equivalentFlotation: context.equivalentFlotation,
      typicalBuild: buildTypicalBuild(context.categoryLabel, aspectRatio),
      popularVehicles: context.popularVehicles,
    },
  };
}
