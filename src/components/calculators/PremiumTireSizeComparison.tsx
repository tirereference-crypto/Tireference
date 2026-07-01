import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/calculator-comparison.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { getRelatedCalculatorLinks } from '../../lib/calculator-links';
import {
  buildComparisonPageIntro,
  COMPARISON_PAGE_INTRO_FALLBACK,
  type PersonalityCard,
  type QuickComparisonVerdict,
  type UpgradePathCard,
  type WillThisFitRow,
} from '../../lib/tire-comparison-insights';
import { ComparisonVisualPanel } from './ComparisonVisualPanel';
import { TireSizeValidationBanner } from './TireSizeValidationBanner';
import {
  FuelEconomyGauges,
  PerformanceDrivingCard,
  RpmVsSpeedChart,
  TireSpecsSummaryTable,
} from './ComparisonReferenceWidgets';
import { useTireSizeComparison,
  type UseTireSizeComparisonOptions,
} from './useTireSizeComparison';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';

const CALCULATOR_LINKS = getRelatedCalculatorLinks('/tire-size-comparison');

const GUIDE_LINKS = [
  { label: 'Understanding Tire Sizes', href: '/tire-size-calculator#understanding' },
  { label: 'How Plus Sizing Works', href: '/tire-size-calculator#plus-size' },
  { label: 'Speedometer Accuracy Guide', href: '/tire-size-calculator#speedometer' },
];

function UpgradePathCardView({ card }: { card: UpgradePathCard }) {
  const content = (
    <>
      <span className="cmp-upgrade-paths__size">{card.size}</span>
      <span className="cmp-upgrade-paths__tier">{card.tierLabel}</span>
      <span className="cmp-upgrade-paths__diff">{card.diameterDiff}</span>
      {card.fitmentDifficulty && (
        <span className={`cmp-upgrade-paths__difficulty cmp-upgrade-paths__difficulty--${card.fitmentDifficulty === 'Easy Fit' ? 'easy' : card.fitmentDifficulty === 'Minor Checks Needed' ? 'check' : 'verify'}`}>
          {card.fitmentDifficulty}
        </span>
      )}
    </>
  );

  if (card.href) {
    return (
      <a className="cmp-upgrade-paths__card cmp-upgrade-paths__card--link" href={card.href}>
        {content}
      </a>
    );
  }

  return (
    <div className="cmp-upgrade-paths__card cmp-upgrade-paths__card--current">
      {content}
    </div>
  );
}

function UpgradePathsSection({ cards }: { cards: UpgradePathCard[] }) {
  return (
    <section className="cmp-card cmp-card--half cmp-upgrade-paths" aria-label="Upgrade paths">
      <h2 className="cmp-card__title">Upgrade Paths</h2>
      <div className="cmp-upgrade-paths__flow">
        {cards.map((card, index) => (
          <div key={card.id} className="cmp-upgrade-paths__segment">
            {index > 0 && <span className="cmp-upgrade-paths__arrow" aria-hidden="true">→</span>}
            <UpgradePathCardView card={card} />
          </div>
        ))}
      </div>
    </section>
  );
}

