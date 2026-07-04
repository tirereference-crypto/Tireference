import { describe, expect, it } from 'vitest';
import { compareTires, getTireSpecs } from './tire-math';
import {
  buildEngineeringAnalysis,
  buildHandlingCardLabels,
} from './tire-comparison-engineering-analysis';
import { ENGINEERING_ANALYSIS_SECTION_ORDER, ENGINEERING_SECTION_PROMPTS } from './tire-comparison-engineering-prompts';

describe('buildEngineeringAnalysis', () => {
  it('produces all nine measurement-driven sections', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const analysis = buildEngineeringAnalysis(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );

    expect(analysis.sections).toHaveLength(9);
    expect(analysis.sections.map((s) => s.id)).toEqual([...ENGINEERING_ANALYSIS_SECTION_ORDER]);

    for (const section of analysis.sections) {
      expect(section.title).toBe(ENGINEERING_SECTION_PROMPTS[section.id].title);
      expect(section.body.length).toBeGreaterThan(50);
    }
  });

  it('never uses forbidden marketing language in sections', () => {
    const pairs: [string, string][] = [
      ['225/45R17', '235/40R18'],
      ['275/70R18', '285/75R18'],
      ['265/70R17', '245/70R16'],
    ];

    const banned = [
      /aggressive upgrade/i,
      /trail ready/i,
      /39% better/i,
      /improved handling/i,
      /better handling/i,
      /save \d+%/i,
      /mpg will improve/i,
    ];

    for (const [sizeA, sizeB] of pairs) {
      const analysis = buildEngineeringAnalysis(
        sizeA,
        sizeB,
        compareTires(sizeA, sizeB, 60),
        getTireSpecs(sizeA),
        getTireSpecs(sizeB),
      );

      for (const section of analysis.sections) {
        for (const pattern of banned) {
          expect(section.body).not.toMatch(pattern);
        }
      }
    }
  });

  it('references actual measurements in ride quality and handling sections', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const analysis = buildEngineeringAnalysis(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      specsA,
      specsB,
    );

    expect(analysis.byId['ride-quality'].body).toContain(String(specsA.aspectRatio));
    expect(analysis.byId.handling.body).toContain('sidewall');
    expect(analysis.byId['fuel-economy'].body).toMatch(/RPM|revs/i);
    expect(analysis.byId.recommendation.body).toContain('Fitment score');
  });

  it('buildHandlingCardLabels uses sidewall delta instead of generic Improved', () => {
    const specsA = getTireSpecs('225/45R17');
    const specsB = getTireSpecs('235/40R18');
    const labels = buildHandlingCardLabels(specsA, specsB);

    expect(labels.value).not.toBe('Improved');
    expect(labels.value).not.toBe('Balanced');
    expect(labels.explanation).toContain('sidewall');
  });
});
