import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_URL } from './constants';
import { validateProductionHostnames } from './production-hostname-validation';

let root = '';

function makeRoot(): string {
  const directory = join(
    tmpdir(),
    `tire-hostname-validation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(directory, { recursive: true });
  return directory;
}

function write(relativePath: string, content: string): void {
  const file = join(root, relativePath);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, content, 'utf8');
}

function page(path: string, schemaType: string): string {
  const url = `${SITE_URL}${path}`;
  return `<!doctype html><html><head>
<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/og-image.png">
<meta name="twitter:image" content="${SITE_URL}/og-image.png">
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': schemaType,
    url,
    breadcrumb: { '@type': 'BreadcrumbList', item: `${SITE_URL}/` },
  })}</script>
</head><body><h1>Fixture</h1></body></html>`;
}

function writeValidSite(): void {
  const paths = [
    ['index.html', '/', 'WebSite'],
    ['tire-size/205-55r16/index.html', '/tire-size/205-55r16/', 'TechArticle'],
    [
      'compare/205-55-r16-vs-215-55-r17/index.html',
      '/compare/205-55-r16-vs-215-55-r17/',
      'TechArticle',
    ],
    [
      'calculators/tire-size-calculator/index.html',
      '/calculators/tire-size-calculator/',
      'WebApplication',
    ],
  ] as const;
  for (const [file, path, type] of paths) write(file, page(path, type));

  const childLocs = paths
    .map(([, path]) => `<url><loc>${SITE_URL}${path}</loc></url>`)
    .join('');
  const child = `<?xml version="1.0"?><urlset>${childLocs}</urlset>`;
  write('sitemap-0.xml', child);
  write('sitemap.xml', child);
  write(
    'sitemap-index.xml',
    `<?xml version="1.0"?><sitemapindex><sitemap><loc>${SITE_URL}/sitemap-0.xml</loc></sitemap></sitemapindex>`,
  );
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`);
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = '';
});

describe('validateProductionHostnames', () => {
  it('accepts homepage, tire-size, comparison, and calculator SEO on the preferred host', () => {
    root = makeRoot();
    writeValidSite();

    const report = validateProductionHostnames(root);
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.canonicalsChecked).toBe(4);
    expect(report.sitemapUrlsChecked).toBe(9);
    expect(report.robotsSitemap).toBe(`${SITE_URL}/sitemap-index.xml`);
    expect(report.jsonLdUrlsChecked).toBeGreaterThanOrEqual(8);
  });

  it('rejects www, HTTP, preview, and localhost URLs in generated HTML metadata', () => {
    root = makeRoot();
    writeValidSite();
    write(
      'bad/index.html',
      `<!doctype html><head>
<link rel="canonical" href="https://www.tirereference.com/bad/">
<meta property="og:url" content="https://www.tirereference.com/other/">
<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: 'http://tirereference.com/bad/',
        image: 'https://preview-123.pages.dev/image.png',
      })}</script>
</head><body data-api="http://localhost:4321"></body>`,
    );

    const checks = validateProductionHostnames(root).issues.map(({ check }) => check);
    expect(checks).toEqual(
      expect.arrayContaining([
        'canonical-origin',
        'og-url-origin',
        'og-canonical-parity',
        'json-ld-origin',
        'public-url-origin',
      ]),
    );
  });

  it('rejects wrong hosts in the sitemap index and child sitemap', () => {
    root = makeRoot();
    writeValidSite();
    write(
      'sitemap-index.xml',
      '<sitemapindex><sitemap><loc>https://www.tirereference.com/sitemap-0.xml</loc></sitemap></sitemapindex>',
    );
    write(
      'sitemap-0.xml',
      '<urlset><url><loc>http://tirereference.com/</loc></url></urlset>',
    );

    const issues = validateProductionHostnames(root).issues;
    expect(issues.filter(({ check }) => check === 'sitemap-origin')).toHaveLength(2);
  });

  it('requires robots.txt to reference the preferred-host sitemap index exactly once', () => {
    root = makeRoot();
    writeValidSite();
    write('robots.txt', `Sitemap: ${SITE_URL}/sitemap.xml\n`);

    const report = validateProductionHostnames(root);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: 'robots-sitemap',
          file: '/robots.txt',
        }),
      ]),
    );
  });

  it('fails closed when dist or required SEO discovery files are missing', () => {
    root = makeRoot();
    expect(() => validateProductionHostnames(join(root, 'missing'))).toThrow(/missing/i);

    const report = validateProductionHostnames(root);
    expect(report.issues.map(({ check }) => check)).toEqual(
      expect.arrayContaining(['sitemap-file', 'robots-file']),
    );
  });
});
