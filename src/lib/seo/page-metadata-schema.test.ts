import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEO_DESCRIPTIONS, SEO_TITLES, SITE_URL } from './constants';
import { buildTireSizeHubPageTitle, formatPageTitle, truncateDescription } from './format';
import {
  buildAboutPageSchema,
  buildFaqPageSchema,
  buildHomePageSchema,
  buildItemListSchema,
  buildWebApplicationSchema,
  mergeJsonLd,
} from './schema';
import { buildEditorialArticleSchema } from './editorial-schema';
import {
  buildPageSchema,
  calculatorBreadcrumbs,
  comparisonBreadcrumbs,
  hubBreadcrumbs,
} from './page-schemas';
import { resolveCanonical } from './urls';
import {
  buildHeadFixture,
  extractPageMetadata,
  validatePageMetadata,
} from './metadata-validation';
import { getVisibleTireSizeCalculatorFaqs } from '../tire-size-calculator-faqs';
import { buildComparisonSeoBundle } from '../comparison-seo';
import { buildComparisonInsights } from '../tire-comparison-insights';
import { compareTires, getTireSpecs } from '../tire-math';
import { buildTireSizeHubData } from '../tire-size-hub';
import { buildTireSizeGuideData } from '../tire-size-guide';
import { hubPagePath } from '../tire-size-url';
import { canonicalComparisonPath } from '../comparison-url';
import { SITE_CONTENT_UPDATED } from '../editorial';
import {
  TIRE_CATEGORY_HUBS,
  buildTireCategoryHubData,
  tireCategoryHubPath,
} from '../tire-category-hubs';
import { CALCULATION_LOGIC_UPDATED } from '../eeat-metadata';

function schemaTypes(schema: Record<string, unknown> | undefined): string[] {
  if (!schema) return [];
  const types = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record = node as Record<string, unknown>;
    const type = record['@type'];
    if (typeof type === 'string') types.add(type);
    if (Array.isArray(record['@graph'])) visit(record['@graph']);
  };
  visit(schema);
  return [...types].sort();
}

