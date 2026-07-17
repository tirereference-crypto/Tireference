import { CALCULATOR_PATHS } from './calculator-links';

/** Related tools shown on the tire size calculator page — existing routes only. */
export const TIRE_SIZE_CALCULATOR_RELATED_TOOLS = [
  {
    label: 'Tire Comparison Calculator',
    description:
      'Compare two sizes side by side with diameter, width, sidewall, and speedometer effect.',
    href: CALCULATOR_PATHS.tireComparison,
  },
  {
    label: 'Tire Diameter Calculator',
    description: 'Find metric sizes that match a target overall diameter and wheel size.',
    href: CALCULATOR_PATHS.tireDiameter,
  },
  {
    label: 'Wheel Offset Calculator',
    description: 'Model offset, poke, and clearance before buying new wheels.',
    href: CALCULATOR_PATHS.wheelOffset,
  },
  {
    label: 'Gear Ratio Calculator',
    description: 'Estimate gearing and cruise RPM after changing tire diameter.',
    href: CALCULATOR_PATHS.gearRatio,
  },
] as const;
