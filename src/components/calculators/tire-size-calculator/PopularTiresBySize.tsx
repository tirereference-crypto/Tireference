import { useEffect, useMemo } from 'react';
import { CALCULATOR_PATHS } from '../../../lib/calculator-links';
import { DATA_STANDARDS_PATH } from '../../../lib/eeat-metadata';
import { hasTireSizeGuide } from '../../../lib/has-tire-size-guide';
import {
  findVerifiedModelForSize,
  resolvePopularAvailability,
} from '../../../lib/size-availability';
import { getCategoryBadgeTone } from '../../../lib/tire-product-display';
import { tireSizePath } from '../../../lib/tire-size-url';
import {
  CALCULATOR_NAMES,
  trackEvent,
  getSourcePage,
  type CalculatorName,
} from '../../../lib/analytics';
import { PopularTireImage, PopularBrandMark } from './PopularTireMedia';
import { TscSectionCarousel } from './TscSectionCarousel';
import { VerifiedProductCard } from './VerifiedProductCard';

export type PopularTiresContext = 'size-calculator' | 'comparison' | 'diameter-calculator';

export interface PopularTiresSelectedModel {
  brand: string;
  model: string;
}

function CatalogProvenanceNote({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="tsc-popular__provenance">
        Exact-size records from TireReference&apos;s tire database.{' '}
        <a href={DATA_STANDARDS_PATH}>Data standards</a>
      </p>
    );
  }

  return (
    <p className="tsc-popular__provenance">
      Models shown are matched to exact-size records in TireReference&apos;s tire database.
      Availability and specifications may change; confirm with the manufacturer or retailer.{' '}
      <a href={DATA_STANDARDS_PATH}>Data and Calculation Standards</a>
    </p>
  );
}

