import { HowThisCalculatorWorks } from './CalculatorMethodologyDisclosure';

export function CalculatorNotice() {
  return (
    <div className="tsc-notice-stack">
      <aside className="tsc-notice" role="note">
        <span className="tsc-notice__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8h.01M11 12h1v5h1" strokeLinecap="round" />
          </svg>
        </span>
        <div className="tsc-notice__body">
          <p>
            These are nominal dimensions calculated from the entered tire size. Actual mounted
            dimensions can vary by tire model, tread depth, approved rim width, inflation pressure
            and load. This calculator does not confirm vehicle fitment.
          </p>
          <p className="tsc-notice__emphasis">
            Always verify clearance, load rating and fitment with the vehicle and tire manufacturer.
          </p>
        </div>
      </aside>
      <HowThisCalculatorWorks />
    </div>
  );
}