function WillThisFitList({ rows }: { rows: WillThisFitRow[] }) {
  return (
    <ul className="cmp-will-fit">
      {rows.map((row) => (
        <li key={row.id} className="cmp-will-fit__row">
          <span className="cmp-will-fit__name">{row.label}</span>
          <span className={`cmp-will-fit__badge cmp-will-fit__badge--${row.status}`}>
            <span className="cmp-will-fit__icon" aria-hidden="true">
              {row.status === 'pass' ? '✓' : row.status === 'warning' ? '⚠' : '✕'}
            </span>
            {row.statusLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}

function QuickVerdictCard({ verdict }: { verdict: QuickComparisonVerdict }) {
  return (
    <section
      className={`cmp-panel cmp-verdict cmp-verdict--${verdict.tone}`}
      aria-label="Quick comparison verdict"
    >
      <p className="cmp-verdict__heading">Quick Comparison Verdict</p>

      <div className={`cmp-verdict__badge cmp-verdict__badge--${verdict.tone}`}>
        <span className="cmp-verdict__indicator" aria-hidden="true">{verdict.indicator}</span>
        <p className="cmp-verdict__title">{verdict.label}</p>
      </div>

      <p className="cmp-verdict__score">
        Fitment Score: <strong>{verdict.score.toFixed(1)}</strong> / 10
      </p>

      {verdict.benefits.length > 0 && (
        <ul className="cmp-verdict__list cmp-verdict__list--benefits">
          {verdict.benefits.map((benefit) => (
            <li key={benefit}>
              <span className="cmp-verdict__icon cmp-verdict__icon--benefit" aria-hidden="true">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      {verdict.considerations.length > 0 && (
        <ul className="cmp-verdict__list cmp-verdict__list--considerations">
          {verdict.considerations.map((item) => (
            <li key={item}>
              <span className="cmp-verdict__icon cmp-verdict__icon--consideration" aria-hidden="true">⚠</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {verdict.bestFor.length > 0 && (
        <div className="cmp-verdict__best-for">
          <p className="cmp-verdict__best-for-label">Best For</p>
          <p className="cmp-verdict__best-for-value">{verdict.bestFor.join(', ')}</p>
        </div>
      )}
    </section>
  );
}

function PersonalityCards({ cards }: { cards: PersonalityCard[] }) {
  const ordered = [...cards].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  return (
    <div className="cmp-personality-cards">
      {ordered.map((card) => (
        <div
          key={card.id}
          className={`cmp-personality-card ${card.isPrimary ? 'cmp-personality-card--primary' : ''}`}
        >
          <p className="cmp-personality-card__title">{card.title}</p>
          <ul className="cmp-personality-card__list">
            {card.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
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
    insights,
    specsA,
    specsB,
    currentSizeLabel,
    newSizeLabel,
    updateCurrentField,
    updateNewField,
    handleCurrentPaste,
    handleNewPaste,
    selectCurrentTireSize,
    selectNewTireSize,
    currentValidation,
    newValidation,
    setVehicleSpeed,
    setUnitSystem,
  } = useTireSizeComparison(props);

  const [activeTab, setActiveTab] = useState<'visual' | 'specs'>('visual');
  const formRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const metric = unitSystem === 'metric';
  const speedUnit = metric ? 'km/h' : 'mph';

  useEffect(() => {
    if (!insights) return;
    document.title = insights.seo.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', insights.seo.metaDescription);
  }, [insights]);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const displaySizeA = currentSizeLabel ?? (currentPaste.trim() || null);
  const displaySizeB = newSizeLabel ?? (newPaste.trim() || null);
  const pageIntro =
    displaySizeA && displaySizeB
      ? buildComparisonPageIntro(displaySizeA, displaySizeB)
      : COMPARISON_PAGE_INTRO_FALLBACK;

  const ready = message.status === 'ready' && specsA && specsB && currentSizeLabel && newSizeLabel && insights;
  const breadcrumbLabel = ready ? `${currentSizeLabel} vs ${newSizeLabel}` : 'Compare';
  const stickyVisible = useStickyAnalyzeButton(formRef, resultsRef, { resultsReady: Boolean(ready) });
  useSingleOpenDetails(faqRef);

  return (
    <div className="cmp-page tl-has-sticky-analyze">
      <div className="cmp-shell">
        <div className="cmp-toolbar">
          <nav className="cmp-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/tire-size-comparison">Tire Compare</a>
            <span>/</span>
            <span>{breadcrumbLabel}</span>
          </nav>
        </div>

        <div className="cmp-layout">
          <aside ref={formRef} className="cmp-sidebar-left" aria-label="Comparison inputs">
            <div className="cmp-panel cmp-enter-card">
              <h2 className="cmp-enter-card__title">Enter Tire Sizes</h2>

              <div className="cmp-tire-input-block">
                <div className="cmp-tire-input-block__head">
                  <span className="cmp-tire-input-block__label">Current Tire</span>
                  <span className="cmp-tire-input-block__badge cmp-tire-input-block__badge--original">Original</span>
                </div>
                <div className="cmp-tire-input-block__row">
                  {(['width', 'aspectRatio', 'wheelDiameter'] as const).map((key) => (
                    <div key={key} className="cmp-tire-input-block__field">
                      <label htmlFor={`current-${key}`}>{key === 'width' ? 'Width' : key === 'aspectRatio' ? 'Aspect' : 'Rim'}</label>
                      <input id={`current-${key}`} value={currentFields[key]} onChange={(e) => updateCurrentField(key, e.target.value)} />
                    </div>
                  ))}
                </div>
                <input className="cmp-tire-input-block__paste" value={currentPaste} onChange={(e) => handleCurrentPaste(e.target.value)} placeholder="225/45R17" aria-label="Current tire size paste" />
                <TireSizeValidationBanner
                  validation={currentValidation}
                  onSelectSuggestion={selectCurrentTireSize}
                />
              </div>

              <div className="cmp-tire-input-block">
                <div className="cmp-tire-input-block__head">
                  <span className="cmp-tire-input-block__label">New Tire</span>
                  <span className="cmp-tire-input-block__badge cmp-tire-input-block__badge--new">New</span>
                </div>
                <div className="cmp-tire-input-block__row">
                  {(['width', 'aspectRatio', 'wheelDiameter'] as const).map((key) => (
                    <div key={key} className="cmp-tire-input-block__field">
                      <label htmlFor={`new-${key}`}>{key === 'width' ? 'Width' : key === 'aspectRatio' ? 'Aspect' : 'Rim'}</label>
                      <input id={`new-${key}`} value={newFields[key]} onChange={(e) => updateNewField(key, e.target.value)} />
                    </div>
                  ))}
                </div>
                <input className="cmp-tire-input-block__paste" value={newPaste} onChange={(e) => handleNewPaste(e.target.value)} placeholder="235/40R18" aria-label="New tire size paste" />
                <TireSizeValidationBanner
                  validation={newValidation}
                  onSelectSuggestion={selectNewTireSize}
                />
              </div>

              <button type="button" className="cmp-compare-btn" onClick={scrollToResults}>Compare Now</button>

              <div className="cmp-enter-card__settings">
                <div className="cmp-segment" role="group" aria-label="Unit system">
                  <button type="button" className={`cmp-segment__btn ${unitSystem === 'metric' ? 'cmp-segment__btn--active' : ''}`} onClick={() => setUnitSystem('metric')}>Metric</button>
                  <button type="button" className={`cmp-segment__btn ${unitSystem === 'imperial' ? 'cmp-segment__btn--active' : ''}`} onClick={() => setUnitSystem('imperial')}>Inches</button>
                </div>
                <div className="cmp-field">
                  <label htmlFor="cmp-speed">Vehicle Speed ({speedUnit})</label>
                  <input id="cmp-speed" type="number" min={1} value={vehicleSpeed} onChange={(e) => setVehicleSpeed(e.target.value)} />
                </div>
              </div>
            </div>

          </aside>

          <div className="cmp-main">
            <header className="cmp-page-header">
              <div className="cmp-page-header__top">
                <h1 className="cmp-page-header__title">Tire Size Comparison Calculator</h1>
                <span className="cmp-verified-badge">Fitment Analysis</span>
              </div>
              <p className="cmp-page-header__intro">{pageIntro.sentence}</p>
            </header>

            {!ready ? (
              <div className="cmp-empty">{message.text}</div>
            ) : (
              <>
                <div ref={resultsRef} className="cmp-results-anchor" aria-hidden="true" />
                <div className="cmp-summary-bar" aria-label="Comparison summary">
                  <div className="cmp-summary-bar__tire cmp-summary-bar__tire--current">
                    <span className="cmp-summary-bar__size">{currentSizeLabel}</span>
                    <span className="cmp-summary-bar__role">Current Tire</span>
                  </div>
                  <span className="cmp-summary-bar__arrow" aria-hidden="true">→</span>
                  <div className="cmp-summary-bar__tire cmp-summary-bar__tire--new">
                    <span className="cmp-summary-bar__size">{newSizeLabel}</span>
                    <span className="cmp-summary-bar__role">New Tire</span>
                  </div>
                  <div className="cmp-summary-bar__chips">
                    {insights.summaryChips.map((chip) => (
                      <span
                        key={chip.id}
                        className={`cmp-summary-chip cmp-summary-chip--${chip.tone}`}
                      >
                        {chip.label}: {chip.value}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="cmp-kpi-row" aria-label="At a glance">
                  {insights.kpiCards.map((card) => (
                    <div key={card.id} className="cmp-kpi">
                      <p className="cmp-kpi__label">{card.label}</p>
                      <p className={`cmp-kpi__amount cmp-kpi__amount--${card.tone}`}>{card.diffAmount}</p>
                      <p className={`cmp-kpi__pct cmp-kpi__pct--${card.tone}`}>{card.diffPercent}</p>
                    </div>
                  ))}
                </div>

                <ComparisonVisualPanel
                  specsA={specsA}
                  specsB={specsB}
                  sizeA={currentSizeLabel}
                  sizeB={newSizeLabel}
                  specRows={insights.specRows}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  unitSystem={unitSystem}
                />

                <article className="cmp-seo-block cmp-seo-block--understanding">
                  <h2>Understanding This Tire Size Difference</h2>
                  <p>{insights.understandingDifference}</p>
                </article>

                <section className="cmp-card cmp-card--perf-impact" aria-label="Performance and driving impact">
                  <h2 className="cmp-card__title">Performance &amp; Driving Impact</h2>
                  <PerformanceDrivingCard cards={insights.performanceCards} />
                </section>

                <div className="cmp-insights-row">
                  <section className="cmp-card cmp-fuel-panel" aria-label="Fuel economy impact">
                    <h2 className="cmp-card__title">Fuel Economy Impact</h2>
                    <p className="cmp-fuel-panel__sub">Based on {vehicleSpeed} {speedUnit} average</p>
                    <FuelEconomyGauges specsA={specsA} specsB={specsB} />
                  </section>

                  <section className="cmp-card cmp-insights-split" aria-label="RPM versus speed and tire specs">
                    <div className="cmp-insights-split__chart">
                      <RpmVsSpeedChart
                        specsA={specsA}
                        specsB={specsB}
                        sizeA={currentSizeLabel}
                        sizeB={newSizeLabel}
                        referenceSpeed={Number(vehicleSpeed) || 60}
                        unitSystem={unitSystem}
                      />
                    </div>
                    <div className="cmp-insights-split__divider" aria-hidden="true" />
                    <div className="cmp-insights-split__specs">
                      <h2 className="cmp-card__title">Tire Specs Summary</h2>
                      <TireSpecsSummaryTable rows={insights.specRows} />
                    </div>
                  </section>
                </div>

                <div className={`cmp-bottom-row ${insights.upgradePaths ? '' : 'cmp-bottom-row--single'}`}>
                  <section className={`cmp-card ${insights.upgradePaths ? 'cmp-card--half' : ''}`} aria-label="Things to consider">
                    <h2 className="cmp-card__title">Things to Consider</h2>
                    <ul className="cmp-consider-list">
                      {insights.thingsToConsider.map((item) => (
                        <li key={item} className="cmp-consider-item">
                          <span className="cmp-consider-item__icon" aria-hidden="true">
                            <svg viewBox="0 0 16 16" fill="none">
                              <path d="M3.75 8.25l2.75 2.75 5.75-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="cmp-consider-item__text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  {insights.upgradePaths && (
                    <UpgradePathsSection cards={insights.upgradePaths.cards} />
                  )}
                </div>

                {(insights.vehicleCompatibility.current.length > 0 ||
                  insights.vehicleCompatibility.newTire.length > 0) && (
                  <section className="cmp-seo-block cmp-vehicle-compat">
                    <h2>Common Vehicles Using These Tire Sizes</h2>
                    <div className="cmp-vehicle-compat__grid">
                      {insights.vehicleCompatibility.current.length > 0 && (
                        <div className="cmp-vehicle-compat__col">
                          <h3>Vehicles commonly using {currentSizeLabel}</h3>
                          <ul className="cmp-vehicle-compat__list">
                            {insights.vehicleCompatibility.current.map((vehicle) => (
                              <li key={`${vehicle.label}-${vehicle.detail}`}>
                                <span className="cmp-vehicle-compat__name">{vehicle.label}</span>
                                {vehicle.detail && (
                                  <span className="cmp-vehicle-compat__detail">{vehicle.detail}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.vehicleCompatibility.newTire.length > 0 && (
                        <div className="cmp-vehicle-compat__col">
                          <h3>Vehicles commonly using {newSizeLabel}</h3>
                          <ul className="cmp-vehicle-compat__list">
                            {insights.vehicleCompatibility.newTire.map((vehicle) => (
                              <li key={`${vehicle.label}-${vehicle.detail}`}>
                                <span className="cmp-vehicle-compat__name">{vehicle.label}</span>
                                {vehicle.detail && (
                                  <span className="cmp-vehicle-compat__detail">{vehicle.detail}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <article className="cmp-seo-block">
                  <h2>What Changes When You Switch From {currentSizeLabel} To {newSizeLabel}</h2>
                  <p>{insights.seo.whatChanges}</p>
                </article>
                <article className="cmp-seo-block">
                  <h2>Is {newSizeLabel} A Good Upgrade From {currentSizeLabel}?</h2>
                  <h3>{insights.seo.isGoodUpgrade.headline}</h3>
                  <p>{insights.seo.isGoodUpgrade.body}</p>
                </article>
                <article className="cmp-seo-block">
                  <h2>Who Should Choose This Tire Size?</h2>
                  <p>{insights.seo.whoShouldChoose}</p>
                </article>
                <section className="cmp-seo-block">
                  <h2>Frequently Asked Questions</h2>
                  <div className="cmp-faq" ref={faqRef}>
                    {insights.seo.faqs.map((faq) => (
                      <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="cmp-sidebar-right" aria-label="Comparison guides">
            {ready && insights && (
              <>
                <QuickVerdictCard verdict={insights.quickVerdict} />

                <div className="cmp-panel">
                  <p className="cmp-sidebar-block__title">Upgrade Personality</p>
                  <PersonalityCards cards={insights.personalityCards} />
                </div>

                <div className="cmp-panel">
                  <p className="cmp-sidebar-block__title">Will This Fit?</p>
                  <WillThisFitList rows={insights.willThisFitRows} />
                </div>

                {insights.popularComparisons.length > 0 && (
                  <div className="cmp-panel">
                    <p className="cmp-sidebar-block__title">Popular Comparisons</p>
                    <ul className="cmp-link-list">
                      {insights.popularComparisons.map((link) => (
                        <li key={link.href}>
                          <a href={link.href}>{link.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="cmp-panel">
                  <p className="cmp-sidebar-block__title">Calculator Network</p>
                  <ul className="cmp-link-list">
                    {CALCULATOR_LINKS.map((link) => (<li key={link.href}><a href={link.href}>{link.label}</a></li>))}
                  </ul>
                </div>

                <div className="cmp-panel">
                  <p className="cmp-sidebar-block__title">Helpful Tire Guides</p>
                  <ul className="cmp-link-list">
                    {GUIDE_LINKS.map((link) => (<li key={link.href}><a href={link.href}>{link.label}</a></li>))}
                  </ul>
                </div>

              </>
            )}
          </aside>
        </div>
      </div>

      <StickyAnalyzeButton visible={stickyVisible} label="Compare Now" onClick={scrollToResults} />
    </div>
  );
}
