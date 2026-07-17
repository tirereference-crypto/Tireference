import { useMemo, useRef, useState } from 'react';
import { useSingleOpenDetails } from '../../../hooks/useSingleOpenDetails';
import {
  TIRE_SIZE_CALCULATOR_FAQS,
  TIRE_SIZE_CALCULATOR_FAQ_VISIBLE,
} from '../../../lib/tire-size-calculator-faqs';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';
import { MethodologyFormulaList } from './CalculatorMethodologyDisclosure';

const METHODOLOGY_QUESTION = 'How are these dimensions calculated?';

export function CalculatorFaq() {
  const faqRef = useRef<HTMLDivElement>(null);
  useSingleOpenDetails(faqRef);
  const [showAll, setShowAll] = useState(false);

  const visibleFaqs = useMemo(() => {
    const limit = showAll
      ? TIRE_SIZE_CALCULATOR_FAQS.length
      : TIRE_SIZE_CALCULATOR_FAQ_VISIBLE;
    return TIRE_SIZE_CALCULATOR_FAQS.slice(0, limit);
  }, [showAll]);

  // Interleave by rows: even indices left, odd indices right
  const columnOne = visibleFaqs.filter((_, i) => i % 2 === 0);
  const columnTwo = visibleFaqs.filter((_, i) => i % 2 === 1);
  const hiddenCount = TIRE_SIZE_CALCULATOR_FAQS.length - TIRE_SIZE_CALCULATOR_FAQ_VISIBLE;

  const handleToggle = (open: boolean) => {
    if (open) {
      trackEvent('calculator_faq_expanded', {
        calculator_name: CALCULATOR_NAMES.tireSize,
        source_page: getSourcePage(),
      });
    }
  };

  const renderItem = (item: (typeof TIRE_SIZE_CALCULATOR_FAQS)[number]) => (
    <details
      key={item.question}
      className="tsc-faq__item"
      onToggle={(e) => handleToggle((e.target as HTMLDetailsElement).open)}
    >
      <summary className="tsc-faq__question">{item.question}</summary>
      <div className="tsc-faq__answer">
        {item.question === METHODOLOGY_QUESTION ? (
          <MethodologyFormulaList />
        ) : (
          <p>{item.answer}</p>
        )}
      </div>
    </details>
  );

  return (
    <section className="tsc-faq" aria-label="Frequently asked questions">
      <h2 className="tsc-section-title">Frequently Asked Questions</h2>
      <div className="tsc-faq__grid" ref={faqRef}>
        <div className="tsc-faq__column">{columnOne.map(renderItem)}</div>
        <div className="tsc-faq__column">{columnTwo.map(renderItem)}</div>
      </div>
      {!showAll && hiddenCount > 0 ? (
        <button
          type="button"
          className="tsc-faq__more"
          onClick={() => setShowAll(true)}
        >
          Show {hiddenCount} more question{hiddenCount === 1 ? '' : 's'}
        </button>
      ) : null}
    </section>
  );
}
