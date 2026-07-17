/** Shared types for tire calculator UI components. */

export type UnitSystem = 'imperial' | 'metric';

/** Size-code format (independent of display units). */
export type SizeFormat = 'metric' | 'flotation';

/** Output display units for calculated results. */
export type DisplayUnits = 'imperial' | 'metric' | 'both';

export interface TireSizeInputFields {
  width: string;
  aspectRatio: string;
  wheelDiameter: string;
}

export interface FlotationInputFields {
  overallDiameter: string;
  sectionWidth: string;
  wheelDiameter: string;
}

export type CalculatorStatus = 'empty' | 'invalid' | 'ready';

export interface CalculatorMessage {
  status: CalculatorStatus;
  text: string;
}

export type StatValueColor = 'neutral' | 'positive' | 'negative';

export interface StatDisplay {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  valueColor?: StatValueColor;
  size?: 'normal' | 'hero';
}

/** @deprecated Use StatDisplay */
export interface DisplayMetric {
  label: string;
  value: string;
  unit: string;
}
