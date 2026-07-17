/**
 * Editorial team profiles — replace placeholder names, bios, photos, and links
 * with real details before launch.
 */

import { LEGAL_ENTITY } from './legal-entity';

export type PersonCreditScope =
  | 'tire-size-hubs'
  | 'comparison-pages'
  | 'calculators'
  | 'site-editorial';

export interface PersonLinks {
  linkedin?: string;
  website?: string;
  x?: string;
}

export interface Person {
  slug: string;
  name: string;
  role: string;
  bio: string;
  /** Short list of credentials, experience, or expertise areas. */
  credentials: string[];
  /** Site-relative or absolute photo URL. */
  photo: string;
  links?: PersonLinks;
  /** Content areas this person is credited on. */
  creditScopes: PersonCreditScope[];
}

/** Replace with your registered legal entity before launch. */
export const SITE_LEGAL_ENTITY = {
  name: LEGAL_ENTITY.name,
  jurisdiction: LEGAL_ENTITY.jurisdiction,
  description:
    'Tire Reference is published and operated by the legal entity named above. Calculator output, comparison guidance, and tire-size reference pages are produced under our editorial standards — not by tire manufacturers or retailers.',
} as const;

export const DEFAULT_AUTHOR_SLUG = 'alex-morgan';
export const DEFAULT_REVIEWER_SLUG = 'jamie-chen';

export const PEOPLE: Person[] = [
  {
    slug: DEFAULT_AUTHOR_SLUG,
    name: 'Alex Morgan',
    role: 'Editor & tire sizing researcher',
    bio: 'Placeholder bio — replace with your real background: how you work with tire sizing data, calculator development, and the research process behind hub and comparison content on Tire Reference.',
    credentials: [
      'Placeholder — add degrees, certifications, or years of experience',
      'Placeholder — e.g. automotive journalism, fitment consulting, or motorsport background',
      'Maintains Tire Reference sizing dataset and calculator methodology',
    ],
    photo: '/images/people/alex-morgan.svg',
    links: {
      linkedin: 'https://www.linkedin.com/in/your-profile',
      website: 'https://example.com',
    },
    creditScopes: ['tire-size-hubs', 'comparison-pages', 'calculators', 'site-editorial'],
  },
  {
    slug: DEFAULT_REVIEWER_SLUG,
    name: 'Jamie Chen',
    role: 'Technical reviewer',
    bio: 'Placeholder bio — replace with your real review background: how you validate calculated specs, fitment thresholds, and comparison copy before pages are published.',
    credentials: [
      'Placeholder — add relevant technical or editorial review experience',
      'Reviews calculator output against structural fitment rules and prose validators',
      'Signs off on comparison pages before they enter the public index',
    ],
    photo: '/images/people/jamie-chen.svg',
    links: {
      linkedin: 'https://www.linkedin.com/in/your-profile',
    },
    creditScopes: ['tire-size-hubs', 'comparison-pages', 'calculators', 'site-editorial'],
  },
];
