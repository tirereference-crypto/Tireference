import { describe, expect, it } from 'vitest';
import { GEAR_FAQS } from './gear-ratio-insights';
import { buildPageSchema, calculatorBreadcrumbs } from './seo/page-schemas';
import { SEO_DESCRIPTIONS } from './seo/constants';

describe('gear ratio page SEO / schema', () => {
  it('FAQ schema matches exactly six visible FAQs', () => {
    expect(GEAR_FAQS).toHaveLength(6);
    const schema = buildPageSchema({
      breadcrumbs: calculatorBreadcrumbs('Gear Ratio Calculator'),
      faqs: GEAR_FAQS.map((faq) => ({ question: faq.question, answer: faq.answer })),
    });
    expect(schema).toBeTruthy();
    const serialized = JSON.stringify(schema);
    expect(serialized).toContain('FAQPage');
    expect(serialized).toContain(GEAR_FAQS[0].question);
    expect(serialized).not.toContain('Alex Morgan');
    expect(serialized).not.toContain('Jamie Chen');
    expect(serialized).not.toContain('How Our Calculators Work');
    expect(serialized).not.toContain('author');
    expect(serialized).not.toMatch(/Worth Regearing|guaranteed vehicle performance/i);
  });

  it('meta description covers tire size and axle ratio without query-state injection', () => {
    expect(SEO_DESCRIPTIONS.gearRatioCalculator).toMatch(/tire/i);
    expect(SEO_DESCRIPTIONS.gearRatioCalculator).toMatch(/axle|gearing|gear ratio/i);
    expect(SEO_DESCRIPTIONS.gearRatioCalculator).not.toMatch(/stock=|ratio=/);
  });
});
