import type { DimensionalDecisionSupport, DecisionFitmentRow } from '../../lib/comparison-decision-support';
import type { ComparisonDataSourceSummary } from '../../lib/comparison-data-sources';
import { formulaSourceLabel } from '../../lib/comparison-data-sources';
import type { KpiCard } from '../../lib/tire-comparison-insights';
import { useMemo } from 'react';

function formatPublishedIn(value: number | null, unit: string): string {
  if (value == null) return '—';
  return `${value.toFixed(2)}${unit}`;
}

/** Separate panel for manufacturer-published fields — never replaces headline nominal deltas. */
export function ComparisonPublishedSpecsPanel({
  summary,
}: {
  summary: ComparisonDataSourceSummary;
}) {
  if (!summary.publishedA && !summary.publishedB) return null;

  const rows: Array<{ label: string; a: string; b: string }> = [
    {
      label: 'Published diameter',
      a: formatPublishedIn(summary.publishedA?.overallDiameterIn ?? null, '"'),
      b: formatPublishedIn(summary.publishedB?.overallDiameterIn ?? null, '"'),
    },
    {
      label: 'Published section width',
      a: formatPublishedIn(summary.publishedA?.sectionWidthIn ?? null, '"'),
      b: formatPublishedIn(summary.publishedB?.sectionWidthIn ?? null, '"'),
    },
    {
      label: 'Published revs/mile',
      a: summary.publishedA?.revsPerMile != null ? String(Math.round(summary.publishedA.revsPerMile)) : '—',
      b: summary.publishedB?.revsPerMile != null ? String(Math.round(summary.publishedB.revsPerMile)) : '—',
    },
    {
      label: 'Load / speed',
      a: [summary.publishedA?.loadRange, summary.publishedA?.speedRating].filter(Boolean).join(' ') || '—',
      b: [summary.publishedB?.loadRange, summary.publishedB?.speedRating].filter(Boolean).join(' ') || '—',
    },
  ];

  return (
    <section className="cmp-card cmp-published-specs" aria-label="Manufacturer published specifications">
      <h2 className="cmp-card__title">Manufacturer Published Specs</h2>
      <p className="cmp-card__lede">
        Shown separately from {formulaSourceLabel().toLowerCase()} headline comparison.
        {summary.mode === 'mixed_source' ? ' Mixed-source note: only one side has published product data.' : null}
        {summary.canComparePublishedDiameters
          ? ' Comparable published diameters are available for both models.'
          : ' Published diameter comparison is unavailable until both sides include that field.'}
      </p>
      {(summary.publishedA || summary.publishedB) && (
        <p className="cmp-published-specs__models">
          {summary.publishedA ? (
            <span className="cmp-published-specs__model cmp-published-specs__model--a">
              {summary.publishedA.brand} {summary.publishedA.model} ({summary.publishedA.size})
            </span>
          ) : (
            <span className="cmp-published-specs__model">Tire 1: size only</span>
          )}
          <span aria-hidden="true"> · </span>
          {summary.publishedB ? (
            <span className="cmp-published-specs__model cmp-published-specs__model--b">
              {summary.publishedB.brand} {summary.publishedB.model} ({summary.publishedB.size})
            </span>
          ) : (
            <span className="cmp-published-specs__model">Tire 2: size only</span>
          )}
        </p>
      )}
      <div className="cmp-published-specs__table-wrap">
        <table className="cmp-published-specs__table">
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Tire 1</th>
              <th scope="col">Tire 2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.a}</td>
                <td>{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KpiCardIcon({ icon }: { icon: KpiCard['icon'] }) {
  const paths: Record<KpiCard['icon'], string> = {
    diameter: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-3.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z',
    width: 'M4 12h16M7 8v8M17 8v8',
    sidewall: 'M8 5v14M8 5c4 2 8 2 12 0M8 19c4-2 8-2 12 0',
    circumference: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 0v9l5 3',
    speedo: 'M12 19a8 8 0 1 0-8-8M12 11l4-3',
    revs: 'M4 12a8 8 0 0 1 14.5-4.5M20 12a8 8 0 0 1-14.5 4.5M16 5l3 1-1 3M8 19l-3-1 1-3',
  };
  return (
    <svg className="cmp-kpi__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[icon]} />
    </svg>
  );
}

export function ComparisonKpiRow({ cards }: { cards: KpiCard[] }) {
  return (
    <div className="cmp-kpi-row" aria-label="Key dimensional differences">
      {cards.map((card) => (
        <article key={card.id} className="cmp-kpi cmp-card-level-secondary">
          <div className="cmp-kpi__head">
            <span className="cmp-kpi__icon-wrap" aria-hidden="true">
              <KpiCardIcon icon={card.icon} />
            </span>
            <p className="cmp-kpi__label">{card.label}</p>
          </div>
          <p className="cmp-kpi__amount">{card.diffAmount}</p>
          <p className="cmp-kpi__pct">{card.diffPercent}</p>
          <p className="cmp-kpi__range">
            <span className="cmp-kpi__range-a">{card.originalValue}</span>
            <span className="cmp-kpi__range-arrow" aria-hidden="true">
              →
            </span>
            <span className="cmp-kpi__range-b">{card.newValue}</span>
          </p>
        </article>
      ))}
    </div>
  );
}

function FitmentRow({ row, hideStatus = false }: { row: DecisionFitmentRow; hideStatus?: boolean }) {
  return (
    <li className="cmp-fitment-checks__row">
      <span>{row.label}</span>
      {hideStatus ? null : (
        <span className={`cmp-fitment-checks__badge cmp-fitment-checks__badge--${row.status}`}>
          {row.statusLabel}
        </span>
      )}
    </li>
  );
}

const TIRE_DATA_FITMENT_IDS = [
  'diameter',
  'speedo',
  'wheel',
  'rim',
  'load',
  'speed-rating',
] as const;

const VEHICLE_DETAIL_IDS = [
  'fender',
  'suspension',
  'brake',
  'offset',
  'hub',
  'rubbing',
] as const;

function verdictSupportLine(decision: DimensionalDecisionSupport): string {
  if (/different wheel/i.test(decision.heading)) {
    return 'Different wheel required and vehicle-specific checks remain.';
  }
  if (/lower than original/i.test(decision.heading)) {
    return 'Rating change flagged from published data—vehicle checks remain.';
  }
  if (/significant dimensional/i.test(decision.heading)) {
    return 'Large diameter shift—clearance and load checks remain.';
  }
  if (/moderate change/i.test(decision.heading)) {
    return 'Notable size shift—vehicle-specific checks remain.';
  }
  return 'Close on paper—vehicle-specific checks still apply.';
}

function VerdictScoreRing({ score, tone }: { score: number; tone: DimensionalDecisionSupport['tone'] }) {
  const clamped = Math.max(0, Math.min(10, score));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = (clamped / 10) * circumference;

  return (
    <div className={`cmp-verdict__score-focal cmp-verdict__score-focal--${tone}`} aria-hidden="true">
      <svg className="cmp-verdict__score-ring" viewBox="0 0 100 100">
        <circle className="cmp-verdict__score-ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="cmp-verdict__score-ring-progress"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="cmp-verdict__score-numbers">
        <span className="cmp-verdict__score-value">{score.toFixed(1)}</span>
        <span className="cmp-verdict__score-denom">/ 10</span>
      </div>
    </div>
  );
}

export function ComparisonFeelPanel({
  decision,
}: {
  decision: DimensionalDecisionSupport;
}) {
  if (decision.feelItems.length === 0) return null;
  return (
    <section className="cmp-panel cmp-feel-panel cmp-card-level-secondary" aria-label="How the change may feel">
      <p className="cmp-sidebar-block__title">How the Change May Feel</p>
      <ul className="cmp-feel-list">
        {decision.feelItems.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ComparisonDecisionRail({
  decision,
}: {
  decision: DimensionalDecisionSupport;
}) {
  const { tireDataRows, vehicleDetailRows } = useMemo(() => {
    const byId = new Map(decision.fitmentRows.map((row) => [row.id, row]));
    const tireData: DecisionFitmentRow[] = [];
    for (const id of TIRE_DATA_FITMENT_IDS) {
      const row = byId.get(id);
      if (!row) continue;
      // Hide rim/load/speed when the database provides no value to compare.
      if (
        (id === 'rim' || id === 'load' || id === 'speed-rating') &&
        row.statusLabel === 'Data unavailable'
      ) {
        continue;
      }
      tireData.push(row);
    }
    const vehicleDetail: DecisionFitmentRow[] = [];
    for (const id of VEHICLE_DETAIL_IDS) {
      const row = byId.get(id);
      if (row) vehicleDetail.push(row);
    }
    return { tireDataRows: tireData, vehicleDetailRows: vehicleDetail };
  }, [decision.fitmentRows]);

  const supportLine = verdictSupportLine(decision);

  return (
    <div className="cmp-decision-rail">
      <section
        className={`cmp-panel cmp-verdict cmp-verdict--${decision.tone} cmp-card-level-primary`}
        aria-label="Dimensional verdict"
      >
        <p className="cmp-verdict__heading">Dimensional Verdict</p>
        <p className="cmp-verdict__title">{decision.heading}</p>
        <p className="cmp-verdict__support">{supportLine}</p>

        <div className="cmp-verdict__score-block">
          <p className="cmp-verdict__score-label">{decision.scoreTitle}</p>
          <VerdictScoreRing score={decision.score} tone={decision.tone} />
          <p className="cmp-verdict__score-sr-only">
            {decision.scoreTitle}: {decision.score.toFixed(1)} out of 10
          </p>
          <p className="cmp-verdict__score-note">{decision.scoreDisclaimer}</p>
        </div>

        <ul className="cmp-verdict__list">
          {decision.bullets.map((item) => (
            <li key={item.text}>
              <span
                className={`cmp-verdict__icon cmp-verdict__icon--${item.kind === 'warning' ? 'consideration' : 'benefit'}`}
                aria-hidden="true"
              >
                {item.kind === 'warning' ? '⚠' : '•'}
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="cmp-panel cmp-fitment-rail-panel cmp-card-level-secondary"
        aria-label="Essential fitment checks"
      >
        <p className="cmp-sidebar-block__title">Essential Fitment Checks</p>

        <p className="cmp-fitment-checks__group-title">Confirmed from tire data</p>
        <ul className="cmp-fitment-checks">
          {tireDataRows.map((row) => (
            <FitmentRow key={row.id} row={row} />
          ))}
        </ul>

        <p className="cmp-fitment-checks__group-title">Requires vehicle verification</p>
        <ul className="cmp-fitment-checks">
          <li className="cmp-fitment-checks__row cmp-fitment-checks__row--grouped">
            <div className="cmp-fitment-checks__grouped-copy">
              <span className="cmp-fitment-checks__grouped-label">
                Vehicle clearance and wheel compatibility
              </span>
              <span className="cmp-fitment-checks__grouped-detail">
                Check fender, suspension, brake, hub and offset clearance for the specific vehicle.
              </span>
            </div>
            <span className="cmp-fitment-checks__badge cmp-fitment-checks__badge--unknown">
              Check required
            </span>
          </li>
        </ul>

        {vehicleDetailRows.length > 0 ? (
          <details className="cmp-fitment-more">
            <summary>View detailed vehicle-specific checks</summary>
            <ul className="cmp-fitment-checks cmp-fitment-checks--detail">
              {vehicleDetailRows.map((row) => (
                <FitmentRow key={row.id} row={row} hideStatus />
              ))}
            </ul>
          </details>
        ) : null}

        <p className="cmp-fitment-checks__note">
          Clearance, offset and hub fit are vehicle-specific and never confirmed from tire size alone.
        </p>
      </section>
    </div>
  );
}
