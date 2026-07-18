import { SITE_NAME } from '../site-brand';
import { CONTACT_EMAIL } from '../info-pages';
import { toSchemaDateTime } from '../eeat-metadata';
import {
  DEFAULT_OG_IMAGE,
  ORGANIZATION_LOGO_URL,
  SEO_DESCRIPTIONS,
  SITE_URL,
} from './constants';
import { resolveCanonical } from './urls';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL or site-relative path */
  item?: string;
}

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  type?: 'Article' | 'TechArticle';
  /** Optional PropertyValue nodes (e.g. tire load index, speed rating). */
  additionalProperty?: Array<Record<string, unknown>>;
  /** Display name for the Organization author (defaults to site name). */
  authorName?: string;
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

function stripContext(node: Record<string, unknown>): Record<string, unknown> {
  const { '@context': _context, ...rest } = node;
  return rest;
}

/** Merge multiple schema nodes into one JSON-LD document. */
export function mergeJsonLd(
  schemas: Array<Record<string, unknown> | null | undefined>,
): Record<string, unknown> | undefined {
  const nodes = schemas.filter(Boolean) as Record<string, unknown>[];
  if (nodes.length === 0) return undefined;
  if (nodes.length === 1) {
    return nodes[0]['@context'] ? nodes[0] : { '@context': 'https://schema.org', ...nodes[0] };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': nodes.map((node) => stripContext(node)),
  };
}

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: ORGANIZATION_LOGO_URL,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: CONTACT_EMAIL,
      url: `${SITE_URL}/contact/`,
    },
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description: SEO_DESCRIPTIONS.homepage,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function buildHomePageSchema(): Record<string, unknown> {
  return mergeJsonLd([buildWebSiteSchema(), buildOrganizationSchema()])!;
}

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.item
        ? { item: resolveCanonical(crumb.item) }
        : {}),
    })),
  };
}

export function buildFaqPageSchema(faqs: FaqItem[]): Record<string, unknown> | undefined {
  if (faqs.length === 0) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        // Keep the same wording as the visible FAQ; normalize blank lines to spaces for JSON text.
        text: faq.answer.replace(/\s*\n+\s*/g, ' ').trim(),
      },
    })),
  };
}

export interface ItemListEntry {
  name: string;
  url: string;
  position?: number;
}

export interface ItemListSchemaInput {
  name: string;
  description?: string;
  url: string;
  items: ItemListEntry[];
}

/** Directory / listing schema — only for genuine visible item lists. */
export function buildItemListSchema({
  name,
  description,
  url,
  items,
}: ItemListSchemaInput): Record<string, unknown> | undefined {
  if (items.length === 0) return undefined;

  const pageUrl = resolveCanonical(url);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description ? { description } : {}),
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: entry.position ?? index + 1,
      name: entry.name,
      item: resolveCanonical(entry.url),
    })),
  };
}

export function buildArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  type = 'TechArticle',
  additionalProperty,
  authorName = SITE_NAME,
}: ArticleSchemaInput): Record<string, unknown> {
  const published = datePublished ?? buildDefaultPublishDate();
  const modified = dateModified ?? published;
  const pageUrl = resolveCanonical(url);

  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline,
    description,
    ...(additionalProperty && additionalProperty.length > 0
      ? { additionalProperty }
      : {}),
    author: {
      '@type': 'Organization',
      name: authorName,
      url: `${SITE_URL}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        url: ORGANIZATION_LOGO_URL,
      },
    },
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    url: pageUrl,
    image: DEFAULT_OG_IMAGE,
  };
}

export function buildDefaultPublishDate(): string {
  return new Date().toISOString().split('T')[0]!;
}

export interface WebPageSchemaInput {
  name: string;
  description: string;
  url: string;
}

export function buildWebPageSchema({
  name,
  description,
  url,
}: WebPageSchemaInput): Record<string, unknown> {
  const pageUrl = resolveCanonical(url);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: pageUrl,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export interface WebApplicationSchemaInput {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  /** Only pass when genuinely maintained (YYYY-MM or YYYY-MM-DD). */
  dateModified?: string;
  /** Fragment id for @id, e.g. tire-size-calculator */
  id?: string;
}

export function buildWebApplicationSchema({
  name,
  description,
  url,
  applicationCategory = 'UtilitiesApplication',
  dateModified,
  id = 'web-application',
}: WebApplicationSchemaInput): Record<string, unknown> {
  const pageUrl = resolveCanonical(url);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${pageUrl}#${id}`,
    name,
    description,
    url: pageUrl,
    applicationCategory,
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Runs in a modern web browser.',
    creator: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    ...(dateModified
      ? { dateModified: toSchemaDateTime(dateModified) }
      : {}),
  };
}

export function buildAboutPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}): Record<string, unknown> {
  const pageUrl = resolveCanonical(url);

  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${pageUrl}#about`,
    name,
    description,
    url: pageUrl,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    about: { '@id': ORGANIZATION_ID },
  };
}
