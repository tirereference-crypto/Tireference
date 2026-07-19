/**
 * Production-build internal link audit for TireReference.
 *
 * Scans rendered HTML under `dist/` and reports:
 * - broken internal links
 * - internal links that hit known redirect sources
 * - non-canonical / parameterized comparison links
 * - orphan generated pages
 * - generated pages without contextual incoming links
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseComparisonSlug } from './comparison-url';
import { isParameterizedComparisonUrl } from './crawlable-links';
import { SITE_URL } from './seo/constants';

export type InternalLinkIssueKind =
  | 'broken'
  | 'redirecting'
  | 'parameterized-comparison'
  | 'non-canonical-comparison'
  | 'orphan-generated'
  | 'no-contextual-inbound';

export interface InternalLinkIssue {
  kind: InternalLinkIssueKind;
  severity: 'error' | 'warning';
  source?: string;
  href?: string;
  page?: string;
  message: string;
}

export interface InternalLinkValidationReport {
  scannedPages: number;
  scannedLinks: number;
  broken: InternalLinkIssue[];
  redirecting: InternalLinkIssue[];
  parameterizedComparison: InternalLinkIssue[];
  nonCanonicalComparison: InternalLinkIssue[];
  orphanGenerated: InternalLinkIssue[];
  noContextualInbound: InternalLinkIssue[];
  errors: number;
  warnings: number;
  generatedAt: string;
}

/** Legacy calculator paths that 301 to /calculators/… (astro + _redirects). */
export const INTERNAL_REDIRECT_SOURCES = new Set([
  '/tire-size-calculator',
  '/tire-size-calculator/',
  '/tire-diameter-calculator',
  '/tire-diameter-calculator/',
  '/tire-size-comparison',
  '/tire-size-comparison/',
  '/tire-comparison-calculator',
  '/tire-comparison-calculator/',
  '/wheel-offset-calculator',
  '/wheel-offset-calculator/',
  '/gear-ratio-calculator',
  '/gear-ratio-calculator/',
]);

function normalizeSitePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return withSlash.replace(/\/{2,}/g, '/');
}

function htmlPathToSitePath(filePath: string, distDir: string): string {
  const rel = relative(distDir, filePath).split('\\').join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) {
    return normalizeSitePath(`/${rel.slice(0, -'/index.html'.length)}/`);
  }
  if (rel.endsWith('.html')) {
    return normalizeSitePath(`/${rel.slice(0, -'.html'.length)}/`);
  }
  return normalizeSitePath(`/${rel}/`);
}

function walkHtmlFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_astro' || entry.name === 'assets') continue;
      walkHtmlFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function loadRedirectSources(distDir: string): Set<string> {
  const sources = new Set(INTERNAL_REDIRECT_SOURCES);
  const redirectsFile = join(distDir, '_redirects');
  if (!existsSync(redirectsFile)) return sources;

  for (const line of readFileSync(redirectsFile, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    const from = normalizeSitePath(parts[0]);
    sources.add(from);
    sources.add(from.replace(/\/$/, '') || '/');
  }
  return sources;
}

const HREF_RE = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;

function extractInternalHrefs(html: string): string[] {
  const hrefs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = HREF_RE.exec(html)) !== null) {
    const raw = match[2].trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
      continue;
    }
    if (/^(https?:)?\/\//i.test(raw) && !/tirereference\.com/i.test(raw)) {
      continue;
    }
    hrefs.push(raw);
  }
  return hrefs;
}

function resolveInternalHref(href: string, sourcePath: string): { path: string; search: string } | null {
  try {
    const base = `${SITE_URL}${sourcePath}`;
    const url = new URL(href, base);
    if (url.origin !== SITE_URL) return null;
    return {
      path: normalizeSitePath(url.pathname),
      search: url.search,
    };
  } catch {
    return null;
  }
}

function pageExists(path: string, pages: Set<string>): boolean {
  if (pages.has(path)) return true;
  const trimmed = path.replace(/\/$/, '') || '/';
  return pages.has(normalizeSitePath(trimmed));
}

function isGeneratedPage(path: string): boolean {
  return (
    path.startsWith('/tire-size/') ||
    path.startsWith('/compare/') ||
    path.startsWith('/tire-sizes/')
  );
}

function isContextualSource(path: string): boolean {
  return (
    path === '/' ||
    path.startsWith('/tire-size/') ||
    path.startsWith('/compare/') ||
    path.startsWith('/tire-sizes/') ||
    path.startsWith('/calculators/')
  );
}

