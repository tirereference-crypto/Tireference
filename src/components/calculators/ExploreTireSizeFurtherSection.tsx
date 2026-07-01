import { useMemo } from 'react';
import type { TireSpecs } from '../../lib/tire-math';
import {
  buildExploreFurtherData,
  formatSignedIn,
  formatSignedPercent,
  hasExploreFurtherContent,
} from '../../lib/tire-explore-further';
import type { TireModelCategory } from '../../data/tire-popular-models';

function ExploreIcon({ name }: { name: 'upgrade' | 'compare' | 'tire' | 'arrow' }) {
  const paths: Record<string, string> = {
    upgrade: 'M12 19V5M5 12l7-7 7 7',
    compare: 'M8 7h8M8 12h8M8 17h5M4 4h16',
    tire: 'M12 12m-8 0a8 8 0 1016 0a8 8 0 10-16 0M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0',
    arrow: 'M5 12h14M13 6l6 6-6 6',
  };

  return (
    <svg className="calc-explore__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function modelBadgeClass(category: TireModelCategory): string {
  switch (category) {
    case 'All-Terrain':
      return 'calc-explore__model-badge--all-terrain';
    case 'Mud-Terrain':
      return 'calc-explore__model-badge--mud-terrain';
    case 'Hybrid Terrain':
      return 'calc-explore__model-badge--hybrid';
    case 'Performance':
      return 'calc-explore__model-badge--performance';
    default:
      return 'calc-explore__model-badge--highway';
  }
}

export function ExploreTireSizeFurtherSection({
  specs,
  sizeLabel,
}: {
  specs: TireSpecs;
  sizeLabel: string;
}) {
  const data = useMemo(
    () => buildExploreFurtherData(sizeLabel, specs),
    [sizeLabel, specs],
  );

  return (
    <section className="calc-explore" aria-label="Explore this tire size further">
      <div className="calc-explore__grid">
        <article className="calc-explore__card">
          <div className="calc-explore__card-head">
            <ExploreIcon name="upgrade" />
            <div>
              <h3 className="calc-explore__card-title">Popular Upgrade Paths</h3>
              <p className="calc-explore__card-subtitle">Common next-step sizes from this tire.</p>
            </div>
          </div>

          <div className="calc-explore__card-body">
            {hasExploreFurtherContent(data) ? (
              data.upgradePaths.map((path) => (
                <a
                  key={path.size}
                  href={path.comparisonHref}
                  className="calc-explore__upgrade-item"
                >
                  <span className="calc-explore__upgrade-size">{path.size}</span>
                  <span className="calc-explore__upgrade-meta">
                    {formatSignedIn(path.diameterChangeIn)} Diameter
                  </span>
                  <span className="calc-explore__upgrade-note">{path.fitmentNote}</span>
                </a>
              ))
            ) : (
              <p className="calc-explore__empty">
                No upgrade suggestions available for this size yet.
              </p>
            )}
          </div>
        </article>

        <article className="calc-explore__card">
          <div className="calc-explore__card-head">
            <ExploreIcon name="compare" />
            <div>
              <h3 className="calc-explore__card-title">Compare This Size</h3>
              <p className="calc-explore__card-subtitle">
                See how this tire stacks up against common alternatives.
              </p>
            </div>
          </div>

          <div className="calc-explore__card-body">
            {data.comparisons.length > 0 ? (
              data.comparisons.map((comparison) => (
                <a
                  key={comparison.targetSize}
                  href={comparison.comparisonHref}
                  className="calc-explore__compare-item"
                >
                  <div className="calc-explore__compare-top">
                    <span className="calc-explore__compare-label">{comparison.label}</span>
                    <ExploreIcon name="arrow" />
                  </div>
                  <dl className="calc-explore__compare-stats">
                    <div>
                      <dt>Diameter</dt>
                      <dd>{formatSignedIn(comparison.diameterChangeIn)}</dd>
                    </div>
                    <div>
                      <dt>Sidewall</dt>
                      <dd>{formatSignedIn(comparison.sidewallChangeIn)}</dd>
                    </div>
                    <div>
                      <dt>Speedometer</dt>
                      <dd>{formatSignedPercent(comparison.speedometerErrorPercent)}</dd>
                    </div>
                  </dl>
                </a>
              ))
            ) : (
              <p className="calc-explore__empty">
                No upgrade suggestions available for this size yet.
              </p>
            )}
          </div>
        </article>

        <article className="calc-explore__card">
          <div className="calc-explore__card-head">
            <ExploreIcon name="tire" />
            <div>
              <h3 className="calc-explore__card-title">Popular Tires Available</h3>
              <p className="calc-explore__card-subtitle">
                Well-known tire models commonly sold in this size.
              </p>
            </div>
          </div>

          <div className="calc-explore__card-body">
            {data.popularTires.map((tire) => (
              <div key={tire.name} className="calc-explore__model-item">
                <ExploreIcon name="tire" />
                <div className="calc-explore__model-body">
                  <p className="calc-explore__model-name">{tire.name}</p>
                  <span className={`calc-explore__model-badge ${modelBadgeClass(tire.category)}`}>
                    {tire.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
