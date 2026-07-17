import { CALCULATOR_NAMES, trackRelatedCalculatorClick } from '../../../lib/analytics';
import { TIRE_SIZE_CALCULATOR_RELATED_TOOLS } from '../../../lib/tire-size-calculator-tools';

const TOOL_ICONS: Record<string, string> = {
  '/calculators/tire-comparison-calculator/':
    'M8 7h8M8 12h8M8 17h5M6 3h12a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V5a2 2 0 012-2z',
  '/calculators/tire-diameter-calculator/':
    'M12 3v18M8 6h8M8 18h8',
  '/calculators/wheel-offset-calculator/':
    'M12 12m-8 0a8 8 0 1016 0a8 8 0 10-16 0M12 12m-2 0a2 2 0 104 0a2 2 0 10-4 0',
  '/calculators/gear-ratio-calculator/':
    'M12 6v12M6 12h12M8 8l8 8M16 8l-8 8',
};

function ToolIcon({ href }: { href: string }) {
  const path = TOOL_ICONS[href] ?? 'M12 3v18M6 12h12';
  return (
    <svg className="tsc-tools__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RelatedCalculators() {
  return (
    <section className="tsc-tools" aria-label="Related calculators and tools">
      <h2 className="tsc-section-title">Related Calculators &amp; Tools</h2>
      <div className="tsc-tools__grid">
        {TIRE_SIZE_CALCULATOR_RELATED_TOOLS.map((calc) => (
          <a
            key={calc.href}
            href={calc.href}
            className="tsc-tools__card"
            onClick={() => trackRelatedCalculatorClick(calc.href, CALCULATOR_NAMES.tireSize)}
          >
            <span className="tsc-tools__icon-wrap">
              <ToolIcon href={calc.href} />
            </span>
            <div className="tsc-tools__body">
              <h3 className="tsc-tools__title">{calc.label}</h3>
              <p className="tsc-tools__desc">{calc.description}</p>
              <span className="tsc-tools__action">Open tool</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
