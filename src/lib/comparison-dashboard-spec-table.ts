/**
 * Dashboard specification table builder.
 * Uses existing tire-math / insights formatting — does not duplicate formula logic.
 */
import type { UnitSystem } from './calculator-types';
import type { ComparisonDataSourceSummary, PublishedTireMeasurements } from './comparison-data-sources';
import { fmtDiffWithPct, fmtInQuote, fmtPct, fmtSigned } from './tire-comparison-format';
import type { SpecTableRow } from './tire-comparison-types';
import {
  formatCircumference,
  formatCircumferenceDiff,
  formatDimension,
  formatDimensionDiff,
  formatRevsDiff,
  formatRevsLabel,
  formatRevsValue,
} from './tire-comparison-units';
import type { TireComparison, TireSpecs } from './tire-math';

export const SPEC_SOURCE_LABELS = {
  nominal_calculation: 'Nominal calculation',
  manufacturer_published: 'Manufacturer-published',
  calculated_from_published: 'Calculated from published dimensions',
  dataset_derived: 'Dataset-derived',
  vehicle_specific_check: 'Vehicle-specific check required',
} as const;

export type SpecSourceKey = keyof typeof SPEC_SOURCE_LABELS;

function formatPublishedDim(value: number | null, unitSystem: UnitSystem): string {
  if (value == null) return '—';
  return formatDimension(value, unitSystem);
}

function hasAnyPublished(
  a: PublishedTireMeasurements | null,
  b: PublishedTireMeasurements | null,
  pick: (p: PublishedTireMeasurements) => string | number | null | undefined,
): boolean {
  const va = a ? pick(a) : null;
  const vb = b ? pick(b) : null;
  const present = (v: string | number | null | undefined) =>
    v != null && v !== '' && !(typeof v === 'number' && !Number.isFinite(v));
  return present(va) || present(vb);
}

function publishedCell(
  published: PublishedTireMeasurements | null,
  pick: (p: PublishedTireMeasurements) => string | number | null | undefined,
  format: (v: string | number) => string,
): { text: string; sourceLabel?: string } {
  if (!published) return { text: '—' };
  const raw = pick(published);
  if (raw == null || raw === '') return { text: '—' };
  return {
    text: format(raw),
    sourceLabel: SPEC_SOURCE_LABELS.manufacturer_published,
  };
}

/**
 * Build the dashboard Specification Table rows (nominal first, published optional).
 * Headline dimensional rows always use formula-calculated nominal values.
 */
