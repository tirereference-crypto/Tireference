import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  WARNING_ALLOWLIST,
  applyWarningAllowlist,
  validateSitemap,
  type PipelineIssue,
} from './production-validation';

const SITE = 'https://tirereference.com';

let root: string;

function makeRoot(): string {
  const dir = join(tmpdir(), `tire-prod-validate-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writePage(path: string, robots = 'index,follow') {
  const dir = path === '/' ? root : join(root, path.replace(/^\/|\/$/g, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html><html><head><meta name="robots" content="${robots}" /></head><body><h1>x</h1></body></html>`,
    'utf8',
  );
}

function writeSitemap(locs: string[]) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset>${locs
    .map((loc) => `<url><loc>${loc}</loc></url>`)
    .join('')}</urlset>`;
  for (const file of ['sitemap-0.xml', 'sitemap.xml', 'sitemap-index.xml']) {
    writeFileSync(join(root, file), xml, 'utf8');
  }
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe('validateSitemap (failing fixtures prove the build stops)', () => {
  it('passes a sitemap that exactly matches the indexable page set', () => {
    root = makeRoot();
    writePage('/');
    writePage('/privacy-policy/');
    writePage('/noindex-stub/', 'noindex');
    writeSitemap([`${SITE}/`, `${SITE}/privacy-policy/`]);

    const { issues, urlCount } = validateSitemap(root);
    expect(urlCount).toBe(2);
    expect(issues, issues.map((i) => `[${i.check}] ${i.message}`).join('\n')).toEqual([]);
  });

  it('fails when sitemap files are missing', () => {
    root = makeRoot();
    writePage('/');
    const { issues } = validateSitemap(root);
    expect(issues.filter((i) => i.check === 'sitemap-file').length).toBeGreaterThan(0);
  });

  it('fails on query strings, missing trailing slashes, and duplicates', () => {
    root = makeRoot();
    writePage('/');
    writePage('/a/');
    writeSitemap([
      `${SITE}/`,
      `${SITE}/a/?current=205/55R16`,
      `${SITE}/a`,
      `${SITE}/`,
    ]);
    const { issues } = validateSitemap(root);
    expect(issues.some((i) => i.check === 'sitemap-query')).toBe(true);
    expect(issues.some((i) => i.check === 'sitemap-trailing-slash')).toBe(true);
    expect(issues.some((i) => i.check === 'sitemap-duplicate')).toBe(true);
  });

  it('fails on legacy redirect paths and reversed comparison URLs', () => {
    root = makeRoot();
    writePage('/');
    writeSitemap([
      `${SITE}/`,
      `${SITE}/tire-size-calculator/`,
      `${SITE}/compare/235-40-r18-vs-225-45-r17/`,
    ]);
    const { issues } = validateSitemap(root);
    expect(issues.some((i) => i.check === 'sitemap-legacy')).toBe(true);
    expect(issues.some((i) => i.check === 'sitemap-reversed-comparison')).toBe(true);
  });

  it('fails when the sitemap and the indexable page set diverge', () => {
    root = makeRoot();
    writePage('/');
    writePage('/only-in-dist/');
    writeSitemap([`${SITE}/`, `${SITE}/only-in-sitemap/`]);
    const { issues } = validateSitemap(root);
    expect(issues.some((i) => i.check === 'sitemap-page-missing')).toBe(true);
    expect(issues.some((i) => i.check === 'sitemap-coverage')).toBe(true);
  });
});

describe('warning allowlist policy', () => {
  it('every allowlist entry carries a written reason', () => {
    for (const entry of WARNING_ALLOWLIST) {
      expect(entry.reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps allowlisted warnings non-fatal and attaches the reason', () => {
    const issues: PipelineIssue[] = [
      {
        severity: 'warning',
        check: 'orphan-generated',
        page: '/tire-size/x/',
        message: 'orphan',
      },
    ];
    const [result] = applyWarningAllowlist('internal-links', issues);
    expect(result.severity).toBe('warning');
    expect(result.allowlistReason).toBeTruthy();
  });

  it('escalates any warning that is not explicitly allowlisted', () => {
    const issues: PipelineIssue[] = [
      { severity: 'warning', check: 'unknown-check', page: '/x/', message: 'drifted' },
    ];
    const [result] = applyWarningAllowlist('internal-links', issues);
    expect(result.severity).toBe('error');
    expect(result.message).toContain('escalated');
  });

  it('never rewrites errors', () => {
    const issues: PipelineIssue[] = [
      { severity: 'error', check: 'broken', page: '/x/', message: 'broken link' },
    ];
    expect(applyWarningAllowlist('internal-links', issues)).toEqual(issues);
  });
});
