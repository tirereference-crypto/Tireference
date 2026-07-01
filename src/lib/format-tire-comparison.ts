import type { UnitSystem, StatDisplay, StatValueColor } from './calculator-types';
import type { TireComparison, TireSpecs } from './tire-math';

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatSigned(value: number, decimals: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}`;
}

function colorFromSigned(value: number): StatValueColor {
  if (Math.abs(value) < 0.001) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

function beforeAfter(before: string, after: string): string {
  return `${before} → ${after}`;
}

/** One-line summary of how the new tire differs from the current tire. */
export function buildComparisonVerdict(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): string {
  const parts: string[] = [];

  const diamPct = comparison.diameterDiffPercent;
  if (Math.abs(diamPct) >= 0.05) {
    parts.push(
      `${Math.abs(diamPct).toFixed(1)}% ${diamPct > 0 ? 'taller' : 'shorter'}`,
    );
  }

  const widthPct =
    ((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100;
  if (Math.abs(widthPct) >= 0.05) {
    parts.push(
      `${Math.abs(widthPct).toFixed(1)}% ${widthPct > 0 ? 'wider' : 'narrower'}`,
    );
  }

  if (parts.length === 0) {
    return 'New tire is effectively the same size as your current tire.';
  }

  return `New tire is ${parts.join(' and ')}.`;
}

export function formatTireComparisonResults(
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem,
): StatDisplay[] {
  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';
  const { speedometer } = comparison;

  if (unitSystem === 'imperial') {
    const widthDiff = specsB.sectionWidthIn - specsA.sectionWidthIn;
    const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;

    return [
      {
        label: 'Overall diameter change',
        value: formatPercent(comparison.diameterDiffPercent),
        unit: `${formatNumber(comparison.diameterDiffIn, 2)} in`,
        subtext: beforeAfter(
          `${formatNumber(specsA.overallDiameterIn, 2)} in`,
          `${formatNumber(specsB.overallDiameterIn, 2)} in`,
        ),
        valueColor: colorFromSigned(comparison.diameterDiffPercent),
      },
      {
        label: 'Section width change',
        value: formatSigned(widthDiff, 2),
        unit: 'in',
        subtext: beforeAfter(
          `${formatNumber(specsA.sectionWidthIn, 2)} in`,
          `${formatNumber(specsB.sectionWidthIn, 2)} in`,
        ),
        valueColor: colorFromSigned(widthDiff),
      },
      {
        label: 'Sidewall height change',
        value: formatSigned(sidewallDiff, 2),
        unit: 'in',
        subtext: beforeAfter(
          `${formatNumber(specsA.sidewallIn, 2)} in`,
          `${formatNumber(specsB.sidewallIn, 2)} in`,
        ),
        valueColor: colorFromSigned(sidewallDiff),
      },
      {
        label: 'Circumference change',
        value: formatSigned(comparison.circumferenceDiffIn, 2),
        unit: 'in',
        subtext: beforeAfter(
          `${formatNumber(specsA.circumferenceIn, 2)} in`,
          `${formatNumber(specsB.circumferenceIn, 2)} in`,
        ),
        valueColor: colorFromSigned(comparison.circumferenceDiffIn),
      },
      {
        label: 'Revolutions per mile change',
        value: formatPercent(comparison.revsPerMileDiffPercent),
        unit: `${formatSigned(comparison.revsPerMileDiff, 0)} revs/mi`,
        subtext: beforeAfter(
          `${formatNumber(specsA.revsPerMile, 0)} revs/mi`,
          `${formatNumber(specsB.revsPerMile, 0)} revs/mi`,
        ),
        valueColor: colorFromSigned(comparison.revsPerMileDiffPercent),
      },
      {
        label: 'Speedometer',
        value: formatNumber(speedometer.trueSpeed, 1),
        unit: `${speedUnit} true`,
        subtext: `At ${formatNumber(speedometer.indicatedSpeed, 0)} ${speedUnit} indicated (${formatPercent(speedometer.errorPercent)})`,
        valueColor: colorFromSigned(speedometer.errorPercent),
      },
      {
        label: 'Ground clearance change',
        value: formatSigned(comparison.groundClearanceChangeIn, 2),
        unit: 'in',
        subtext: beforeAfter(
          `${formatNumber(specsA.overallDiameterIn / 2, 2)} in radius`,
          `${formatNumber(specsB.overallDiameterIn / 2, 2)} in radius`,
        ),
        valueColor: colorFromSigned(comparison.groundClearanceChangeIn),
      },
    ];
  }

  const circumferenceDiffMm = comparison.circumferenceDiffIn * 25.4;
  const revsPerKmDiff = specsB.revsPerKm - specsA.revsPerKm;
  const revsPerKmDiffPercent =
    ((specsB.revsPerKm - specsA.revsPerKm) / specsA.revsPerKm) * 100;
  const clearanceDiffMm = comparison.groundClearanceChangeIn * 25.4;

  return [
    {
      label: 'Overall diameter change',
      value: formatPercent(comparison.diameterDiffPercent),
      unit: `${formatNumber(comparison.diameterDiffMm, 1)} mm`,
      subtext: beforeAfter(
        `${formatNumber(specsA.overallDiameterMm, 1)} mm`,
        `${formatNumber(specsB.overallDiameterMm, 1)} mm`,
      ),
      valueColor: colorFromSigned(comparison.diameterDiffPercent),
    },
    {
      label: 'Section width change',
      value: formatSigned(comparison.widthDiffMm, 1),
      unit: 'mm',
      subtext: beforeAfter(
        `${formatNumber(specsA.widthMm, 1)} mm`,
        `${formatNumber(specsB.widthMm, 1)} mm`,
      ),
      valueColor: colorFromSigned(comparison.widthDiffMm),
    },
    {
      label: 'Sidewall height change',
      value: formatSigned(comparison.sidewallDiffMm, 1),
      unit: 'mm',
      subtext: beforeAfter(
        `${formatNumber(specsA.sidewallMm, 1)} mm`,
        `${formatNumber(specsB.sidewallMm, 1)} mm`,
      ),
      valueColor: colorFromSigned(comparison.sidewallDiffMm),
    },
    {
      label: 'Circumference change',
      value: formatSigned(circumferenceDiffMm / 10, 1),
      unit: 'cm',
      subtext: beforeAfter(
        `${formatNumber(specsA.circumferenceMm / 10, 1)} cm`,
        `${formatNumber(specsB.circumferenceMm / 10, 1)} cm`,
      ),
      valueColor: colorFromSigned(circumferenceDiffMm),
    },
    {
      label: 'Revolutions per km change',
      value: formatPercent(revsPerKmDiffPercent),
      unit: `${formatSigned(revsPerKmDiff, 0)} revs/km`,
      subtext: beforeAfter(
        `${formatNumber(specsA.revsPerKm, 0)} revs/km`,
        `${formatNumber(specsB.revsPerKm, 0)} revs/km`,
      ),
      valueColor: colorFromSigned(revsPerKmDiffPercent),
    },
    {
      label: 'Speedometer',
      value: formatNumber(speedometer.trueSpeed, 1),
      unit: `${speedUnit} true`,
      subtext: `At ${formatNumber(speedometer.indicatedSpeed, 0)} ${speedUnit} indicated (${formatPercent(speedometer.errorPercent)})`,
      valueColor: colorFromSigned(speedometer.errorPercent),
    },
    {
      label: 'Ground clearance change',
      value: formatSigned(clearanceDiffMm, 1),
      unit: 'mm',
      subtext: beforeAfter(
        `${formatNumber(specsA.overallDiameterMm / 2, 1)} mm radius`,
        `${formatNumber(specsB.overallDiameterMm / 2, 1)} mm radius`,
      ),
      valueColor: colorFromSigned(clearanceDiffMm),
    },
  ];
}
