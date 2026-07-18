import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  validateComparisonDistDedup,
  validateGeneratedSourceData,
  validateIndexableText,
  validateRenderedComparisonPage,
  type GeneratedPageValidationIssue,
} from './generated-page-validation';
import { getAllComparisonSlugs } from './tire-comparison-links';

function grammarIssues(text: string): GeneratedPageValidationIssue[] {
  const issues: GeneratedPageValidationIssue[] = [];
  validateIndexableText(
    text,
    {
      issues,
      pageType: 'tire-size',
      page: '/test/',
    },
    'test copy',
  );
  return issues;
}

describe('generated-page grammar validation', () => {
  it.each([
    ['a 18-inch wheel', 'inch-article'],
    ['an 16-inch wheel', 'inch-article'],
    ['an 17-inch wheel', 'inch-article'],
    ['an 16" rim', 'inch-article'],
    ['Specs & | Fitment', 'incomplete-separator'],
    ['Specs  and fitment', 'duplicate-spaces'],
    ['Specs () fitment', 'empty-punctuation'],
    ['undefined fitment copy', 'placeholder-copy'],
  ])('rejects %s', (text, check) => {
    expect(grammarIssues(text).some((issue) => issue.check === check)).toBe(true);
  });

  it.each([
    'a 16-inch wheel',
    'a 17-inch wheel',
    'an 18-inch wheel',
    'a 17" rim',
    'an 18" rim',
  ])('accepts the correct article in %s', (text) => {
    expect(grammarIssues(text)).toEqual([]);
  });
});

interface ComparisonFixture {
  title?: string;
  h1?: string;
  breadcrumb?: string;
  canonicalPath?: string;
  islandCurrent?: string;
  islandNew?: string;
}

function comparisonPageHtml(current: string, next: string, overrides: ComparisonFixture = {}): string {
  const pair = `${current} vs ${next}`;
  const title = overrides.title ?? `${pair} Tire Size Comparison | Tire Reference`;
  const h1 = overrides.h1 ?? `${pair} Tire Size Comparison`;
  const breadcrumb = overrides.breadcrumb ?? `Home Compare ${pair}`;
  const canonical = `https://tirereference.com${overrides.canonicalPath ?? `/compare/${current}-vs-${next}/`}`;
  const islandCurrent = overrides.islandCurrent ?? current;
  const islandNew = overrides.islandNew ?? next;
  return `<!doctype html><html><head><title>${title}</title>
<link rel="canonical" href="${canonical}">
</head><body>
<nav aria-label="Breadcrumb">${breadcrumb}</nav>
<h1>${h1}</h1>
<astro-island props="{&quot;initialCurrent&quot;:[0,&quot;${islandCurrent}&quot;],&quot;initialNew&quot;:[0,&quot;${islandNew}&quot;]}"></astro-island>
</body></html>`;
}

