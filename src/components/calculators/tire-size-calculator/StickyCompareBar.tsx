import type { TireSpecs } from '../../../lib/tire-math';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';

export function StickyCompareBar({
  visible,
  sizeLabel,
  specs,
  compareHref,
}: {
  visible: boolean;
  sizeLabel: string;
  specs: TireSpecs;
  compareHref: string;
}) {
  const handleCompare = () => {
    trackEvent('calculator_compare_clicked', {
      calculator_name: CALCULATOR_NAMES.tireSize,
      current_tire_size: sizeLabel,
      source_page: getSourcePage(),
    });
  };

  return (
    <div
      className={`calc-sticky-bar tsc-sticky-bar${visible ? ' calc-sticky-bar--visible' : ''}`}
      role="region"
      aria-label="Calculation summary"
      aria-hidden={!visible}
    >
      <div className="tsc-sticky-bar__inner">
        <div className="tsc-sticky-bar__stats">
          <span className="tsc-sticky-bar__size">{sizeLabel}</span>
          <span className="tsc-sticky-bar__stat">
            <strong>{specs.overallDiameterIn.toFixed(2)} in</strong> diameter
          </span>
          <span className="tsc-sticky-bar__stat">
            <strong>{specs.sectionWidthIn.toFixed(2)} in</strong> width
          </span>
        </div>
        <a href={compareHref} className="tsc-sticky-bar__cta" onClick={handleCompare}>
          Compare This Size
        </a>
      </div>
    </div>
  );
}
