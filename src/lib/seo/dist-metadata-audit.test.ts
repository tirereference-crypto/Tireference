import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { auditDistPageMetadata, classifyDistPage } from './dist-metadata-audit';

const SITE = 'https://tirereference.com';

interface PageOptions {
  path: string;
  title?: string;
  canonicalPath?: string | null;
  ogUrlPath?: string;
  h1s?: string[];
  robots?: string;
  schema?: unknown;
  body?: string;
}

/** Minimal page that satisfies every mandatory metadata check. */
function pageHtml(options: PageOptions): string {
  const title = options.title ?? 'Fixture Page | Tire Reference';
  const canonical =
    options.canonicalPath === null
      ? ''
      : `<link rel="canonical" href="${SITE}${options.canonicalPath ?? options.path}" />`;
  const ogUrl = `${SITE}${options.ogUrlPath ?? options.canonicalPath ?? options.path}`;
  const h1s = (options.h1s ?? ['Fixture Page']).map((h) => `<h1>${h}</h1>`).join('');
  const schema = options.schema
    ? `<script type="application/ld+json">${JSON.stringify(options.schema)}</script>`
    : '';
  return `<!doctype html><html><head>
<title>${title}</title>
<meta name="description" content="Fixture description." />
<meta name="robots" content="${options.robots ?? 'index,follow'}" />
${canonical}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="Fixture description." />
<meta property="og:url" content="${ogUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="Fixture description." />
${schema}
</head><body>${h1s}${options.body ?? ''}</body></html>`;
}

function infoSchema(path: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Fixture', item: `${SITE}${path}` },
        ],
      },
      { '@type': 'WebPage', url: `${SITE}${path}` },
    ],
  };
}

let root: string;

