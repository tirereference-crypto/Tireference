/**
 * Full-dist metadata and structured-data audit.
 *
 * Walks EVERY indexable HTML page under `dist/` (not a representative
 * sample) and enforces the mandatory metadata contract:
 * - canonical present and self-referencing
 * - exactly one H1
 * - non-empty, well-formed title carrying the site brand
 * - og:url matching the canonical
 * - JSON-LD URLs (Article/WebPage/ItemList/… and breadcrumb tail) matching
 *   the canonical
 * - FAQPage schema only when every schema question is visibly rendered
 * - page-kind schema policy (WebSite/Organization only on the homepage,
 *   WebApplication on calculators, ItemList on directories, no Article
 *   schema on calculators, …)
 * - no duplicate canonical targets across indexable pages
 *
 * Deterministic, filesystem-only (no network). Consumed by the production
 * validation pipeline (scripts/validate-production.ts), which fails the
 * build on any error.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseComparisonSlug } from '../comparison-url';
import {
  extractPageMetadata,
  validatePageMetadata,
  type PageKind,
} from './metadata-validation';

export interface DistMetadataIssue {
  severity: 'error' | 'warning';
  page: string;
  check: string;
  message: string;
}

export interface DistMetadataAuditReport {
  pagesScanned: number;
  indexablePages: number;
  issues: DistMetadataIssue[];
  errors: number;
  warnings: number;
}

const SCHEMA_POLICY: Record<PageKind, { required: string[]; forbidden: string[] }> = {
  home: {
    required: ['WebSite', 'Organization'],
    forbidden: ['Article', 'TechArticle', 'WebApplication', 'FAQPage'],
  },
  compare: {
    required: ['BreadcrumbList', 'TechArticle'],
    forbidden: ['WebSite', 'Organization', 'WebApplication'],
  },
  'tire-size': {
    required: ['BreadcrumbList', 'TechArticle'],
    forbidden: ['WebSite', 'Organization', 'WebApplication'],
  },
  'tire-sizes-index': {
    required: ['BreadcrumbList', 'ItemList'],
    forbidden: ['WebSite', 'Organization', 'Article', 'TechArticle', 'WebApplication'],
  },
  'tire-category': {
    required: ['BreadcrumbList', 'ItemList'],
    forbidden: ['WebSite', 'Organization', 'Article', 'TechArticle', 'WebApplication'],
  },
  calculator: {
    required: ['BreadcrumbList', 'WebApplication'],
    forbidden: ['WebSite', 'Organization', 'Article', 'TechArticle'],
  },
  about: {
    required: ['AboutPage'],
    forbidden: ['WebSite', 'Organization', 'Article', 'TechArticle', 'WebApplication'],
  },
  info: {
    required: ['BreadcrumbList', 'WebPage'],
    forbidden: ['WebSite', 'Organization', 'Article', 'TechArticle', 'WebApplication'],
  },
  other: { required: [], forbidden: [] },
};

const MALFORMED_TITLE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(?:undefined|NaN)\b|(?<![a-z])null(?![a-z])/i, 'contains a placeholder token'],
  [/\s{2,}/, 'contains repeated whitespace'],
  [/\|\s*\|/, 'contains an empty title separator'],
  [/(?:^|\s)[|&]\s*$/, 'ends with a dangling separator'],
  [/^\s*[|&]/, 'starts with a dangling separator'],
];

export function classifyDistPage(path: string): PageKind {
  if (path === '/') return 'home';
  if (path.startsWith('/compare/')) return 'compare';
  if (path.startsWith('/tire-size/')) return 'tire-size';
  if (path === '/tire-sizes/') return 'tire-sizes-index';
  if (path.startsWith('/tire-sizes/')) return 'tire-category';
  if (path.startsWith('/calculators/')) return 'calculator';
  if (path === '/about/') return 'about';
  return 'info';
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}

function visibleText(html: string): string {
  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

function normalizeForMatch(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

interface IndexablePage {
  path: string;
  file: string;
}

function walkIndexHtml(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_astro' || entry.name === 'assets' || entry.name === 'og') continue;
      walkIndexHtml(full, out);
    } else if (entry.isFile() && entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

function fileToSitePath(file: string, distDir: string): string {
  const rel = relative(distDir, file).split('\\').join('/');
  if (rel === 'index.html') return '/';
  return `/${rel.slice(0, -'/index.html'.length)}/`;
}

/** All indexable (non-noindex) prerendered pages in dist. */
export function collectIndexablePages(distDir: string): IndexablePage[] {
  const pages: IndexablePage[] = [];
  for (const file of walkIndexHtml(distDir).sort()) {
    const html = readFileSync(file, 'utf8');
    const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1];
    if (robots && /noindex/i.test(robots)) continue;
    pages.push({ path: fileToSitePath(file, distDir), file });
  }
  return pages;
}

