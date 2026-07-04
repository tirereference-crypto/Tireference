import type { TireCategory } from '../data/tire-sizes';
import { getTireSpecs } from './tire-math';
import { getTireSizeEntry } from './tire-size-hub';
import { isProductionTireSize, normalizeTireSizeKey } from './tire-size-validation';
import { fieldsToTireSizeString, parseFullSizeToFields } from './tire-size-input';

/** Configurable SEO quality gates for tire comparison pages. */
export const COMPARISON_VALIDATION_RULES = {
  /** Both sizes must share the same dataset vehicle category. */
  requireSameCategory: true,
  /** Maximum wheel diameter difference (inches). */
  maxWheelDiameterDiffIn: 2,
  /** Maximum overall diameter difference (%), evaluated from both perspectives. */
  maxOverallDiameterDiffPct: 8,
  /** Maximum section-width difference (mm). */
  maxWidthDiffMm: 50,
  /** Maximum aspect-ratio difference (percentage points). */
  maxAspectRatioDiff: 20,
} as const;

/**
 * Explicit cross-class pairings that must never generate a comparison page,
 * even if dimensional checks would otherwise pass.
 */
export const INCOMPATIBLE_CATEGORY_PAIRS: ReadonlyArray<
  readonly [TireCategory, TireCategory]
> = [
  ['passenger', 'off-road'],
  ['passenger', 'light-truck'],
  ['performance', 'off-road'],
  ['performance', 'light-truck'],
  ['SUV', 'off-road'],
  ['SUV', 'light-truck'],
  ['passenger', 'SUV'],
  ['performance', 'SUV'],
] as const;

export interface ComparisonValidationResult {
  valid: boolean;
  reason: string;
}

function invalid(reason: string): ComparisonValidationResult {
  return { valid: false, reason };
}

function valid(): ComparisonValidationResult {
  return { valid: true, reason: '' };
}

function isFieldBackedTireSize(size: string): boolean {
  if (!isProductionTireSize(size)) return false;

  const fields = parseFullSizeToFields(size);
  if (!fields) return false;

  const rebuilt = fieldsToTireSizeString(fields);
  if (!rebuilt || !isProductionTireSize(rebuilt)) return false;

  return normalizeTireSizeKey(rebuilt) === normalizeTireSizeKey(size);
}

function hasTireSizeHubPage(size: string): boolean {
  return !!getTireSizeEntry(size);
}

function categoriesAreCompatible(
  categoryA: TireCategory,
  categoryB: TireCategory,
): boolean {
  if (categoryA === categoryB) return true;

  return !INCOMPATIBLE_CATEGORY_PAIRS.some(
    ([left, right]) =>
      (left === categoryA && right === categoryB) ||
      (left === categoryB && right === categoryA),
  );
}

function diameterDiffPct(specsA: ReturnType<typeof getTireSpecs>, specsB: ReturnType<typeof getTireSpecs>): number {
  const pctFromA =
    (Math.abs(specsB.overallDiameterIn - specsA.overallDiameterIn) /
      specsA.overallDiameterIn) *
    100;
  const pctFromB =
    (Math.abs(specsA.overallDiameterIn - specsB.overallDiameterIn) /
      specsB.overallDiameterIn) *
    100;
  return Math.max(pctFromA, pctFromB);
}

/**
 * Validate whether two tire sizes should generate a dedicated comparison page
 * or appear in internal comparison suggestions.
 */
export function isValidComparison(sizeA: string, sizeB: string): ComparisonValidationResult {
  const keyA = normalizeTireSizeKey(sizeA);
  const keyB = normalizeTireSizeKey(sizeB);

  if (!keyA || !keyB) {
    return invalid('One or both tire sizes could not be normalized.');
  }

  if (keyA === keyB) {
    return invalid('Cannot compare a tire size to itself.');
  }

  if (!isProductionTireSize(sizeA) || !isProductionTireSize(sizeB)) {
    return invalid('Both sizes must be valid production tire sizes.');
  }

  if (!isFieldBackedTireSize(sizeA) || !isFieldBackedTireSize(sizeB)) {
    return invalid('Both sizes must round-trip through the calculator field format.');
  }

  if (!hasTireSizeHubPage(sizeA) || !hasTireSizeHubPage(sizeB)) {
    return invalid('Both sizes must have a tire-size hub page in the dataset.');
  }

  const entryA = getTireSizeEntry(sizeA);
  const entryB = getTireSizeEntry(sizeB);
  if (!entryA || !entryB) {
    return invalid('Both sizes must exist in the tire-size dataset.');
  }

  let specsA: ReturnType<typeof getTireSpecs>;
  let specsB: ReturnType<typeof getTireSpecs>;
  try {
    specsA = getTireSpecs(sizeA);
    specsB = getTireSpecs(sizeB);
  } catch {
    return invalid('Could not parse tire specifications for one or both sizes.');
  }

  if (COMPARISON_VALIDATION_RULES.requireSameCategory && entryA.category !== entryB.category) {
    return invalid(
      `Vehicle categories differ (${entryA.category} vs ${entryB.category}). Comparisons require the same category.`,
    );
  }

  if (!categoriesAreCompatible(entryA.category, entryB.category)) {
    return invalid(
      `Incompatible vehicle categories (${entryA.category} vs ${entryB.category}).`,
    );
  }

  const wheelDiffIn = Math.abs(specsA.wheelDiameterIn - specsB.wheelDiameterIn);
  if (wheelDiffIn > COMPARISON_VALIDATION_RULES.maxWheelDiameterDiffIn) {
    return invalid(
      `Wheel diameter differs by ${wheelDiffIn.toFixed(1)} in (max ${COMPARISON_VALIDATION_RULES.maxWheelDiameterDiffIn} in).`,
    );
  }

  const overallDiamPct = diameterDiffPct(specsA, specsB);
  if (overallDiamPct > COMPARISON_VALIDATION_RULES.maxOverallDiameterDiffPct) {
    return invalid(
      `Overall diameter differs by ${overallDiamPct.toFixed(1)}% (max ${COMPARISON_VALIDATION_RULES.maxOverallDiameterDiffPct}%).`,
    );
  }

  const widthDiffMm = Math.abs(specsB.widthMm - specsA.widthMm);
  if (widthDiffMm > COMPARISON_VALIDATION_RULES.maxWidthDiffMm) {
    return invalid(
      `Section width differs by ${widthDiffMm} mm (max ${COMPARISON_VALIDATION_RULES.maxWidthDiffMm} mm).`,
    );
  }

  const aspectDiff = Math.abs(specsA.aspectRatio - specsB.aspectRatio);
  if (aspectDiff > COMPARISON_VALIDATION_RULES.maxAspectRatioDiff) {
    return invalid(
      `Aspect ratio differs by ${aspectDiff} points (max ${COMPARISON_VALIDATION_RULES.maxAspectRatioDiff}).`,
    );
  }

  return valid();
}
