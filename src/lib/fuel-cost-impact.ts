import type { TireSpecs } from './tire-math';

export interface FuelCostAssumptions {
  fuelPricePerGallon: number;
  annualMiles: number;
  baselineMpg: number;
}

export const DEFAULT_FUEL_ASSUMPTIONS: FuelCostAssumptions = {
  fuelPricePerGallon: 3.5,
  annualMiles: 12000,
  baselineMpg: 25,
};

export interface FuelCostImpact {
  annualCostCurrent: number;
  annualCostNew: number;
  annualDifference: number;
  mpgCurrent: number;
  mpgNew: number;
  gallonsCurrent: number;
  gallonsNew: number;
}

/**
 * Estimate annual fuel-cost change when switching tires.
 * Model: MPG scales with rolling circumference (larger tire → fewer revs/mile → slightly better MPG).
 * This is a simplified estimate — not a precise fuel-economy test.
 */
export function calculateFuelCostImpact(
  specsCurrent: TireSpecs,
  specsNew: TireSpecs,
  assumptions: FuelCostAssumptions,
): FuelCostImpact {
  const { fuelPricePerGallon, annualMiles, baselineMpg } = assumptions;

  const mpgCurrent =
    baselineMpg * (specsCurrent.circumferenceIn / specsCurrent.circumferenceIn);
  const mpgNew =
    baselineMpg * (specsNew.circumferenceIn / specsCurrent.circumferenceIn);

  const gallonsCurrent = annualMiles / mpgCurrent;
  const gallonsNew = annualMiles / mpgNew;

  const annualCostCurrent = gallonsCurrent * fuelPricePerGallon;
  const annualCostNew = gallonsNew * fuelPricePerGallon;

  return {
    annualCostCurrent,
    annualCostNew,
    annualDifference: annualCostNew - annualCostCurrent,
    mpgCurrent,
    mpgNew,
    gallonsCurrent,
    gallonsNew,
  };
}
