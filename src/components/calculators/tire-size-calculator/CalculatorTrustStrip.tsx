import { SITE_NAME } from '../../../lib/site-brand';
import {
  CALCULATION_LOGIC_UPDATED,
  formatMonthYear,
} from '../../../lib/eeat-metadata';
import { buildCalculatorReportHref, contactReportPath } from '../../../lib/tire-size-calculator-report';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';
import { useEffect, useState } from 'react';

export function CalculatorTrustStrip({
  sizeLabel,
  hasCalculatedSize,
}: {
  sizeLabel?: string | null;
  hasCalculatedSize?: boolean;
}) {
  const [reportHref, setReportHref] = useState(() => contactReportPath(sizeLabel));

  useEffect(() => {
    setReportHref(buildCalculatorReportHref(sizeLabel));
  }, [sizeLabel]);

  const handleReportClick = () => {
    trackEvent('calculator_issue_clicked', {
      calculator_name: CALCULATOR_NAMES.tireSize,
      current_tire_size: sizeLabel ?? undefined,
      source_page: getSourcePage(),
    });
  };

  const thirdItem = CALCULATION_LOGIC_UPDATED
    ? `Calculator logic updated: ${formatMonthYear(CALCULATION_LOGIC_UPDATED)}`
    : 'Nominal values calculated from your entered tire size';

  return (
    <div className="tsc-trust" role="contentinfo" aria-label="Calculator trust information">
      <div className="tsc-trust__item">
        <span className="tsc-trust__icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </span>
        <span>
          <strong>
            Calculator by{' '}
            <a href="/about/" className="tsc-trust__link">
              {SITE_NAME}
            </a>
          </strong>
          <span className="tsc-trust__sub">Independent tire sizing and comparison tools.</span>
        </span>
      </div>

      <span className="tsc-trust__sep" aria-hidden="true" />

      <div className="tsc-trust__item tsc-trust__item--report">
        <span className="tsc-trust__icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </span>
        <span>
          <strong>Found an error?</strong>{' '}
          <a href={reportHref} className="tsc-trust__link" onClick={handleReportClick}>
            Report a calculation issue
          </a>
        </span>
      </div>

      <span className="tsc-trust__sep" aria-hidden="true" />

      <div className="tsc-trust__item">
        <span className="tsc-trust__icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
        </span>
        <span>{thirdItem}</span>
      </div>
    </div>
  );
}
