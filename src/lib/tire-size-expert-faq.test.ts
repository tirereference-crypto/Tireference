import { describe, expect, it } from 'vitest';
import { getExpertFaqsForTireSize } from './tire-size-expert-faq';
import { getTireSpecs } from './tire-math';
import { buildGuide275Data } from './tire-size-275-guide';

describe('getExpertFaqsForTireSize — 275/70R18', () => {
  it('returns six expert FAQs in user-focused order', () => {
    const specs = getTireSpecs('275/70R18');
    const faq = getExpertFaqsForTireSize({
      size: '275/70R18',
      specs,
      loadRanges: ['E', 'D', 'C'],
      brands: ['BFGoodrich', 'Toyo', 'Falken', 'Goodyear', 'Michelin'],
    });
    expect(faq).toHaveLength(6);
    expect(faq!.map((f) => f.question)).toEqual([
      'Is 275/70R18 good for off-road?',
      'What vehicles use 275/70R18 tires?',
      'What load ranges are available?',
      'Which brands make 275/70R18 tires?',
      'How does 275/70R18 compare to 265/70R17?',
      'What is the load capacity of 275/70R18?',
    ]);
  });

  it('avoids generic / overclaiming language', () => {
    const specs = getTireSpecs('275/70R18');
    const answers = getExpertFaqsForTireSize({ size: '275/70R18', specs })!
      .map((f) => f.answer.toLowerCase())
      .join(' ');
    expect(answers).toContain('commonly upgraded to');
    expect(answers).toContain('most often seen');
    expect(answers).not.toContain('fits all');
    expect(answers).not.toContain('best tire size');
    expect(answers).not.toContain('perfect');
  });

  it('uses calculated diameters in the 265/70R17 comparison', () => {
    const specs = getTireSpecs('275/70R18');
    const compare = getExpertFaqsForTireSize({ size: '275/70R18', specs })!.find(
      (f) => f.question.includes('265/70R17'),
    )!;
    expect(compare.answer).toContain('33.16"');
    expect(compare.answer).toContain('31.61"');
  });

  it('lists indexed brands dynamically', () => {
    const specs = getTireSpecs('275/70R18');
    const faq = getExpertFaqsForTireSize({
      size: '275/70R18',
      specs,
      brands: ['BFGoodrich', 'Goodyear', 'Michelin'],
    })!;
    const brandsQ = faq.find((f) => f.question.includes('brands'))!;
    expect(brandsQ.answer).toContain('BFGoodrich');
    expect(brandsQ.answer).toContain('Goodyear');
    expect(brandsQ.answer).toContain('Michelin');
  });

  it('wires the same FAQ into the 275 guide (visible + schema source)', () => {
    const guide = buildGuide275Data(getTireSpecs('275/70R18'));
    expect(guide.faq).toHaveLength(6);
    expect(guide.faq[0].question).toBe('Is 275/70R18 good for off-road?');
    expect(guide.faq[3].question).toContain('brands');
  });
});
