import { useEffect, useMemo, useRef, useState } from 'react';
import { useSingleOpenDetails } from '../../../hooks/useSingleOpenDetails';
import {
  buildDiameterFaqs,
  DIAMETER_FAQ_PRIMARY_COUNT,
} from '../../../lib/tire-diameter-insights';
import { buildFaqPageSchema } from '../../../lib/seo/schema';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';
import type { WheelSelection } from './diameter-search';

const FAQ_SCHEMA_MARK = 'data-dia-faq-schema';

function splitBalancedColumns<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function syncFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  if (typeof document === 'undefined') return;
  const schema = buildFaqPageSchema(faqs);
  if (!schema) return;

  let node = document.querySelector(`script[type="application/ld+json"][${FAQ_SCHEMA_MARK}]`);
  if (!node) {
    // Prefer updating the FAQ node inside the page @graph when present.
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script.textContent || '{}') as {
          '@type'?: string;
          '@graph'?: Array<Record<string, unknown>>;
        };
        if (parsed['@type'] === 'FAQPage') {
          node = script;
          break;
        }
        if (Array.isArray(parsed['@graph'])) {
          const idx = parsed['@graph'].findIndex((entry) => entry['@type'] === 'FAQPage');
          if (idx >= 0) {
            parsed['@graph'][idx] = schema;
            script.textContent = JSON.stringify(parsed);
            return;
          }
        }
      } catch {
        /* skip invalid blocks */
      }
    }
  }

  if (!node) {
    node = document.createElement('script');
    node.setAttribute('type', 'application/ld+json');
    node.setAttribute(FAQ_SCHEMA_MARK, 'true');
    document.head.appendChild(node);
  }
  node.setAttribute(FAQ_SCHEMA_MARK, 'true');
  node.textContent = JSON.stringify(schema);
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const paragraphs = answer
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const body = paragraphs.length > 0 ? paragraphs : [answer];

  return (
    <details
      className="tsc-faq__item"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) {
          trackEvent('calculator_faq_expanded', {
            calculator_name: CALCULATOR_NAMES.tireDiameter,
            source_page: getSourcePage(),
          });
        }
      }}
    >
      <summary className="tsc-faq__question">{question}</summary>
      <div className="tsc-faq__answer">
        {body.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>
    </details>
  );
}

export function DiameterCalculatorFaq({
  targetDiameterIn,
  wheelSelection,
  closestSize,
  closestDiameterIn,
  toleranceIn,
}: {
  targetDiameterIn: number | null;
  wheelSelection: WheelSelection;
  closestSize?: string | null;
  closestDiameterIn?: number | null;
  toleranceIn: number;
}) {
  const faqRef = useRef<HTMLDivElement>(null);
  useSingleOpenDetails(faqRef);
  const [showAll, setShowAll] = useState(false);

  const faqs = useMemo(
    () =>
      buildDiameterFaqs({
        targetDiameterIn: targetDiameterIn ?? 33,
        wheelDiameterIn: wheelSelection,
        closestSize,
        closestDiameterIn,
        toleranceIn,
      }),
    [targetDiameterIn, wheelSelection, closestSize, closestDiameterIn, toleranceIn],
  );

  const primary = useMemo(
    () => faqs.slice(0, DIAMETER_FAQ_PRIMARY_COUNT),
    [faqs],
  );
  const extra = useMemo(() => faqs.slice(DIAMETER_FAQ_PRIMARY_COUNT), [faqs]);
  const rendered = showAll ? faqs : primary;
  const [left, right] = splitBalancedColumns(rendered);

  useEffect(() => {
    syncFaqJsonLd(rendered);
  }, [showAll, faqs]);

  return (
    <section className="dia-faq tsc-faq" aria-label="Expert FAQ">
      <h2 className="dia-section-title">Expert FAQ</h2>
      <div className="tsc-faq__grid" ref={faqRef}>
        <div className="tsc-faq__column">{left.map((faq) => (
          <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
        ))}</div>
        <div className="tsc-faq__column">{right.map((faq) => (
          <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
        ))}</div>
      </div>
      {!showAll && extra.length > 0 ? (
        <button
          type="button"
          className="tsc-faq__more"
          aria-expanded={false}
          onClick={() => setShowAll(true)}
        >
          Show more
        </button>
      ) : null}
    </section>
  );
}
