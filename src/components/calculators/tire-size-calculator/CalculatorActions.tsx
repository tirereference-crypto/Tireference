import { comparisonPagePathCurrent, tireSizePath } from '../../../lib/tire-size-url';
import { hasTireSizeGuide } from '../../../lib/has-tire-size-guide';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';

const COMPARE_VISUAL_SRC = '/images/tires/tire-compare-pair.png';
/** Neutral tire side profile — avoids overly off-road vehicle art. */
const GUIDE_VISUAL_SRC = '/images/tires/tire-side-blue.png';

export function CalculatorActions({ sizeLabel }: { sizeLabel: string }) {
  const hasGuide = hasTireSizeGuide(sizeLabel);
  const compareHref = comparisonPagePathCurrent(sizeLabel);
  const guideHref = hasGuide ? tireSizePath(sizeLabel) : '#related-tire-sizes';

  const trackCompare = () => {
    trackEvent('calculator_compare_clicked', {
      calculator_name: CALCULATOR_NAMES.tireSize,
      current_tire_size: sizeLabel,
      source_page: getSourcePage(),
    });
  };

  const trackGuide = () => {
    trackEvent('calculator_guide_clicked', {
      calculator_name: CALCULATOR_NAMES.tireSize,
      current_tire_size: sizeLabel,
      source_page: getSourcePage(),
    });
  };

  return (
    <section className="tsc-actions" aria-label="Next steps">
      <div className="tsc-actions__grid">
        <article className="tsc-action-card">
          <div className="tsc-action-card__body">
            <div className="tsc-action-card__text">
              <h2 className="tsc-action-card__title">
                Compare {sizeLabel} with another size
              </h2>
              <p className="tsc-action-card__desc">
                See side-by-side differences in diameter, width, sidewall height and
                speedometer effect.
              </p>
              <a href={compareHref} className="tsc-action-card__cta" onClick={trackCompare}>
                Compare Tire Sizes
              </a>
            </div>
            <div className="tsc-action-card__visual" aria-hidden="true">
              <img
                src={COMPARE_VISUAL_SRC}
                alt=""
                className="tsc-action-card__img tsc-action-card__img--compare"
                width={160}
                height={168}
                decoding="async"
                loading="lazy"
              />
            </div>
          </div>
        </article>

        <article className="tsc-action-card">
          <div className="tsc-action-card__body">
            <div className="tsc-action-card__text">
              {hasGuide ? (
                <>
                  <h2 className="tsc-action-card__title">
                    View the complete {sizeLabel} tire guide
                  </h2>
                  <p className="tsc-action-card__desc">
                    Specifications, fitment notes, popular tires and related sizes.
                  </p>
                  <a href={guideHref} className="tsc-action-card__cta" onClick={trackGuide}>
                    View Tire Guide
                  </a>
                </>
              ) : (
                <>
                  <h2 className="tsc-action-card__title">
                    Explore related options for {sizeLabel}
                  </h2>
                  <p className="tsc-action-card__desc">
                    Similar sizes, dimensional alternatives and indexed tire models.
                  </p>
                  <a href={guideHref} className="tsc-action-card__cta" onClick={trackGuide}>
                    Explore Related Sizes
                  </a>
                </>
              )}
            </div>
            <div className="tsc-action-card__visual" aria-hidden="true">
              <img
                src={GUIDE_VISUAL_SRC}
                alt=""
                className="tsc-action-card__img tsc-action-card__img--guide"
                width={160}
                height={160}
                decoding="async"
                loading="lazy"
              />
            </div>
          </div>
        </article>
      </div>

      <p className="tsc-actions__note">
        Detailed guides are available for selected popular sizes.
      </p>
    </section>
  );
}
