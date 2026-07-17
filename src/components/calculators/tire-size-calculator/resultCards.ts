import type { DisplayUnits } from '../../../lib/calculator-types';
import type { TireSpecs } from '../../../lib/tire-math';

export type ResultCardKey =
  | 'diameter'
  | 'width'
  | 'sidewall'
  | 'circumference'
  | 'revs'
  | 'wheel';

export interface ResultCardModel {
  key: ResultCardKey;
  label: string;
  primary: string;
  secondary?: string;
  tooltip?: string;
}

const REVS_TOOLTIP = 'Theoretical value; manufacturer specifications may differ.';

function fmt(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '—';
  return decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
}

export function buildCalculatorResultCards(
  specs: TireSpecs,
  units: DisplayUnits,
): ResultCardModel[] {
  const imperial = {
    diameter: `${fmt(specs.overallDiameterIn, 2)} in`,
    width: `${fmt(specs.sectionWidthIn, 2)} in`,
    sidewall: `${fmt(specs.sidewallIn, 2)} in`,
    circumference: `${fmt(specs.circumferenceIn, 2)} in`,
    revs: `${fmt(specs.revsPerMile, 0)} revs/mile`,
    wheel: `${fmt(specs.wheelDiameterIn, 0)} in`,
  };

  const metric = {
    diameter: `${fmt(specs.overallDiameterMm, 1)} mm`,
    width: `${fmt(specs.widthMm, 0)} mm`,
    sidewall: `${fmt(specs.sidewallMm, 1)} mm`,
    circumference: `${fmt(specs.circumferenceMm, 0)} mm`,
    revs: `${fmt(specs.revsPerKm, 0)} revs/km`,
    wheel: `${fmt(specs.wheelDiameterIn * 25.4, 1)} mm`,
  };

  const labels: Record<ResultCardKey, string> = {
    diameter: 'Overall Diameter',
    width: 'Section Width',
    sidewall: 'Sidewall Height',
    circumference: 'Circumference',
    revs: 'Theoretical Revs per Mile',
    wheel: 'Wheel Diameter',
  };

  const keys = Object.keys(labels) as ResultCardKey[];

  return keys.map((key) => {
    if (units === 'metric') {
      return {
        key,
        label: key === 'revs' ? 'Theoretical Revs per Km' : labels[key],
        primary: metric[key],
        tooltip: key === 'revs' ? REVS_TOOLTIP : undefined,
      };
    }

    if (units === 'both') {
      return {
        key,
        label: labels[key],
        primary: imperial[key],
        secondary: metric[key],
        tooltip: key === 'revs' ? REVS_TOOLTIP : undefined,
      };
    }

    return {
      key,
      label: labels[key],
      primary: imperial[key],
      secondary: key === 'wheel' ? undefined : metric[key],
      tooltip: key === 'revs' ? REVS_TOOLTIP : undefined,
    };
  });
}