function classifyComparisonHref(
  href: string,
  path: string,
  search: string,
): 'parameterized' | 'non-canonical' | null {
  const full = `${path}${search}`;
  if (isParameterizedComparisonUrl(full) || isParameterizedComparisonUrl(href)) {
    return 'parameterized';
  }
  if (!path.startsWith('/compare/')) return null;
  // The project requires trailing slashes; a slash-less compare link forces
  // an extra redirect hop even when the slug itself is canonical.
  const rawPath = href.split(/[?#]/)[0];
  if (!rawPath.endsWith('/')) return 'non-canonical';
  const slug = path.replace(/^\/compare\//, '').replace(/\/$/, '');
  const parsed = parseComparisonSlug(slug);
  if (!parsed) return 'non-canonical';
  if (!parsed.isCanonical) return 'non-canonical';
  if (path !== normalizeSitePath(parsed.canonicalPath)) return 'non-canonical';
  return null;
}

export function validateInternalLinks(distDir: string): InternalLinkValidationReport {
  const htmlFiles = walkHtmlFiles(distDir);
  const pages = new Set(htmlFiles.map((file) => htmlPathToSitePath(file, distDir)));
  const redirectSources = loadRedirectSources(distDir);

  const broken: InternalLinkIssue[] = [];
  const redirecting: InternalLinkIssue[] = [];
  const parameterizedComparison: InternalLinkIssue[] = [];
  const nonCanonicalComparison: InternalLinkIssue[] = [];

  const inbound = new Map<string, Set<string>>();
  let scannedLinks = 0;

  for (const file of htmlFiles) {
    const source = htmlPathToSitePath(file, distDir);
    const html = readFileSync(file, 'utf8');
    const hrefs = extractInternalHrefs(html);
    const seenDestInSection = new Set<string>();

    for (const href of hrefs) {
      const resolved = resolveInternalHref(href, source);
      if (!resolved) continue;
      scannedLinks += 1;

      const { path, search } = resolved;
      const destKey = `${path}${search}`;

      // Track inbound without query for graph metrics.
      if (!inbound.has(path)) inbound.set(path, new Set());
      if (path !== source) inbound.get(path)!.add(source);

      if (redirectSources.has(path) || redirectSources.has(path.replace(/\/$/, '') || '/')) {
        redirecting.push({
          kind: 'redirecting',
          severity: 'error',
          source,
          href,
          message: `Internal link redirects (${path}). Prefer the canonical destination.`,
        });
      }

      const comparisonIssue = classifyComparisonHref(href, path, search);
      if (comparisonIssue === 'parameterized') {
        parameterizedComparison.push({
          kind: 'parameterized-comparison',
          severity: 'error',
          source,
          href,
          message: `Parameterized comparison URL in content: ${href}`,
        });
      } else if (comparisonIssue === 'non-canonical') {
        nonCanonicalComparison.push({
          kind: 'non-canonical-comparison',
          severity: 'error',
          source,
          href,
          message: `Non-canonical comparison link: ${href}`,
        });
      }

      // Fragment-only / existing hash targets on real pages are OK when the page exists.
      if (!pageExists(path, pages) && !redirectSources.has(path)) {
        // Avoid flooding duplicate broken reports for the same source→dest.
        const dupKey = `${source}→${destKey}`;
        if (!seenDestInSection.has(dupKey)) {
          seenDestInSection.add(dupKey);
          broken.push({
            kind: 'broken',
            severity: 'error',
            source,
            href,
            message: `Broken internal link: ${href} (resolved ${path})`,
          });
        }
      }
    }
  }

  const orphanGenerated: InternalLinkIssue[] = [];
  const noContextualInbound: InternalLinkIssue[] = [];

  for (const page of pages) {
    if (!isGeneratedPage(page)) continue;
    const sources = inbound.get(page) ?? new Set<string>();
    if (sources.size === 0) {
      orphanGenerated.push({
        kind: 'orphan-generated',
        severity: 'warning',
        page,
        message: `Generated page has no inbound internal links: ${page}`,
      });
      noContextualInbound.push({
        kind: 'no-contextual-inbound',
        severity: 'warning',
        page,
        message: `Generated page has no contextual incoming links: ${page}`,
      });
      continue;
    }

    const contextual = [...sources].filter(isContextualSource);
    if (contextual.length === 0) {
      noContextualInbound.push({
        kind: 'no-contextual-inbound',
        severity: 'warning',
        page,
        message: `Generated page lacks contextual incoming links (only utility/nav sources): ${page}`,
      });
    }
  }

  const errors =
    broken.length +
    redirecting.length +
    parameterizedComparison.length +
    nonCanonicalComparison.length;
  const warnings = orphanGenerated.length + noContextualInbound.length;

  return {
    scannedPages: htmlFiles.length,
    scannedLinks,
    broken,
    redirecting,
    parameterizedComparison,
    nonCanonicalComparison,
    orphanGenerated,
    noContextualInbound,
    errors,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

export function formatInternalLinkReport(report: InternalLinkValidationReport): string {
  const lines = [
    'Internal link validation report',
    `Pages scanned: ${report.scannedPages}`,
    `Links scanned: ${report.scannedLinks}`,
    `Errors: ${report.errors}`,
    `Warnings: ${report.warnings}`,
    `Broken: ${report.broken.length}`,
    `Redirecting: ${report.redirecting.length}`,
    `Parameterized comparison: ${report.parameterizedComparison.length}`,
    `Non-canonical comparison: ${report.nonCanonicalComparison.length}`,
    `Orphan generated: ${report.orphanGenerated.length}`,
    `No contextual inbound: ${report.noContextualInbound.length}`,
  ];

  const samples = [
    ...report.broken.slice(0, 8),
    ...report.redirecting.slice(0, 8),
    ...report.parameterizedComparison.slice(0, 8),
    ...report.nonCanonicalComparison.slice(0, 8),
    ...report.orphanGenerated.slice(0, 5),
    ...report.noContextualInbound.slice(0, 5),
  ];

  if (samples.length > 0) {
    lines.push('', 'Sample issues:');
    for (const issue of samples) {
      lines.push(`- [${issue.severity}/${issue.kind}] ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeInternalLinkReport(
  distDir: string,
  report: InternalLinkValidationReport = validateInternalLinks(distDir),
): string {
  const outPath = join(distDir, 'internal-link-report.json');
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outPath;
}
