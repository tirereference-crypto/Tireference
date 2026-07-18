/**
 * Production validation pipeline.
 *
 * One mandatory, hard-failing sequence that runs after `astro build` and
 * before `npm run build` may succeed. Every step validates the actual
 * generated output in `dist/` (plus the source data that produced it):
 *
 *   1. generated-pages         — per-page source + rendered HTML checks for
 *                                comparison, tire-size, and category pages
 *                                (titles, H1s, canonicals, calculator inputs,
 *                                spec cards, rim copy, product sizes, grammar,
 *                                template markers, reversed-pair dedup,
 *                                comparison sitemap dedup)
 *   2. comparison-consistency  — full cross-page comparison content audit
 *                                (verdict/score alignment, stale measurements,
 *                                duplicate prose, banned claims, link targets)
 *   3. dist-metadata           — every indexable dist page: canonical, H1
 *                                count, title quality, OG/schema URL parity,
 *                                FAQ visibility, schema-type policy,
 *                                duplicate canonicals
 *   4. internal-links          — every <a> in dist: broken, redirecting,
 *                                parameterized/legacy query, non-canonical or
 *                                slash-less comparison links, orphans
 *   5. sitemap                 — trailing slashes, no query strings, no
 *                                legacy or reversed URLs, 1:1 parity with the
 *                                indexable page set
 *
 * Behaviour contract:
 * - any ERROR fails the build (non-zero exit via scripts/validate-production.ts)
 * - WARNINGs are fatal too unless explicitly allowlisted below with a reason
 * - exceptions inside a step are reported as that step's error, never swallowed
 * - deterministic, filesystem-only, no network access
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseComparisonSlug } from './comparison-url';
import {
  formatGeneratedPageValidationReport,
  validateGeneratedPages,
} from './generated-page-validation';
import {
  validateInternalLinks,
  writeInternalLinkReport,
} from './internal-link-validation';
import { auditComparisonConsistency } from './tire-comparison-consistency-audit';
import { getAllComparisonSlugs } from './tire-comparison-links';
import {
  auditDistPageMetadata,
  collectIndexablePages,
} from './seo/dist-metadata-audit';
import { SITE_URL } from './seo/constants';

export interface PipelineIssue {
  severity: 'error' | 'warning';
  check: string;
  page: string;
  message: string;
  /** Set when a warning is intentionally non-fatal. */
  allowlistReason?: string;
}

export interface PipelineStepResult {
  id: string;
  label: string;
  issues: PipelineIssue[];
  errors: number;
  warnings: number;
  stats: Record<string, number>;
}

export interface ProductionValidationReport {
  steps: PipelineStepResult[];
  totalErrors: number;
  totalWarnings: number;
  ok: boolean;
}

export interface WarningAllowlistEntry {
  step: string;
  check: string;
  /** Written justification for why this warning does not block deploys. */
  reason: string;
}

/**
 * The only warnings permitted to stay non-fatal. Anything not listed here is
 * escalated to a build-failing error.
 */
export const WARNING_ALLOWLIST: WarningAllowlistEntry[] = [
  {
    step: 'internal-links',
    check: 'orphan-generated',
    reason:
      'Advisory discovery metric: a just-added generated page can briefly lack inbound links while hub sections regenerate; it stays reachable through the sitemap and is re-audited on every build.',
  },
  {
    step: 'internal-links',
    check: 'no-contextual-inbound',
    reason:
      'Advisory link-equity metric: pages remain crawlable via navigation and breadcrumbs even without in-content inbound links.',
  },
  {
    step: 'dist-metadata',
    check: 'faq-parity',
    reason:
      'Visible-FAQ counting is heuristic for deeply nested markup; the error-level faq-visibility check already guarantees every schema question is rendered.',
  },
];

/** Escalate any warning that is not explicitly allowlisted for this step. */
export function applyWarningAllowlist(
  stepId: string,
  issues: PipelineIssue[],
): PipelineIssue[] {
  return issues.map((issue) => {
    if (issue.severity !== 'warning') return issue;
    const entry = WARNING_ALLOWLIST.find(
      (candidate) => candidate.step === stepId && candidate.check === issue.check,
    );
    if (entry) return { ...issue, allowlistReason: entry.reason };
    return {
      ...issue,
      severity: 'error',
      message: `${issue.message} (warning escalated: not in the production warning allowlist)`,
    };
  });
}

