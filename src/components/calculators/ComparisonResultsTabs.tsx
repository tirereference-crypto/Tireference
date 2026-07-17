import { useCallback, useId, useMemo, useState, type KeyboardEvent } from 'react';
import type { UnitSystem } from '../../lib/calculator-types';
import type { ComparisonDataSourceSummary } from '../../lib/comparison-data-sources';
import { buildComparisonDashboardSpecRows } from '../../lib/comparison-dashboard-spec-table';
import type { SpecTableRow } from '../../lib/tire-comparison-types';
import type { TireComparison, TireSpecs } from '../../lib/tire-math';
import { ComparisonVisualPanel } from './ComparisonVisualPanel';
import { TireSpecsSummaryTable } from './ComparisonReferenceWidgets';

type ResultsTab = 'visual' | 'spec';

export function ComparisonResultsTabs({
  specsA,
  specsB,
  sizeA,
  sizeB,
  specsC,
  sizeC,
  unitSystem,
  comparison,
  dataSources,
  hasThird = false,
  thirdColumnLabel = 'Third',
  extraRows,
}: {
  specsA: TireSpecs;
  specsB: TireSpecs;
  sizeA: string;
  sizeB: string;
  specsC?: TireSpecs;
  sizeC?: string;
  unitSystem: UnitSystem;
  comparison: TireComparison;
  dataSources: ComparisonDataSourceSummary;
  hasThird?: boolean;
  thirdColumnLabel?: string;
  /** Optional third-tire rows already merged (when present, prefer over rebuilt rows). */
  extraRows?: SpecTableRow[] | null;
}) {
  const baseId = useId().replace(/:/g, '');
  const visualTabId = `${baseId}-tab-visual`;
  const specTabId = `${baseId}-tab-spec`;
  const visualPanelId = `${baseId}-panel-visual`;
  const specPanelId = `${baseId}-panel-spec`;
  const [activeTab, setActiveTab] = useState<ResultsTab>('visual');

  const rows = useMemo(() => {
    if (extraRows && extraRows.length > 0 && hasThird) return extraRows;
    return buildComparisonDashboardSpecRows({
      specsA,
      specsB,
      comparison,
      unitSystem,
      dataSources,
    });
  }, [extraRows, hasThird, specsA, specsB, comparison, unitSystem, dataSources]);

  const onTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, tab: ResultsTab) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
        return;
      }
      event.preventDefault();
      const order: ResultsTab[] = ['visual', 'spec'];
      const index = order.indexOf(tab);
      let next = tab;
      if (event.key === 'ArrowRight') next = order[(index + 1) % order.length];
      if (event.key === 'ArrowLeft') next = order[(index - 1 + order.length) % order.length];
      if (event.key === 'Home') next = 'visual';
      if (event.key === 'End') next = 'spec';
      setActiveTab(next);
      const el = document.getElementById(next === 'visual' ? visualTabId : specTabId);
      el?.focus();
    },
    [specTabId, visualTabId],
  );

  return (
    <section className="cmp-viz-panel cmp-results-tabs cmp-card-level-primary" aria-label="Comparison visualization and specifications">
      <div className="cmp-viz-panel__toolbar">
        <div className="cmp-viz-panel__tabs" role="tablist" aria-label="Comparison views">
          <button
            type="button"
            role="tab"
            id={visualTabId}
            className={`cmp-viz-panel__tab${activeTab === 'visual' ? ' cmp-viz-panel__tab--active' : ''}`}
            aria-selected={activeTab === 'visual'}
            aria-controls={visualPanelId}
            tabIndex={activeTab === 'visual' ? 0 : -1}
            onClick={() => setActiveTab('visual')}
            onKeyDown={(e) => onTabKeyDown(e, 'visual')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <circle cx="8" cy="12" r="5" />
              <circle cx="16" cy="12" r="5" />
            </svg>
            Visual Comparison
          </button>
          <button
            type="button"
            role="tab"
            id={specTabId}
            className={`cmp-viz-panel__tab${activeTab === 'spec' ? ' cmp-viz-panel__tab--active' : ''}`}
            aria-selected={activeTab === 'spec'}
            aria-controls={specPanelId}
            tabIndex={activeTab === 'spec' ? 0 : -1}
            onClick={() => setActiveTab('spec')}
            onKeyDown={(e) => onTabKeyDown(e, 'spec')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
            </svg>
            Specification Table
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div
          role="tabpanel"
          id={visualPanelId}
          aria-labelledby={visualTabId}
          className="cmp-results-tabs__panel cmp-results-tabs__panel--visual"
        >
          <ComparisonVisualPanel
            specsA={specsA}
            specsB={specsB}
            sizeA={sizeA}
            sizeB={sizeB}
            specsC={specsC}
            sizeC={sizeC}
            unitSystem={unitSystem}
            embedded
          />
        </div>
      ) : (
        <div
          role="tabpanel"
          id={specPanelId}
          aria-labelledby={specTabId}
          className="cmp-results-tabs__panel cmp-results-tabs__panel--spec"
        >
          {dataSources.mode === 'mixed_source' ? (
            <p className="cmp-results-tabs__mixed" role="note">
              Mixed source: published values appear in dedicated rows. Headline differences stay
              nominal-versus-nominal and are not compared against published diameters without disclosure.
            </p>
          ) : null}
          <div className="cmp-viz-panel__table">
            <TireSpecsSummaryTable
              rows={rows}
              variant="panel"
              hasThird={hasThird}
              thirdColumnLabel={thirdColumnLabel}
              columnLabels={{ current: 'Tire 1', newTire: 'Tire 2' }}
              showSourceHints
            />
          </div>
        </div>
      )}
    </section>
  );
}
