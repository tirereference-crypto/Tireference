/** Comparison calculator path helpers that may depend on hub validation. */

import { CALCULATOR_PATHS, calculatorPathWithQuery } from './calculator-links';
import { isValidComparisonPair } from './tire-comparison-validation';

export function comparisonPagePath(sizeA: string, sizeB: string): string | null {
  if (!isValidComparisonPair(sizeA, sizeB)) return null;
  return calculatorPathWithQuery(CALCULATOR_PATHS.tireComparison, {
    from: sizeA,
    to: sizeB,
  });
}
