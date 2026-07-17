import { useMemo } from 'react';
import {
  countIndexedSizesNearDiameter,
  formatDiameterGroupSizeCountLabel,
  POPULAR_TIRE_DIAMETERS,
} from '../../../lib/tire-diameter-insights';

function ProportionalTireIcon({ diameterIn }: { diameterIn: number }) {
  const t = (diameterIn - 31) / (35 - 31);
  const outer = 14 + t * 6;
  const hub = Math.max(4.5, outer * 0.38);

  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <circle
        cx="24"
        cy="24"
        r={outer}
        fill="#eef2f7"
        stroke="#64748b"
        strokeWidth="2"
      />
      <circle
        cx="24"
        cy="24"
        r={outer * 0.72}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.25"
        strokeDasharray="2.5 2"
      />
      <circle cx="24" cy="24" r={hub} fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
      <line
        x1="24"
        y1={24 - outer}
        x2="24"
        y2={24 + outer}
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PopularDiameterCards({
  onSelectDiameter,
  selectedDiameterIn = null,
}: {
  onSelectDiameter: (diameterIn: number) => void;
  /** Current target overall diameter in inches (after unit conversion). */
  selectedDiameterIn?: number | null;
}) {
  const { popular, unavailable } = useMemo(() => {
    const scored = POPULAR_TIRE_DIAMETERS.map((item) => ({
      ...item,
      count: countIndexedSizesNearDiameter(item.diameterIn),
    }));
    return {
      popular: scored.filter((item) => item.count > 0),
      unavailable: scored.filter((item) => item.count <= 0),
    };
  }, []);

  const isSelected = (diameterIn: number) =>
    selectedDiameterIn != null &&
    Number.isFinite(selectedDiameterIn) &&
    Math.round(selectedDiameterIn) === diameterIn;

  return (
    <section className="dia-popular-diameters" aria-label="Popular tire diameters">
      <div className="dia-popular-diameters__head">
        <div>
          <h2 className="dia-section-title">Popular Tire Diameters</h2>
          <p className="dia-popular-diameters__lede">
            Only diameter classes with indexed catalog sizes appear as active popular targets.
            Counts use nearest-inch rounding across all wheel sizes.
          </p>
        </div>
        <a className="dia-popular-diameters__all" href="/tire-sizes/">
          View all tire sizes
        </a>
      </div>

      <div
        className="dia-popular-diameters__row"
        role="list"
        style={{
          ['--popular-count' as string]: Math.max(popular.length, 1),
        }}
      >
        {popular.map((item) => {
          const selected = isSelected(item.diameterIn);
          const countLabel = formatDiameterGroupSizeCountLabel(item.count);
          return (
            <button
              key={item.diameterIn}
              type="button"
              className={`dia-popular-diameters__card${
                selected ? ' dia-popular-diameters__card--selected' : ''
              }`}
              role="listitem"
              aria-pressed={selected}
              onClick={() => onSelectDiameter(item.diameterIn)}
            >
              <span className="dia-popular-diameters__icon">
                <ProportionalTireIcon diameterIn={item.diameterIn} />
              </span>
              <span className="dia-popular-diameters__label">{item.label}</span>
              <span className="dia-popular-diameters__count">{countLabel}</span>
              <span className="dia-popular-diameters__action">
                Search {item.diameterIn}-inch sizes <span aria-hidden="true">→</span>
              </span>
            </button>
          );
        })}
      </div>

      {unavailable.length > 0 ? (
        <div className="dia-popular-diameters__unavailable" aria-label="Diameters without indexed sizes">
          <p className="dia-popular-diameters__unavailable-label">Not yet indexed</p>
          <div className="dia-popular-diameters__unavailable-row" role="list">
            {unavailable.map((item) => {
              const selected = isSelected(item.diameterIn);
              return (
                <div
                  key={item.diameterIn}
                  className={`dia-popular-diameters__card dia-popular-diameters__card--disabled${
                    selected ? ' dia-popular-diameters__card--selected' : ''
                  }`}
                  role="listitem"
                  aria-disabled="true"
                >
                  <span className="dia-popular-diameters__icon">
                    <ProportionalTireIcon diameterIn={item.diameterIn} />
                  </span>
                  <span className="dia-popular-diameters__label">{item.label}</span>
                  <span className="dia-popular-diameters__count">No indexed sizes yet</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
