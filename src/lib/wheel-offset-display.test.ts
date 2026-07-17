import { describe, expect, it } from 'vitest';
import { compareWheelSetups } from './wheel-offset-math';
import {
  formatBackspacingPrimary,
  formatBackspacingSecondary,
  formatInnerChangePrimary,
  formatInnerChangeSecondary,
  formatOffsetChangePrimary,
  formatOffsetChangeSecondary,
  formatOuterChangePrimary,
  formatOuterChangeSecondary,
  formatTrackWidthPrimary,
  formatTrackWidthSecondary,
} from './wheel-offset-display';

describe('wheel offset display formatters', () => {
  it('uses direction-based primary labels without leading signs', () => {
    expect(formatOffsetChangePrimary(-20)).toBe('20 mm lower offset');
    expect(formatOffsetChangePrimary(10)).toBe('10 mm higher offset');
    expect(formatOffsetChangePrimary(0)).toBe('No offset change');

    expect(formatInnerChangePrimary(-2.3)).toBe('2.3 mm more inner clearance');
    expect(formatInnerChangePrimary(12.7)).toBe('12.7 mm closer to suspension');

    expect(formatOuterChangePrimary(27.7)).toBe('27.7 mm farther outward');
    expect(formatOuterChangePrimary(8.4)).toBe('8.4 mm farther outward');
    expect(formatOuterChangePrimary(-8.4)).toBe('8.4 mm farther inward');

    expect(formatTrackWidthPrimary(55.4)).toBe('55.4 mm wider across the axle');
    expect(formatTrackWidthPrimary(-20)).toBe('20 mm narrower across the axle');
    expect(formatTrackWidthPrimary(0)).toBe('No estimated track-width change');

    expect(formatBackspacingPrimary(-0.09)).toBe('0.09 in less backspacing');
    expect(formatBackspacingPrimary(0.25)).toBe('0.25 in more backspacing');
  });

  it('uses explanatory secondary copy that does not repeat the primary', () => {
    expect(formatOffsetChangeSecondary(-15)).toBe('Mounting position shifts outward');
    expect(formatOffsetChangeSecondary(10)).toBe('Mounting position shifts inward');
    expect(formatOffsetChangeSecondary(0)).toBe('Mounting position remains unchanged');

    expect(formatInnerChangeSecondary(-2.3)).toBe('More room toward the suspension');
    expect(formatInnerChangeSecondary(12.7)).toBe('Reduced space toward the suspension');
    expect(formatInnerChangeSecondary(0)).toBe('Same inner position as current');

    expect(formatOuterChangeSecondary(27.7)).toBe('Extends farther toward the fender');
    expect(formatOuterChangeSecondary(-8.4)).toBe('Sits farther inside the wheel arch');
    expect(formatOuterChangeSecondary(0)).toBe('Same outer position as current');

    expect(formatTrackWidthSecondary(55.4)).toBe('Estimated when fitted on both sides');
    expect(formatTrackWidthSecondary(-16.8)).toBe('Estimated when fitted on both sides');
    expect(formatTrackWidthSecondary(0)).toBe('Outer wheel position is unchanged');

    expect(formatBackspacingSecondary(5.29)).toBe('New backspacing: 5.29 in');
    expect(formatBackspacingSecondary(6.12)).toBe('New backspacing: 6.12 in');
  });

  it('matches comparison test case B wording', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 8, diameterIn: 18, offsetMm: 15 },
    );
    expect(formatOffsetChangePrimary(comparison.offsetDifferenceMm)).toBe('20 mm lower offset');
    expect(formatInnerChangePrimary(comparison.innerClearanceChangeMm)).toBe(
      '20 mm more inner clearance',
    );
    expect(formatOuterChangePrimary(comparison.outerPositionChangeMm)).toBe(
      '20 mm farther outward',
    );
    expect(formatTrackWidthPrimary(comparison.trackWidthChangeMm)).toBe(
      '40 mm wider across the axle',
    );
    expect(formatBackspacingSecondary(comparison.newBackspacingIn)).toMatch(
      /^New backspacing: /,
    );
  });

  it('shows no-change primaries without duplicated secondary wording for identical wheels', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
    );
    expect(formatOffsetChangePrimary(comparison.offsetDifferenceMm)).toBe('No offset change');
    expect(formatOffsetChangeSecondary(comparison.offsetDifferenceMm)).toBe(
      'Mounting position remains unchanged',
    );
    expect(formatInnerChangePrimary(comparison.innerClearanceChangeMm)).toBe(
      'No inner position change',
    );
    expect(formatInnerChangeSecondary(comparison.innerClearanceChangeMm)).toBe(
      'Same inner position as current',
    );
    expect(formatOuterChangePrimary(comparison.outerPositionChangeMm)).toBe(
      'No outer position change',
    );
    expect(formatOuterChangeSecondary(comparison.outerPositionChangeMm)).toBe(
      'Same outer position as current',
    );
    expect(formatTrackWidthPrimary(comparison.trackWidthChangeMm)).toBe(
      'No estimated track-width change',
    );
    expect(formatTrackWidthSecondary(comparison.trackWidthChangeMm)).toBe(
      'Outer wheel position is unchanged',
    );
    expect(formatBackspacingPrimary(comparison.backspacingDifferenceIn)).toBe(
      'No backspacing change',
    );
    expect(formatBackspacingSecondary(comparison.newBackspacingIn)).not.toBe(
      formatBackspacingPrimary(comparison.backspacingDifferenceIn),
    );
  });
});
