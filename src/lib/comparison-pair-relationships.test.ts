import { describe, expect, it } from 'vitest';
import {
  buildComparisonPairRelationships,
  formatSpeedExamples,
  getSharedTireModels,
} from './comparison-pair-relationships';
import { FITMENT_DIAMETER_PCT } from './tire-comparison-fitment';
import { compareTires, getTireSpecs } from './tire-math';

function relationships(a: string, b: string) {
  return buildComparisonPairRelationships(
    a,
    b,
    compareTires(a, b, 60),
    getTireSpecs(a),
    getTireSpecs(b),
  );
}

describe('comparison pair relationships', () => {
  it('classifies a different-wheel plus-size with shorter sidewall', () => {
    const result = relationships('225/45R17', '235/40R18');
    expect(result.sizingMode).toBe('plus-size');
    expect(result.sameWheelDiameter).toBe(false);
    expect(result.canReuseWheelDiameter).toBe(false);
    expect(result.diameterDirection).toBe('increase');
    expect(result.widthDirection).toBe('increase');
    expect(result.sidewallDirection).toBe('decrease');
    expect(result.clearanceDirection).toBe('increase');
    expect(result.gearingDirection).toBe('taller');
    expect(result.diameterInsideComparisonThreshold).toBe(true);
  });

  it('classifies the reverse pair as a downsize with shorter gearing', () => {
    const result = relationships('235/40R18', '225/45R17');
    expect(result.sizingMode).toBe('downsize');
    expect(result.wheelDirection).toBe('decrease');
    expect(result.diameterDirection).toBe('decrease');
    expect(result.widthDirection).toBe('decrease');
    expect(result.sidewallDirection).toBe('increase');
    expect(result.clearanceDirection).toBe('decrease');
    expect(result.gearingDirection).toBe('shorter');
  });

  it('classifies a same-wheel taller and wider replacement', () => {
    const result = relationships('275/70R18', '285/70R18');
    expect(result.sizingMode).toBe('same-wheel');
    expect(result.canReuseWheelDiameter).toBe(true);
    expect(result.widthDirection).toBe('increase');
    expect(result.sidewallDirection).toBe('increase');
    expect(result.diameterDirection).toBe('increase');
    expect(result.revsPerMileDiff).toBeLessThan(0);
  });

  it('classifies a same-wheel narrower and shorter replacement', () => {
    const result = relationships('285/70R17', '265/70R17');
    expect(result.sizingMode).toBe('same-wheel');
    expect(result.widthDirection).toBe('decrease');
    expect(result.sidewallDirection).toBe('decrease');
    expect(result.diameterDirection).toBe('decrease');
    expect(result.clearanceDirection).toBe('decrease');
    expect(result.gearingDirection).toBe('shorter');
  });

  it('adds AWD caution only outside the shared diameter threshold', () => {
    const result = relationships('275/70R18', '305/70R18');
    expect(Math.abs(result.diameterDiffPercent)).toBeGreaterThan(FITMENT_DIAMETER_PCT.pass);
    expect(result.diameterInsideComparisonThreshold).toBe(false);
    expect(result.awdCaution).toBe(true);
    expect(result.diameterStatus).not.toBe('pass');
  });

  it('calculates 30, 60 and 75 mph road speeds from the diameter ratio', () => {
    const result = relationships('225/45R17', '235/40R18');
    expect(result.speedExamples.map((row) => row.indicatedMph)).toEqual([30, 60, 75]);
    expect(result.speedExamples[1].actualMph).toBeCloseTo(
      60 * (getTireSpecs('235/40R18').overallDiameterIn /
        getTireSpecs('225/45R17').overallDiameterIn),
      8,
    );
    expect(formatSpeedExamples(result.speedExamples)).toMatch(
      /30 indicated = \d+\.\d mph actual; 60 indicated = \d+\.\d mph actual; 75 indicated = \d+\.\d mph actual/,
    );
  });

  it('reports database-backed brand/model overlap without service duplicates', () => {
    const shared = getSharedTireModels('225/45R17', '235/40R18');
    expect(shared.length).toBeGreaterThan(0);
    expect(new Set(shared.map((model) => `${model.brand}|${model.model}`)).size).toBe(
      shared.length,
    );
    expect(shared.some((model) => /falken/i.test(model.brand))).toBe(true);
  });
});