const LEGACY_SITEMAP_PATHS = [
  '/tire-size-calculator/',
  '/tire-diameter-calculator/',
  '/tire-size-comparison/',
  '/tire-comparison-calculator/',
  '/wheel-offset-calculator/',
  '/gear-ratio-calculator/',
];

export interface SitemapValidationResult {
  issues: PipelineIssue[];
  urlCount: number;
}

/**
 * Validate dist sitemap files against the actual indexable page set:
 * absolute canonical origin, trailing slashes, no query strings, no legacy
 * redirect paths, no reversed comparison URLs, no duplicates, and exact 1:1
 * parity with indexable prerendered pages.
 */
export function validateSitemap(distDir: string): SitemapValidationResult {
  const issues: PipelineIssue[] = [];
  const add = (check: string, page: string, message: string) => {
    issues.push({ severity: 'error', check, page, message });
  };

  for (const file of ['sitemap-0.xml', 'sitemap.xml', 'sitemap-index.xml']) {
    if (!existsSync(join(distDir, file))) {
      add('sitemap-file', `/${file}`, `${file} is missing from dist.`);
    }
  }
  const sitemapFile = join(distDir, 'sitemap-0.xml');
  if (!existsSync(sitemapFile)) return { issues, urlCount: 0 };

  const xml = readFileSync(sitemapFile, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc.trim());

  const seen = new Set<string>();
  const sitemapPaths = new Set<string>();

  for (const loc of locs) {
    if (seen.has(loc)) {
      add('sitemap-duplicate', loc, 'URL is listed more than once in the sitemap.');
      continue;
    }
    seen.add(loc);

    if (!loc.startsWith(`${SITE_URL}/`) && loc !== `${SITE_URL}/`) {
      add('sitemap-origin', loc, `URL is not on the canonical origin ${SITE_URL}.`);
      continue;
    }
    if (loc.includes('?') || loc.includes('#')) {
      add('sitemap-query', loc, 'Sitemap URLs must not contain query strings or fragments.');
      continue;
    }
    const path = loc.slice(SITE_URL.length);
    if (!path.endsWith('/')) {
      add('sitemap-trailing-slash', loc, 'Sitemap URL is missing the required trailing slash.');
      continue;
    }
    if (LEGACY_SITEMAP_PATHS.includes(path)) {
      add('sitemap-legacy', loc, 'Legacy redirect path must not be in the sitemap.');
      continue;
    }
    if (path.startsWith('/compare/')) {
      const slug = path.replace(/^\/compare\//, '').replace(/\/$/, '');
      const parsed = parseComparisonSlug(slug);
      if (!parsed || !parsed.isCanonical) {
        add('sitemap-reversed-comparison', loc, 'Sitemap contains a reversed or invalid comparison URL.');
        continue;
      }
    }
    sitemapPaths.add(path);
  }

  const indexablePaths = new Set(collectIndexablePages(distDir).map(({ path }) => path));
  for (const path of sitemapPaths) {
    if (!indexablePaths.has(path)) {
      add(
        'sitemap-page-missing',
        `${SITE_URL}${path}`,
        'Sitemap URL has no matching indexable prerendered page in dist.',
      );
    }
  }
  for (const path of indexablePaths) {
    if (!sitemapPaths.has(path)) {
      add(
        'sitemap-coverage',
        `${SITE_URL}${path}`,
        'Indexable page is missing from the sitemap.',
      );
    }
  }

  return { issues, urlCount: locs.length };
}

function finalizeStep(
  id: string,
  label: string,
  issues: PipelineIssue[],
  stats: Record<string, number>,
): PipelineStepResult {
  const applied = applyWarningAllowlist(id, issues);
  return {
    id,
    label,
    issues: applied,
    errors: applied.filter(({ severity }) => severity === 'error').length,
    warnings: applied.filter(({ severity }) => severity === 'warning').length,
    stats,
  };
}

function runStep(
  id: string,
  label: string,
  run: () => { issues: PipelineIssue[]; stats: Record<string, number> },
): PipelineStepResult {
  try {
    const { issues, stats } = run();
    return finalizeStep(id, label, issues, stats);
  } catch (error) {
    // Never swallow: an exception inside a validator is itself a build failure.
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    return finalizeStep(
      id,
      label,
      [{ severity: 'error', check: 'validator-exception', page: '-', message }],
      {},
    );
  }
}

export function runProductionValidation(distDir: string): ProductionValidationReport {
  const steps: PipelineStepResult[] = [];

  steps.push(
    runStep('generated-pages', 'Generated page data + rendered HTML', () => {
      const summary = validateGeneratedPages(distDir);
      return {
        issues: summary.issues.map((issue) => ({
          severity: issue.severity,
          check: issue.check,
          page: issue.page,
          message: issue.message,
        })),
        stats: {
          pagesChecked: summary.totalPages,
          comparisonPages: summary.comparisonPages,
          tireSizePages: summary.tireSizePages,
          tireCategoryPages: summary.tireCategoryPages,
        },
      };
    }),
  );

  steps.push(
    runStep('comparison-consistency', 'Comparison content consistency audit', () => {
      const issues = auditComparisonConsistency();
      return {
        issues: issues.map((issue) => ({
          severity: 'error' as const,
          check: issue.category,
          page: issue.pair,
          message: issue.detail,
        })),
        stats: { comparisonPairs: getAllComparisonSlugs().length },
      };
    }),
  );

  steps.push(
    runStep('dist-metadata', 'Dist metadata & structured data (all pages)', () => {
      const report = auditDistPageMetadata(distDir);
      return {
        issues: report.issues.map((issue) => ({
          severity: issue.severity,
          check: issue.check,
          page: issue.page,
          message: issue.message,
        })),
        stats: {
          pagesScanned: report.pagesScanned,
          indexablePages: report.indexablePages,
        },
      };
    }),
  );

  steps.push(
    runStep('internal-links', 'Internal link audit (all pages)', () => {
      const report = validateInternalLinks(distDir);
      writeInternalLinkReport(distDir, report);
      const issues: PipelineIssue[] = [
        ...report.broken,
        ...report.redirecting,
        ...report.parameterizedComparison,
        ...report.nonCanonicalComparison,
        ...report.orphanGenerated,
        ...report.noContextualInbound,
      ].map((issue) => ({
        severity: issue.severity,
        check: issue.kind,
        page: issue.source ?? issue.page ?? '-',
        message: issue.message,
      }));
      return {
        issues,
        stats: {
          pagesScanned: report.scannedPages,
          linksScanned: report.scannedLinks,
        },
      };
    }),
  );

  steps.push(
    runStep('sitemap', 'Sitemap integrity', () => {
      const { issues, urlCount } = validateSitemap(distDir);
      return { issues, stats: { sitemapUrls: urlCount } };
    }),
  );

  const totalErrors = steps.reduce((sum, step) => sum + step.errors, 0);
  const totalWarnings = steps.reduce((sum, step) => sum + step.warnings, 0);

  return { steps, totalErrors, totalWarnings, ok: totalErrors === 0 };
}

export function formatProductionValidationReport(
  report: ProductionValidationReport,
): string {
  const lines: string[] = ['Production validation pipeline'];

  report.steps.forEach((step, index) => {
    const status = step.errors > 0 ? 'FAIL' : 'PASS';
    const stats = Object.entries(step.stats)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    lines.push(
      `[${index + 1}/${report.steps.length}] ${status} ${step.label}` +
        (stats ? ` (${stats})` : '') +
        ` — errors: ${step.errors}, warnings: ${step.warnings}`,
    );
    for (const issue of step.issues) {
      if (issue.severity === 'error') {
        lines.push(`  ERROR [${step.id}:${issue.check}] ${issue.page} — ${issue.message}`);
      } else {
        lines.push(
          `  WARNING [${step.id}:${issue.check}] ${issue.page} — ${issue.message}` +
            (issue.allowlistReason ? ` (allowlisted: ${issue.allowlistReason})` : ''),
        );
      }
    }
  });

  lines.push(
    `Result: ${report.ok ? 'PASS' : 'FAIL'} — ${report.totalErrors} error(s), ${report.totalWarnings} allowlisted warning(s).`,
  );
  return lines.join('\n');
}

export { formatGeneratedPageValidationReport };
