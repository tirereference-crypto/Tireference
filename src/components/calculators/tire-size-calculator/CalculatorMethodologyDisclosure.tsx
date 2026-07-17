import { DATA_STANDARDS_PATH } from '../../../lib/eeat-metadata';

export function MethodologyFormulaList() {
  return (
    <>
      <ul className="tsc-faq__formula-list">
        <li>Sidewall height = section width × aspect ratio</li>
        <li>Overall diameter = wheel diameter + two sidewalls</li>
        <li>Circumference = π × overall diameter</li>
        <li>Revolutions per mile = inches per mile ÷ circumference</li>
      </ul>
      <p className="tsc-faq__formula-note">
        Metric sidewall uses width in millimetres and aspect ratio as a percentage. Results
        are nominal values from the size code, not measured on a specific tire model.
      </p>
    </>
  );
}

/** Compact calculator disclosure placed under the nominal-dimensions notice. */
export function HowThisCalculatorWorks() {
  return (
    <details className="tsc-method-disclosure">
      <summary className="tsc-method-disclosure__summary">How this calculator works</summary>
      <div className="tsc-method-disclosure__body">
        <p>
          Dimensions are calculated from the entered tire code using standard tire-geometry
          formulas. Overall diameter, sidewall height, circumference and theoretical revolutions
          per mile are nominal calculated values. Actual manufacturer measurements may vary by
          tire model, approved rim width, tread depth, inflation pressure and load.
        </p>
        <MethodologyFormulaList />
        <p className="tsc-method-disclosure__link-row">
          <a href={DATA_STANDARDS_PATH} className="tsc-method-disclosure__link">
            Learn about Tire Reference&apos;s data and calculation standards
          </a>
        </p>
      </div>
    </details>
  );
}
