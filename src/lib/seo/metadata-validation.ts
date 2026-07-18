/**
 * Parse rendered HTML for metadata / structured-data consistency checks.
 * Used by unit tests (fixtures) and optional dist HTML audits.
 */

import { resolveCanonical } from './urls';
import { formatPageTitle, truncateDescription } from './format';

export type PageKind =
  | 'home'
  | 'tire-size'
  | 'tire-sizes-index'
  | 'tire-category'
  | 'compare'
  | 'calculator'
  | 'about'
  | 'info'
  | 'other';

export interface MetadataValidationIssue {
  check: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface PageMetadataSnapshot {
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  h1Count: number;
  h1Text: string | null;
  schemaTypes: string[];
  jsonLdNodes: Record<string, unknown>[];
  faqQuestionCount: number;
  visibleFaqCount: number;
}

function metaContent(html: string, attr: 'name' | 'property', key: string): string | null {
  const re = new RegExp(
    `<meta\\s+[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${key}["'][^>]*>`,
    'i',
  );
  const match = html.match(re);
  return match?.[1] ?? match?.[2] ?? null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

function extractCanonical(html: string): string | null {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1]
    ?? null;
}

function extractH1s(html: string): string[] {
  const withoutScripts = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  const matches = [...withoutScripts.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  return matches.map((m) =>
    m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  );
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const entry of node) collectTypes(entry, out);
    return;
  }
  const record = node as Record<string, unknown>;
  const type = record['@type'];
  if (typeof type === 'string') out.add(type);
  else if (Array.isArray(type)) {
    for (const t of type) if (typeof t === 'string') out.add(t);
  }
  if (Array.isArray(record['@graph'])) collectTypes(record['@graph'], out);
}

function parseJsonLdScripts(html: string): Record<string, unknown>[] {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes: Record<string, unknown>[] = [];
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim()) as Record<string, unknown>;
      if (Array.isArray(parsed['@graph'])) {
        for (const entry of parsed['@graph']) {
          if (entry && typeof entry === 'object') nodes.push(entry as Record<string, unknown>);
        }
      } else {
        nodes.push(parsed);
      }
    } catch {
      /* ignore invalid blocks */
    }
  }
  return nodes;
}

