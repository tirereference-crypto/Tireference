import { CALCULATOR_PATHS } from './calculator-links';
import { compareTires, getTireSpecs } from './tire-math';

/** Homepage calculator cards — published routes only (no invented tools). */
export const HOME_QUICK_ACTIONS = [
  {
    title: 'Tire Size Calculator',
    description: 'Convert tire size into diameter, width, and revs per mile.',
    href: CALCULATOR_PATHS.tireSize,
    icon: 'size' as const,
    tone: 'purple' as const,
  },
  {
    title: 'Tire Size Comparison',
    description: 'Compare two sizes for diameter, clearance, and speedometer change.',
    href: CALCULATOR_PATHS.tireComparison,
    icon: 'compare' as const,
    tone: 'blue' as const,
  },
  {
    title: 'Wheel Offset Calculator',
    description: 'Check offset, poke, and clearance before buying wheels.',
    href: CALCULATOR_PATHS.wheelOffset,
    icon: 'offset' as const,
    tone: 'orange' as const,
  },
  {
    title: 'Speedometer Error Calculator',
    description: 'See how tire-size changes affect indicated speed and odometer accuracy.',
    href: CALCULATOR_PATHS.speedometerError,
    icon: 'speedometer' as const,
    tone: 'green' as const,
  },
  {
    title: 'Tire Diameter Calculator',
    description: 'Find tire sizes that match a target overall diameter.',
    href: CALCULATOR_PATHS.tireDiameter,
    icon: 'diameter' as const,
    tone: 'cyan' as const,
  },
  {
    title: 'Gear Ratio Calculator',
    description: 'Restore effective gearing after a tire size change.',
    href: CALCULATOR_PATHS.gearRatio,
    icon: 'gear' as const,
    tone: 'pink' as const,
  },
] as const;

export type HomeCalcTone = (typeof HOME_QUICK_ACTIONS)[number]['tone'];

export const HOME_HERO_TRUST = [
  {
    title: 'Free to use',
    description: 'No signup required',
    icon: 'signup' as const,
  },
  {
    title: 'Accurate results',
    description: 'Trusted formulas',
    icon: 'verified' as const,
  },
  {
    title: 'Built for real-world use',
    description: 'Practical tire decisions',
    icon: 'fast' as const,
  },
] as const;

export const HOME_FEATURED_COMPARISON = {
  eyebrow: 'Featured tool',
  title: 'Tire Size Comparison Calculator',
  description:
    'Compare two tire sizes side by side and see the real difference in diameter, width, sidewall height and speedometer accuracy.',
  cta: 'Compare Tire Sizes',
  href: CALCULATOR_PATHS.tireComparison,
  points: [
    'See size differences instantly',
    'Understand speedometer impact',
    'Compare upgrade options clearly',
  ],
  currentSize: '245/70R17',
  newSize: '265/70R17',
} as const;

function formatSignedInches(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  return `${sign}${value.toFixed(2)} in`;
}

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function buildFeaturedComparisonPreview(
  currentSize = HOME_FEATURED_COMPARISON.currentSize,
  newSize = HOME_FEATURED_COMPARISON.newSize,
) {
  const current = getTireSpecs(currentSize);
  const next = getTireSpecs(newSize);
  const comparison = compareTires(currentSize, newSize);
  const baseline = Math.min(current.overallDiameterIn, next.overallDiameterIn);

  return {
    currentSize,
    newSize,
    currentDiameterIn: current.overallDiameterIn,
    newDiameterIn: next.overallDiameterIn,
    currentScale: current.overallDiameterIn / baseline,
    newScale: next.overallDiameterIn / baseline,
    rows: [
      {
        label: 'Overall diameter',
        current: `${current.overallDiameterIn.toFixed(2)} in`,
        next: `${next.overallDiameterIn.toFixed(2)} in`,
        diff: formatSignedInches(next.overallDiameterIn - current.overallDiameterIn),
      },
      {
        label: 'Width',
        current: `${current.sectionWidthIn.toFixed(2)} in`,
        next: `${next.sectionWidthIn.toFixed(2)} in`,
        diff: formatSignedInches(next.sectionWidthIn - current.sectionWidthIn),
      },
      {
        label: 'Sidewall height',
        current: `${current.sidewallIn.toFixed(2)} in`,
        next: `${next.sidewallIn.toFixed(2)} in`,
        diff: formatSignedInches(next.sidewallIn - current.sidewallIn),
      },
      {
        label: 'Circumference',
        current: `${current.circumferenceIn.toFixed(2)} in`,
        next: `${next.circumferenceIn.toFixed(2)} in`,
        diff: formatSignedInches(next.circumferenceIn - current.circumferenceIn),
      },
      {
        label: 'Speedometer difference',
        current: '—',
        next: formatSignedPercent(comparison.speedometer.errorPercent),
        diff: formatSignedPercent(comparison.speedometer.errorPercent),
      },
    ],
  };
}

export const HOME_USE_CASES = [
  {
    title: 'Lift & Level',
    description: 'Plan larger tire and wheel changes',
    href: CALCULATOR_PATHS.tireComparison,
    tone: 'lift' as const,
    imageSrc: '/images/home/use-cases/lift.jpg',
    imageAlt: 'Lifted SUV prepared for larger tire and wheel changes',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Towing & Hauling',
    description: 'Understand gearing and tire impact',
    href: CALCULATOR_PATHS.gearRatio,
    tone: 'tow' as const,
    imageSrc: '/images/home/use-cases/tow.jpg',
    imageAlt: 'Pickup truck towing a trailer on the highway',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Speed & Performance',
    description: 'Compare diameter and speedometer effects',
    href: CALCULATOR_PATHS.speedometerError,
    tone: 'speed' as const,
    imageSrc: '/images/home/use-cases/speed.jpg',
    imageAlt: 'Sports car on an open road for performance tire planning',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Daily Driving',
    description: 'Choose practical sizes with confidence',
    href: CALCULATOR_PATHS.tireSize,
    tone: 'daily' as const,
    imageSrc: '/images/home/use-cases/daily.jpg',
    imageAlt: 'Compact car in everyday city traffic',
    imageWidth: 960,
    imageHeight: 640,
  },
] as const;