describe('representative page metadata + schema consistency', () => {
  it('homepage uses WebSite + Organization only', () => {
    const schema = buildHomePageSchema();
    const html = buildHeadFixture({
      title: SEO_TITLES.homepage,
      description: SEO_DESCRIPTIONS.homepage,
      path: '/',
      schema,
      h1: 'Precision Tire Calculators & Size Guides',
    });
    const issues = validatePageMetadata(html, {
      kind: 'home',
      expectedPath: '/',
      requiredSchemaTypes: ['WebSite', 'Organization'],
      allowedSchemaTypes: ['WebSite', 'Organization'],
      forbiddenSchemaTypes: ['Article', 'TechArticle', 'FAQPage', 'WebApplication'],
    });
    expect(issues).toEqual([]);
    expect(schemaTypes(schema)).toEqual(['Organization', 'WebSite']);
  });

  it('tire-size hub has TechArticle + BreadcrumbList + FAQ when FAQs exist', () => {
    const size = '275/70R18';
    const hub = buildTireSizeHubData(size)!;
    const guide = buildTireSizeGuideData(hub);
    const path = hubPagePath(size);
    const title = buildTireSizeHubPageTitle(hub.displaySize);
    const description = `${hub.displaySize} tire size guide.`;
    const schema = buildPageSchema({
      breadcrumbs: hubBreadcrumbs(hub.displaySize, path, {
        name: TIRE_CATEGORY_HUBS.truck.label,
        item: tireCategoryHubPath('truck'),
      }),
      faqs: guide.faq,
      extra: [
        buildEditorialArticleSchema({
          headline: `${hub.displaySize} Tire Size — Diameter, Specs & Fitment`,
          description,
          url: path,
          datePublished: SITE_CONTENT_UPDATED,
          dateModified: SITE_CONTENT_UPDATED,
        }),
      ],
    });

    const faqMarkup = guide.faq
      .map((faq) => `<details class="faq"><summary>${faq.question}</summary><p>${faq.answer}</p></details>`)
      .join('');
    const html = buildHeadFixture({
      title,
      description,
      path,
      schema,
      h1: `${hub.displaySize} Tire Size Guide`,
      bodyExtra: `<section class="faq" aria-label="FAQ">${faqMarkup}</section>`,
    });

    const issues = validatePageMetadata(html, {
      kind: 'tire-size',
      expectedPath: path,
      expectedTitleContains: hub.displaySize,
      requiredSchemaTypes: ['BreadcrumbList', 'TechArticle'],
      forbiddenSchemaTypes: ['WebSite', 'Organization', 'WebApplication'],
      requireFaqSchema: guide.faq.length > 0,
    });
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);

    const article = (schema as { '@graph': Record<string, unknown>[] })['@graph']
      .find((n) => n['@type'] === 'TechArticle');
    expect(article?.url).toBe(resolveCanonical(path));
    expect(article?.datePublished).toBe(SITE_CONTENT_UPDATED);
  });

  it('comparison pair page schema matches canonical pair and breadcrumbs', () => {
    const current = '225/45R17';
    const next = '235/40R18';
    const comparison = compareTires(current, next, 60);
    const specsA = getTireSpecs(current);
    const specsB = getTireSpecs(next);
    const seo = buildComparisonSeoBundle(current, next, comparison, specsA, specsB);
    const insights = buildComparisonInsights(current, next, comparison, specsA, specsB);
    const path = canonicalComparisonPath(current, next);
    const faqs = insights.seo.faqs;
    const schema = buildPageSchema({
      breadcrumbs: comparisonBreadcrumbs(current, next),
      faqs,
      extra: [
        buildEditorialArticleSchema({
          headline: seo.title,
          description: seo.metaDescription,
          url: path,
        }),
      ],
    });

    const faqMarkup = faqs
      .map((faq) => `<details class="faq"><summary>${faq.question}</summary><p>${faq.answer}</p></details>`)
      .join('');
    const html = buildHeadFixture({
      title: seo.title,
      description: seo.metaDescription,
      path,
      schema,
      h1: seo.h1,
      bodyExtra: `<section class="faq">${faqMarkup}</section>`,
    });

    const issues = validatePageMetadata(html, {
      kind: 'compare',
      expectedPath: path,
      requiredSchemaTypes: ['BreadcrumbList', 'TechArticle', 'FAQPage'],
      forbiddenSchemaTypes: ['WebApplication', 'WebSite', 'Organization'],
    });
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);

    const crumbs = (schema as { '@graph': Record<string, unknown>[] })['@graph']
      .find((n) => n['@type'] === 'BreadcrumbList');
    const items = crumbs?.itemListElement as Array<{ item?: string; name: string }>;
    expect(items.at(-1)?.item).toBe(resolveCanonical(path));
    expect(items.at(-1)?.name).toContain('vs');
  });

  it('calculator pages use WebApplication without Article/WebSite/Organization', () => {
    const path = '/calculators/tire-size-calculator/';
    const faqs = [...getVisibleTireSizeCalculatorFaqs()];
    const schema = buildPageSchema({
      breadcrumbs: calculatorBreadcrumbs('Tire Size Calculator'),
      faqs,
      extra: [
        buildWebApplicationSchema({
          name: 'Tire Size Calculator',
          description: SEO_DESCRIPTIONS.tireSizeCalculator,
          url: path,
          dateModified: CALCULATION_LOGIC_UPDATED,
          id: 'tire-size-calculator',
        }),
      ],
    });

    expect(schemaTypes(schema)).toEqual(['BreadcrumbList', 'FAQPage', 'WebApplication']);
    expect(schemaTypes(schema)).not.toContain('TechArticle');
    expect(schemaTypes(schema)).not.toContain('Organization');

    const faqMarkup = faqs
      .map((faq) => `<details class="tsc-faq__item"><summary>${faq.question}</summary><p>${faq.answer}</p></details>`)
      .join('');
    const html = buildHeadFixture({
      title: 'Tire Size Calculator – Specs & Diameter',
      description: SEO_DESCRIPTIONS.tireSizeCalculator,
      path,
      schema,
      h1: 'Tire Size Calculator',
      bodyExtra: `<section class="tsc-faq" aria-label="FAQ">${faqMarkup}</section>`,
    });

    const issues = validatePageMetadata(html, {
      kind: 'calculator',
      expectedPath: path,
      requiredSchemaTypes: ['WebApplication', 'BreadcrumbList', 'FAQPage'],
      forbiddenSchemaTypes: ['Article', 'TechArticle', 'WebSite', 'Organization'],
    });
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);

    const app = (schema as { '@graph': Record<string, unknown>[] })['@graph']
      .find((n) => n['@type'] === 'WebApplication');
    expect(app?.aggregateRating).toBeUndefined();
    expect(app?.review).toBeUndefined();
    expect(app?.url).toBe(resolveCanonical(path));
  });

  it('category directory includes ItemList + BreadcrumbList', () => {
    const hub = buildTireCategoryHubData('passenger');
    const schema = buildPageSchema({
      breadcrumbs: [
        { name: 'Home', item: '/' },
        { name: 'Tire Sizes', item: '/tire-sizes/' },
        { name: hub.label, item: hub.path },
      ],
      extra: [
        buildItemListSchema({
          name: `Common ${hub.label} tire sizes`,
          description: hub.description,
          url: hub.path,
          items: hub.sizes.map((row) => ({ name: row.entry.size, url: row.href })),
        }),
      ],
    });

    expect(schemaTypes(schema)).toEqual(['BreadcrumbList', 'ItemList']);
    const list = (schema as { '@graph': Record<string, unknown>[] })['@graph']
      .find((n) => n['@type'] === 'ItemList');
    expect(list?.url).toBe(resolveCanonical(hub.path));
    expect(list?.numberOfItems).toBe(hub.sizes.length);
  });

  it('about page uses AboutPage without embedding Organization node', () => {
    const schema = buildPageSchema({
      breadcrumbs: [
        { name: 'Home', item: '/' },
        { name: 'About', item: '/about/' },
      ],
      extra: [
        buildAboutPageSchema({
          name: 'About Tire Reference',
          description: 'About the site.',
          url: '/about/',
        }),
      ],
    });
    expect(schemaTypes(schema)).toEqual(['AboutPage', 'BreadcrumbList']);
    expect(schemaTypes(schema)).not.toContain('Organization');
  });

  it('FAQPage schema is omitted when FAQ list is empty', () => {
    expect(buildFaqPageSchema([])).toBeUndefined();
    const schema = buildPageSchema({
      breadcrumbs: calculatorBreadcrumbs('Test'),
      faqs: [],
    });
    expect(schemaTypes(schema)).toEqual(['BreadcrumbList']);
  });

  it('metadata helpers keep title, description, and OG fields aligned', () => {
    const title = formatPageTitle('Sample Page');
    const description = truncateDescription('A short description for alignment checks.');
    const html = buildHeadFixture({
      title: 'Sample Page',
      description,
      path: '/about/',
      h1: 'Sample Page',
    });
    const meta = extractPageMetadata(html);
    expect(meta.title).toBe(title);
    expect(meta.ogTitle).toBe(title);
    expect(meta.twitterTitle).toBe(title);
    expect(meta.ogDescription).toBe(description);
    expect(meta.ogUrl).toBe(`${SITE_URL}/about/`);
    expect(meta.canonical).toBe(meta.ogUrl);
  });
});

