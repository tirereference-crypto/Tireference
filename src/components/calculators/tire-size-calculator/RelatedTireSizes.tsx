import { getCalculatorRelatedSizes } from '../../../lib/calculator-related-sizes';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';
import { TscSectionCarousel } from './TscSectionCarousel';

function fmtSigned(value: number, digits: number, suffix: string): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}${suffix}`;
}

export function RelatedTireSizes({ sizeLabel }: { sizeLabel: string }) {
  const related = getCalculatorRelatedSizes(sizeLabel, 8);
  const hasDifferentWheel = related.some((row) => !row.sameWheel);

  const trackRelated = (targetSize: string, action: 'open' | 'compare') => {
    trackEvent('calculator_related_size_clicked', {
      calculator_name: CALCULATOR_NAMES.tireSize,
      current_tire_size: sizeLabel,
      new_tire_size: targetSize,
      source_page: getSourcePage(),
    });
    if (action === 'compare') {
      trackEvent('calculator_compare_clicked', {
        calculator_name: CALCULATOR_NAMES.tireSize,
        current_tire_size: sizeLabel,
        new_tire_size: targetSize,
        source_page: getSourcePage(),
      });
    }
  };

  if (related.length === 0) {
    return (
      <section id="related-tire-sizes" className="tsc-related" aria-label="Related tire sizes">
        <h2 className="tsc-section-title">Related Tire Sizes</h2>
        <p className="tsc-related__lede">
          No close alternatives found in the catalog for this size.
        </p>
      </section>
    );
  }

  return (
    <section id="related-tire-sizes" className="tsc-related" aria-label="Related tire sizes">
      <h2 className="tsc-section-title">Related Tire Sizes</h2>
      <p className="tsc-section-lede">Alternatives compared with {sizeLabel}.</p>

      <TscSectionCarousel itemCount={related.length}>
        {related.map((row) => (
          <article
            key={row.size}
            className="tsc-related__card"
            data-carousel-card
          >
            <a
              href={row.href}
              className="tsc-related__card-main"
              onClick={() => trackRelated(row.size, 'open')}
            >
              <div className="tsc-related__card-head">
                <span className="tsc-related__size">{row.size}</span>
                <span
                  className={`tsc-related__tag${row.sameWheel ? ' tsc-related__tag--same' : ' tsc-related__tag--diff'}`}
                >
                  {row.sameWheel ? 'Same Wheel' : 'Different Wheel'}
                </span>
              </div>

              <dl className="tsc-related__stats">
                <div>
                  <dt>Diameter</dt>
                  <dd>{fmtSigned(row.diameterDiffPercent, 1, '%')}</dd>
                </div>
                <div>
                  <dt>Width</dt>
                  <dd>{fmtSigned(row.widthDiffMm, 0, ' mm')}</dd>
                </div>
                {Math.abs(row.speedometerDiffPercent) >= 0.05 ? (
                  <div>
                    <dt>Speedo est.</dt>
                    <dd>{fmtSigned(row.speedometerDiffPercent, 1, '%')}</dd>
                  </div>
                ) : null}
              </dl>
            </a>

            {row.compareHref ? (
              <a
                href={row.compareHref}
                className="tsc-related__compare"
                onClick={() => trackRelated(row.size, 'compare')}
              >
                {`Compare ${sizeLabel} vs ${row.size}`}
              </a>
            ) : null}
          </article>
        ))}
      </TscSectionCarousel>

      {hasDifferentWheel ? (
        <p className="tsc-related__wheel-note" role="note">
          <span className="tsc-related__wheel-note-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            </svg>
          </span>
          Different-wheel alternatives require the stated wheel diameter and cannot be
          installed on the original wheel.
        </p>
      ) : null}

      <p className="tsc-related__safety">
        Dimensional similarity does not guarantee vehicle fitment. Check wheel width, load
        rating, clearance and manufacturer specifications.
      </p>
    </section>
  );
}
