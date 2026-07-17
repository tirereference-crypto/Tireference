import { useCallback, useEffect, useMemo, useRef } from 'react';
import '../../styles/calculator-comparison.css';
import '../../styles/tire-size-calculator-page.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { CALCULATOR_PATHS } from '../../lib/calculator-links';
import { COMPARISON_PAGE_INTRO_FALLBACK } from '../../lib/tire-comparison-insights';
import {
  ComparisonDecisionRail,
  ComparisonFeelPanel,
  ComparisonKpiRow,
} from './ComparisonDashboardSections';
import { ComparisonResultsTabs } from './ComparisonResultsTabs';
import { ComparisonBelowDashboard } from './ComparisonBelowDashboard';
import {
  ComparisonFaqSection,
  ComparisonPopularPairs,
  ComparisonRelatedCalculators,
  ComparisonTrustStrip,
} from './ComparisonLowerPage';
import { PopularTiresBySize } from './tire-size-calculator/PopularTiresBySize';
import { resolveComparisonDataSources } from '../../lib/comparison-data-sources';
import { buildDimensionalDecisionSupport } from '../../lib/comparison-decision-support';
import { getDatabaseProductionLabel } from '../../lib/size-production-status';
import { TireSizeValidationBanner } from './TireSizeValidationBanner';
import type { TireSizeInputFields } from '../../lib/calculator-types';
import type { TireSizeValidationResult } from '../../lib/tire-size-validation';
import {
  useTireSizeComparison,
  type UseTireSizeComparisonOptions,
} from './useTireSizeComparison';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';
import {
  CALCULATOR_NAMES,
  trackComparisonCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
  useUserInteractionFlag,
} from '../../hooks/useCalculatorAnalytics';
import { trackTireSizeSelected } from '../../lib/analytics';

function TireSegmentInputs({
  prefix,
  fields,
  paste,
  pastePlaceholder,
  accent,
  label,
  canonical,
  validation,
  onFieldChange,
  onPaste,
  onSelectSuggestion,
  onRemove,
}: {
  prefix: string;
  fields: TireSizeInputFields;
  paste: string;
  pastePlaceholder: string;
  accent: 'a' | 'b' | 'third';
  label: string;
  canonical: string | null;
  validation: TireSizeValidationResult | null;
  onFieldChange: (key: keyof TireSizeInputFields, value: string) => void;
  onPaste: (value: string) => void;
  onSelectSuggestion: (size: string) => void;
  onRemove?: () => void;
}) {
  const construction = 'R';
  const productionLabel = canonical ? getDatabaseProductionLabel(canonical) : null;
  const showProductionUnavailable = Boolean(canonical) && !productionLabel;
  const hideStatusBadge =
    Boolean(productionLabel || showProductionUnavailable) &&
    Boolean(validation) &&
    (validation!.status === 'common' || validation!.status === 'uncommon');
  const invalid =
    Boolean(validation) &&
    (validation!.status === 'invalid' || validation!.status === 'custom');

  return (
    <section className={`cmp-tire-input-block cmp-tire-input-block--${accent}`}>
      <div className="cmp-tire-input-block__head">
        <span className={`cmp-tire-input-block__label cmp-tire-input-block__label--${accent}`}>{label}</span>
        {onRemove ? (
          <button
            type="button"
            className="cmp-tire-input-block__remove"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
          >
            Remove
          </button>
        ) : null}
      </div>

      <div
        className="cmp-tire-input-block__grid"
        role="group"
        aria-label={`${label} dimensions`}
        aria-invalid={invalid || undefined}
      >
        <div className="cmp-tire-input-block__field">
          <label htmlFor={`${prefix}-width`}>Width</label>
          <input
            id={`${prefix}-width`}
            inputMode="decimal"
            value={fields.width}
            onChange={(e) => onFieldChange('width', e.target.value)}
            autoComplete="off"
            aria-invalid={invalid || undefined}
          />
        </div>
        <div className="cmp-tire-input-block__field">
          <label htmlFor={`${prefix}-aspect`}>Aspect ratio</label>
          <input
            id={`${prefix}-aspect`}
            inputMode="decimal"
            value={fields.aspectRatio}
            onChange={(e) => onFieldChange('aspectRatio', e.target.value)}
            autoComplete="off"
            aria-invalid={invalid || undefined}
          />
        </div>
        <div className="cmp-tire-input-block__field">
          <label htmlFor={`${prefix}-construction`}>Construction</label>
          <input
            id={`${prefix}-construction`}
            value={construction}
            readOnly
            tabIndex={-1}
            aria-readonly="true"
          />
        </div>
        <div className="cmp-tire-input-block__field">
          <label htmlFor={`${prefix}-wheel`}>
            Wheel diameter <span className="cmp-tire-input-block__unit">in</span>
          </label>
          <input
            id={`${prefix}-wheel`}
            inputMode="decimal"
            value={fields.wheelDiameter}
            onChange={(e) => onFieldChange('wheelDiameter', e.target.value)}
            autoComplete="off"
            aria-invalid={invalid || undefined}
          />
        </div>
      </div>

      <details className="cmp-paste-disclosure">
        <summary>Paste a complete tire size</summary>
        <input
          className="cmp-tire-input-block__paste"
          value={paste}
          onChange={(e) => onPaste(e.target.value)}
          placeholder={pastePlaceholder}
          aria-label={`${label} complete size`}
        />
      </details>

      {canonical ? (
        <div className={`cmp-tire-input-block__meta cmp-tire-input-block__meta--${accent}`}>
          <p className="cmp-tire-input-block__canonical">{canonical}</p>
          {productionLabel ? (
            <p className="cmp-prod-status">{productionLabel}</p>
          ) : (
            <p className="cmp-prod-status cmp-prod-status--unknown">Production status unavailable</p>
          )}
        </div>
      ) : null}

      {validation ? (
        <TireSizeValidationBanner
          validation={validation}
          onSelectSuggestion={onSelectSuggestion}
          compact
          hideStatusBadge={hideStatusBadge}
          hideNormalized={Boolean(canonical)}
        />
      ) : null}
    </section>
  );
}

