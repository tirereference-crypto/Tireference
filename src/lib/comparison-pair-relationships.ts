/**
 * Shared pair classification and factual copy inputs for comparison pages.
 * Direction thresholds live here or in tire-comparison-fitment; components
 * only render the resulting facts.
 */
import { getProductsForTireSize } from './tire-size-products';
import {
  FITMENT_DIAMETER_PCT,
  fitmentStatusFromThreshold,
  type FitmentStatus,
} from './tire-comparison-fitment';
import { fmtPct, fmtSigned, nearZero } from './tire-comparison-format';
import type { TireComparison, TireSpecs } from './tire-math';

export const COMPARISON_DIRECTION_EPSILON = {
  diameterIn: 0.05,
  widthMm: 2,
  sidewallIn: 0.02,
  clearanceIn: 0.01,
  wheelIn: 0.01,
} as const;

export const COMPARISON_SPEED_EXAMPLES_MPH = [30, 60, 75] as const;

export type ComparisonSizingMode = 'plus-size' | 'downsize' | 'same-wheel';
export type ChangeDirection = 'increase' | 'decrease' | 'unchanged';
export type EffectiveGearingDirection = 'taller' | 'shorter' | 'unchanged';

export interface SharedTireModel {
  brand: string;
  model: string;
}

export interface ComparisonSpeedExample {
  indicatedMph: number;
  actualMph: number;
}

export interface ComparisonPairRelationships {
  sizeA: string;
  sizeB: string;
  sizingMode: ComparisonSizingMode;
  wheelDirection: ChangeDirection;
  sameWheelDiameter: boolean;
  canReuseWheelDiameter: boolean;
  diameterDirection: ChangeDirection;
  widthDirection: ChangeDirection;
  sidewallDirection: ChangeDirection;
  clearanceDirection: ChangeDirection;
  gearingDirection: EffectiveGearingDirection;
  diameterStatus: FitmentStatus;
  diameterDiffPercent: number;
  diameterInsideComparisonThreshold: boolean;
  awdCaution: boolean;
  speedExamples: ComparisonSpeedExample[];
  revsPerMileDiff: number;
  revsPerMileDiffPercent: number;
  sharedModels: SharedTireModel[];
}

function direction(value: number, epsilon: number): ChangeDirection {
  if (nearZero(value, epsilon)) return 'unchanged';
  return value > 0 ? 'increase' : 'decrease';
}

function productIdentity(brand: string, model: string): string {
  return `${brand.trim().toLocaleLowerCase()}|${model.trim().toLocaleLowerCase()}`;
}

/** Database-backed brand/model overlap. Service-description variants count once. */
export function getSharedTireModels(sizeA: string, sizeB: string): SharedTireModel[] {
  const productsA = getProductsForTireSize(sizeA);
  const productsB = getProductsForTireSize(sizeB);
  if (productsA.length === 0 || productsB.length === 0) return [];

  const identitiesB = new Set(
    productsB
      .filter((product) => product.brand.trim() && product.model.trim())
      .map((product) => productIdentity(product.brand, product.model)),
  );
  const shared = new Map<string, SharedTireModel>();

  for (const product of productsA) {
    const brand = product.brand.trim();
    const model = product.model.trim();
    if (!brand || !model) continue;
    const key = productIdentity(brand, model);
    if (identitiesB.has(key) && !shared.has(key)) {
      shared.set(key, { brand, model });
    }
  }

  return [...shared.values()].sort(
    (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model),
  );
}

export function actualRoadSpeedMph(
  indicatedMph: number,
  specsA: TireSpecs,
  specsB: TireSpecs,
): number {
  return indicatedMph * (specsB.overallDiameterIn / specsA.overallDiameterIn);
}

export function buildComparisonPairRelationships(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ComparisonPairRelationships {
  const wheelDiff = specsB.wheelDiameterIn - specsA.wheelDiameterIn;
  const sameWheelDiameter = nearZero(wheelDiff, COMPARISON_DIRECTION_EPSILON.wheelIn);
  const diameterDirection = direction(
    specsB.overallDiameterIn - specsA.overallDiameterIn,
    COMPARISON_DIRECTION_EPSILON.diameterIn,
  );
  const diameterStatus = fitmentStatusFromThreshold(
    Math.abs(comparison.diameterDiffPercent),
    FITMENT_DIAMETER_PCT.pass,
    FITMENT_DIAMETER_PCT.warning,
  );

  return {
    sizeA,
    sizeB,
    sizingMode: sameWheelDiameter ? 'same-wheel' : wheelDiff > 0 ? 'plus-size' : 'downsize',
    wheelDirection: direction(wheelDiff, COMPARISON_DIRECTION_EPSILON.wheelIn),
    sameWheelDiameter,
    // This concerns bead-seat diameter only, not rim width/offset or vehicle fitment.
    canReuseWheelDiameter: sameWheelDiameter,
    diameterDirection,
    widthDirection: direction(
      specsB.widthMm - specsA.widthMm,
      COMPARISON_DIRECTION_EPSILON.widthMm,
    ),
    sidewallDirection: direction(
      specsB.sidewallIn - specsA.sidewallIn,
      COMPARISON_DIRECTION_EPSILON.sidewallIn,
    ),
    clearanceDirection: direction(
      comparison.groundClearanceChangeIn,
      COMPARISON_DIRECTION_EPSILON.clearanceIn,
    ),
    gearingDirection:
      diameterDirection === 'increase'
        ? 'taller'
        : diameterDirection === 'decrease'
          ? 'shorter'
          : 'unchanged',
    diameterStatus,
    diameterDiffPercent: comparison.diameterDiffPercent,
    diameterInsideComparisonThreshold:
      Math.abs(comparison.diameterDiffPercent) <= FITMENT_DIAMETER_PCT.pass,
    awdCaution: Math.abs(comparison.diameterDiffPercent) > FITMENT_DIAMETER_PCT.pass,
    speedExamples: COMPARISON_SPEED_EXAMPLES_MPH.map((indicatedMph) => ({
      indicatedMph,
      actualMph: actualRoadSpeedMph(indicatedMph, specsA, specsB),
    })),
    revsPerMileDiff: comparison.revsPerMileDiff,
    revsPerMileDiffPercent: comparison.revsPerMileDiffPercent,
    sharedModels: getSharedTireModels(sizeA, sizeB),
  };
}

export function formatSpeedExamples(examples: readonly ComparisonSpeedExample[]): string {
  return examples
    .map(({ indicatedMph, actualMph }) => `${indicatedMph} indicated = ${actualMph.toFixed(1)} mph actual`)
    .join('; ');
}

export function formatDiameterThresholdFact(
  relationship: ComparisonPairRelationships,
): string {
  return `${fmtPct(relationship.diameterDiffPercent)} diameter change is ${
    relationship.diameterInsideComparisonThreshold ? 'inside' : 'outside'
  } the site’s ±${FITMENT_DIAMETER_PCT.pass}% comparison threshold.`;
}

export function formatRevsPerMileFact(
  relationship: ComparisonPairRelationships,
): string {
  return `Revolutions per mile change ${fmtSigned(
    relationship.revsPerMileDiff,
    1,
  )} (${fmtPct(relationship.revsPerMileDiffPercent)}), producing ${
    relationship.gearingDirection === 'unchanged'
      ? 'essentially unchanged effective gearing'
      : `${relationship.gearingDirection} effective gearing`
  }.`;
}
