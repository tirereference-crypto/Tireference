import { describe, expect, it } from 'vitest';
import {
  ENGINEERING_ANALYSIS_SECTION_ORDER,
  ENGINEERING_SECTION_PROMPTS,
  ENGINEERING_VOICE,
  WRITING_STYLE_RULES,
  buildEngineeringSectionPrompt,
  buildEngineeringSystemPrompt,
} from './tire-comparison-engineering-prompts';
import {
  QUALITY_REVIEW_CHECK_IDS,
  QUALITY_REVIEW_CRITERIA,
  buildQualityReviewSystemPrompt,
} from './tire-comparison-quality-prompts';

describe('tire-comparison-engineering-prompts', () => {
  it('defines a complete section prompt for every ordered section', () => {
    for (const id of ENGINEERING_ANALYSIS_SECTION_ORDER) {
      const prompt = ENGINEERING_SECTION_PROMPTS[id];
      expect(prompt.title.length).toBeGreaterThan(0);
      expect(prompt.objective.length).toBeGreaterThan(20);
      expect(prompt.reasoningPattern.length).toBeGreaterThan(20);
      expect(prompt.allowedFacts.length).toBeGreaterThan(0);
      expect(prompt.forbidden.length).toBeGreaterThan(0);
      expect(prompt.maxSentences).toBeGreaterThanOrEqual(3);
    }
  });

  it('requires evidence-based engineer voice with measurement citation', () => {
    const system = buildEngineeringSystemPrompt();
    expect(system).toContain('measurement');
    expect(system).toContain('trade-offs');
    expect(ENGINEERING_VOICE.tone).toContain('evidence-based');
    expect(WRITING_STYLE_RULES.measurementCitation.length).toBeGreaterThan(0);
  });

  it('builds section prompts with reasoning pattern and limits', () => {
    const sectionPrompt = buildEngineeringSectionPrompt('handling');
    expect(sectionPrompt).toContain('Reasoning pattern');
    expect(sectionPrompt).toContain('Forbidden');
    expect(sectionPrompt).toContain('Max sentences');
  });
});

describe('tire-comparison-quality-prompts', () => {
  it('maps every check id to a criterion with pass condition', () => {
    const criterionIds = QUALITY_REVIEW_CRITERIA.map((c) => c.id);
    expect(criterionIds.sort()).toEqual([...QUALITY_REVIEW_CHECK_IDS].sort());
    for (const criterion of QUALITY_REVIEW_CRITERIA) {
      expect(criterion.passCondition.length).toBeGreaterThan(10);
    }
  });

  it('includes reasoning and repetition checks in reviewer system prompt', () => {
    const system = buildQualityReviewSystemPrompt();
    expect(system).toContain('conclusion');
    expect(system).toContain('Section roles');
  });
});
