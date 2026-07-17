import {
  searchTiresByDiameter,
  WHEEL_DIAMETER_OPTIONS,
  type TireDiameterMatch,
  type TireDiameterSearchResult,
  type ToleranceOption,
  type WheelDiameterOption,
} from '../../../lib/tire-diameter-search';
import { compareDiameterMatches, rankDiameterMatches } from '../../../lib/tire-diameter-ranking';
export type WheelSelection = WheelDiameterOption | 'any';

export const PRIMARY_WHEEL_OPTIONS: readonly WheelDiameterOption[] = [16, 17, 18, 20];
export const MORE_WHEEL_OPTIONS: readonly WheelDiameterOption[] = WHEEL_DIAMETER_OPTIONS.filter(
  (w) => !PRIMARY_WHEEL_OPTIONS.includes(w),
) as WheelDiameterOption[];

export const PRIMARY_TOLERANCE_OPTIONS: readonly ToleranceOption[] = [0.5, 1, 2];
export const MORE_TOLERANCE_OPTIONS: readonly ToleranceOption[] = [3];

/** Merge per-wheel reverse searches without changing searchTiresByDiameter. */
export function searchTiresByTarget(
  targetDiameterIn: number,
  wheel: WheelSelection,
  toleranceIn: ToleranceOption,
): TireDiameterSearchResult {
  if (wheel !== 'any') {
    return searchTiresByDiameter({
      targetDiameterIn,
      wheelDiameterIn: wheel,
      toleranceIn,
    });
  }

  const bySize = new Map<string, TireDiameterMatch>();
  let effectiveToleranceIn = toleranceIn;
  let widenedTolerance = false;
  let suggestion: string | undefined;

  for (const wheelDiameterIn of WHEEL_DIAMETER_OPTIONS) {
    const result = searchTiresByDiameter({
      targetDiameterIn,
      wheelDiameterIn,
      toleranceIn,
    });
    if (result.widenedTolerance) widenedTolerance = true;
    if (result.effectiveToleranceIn > effectiveToleranceIn) {
      effectiveToleranceIn = result.effectiveToleranceIn as ToleranceOption;
    }
    if (result.suggestion) suggestion = result.suggestion;
    for (const match of result.matches) {
      const existing = bySize.get(match.size);
      if (!existing || compareDiameterMatches(match, existing, 'any') < 0) {
        bySize.set(match.size, match);
      }
    }
  }

  const matches = rankDiameterMatches([...bySize.values()], 'any');

  return {
    matches,
    effectiveToleranceIn,
    widenedTolerance,
    suggestion:
      suggestion ??
      (widenedTolerance
        ? `Showing closest indexed sizes across all wheel diameters near ${targetDiameterIn.toFixed(1)}".`
        : undefined),
  };
}

export function isWheelSelection(value: unknown): value is WheelSelection {
  if (value === 'any') return true;
  return (WHEEL_DIAMETER_OPTIONS as readonly number[]).includes(Number(value));
}