function writePage(path: string, html: string) {
  const dir = join(root, path.replace(/^\/|\/$/g, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
}

function makeRoot(): string {
  const dir = join(tmpdir(), `tire-meta-audit-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe('classifyDistPage', () => {
  it('maps paths to page kinds', () => {
    expect(classifyDistPage('/')).toBe('home');
    expect(classifyDistPage('/compare/a-vs-b/')).toBe('compare');
    expect(classifyDistPage('/tire-size/205-55r16/')).toBe('tire-size');
    expect(classifyDistPage('/tire-sizes/')).toBe('tire-sizes-index');
    expect(classifyDistPage('/tire-sizes/truck/')).toBe('tire-category');
    expect(classifyDistPage('/calculators/tire-size-calculator/')).toBe('calculator');
    expect(classifyDistPage('/about/')).toBe('about');
    expect(classifyDistPage('/privacy-policy/')).toBe('info');
    // Former author profile routes are gone; they classify as generic info if ever hit.
    expect(classifyDistPage('/author/alex-morgan/')).toBe('info');
  });
});

describe('auditDistPageMetadata (failing fixtures prove the build stops)', () => {
  it('passes a fully valid info page and skips noindex pages', () => {
    root = makeRoot();
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', schema: infoSchema('/privacy-policy/') }));
    // A noindex redirect stub with no metadata must be ignored entirely.
    writePage(
      '/legacy-stub/',
      '<!doctype html><html><head><meta name="robots" content="noindex" /></head><body></body></html>',
    );

    const report = auditDistPageMetadata(root);
    expect(report.indexablePages).toBe(1);
    expect(
      report.issues,
      report.issues.map((i) => `[${i.check}] ${i.page}: ${i.message}`).join('\n'),
    ).toEqual([]);
  });

  it('fails when the canonical tag is missing', () => {
    root = makeRoot();
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', canonicalPath: null, schema: infoSchema('/privacy-policy/') }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'canonical' && i.severity === 'error')).toBe(true);
  });

  it('fails on zero or multiple H1 elements', () => {
    root = makeRoot();
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', h1s: ['One', 'Two'], schema: infoSchema('/privacy-policy/') }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'h1' && i.message.includes('found 2'))).toBe(true);
  });

  it('fails on malformed or brand-less titles', () => {
    root = makeRoot();
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', title: 'undefined  || Privacy', schema: infoSchema('/privacy-policy/') }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'title-malformed')).toBe(true);
    expect(report.issues.some((i) => i.check === 'title-brand')).toBe(true);
  });

  it('fails when og:url conflicts with the canonical', () => {
    root = makeRoot();
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', ogUrlPath: '/terms/', schema: infoSchema('/privacy-policy/') }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'og:url' && i.severity === 'error')).toBe(true);
  });

  it('fails when structured-data URLs conflict with the canonical', () => {
    root = makeRoot();
    const schema = infoSchema('/privacy-policy/');
    (schema['@graph'][1] as { url: string }).url = `${SITE}/terms/`;
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', schema }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'schema-url')).toBe(true);
  });

  it('fails when FAQ schema questions are not visibly rendered', () => {
    root = makeRoot();
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        infoSchema('/privacy-policy/')['@graph'][0],
        { '@type': 'WebPage', url: `${SITE}/privacy-policy/` },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is this question visible anywhere?',
              acceptedAnswer: { '@type': 'Answer', text: 'No.' },
            },
          ],
        },
      ],
    };
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', schema }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'faq-visibility')).toBe(true);
  });

  it('accepts FAQ schema when the question text is visible', () => {
    root = makeRoot();
    const question = 'Is this question visible anywhere?';
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        infoSchema('/privacy-policy/')['@graph'][0],
        { '@type': 'WebPage', url: `${SITE}/privacy-policy/` },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: question,
              acceptedAnswer: { '@type': 'Answer', text: 'Yes.' },
            },
          ],
        },
      ],
    };
    writePage(
      '/privacy-policy/',
      pageHtml({
        path: '/privacy-policy/',
        schema,
        body: `<section class="faq"><details class="faq-item"><summary>${question}</summary><p>Yes.</p></details></section>`,
      }),
    );
    const report = auditDistPageMetadata(root);
    expect(report.issues.filter((i) => i.check.startsWith('faq') && i.severity === 'error')).toEqual([]);
  });

  it('fails when a calculator page carries article schema', () => {
    root = makeRoot();
    const path = '/calculators/tire-size-calculator/';
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }],
        },
        { '@type': 'WebApplication', url: `${SITE}${path}` },
        { '@type': 'TechArticle', headline: 'Wrong', url: `${SITE}${path}` },
      ],
    };
    writePage(path, pageHtml({ path, schema }));
    const report = auditDistPageMetadata(root);
    expect(
      report.issues.some((i) => i.check === 'schema' && i.message.includes('TechArticle')),
    ).toBe(true);
  });

  it('fails when a category page is missing ItemList schema', () => {
    root = makeRoot();
    const path = '/tire-sizes/truck/';
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }],
        },
      ],
    };
    writePage(path, pageHtml({ path, schema }));
    const report = auditDistPageMetadata(root);
    expect(
      report.issues.some((i) => i.check === 'schema' && i.message.includes('ItemList')),
    ).toBe(true);
  });

  it('fails when two indexable pages share one canonical target', () => {
    root = makeRoot();
    writePage('/privacy-policy/', pageHtml({ path: '/privacy-policy/', schema: infoSchema('/privacy-policy/') }));
    const dupSchema = infoSchema('/privacy-policy/');
    writePage('/terms/', pageHtml({ path: '/terms/', canonicalPath: '/privacy-policy/', schema: dupSchema }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'duplicate-canonical')).toBe(true);
  });

  it('fails when comparison structured data uses the reverse pair order', () => {
    root = makeRoot();
    const path = '/compare/225-45-r17-vs-235-40-r18/';
    const reversedLabel = '235/40R18 vs 225/45R17';
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: reversedLabel, item: `${SITE}${path}` },
          ],
        },
        {
          '@type': 'TechArticle',
          headline: `${reversedLabel} Tire Size Comparison`,
          url: `${SITE}${path}`,
        },
      ],
    };
    writePage(path, pageHtml({ path, schema }));
    const report = auditDistPageMetadata(root);
    expect(report.issues.some((i) => i.check === 'compare-breadcrumb-order')).toBe(true);
    expect(report.issues.some((i) => i.check === 'compare-schema-order')).toBe(true);
  });
});
