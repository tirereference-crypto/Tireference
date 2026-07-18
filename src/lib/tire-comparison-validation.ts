import type { TireCategory } from '../data/tire-sizes';
import { normalizeTireSize } from './tire-size-primitives';
import { getTireSpecs } from './tire-math';
import { getTireSizeEntry } from './tire-size-hub';
import { isProductionTireSize } from './tire-size-validation';
import { fieldsToTireSizeString, parseFullSizeToFields } from './tire-size-input';

/** Legacy SEO quality gates for tire comparison pages. */
export const COMPARISON_VALIDATION_RULES = {
  /** Both sizes must share the same dataset vehicle category. */
  requireSameCategory: true,
  /** Maximum wheel diameter difference (inches) — legacy rule. */
  maxWheelDiameterDiffIn: 2,
  /** Maximum overall diameter difference (%), evaluated from both perspectives — legacy rule. */
  maxOverallDiameterDiffPct: 8,
  /** Maximum section-width difference (mm) — legacy rule. */
  maxWidthDiffMm: 50,
  /** Maximum aspect-ratio difference (percentage points) — legacy rule. */
  maxAspectRatioDiff: 20,
} as const;

/**
 * Additional dimensional gates applied on top of legacy rules.
 * All must pass for a pair to be valid.
 */
export const COMPARISON_DIMENSIONAL_RULES = {
  /** Rim diameters equal or differ by at most 1 inch. */
  maxWheelDiameterDiffIn: 1,
  /** Overall diameter differs by no more than 15% (max of both perspectives). */
  maxOverallDiameterDiffPct: 15,
  /** Section width differs by no more than 25% (max of both perspectives). */
  maxSectionWidthDiffPct: 25,
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

export interface ComparisonValidationOptions {
  /** When true, skip COMPARISON_DIMENSIONAL_RULES (legacy-only check). */
  skipDimensional?: boolean;
}

/** Options for generated /compare/ links on comparison and hub surfaces. */
export interface ComparisonLinkOptions extends ComparisonValidationOptions {
  /** When false, skip the content quality publish gate. Defaults to true. */
  requirePublished?: boolean;
  /** Drop links that point at this comparison page's own pair. */
  excludePagePair?: { current: string; new: string };
}

function invalid(reason: string): ComparisonValidationResult {
  return { valid: false, reason };
}

function valid(): ComparisonValidationResult {
  return { valid: true, reason: '' };
}

function isFieldBackedTireSize(size: string): boolean {
  const normalized = normalizeTireSize(size);
  if (!normalized || !isProductionTireSize(normalized)) return false;

  const fields = parseFullSizeToFields(normalized);
  if (!fields) return false;

  const rebuilt = fieldsToTireSizeString(fields);
  if (!rebuilt || !isProductionTireSize(rebuilt)) return false;

  return normalizeTireSize(rebuilt) === normalized;
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

function diameterDiffPct(
  specsA: ReturnType<typeof getTireSpecs>,
  specsB: ReturnType<typeof getTireSpecs>,
): number {
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

function sectionWidthDiffPct(
  specsA: ReturnType<typeof getTireSpecs>,
  specsB: ReturnType<typeof getTireSpecs>,
): number {
  const pctFromA =
    (Math.abs(specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100;
  const pctFromB =
    (Math.abs(specsA.widthMm - specsB.widthMm) / specsB.widthMm) * 100;
  return Math.max(pctFromA, pctFromB);
}

function passesDimensionalRules(
  specsA: ReturnType<typeof getTireSpecs>,
  specsB: ReturnType<typeof getTireSpecs>,
): ComparisonValidationResult {
  const wheelDiffIn = Math.abs(specsA.wheelDiameterIn - specsB.wheelDiameterIn);
  if (wheelDiffIn > COMPARISON_DIMENSIONAL_RULES.maxWheelDiameterDiffIn) {
    return invalid(
      `Rim diameter differs by ${wheelDiffIn.toFixed(1)} in (max ${COMPARISON_DIMENSIONAL_RULES.maxWheelDiameterDiffIn} in).`,
    );
  }

  const overallDiamPct = diameterDiffPct(specsA, specsB);
  if (overallDiamPct > COMPARISON_DIMENSIONAL_RULES.maxOverallDiameterDiffPct) {
    return invalid(
      `Overall diameter differs by ${overallDiamPct.toFixed(1)}% (max ${COMPARISON_DIMENSIONAL_RULES.maxOverallDiameterDiffPct}%).`,
    );
  }

  const widthPct = sectionWidthDiffPct(specsA, specsB);
  if (widthPct > COMPARISON_DIMENSIONAL_RULES.maxSectionWidthDiffPct) {
    return invalid(
      `Section width differs by ${widthPct.toFixed(1)}% (max ${COMPARISON_DIMENSIONAL_RULES.maxSectionWidthDiffPct}%).`,
    );
  }

  return valid();
}

function passesLegacyRules(
  sizeA: string,
  sizeB: string,
  entryA: NonNullable<ReturnType<typeof getTireSizeEntry>>,
  entryB: NonNullable<ReturnType<typeof getTireSizeEntry>>,
  specsA: ReturnType<typeof getTireSpecs>,
  specsB: ReturnType<typeof getTireSpecs>,
): ComparisonValidationResult {
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

/**
 * Validate whether two tire sizes should generate a dedicated comparison page
 * or appear in internal comparison suggestions.
 *
 * Applies legacy dataset/category rules AND dimensional fitment rules.
 */
export function isValidComparison(
  sizeA: string,
  sizeB: string,
  options?: ComparisonValidationOptions,
): ComparisonValidationResult {
  const keyA = normalizeTireSize(sizeA);
  const keyB = normalizeTireSize(sizeB);

  if (!keyA || !keyB) {
    return invalid('One or both tire sizes could not be normalized.');
  }

  if (keyA === keyB) {
    return invalid('Cannot compare a tire size to itself.');
  }

  if (!isProductionTireSize(keyA) || !isProductionTireSize(keyB)) {
    return invalid('Both sizes must be valid production tire sizes.');
  }

  if (!isFieldBackedTireSize(keyA) || !isFieldBackedTireSize(keyB)) {
    return invalid('Both sizes must round-trip through the calculator field format.');
  }

  if (!hasTireSizeHubPage(keyA) || !hasTireSizeHubPage(keyB)) {
    return invalid('Both sizes must have a tire-size hub page in the dataset.');
  }

  const entryA = getTireSizeEntry(keyA);
  const entryB = getTireSizeEntry(keyB);
  if (!entryA || !entryB) {
    return invalid('Both sizes must exist in the tire-size dataset.');
  }

  let specsA: ReturnType<typeof getTireSpecs>;
  let specsB: ReturnType<typeof getTireSpecs>;
  try {
    specsA = getTireSpecs(keyA);
    specsB = getTireSpecs(keyB);
  } catch {
    return invalid('Could not parse tire specifications for one or both sizes.');
  }

  const legacy = passesLegacyRules(keyA, keyB, entryA, entryB, specsA, specsB);
  if (!legacy.valid) return legacy;

  if (!options?.skipDimensional) {
    const dimensional = passesDimensionalRules(specsA, specsB);
    if (!dimensional.valid) return dimensional;
  }

  return valid();
}

/** Boolean helper — true only when legacy and dimensional rules all pass. */
export function isValidComparisonPair(
  sizeA: string,
  sizeB: string,
  options?: ComparisonValidationOptions,
): boolean {
  return isValidComparison(sizeA, sizeB, options).valid;
}
