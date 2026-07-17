import type { TireSpecs } from '../../../lib/tire-math';
import {
  buildSizeSnapshotCards,
  type SnapshotIcon,
} from '../../../lib/calculator-size-snapshot';

const ICON_PATHS: Record<SnapshotIcon, string> = {
  sidewall: 'M8 4v16M16 4v16M8 12h8',
  diameter: 'M12 2v20M8 6h8M8 18h8',
  speedometer: 'M12 14l3-5M5 19a9 9 0 1114 0',
  vehicle: 'M5 17h14M7 17V9l2-3h6l2 3v8M8 17v2M16 17v2M7 12h10',
  categories: 'M4 7h6v6H4zM14 7h6v3h-6zM14 14h6v3h-6z',
  production: 'M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z',
};

const PRODUCTION_TIP =
  "Production status is based on Tire Reference's current indexed tire-size and product records. A mathematically valid size is not automatically classified as a production size.";

function SnapshotIconGlyph({ icon }: { icon: SnapshotIcon }) {
  return (
    <svg
      className="tsc-snapshot__svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[icon]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TireSizeSnapshot({
  specs,
  sizeLabel,
  baselineSize,
}: {
  specs: TireSpecs;
  sizeLabel: string;
  baselineSize?: string | null;
}) {
  const cards = buildSizeSnapshotCards(sizeLabel, specs, { baselineSize });

  return (
    <section className="tsc-snapshot" aria-label={`${sizeLabel} size snapshot`}>
      <header className="tsc-snapshot__header">
        <h2 className="tsc-section-title">{sizeLabel} Size Snapshot</h2>
        <p className="tsc-section-lede">
          Key facts from your calculation and catalog data.
        </p>
      </header>
      <div className="tsc-snapshot__grid">
        {cards.map((card) => (
          <article
            key={card.id}
            className={`tsc-snapshot__item${
              card.statusTone === 'positive' ? ' tsc-snapshot__item--positive' : ''
            }`}
            aria-label={`${card.title}: ${card.value}. ${card.detail}. Source: ${card.source}.`}
          >
            <span className="tsc-snapshot__icon">
              <SnapshotIconGlyph icon={card.icon} />
            </span>
            <p className="tsc-snapshot__label">
              {card.title}
              {card.id === 'production' ? (
                <button
                  type="button"
                  className="tsc-info-tip"
                  title={PRODUCTION_TIP}
                  aria-label={PRODUCTION_TIP}
                >
                  i
                </button>
              ) : null}
            </p>
            <p className="tsc-snapshot__value">{card.value}</p>
            {card.detail ? <p className="tsc-snapshot__detail">{card.detail}</p> : null}
            {card.id === 'vehicle-type' ? (
              <p className="tsc-snapshot__provenance">
                Vehicle examples indicate common use patterns and do not confirm fitment for a
                particular year or trim.
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
