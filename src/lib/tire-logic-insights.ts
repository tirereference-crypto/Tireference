import type { TireCategory } from '../data/tire-sizes';

const INSIGHTS_BY_CATEGORY: Record<TireCategory, readonly string[]> = {
  'off-road': [
    'Many drivers focus on tire width when choosing an off-road setup, but sidewall height often has a larger impact on ride comfort and traction over rough terrain.',
    'Larger tires improve ground clearance more slowly than most people expect. A one-inch increase in tire diameter only raises the axle by roughly half an inch.',
    'The most popular overlanding tire sizes are often not the largest sizes available. Many experienced travelers prioritize reliability, range, and fitment simplicity over maximum tire diameter.',
    'Tire pressure can have a greater effect on off-road traction than small changes in tire width.',
    'Added unsprung weight from aggressive off-road tires can make highway steering feel heavier long before fitment becomes the limiting factor.',
  ],
  'light-truck': [
    'When towing near capacity, maintaining correct tire pressure often matters more than tread pattern for straight-line stability on long highway pulls.',
    'Light-truck tires are frequently chosen for appearance, but load range and speed rating should match how the truck is actually used during the work week.',
    'A tire that feels stable empty can wander subtly when loaded if pressure was set for an unladen truck and never adjusted for payload.',
    'Durability on jobsite gravel often comes from sidewall construction and compound toughness, not from the widest tread available in the catalog.',
    'On cross-country hauls, heat buildup in fully loaded tires is a common hidden limiter — one reason experienced fleet owners watch pressure and speed together.',
  ],
  SUV: [
    'SUV owners sometimes upsize for stance and discover the factory suspension was tuned around a taller sidewall — the harshness they feel may be geometry, not tire quality.',
    'The most versatile SUV fitments usually preserve enough sidewall for pothole absorption while avoiding the steering weight of full light-truck sizing.',
    'Daily-driving SUV tires can look healthy while losing wet grip quietly, because family schedules often mean shorter trips that never heat the tread fully.',
    'Cabin noise on highway trips is often blamed on the vehicle, but tread pattern and block spacing on SUV all-season tires can be the real source.',
    'Light adventure use rarely demands the most aggressive tread in the category — a balanced all-terrain choice often survives mixed pavement and gravel better than expected.',
  ],
  performance: [
    'Steering response changes quickly with sidewall height: a small drop in aspect ratio can sharpen turn-in more noticeably than a modest width increase.',
    'Performance tires need temperature to deliver grip — short cold commutes can leave owners wondering why the same tire felt brilliant on a spirited weekend drive.',
    'A stiffer sidewall can feel precise on smooth pavement yet punish everyday roads; what reads as handling on a test loop can feel brittle in daily use.',
    'Mismatched front and rear aspect ratios can unsettle a car that felt balanced on the original square setup, even when overall diameter stays close.',
    'Wider performance tires do not always shorten wet braking distances — tread compound and groove routing often matter more than footprint alone.',
  ],
  passenger: [
    'Passenger-car replacements work best when they respect the sidewall height the suspension was designed around — comfort complaints after a plus-size swap are often geometry, not brand.',
    'For commuting efficiency, compound and rolling-resistance design usually outweigh the difference between two nearby OEM-approved sizes.',
    'Passenger tires can appear fine visually while shoulder wear from alignment drift quietly shortens service life on stop-and-go routes.',
    'Replacing only two tires on a commuter car can create subtle traction-control behavior changes that owners notice before they notice tread depth.',
    'Short urban trips keep passenger tires cooler and can mask winter grip loss until the first sustained highway drive in cold weather.',
  ],
};

/** Deterministic string hash for stable per-size insight selection. */
export function hashTireSize(size: string): number {
  const normalized = size.trim().toUpperCase();
  let hash = 0;

  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }

  return hash;
}

export function getInsightForTire(category: TireCategory, size: string): string {
  const insights = INSIGHTS_BY_CATEGORY[category];
  const index = hashTireSize(size) % insights.length;
  return insights[index];
}

export function getInsightCountForCategory(category: TireCategory): number {
  return INSIGHTS_BY_CATEGORY[category].length;
}
