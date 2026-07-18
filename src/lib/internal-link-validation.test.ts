import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  formatInternalLinkReport,
  validateInternalLinks,
  writeInternalLinkReport,
} from './internal-link-validation';

function writeHtml(dir: string, rel: string, body: string) {
  const full = join(dir, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, `<!doctype html><html><body>${body}</body></html>`, 'utf8');
}

describe('validateInternalLinks', () => {
  it('flags broken, redirecting, and parameterized comparison links', () => {
    const root = join(tmpdir(), `tire-link-audit-${Date.now()}`);
    mkdirSync(root, { recursive: true });

    writeHtml(
      root,
      'index.html',
      [
        '<a href="/tire-size/275-70r18/">OK size</a>',
        '<a href="/missing-page/">Broken</a>',
        '<a href="/tire-size-calculator/">Legacy redirect</a>',
        '<a href="/calculators/tire-comparison-calculator/?from=275/70R18&to=285/70R17/">Param compare</a>',
      ].join(''),
    );
    writeHtml(root, 'tire-size/275-70r18/index.html', '<a href="/">Home</a>');

    const report = validateInternalLinks(root);
    expect(report.broken.some((i) => i.href?.includes('/missing-page/'))).toBe(true);
    expect(report.redirecting.some((i) => i.href?.includes('/tire-size-calculator/'))).toBe(
      true,
    );
    expect(report.parameterizedComparison.length).toBeGreaterThan(0);
    expect(formatInternalLinkReport(report)).toContain('Broken:');

    const out = writeInternalLinkReport(root, report);
    expect(out.endsWith('internal-link-report.json')).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });

  it('flags internal links that point to reversed comparison URLs', () => {
    const root = join(tmpdir(), `tire-link-reversed-${Date.now()}`);
    mkdirSync(root, { recursive: true });

    writeHtml(
      root,
      'index.html',
      [
        '<a href="/compare/225-45-r17-vs-235-40-r18/">Canonical compare</a>',
        '<a href="/compare/235-40-r18-vs-225-45-r17/">Reversed compare</a>',
      ].join(''),
    );
    writeHtml(
      root,
      'compare/225-45-r17-vs-235-40-r18/index.html',
      '<a href="/">Home</a>',
    );

    const report = validateInternalLinks(root);
    expect(
      report.nonCanonicalComparison.some((i) =>
        i.href?.includes('/compare/235-40-r18-vs-225-45-r17/'),
      ),
    ).toBe(true);
    expect(
      report.nonCanonicalComparison.some((i) =>
        i.href?.includes('/compare/225-45-r17-vs-235-40-r18/'),
      ),
    ).toBe(false);

    rmSync(root, { recursive: true, force: true });
  });

  it('flags comparison links that are missing the required trailing slash', () => {
    const root = join(tmpdir(), `tire-link-slash-${Date.now()}`);
    mkdirSync(root, { recursive: true });

    writeHtml(
      root,
      'index.html',
      '<a href="/compare/225-45-r17-vs-235-40-r18">Slash-less compare</a>',
    );
    writeHtml(
      root,
      'compare/225-45-r17-vs-235-40-r18/index.html',
      '<a href="/">Home</a>',
    );

    const report = validateInternalLinks(root);
    expect(
      report.nonCanonicalComparison.some(
        (i) => i.href === '/compare/225-45-r17-vs-235-40-r18',
      ),
    ).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });

  it('reports orphan generated pages without inbound links', () => {
    const root = join(tmpdir(), `tire-link-orphan-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    writeHtml(root, 'index.html', '<p>No links</p>');
    writeHtml(root, 'tire-size/orphan-size/index.html', '<a href="/">Home</a>');

    const report = validateInternalLinks(root);
    expect(report.orphanGenerated.some((i) => i.page === '/tire-size/orphan-size/')).toBe(
      true,
    );
    expect(
      report.noContextualInbound.some((i) => i.page === '/tire-size/orphan-size/'),
    ).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });
});
