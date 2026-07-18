/** Layer 3: comparison calculator path helpers that may depend on hub validation. */

import {
  comparisonCalculatorPath,
  publishedComparePath,
} from './comparison-redirect';
import { isValidComparisonPair } from './tire-comparison-validation';

export {
  COMPARISON_CALCULATOR_PATH,
  comparisonCalculatorPath,
} from './comparison-redirect';

/**
 * Prefer the clean indexable `/compare/` page; only pairs without a published
 * page fall back to the interactive calculator with prefill params.
 */
export function comparisonPagePath(sizeA: string, sizeB: string): string | null {
  if (!isValidComparisonPair(sizeA, sizeB)) return null;

  const published = publishedComparePath(sizeA, sizeB);
  if (published) return published;

  return comparisonCalculatorPath(sizeA, sizeB);
}
