/**
 * Backward-compatible re-exports for the 275/70R18 guide rollout.
 * New code should import from `./tire-size-guide`.
 */

export {
  GUIDE_275_SIZE,
  buildGuide275Data,
  buildTireSizeGuideData,
  formatTireModelDisplayName,
  formatTireModelName,
  selectTopGuideProducts,
  getGuideProductsForSize,
  formatCategoryLabel,
  CALCULATOR_PATHS,
  comparisonPagePath,
  hubPagePath,
  type GlanceRow,
  type OverviewBullet,
  type GuideVehicle,
  type SizeChip,
  type GuideUseCaseBucket,
  type TireSizeGuideData,
} from './tire-size-guide';
