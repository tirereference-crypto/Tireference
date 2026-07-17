import { useEffect, useState } from 'react';
import {
  CALCULATION_LOGIC_UPDATED,
  DATA_STANDARDS_PATH,
  formatMonthYear,
} from '../../../lib/eeat-metadata';
import { buildCalculatorReportHref, contactReportPath } from '../../../lib/tire-size-calculator-report';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';

function TrustIcon({ name }: { name: 'brand' | 'standards' | 'report' | 'updated' }) {
  const props = {
    viewBox: '0 0 16 16',
    width: 14,
    height: 14,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    'aria-hidden': true as const,
  };
  switch (name) {
    case 'brand':
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v3.2L10 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'standards':
      return (
        <svg {...props}>
          <path d="M4 3.5h8v9H4z" strokeLinejoin="round" />
          <path d="M6 6.5h4M6 9h3" strokeLinecap="round" />
        </svg>
      );
    case 'report':
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v4.2M8 11.2h.01" strokeLinecap="round" />
        </svg>
      );
    case 'updated':
      return (
        <svg {...props}>
          <path
            d="M3.5 8a4.5 4.5 0 0 1 7.6-3.2M12.5 8a4.5 4.5 0 0 1-7.6 3.2"
            strokeLinecap="round"
          />
          <path d="M11.2 2.8v2.4H8.8M4.8 13.2v-2.4h2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function DiameterCalculatorTrustStrip({
  sizeLabel,
}: {
  sizeLabel?: string | null;
}) {
  const [reportHref, setReportHref] = useState(() => contactReportPath(sizeLabel));

  useEffect(() => {
    setReportHref(buildCalculatorReportHref(sizeLabel));
  }, [sizeLabel]);

  const updatedLabel = CALCULATION_LOGIC_UPDATED
    ? `Calculator logic updated: ${formatMonthYear(CALCULATION_LOGIC_UPDATED)}`
    : null;

  return (
    <section className="dia-trust" aria-label="Trust and calculation source">
      <ul className="dia-trust__list">
        <li className="dia-trust__item">
          <span className="dia-trust__icon">
            <TrustIcon name="brand" />
          </span>
          <span>
            Calculated by <a href="/about/">TireReference</a>
          </span>
        </li>
        <li className="dia-trust__item" aria-hidden="true">
          <span className="dia-trust__sep" />
        </li>
        <li className="dia-trust__item">
          <span className="dia-trust__icon">
            <TrustIcon name="standards" />
          </span>
          <a href={DATA_STANDARDS_PATH}>Data &amp; Calculation Standards</a>
        </li>
        <li className="dia-trust__item" aria-hidden="true">
          <span className="dia-trust__sep" />
        </li>
        <li className="dia-trust__item">
          <span className="dia-trust__icon">
            <TrustIcon name="report" />
          </span>
          <a
            href={reportHref}
            onClick={() =>
              trackEvent('calculator_issue_clicked', {
                calculator_name: CALCULATOR_NAMES.tireDiameter,
                current_tire_size: sizeLabel ?? undefined,
                source_page: getSourcePage(),
              })
            }
          >
            Report an Issue
          </a>
        </li>
        {updatedLabel ? (
          <>
            <li className="dia-trust__item" aria-hidden="true">
              <span className="dia-trust__sep" />
            </li>
            <li className="dia-trust__item">
              <span className="dia-trust__icon">
                <TrustIcon name="updated" />
              </span>
              <span>{updatedLabel}</span>
            </li>
          </>
        ) : null}
      </ul>
    </section>
  );
}
