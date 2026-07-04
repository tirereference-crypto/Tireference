/**
 * Category-aware recommendation engine for tire comparison pages.
 *
 * Recommendations depend on tire category, vehicle class, measured dimensions,
 * load index, speed rating, and intended usage. Every claim cites calculated deltas.
 */
import type { TireCategory } from '../data/tire-sizes';
import { inferTireCategory } from '../data/tire-sizes';
import { getTireSizeEntry } from './tire-size-hub';
import type { ResolvedTireRatings } from './tire-ratings';
import { parsePrimaryLoadIndex } from './tire-ratings';
import type { TireComparison, TireSpecs } from './tire-math';
import type { UnitSystem } from './calculator-types';
import { speedUnitLabel } from './tire-comparison-units';
import { fmtInQuote, fmtPct, fmtSigned, nearZero } from './tire-comparison-format';
import { FITMENT_SCORE, REVS_PER_MILE_THRESHOLD } from './tire-comparison-fitment';

export interface ComparisonRecommendationContext {
  sizeA: string;
  sizeB: string;
  categoryA: TireCategory;
  categoryB: TireCategory;
  specsA: TireSpecs;
  specsB: TireSpecs;
  comparison: TireComparison;
  ratingsA: ResolvedTireRatings | null;
  ratingsB: ResolvedTireRatings | null;
  fitmentScore: number;
  unitSystem: UnitSystem;
  indicatedSpeed: number;
  rpmA: number;
  rpmB: number;
  rpmDelta: number;
  widthPct: number;
  sidewallPct: number;
}

/** Resolve dataset category, falling back to dimensional inference. */
export function resolveTireCategory(
  size: string,
  specs: TireSpecs,
): TireCategory {
  return (
    getTireSizeEntry(size)?.category ??
    inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn)
  );
}

