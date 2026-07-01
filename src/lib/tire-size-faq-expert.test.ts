import { describe, expect, it } from 'vitest';
import { buildTireSizeHubData } from './tire-size-hub';
import { getExpertFaqForSize } from './tire-size-faq-expert';

const ARTICLE_HEADING_PATTERNS = [
  'considered a balanced',
  'what role does',
  'how does section width influence',
  'market position',
  'architecture play',
];

describe('expert FAQ for 275/70R18', () => {
  it('returns six expert questions', () => {
    const faq = getExpertFaqForSize('275/70R18');
    expect(faq).not.toBeNull();
    expect(faq!.length).toBe(6);
  });

  it('uses searchable owner-style questions', () => {
    const faq = getExpertFaqForSize('275/70R18')!;
    const questions = faq.map((item) => item.question);
    expect(questions).toContain('Is 275/70R18 worth upgrading to?');
    expect(questions).toContain('Does 275/70R18 hurt fuel economy?');
    expect(questions).toContain('Can I run 275/70R18 without a lift?');
    expect(questions).toContain('Does 275/70R18 ride better than stock tires?');
    expect(questions).toContain('Why do overlanders prefer 275/70R18?');
    expect(questions).toContain("What's the difference between 275/70R18 and 285/70R18?");
  });

  it('avoids generic specification and article-heading questions', () => {
    const faq = getExpertFaqForSize('275/70R18')!;
    const questions = faq.map((item) => item.question.toLowerCase()).join(' ');
    expect(questions).not.toContain('what is the diameter');
    expect(questions).not.toContain('33-inch tire');
    expect(questions).not.toContain('what vehicles use');
    for (const pattern of ARTICLE_HEADING_PATTERNS) {
      expect(questions).not.toContain(pattern);
    }
  });

  it('keeps answers in the 80–150 word range', () => {
    const faq = getExpertFaqForSize('275/70R18')!;
    faq.forEach((item, index) => {
      const words = item.answer.trim().split(/\s+/).length;
      expect(words, `answer ${index + 1}: ${words} words`).toBeGreaterThanOrEqual(80);
      expect(words, `answer ${index + 1}: ${words} words`).toBeLessThanOrEqual(150);
    });
  });

  it('wires expert FAQ into hub data for 275/70R18', () => {
    const hub = buildTireSizeHubData('275/70R18');
    expect(hub!.faq[0].question).toBe('Is 275/70R18 worth upgrading to?');
  });
});
