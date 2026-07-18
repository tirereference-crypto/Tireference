/**
 * Comparison insights with navigation links attached.
 *
 * Content generation lives in tire-comparison-insights-core.ts (link-free).
 * This wrapper re-exports the public API and attaches popular/upgrade
 * comparison links from tire-comparison-links — never imported by the core,
 * so there is no links ⇄ insights import cycle.
 */
import type { UnitSystem } from './calculator-types';
import type { TireComparison, TireSpecs } from './tire-math';
import {
  buildPopularComparisonsForSize,
  buildUpgradePathsFromDatabase,
  POPULAR_COMPARISON_LIMIT,
} from './tire-comparison-links';
import {
  buildComparisonInsightsCore,
  buildComparisonPageIntro,
  COMPARISON_PAGE_INTRO_FALLBACK,
  isComparisonPublishable,
  willThisFitStatusLabel,
} from './tire-comparison-insights-core';
import type { ComparisonInsights } from './tire-comparison-types';

export {
  buildComparisonPageIntro,
  COMPARISON_PAGE_INTRO_FALLBACK,
  isComparisonPublishable,
  willThisFitStatusLabel,
} from './tire-comparison-insights-core';

export type {
  ComparisonInsights,
  ComparisonPageIntro,
  ComparisonSeoContent,
  ComparisonSummaryChip,
  FitmentCheckRow,
  FitmentStatus,
  KpiCard,
  PerformanceImpactCard,
  PersonalityCard,
  QuickComparisonVerdict,
  SpecTableRow,
  UpgradePersonality,
  VehicleCompatibility,
  VehicleFitmentDisplay,
  VerdictLevel,
  WillThisFitRow,
} from './tire-comparison-insights-core';
export type { ComparisonQualityResult } from './tire-comparison-insights-core';
export type {
  UpgradePathCard,
  UpgradePathDifficulty,
  UpgradePathsData,
} from './tire-comparison-links';

export function buildComparisonInsights(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem = 'imperial',
  options?: { omitInternalLinks?: boolean },
): ComparisonInsights {
  const core = buildComparisonInsightsCore(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
  );

  if (options?.omitInternalLinks) {
    return core;
  }

  const linkOptions = {
    requirePublished: true,
    excludePagePair: { current: sizeA, new: sizeB },
  } as const;

  return {
    ...core,
    upgradePaths: buildUpgradePathsFromDatabase(sizeA, linkOptions),
    popularComparisons: buildPopularComparisonsForSize(
      sizeA,
      POPULAR_COMPARISON_LIMIT,
      linkOptions,
    ),
  };
}
