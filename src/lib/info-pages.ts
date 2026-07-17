import { CALCULATOR_PATHS } from './calculator-links';

export const CONTACT_EMAIL = 'tirereference@gmail.com';

export const ABOUT_BUILD_CARDS = [
  {
    title: 'Tire Size Calculator',
    description:
      'Convert metric tire codes into overall diameter, section width, sidewall height, circumference, and revolutions per mile.',
    href: CALCULATOR_PATHS.tireSize,
  },
  {
    title: 'Tire Comparison Calculator',
    description:
      'Compare two tire sizes side by side with diameter change, speedometer impact, and fitment guidance.',
    href: CALCULATOR_PATHS.tireComparison,
  },
  {
    title: 'Wheel Offset Calculator',
    description:
      'Model offset, poke, backspacing, and clearance before committing to a new wheel setup.',
    href: CALCULATOR_PATHS.wheelOffset,
  },
  {
    title: 'Gear Ratio Calculator',
    description:
      'Estimate how a taller or shorter tire changes effective gearing, cruise RPM, and regear needs.',
    href: CALCULATOR_PATHS.gearRatio,
  },
  {
    title: 'Tire Diameter Calculator',
    description:
      'Measure overall diameter from width, aspect ratio, and wheel size — includes speedometer error from circumference change.',
    href: CALCULATOR_PATHS.tireDiameter,
  },
  {
    title: 'Fitment Resources',
    description:
      'Browse tire size hubs, OEM-style specs, equivalents, and vehicle-oriented fitment context.',
    href: '/tire-sizes/',
  },
] as const;

export const ABOUT_AUDIENCE = [
  'Everyday drivers',
  'Off-road enthusiasts',
  'Overland builders',
  'Mechanics',
  'Automotive professionals',
  'Wheel & tire shoppers',
] as const;

export const CONTACT_REASONS = [
  {
    title: 'General Questions',
    description: 'Ask about how a calculator works, tire sizing basics, or how to use Tire Reference.',
  },
  {
    title: 'Calculator Feedback',
    description: 'Share ideas to improve accuracy, usability, or the data shown in our tools.',
  },
  {
    title: 'Report an Error',
    description: 'Let us know if a calculation, tire spec, or page content looks incorrect.',
  },
  {
    title: 'Business & Partnerships',
    description: 'Discuss collaborations, integrations, or commercial opportunities.',
  },
  {
    title: 'Feature Requests',
    description: 'Suggest new calculators, comparison views, or educational resources you want to see.',
  },
] as const;

export const FOOTER_TOOL_LINKS = [
  { label: 'Tire Size Calculator', href: CALCULATOR_PATHS.tireSize },
  { label: 'Tire Size Comparison', href: CALCULATOR_PATHS.tireComparison },
  { label: 'Wheel Offset Calculator', href: CALCULATOR_PATHS.wheelOffset },
  { label: 'Speedometer Error Calculator', href: CALCULATOR_PATHS.speedometerError },
  { label: 'Tire Diameter Calculator', href: CALCULATOR_PATHS.tireDiameter },
  { label: 'Gear Ratio Calculator', href: CALCULATOR_PATHS.gearRatio },
] as const;

export const FOOTER_RESOURCE_LINKS = [
  { label: 'Tire Sizes', href: '/tire-sizes/' },
  { label: 'Data & Calculation Standards', href: '/data-standards/' },
  { label: 'Report an Issue', href: '/report-an-issue/' },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy/' },
  { label: 'Terms of Use', href: '/terms/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
] as const;