export function buildComparisonDashboardSpecRows(input: {
  specsA: TireSpecs;
  specsB: TireSpecs;
  comparison: TireComparison;
  unitSystem: UnitSystem;
  dataSources: ComparisonDataSourceSummary;
}): SpecTableRow[] {
  const { specsA, specsB, comparison, unitSystem, dataSources } = input;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDiff = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const circDiff = specsB.circumferenceIn - specsA.circumferenceIn;
  const revsDiff =
    unitSystem === 'metric'
      ? specsB.revsPerKm - specsA.revsPerKm
      : specsB.revsPerMile - specsA.revsPerMile;
  const revsPct =
    unitSystem === 'metric'
      ? (revsDiff / specsA.revsPerKm) * 100
      : comparison.revsPerMileDiffPercent;
  const widthPct = (widthDiff / specsA.sectionWidthIn) * 100;
  const sidewallPct = (sidewallDiff / specsA.sidewallIn) * 100;
  const indicated = comparison.speedometer.indicatedSpeed;
  const trueSpeed = comparison.speedometer.trueSpeed;
  const speedUnit = unitSystem === 'metric' ? 'km/h' : 'mph';
  const nominal = SPEC_SOURCE_LABELS.nominal_calculation;

  const rows: SpecTableRow[] = [
    {
      label: 'Overall diameter',
      current:
        unitSystem === 'metric'
          ? formatDimension(specsA.overallDiameterIn, unitSystem)
          : fmtInQuote(specsA.overallDiameterIn),
      newTire:
        unitSystem === 'metric'
          ? formatDimension(specsB.overallDiameterIn, unitSystem)
          : fmtInQuote(specsB.overallDiameterIn),
      difference:
        unitSystem === 'metric'
          ? `${formatDimensionDiff(diamDiff, unitSystem)} (${fmtPct(comparison.diameterDiffPercent)})`
          : fmtDiffWithPct(diamDiff, comparison.diameterDiffPercent),
      tone: Math.abs(diamDiff) < 0.001 ? 'neutral' : diamDiff > 0 ? 'positive' : 'negative',
      source: 'nominal_calculation',
      sourceLabel: nominal,
    },
    {
      label: 'Section width',
      current:
        unitSystem === 'metric'
          ? formatDimension(specsA.sectionWidthIn, unitSystem)
          : fmtInQuote(specsA.sectionWidthIn),
      newTire:
        unitSystem === 'metric'
          ? formatDimension(specsB.sectionWidthIn, unitSystem)
          : fmtInQuote(specsB.sectionWidthIn),
      difference:
        unitSystem === 'metric'
          ? `${formatDimensionDiff(widthDiff, unitSystem)} (${fmtPct(widthPct)})`
          : fmtDiffWithPct(widthDiff, widthPct),
      tone: Math.abs(widthDiff) < 0.001 ? 'neutral' : widthDiff > 0 ? 'positive' : 'negative',
      source: 'nominal_calculation',
      sourceLabel: nominal,
    },
    {
      label: 'Sidewall height',
      current:
        unitSystem === 'metric'
          ? formatDimension(specsA.sidewallIn, unitSystem)
          : fmtInQuote(specsA.sidewallIn),
      newTire:
        unitSystem === 'metric'
          ? formatDimension(specsB.sidewallIn, unitSystem)
          : fmtInQuote(specsB.sidewallIn),
      difference:
        unitSystem === 'metric'
          ? `${formatDimensionDiff(sidewallDiff, unitSystem)} (${fmtPct(sidewallPct)})`
          : fmtDiffWithPct(sidewallDiff, sidewallPct),
      tone: Math.abs(sidewallDiff) < 0.001 ? 'neutral' : sidewallDiff > 0 ? 'positive' : 'negative',
      source: 'nominal_calculation',
      sourceLabel: nominal,
    },
    {
      label: 'Circumference',
      current:
        unitSystem === 'metric'
          ? formatCircumference(specsA.circumferenceIn, unitSystem)
          : fmtInQuote(specsA.circumferenceIn),
      newTire:
        unitSystem === 'metric'
          ? formatCircumference(specsB.circumferenceIn, unitSystem)
          : fmtInQuote(specsB.circumferenceIn),
      difference:
        unitSystem === 'metric'
          ? `${formatCircumferenceDiff(circDiff, unitSystem)} (${fmtPct(comparison.diameterDiffPercent)})`
          : fmtDiffWithPct(circDiff, comparison.diameterDiffPercent),
      tone: Math.abs(circDiff) < 0.001 ? 'neutral' : circDiff > 0 ? 'positive' : 'negative',
      source: 'nominal_calculation',
      sourceLabel: nominal,
    },
    {
      label: formatRevsLabel(unitSystem) === 'Revs / km' ? 'Revolutions per km' : 'Revolutions per mile',
      current: formatRevsValue(specsA, unitSystem),
      newTire: formatRevsValue(specsB, unitSystem),
      difference: `${formatRevsDiff(revsDiff, unitSystem, specsA, specsB)} (${fmtPct(revsPct)})`,
      tone: Math.abs(revsDiff) < 0.05 ? 'neutral' : revsDiff < 0 ? 'positive' : 'negative',
      source: 'nominal_calculation',
      sourceLabel: nominal,
    },
    {
      label: 'Speedometer reading',
      current: `${indicated.toFixed(0)} ${speedUnit} indicated`,
      newTire: `${trueSpeed.toFixed(1)} ${speedUnit} true`,
      difference: `${fmtPct(comparison.speedometer.errorPercent)} at ${indicated.toFixed(0)} ${speedUnit}`,
      tone: 'neutral',
      differenceVariant: 'info',
      source: 'nominal_calculation',
      sourceLabel: nominal,
    },
    {
      label: 'Wheel diameter',
      current: `${specsA.wheelDiameterIn}"`,
      newTire: `${specsB.wheelDiameterIn}"`,
      difference:
        specsA.wheelDiameterIn === specsB.wheelDiameterIn
          ? 'Same wheel'
          : `${fmtSigned(specsB.wheelDiameterIn - specsA.wheelDiameterIn, 0, '"')} — different wheel required`,
      tone: specsA.wheelDiameterIn === specsB.wheelDiameterIn ? 'neutral' : 'negative',
      source: 'nominal_calculation',
      sourceLabel: nominal,
    },
  ];

  const { publishedA, publishedB, canComparePublishedDiameters, mode } = dataSources;
  const mixedDisclosure =
    mode === 'mixed_source'
      ? 'Mixed source — not compared to nominal'
      : 'Published values shown separately from nominal';

  if (hasAnyPublished(publishedA, publishedB, (p) => p.overallDiameterIn)) {
    const a = publishedCell(publishedA, (p) => p.overallDiameterIn, (v) =>
      formatPublishedDim(typeof v === 'number' ? v : Number(v), unitSystem),
    );
    const b = publishedCell(publishedB, (p) => p.overallDiameterIn, (v) =>
      formatPublishedDim(typeof v === 'number' ? v : Number(v), unitSystem),
    );
    const both = canComparePublishedDiameters && publishedA && publishedB;
    rows.push({
      label: 'Published diameter',
      current: a.text,
      newTire: b.text,
      difference: both
        ? formatDimensionDiff(
            (publishedB!.overallDiameterIn as number) - (publishedA!.overallDiameterIn as number),
            unitSystem,
          )
        : mixedDisclosure,
      tone: 'neutral',
      differenceVariant: both ? undefined : 'info',
      source: 'manufacturer_published',
      sourceLabel: SPEC_SOURCE_LABELS.manufacturer_published,
      currentSourceLabel: a.sourceLabel,
      newSourceLabel: b.sourceLabel,
      differenceWithheld: !both,
    });
  }

  if (hasAnyPublished(publishedA, publishedB, (p) => p.sectionWidthIn)) {
    const a = publishedCell(publishedA, (p) => p.sectionWidthIn, (v) =>
      formatPublishedDim(typeof v === 'number' ? v : Number(v), unitSystem),
    );
    const b = publishedCell(publishedB, (p) => p.sectionWidthIn, (v) =>
      formatPublishedDim(typeof v === 'number' ? v : Number(v), unitSystem),
    );
    const both =
      publishedA?.sectionWidthIn != null && publishedB?.sectionWidthIn != null;
    rows.push({
      label: 'Published section width',
      current: a.text,
      newTire: b.text,
      difference: both
        ? formatDimensionDiff(
            (publishedB!.sectionWidthIn as number) - (publishedA!.sectionWidthIn as number),
            unitSystem,
          )
        : mixedDisclosure,
      tone: 'neutral',
      differenceVariant: both ? undefined : 'info',
      source: 'manufacturer_published',
      sourceLabel: SPEC_SOURCE_LABELS.manufacturer_published,
      currentSourceLabel: a.sourceLabel,
      newSourceLabel: b.sourceLabel,
      differenceWithheld: !both,
    });
  }

  if (hasAnyPublished(publishedA, publishedB, (p) => p.approvedRimRange)) {
    const a = publishedCell(publishedA, (p) => p.approvedRimRange, String);
    const b = publishedCell(publishedB, (p) => p.approvedRimRange, String);
    rows.push({
      label: 'Approved rim-width range',
      current: a.text,
      newTire: b.text,
      difference: '—',
      tone: 'neutral',
      differenceVariant: 'info',
      source: 'manufacturer_published',
      sourceLabel: SPEC_SOURCE_LABELS.manufacturer_published,
      currentSourceLabel: a.sourceLabel,
      newSourceLabel: b.sourceLabel,
    });
  }

  if (hasAnyPublished(publishedA, publishedB, (p) => p.loadIndex)) {
    const a = publishedCell(publishedA, (p) => p.loadIndex, String);
    const b = publishedCell(publishedB, (p) => p.loadIndex, String);
    rows.push({
      label: 'Load index',
      current: a.text,
      newTire: b.text,
      difference: '—',
      tone: 'neutral',
      differenceVariant: 'info',
      source: 'manufacturer_published',
      sourceLabel: SPEC_SOURCE_LABELS.manufacturer_published,
      currentSourceLabel: a.sourceLabel,
      newSourceLabel: b.sourceLabel,
    });
  }

  if (hasAnyPublished(publishedA, publishedB, (p) => p.speedRating)) {
    const a = publishedCell(publishedA, (p) => p.speedRating, String);
    const b = publishedCell(publishedB, (p) => p.speedRating, String);
    rows.push({
      label: 'Speed rating',
      current: a.text,
      newTire: b.text,
      difference: '—',
      tone: 'neutral',
      differenceVariant: 'info',
      source: 'manufacturer_published',
      sourceLabel: SPEC_SOURCE_LABELS.manufacturer_published,
      currentSourceLabel: a.sourceLabel,
      newSourceLabel: b.sourceLabel,
    });
  }

  if (hasAnyPublished(publishedA, publishedB, (p) => p.loadRange)) {
    const a = publishedCell(publishedA, (p) => p.loadRange, String);
    const b = publishedCell(publishedB, (p) => p.loadRange, String);
    rows.push({
      label: 'Load range',
      current: a.text,
      newTire: b.text,
      difference: '—',
      tone: 'neutral',
      differenceVariant: 'info',
      source: 'manufacturer_published',
      sourceLabel: SPEC_SOURCE_LABELS.manufacturer_published,
      currentSourceLabel: a.sourceLabel,
      newSourceLabel: b.sourceLabel,
    });
  }

  return rows;
}
