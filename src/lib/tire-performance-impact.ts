import type { TireSpecs } from './tire-math';

export type ImpactBadge = 'BETTER' | 'MODERATE' | 'NEUTRAL' | 'TRADEOFF';

export interface PerformanceImpactCard {
  id: string;
  title: string;
  icon: 'comfort' | 'handling' | 'fuel' | 'mountain' | 'clearance' | 'towing' | 'snow';
  rating: 1 | 2 | 3 | 4 | 5;
  impact: ImpactBadge;
  copy: string;
}

function clampRating(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function impactFromRating(rating: number): ImpactBadge {
  if (rating >= 4) return 'BETTER';
  if (rating === 3) return 'MODERATE';
  if (rating === 2) return 'NEUTRAL';
  return 'TRADEOFF';
}

function rideComfortRating(aspect: number): number {
  if (aspect >= 75) return 5;
  if (aspect >= 65) return 4;
  if (aspect >= 55) return 3;
  if (aspect >= 45) return 2;
  return 1;
}

function handlingRating(aspect: number): number {
  if (aspect <= 40) return 5;
  if (aspect <= 45) return 4;
  if (aspect <= 55) return 3;
  if (aspect <= 65) return 2;
  return 1;
}

function fuelEconomyRating(widthMm: number, diameterIn: number): number {
  return clampRating(5.6 - (diameterIn - 26) * 0.42 - (widthMm - 195) * 0.009);
}

function offRoadRating(aspect: number, diameterIn: number): number {
  if (diameterIn >= 33 && aspect >= 70) return 5;
  if (diameterIn >= 32.5 && aspect >= 65) return 4;
  if (diameterIn >= 31.5 && aspect >= 60) return 3;
  if (diameterIn >= 30) return 2;
  return 1;
}

function towingRating(widthMm: number, aspect: number): number {
  if (widthMm >= 275 && aspect >= 60) return 5;
  if (widthMm >= 265 && aspect >= 55) return 4;
  if (widthMm >= 255 && aspect >= 50) return 3;
  return 2;
}

function snowRating(widthMm: number): number {
  if (widthMm <= 215) return 5;
  if (widthMm <= 235) return 4;
  if (widthMm <= 255) return 3;
  if (widthMm <= 275) return 2;
  return 1;
}

function groundClearanceRating(diameterIn: number): number {
  if (diameterIn >= 34) return 5;
  if (diameterIn >= 33) return 4;
  if (diameterIn >= 32) return 4;
  if (diameterIn >= 31) return 3;
  if (diameterIn >= 29.5) return 2;
  return 1;
}

function fuelEconomyCopy(widthMm: number, diameterIn: number): string {
  if (widthMm >= 285 || diameterIn >= 33.5) {
    return 'Wider, taller tires increase rolling resistance and unsprung weight.';
  }
  if (widthMm >= 255 || diameterIn >= 31.5) {
    return 'Moderate footprint — expect a small efficiency tradeoff versus narrow OEM sizes.';
  }
  return 'Relatively efficient footprint for daily driving.';
}

function groundClearanceCopy(diameterIn: number): string {
  if (diameterIn >= 33) {
    return 'Larger overall diameter raises the axle and improves obstacle clearance.';
  }
  if (diameterIn >= 31) {
    return 'Adds useful clearance without extreme lift requirements.';
  }
  return 'Limited diameter gain versus common truck and SUV upgrades.';
}

export function buildPerformanceImpactCards(specs: TireSpecs): PerformanceImpactCard[] {
  const { aspectRatio, widthMm, overallDiameterIn } = specs;

  const cards: Array<Omit<PerformanceImpactCard, 'impact'>> = [
    {
      id: 'comfort',
      title: 'Ride Comfort',
      icon: 'comfort',
      rating: clampRating(rideComfortRating(aspectRatio)),
      copy:
        aspectRatio >= 55
          ? 'More sidewall helps absorb potholes and rough roads.'
          : 'Shorter sidewalls feel firmer over bumps and expansion joints.',
    },
    {
      id: 'handling',
      title: 'Handling',
      icon: 'handling',
      rating: clampRating(handlingRating(aspectRatio)),
      copy:
        aspectRatio <= 55
          ? 'Lower profile sharpens steering response on pavement.'
          : 'Taller tires trade some steering precision for comfort.',
    },
    {
      id: 'fuel',
      title: 'Fuel Economy',
      icon: 'fuel',
      rating: clampRating(fuelEconomyRating(widthMm, overallDiameterIn)),
      copy: fuelEconomyCopy(widthMm, overallDiameterIn),
    },
    {
      id: 'clearance',
      title: 'Ground Clearance',
      icon: 'clearance',
      rating: clampRating(groundClearanceRating(overallDiameterIn)),
      copy: groundClearanceCopy(overallDiameterIn),
    },
    {
      id: 'offroad',
      title: 'Off-Road Capability',
      icon: 'mountain',
      rating: clampRating(offRoadRating(aspectRatio, overallDiameterIn)),
      copy:
        overallDiameterIn >= 32 && aspectRatio >= 65
          ? 'Taller sidewalls and diameter support airing down and trail clearance.'
          : 'Better suited to pavement than aggressive off-road work.',
    },
    {
      id: 'towing',
      title: 'Towing',
      icon: 'towing',
      rating: clampRating(towingRating(widthMm, aspectRatio)),
      copy: 'Larger truck sizes often pair with stronger constructions.',
    },
    {
      id: 'snow',
      title: 'Snow Performance',
      icon: 'snow',
      rating: clampRating(snowRating(widthMm)),
      copy: 'Tread compound matters more than size alone.',
    },
  ];

  return cards.map((card) => ({
    ...card,
    impact: impactFromRating(card.rating),
  }));
}

const SUMMARY_LABELS: Record<PerformanceImpactCard['id'], string> = {
  comfort: 'comfort',
  handling: 'steering response',
  fuel: 'efficiency',
  clearance: 'ground clearance',
  offroad: 'off-road capability',
  towing: 'towing',
  snow: 'snow traction',
};

function joinPhrases(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

export function buildPerformanceImpactSummary(cards: PerformanceImpactCard[]): string {
  const strengths = cards
    .filter((card) => card.rating >= 4)
    .sort((a, b) => b.rating - a.rating)
    .map((card) => SUMMARY_LABELS[card.id]);

  const tradeoffs = cards
    .filter((card) => card.rating <= 2)
    .sort((a, b) => a.rating - b.rating)
    .map((card) => SUMMARY_LABELS[card.id]);

  if (strengths.length > 0 && tradeoffs.length > 0) {
    return `This tire size prioritizes ${joinPhrases(strengths)} while accepting minor tradeoffs in ${joinPhrases(tradeoffs)}.`;
  }

  if (strengths.length > 0) {
    return `This tire size delivers strong ${joinPhrases(strengths)} with balanced everyday performance.`;
  }

  if (tradeoffs.length > 0) {
    return `This tire size is balanced across driving characteristics with modest tradeoffs in ${joinPhrases(tradeoffs)}.`;
  }

  return 'This tire size offers a balanced mix of comfort, handling, and everyday drivability.';
}