export function PopularTiresBySize({
  sizeLabel,
  selectedModel = null,
  calculatorName = CALCULATOR_NAMES.tireSize,
  context = 'size-calculator',
}: {
  sizeLabel: string;
  /** When set and verified for this exact size, show a featured “Your Selected New Tire” card. */
  selectedModel?: PopularTiresSelectedModel | null;
  calculatorName?: CalculatorName;
  context?: PopularTiresContext;
}) {
  const isDiameter = context === 'diameter-calculator';
  const cardLimit = isDiameter ? 4 : 6;

  const featured = useMemo(() => {
    if (!selectedModel?.brand || !selectedModel?.model) return null;
    return findVerifiedModelForSize(sizeLabel, selectedModel.brand, selectedModel.model);
  }, [sizeLabel, selectedModel?.brand, selectedModel?.model]);

  const result = resolvePopularAvailability(sizeLabel, {
    limit: cardLimit,
    excludeModel: featured
      ? { brand: featured.brand, model: featured.model }
      : selectedModel,
  });
  const guideAvailable = hasTireSizeGuide(sizeLabel);
  const displaySize = result.sizeLabel || sizeLabel;
  const visibleModelCount =
    result.level === 'models'
      ? result.models.length + (featured ? 1 : 0)
      : result.level === 'brands'
        ? Math.min(result.brands.length, cardLimit)
        : result.level === 'categories'
          ? result.categories.length
          : 0;

  const hasAdditionalAtDestination =
    guideAvailable &&
    result.totalModelCount > 0 &&
    result.totalModelCount > visibleModelCount;

  useEffect(() => {
    trackEvent('calculator_popular_tires_shown', {
      calculator_name: calculatorName,
      new_tire_size: context === 'comparison' ? displaySize : undefined,
      current_tire_size: context !== 'comparison' ? displaySize : undefined,
      fallback_level: result.level,
      source_page: getSourcePage(),
    });
  }, [calculatorName, context, displaySize, result.level]);

  const trackViewAll = () => {
    trackEvent('calculator_view_all_tires_clicked', {
      calculator_name: calculatorName,
      current_tire_size: context !== 'comparison' ? displaySize : undefined,
      new_tire_size: context === 'comparison' ? displaySize : undefined,
      source_page: getSourcePage(),
    });
  };

  const fallbackLinks =
    context === 'comparison' ? (
      <div className="tsc-popular__fallback-links">
        <a href="#cmp-alt-paths">Alternative Comparison Paths</a>
        <a href={CALCULATOR_PATHS.tireSize}>Tire Size Calculator</a>
        {guideAvailable ? (
          <a href={tireSizePath(displaySize)}>Tire-size guide</a>
        ) : (
          <a href="/tire-sizes/">Tire-size guides</a>
        )}
      </div>
    ) : isDiameter ? (
      <div className="tsc-popular__fallback-links">
        <a href={CALCULATOR_PATHS.tireComparison}>Tire comparison calculator</a>
        <a href={CALCULATOR_PATHS.tireSize}>Tire Size Calculator</a>
        <a href="/tire-sizes/">Popular tire-size guides</a>
        <a href={DATA_STANDARDS_PATH}>Data and Calculation Standards</a>
      </div>
    ) : (
      <div className="tsc-popular__fallback-links">
        <a href="#related-tire-sizes">Related sizes</a>
        <a href={CALCULATOR_PATHS.tireComparison}>Tire comparison calculator</a>
        <a href="/tire-sizes/">Popular tire-size guides</a>
      </div>
    );

  const viewAll = hasAdditionalAtDestination ? (
    <a
      href={tireSizePath(displaySize)}
      className="tsc-popular__view-all"
      onClick={trackViewAll}
    >
      {`Open ${displaySize} guide · ${result.totalModelCount} unique model${result.totalModelCount === 1 ? '' : 's'}`}
    </a>
  ) : guideAvailable ? (
    <a
      href={tireSizePath(displaySize)}
      className="tsc-popular__view-all"
      onClick={trackViewAll}
    >
      {`Open ${displaySize} tire guide`}
    </a>
  ) : null;

  const supportingLine = isDiameter
    ? 'Unique tire models for this exact size from TireReference’s product index.'
    : null;

  if (result.level === 'none') {
    return (
      <section
        className="tsc-popular cmp-lower-section"
        aria-label={`Popular tires available in ${displaySize}`}
      >
        <h2 className="tsc-section-title">Popular Tires Available in {displaySize}</h2>
        {isDiameter ? <p className="tsc-section-lede">{supportingLine}</p> : null}
        <p className="tsc-popular__fallback">
          Verified tire-model records are not yet indexed for {displaySize} in TireReference&apos;s
          database.
        </p>
        {fallbackLinks}
      </section>
    );
  }

  if (result.level === 'categories') {
    if (result.categories.length === 0) return null;
    return (
      <section
        className="tsc-popular cmp-lower-section"
        aria-label={`Tire types available in ${displaySize}`}
      >
        <div className="tsc-popular__header">
          <div className="tsc-popular__header-text">
            <h2 className="tsc-section-title">Tire Types Available in {displaySize}</h2>
            <p className="tsc-section-lede">
              {isDiameter
                ? supportingLine
                : 'Verified category coverage from exact-size records for this size.'}
            </p>
          </div>
          {viewAll}
        </div>
        <TscSectionCarousel trackVariant="popular" itemCount={result.categories.length}>
          {result.categories.map((category) => (
            <article key={category} className="tsc-popular__card tsc-popular__card--category">
              <div className="tsc-popular__image-wrap">
                <PopularTireImage category={category} />
              </div>
              <p
                className={`tsc-popular__category tsc-popular__category--${getCategoryBadgeTone(category)}`}
              >
                {category}
              </p>
              <h3 className="tsc-popular__name">{category} tires</h3>
              <p className="tsc-popular__meta">Verified category for {displaySize}</p>
            </article>
          ))}
        </TscSectionCarousel>
        <CatalogProvenanceNote compact={isDiameter} />
      </section>
    );
  }

  if (result.level === 'brands') {
    if (result.brands.length === 0) return null;
    return (
      <section
        className="tsc-popular cmp-lower-section"
        aria-label={`Brands offering ${displaySize} tires`}
      >
        <div className="tsc-popular__header">
          <div className="tsc-popular__header-text">
            <h2 className="tsc-section-title">Brands Offering {displaySize} Tires</h2>
            <p className="tsc-section-lede">
              {isDiameter
                ? supportingLine
                : 'Verified brands for this exact size. Specific model availability is not claimed.'}
            </p>
          </div>
          {viewAll}
        </div>
        <TscSectionCarousel
          trackVariant="popular"
          itemCount={Math.min(result.brands.length, cardLimit)}
        >
          {result.brands.slice(0, cardLimit).map((brand) => (
            <article key={brand} className="tsc-popular__card tsc-popular__card--brand">
              <div className="tsc-popular__brand-row">
                <PopularBrandMark brand={brand} />
              </div>
              <h3 className="tsc-popular__name">{brand}</h3>
              <p className="tsc-popular__meta">Offers tires in {displaySize}</p>
            </article>
          ))}
        </TscSectionCarousel>
        <CatalogProvenanceNote compact={isDiameter} />
      </section>
    );
  }

  if (result.models.length === 0) return null;

  const heading =
    featured != null
      ? `Other Tires Available in ${displaySize}`
      : `Popular Tires Available in ${displaySize}`;

  return (
    <section
      className={`tsc-popular cmp-lower-section${isDiameter ? ' tsc-popular--diameter' : ''}`}
      aria-label={`Popular tires available in ${displaySize}`}
    >
      {featured ? (
        <div className="tsc-popular__featured">
          <h2 className="tsc-section-title">Your Selected New Tire</h2>
          <div className="tsc-popular__featured-row" role="list">
            <VerifiedProductCard
              model={featured}
              sizeLabel={displaySize}
              detailHref={null}
              onTrack={() => undefined}
              featured
            />
          </div>
        </div>
      ) : null}

      <div className="tsc-popular__header">
        <div className="tsc-popular__header-text">
          <h2 className="tsc-section-title">{heading}</h2>
          {supportingLine ? <p className="tsc-section-lede">{supportingLine}</p> : null}
        </div>
        {viewAll}
      </div>

      <TscSectionCarousel trackVariant="popular" itemCount={result.models.length}>
        {result.models.map((model) => (
          <VerifiedProductCard
            key={`${model.brand}-${model.model}`}
            model={model}
            sizeLabel={displaySize}
            detailHref={null}
            onTrack={() => undefined}
          />
        ))}
      </TscSectionCarousel>

      <CatalogProvenanceNote compact={isDiameter} />
    </section>
  );
}