export default function PremiumTireSizeComparison(props: UseTireSizeComparisonOptions = {}) {
  const {
    currentFields,
    newFields,
    currentPaste,
    newPaste,
    vehicleSpeed,
    unitSystem,
    message,
    comparison,
    insights,
    specsA,
    specsB,
    specsC,
    currentSizeLabel,
    newSizeLabel,
    thirdSizeLabel,
    hasThirdTire,
    specRows,
    updateCurrentField,
    updateNewField,
    handleCurrentPaste,
    handleNewPaste,
    selectCurrentTireSize,
    selectNewTireSize,
    swapTires,
    currentValidation,
    newValidation,
    setVehicleSpeed,
    setUnitSystem,
  } = useTireSizeComparison(props);

  const formRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const metric = unitSystem === 'metric';
  const speedUnit = metric ? 'km/h' : 'mph';

  useCalculatorStarted(CALCULATOR_NAMES.tireComparison);
  const { markInteracted, interacted } = useUserInteractionFlag();
  const dedupTracker = useAnalyticsDedupTracker();

  const trackComparisonIfReady = useCallback(() => {
    if (message.status !== 'ready' || !currentSizeLabel || !newSizeLabel || !comparison) return;
    const signature = `${currentSizeLabel}|${newSizeLabel}|${vehicleSpeed}`;
    trackComparisonCompletedOnce(dedupTracker, signature, {
      calculator_name: CALCULATOR_NAMES.tireComparison,
      current_tire_size: currentSizeLabel,
      new_tire_size: newSizeLabel,
      diameter_difference_percent: comparison.diameterDiffPercent,
    });
  }, [
    message.status,
    currentSizeLabel,
    newSizeLabel,
    comparison,
    vehicleSpeed,
    dedupTracker,
  ]);

  useEffect(() => {
    if (!interacted) return;
    trackComparisonIfReady();
  }, [interacted, trackComparisonIfReady]);

  const handleSelectCurrentTireSize = useCallback(
    (size: string) => {
      markInteracted();
      selectCurrentTireSize(size);
      trackTireSizeSelected(size, CALCULATOR_NAMES.tireComparison);
    },
    [markInteracted, selectCurrentTireSize],
  );

  const handleSelectNewTireSize = useCallback(
    (size: string) => {
      markInteracted();
      selectNewTireSize(size);
      trackTireSizeSelected(size, CALCULATOR_NAMES.tireComparison);
    },
    [markInteracted, selectNewTireSize],
  );

  useEffect(() => {
    if (!insights) return;
    document.title = insights.seo.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', insights.seo.metaDescription);
  }, [insights]);

  const scrollToResults = useCallback(() => {
    markInteracted();
    trackComparisonIfReady();
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [markInteracted, trackComparisonIfReady]);

  const handleSelectAlternativeSize = useCallback(
    (size: string) => {
      handleSelectNewTireSize(size);
      // Keep the enter-sizes card in view so the filled New Tire value is obvious.
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [handleSelectNewTireSize],
  );

  const pageIntro = COMPARISON_PAGE_INTRO_FALLBACK;

  const ready = message.status === 'ready' && specsA && specsB && currentSizeLabel && newSizeLabel && insights;
  const dataSources = useMemo(
    () =>
      currentSizeLabel && newSizeLabel
        ? resolveComparisonDataSources({ sizeA: currentSizeLabel, sizeB: newSizeLabel })
        : null,
    [currentSizeLabel, newSizeLabel],
  );
  const decisionSupport = useMemo(() => {
    if (!comparison || !specsA || !specsB || !dataSources) return null;
    return buildDimensionalDecisionSupport({
      comparison,
      specsA,
      specsB,
      dataSources,
    });
  }, [comparison, specsA, specsB, dataSources]);
  const breadcrumbLabel = ready
    ? hasThirdTire
      ? `${currentSizeLabel} vs ${newSizeLabel} vs ${thirdSizeLabel}`
      : `${currentSizeLabel} vs ${newSizeLabel}`
    : 'Compare';
  const stickyVisible = useStickyAnalyzeButton(formRef, resultsRef, { resultsReady: Boolean(ready) });
  useSingleOpenDetails(faqRef, [ready, insights?.seo.faqs.length ?? 0]);

  return (
    <div className="cmp-page tl-has-sticky-analyze">
      <div className="cmp-shell">
        <div className="cmp-toolbar">
          <nav className="cmp-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href={CALCULATOR_PATHS.tireComparison}>Tire Compare</a>
            <span>/</span>
            <span>{breadcrumbLabel}</span>
          </nav>
        </div>

        <header className="cmp-page-header cmp-page-header--compact cmp-page-header--full">
          <h1 className="cmp-page-header__title">Tire Size Comparison Calculator</h1>
          <p className="cmp-page-header__intro">{pageIntro.sentence}</p>
        </header>

        <div className="cmp-layout cmp-dashboard">
          <aside ref={formRef} className="cmp-sidebar-left" aria-label="Comparison inputs">
            <div className="cmp-panel cmp-enter-card cmp-card-level-primary">
              <div className="cmp-enter-card__heading">
                <h2 className="cmp-enter-card__title">Enter Tire Sizes</h2>
                <button
                  type="button"
                  className="cmp-swap-btn"
                  onClick={() => {
                    markInteracted();
                    swapTires();
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Swap Tires
                </button>
              </div>

              <div className="cmp-enter-card__tires">
                <TireSegmentInputs
                  prefix="current"
                  fields={currentFields}
                  paste={currentPaste}
                  pastePlaceholder="225/45R17"
                  accent="a"
                  label="Original Tire"
                  canonical={currentSizeLabel}
                  validation={currentValidation}
                  onFieldChange={(key, value) => {
                    markInteracted();
                    updateCurrentField(key, value);
                  }}
                  onPaste={(value) => {
                    markInteracted();
                    handleCurrentPaste(value);
                  }}
                  onSelectSuggestion={handleSelectCurrentTireSize}
                />

                <TireSegmentInputs
                  prefix="new"
                  fields={newFields}
                  paste={newPaste}
                  pastePlaceholder="235/40R18"
                  accent="b"
                  label="New Tire"
                  canonical={newSizeLabel}
                  validation={newValidation}
                  onFieldChange={(key, value) => {
                    markInteracted();
                    updateNewField(key, value);
                  }}
                  onPaste={(value) => {
                    markInteracted();
                    handleNewPaste(value);
                  }}
                  onSelectSuggestion={handleSelectNewTireSize}
                />
              </div>

              <div className="cmp-enter-card__actions">
                <button type="button" className="cmp-compare-btn" onClick={scrollToResults}>
                  Compare Tires
                </button>

                <div className="cmp-enter-card__settings" role="group" aria-label="Comparison settings">
                  <div className="cmp-enter-card__units">
                    <span className="cmp-enter-card__settings-label" id="cmp-units-label">
                      Units
                    </span>
                    <div className="cmp-segment" role="group" aria-labelledby="cmp-units-label">
                      <button
                        type="button"
                        className={`cmp-segment__btn ${unitSystem === 'imperial' ? 'cmp-segment__btn--active' : ''}`}
                        onClick={() => setUnitSystem('imperial')}
                      >
                        Inches
                      </button>
                      <button
                        type="button"
                        className={`cmp-segment__btn ${unitSystem === 'metric' ? 'cmp-segment__btn--active' : ''}`}
                        onClick={() => setUnitSystem('metric')}
                      >
                        Metric
                      </button>
                    </div>
                  </div>
                  <div className="cmp-field cmp-field--speed">
                    <label htmlFor="cmp-speed">Vehicle speed ({speedUnit})</label>
                    <input
                      id="cmp-speed"
                      type="number"
                      min={1}
                      value={vehicleSpeed}
                      onChange={(e) => {
                        markInteracted();
                        setVehicleSpeed(e.target.value);
                      }}
                    />
                    <p className="cmp-enter-card__hint">Used for the speedometer example.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="cmp-comparison-workspace">
            {!ready ? (
              <div className="cmp-empty" role="status" aria-live="polite">
                {message.text}
              </div>
            ) : (
              <>
                <div
                  ref={resultsRef}
                  className={`cmp-summary-bar cmp-card-level-secondary${hasThirdTire ? ' cmp-summary-bar--triple' : ''}`}
                  aria-label="Comparison identity"
                >
                  <div className="cmp-summary-bar__pair">
                    <div className="cmp-summary-bar__tire cmp-summary-bar__tire--current">
                      <span className="cmp-summary-bar__role">Original</span>
                      <span className="cmp-summary-bar__size cmp-summary-bar__size--a">
                        {currentSizeLabel}
                      </span>
                    </div>
                    <span className="cmp-summary-bar__vs" aria-hidden="true">
                      →
                    </span>
                    <div className="cmp-summary-bar__tire cmp-summary-bar__tire--new">
                      <span className="cmp-summary-bar__role">New</span>
                      <span className="cmp-summary-bar__size cmp-summary-bar__size--b">
                        {newSizeLabel}
                      </span>
                    </div>
                    {hasThirdTire && thirdSizeLabel ? (
                      <>
                        <span className="cmp-summary-bar__vs" aria-hidden="true">
                          ·
                        </span>
                        <div className="cmp-summary-bar__tire cmp-summary-bar__tire--third">
                          <span className="cmp-summary-bar__role">Third</span>
                          <span className="cmp-summary-bar__size">{thirdSizeLabel}</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="cmp-summary-bar__chips">
                    {insights.summaryChips.map((chip) => (
                      <span
                        key={chip.id}
                        className={`cmp-summary-chip cmp-summary-chip--${chip.tone}`}
                      >
                        <span className="cmp-summary-chip__label">{chip.label}</span>
                        <span className="cmp-summary-chip__value">{chip.value}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <ComparisonKpiRow cards={insights.kpiCards} />

                <div className="cmp-comparison-stage">
                  <div className="cmp-visual-stage">
                    {dataSources && comparison ? (
                      <ComparisonResultsTabs
                        specsA={specsA}
                        specsB={specsB}
                        sizeA={currentSizeLabel!}
                        sizeB={newSizeLabel!}
                        specsC={hasThirdTire && specsC ? specsC : undefined}
                        sizeC={hasThirdTire ? thirdSizeLabel ?? undefined : undefined}
                        unitSystem={unitSystem}
                        comparison={comparison}
                        dataSources={dataSources}
                        hasThird={hasThirdTire}
                        extraRows={hasThirdTire ? specRows : null}
                      />
                    ) : null}

                    <p className="cmp-source-note" role="note">
                      {dataSources?.note}
                    </p>

                    {decisionSupport ? <ComparisonFeelPanel decision={decisionSupport} /> : null}
                  </div>

                  <aside className="cmp-sidebar-right" aria-label="Decision support">
                    {decisionSupport ? (
                      <ComparisonDecisionRail decision={decisionSupport} />
                    ) : (
                      <div className="cmp-panel cmp-card-level-primary">
                        <p className="cmp-sidebar-block__title">Dimensional Verdict</p>
                        <p className="cmp-empty-rail">
                          Enter two tire sizes to see the verdict and fitment checks.
                        </p>
                      </div>
                    )}
                  </aside>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="cmp-fullwidth">
          {ready && comparison && specsA && specsB && currentSizeLabel && newSizeLabel && insights ? (
            <>
              <ComparisonBelowDashboard
                sizeA={currentSizeLabel}
                sizeB={newSizeLabel}
                specsA={specsA}
                specsB={specsB}
                comparison={comparison}
                unitSystem={unitSystem}
                onSelectAlternativeSize={handleSelectAlternativeSize}
              />

              <PopularTiresBySize
                sizeLabel={newSizeLabel}
                calculatorName={CALCULATOR_NAMES.tireComparison}
                context="comparison"
              />
              <ComparisonPopularPairs
                links={insights.popularComparisons}
                viewAllHref={CALCULATOR_PATHS.tireComparison}
              />
              <div ref={faqRef}>
                <ComparisonFaqSection faqs={insights.seo.faqs} />
              </div>
            </>
          ) : null}

          <ComparisonTrustStrip sizeA={currentSizeLabel} sizeB={newSizeLabel} />
          <ComparisonRelatedCalculators />
        </div>
      </div>

      <StickyAnalyzeButton visible={stickyVisible} label="Compare Tires" onClick={scrollToResults} />
    </div>
  );
}
