import type { UnitSystem } from './calculator-types';
import { buildComparisonAnalysis } from './tire-comparison-engineering-analysis';
import {
  formatCircumference,
  formatCircumferenceDiff,
  formatDimension,
  formatDimensionDiff,
  formatRevsDiff,
  formatRevsLabel,
  formatRevsValue,
} from './tire-comparison-units';
import { fmtDiffWithPct, fmtInQuote, fmtPct, fmtSigned } from './tire-comparison-format';
import type { SpecTableRow } from './tire-comparison-types';
import type { TireComparison, TireSpecs } from './tire-math';

function fmtDiffWithPctUnit(signedIn: number, pct: number, unitSystem: UnitSystem) {
  if (unitSystem === 'metric') {
    return `${formatDimensionDiff(signedIn, unitSystem)} (${fmtPct(pct)})`;
  }
  return fmtDiffWithPct(signedIn, pct);
}

function fmtCircDiffWithPct(signedIn: number, pct: number, unitSystem: UnitSystem) {
  return `${formatCircumferenceDiff(signedIn, unitSystem)} (${fmtPct(pct)})`;
}

function toneFromSigned(value: number): 'positive' | 'negative' | 'neutral' {
  if (Math.abs(value) < 0.005) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

/** Extend two-tire spec rows with a third column vs the same current baseline. */
export function appendThirdTireSpecRows(
  baseRows: SpecTableRow[],
  sizeA: string,
  sizeC: string,
  comparisonAC: TireComparison,
  specsA: TireSpecs,
  specsC: TireSpecs,
  unitSystem: UnitSystem,
): SpecTableRow[] {
  const { measurements: m } = buildComparisonAnalysis(
    sizeA,
    sizeC,
    comparisonAC,
    specsA,
    specsC,
    unitSystem,
  );

  const thirdByLabel: Record<string, Pick<SpecTableRow, 'thirdTire' | 'thirdDifference' | 'thirdTone'>> =
    unitSystem === 'metric'
      ? {
          Diameter: {
            thirdTire: formatDimension(specsC.overallDiameterIn, unitSystem),
            thirdDifference: fmtDiffWithPctUnit(m.diamDiffIn, comparisonAC.diameterDiffPercent, unitSystem),
            thirdTone: toneFromSigned(m.diamDiffIn),
          },
          Width: {
            thirdTire: formatDimension(specsC.sectionWidthIn, unitSystem),
            thirdDifference: fmtDiffWithPctUnit(m.widthDiffIn, m.widthPct, unitSystem),
            thirdTone: toneFromSigned(m.widthDiffIn),
          },
          Sidewall: {
            thirdTire: formatDimension(specsC.sidewallIn, unitSystem),
            thirdDifference: fmtDiffWithPctUnit(m.sidewallDiffIn, m.sidewallPct, unitSystem),
            thirdTone: toneFromSigned(m.sidewallDiffIn),
          },
          Circumference: {
            thirdTire: formatCircumference(specsC.circumferenceIn, unitSystem),
            thirdDifference: fmtCircDiffWithPct(
              m.circumferenceDiffIn,
              comparisonAC.diameterDiffPercent,
              unitSystem,
            ),
            thirdTone: toneFromSigned(m.circumferenceDiffIn),
          },
          [formatRevsLabel(unitSystem)]: {
            thirdTire: formatRevsValue(specsC, unitSystem),
            thirdDifference: `${formatRevsDiff(m.revsDiff, unitSystem, specsA, specsC)} (${fmtPct(m.revsDiffPct)})`,
            thirdTone: toneFromSigned(-m.revsDiff),
          },
          'Speedo Error': {
            thirdTire: fmtPct(comparisonAC.speedometer.errorPercent),
            thirdDifference: `At ${m.indicatedSpeed} ${m.speedUnit}`,
            thirdTone: 'neutral',
          },
        }
      : {
          Diameter: {
            thirdTire: fmtInQuote(specsC.overallDiameterIn),
            thirdDifference: fmtDiffWithPct(m.diamDiffIn, comparisonAC.diameterDiffPercent),
            thirdTone: toneFromSigned(m.diamDiffIn),
          },
          Width: {
            thirdTire: fmtInQuote(specsC.sectionWidthIn),
            thirdDifference: fmtDiffWithPct(m.widthDiffIn, m.widthPct),
            thirdTone: toneFromSigned(m.widthDiffIn),
          },
          Sidewall: {
            thirdTire: fmtInQuote(specsC.sidewallIn),
            thirdDifference: fmtDiffWithPct(m.sidewallDiffIn, m.sidewallPct),
            thirdTone: toneFromSigned(m.sidewallDiffIn),
          },
          Circumference: {
            thirdTire: fmtInQuote(specsC.circumferenceIn),
            thirdDifference: fmtDiffWithPct(m.circumferenceDiffIn, comparisonAC.diameterDiffPercent),
            thirdTone: toneFromSigned(m.circumferenceDiffIn),
          },
          'Revs per Mile': {
            thirdTire: specsC.revsPerMile.toFixed(1),
            thirdDifference: `${fmtSigned(m.revsDiff, 1)} (${fmtPct(m.revsDiffPct)})`,
            thirdTone: toneFromSigned(-m.revsDiff),
          },
          'Speedo Error': {
            thirdTire: fmtPct(comparisonAC.speedometer.errorPercent),
            thirdDifference: `At ${m.indicatedSpeed} ${m.speedUnit}`,
            thirdTone: 'neutral',
          },
        };

  return baseRows.map((row) => {
    const third = thirdByLabel[row.label];
    if (!third) return row;
    return { ...row, ...third };
  });
}
