import { CALCULATOR_PATHS, SITE_CALCULATORS } from './calculator-links';
import {
  DEFAULT_AUTHOR_SLUG,
  DEFAULT_REVIEWER_SLUG,
  PEOPLE,
  type Person,
  type PersonCreditScope,
} from '../data/people';
import { TIRE_SIZES } from '../data/tire-sizes';
import type { EditorialPerson } from './editorial';
import { getAllComparisonSlugs } from './tire-comparison-links';
import { hubPagePath } from './tire-size-url';
import { SITE_URL } from './seo/constants';
import type { SchemaPersonRef } from './seo/schema';

export interface PersonCreditGroup {
  title: string;
  description: string;
  href: string;
  count: number;
  samples: Array<{ label: string; href: string }>;
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function personProfilePath(slug: string): string {
  return `/author/${slug}/`;
}

export function absolutePersonUrl(slug: string): string {
  return `${SITE_URL}${personProfilePath(slug)}`;
}

export function absoluteAssetUrl(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

export function getPersonBySlug(slug: string): Person | undefined {
  return PEOPLE.find((person) => person.slug === slug);
}

export function getAllPeople(): Person[] {
  return [...PEOPLE];
}

export function getDefaultAuthor(): Person {
  const person = getPersonBySlug(DEFAULT_AUTHOR_SLUG);
  if (!person) throw new Error(`Missing default author: ${DEFAULT_AUTHOR_SLUG}`);
  return person;
}

export function getDefaultReviewer(): Person {
  const person = getPersonBySlug(DEFAULT_REVIEWER_SLUG);
  if (!person) throw new Error(`Missing default reviewer: ${DEFAULT_REVIEWER_SLUG}`);
  return person;
}

export function toEditorialPerson(person: Person): EditorialPerson {
  return {
    slug: person.slug,
    name: person.name,
    role: person.role,
    bio: person.bio,
    initials: initialsFromName(person.name),
    profileUrl: personProfilePath(person.slug),
    photoUrl: person.photo,
  };
}

export function personSchemaRef(person: Person): SchemaPersonRef {
  return {
    name: person.name,
    url: absolutePersonUrl(person.slug),
    type: 'Person',
    image: absoluteAssetUrl(person.photo),
    id: `${absolutePersonUrl(person.slug)}#person`,
  };
}

export function buildPersonSchema(person: Person): Record<string, unknown> {
  const url = absolutePersonUrl(person.slug);
  const sameAs = [person.links?.linkedin, person.links?.website, person.links?.x].filter(
    Boolean,
  ) as string[];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    name: person.name,
    url,
    image: absoluteAssetUrl(person.photo),
    jobTitle: person.role,
    description: person.bio,
    knowsAbout: person.credentials,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    worksFor: {
      '@type': 'Organization',
      name: 'Tire Reference',
      url: `${SITE_URL}/`,
    },
  };
}

function creditGroupForScope(scope: PersonCreditScope): Omit<PersonCreditGroup, 'samples'> & {
  sampleBuilder: () => Array<{ label: string; href: string }>;
} {
  switch (scope) {
    case 'tire-size-hubs': {
      const count = TIRE_SIZES.length;
      return {
        title: 'Tire size guides',
        description: 'Hub pages with diameter, specs, equivalents, and fitment context.',
        href: '/tire-sizes/',
        count,
        sampleBuilder: () =>
          TIRE_SIZES.slice(0, 6).map((entry) => ({
            label: entry.size,
            href: hubPagePath(entry.size),
          })),
      };
    }
    case 'comparison-pages': {
      const slugs = getAllComparisonSlugs();
      return {
        title: 'Tire size comparisons',
        description: 'Side-by-side fitment analysis and upgrade guidance for published pairs.',
        href: CALCULATOR_PATHS.tireComparison,
        count: slugs.length,
        sampleBuilder: () =>
          slugs.slice(0, 6).map(({ slug, current, new: newSize }) => ({
            label: `${current} vs ${newSize}`,
            href: `/compare/${slug}/`,
          })),
      };
    }
    case 'calculators':
      return {
        title: 'Interactive calculators',
        description: 'Shareable tools for sizing, comparison, diameter search, offset, and gearing.',
        href: CALCULATOR_PATHS.tireSize,
        count: SITE_CALCULATORS.length,
        sampleBuilder: () =>
          SITE_CALCULATORS.map((calc) => ({
            label: calc.label,
            href: calc.href,
          })),
      };
    case 'site-editorial':
      return {
        title: 'Editorial & trust pages',
        description: 'About, methodology disclosures, and site-wide editorial standards.',
        href: '/about/',
        count: 2,
        sampleBuilder: () => [
          { label: 'About Tire Reference', href: '/about/' },
          { label: 'Disclaimer & limitations', href: '/disclaimer/' },
        ],
      };
  }
}

export function getPersonCreditGroups(person: Person): PersonCreditGroup[] {
  return person.creditScopes.map((scope) => {
    const group = creditGroupForScope(scope);
    return {
      title: group.title,
      description: group.description,
      href: group.href,
      count: group.count,
      samples: group.sampleBuilder(),
    };
  });
}

export function getDefaultAuthorEditorial(): EditorialPerson {
  return toEditorialPerson(getDefaultAuthor());
}

export function getDefaultReviewerEditorial(): EditorialPerson {
  return toEditorialPerson(getDefaultReviewer());
}

export function defaultEditorialSchemaRefs(): {
  authorRef: SchemaPersonRef;
  reviewerRef: SchemaPersonRef;
} {
  return {
    authorRef: personSchemaRef(getDefaultAuthor()),
    reviewerRef: personSchemaRef(getDefaultReviewer()),
  };
}
