import { SITE_NAME } from '../site-brand';
import {
  DEFAULT_OG_IMAGE,
  ORGANIZATION_LOGO_URL,
  SEO_DESCRIPTIONS,
  SITE_URL,
} from './constants';

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
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

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
    sameAs: [],
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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
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
      ...(crumb.item ? { item: crumb.item.startsWith('http') ? crumb.item : `${SITE_URL}${crumb.item}` } : {}),
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
        text: faq.answer,
      },
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
}: ArticleSchemaInput): Record<string, unknown> {
  const published = datePublished ?? buildDefaultPublishDate();
  const modified = dateModified ?? published;
  const pageUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;

  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline,
    description,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
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
  const pageUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;

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
