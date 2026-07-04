import type { TireSpecs } from './tire-math';
import {
  buildAbsoluteAccelerationCopy,
  buildAbsoluteFuelEconomyCopy,
  buildAbsoluteGroundClearanceCopy,
  buildAbsoluteHandlingCopy,
  buildAbsoluteRideComfortCopy,
  formatImpactCopy,
} from './tire-real-world-impact';

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

function fuelEconomyRating(revsPerMile: number, widthMm: number): number {
  return clampRating(5.4 - (revsPerMile - 600) * 0.012 - (widthMm - 195) * 0.008);
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

function offRoadCopy(specs: TireSpecs): string {
  const parts = {
    measurement: `Overall diameter is ${specs.overallDiameterIn.toFixed(2)}" with a ${specs.sidewallIn.toFixed(2)}" sidewall (${specs.aspectRatio}% aspect).`,
    engineering:
      specs.overallDiameterIn >= 32 && specs.aspectRatio >= 65
        ? `The tall sidewall and diameter provide more air volume for airing down and obstacle clearance.`
        : `This diameter and aspect profile is sized primarily for on-road use rather than aggressive trail work.`,
    practical:
      specs.overallDiameterIn >= 32 && specs.aspectRatio >= 65
        ? `Trail clearance and sidewall compliance support moderate off-road use when fitment allows.`
        : `Pavement-oriented sizing — do not expect rock-crawling clearance from diameter alone.`,
  };
  return formatImpactCopy(parts);
}

function towingCopy(specs: TireSpecs): string {
  const parts = {
    measurement: `Section width is ${specs.sectionWidthIn.toFixed(2)}" (${specs.widthMm} mm) at ${specs.overallDiameterIn.toFixed(2)}" overall diameter.`,
    engineering: `Wider footprints spread load across a larger contact patch; LT-sized widths (${specs.widthMm} mm) typically pair with higher load ratings in this class.`,
    practical:
      specs.widthMm >= 265
        ? `Suitable for light towing when load index and vehicle placard ratings are met.`
        : `Verify load index against your placard before towing — narrow passenger widths carry less rated capacity.`,
  };
  return formatImpactCopy(parts);
}

function snowCopy(specs: TireSpecs): string {
  const parts = {
    measurement: `Section width is ${specs.sectionWidthIn.toFixed(2)}" (${specs.widthMm} mm).`,
    engineering: `Narrower sections concentrate vehicle weight over a smaller footprint, which can improve bite in deep snow; tread compound and siping dominate winter grip.`,
    practical:
      specs.widthMm <= 235
        ? `Width is favorable for snow channels — still match compound and 3PMSF rating to your climate.`
        : `Wider footprint may require deeper tread and compound choice for equivalent snow performance.`,
  };
  return formatImpactCopy(parts);
}

export function buildPerformanceImpactCards(specs: TireSpecs): PerformanceImpactCard[] {
  const { aspectRatio, widthMm, overallDiameterIn, revsPerMile } = specs;

  const cards: Array<Omit<PerformanceImpactCard, 'impact'>> = [
    {
      id: 'comfort',
      title: 'Ride Comfort',
      icon: 'comfort',
      rating: clampRating(rideComfortRating(aspectRatio)),
      copy: formatImpactCopy(buildAbsoluteRideComfortCopy(specs)),
    },
    {
      id: 'handling',
      title: 'Handling',
      icon: 'handling',
      rating: clampRating(handlingRating(aspectRatio)),
      copy: formatImpactCopy(buildAbsoluteHandlingCopy(specs)),
    },
    {
      id: 'fuel',
      title: 'Fuel Economy',
      icon: 'fuel',
      rating: clampRating(fuelEconomyRating(revsPerMile, widthMm)),
      copy: formatImpactCopy(buildAbsoluteFuelEconomyCopy(specs)),
    },
    {
      id: 'clearance',
      title: 'Ground Clearance',
      icon: 'clearance',
      rating: clampRating(groundClearanceRating(overallDiameterIn)),
      copy: formatImpactCopy(buildAbsoluteGroundClearanceCopy(specs)),
    },
    {
      id: 'offroad',
      title: 'Off-Road Capability',
      icon: 'mountain',
      rating: clampRating(offRoadRating(aspectRatio, overallDiameterIn)),
      copy: offRoadCopy(specs),
    },
    {
      id: 'towing',
      title: 'Towing',
      icon: 'towing',
      rating: clampRating(towingRating(widthMm, aspectRatio)),
      copy: towingCopy(specs),
    },
    {
      id: 'snow',
      title: 'Snow Performance',
      icon: 'snow',
      rating: clampRating(snowRating(widthMm)),
      copy: snowCopy(specs),
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

  const topCard = cards.find((c) => c.rating >= 4);
  const lowCard = cards.find((c) => c.rating <= 2);

  if (strengths.length > 0 && tradeoffs.length > 0 && topCard && lowCard) {
    return `${topCard.copy.split('.')[0]}. Relative strengths: ${joinPhrases(strengths)}; tradeoffs: ${joinPhrases(tradeoffs)}.`;
  }

  if (topCard) {
    return topCard.copy;
  }

  if (lowCard) {
    return lowCard.copy;
  }

  return cards[0]?.copy ?? '';
}