function countVisibleFaqs(html: string): number {
  const faqSections = [
    ...html.matchAll(/<(?:section|div)\b[^>]*(?:class|aria-label)=["'][^"']*faq[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div)>/gi),
  ];
  if (faqSections.length === 0) {
    // Fall back to details/summary FAQ pattern used by calculators.
    return [...html.matchAll(/<details\b[^>]*class=["'][^"']*faq[^"']*["']/gi)].length;
  }
  let count = 0;
  for (const section of faqSections) {
    count += [...section[1].matchAll(/<details\b/gi)].length;
    count += [...section[1].matchAll(/<(?:h3|dt)\b[^>]*class=["'][^"']*faq/gi)].length;
  }
  return count;
}

function faqQuestionsInSchema(nodes: Record<string, unknown>[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node['@type'] !== 'FAQPage') continue;
    const main = node.mainEntity;
    if (Array.isArray(main)) total += main.length;
  }
  return total;
}

export function extractPageMetadata(html: string): PageMetadataSnapshot {
  const h1s = extractH1s(html);
  const jsonLdNodes = parseJsonLdScripts(html);
  const schemaTypes = new Set<string>();
  for (const node of jsonLdNodes) collectTypes(node, schemaTypes);

  return {
    title: extractTitle(html),
    description: metaContent(html, 'name', 'description'),
    canonical: extractCanonical(html),
    robots: metaContent(html, 'name', 'robots'),
    ogTitle: metaContent(html, 'property', 'og:title'),
    ogDescription: metaContent(html, 'property', 'og:description'),
    ogUrl: metaContent(html, 'property', 'og:url'),
    twitterCard: metaContent(html, 'name', 'twitter:card'),
    twitterTitle: metaContent(html, 'name', 'twitter:title'),
    twitterDescription: metaContent(html, 'name', 'twitter:description'),
    h1Count: h1s.length,
    h1Text: h1s[0] ?? null,
    schemaTypes: [...schemaTypes].sort(),
    jsonLdNodes,
    faqQuestionCount: faqQuestionsInSchema(jsonLdNodes),
    visibleFaqCount: countVisibleFaqs(html),
  };
}

export interface ValidatePageMetadataOptions {
  kind: PageKind;
  expectedPath: string;
  /** When set, title must equal formatPageTitle(rawTitle) or exact match. */
  expectedTitleContains?: string;
  requireFaqSchema?: boolean;
  allowedSchemaTypes?: string[];
  forbiddenSchemaTypes?: string[];
  requiredSchemaTypes?: string[];
}

export function validatePageMetadata(
  html: string,
  options: ValidatePageMetadataOptions,
): MetadataValidationIssue[] {
  const issues: MetadataValidationIssue[] = [];
  const meta = extractPageMetadata(html);
  const expectedCanonical = resolveCanonical(options.expectedPath);

  const add = (check: string, message: string, severity: 'error' | 'warning' = 'error') => {
    issues.push({ check, message, severity });
  };

  if (!meta.title) add('title', 'Missing <title>.');
  if (!meta.description) add('description', 'Missing meta description.');
  if (meta.h1Count !== 1) {
    add('h1', `Expected exactly one H1, found ${meta.h1Count}.`);
  }
  if (!meta.canonical) add('canonical', 'Missing canonical link.');
  else if (meta.canonical !== expectedCanonical) {
    add('canonical', `Canonical "${meta.canonical}" !== expected "${expectedCanonical}".`);
  }

  if (!meta.ogTitle) add('og:title', 'Missing og:title.');
  if (!meta.ogDescription) add('og:description', 'Missing og:description.');
  if (!meta.ogUrl) add('og:url', 'Missing og:url.');
  else if (meta.canonical && meta.ogUrl !== meta.canonical) {
    add('og:url', `og:url "${meta.ogUrl}" does not match canonical "${meta.canonical}".`);
  }

  if (meta.title && meta.ogTitle && meta.ogTitle !== meta.title) {
    add('og:title', `og:title does not match document title.`);
  }
  if (meta.description && meta.ogDescription && meta.ogDescription !== meta.description) {
    add('og:description', `og:description does not match meta description.`);
  }

  if (!meta.twitterCard) add('twitter:card', 'Missing twitter:card.');
  if (!meta.twitterTitle) add('twitter:title', 'Missing twitter:title.');
  if (!meta.twitterDescription) add('twitter:description', 'Missing twitter:description.');
  if (meta.title && meta.twitterTitle && meta.twitterTitle !== meta.title) {
    add('twitter:title', 'twitter:title does not match document title.');
  }
  if (meta.description && meta.twitterDescription && meta.twitterDescription !== meta.description) {
    add('twitter:description', 'twitter:description does not match meta description.');
  }

  if (!meta.robots) add('robots', 'Missing robots meta.');

  if (options.expectedTitleContains && meta.title && !meta.title.includes(options.expectedTitleContains)) {
    add('title', `Title "${meta.title}" missing expected text "${options.expectedTitleContains}".`);
  }

  for (const required of options.requiredSchemaTypes ?? []) {
    if (!meta.schemaTypes.includes(required)) {
      add('schema', `Missing required schema type ${required}.`);
    }
  }
  for (const forbidden of options.forbiddenSchemaTypes ?? []) {
    if (meta.schemaTypes.includes(forbidden)) {
      add('schema', `Forbidden schema type present: ${forbidden}.`);
    }
  }
  if (options.allowedSchemaTypes) {
    for (const type of meta.schemaTypes) {
      if (!options.allowedSchemaTypes.includes(type)) {
        add('schema', `Unexpected schema type ${type}.`);
      }
    }
  }

  if (options.requireFaqSchema) {
    if (!meta.schemaTypes.includes('FAQPage')) {
      add('faq-schema', 'Expected FAQPage schema when FAQs are required.');
    }
  } else if (meta.schemaTypes.includes('FAQPage') && meta.visibleFaqCount === 0) {
    add('faq-schema', 'FAQPage schema present but no visible FAQ markup found.');
  }

  if (meta.schemaTypes.includes('FAQPage') && meta.visibleFaqCount > 0) {
    if (meta.faqQuestionCount > meta.visibleFaqCount) {
      add(
        'faq-parity',
        `FAQ schema has ${meta.faqQuestionCount} questions but only ${meta.visibleFaqCount} visible FAQ items.`,
        'warning',
      );
    }
  }

  // Consistency: Article/WebPage/WebApplication url should match canonical when present.
  for (const node of meta.jsonLdNodes) {
    const type = node['@type'];
    if (typeof type !== 'string') continue;
    if (['TechArticle', 'Article', 'WebPage', 'AboutPage', 'WebApplication', 'ItemList'].includes(type)) {
      const url = typeof node.url === 'string' ? node.url : null;
      if (url && meta.canonical && resolveCanonical(url) !== meta.canonical) {
        add('schema-url', `${type}.url "${url}" does not match canonical "${meta.canonical}".`);
      }
    }
    if (type === 'BreadcrumbList') {
      const elements = node.itemListElement;
      if (!Array.isArray(elements) || elements.length === 0) {
        add('breadcrumb', 'BreadcrumbList is empty.');
      }
    }
    if (type === 'WebApplication') {
      if (node.aggregateRating != null || node.review != null) {
        add('schema', 'WebApplication must not include aggregateRating or review.');
      }
    }
  }

  return issues;
}

/** Helper for tests that build head HTML similar to SEO.astro output. */
export function buildHeadFixture(input: {
  title: string;
  description: string;
  path: string;
  robots?: string;
  schema?: Record<string, unknown>;
  h1: string;
  bodyExtra?: string;
}): string {
  const pageTitle = formatPageTitle(input.title);
  const description = truncateDescription(input.description);
  const canonical = resolveCanonical(input.path);
  const schemaScript = input.schema
    ? `<script type="application/ld+json">${JSON.stringify(input.schema)}</script>`
    : '';
  return `<!doctype html><html><head>
<title>${pageTitle}</title>
<meta name="description" content="${description}" />
<meta name="robots" content="${input.robots ?? 'index,follow'}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:title" content="${pageTitle}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${pageTitle}" />
<meta name="twitter:description" content="${description}" />
${schemaScript}
</head><body><h1>${input.h1}</h1>${input.bodyExtra ?? ''}</body></html>`;
}
