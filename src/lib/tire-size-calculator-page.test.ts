import { describe, expect, it } from 'vitest';
import {
  getVisibleTireSizeCalculatorFaqs,
  TIRE_SIZE_CALCULATOR_FAQ_VISIBLE,
  TIRE_SIZE_CALCULATOR_FAQS,
} from './tire-size-calculator-faqs';
import { buildFaqPageSchema, buildWebApplicationSchema } from './seo/schema';
import { TIRE_SIZE_CALCULATOR_RELATED_TOOLS } from './tire-size-calculator-tools';

describe('tire size calculator page content', () => {
  it('includes eleven FAQ entries with eight visible for schema parity', () => {
    expect(TIRE_SIZE_CALCULATOR_FAQS).toHaveLength(11);
    expect(TIRE_SIZE_CALCULATOR_FAQ_VISIBLE).toBe(8);
    const visible = getVisibleTireSizeCalculatorFaqs();
    expect(visible).toHaveLength(8);
    const schema = buildFaqPageSchema([...visible]);
    expect(schema?.mainEntity).toHaveLength(8);
  });

  it('builds WebApplication schema without review claims', () => {
    const schema = buildWebApplicationSchema({
      name: 'Tire Size Calculator',
      description: 'Calculate tire dimensions.',
      url: '/calculators/tire-size-calculator/',
    });
    expect(schema['@type']).toBe('WebApplication');
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.review).toBeUndefined();
    expect(schema.operatingSystem).toBe('Any');
  });

  it('lists only existing related calculator routes', () => {
    for (const tool of TIRE_SIZE_CALCULATOR_RELATED_TOOLS) {
      expect(tool.href).toMatch(/^\/calculators\/.+\/$/);
    }
    expect(TIRE_SIZE_CALCULATOR_RELATED_TOOLS.some((t) => t.label.includes('Aspect'))).toBe(
      false,
    );
  });
});
