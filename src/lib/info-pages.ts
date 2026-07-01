export const CONTACT_EMAIL = 'hello@tirereference.com';

export const ABOUT_BUILD_CARDS = [
  {
    title: 'Tire Size Calculator',
    description:
      'Convert metric tire codes into overall diameter, section width, sidewall height, circumference, and revolutions per mile.',
    href: '/tire-size-calculator',
  },
  {
    title: 'Tire Comparison Calculator',
    description:
      'Compare two tire sizes side by side with diameter change, speedometer impact, and fitment guidance.',
    href: '/tire-size-comparison',
  },
  {
    title: 'Wheel Offset Calculator',
    description:
      'Model offset, poke, backspacing, and clearance before committing to a new wheel setup.',
    href: '/wheel-offset-calculator',
  },
  {
    title: 'Gear Ratio Calculator',
    description:
      'Estimate how a taller or shorter tire changes effective gearing, cruise RPM, and regear needs.',
    href: '/calculators/gear-ratio-calculator',
  },
  {
    title: 'Speedometer Calculator',
    description:
      'See how a tire size change affects indicated speed versus true road speed using our comparison tools.',
    href: '/tire-size-comparison',
  },
  {
    title: 'Fitment Resources',
    description:
      'Browse tire size hubs, OEM-style specs, equivalents, and vehicle-oriented fitment context.',
    href: '/tire-sizes',
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

export const FOOTER_COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
] as const;
