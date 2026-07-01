import type { UnitSystem } from './calculator-types';
import type { TireSpecs } from './tire-math';

export const KMH_PER_MPH = 1.609344;

export function speedUnitLabel(unitSystem: UnitSystem): 'mph' | 'km/h' {
  return unitSystem === 'metric' ? 'km/h' : 'mph';
}

export function chartSpeedPoints(unitSystem: UnitSystem): number[] {
  return unitSystem === 'metric' ? [50, 70, 90, 110] : [30, 45, 60, 75];
}

export function rpmAtSpeed(speed: number, specs: TireSpecs, unitSystem: UnitSystem): number {
  if (unitSystem === 'metric') {
    return (speed * specs.revsPerKm) / 60;
  }
  return (speed * specs.revsPerMile) / 60;
}

export function formatDimension(valueIn: number, unitSystem: UnitSystem, digits = 2): string {
  if (unitSystem === 'metric') {
    return `${(valueIn * 25.4).toFixed(digits === 2 ? 1 : digits)} mm`;
  }
  return `${valueIn.toFixed(digits)}"`;
}

export function formatDimensionDiff(valueIn: number, unitSystem: UnitSystem, digits = 2): string {
  const sign = valueIn > 0 ? '+' : valueIn < 0 ? '−' : '+';
  if (unitSystem === 'metric') {
    return `${sign}${Math.abs(valueIn * 25.4).toFixed(1)} mm`;
  }
  return `${sign}${Math.abs(valueIn).toFixed(digits)}"`;
}

export function formatCircumference(valueIn: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    return `${(valueIn * 2.54).toFixed(1)} cm`;
  }
  return `${valueIn.toFixed(2)}"`;
}

export function formatCircumferenceDiff(valueIn: number, unitSystem: UnitSystem): string {
  const sign = valueIn > 0 ? '+' : valueIn < 0 ? '−' : '+';
  if (unitSystem === 'metric') {
    return `${sign}${Math.abs(valueIn * 2.54).toFixed(1)} cm`;
  }
  return `${sign}${Math.abs(valueIn).toFixed(2)}"`;
}

export function formatRevsLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'Revs per km' : 'Revs per Mile';
}

export function formatRevsValue(specs: TireSpecs, unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? specs.revsPerKm.toFixed(1) : specs.revsPerMile.toFixed(1);
}

export function formatRevsDiff(diffPerMile: number, unitSystem: UnitSystem, specsA: TireSpecs, specsB: TireSpecs): string {
  if (unitSystem === 'metric') {
    const diff = specsB.revsPerKm - specsA.revsPerKm;
    return `${diff >= 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)}`;
  }
  return `${diffPerMile >= 0 ? '+' : '−'}${Math.abs(diffPerMile).toFixed(1)}`;
}

export function convertSpeedForUnitSystem(speed: number, toUnit: UnitSystem): number {
  if (!Number.isFinite(speed) || speed <= 0) return speed;
  return toUnit === 'metric' ? Math.round(speed * KMH_PER_MPH) : Math.round(speed / KMH_PER_MPH);
}