export function auditDistPageMetadata(distDir: string): DistMetadataAuditReport {
  const issues: DistMetadataIssue[] = [];
  const allFiles = walkIndexHtml(distDir);
  const pages = collectIndexablePages(distDir);
  const canonicalOwners = new Map<string, string>();

  for (const { path, file } of pages) {
    const html = readFileSync(file, 'utf8');
    const kind = classifyDistPage(path);
    const policy = SCHEMA_POLICY[kind];

    const add = (check: string, message: string, severity: 'error' | 'warning' = 'error') => {
      issues.push({ severity, page: path, check, message });
    };

    for (const issue of validatePageMetadata(html, {
      kind,
      expectedPath: path,
      requiredSchemaTypes: policy.required,
      forbiddenSchemaTypes: policy.forbidden,
    })) {
      add(issue.check, issue.message, issue.severity);
    }

    const meta = extractPageMetadata(html);
    const text = visibleText(html);

    if (meta.title) {
      if (!meta.title.includes('Tire Reference')) {
        add('title-brand', `Title is missing the site brand: "${meta.title}".`);
      }
      for (const [pattern, reason] of MALFORMED_TITLE_PATTERNS) {
        if (pattern.test(meta.title)) {
          add('title-malformed', `Title ${reason}: "${meta.title}".`);
        }
      }
    }

    // Every FAQ schema question must be visibly rendered on the page.
    for (const node of meta.jsonLdNodes) {
      if (node['@type'] !== 'FAQPage') continue;
      const main = Array.isArray(node.mainEntity) ? node.mainEntity : [];
      for (const entity of main) {
        if (!entity || typeof entity !== 'object') continue;
        const question = (entity as Record<string, unknown>).name;
        if (typeof question !== 'string') continue;
        if (!normalizeForMatch(text).includes(normalizeForMatch(question))) {
          add('faq-visibility', `FAQ schema question is not visible on the page: "${question}".`);
        }
      }
    }

    // Breadcrumb tail must resolve to this page's canonical URL when present.
    for (const node of meta.jsonLdNodes) {
      if (node['@type'] !== 'BreadcrumbList') continue;
      const elements = Array.isArray(node.itemListElement) ? node.itemListElement : [];
      const last = elements.at(-1) as Record<string, unknown> | undefined;
      const lastItem = typeof last?.item === 'string' ? last.item : null;
      if (lastItem && meta.canonical && lastItem !== meta.canonical) {
        add(
          'breadcrumb-canonical',
          `Breadcrumb tail item "${lastItem}" does not match canonical "${meta.canonical}".`,
        );
      }
    }

    // Comparison pages: structured data must use the page's own pair order.
    if (kind === 'compare') {
      const slug = path.replace(/^\/compare\//, '').replace(/\/$/, '');
      const parsed = parseComparisonSlug(slug);
      if (!parsed) {
        add('compare-slug', `Comparison page has an unparseable slug: ${slug}.`);
      } else {
        const pairLabel = `${parsed.requested.current} vs ${parsed.requested.new}`;
        for (const node of meta.jsonLdNodes) {
          if (node['@type'] === 'BreadcrumbList') {
            const elements = Array.isArray(node.itemListElement) ? node.itemListElement : [];
            const last = elements.at(-1) as Record<string, unknown> | undefined;
            const name = typeof last?.name === 'string' ? last.name : null;
            if (name !== pairLabel) {
              add(
                'compare-breadcrumb-order',
                `Breadcrumb name "${name ?? 'missing'}" does not match the URL pair order "${pairLabel}".`,
              );
            }
          }
          if (node['@type'] === 'TechArticle' || node['@type'] === 'Article') {
            const headline = typeof node.headline === 'string' ? node.headline : null;
            if (!headline || !headline.startsWith(pairLabel)) {
              add(
                'compare-schema-order',
                `${String(node['@type'])} headline "${headline ?? 'missing'}" does not start with the URL pair order "${pairLabel}".`,
              );
            }
          }
        }
      }
    }

    if (meta.canonical) {
      const owner = canonicalOwners.get(meta.canonical);
      if (owner && owner !== path) {
        add(
          'duplicate-canonical',
          `Canonical "${meta.canonical}" is also claimed by ${owner}.`,
        );
      } else {
        canonicalOwners.set(meta.canonical, path);
      }
    }
  }

  return {
    pagesScanned: allFiles.length,
    indexablePages: pages.length,
    issues,
    errors: issues.filter(({ severity }) => severity === 'error').length,
    warnings: issues.filter(({ severity }) => severity === 'warning').length,
  };
}
