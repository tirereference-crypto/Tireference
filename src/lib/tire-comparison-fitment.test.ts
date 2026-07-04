import { describe, expect, it } from 'vitest';
import {
  FITMENT_SCORE,
  fitmentLabelFromScore,
  recommendationFromScore,
  verdictLabelFromScore,
} from './tire-comparison-fitment';

describe('tire-comparison-fitment', () => {
  it('uses aligned score bands for label and verdict', () => {
    expect(fitmentLabelFromScore(9).label).toBe('Excellent Fit');
    expect(recommendationFromScore(9).label).toBe('Excellent Upgrade');
    expect(verdictLabelFromScore(9).label).toBe('Excellent Upgrade');

    expect(fitmentLabelFromScore(7).label).toBe('Acceptable Fit');
    expect(recommendationFromScore(7).label).toBe('Good Upgrade');
    expect(verdictLabelFromScore(7).tone).toBe('yellow');

    expect(fitmentLabelFromScore(6).label).toBe('Use Caution');
    expect(recommendationFromScore(6).label).toBe('Not Recommended');
  });

  it('documents unified thresholds', () => {
    expect(FITMENT_SCORE.EXCELLENT).toBe(8.5);
    expect(FITMENT_SCORE.ACCEPTABLE).toBe(6.5);
  });
});
