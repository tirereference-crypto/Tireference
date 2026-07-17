/**
 * Homepage configuration surface.
 * Prefer importing homepage data from here rather than scattering constants.
 */
export {
  HOME_QUICK_ACTIONS,
  HOME_HERO_TRUST,
  HOME_FEATURED_COMPARISON,
  HOME_USE_CASES,
  buildFeaturedComparisonPreview,
  type HomeCalcTone,
} from './home-landing';

export {
  HOME_BROWSE_CATEGORIES,
  HOME_POPULAR_TIRE_SIZES,
  HOME_TRUST_PANEL,
  buildPopularTireSizeCards,
  buildPopularComparisonCards,
  popularTireSizeHref,
  type HomeCategorySlug,
  type HomeCategoryCard,
} from './home-sections';