describe('rendered dist metadata (when VALIDATE_DIST=1)', () => {
  const dist = join(process.cwd(), 'dist');
  const runDist = process.env.VALIDATE_DIST === '1';

  const samples: Array<{
    file: string;
    path: string;
    required: string[];
    forbidden: string[];
    titleContains?: string;
  }> = [
    {
      file: 'index.html',
      path: '/',
      required: ['WebSite', 'Organization'],
      forbidden: ['TechArticle', 'WebApplication', 'FAQPage'],
    },
    {
      file: 'tire-size/275-70r18/index.html',
      path: '/tire-size/275-70r18/',
      required: ['BreadcrumbList', 'TechArticle'],
      forbidden: ['WebSite', 'Organization', 'WebApplication'],
      titleContains: '275/70R18',
    },
    {
      file: 'compare/225-45-r17-vs-235-40-r18/index.html',
      path: '/compare/225-45-r17-vs-235-40-r18/',
      required: ['BreadcrumbList', 'TechArticle'],
      forbidden: ['WebApplication', 'WebSite'],
    },
    {
      file: 'calculators/tire-size-calculator/index.html',
      path: '/calculators/tire-size-calculator/',
      required: ['WebApplication', 'BreadcrumbList'],
      forbidden: ['TechArticle', 'Article', 'WebSite', 'Organization'],
    },
    {
      file: 'calculators/wheel-offset-calculator/index.html',
      path: '/calculators/wheel-offset-calculator/',
      required: ['WebApplication', 'BreadcrumbList'],
      forbidden: ['TechArticle', 'Article', 'WebSite', 'Organization'],
    },
    {
      file: 'tire-sizes/passenger/index.html',
      path: '/tire-sizes/passenger/',
      required: ['BreadcrumbList', 'ItemList'],
      forbidden: ['TechArticle', 'WebApplication', 'Organization'],
    },
    {
      file: 'about/index.html',
      path: '/about/',
      required: ['AboutPage', 'BreadcrumbList'],
      forbidden: ['Organization', 'WebSite', 'TechArticle'],
    },
  ];

  for (const sample of samples) {
    it.skipIf(!runDist)(`validates ${sample.path}`, () => {
      const full = join(dist, sample.file);
      expect(existsSync(full), `missing ${full}`).toBe(true);
      const html = readFileSync(full, 'utf8');
      const issues = validatePageMetadata(html, {
        kind: 'other',
        expectedPath: sample.path,
        requiredSchemaTypes: sample.required,
        forbiddenSchemaTypes: sample.forbidden,
        expectedTitleContains: sample.titleContains,
      });
      expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
    });
  }
});

describe('mergeJsonLd helpers', () => {
  it('does not invent ratings on WebApplication', () => {
    const schema = buildWebApplicationSchema({
      name: 'Gear Ratio Calculator',
      description: 'Test',
      url: '/calculators/gear-ratio-calculator/',
    });
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.offers).toBeUndefined();
  });

  it('normalizes schema URLs with trailing slashes', () => {
    const merged = mergeJsonLd([
      buildAboutPageSchema({
        name: 'Privacy',
        description: 'Policy',
        url: '/privacy-policy',
      }),
    ]);
    expect(merged?.url ?? (merged as { '@graph'?: Array<{ url?: string }> })?.['@graph']?.[0]?.url).toBe(
      `${SITE_URL}/privacy-policy/`,
    );
  });
});
