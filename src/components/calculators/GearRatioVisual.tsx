import type { GearRatioResult } from '../../lib/gear-ratio-math';
import { formatRatio } from '../../lib/gear-ratio-math';
import {
  BEFORE_INSTALL_EXPECTATIONS,
  buildGearComparisonMatrix,
  buildGearComparisonTable,
  type GearComparisonSetup,
  type GearComparisonTableCell,
  type GearStarRating,
} from '../../lib/gear-ratio-insights';

const STAR_FILL: Record<GearStarRating['tone'], string> = {
  red: '#ef4444',
  orange: '#f97316',
  green: '#22c55e',
};

const STAR_EMPTY = '#e2e8f0';

function GearingStars({ rating }: { rating: GearStarRating }) {
  return (
    <div className="grc-gear-compare__stars" aria-label={`${rating.filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating.filled;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className="grc-gear-compare__star"
            aria-hidden="true"
          >
            <path
              d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.77l-4.94 2.94.94-5.5-4-3.9 5.53-.8L10 1.5z"
              fill={filled ? STAR_FILL[rating.tone] : STAR_EMPTY}
              stroke={filled ? STAR_FILL[rating.tone] : '#cbd5e1'}
              strokeWidth="0.75"
            />
          </svg>
        );
      })}
    </div>
  );
}

function GearingBarRow({
  setup,
  barMin,
  barMax,
}: {
  setup: GearComparisonSetup;
  barMin: number;
  barMax: number;
}) {
  const span = barMax - barMin || 1;
  const widthPct = ((setup.effective - barMin) / span) * 100;

  return (
    <div className="grc-gear-compare__bar-row">
      <div className="grc-gear-compare__bar-label">
        <span className="grc-gear-compare__bar-name">
          {setup.name} ({formatRatio(setup.gear)})
        </span>
        <span className="grc-gear-compare__bar-effective">
          Effective: {formatRatio(setup.effective)}
        </span>
      </div>
      <div className="grc-gear-compare__bar-track">
        <div
          className={`grc-gear-compare__bar grc-gear-compare__bar--${setup.barTone}`}
          style={{ width: `${Math.max(8, widthPct)}%` }}
        >
          <span className="grc-gear-compare__bar-value">{formatRatio(setup.effective)}</span>
        </div>
      </div>
    </div>
  );
}

/** Bar chart + star table comparing keep-current, ideal, and performance gearing. */
export function GearRatioGearingComparison({ result }: { result: GearRatioResult }) {
  const matrix = buildGearComparisonMatrix(result);

  return (
    <div className="grc-gear-compare">
      <h2 className="grc-gear-compare__title">
        Gearing Comparison (With {matrix.tireDiameterIn}&quot; Tires)
      </h2>

      <div className="grc-gear-compare__bars">
        {matrix.setups.map((setup) => (
          <GearingBarRow
            key={setup.key}
            setup={setup}
            barMin={matrix.barMin}
            barMax={matrix.barMax}
          />
        ))}
        <div className="grc-gear-compare__axis">
          <span>Lower</span>
          <span className="grc-gear-compare__axis-label">Overall Gearing (Effective Ratio)</span>
          <span>Higher</span>
        </div>
      </div>

      <div className="grc-gear-compare__table-wrap">
        <table className="grc-gear-compare__table">
          <thead>
            <tr>
              <th scope="col">Setup</th>
              <th scope="col">Acceleration</th>
              <th scope="col">Towing</th>
              <th scope="col">Fuel Economy</th>
              <th scope="col">Highway RPM</th>
            </tr>
          </thead>
          <tbody>
            {matrix.setups.map((setup) => (
              <tr key={setup.key}>
                <th scope="row">
                  {setup.name} ({formatRatio(setup.gear)})
                </th>
                <td>
                  <GearingStars rating={setup.ratings.acceleration} />
                </td>
                <td>
                  <GearingStars rating={setup.ratings.towing} />
                </td>
                <td>
                  <GearingStars rating={setup.ratings.fuelEconomy} />
                </td>
                <td>
                  <GearingStars rating={setup.ratings.highwayRpm} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grc-gear-compare__legend" aria-label="Star rating legend">
        <span className="grc-gear-compare__legend-item">
          <GearingStars rating={{ filled: 1, tone: 'red' }} />
          <span>Poor</span>
        </span>
        <span className="grc-gear-compare__legend-item">
          <GearingStars rating={{ filled: 2, tone: 'orange' }} />
          <span>Fair</span>
        </span>
        <span className="grc-gear-compare__legend-item">
          <GearingStars rating={{ filled: 3, tone: 'orange' }} />
          <span>Good</span>
        </span>
        <span className="grc-gear-compare__legend-item">
          <GearingStars rating={{ filled: 4, tone: 'green' }} />
          <span>Very Good</span>
        </span>
        <span className="grc-gear-compare__legend-item">
          <GearingStars rating={{ filled: 5, tone: 'green' }} />
          <span>Excellent</span>
        </span>
      </div>
    </div>
  );
}

function ExpectIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'launch':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 10l3-3" />
          <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'towing':
      return (
        <svg {...common}>
          <path d="M3 14l4-6 4 4 6-8" />
        </svg>
      );
    case 'rpm':
      return (
        <svg {...common}>
          <path d="M4 14a6 6 0 1112 0" />
          <path d="M10 14l3-4" />
        </svg>
      );
    case 'downshift':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="12" height="14" rx="2" />
          <path d="M8 7h4M8 10h4M8 13h2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="7" />
        </svg>
      );
  }
}

/** Single "Before Installing Bigger Tires" panel — summary, expect list, stock vs effective visual. */
export function BeforeInstallingBiggerTires({ result }: { result: GearRatioResult }) {
  const { input } = result;
  const currentD = Math.round(input.currentDiameterIn);
  const newD = Math.round(input.newDiameterIn);
  const stockGear = formatRatio(input.stockGearRatio);
  const effectiveGear = formatRatio(result.effectiveRatio);

  return (
    <section className="grc-before-install" aria-label="Before installing bigger tires">
      <h2 className="grc-before-install__title">Before Installing Bigger Tires</h2>

      <p className="grc-before-install__summary">
        Switching from <strong>{currentD}&quot;</strong> to <strong>{newD}&quot;</strong> tires with{' '}
        <strong>{stockGear}</strong> gears will make your vehicle behave approximately like changing from{' '}
        <strong>{stockGear}</strong> gears to <strong>{effectiveGear}</strong> gears.
      </p>

      <div className="grc-before-install__body">
        <div className="grc-before-install__expect">
          <h3 className="grc-before-install__expect-title">Expect:</h3>
          <ul className="grc-before-install__expect-list">
            {BEFORE_INSTALL_EXPECTATIONS.map((item) => (
              <li key={item.icon} className="grc-before-install__expect-item">
                <span className="grc-before-install__expect-icon" aria-hidden="true">
                  <ExpectIcon name={item.icon} />
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grc-before-install__visual">
          <div className="grc-before-install__flow">
            <div className="grc-before-install__setup">
              <span className="grc-before-install__setup-label">Stock Setup</span>
              <div className="grc-before-install__setup-box grc-before-install__setup-box--stock">
                <span className="grc-before-install__setup-tire">{currentD}&quot; Tires</span>
                <span className="grc-before-install__setup-gear">{stockGear} Gears</span>
              </div>
            </div>

            <span className="grc-before-install__arrow" aria-hidden="true">
              →
            </span>

            <div className="grc-before-install__setup">
              <span className="grc-before-install__setup-label">
                After {newD}&quot; Tires (Stock {stockGear} Gears)
              </span>
              <div className="grc-before-install__setup-box grc-before-install__setup-box--after">
                <span className="grc-before-install__setup-effective-label">Effective Like</span>
                <span className="grc-before-install__setup-effective-value">{effectiveGear} Gears</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Effective gear ratio formula card — matches reference layout and copy. */
export function EffectiveGearRatioExplained({ result }: { result: GearRatioResult }) {
  const { input } = result;
  const stockGear = formatRatio(input.stockGearRatio);
  const originalDiameter =
    Math.abs(result.effectiveCurrentDiameterIn - Math.round(result.effectiveCurrentDiameterIn)) < 0.05
      ? String(Math.round(result.effectiveCurrentDiameterIn))
      : result.effectiveCurrentDiameterIn.toFixed(2);
  const newDiameter = result.effectiveNewDiameterIn.toFixed(2);
  const effectiveRatio = formatRatio(result.effectiveRatio);

  return (
    <section className="grc-effective-explained" aria-label="Effective gear ratio explained">
      <h2 className="grc-effective-explained__title">Effective Gear Ratio Explained</h2>
      <p className="grc-effective-explained__lead">
        When you increase tire size without changing gears, your effective (overall) ratio gets taller.
      </p>

      <div className="grc-effective-explained__math">
        <div className="grc-effective-explained__result-label">
          <span>Effective Ratio</span>
          <span>(Overall)</span>
        </div>

        <span className="grc-effective-explained__equals grc-effective-explained__equals--formula" aria-hidden="true">
          =
        </span>

        <div className="grc-effective-explained__equation-col">
          <div className="grc-effective-explained__formula-box">
            <div className="grc-effective-explained__equation-grid">
              <span className="grc-effective-explained__term">
                <span className="grc-effective-explained__term-main grc-effective-explained__term-main--line">
                  Original Gear Ratio
                </span>
                <span className="grc-effective-explained__term-sub">(Axle Ratio)</span>
              </span>
              <span className="grc-effective-explained__operator" aria-hidden="true">
                ×
              </span>
              <span className="grc-effective-explained__term">
                <span className="grc-effective-explained__term-main">Original Tire Diameter</span>
                <span className="grc-effective-explained__term-sub">(Loaded)</span>
              </span>
              <span className="grc-effective-explained__operator" aria-hidden="true">
                ÷
              </span>
              <span className="grc-effective-explained__term">
                <span className="grc-effective-explained__term-main">New Tire Diameter</span>
                <span className="grc-effective-explained__term-sub">(Effective)</span>
              </span>
            </div>
          </div>

          <div className="grc-effective-explained__equation-grid grc-effective-explained__equation-grid--values">
            <span className="grc-effective-explained__value">{stockGear}</span>
            <span className="grc-effective-explained__operator" aria-hidden="true">
              ×
            </span>
            <span className="grc-effective-explained__value">{originalDiameter}</span>
            <span className="grc-effective-explained__operator" aria-hidden="true">
              ÷
            </span>
            <span className="grc-effective-explained__value">{newDiameter}</span>
          </div>
        </div>

        <span className="grc-effective-explained__equals grc-effective-explained__equals--values" aria-hidden="true">
          =
        </span>

        <span className="grc-effective-explained__equals grc-effective-explained__equals--answer" aria-hidden="true">
          =
        </span>

        <span className="grc-effective-explained__answer">{effectiveRatio}</span>
      </div>
    </section>
  );
}

function ComparisonTableCell({ cell }: { cell: GearComparisonTableCell }) {
  const tone = cell.tone ?? 'default';
  return (
    <span
      className={[
        'grc-compare-table__cell-text',
        cell.bold ? 'grc-compare-table__cell-text--bold' : '',
        tone !== 'default' ? `grc-compare-table__cell-text--${tone}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {cell.text}
    </span>
  );
}

/** Full gearing comparison table — stock, new tires, ideal, and performance rows. */
export function GearRatioComparisonTable({ result }: { result: GearRatioResult }) {
  const rows = buildGearComparisonTable(result);

  return (
    <section className="grc-compare-table-section" aria-label="Gearing comparison table">
      <h2 className="grc-compare-table__title">Gearing Comparison Table</h2>
      <div className="grc-compare-table__wrap grc-compare-table__wrap--desktop">
        <table className="grc-compare-table">
          <thead>
            <tr>
              <th scope="col">Setup</th>
              <th scope="col">Tire Diameter (Effective)</th>
              <th scope="col">Axle Gear Ratio</th>
              <th scope="col">Effective Gear Ratio (Overall)</th>
              <th scope="col">Change from Stock</th>
              <th scope="col">Acceleration</th>
              <th scope="col">Towing</th>
              <th scope="col">Cruising RPM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.setup}>
                <th scope="row">{row.setup}</th>
                <td>{row.tireDiameter}</td>
                <td>{row.axleGear}</td>
                <td>
                  <ComparisonTableCell cell={row.effectiveRatio} />
                </td>
                <td>
                  <ComparisonTableCell cell={row.changeFromStock} />
                </td>
                <td>
                  <ComparisonTableCell cell={row.acceleration} />
                </td>
                <td>
                  <ComparisonTableCell cell={row.towing} />
                </td>
                <td>{row.cruisingRpm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grc-compare-cards" aria-label="Gearing comparison cards">
        {rows.map((row) => (
          <article key={row.setup} className="grc-compare-card">
            <h3 className="grc-compare-card__title">{row.setup}</h3>
            <div className="grc-compare-card__row">
              <span className="grc-compare-card__label">Tire Diameter</span>
              <span className="grc-compare-card__value">{row.tireDiameter}</span>
            </div>
            <div className="grc-compare-card__row">
              <span className="grc-compare-card__label">Axle Gear</span>
              <span className="grc-compare-card__value">{row.axleGear}</span>
            </div>
            <div className="grc-compare-card__row">
              <span className="grc-compare-card__label">Effective Ratio</span>
              <span className="grc-compare-card__value">
                <ComparisonTableCell cell={row.effectiveRatio} />
              </span>
            </div>
            <div className="grc-compare-card__row">
              <span className="grc-compare-card__label">Change from Stock</span>
              <span className="grc-compare-card__value">
                <ComparisonTableCell cell={row.changeFromStock} />
              </span>
            </div>
            <div className="grc-compare-card__row">
              <span className="grc-compare-card__label">Acceleration</span>
              <span className="grc-compare-card__value">
                <ComparisonTableCell cell={row.acceleration} />
              </span>
            </div>
            <div className="grc-compare-card__row">
              <span className="grc-compare-card__label">Towing</span>
              <span className="grc-compare-card__value">
                <ComparisonTableCell cell={row.towing} />
              </span>
            </div>
            <div className="grc-compare-card__row">
              <span className="grc-compare-card__label">Cruising RPM</span>
              <span className="grc-compare-card__value">{row.cruisingRpm}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Gearing comparison (left) + before-install panel (right), equal height at 50% width each. */
export function GearCompareInstallRow({ result }: { result: GearRatioResult }) {
  return (
    <div className="grc-compare-install-row">
      <div className="grc-compare-install-row__col">
        <section className="wof-viz-card grc-viz-card grc-gear-compare-card" aria-label="Gearing comparison chart">
          <GearRatioGearingComparison result={result} />
        </section>
      </div>
      <div className="grc-compare-install-row__col">
        <BeforeInstallingBiggerTires result={result} />
      </div>
    </div>
  );
}