describe('validateRenderedComparisonPage (failing fixtures prove the build stops)', () => {
  const current = '205/55R16';
  const next = '215/55R17';

  function run(html: string): GeneratedPageValidationIssue[] {
    const issues: GeneratedPageValidationIssue[] = [];
    validateRenderedComparisonPage(html, current, next, issues);
    return issues;
  }

  it('passes a page whose title, H1, breadcrumb, canonical, and inputs match the URL pair', () => {
    const html = comparisonPageHtml('205-55-r16', '215-55-r17', {
      title: `${current} vs ${next} Tire Size Comparison | Tire Reference`,
      h1: `${current} vs ${next} Tire Size Comparison`,
      breadcrumb: `Home Compare ${current} vs ${next}`,
      canonicalPath: '/compare/205-55-r16-vs-215-55-r17/',
      islandCurrent: current,
      islandNew: next,
    });
    expect(run(html)).toEqual([]);
  });

  it('fails a generic H1', () => {
    const html = comparisonPageHtml('205-55-r16', '215-55-r17', {
      canonicalPath: '/compare/205-55-r16-vs-215-55-r17/',
      islandCurrent: current,
      islandNew: next,
      h1: 'Tire Size Comparison Calculator',
    });
    expect(run(html).some((i) => i.check === 'rendered-h1')).toBe(true);
  });

  it('fails when the title uses the reverse size order', () => {
    const html = comparisonPageHtml('205-55-r16', '215-55-r17', {
      canonicalPath: '/compare/205-55-r16-vs-215-55-r17/',
      islandCurrent: current,
      islandNew: next,
      title: `${next} vs ${current} Tire Size Comparison | Tire Reference`,
    });
    expect(run(html).some((i) => i.check === 'rendered-title')).toBe(true);
  });

  it('fails when calculator inputs differ from the URL pair', () => {
    const html = comparisonPageHtml('205-55-r16', '215-55-r17', {
      canonicalPath: '/compare/205-55-r16-vs-215-55-r17/',
      islandCurrent: next,
      islandNew: current,
    });
    expect(run(html).some((i) => i.check === 'calculator-inputs')).toBe(true);
  });

  it('fails when the default calculator pair is rendered instead of the page pair', () => {
    const html = comparisonPageHtml('205-55-r16', '215-55-r17', {
      canonicalPath: '/compare/205-55-r16-vs-215-55-r17/',
      islandCurrent: '225/45R17',
      islandNew: '235/40R18',
    });
    const issues = run(html);
    expect(issues.some((i) => i.check === 'default-comparison')).toBe(true);
  });

  it('fails a missing or wrong canonical', () => {
    const html = comparisonPageHtml('205-55-r16', '215-55-r17', {
      canonicalPath: '/compare/215-55-r17-vs-205-55-r16/',
      islandCurrent: current,
      islandNew: next,
    });
    expect(run(html).some((i) => i.check === 'rendered-canonical')).toBe(true);
  });
});

describe('validateComparisonDistDedup (failing fixtures prove the build stops)', () => {
  it('flags reversed duplicate pages and reversed sitemap URLs', () => {
    const root = join(tmpdir(), `tire-dedup-${Date.now()}`);
    const [{ slug }] = getAllComparisonSlugs();
    const [a, b] = slug.split('-vs-');
    const reversed = `${b}-vs-${a}`;

    for (const dir of [slug, reversed]) {
      mkdirSync(join(root, 'compare', dir), { recursive: true });
      writeFileSync(join(root, 'compare', dir, 'index.html'), '<html></html>', 'utf8');
    }
    writeFileSync(
      join(root, 'sitemap-0.xml'),
      `<urlset><url><loc>https://tirereference.com/compare/${slug}/</loc></url>` +
        `<url><loc>https://tirereference.com/compare/${reversed}/</loc></url></urlset>`,
      'utf8',
    );

    const issues: GeneratedPageValidationIssue[] = [];
    validateComparisonDistDedup(root, issues);

    expect(issues.some((i) => i.check === 'reversed-page')).toBe(true);
    expect(issues.some((i) => i.check === 'sitemap-reversed' || i.check === 'sitemap-duplicate-pair')).toBe(true);
    expect(issues.some((i) => i.check === 'page-count')).toBe(true);
    expect(issues.every((i) => i.severity === 'error')).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });
});

describe('generated source page validation', () => {
  it('passes every generated comparison, tire-size, and category page data model', () => {
    const summary = validateGeneratedSourceData();
    expect(summary.totalPages).toBe(
      summary.comparisonPages + summary.tireSizePages + summary.tireCategoryPages,
    );
    expect(summary.comparisonPages).toBeGreaterThan(0);
    expect(summary.tireSizePages).toBeGreaterThan(0);
    expect(summary.tireCategoryPages).toBe(8);
    expect(
      summary.issues,
      summary.issues
        .map(
          (issue) =>
            `[${issue.pageType}:${issue.check}] ${issue.page}: ${issue.message}`,
        )
        .join('\n'),
    ).toEqual([]);
  });
});
