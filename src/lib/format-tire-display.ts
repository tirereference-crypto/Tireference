import type { UnitSystem, StatDisplay } from './calculator-types';
import type { TireSpecs } from './tire-math';

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/** Build labeled result rows for a single-tire calculator. */
export function formatTireSizeResults(
  specs: TireSpecs,
  unitSystem: UnitSystem,
): StatDisplay[] {
  if (unitSystem === 'imperial') {
    return [
      {
        label: 'Overall diameter',
        value: formatNumber(specs.overallDiameterIn, 2),
        unit: 'in',
      },
      {
        label: 'Section width',
        value: formatNumber(specs.sectionWidthIn, 2),
        unit: 'in',
      },
      {
        label: 'Sidewall height',
        value: formatNumber(specs.sidewallIn, 2),
        unit: 'in',
      },
      {
        label: 'Circumference',
        value: formatNumber(specs.circumferenceIn, 2),
        unit: 'in',
      },
      {
        label: 'Revolutions per mile',
        value: formatNumber(specs.revsPerMile, 0),
        unit: 'revs/mi',
      },
    ];
  }

  const circumferenceCm = specs.circumferenceMm / 10;

  return [
    {
      label: 'Overall diameter',
      value: formatNumber(specs.overallDiameterMm, 1),
      unit: 'mm',
    },
    {
      label: 'Section width',
      value: formatNumber(specs.widthMm, 1),
      unit: 'mm',
    },
    {
      label: 'Sidewall height',
      value: formatNumber(specs.sidewallMm, 1),
      unit: 'mm',
    },
    {
      label: 'Circumference',
      value: formatNumber(circumferenceCm, 1),
      unit: 'cm',
    },
    {
      label: 'Revolutions per km',
      value: formatNumber(specs.revsPerKm, 0),
      unit: 'revs/km',
    },
  ];
}
