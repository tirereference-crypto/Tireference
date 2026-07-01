import type { TireCategory } from '../data/tire-sizes';
import { compareTires, type TireSpecs } from './tire-math';

export interface SpeedometerImpactInsight {
  referenceSize: string;
  errorPercent: number;
  trueSpeedAt60: number;
  revsPerMile: number;
  summary: string;
  detail: string;
}

export interface DynamicQuickFact {
  label: string;
  value: string;
}

/** OEM-style baseline on the same wheel for single-tire speedometer context. */
export function inferReferenceTireSize(
  specs: TireSpecs,
  category: TireCategory,
): string {
  const wheel =
    specs.wheelDiameterIn % 1 === 0
      ? String(specs.wheelDiameterIn)
      : specs.wheelDiameterIn.toFixed(1);
  const construction = specs.construction || 'R';

  switch (category) {
    case 'performance':
      return `225/45${construction}${wheel}`;
    case 'passenger':
      return `205/65${construction}${wheel}`;
    case 'SUV':
      return `245/65${construction}${wheel}`;
    case 'light-truck':
    case 'off-road':
      return `265/70${construction}${wheel}`;
  }
}

export function buildSpeedometerImpact(
  specs: TireSpecs,
  sizeLabel: string,
  category: TireCategory,
  indicatedSpeed = 60,
): SpeedometerImpactInsight {
  const referenceSize = inferReferenceTireSize(specs, category);
  const cmp = compareTires(referenceSize, sizeLabel, indicatedSpeed);
  const { errorPercent, trueSpeed } = cmp.speedometer;
  const signedError =
    errorPercent >= 0 ? `+${errorPercent.toFixed(1)}` : errorPercent.toFixed(1);

  let detail: string;
  if (Math.abs(errorPercent) < 0.5) {
    detail = `Near factory calibration versus a typical ${referenceSize} baseline on the same wheel.`;
  } else if (errorPercent > 0) {
    detail = `At ${indicatedSpeed} mph indicated, your speedometer reads slower than true speed (${trueSpeed.toFixed(1)} mph actual).`;
  } else {
    detail = `At ${indicatedSpeed} mph indicated, your speedometer reads faster than true speed (${trueSpeed.toFixed(1)} mph actual).`;
  }

  return {
    referenceSize,
    errorPercent,
    trueSpeedAt60: trueSpeed,
    revsPerMile: specs.revsPerMile,
    summary: `${signedError}% vs ${referenceSize}`,
    detail,
  };
}

export function buildDynamicQuickFacts(
  specs: TireSpecs,
  context: {
    categoryLabel: string;
    equivalentFlotation: string;
    typicalBuild: string;
    popularVehicles: string;
  },
): DynamicQuickFact[] {
  return [
    { label: 'Category', value: context.categoryLabel },
    { label: 'Overall Diameter', value: `${specs.overallDiameterIn.toFixed(2)} in` },
    { label: 'Sidewall Height', value: `${specs.sidewallIn.toFixed(2)} in` },
    { label: 'Revs per Mile', value: String(Math.round(specs.revsPerMile)) },
    { label: 'Equivalent Flotation', value: context.equivalentFlotation },
    { label: 'Typical Build', value: context.typicalBuild },
    { label: 'Popular Vehicles', value: context.popularVehicles },
  ];
}