export function buildRecommendationContext(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  options: {
    fitmentScore?: number;
    unitSystem?: UnitSystem;
    ratingsA?: ResolvedTireRatings | null;
    ratingsB?: ResolvedTireRatings | null;
    indicatedSpeed?: number;
    rpmA?: number;
    rpmB?: number;
    rpmDelta?: number;
    widthPct?: number;
    sidewallPct?: number;
  } = {},
): ComparisonRecommendationContext {
  const indicatedSpeed = options.indicatedSpeed ?? comparison.speedometer.indicatedSpeed;
  return {
    sizeA,
    sizeB,
    categoryA: resolveTireCategory(sizeA, specsA),
    categoryB: resolveTireCategory(sizeB, specsB),
    specsA,
    specsB,
    comparison,
    ratingsA: options.ratingsA ?? null,
    ratingsB: options.ratingsB ?? null,
    fitmentScore: options.fitmentScore ?? 10,
    unitSystem: options.unitSystem ?? 'imperial',
    indicatedSpeed,
    rpmA: options.rpmA ?? 0,
    rpmB: options.rpmB ?? 0,
    rpmDelta: options.rpmDelta ?? 0,
    widthPct:
      options.widthPct ??
      ((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100,
    sidewallPct:
      options.sidewallPct ??
      ((specsB.sidewallIn - specsA.sidewallIn) / specsA.sidewallIn) * 100,
  };
}

function isLtSized(size: string, category: TireCategory): boolean {
  return category === 'light-truck' || size.trim().toUpperCase().startsWith('LT');
}

function loadIndexValue(ratings: ResolvedTireRatings | null): number | null {
  if (!ratings?.loadIndex) return null;
  return parsePrimaryLoadIndex(ratings.loadIndex);
}

function isHighPerformanceSpeedRating(ratings: ResolvedTireRatings | null): boolean {
  const sym = ratings?.speedRating?.toUpperCase();
  return sym === 'V' || sym === 'W' || sym === 'Y' || sym === 'Z';
}

function dimensionalSignals(ctx: ComparisonRecommendationContext) {
  const { specsA, specsB, comparison } = ctx;
  const diamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDeltaMm = specsB.widthMm - specsA.widthMm;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;

  return {
    diamDiffIn,
    widthDeltaMm,
    sidewallDiff,
    aspectDiff,
    taller: diamDiffIn > 0.05,
    shorter: diamDiffIn < -0.05,
    wider: widthDeltaMm > 3,
    narrower: widthDeltaMm < -3,
    softer: sidewallDiff > 0.1 || aspectDiff > 3,
    firmer: sidewallDiff < -0.1 || aspectDiff < -3,
    balanced:
      Math.abs(comparison.diameterDiffPercent) < 2 &&
      Math.abs(widthDeltaMm) < 8,
    highway:
      comparison.revsPerMileDiff < -3 &&
      Math.abs(comparison.speedometer.errorPercent) < 3,
    winter:
      widthDeltaMm < -3 ||
      (sidewallDiff > 0.1 && widthDeltaMm <= 0),
    revsDown: comparison.revsPerMileDiff < -REVS_PER_MILE_THRESHOLD,
    revsUp: comparison.revsPerMileDiff > REVS_PER_MILE_THRESHOLD,
    speedoHigh: Math.abs(comparison.speedometer.errorPercent) > 3,
    clearanceGain: comparison.groundClearanceChangeIn > 0.01,
  };
}

/** Use-case tags for quick verdict — filtered by tire category. */
export function buildCategoryUseCaseTags(ctx: ComparisonRecommendationContext): string[] {
  const { categoryB, comparison, specsA, specsB } = ctx;
  const d = dimensionalSignals(ctx);
  const tags: string[] = [];

  const loadB = loadIndexValue(ctx.ratingsB);
  const loadA = loadIndexValue(ctx.ratingsA);

  switch (categoryB) {
    case 'performance': {
      if (d.balanced) tags.push('Daily Driving');
      if (d.firmer || d.wider) tags.push('Steering Response');
      if (d.highway || d.revsDown) tags.push('Highway Cruising');
      if (d.wider) tags.push('Contact Patch');
      if (d.softer) tags.push('Ride Comfort');
      if (
        isHighPerformanceSpeedRating(ctx.ratingsB) &&
        specsB.aspectRatio <= 45 &&
        d.firmer
      ) {
        tags.push('Spirited Driving');
      }
      break;
    }
    case 'SUV': {
      if (d.balanced || d.softer) tags.push('Family Use');
      if (d.highway || d.revsDown) tags.push('Highway Comfort');
      if (d.softer) tags.push('Ride Comfort');
      if (loadB && loadB >= 100) tags.push('Light Towing');
      if (d.taller && comparison.diameterDiffPercent <= 3) tags.push('Light Trails');
      if (d.balanced) tags.push('Daily Driving');
      break;
    }
    case 'light-truck': {
      if (loadB && loadB >= 115) tags.push('Heavy Payload');
      if (loadB && loadB >= 105) tags.push('Towing');
      if (d.wider || (loadB && loadA && loadB > loadA)) tags.push('Work Use');
      if (d.highway || d.revsDown) tags.push('Highway Cruising');
      if (isLtSized(ctx.sizeB, categoryB)) tags.push('Durability');
      if (d.taller) tags.push('Clearance');
      break;
    }
    case 'off-road': {
      if (d.taller && comparison.diameterDiffPercent > 2) tags.push('Trail Driving');
      if (d.taller && comparison.diameterDiffPercent > 3) tags.push('Overlanding');
      if (d.clearanceGain) tags.push('Clearance Gains');
      if (d.softer || specsB.sidewallIn >= specsA.sidewallIn) tags.push('Articulation');
      if (d.wider) tags.push('Flotation');
      break;
    }
    default: {
      if (d.balanced) tags.push('Daily Driving');
      if (d.highway) tags.push('Highway Cruising');
      if (d.winter) tags.push('Winter Driving');
      if (d.narrower || d.revsDown) tags.push('Fuel Economy');
      if (d.softer) tags.push('Ride Comfort');
      break;
    }
  }

  if (tags.length === 0) tags.push('Daily Driving');
  return [...new Set(tags)].slice(0, 4);
}

/** Verdict benefit lines — qualitative trade-offs, not repeated spec-table numbers. */
export function buildCategoryBenefits(ctx: ComparisonRecommendationContext): string[] {
  const { sizeA, categoryB, comparison, specsA, specsB, rpmDelta, indicatedSpeed, unitSystem } = ctx;
  const d = dimensionalSignals(ctx);
  const benefits: string[] = [];
  const speedUnit = speedUnitLabel(unitSystem);

  if (Math.abs(comparison.speedometer.errorPercent) < 3) {
    benefits.push('Speedometer stays within typical OEM tolerance bands');
  }

  switch (categoryB) {
    case 'performance':
      if (d.firmer) benefits.push('Firmer sidewall limits tread squirm — sharper steering on paved roads');
      if (d.wider) benefits.push('Wider section enlarges the contact patch for dry grip');
      if (d.revsDown) {
        benefits.push(
          `Lower cruising RPM at ${indicatedSpeed} ${speedUnit} reduces highway engine load`,
        );
      }
      break;
    case 'SUV':
      if (d.softer) benefits.push('Taller sidewall adds vertical compliance for family and highway use');
      if (d.revsDown) {
        benefits.push(`Lower cruising RPM at ${indicatedSpeed} ${speedUnit} eases highway noise`);
      }
      if (d.taller && comparison.diameterDiffPercent <= 4) {
        benefits.push('Taller overall diameter raises static ride height for light trails');
      }
      break;
    case 'light-truck': {
      const loadB = loadIndexValue(ctx.ratingsB);
      const loadA = loadIndexValue(ctx.ratingsA);
      if (loadB && loadA && loadB > loadA) {
        benefits.push('Higher load index supports heavier payload and towing duty');
      } else if (d.wider) {
        benefits.push('Wider section spreads load across a larger contact patch');
      }
      if (d.taller) benefits.push('Taller diameter adds underbody clearance when loaded');
      if (ctx.ratingsB?.loadRange) {
        benefits.push(`Load range ${ctx.ratingsB.loadRange} rated for LT work cycles`);
      }
      break;
    }
    case 'off-road':
      if (d.taller) benefits.push('Taller diameter improves break-over and obstacle clearance');
      if (d.taller && d.softer) benefits.push('Taller sidewall allows more conformity on uneven terrain');
      if (d.wider) benefits.push('Wider footprint helps on loose and soft surfaces');
      break;
    default:
      if (d.revsDown) {
        benefits.push(`Lower cruising RPM at ${indicatedSpeed} ${speedUnit} favors highway efficiency`);
      }
      if (d.softer) benefits.push('Taller sidewall softens impact over rough commute routes');
      if (d.narrower) benefits.push('Narrower section can reduce rolling resistance slightly');
      break;
  }

  if (benefits.length === 0 && d.balanced) {
    benefits.push(`Near-reference dimensions — minimal change from ${sizeA} for ${categoryLabel(categoryB)} duty`);
  }
  if (benefits.length === 0) {
    benefits.push(`Same ${specsA.wheelDiameterIn}" wheel — plus-size on existing rim`);
  }

  return [...new Set(benefits)].slice(0, 3);
}

/** Verdict consideration lines — qualitative risks, not repeated measurements. */
export function buildCategoryConsiderations(ctx: ComparisonRecommendationContext): string[] {
  const { categoryB, comparison, specsA, specsB } = ctx;
  const d = dimensionalSignals(ctx);
  const considerations: string[] = [];
  const diamPct = Math.abs(comparison.diameterDiffPercent);
  const widthPct = Math.abs(ctx.widthPct);

  if (d.speedoHigh) {
    considerations.push('Speedometer error exceeds typical OEM tolerance — plan for recalibration');
  }
  if (specsB.wheelDiameterIn !== specsA.wheelDiameterIn) {
    considerations.push(`Requires new ${specsB.wheelDiameterIn}" wheels — cannot reuse ${specsA.wheelDiameterIn}" rims`);
  }
  if (diamPct > 3 || widthPct > 5) {
    considerations.push('Large dimensional step — verify rubbing clearance at full lock and compression');
  }

  switch (categoryB) {
    case 'performance':
      if (d.softer) considerations.push('Taller sidewall adds flex — less precise steering on paved roads');
      if (d.taller) considerations.push('Taller diameter works against low-profile handling goals');
      break;
    case 'SUV':
      if (d.firmer) considerations.push('Firmer sidewall transmits more harshness with family loads');
      break;
    case 'light-truck':
      if (d.shorter) considerations.push('Shorter diameter reduces underbelly clearance when loaded');
      if (d.narrower) considerations.push('Narrower section reduces footprint under heavy payload');
      break;
    case 'off-road':
      if (d.revsUp) considerations.push('Higher cruising RPM on long highway transfers to trailhead');
      if (d.firmer && !d.taller) considerations.push('Shorter sidewall reduces compliance on rocky trails');
      break;
    default:
      if (d.firmer) considerations.push('Firmer sidewall transmits more road harshness over rough surfaces');
      if (d.revsUp) considerations.push('Higher cruising RPM increases highway engine load');
      break;
  }

  return [...new Set(considerations)].slice(0, 3);
}

/** Main recommendation section body — decision-focused, fitment score only for numbers. */
export function buildCategoryRecommendationBody(ctx: ComparisonRecommendationContext): string {
  const { sizeA, sizeB, categoryB, fitmentScore } = ctx;

  let headline: string;
  if (fitmentScore >= FITMENT_SCORE.EXCELLENT) {
    headline = `Fitment score ${fitmentScore.toFixed(1)}/10 — dimensional deltas stay within typical factory margins for ${categoryLabel(categoryB)} use.`;
  } else if (fitmentScore >= FITMENT_SCORE.ACCEPTABLE) {
    headline = `Fitment score ${fitmentScore.toFixed(1)}/10 — verify clearance before committing; changes are noticeable but manageable on many ${categoryLabel(categoryB)} platforms.`;
  } else {
    headline = `Fitment score ${fitmentScore.toFixed(1)}/10 — this step warrants detailed mock-fit planning before purchase.`;
  }

  const usage = buildCategoryUsageParagraph(ctx);
  const action =
    fitmentScore >= FITMENT_SCORE.ACCEPTABLE
      ? `Confirm load index${ctx.ratingsB?.loadIndex ? ` (${ctx.ratingsB.loadIndex})` : ''}, speed rating${ctx.ratingsB?.speedRating ? ` (${ctx.ratingsB.speedRating})` : ''}, and inner fender clearance on your vehicle before purchasing four tires.`
      : `Mock-fit at full lock and full compression, verify wheel offset, and plan for speedometer correction if indicated speed drifts beyond your tolerance.`;

  return `${headline} ${usage} ${action}`;
}

function categoryLabel(category: TireCategory): string {
  switch (category) {
    case 'performance':
      return 'performance';
    case 'SUV':
      return 'SUV';
    case 'light-truck':
      return 'light-truck';
    case 'off-road':
      return 'off-road';
    default:
      return 'passenger';
  }
}

function buildCategoryUsageParagraph(ctx: ComparisonRecommendationContext): string {
  const { categoryB, sizeB, specsB } = ctx;
  const d = dimensionalSignals(ctx);
  const loadB = loadIndexValue(ctx.ratingsB);

  switch (categoryB) {
    case 'performance':
      return [
        `${sizeB} is a performance-class fitment — steering response and contact-patch stability on paved roads drive the recommendation, not towing or trail duty.`,
        d.firmer
          ? `The shorter sidewall limits tread squirm under lateral load, which suits highway and spirited driving.`
          : d.wider
            ? `The wider section enlarges the contact patch for dry-pavement grip — not off-road clearance work.`
            : `Dimensional character stays near the reference size — a measured plus-size step for performance duty.`,
        d.revsDown
          ? `Lower cruising RPM at highway speed reduces engine load — a secondary benefit for daily commuting.`
          : '',
      ]
        .filter(Boolean)
        .join(' ');
    case 'SUV':
      return [
        `${sizeB} fits SUV and crossover use — comfort and family hauling matter more than track response.`,
        d.softer
          ? `The taller sidewall adds vertical compliance for loaded suspension travel and rough pavement.`
          : d.taller
            ? `The taller overall diameter adds static ride height for light trails — not rock-crawling articulation.`
            : `Ride height and sidewall stay close to the reference — an OEM-style swap for daily SUV duty.`,
        loadB && loadB >= 100
          ? `Load index ${ctx.ratingsB?.loadIndex} supports light towing when paired with appropriate vehicle ratings.`
          : '',
      ]
        .filter(Boolean)
        .join(' ');
    case 'light-truck':
      return [
        `${sizeB} is sized for light-truck duty — payload and towing ratings drive the recommendation, not lap times.`,
        loadB
          ? `Load index ${ctx.ratingsB?.loadIndex}${ctx.ratingsB?.loadRange ? ` with load range ${ctx.ratingsB.loadRange}` : ''} defines rated carrying capacity; verify against your door-placard minimum.`
          : `Section width changes the footprint under loaded axles — confirm against your payload needs.`,
        d.taller
          ? `Taller overall diameter adds static clearance when the truck is loaded — measure at ride height, not curb weight only.`
          : d.wider
            ? `Wider section spreads load across a larger contact patch for towing stability.`
            : '',
      ]
        .filter(Boolean)
        .join(' ');
    case 'off-road':
      return [
        `${sizeB} targets off-road and trail use where clearance and sidewall compliance matter.`,
        d.taller
          ? `Taller overall diameter raises static clearance — verify fender envelope at full articulation before trail use.`
          : `Diameter change is limited — focus on width and sidewall compliance for trail performance.`,
        d.softer || specsB.sidewallIn >= ctx.specsA.sidewallIn
          ? `Sidewall compliance affects how the tire conforms over uneven terrain.`
          : d.firmer
            ? `The shorter sidewall reduces flex — decide whether trail articulation or pavement response is the priority.`
            : '',
      ]
        .filter(Boolean)
        .join(' ');
    default:
      return [
        `${sizeB} is a passenger-size fitment focused on daily transportation.`,
        d.revsDown
          ? `Lower cruising RPM at highway speed is the primary efficiency driver for commuting duty.`
          : d.softer
            ? `The taller sidewall improves impact absorption on daily routes.`
            : `Dimensional deltas are moderate — treat as an OEM-adjacent replacement step.`,
      ].join(' ');
  }
}

/** "Who should choose" paragraph — audience decision without repeating spec-table numbers. */
export function buildCategoryWhoShouldChoose(ctx: ComparisonRecommendationContext): string {
  const { sizeA, sizeB, categoryB, fitmentScore } = ctx;
  const d = dimensionalSignals(ctx);

  let audience: string;
  switch (categoryB) {
    case 'performance':
      audience = d.firmer || d.wider
        ? `Choose ${sizeB} if you want ${d.firmer ? 'a firmer sidewall for sharper steering' : ''}${d.firmer && d.wider ? ' and ' : ''}${d.wider ? 'a wider contact patch for dry grip' : ''} on paved roads — not for towing or trail duty.`
        : `Choose ${sizeB} if the dimensional character matches your plus-size goals while keeping speedometer error within your tolerance.`;
      break;
    case 'SUV':
      audience = d.softer || d.taller
        ? `Choose ${sizeB} for SUV duty if ${d.softer ? 'the taller sidewall measurably improves comfort' : 'the taller diameter adds light-trail clearance'} without exceeding your fitment tolerance.`
        : `Choose ${sizeB} when the dimensional changes fit your crossover without rubbing at full lock.`;
      break;
    case 'light-truck':
      audience = `Choose ${sizeB} for truck work when load index${ctx.ratingsB?.loadIndex ? ` ${ctx.ratingsB.loadIndex}` : ''}${ctx.ratingsB?.loadRange ? ` and load range ${ctx.ratingsB.loadRange}` : ''} meet placard requirements and mock-fit clearance checks pass under loaded suspension.`;
      break;
    case 'off-road':
      audience = d.taller
        ? `Choose ${sizeB} for trail and overland builds when mock-fit confirms fender clearance at full compression — do not commit without an on-vehicle check.`
        : `Choose ${sizeB} when width and sidewall changes support your trail terrain without relying on large diameter gains.`;
      break;
    default:
      audience = d.revsDown
        ? `Choose ${sizeB} for commuting if lower cruising RPM and speedometer accuracy fit your daily route.`
        : `Choose ${sizeB} when the sidewall and diameter character match your OEM replacement goals.`;
  }

  const stayOnA = `Stay on ${sizeA} if mock-fit clearance fails, speedometer error exceeds your tolerance, or fitment score ${fitmentScore.toFixed(1)}/10 signals a higher-risk step for your platform.`;

  return [audience, stayOnA].join(' ');
}

/** Personality card bullets — category-appropriate axes. */
export function buildCategoryPersonalityBullets(ctx: ComparisonRecommendationContext): {
  sportier: string[];
  comfort: string[];
  offroad: string[];
} {
  const { categoryB, sizeA, comparison, specsA, specsB } = ctx;
  const d = dimensionalSignals(ctx);

  const sportier: string[] = [];
  const comfort: string[] = [];
  const offroad: string[] = [];

  const allowSport = categoryB === 'performance' || categoryB === 'passenger';
  const allowOffroad = categoryB === 'off-road' || categoryB === 'light-truck';
  const allowComfort =
    categoryB === 'passenger' ||
    categoryB === 'SUV' ||
    categoryB === 'performance' ||
    categoryB === 'light-truck';

  if (allowSport) {
    if (d.firmer) {
      sportier.push(`Firmer sidewall — less flex under cornering load on paved roads`);
    }
    if (d.wider) {
      sportier.push(`Wider section — larger contact patch, heavier steering at lock`);
    }
    if (specsB.wheelDiameterIn > specsA.wheelDiameterIn) {
      sportier.push(
        `Plus-size on ${specsB.wheelDiameterIn}" rim — shorter sidewall profile on larger wheel`,
      );
    }
  } else if (categoryB === 'SUV') {
    sportier.push(
      d.wider
        ? `Steering effort may rise with wider section — SUV comfort priority, not track response`
        : `Handling axis secondary to comfort and clearance on SUV duty`,
    );
  } else if (categoryB === 'light-truck') {
    sportier.push(`On-center feel shifts with section width — relevant for loaded stability, not performance driving`);
  } else {
    sportier.push(`Handling axis not primary for ${categoryLabel(categoryB)} tires`);
  }

  if (sportier.length === 0) {
    sportier.push(
      nearZero(d.sidewallDiff, 0.05) && nearZero(d.widthDeltaMm, 2)
        ? `Sidewall and width stay near ${sizeA} — response should feel familiar`
        : `Not a handling-focused swap for this tire class`,
    );
  }

  if (allowComfort) {
    if (d.softer) {
      comfort.push(`Taller sidewall — more vertical compliance over rough pavement`);
    }
    if (specsB.aspectRatio > specsA.aspectRatio + 1) {
      comfort.push(`Higher aspect ratio — larger air-spring volume between rim and tread`);
    }
    if (categoryB === 'SUV' && d.taller) {
      comfort.push(`Taller diameter — smoother transitions over driveway ramps and speed bumps`);
    }
    if (categoryB === 'performance' && d.firmer) {
      comfort.push(`Firmer sidewall — less impact absorption, more road feedback`);
    }
  }

  if (comfort.length === 0) {
    comfort.push(
      nearZero(d.sidewallDiff, 0.05)
        ? `Sidewall height unchanged — ride compliance similar to ${sizeA}`
        : d.softer
          ? `Taller sidewall — softer ride character`
          : `Shorter sidewall — firmer ride character`,
    );
  }

  if (allowOffroad) {
    if (d.taller) {
      offroad.push(`Taller overall diameter — improved break-over and obstacle clearance`);
    }
    if (d.softer && categoryB === 'off-road') {
      offroad.push(`Taller sidewall — more conformity over uneven trail surfaces`);
    }
    if (d.wider && categoryB === 'off-road') {
      offroad.push(`Wider footprint — better flotation on loose surfaces`);
    }
  } else if (categoryB === 'SUV' && d.taller && comparison.diameterDiffPercent <= 3) {
    offroad.push(`Modest diameter gain — light-trail clearance, not rock crawling`);
  } else if (categoryB === 'performance' || categoryB === 'passenger') {
    offroad.push(`Not sized for trail or overland use — ${categoryLabel(categoryB)} duty only`);
  } else {
    offroad.push(
      d.taller
        ? `Clearance gain is secondary to load ratings on ${categoryLabel(categoryB)} duty`
        : `Limited clearance change — load capacity drives the trade-off`,
    );
  }

  return {
    sportier: sportier.slice(0, 3),
    comfort: comfort.slice(0, 3),
    offroad: offroad.slice(0, 3),
  };
}

export type UpgradePersonalityType =
  | 'Off-Road Upgrade'
  | 'Aggressive Street Setup'
  | 'Fuel Economy Focused'
  | 'Comfort Upgrade'
  | 'Balanced Daily Driver'
  | 'Towing & Payload Upgrade'
  | 'Performance Street Setup';

/** Category-aware upgrade personality label and summary. */
export function buildCategoryPersonalityProfile(ctx: ComparisonRecommendationContext): {
  type: UpgradePersonalityType;
  badge: string;
  summary: string;
} {
  const { categoryB, comparison, specsA, specsB } = ctx;
  const d = dimensionalSignals(ctx);

  switch (categoryB) {
    case 'performance':
      if (d.firmer && d.wider) {
        return {
          type: 'Performance Street Setup',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Firmer sidewall and wider section sharpen steering response on paved roads — performance duty, not towing or trails.`,
        };
      }
      if (d.firmer) {
        return {
          type: 'Aggressive Street Setup',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Lower aspect ratio reduces sidewall flex for highway and spirited driving.`,
        };
      }
      return {
        type: 'Balanced Daily Driver',
        badge: `${specsB.aspectRatio} Aspect`,
        summary: `Measured plus-size step for performance-class fitments on existing or new wheels.`,
      };
    case 'SUV':
      if (d.softer) {
        return {
          type: 'Comfort Upgrade',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Taller sidewall adds compliance for family and highway use.`,
        };
      }
      if (d.taller) {
        return {
          type: 'Balanced Daily Driver',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Taller diameter for SUV daily driving and light trails.`,
        };
      }
      return {
        type: 'Balanced Daily Driver',
        badge: `${specsB.aspectRatio} Aspect`,
        summary: `Moderate dimensional change — SUV comfort and fitment priority.`,
      };
    case 'light-truck':
      return {
        type: 'Towing & Payload Upgrade',
        badge: ctx.ratingsB?.loadIndex ?? 'LT',
        summary: `Load index${ctx.ratingsB?.loadIndex ? ` ${ctx.ratingsB.loadIndex}` : ''}${ctx.ratingsB?.loadRange ? `, load range ${ctx.ratingsB.loadRange}` : ''} — sized for truck work, not track use.`,
      };
    case 'off-road':
      if (d.taller && d.softer) {
        return {
          type: 'Off-Road Upgrade',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Taller overall diameter and sidewall add trail clearance and articulation.`,
        };
      }
      if (d.taller) {
        return {
          type: 'Off-Road Upgrade',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Taller overall diameter raises static ride height for trail clearance.`,
        };
      }
      if (d.wider) {
        return {
          type: 'Off-Road Upgrade',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Wider section footprint for flotation on loose surfaces — verify fender clearance.`,
        };
      }
      return {
        type: 'Off-Road Upgrade',
        badge: `${specsB.aspectRatio} Aspect`,
        summary: `Dimensional change within off-road category — mock-fit before committing to ${specsB.widthMm}/${specsB.aspectRatio}R${specsB.wheelDiameterIn}.`,
      };
    default:
      if ((d.narrower || d.shorter) && !d.taller) {
        return {
          type: 'Fuel Economy Focused',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Smaller rolling footprint favors commuting efficiency over clearance.`,
        };
      }
      if (d.softer) {
        return {
          type: 'Comfort Upgrade',
          badge: `${specsB.aspectRatio} Aspect`,
          summary: `Taller sidewall improves impact absorption for daily transportation.`,
        };
      }
      return {
        type: 'Balanced Daily Driver',
        badge: `${specsB.aspectRatio} Aspect`,
        summary: d.balanced
          ? `Near-reference dimensions — passenger replacement step with minimal dimensional shift.`
          : `Passenger fitment change — verify speedometer and clearance against your vehicle placard.`,
      };
  }
}

/** Score personality cards by category — primary axis matches intended usage. */
export function scoreCategoryPersonalityCards(
  ctx: ComparisonRecommendationContext,
): Record<'sportier' | 'comfort' | 'offroad', number> {
  const { categoryB, comparison, specsA, specsB } = ctx;
  const d = dimensionalSignals(ctx);
  const scores = { sportier: 0, comfort: 0, offroad: 0 };

  switch (categoryB) {
    case 'performance':
      if (d.firmer) scores.sportier += 5;
      if (specsB.aspectRatio < specsA.aspectRatio - 2) scores.sportier += 4;
      if (d.wider) scores.sportier += 3;
      if (d.softer) scores.comfort += 3;
      scores.offroad += 0;
      break;
    case 'SUV':
      if (d.softer) scores.comfort += 5;
      if (specsB.aspectRatio > specsA.aspectRatio + 2) scores.comfort += 3;
      if (d.taller && comparison.diameterDiffPercent <= 3) scores.offroad += 2;
      if (d.firmer) scores.sportier += 1;
      break;
    case 'light-truck':
      if (d.taller) scores.offroad += 4;
      if (d.wider) scores.offroad += 3;
      scores.comfort += 2;
      scores.sportier += 0;
      break;
    case 'off-road':
      if (comparison.diameterDiffPercent > 2) scores.offroad += 6;
      if (d.taller) scores.offroad += 4;
      if (d.softer) scores.comfort += 2;
      scores.sportier += 0;
      break;
    default:
      if (d.softer) scores.comfort += 4;
      if (d.firmer) scores.sportier += 3;
      if (d.revsDown) scores.comfort += 2;
      break;
  }

  if (d.sidewallDiff < -0.05) scores.sportier += 2;
  if (d.sidewallDiff > 0.05) scores.comfort += 2;
  if (comparison.diameterDiffPercent > 2) scores.offroad += 2;

  return scores;
}
