import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TIRE_SIZES } from '../data/tire-sizes';
import {
  canonicalComparisonPath,
  normalizeComparisonTireSize,
  parseComparisonSlug,
  parseComparisonTireSize,
} from './comparison-url';
import { buildComparisonInsights } from './tire-comparison-insights';
import {
  getAllComparisonSlugs,
  isValidComparisonPair,
} from './tire-comparison-links';
import { extractComparisonContentBlocks } from './tire-comparison-quality-validator';
import { compareTires, getTireSpecs } from './tire-math';
import { buildTireSizeGuideData } from './tire-size-guide';
import { buildTireSizeHubData } from './tire-size-hub';
import { hubPagePath, sizeToSlug } from './tire-size-url';
import { buildTireSizeHubPageTitle } from './seo/format';
import { comparisonBreadcrumbs } from './seo/page-schemas';
import { articleForInch as expectedArticleForInch } from './inch-article';
import {
  TIRE_HUB_CATEGORY_SLUGS,
  buildTireCategoryHubData,
} from './tire-category-hubs';
import { isParameterizedComparisonUrl } from './crawlable-links';
import { SITE_URL } from './seo/constants';

export type ValidationSeverity = 'warning' | 'error';
export type GeneratedPageType = 'comparison' | 'tire-size' | 'tire-category';

export interface GeneratedPageValidationIssue {
  severity: ValidationSeverity;
  pageType: GeneratedPageType;
  page: string;
  check: string;
  message: string;
}

export interface GeneratedPageValidationSummary {
  totalPages: number;
  comparisonPages: number;
  tireSizePages: number;
  tireCategoryPages: number;
  warnings: number;
  errors: number;
  issues: GeneratedPageValidationIssue[];
}

interface ValidationContext {
  issues: GeneratedPageValidationIssue[];
  pageType: GeneratedPageType;
  page: string;
}

const PLACEHOLDER_PATTERN =
  /\b(?:undefined|null|todo|tbd|placeholder|lorem ipsum|coming soon)\b/i;
const INCOMPLETE_SEPARATOR_PATTERN =
  /(?:&\s*\||\|\s*&|(?:^|\s)[|—]\s*$|(?:^|\s)&\s*$)/;
const EMPTY_PUNCTUATION_PATTERNS = [
  /\(\s*\)/,
  /\[\s*\]/,
  /(?:^|\s)[,;:](?:\s|$)/,
] as const;
const ARTICLE_INCH_PATTERN =
  /\b(a|an)\s+(\d+(?:\.\d+)?)(?:-inch\b|["”]\s+rim\b)/gi;

function addIssue(
  context: ValidationContext,
  check: string,
  message: string,
  severity: ValidationSeverity = 'error',
): void {
  context.issues.push({
    severity,
    pageType: context.pageType,
    page: context.page,
    check,
    message,
  });
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function containsSize(text: string, size: string): boolean {
  return normalizeText(text).toUpperCase().includes(size.toUpperCase());
}

function numbersClose(actual: number, expected: number, tolerance = 1e-8): boolean {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
}

/** Reusable grammar and placeholder checks for indexable text. */
export function validateIndexableText(
  text: string,
  context: ValidationContext,
  field: string,
): void {
  if (!text.trim()) {
    addIssue(context, 'empty-copy', `${field} is empty.`);
    return;
  }

  if (/\S[ \t]{2,}\S/.test(text)) {
    addIssue(context, 'duplicate-spaces', `${field} contains duplicate spaces: "${text}".`);
  }
  if (PLACEHOLDER_PATTERN.test(text)) {
    addIssue(context, 'placeholder-copy', `${field} contains placeholder-like content: "${text}".`);
  }
  if (INCOMPLETE_SEPARATOR_PATTERN.test(text)) {
    addIssue(context, 'incomplete-separator', `${field} contains an incomplete title separator: "${text}".`);
  }
  for (const pattern of EMPTY_PUNCTUATION_PATTERNS) {
    if (pattern.test(text)) {
      addIssue(context, 'empty-punctuation', `${field} contains empty punctuation: "${text}".`);
      break;
    }
  }

  for (const match of text.matchAll(ARTICLE_INCH_PATTERN)) {
    const actual = match[1].toLowerCase() as 'a' | 'an';
    const value = Number(match[2]);
    const expected = expectedArticleForInch(value);
    if (actual !== expected) {
      addIssue(
        context,
        'inch-article',
        `${field} uses "${match[0]}"; expected "${expected} ${match[2]}-inch".`,
      );
    }
  }
}

function geometryMatches(left: string, right: string): boolean {
  // Product feeds may append load range/service data: LT275/70R18/E 125/122S.
  const productGeometry = left.replace(/\/[A-Z](?:\s.*)?$/i, '');
  const a = parseComparisonTireSize(productGeometry);
  const b = parseComparisonTireSize(right);
  return Boolean(
    a &&
      b &&
      numbersClose(a.widthMm, b.widthMm) &&
      numbersClose(a.aspectRatio, b.aspectRatio) &&
      numbersClose(a.wheelDiameterIn, b.wheelDiameterIn),
  );
}

function validateComparisonLink(
  href: string,
  currentSize: string,
  publishedPaths: ReadonlySet<string>,
  context: ValidationContext,
  field: string,
): void {
  if (!href.startsWith('/compare/')) {
    addIssue(context, 'related-comparison-link', `${field} is not a clean comparison URL: ${href}`);
    return;
  }
  if (!publishedPaths.has(href)) {
    addIssue(context, 'related-comparison-link', `${field} points to an unpublished comparison: ${href}`);
    return;
  }
  const parsed = parseComparisonSlug(href.replace(/^\/compare\//, '').replace(/\/$/, ''));
  if (!parsed || !parsed.isCanonical) {
    addIssue(context, 'related-comparison-link', `${field} is malformed or non-canonical: ${href}`);
    return;
  }
  if (
    parsed.canonical.current !== currentSize &&
    parsed.canonical.new !== currentSize
  ) {
    addIssue(
      context,
      'related-comparison-link',
      `${field} does not contain the current size ${currentSize}: ${href}`,
    );
  }
}

function validateComparisonSourceData(
  issues: GeneratedPageValidationIssue[],
): number {
  const pages = getAllComparisonSlugs();
  const publishedPaths = new Set(
    pages.map(({ current, new: next }) => canonicalComparisonPath(current, next)),
  );
  const seenCanonicals = new Set<string>();

  for (const { slug, current, new: next } of pages) {
    const page = canonicalComparisonPath(current, next);
    const context: ValidationContext = { issues, pageType: 'comparison', page };
    const parsed = parseComparisonSlug(slug);

    if (!parsed) {
      addIssue(context, 'comparison-slug', `Generated slug cannot be parsed: ${slug}`);
      continue;
    }
    if (!parsed.isCanonical) {
      addIssue(context, 'comparison-slug', `Generated slug is not canonical: ${slug}`);
    }
    if (parsed.canonical.current !== current) {
      addIssue(context, 'url-size-1', `URL size 1 ${parsed.canonical.current} does not match page-data size 1 ${current}.`);
    }
    if (parsed.canonical.new !== next) {
      addIssue(context, 'url-size-2', `URL size 2 ${parsed.canonical.new} does not match page-data size 2 ${next}.`);
    }
    if (current === next) {
      addIssue(context, 'same-size-comparison', `Same-size comparison is not supported: ${current}.`);
    }
    if (!isValidComparisonPair(current, next)) {
      addIssue(context, 'comparison-pair', `Generated pair fails comparison validation: ${current} vs ${next}.`);
    }

    const canonical = canonicalComparisonPath(current, next);
    if (canonical !== page || parsed.canonicalPath !== page) {
      addIssue(context, 'canonical', `Canonical path does not match generated slug: ${canonical} vs ${page}.`);
    }
    if (seenCanonicals.has(canonical)) {
      addIssue(context, 'duplicate-canonical', `Duplicate canonical URL: ${canonical}.`);
    }
    seenCanonicals.add(canonical);

    const specsA = getTireSpecs(current);
    const specsB = getTireSpecs(next);
    const comparison = compareTires(current, next, 60);
    const insights = buildComparisonInsights(current, next, comparison, specsA, specsB);
    const measurements = insights.engineeringAnalysis.measurements;
    const title = insights.seo.title;
    const h1 = insights.seo.h1;
    const answer = insights.pageIntro.sentence;
    const breadcrumb = comparisonBreadcrumbs(current, next).at(-1);

    if (!containsSize(title, current) || !containsSize(title, next)) {
      addIssue(context, 'title-sizes', `Title does not contain both generated sizes: "${title}".`);
    }
    if (!containsSize(h1, current) || !containsSize(h1, next)) {
      addIssue(context, 'h1-sizes', `H1 does not contain both generated sizes: "${h1}".`);
    }
    if (h1 !== `${current} vs ${next} Tire Size Comparison`) {
      addIssue(context, 'h1-normalized', `H1 is not the normalized pair heading: "${h1}".`);
    }
    if (!containsSize(answer, current) || !containsSize(answer, next)) {
      addIssue(context, 'answer-sizes', `Pair answer does not contain both generated sizes.`);
    }
    if (!/dimensional calculations only|dimensional math only/i.test(answer)) {
      addIssue(context, 'answer-fitment-disclaimer', `Pair answer missing dimensional-vs-fitment disclaimer.`);
    }
    if (
      !breadcrumb ||
      !containsSize(breadcrumb.name, current) ||
      !containsSize(breadcrumb.name, next) ||
      breadcrumb.item !== canonical
    ) {
      addIssue(context, 'breadcrumb-sizes', `Breadcrumb does not match ${current} vs ${next}.`);
    }
    if (measurements.sizeA !== current || measurements.sizeB !== next) {
      addIssue(
        context,
        'measurement-pair',
        `Measurements use ${measurements.sizeA} vs ${measurements.sizeB}, expected ${current} vs ${next}.`,
      );
    }
    if (
      !numbersClose(measurements.specsA.overallDiameterIn, specsA.overallDiameterIn) ||
      !numbersClose(measurements.specsB.overallDiameterIn, specsB.overallDiameterIn) ||
      !numbersClose(
        measurements.comparison.diameterDiffIn,
        comparison.diameterDiffIn,
      )
    ) {
      addIssue(context, 'measurement-values', `Calculated measurements do not match the generated pair.`);
    }

    for (const link of insights.popularComparisons) {
      validateComparisonLink(
        link.href,
        current,
        publishedPaths,
        context,
        `popular comparison "${link.label}"`,
      );
    }
    for (const card of insights.upgradePaths?.cards ?? []) {
      if (!card.href) continue;
      validateComparisonLink(
        card.href,
        current,
        publishedPaths,
        context,
        `upgrade comparison "${card.size}"`,
      );
    }

    validateIndexableText(title, context, 'title');
    validateIndexableText(insights.seo.metaDescription, context, 'meta description');
    validateIndexableText(h1, context, 'H1');
    for (const block of extractComparisonContentBlocks(insights)) {
      validateIndexableText(block.text, context, block.id);
    }
  }

  return pages.length;
}

function validateTireCategorySourceData(
  issues: GeneratedPageValidationIssue[],
): number {
  for (const slug of TIRE_HUB_CATEGORY_SLUGS) {
    const hub = buildTireCategoryHubData(slug);
    const context: ValidationContext = {
      issues,
      pageType: 'tire-category',
      page: hub.path,
    };

    validateIndexableText(hub.h1, context, 'H1');
    validateIndexableText(hub.description, context, 'meta description');
    validateIndexableText(hub.introduction, context, 'introduction');
    if (hub.sizes.length === 0) {
      addIssue(context, 'category-sizes', 'Category has no data-backed tire sizes.');
    }
    if (hub.considerations.length < 3) {
      addIssue(context, 'category-guidance', 'Category has insufficient selection guidance.');
    }
    if (hub.comparisons.length === 0) {
      addIssue(context, 'category-comparisons', 'Category has no popular comparison links.');
    }
    if (hub.calculators.length === 0) {
      addIssue(context, 'category-calculators', 'Category has no relevant calculator links.');
    }
    if (hub.guides.length === 0) {
      addIssue(context, 'category-guides', 'Category has no educational guide links.');
    }
  }
  return TIRE_HUB_CATEGORY_SLUGS.length;
}

function validateTireSizeComparisonHref(
  href: string | null,
  currentSize: string,
  context: ValidationContext,
  field: string,
): void {
  if (!href) return;

  if (isParameterizedComparisonUrl(href)) {
    addIssue(
      context,
      'parameterized-comparison-link',
      `${field} uses a parameterized comparison URL: ${href}`,
    );
    return;
  }

  if (href.startsWith('/compare/')) {
    const parsed = parseComparisonSlug(href.replace(/^\/compare\//, '').replace(/\/$/, ''));
    if (
      !parsed ||
      (parsed.canonical.current !== currentSize && parsed.canonical.new !== currentSize)
    ) {
      addIssue(context, 'tire-size-comparison-link', `${field} does not contain ${currentSize}: ${href}`);
    } else if (!parsed.isCanonical) {
      addIssue(
        context,
        'non-canonical-comparison-link',
        `${field} is not the canonical comparison path: ${href}`,
      );
    }
    return;
  }

  // Blank comparison calculator (no query) is allowed as a crawlable fallback.
  try {
    const url = new URL(href, SITE_URL);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (
      path.endsWith('/calculators/tire-comparison-calculator') &&
      ![...url.searchParams.keys()].length
    ) {
      return;
    }
    addIssue(
      context,
      'tire-size-comparison-link',
      `${field} is not a crawlable comparison destination: ${href}`,
    );
  } catch {
    addIssue(context, 'tire-size-comparison-link', `${field} is malformed: ${href}`);
  }
}

function validateTireSizeSourceData(
  issues: GeneratedPageValidationIssue[],
): number {
  const knownPaths = new Set(TIRE_SIZES.map(({ size }) => hubPagePath(size)));

  for (const entry of TIRE_SIZES) {
    const page = hubPagePath(entry.size);
    const context: ValidationContext = { issues, pageType: 'tire-size', page };
    const hub = buildTireSizeHubData(entry.size);
    if (!hub) {
      addIssue(context, 'hub-data', `No hub data was generated for ${entry.size}.`);
      continue;
    }
    const guide = buildTireSizeGuideData(hub);
    const expectedSize = normalizeComparisonTireSize(entry.size);
    const urlSize = normalizeComparisonTireSize(hub.entry.size);
    const title = buildTireSizeHubPageTitle(hub.displaySize);
    const h1 = `${hub.displaySize} Tire Size`;

    if (!expectedSize || urlSize !== expectedSize || guide.size !== expectedSize) {
      addIssue(
        context,
        'url-size',
        `URL/data size mismatch: URL ${entry.size}, hub ${hub.entry.size}, guide ${guide.size}.`,
      );
    }
    if (!containsSize(title, entry.size)) {
      addIssue(context, 'title-size', `Title does not contain ${entry.size}: "${title}".`);
    }
    if (!containsSize(h1, entry.size)) {
      addIssue(context, 'h1-size', `H1 does not contain ${entry.size}: "${h1}".`);
    }

    const expectedSpecs = getTireSpecs(entry.size);
    if (
      !numbersClose(hub.specs.widthMm, expectedSpecs.widthMm) ||
      !numbersClose(hub.specs.aspectRatio, expectedSpecs.aspectRatio) ||
      !numbersClose(hub.specs.wheelDiameterIn, expectedSpecs.wheelDiameterIn) ||
      !numbersClose(hub.specs.overallDiameterIn, expectedSpecs.overallDiameterIn)
    ) {
      addIssue(context, 'specification-size', `Specification cards were not calculated from ${entry.size}.`);
    }

    const expectedCardValues = new Map<string, string>([
      ['overall diameter', expectedSpecs.overallDiameterIn.toFixed(2)],
      ['section width', expectedSpecs.sectionWidthIn.toFixed(2)],
      ['sidewall height', expectedSpecs.sidewallIn.toFixed(2)],
      ['circumference', expectedSpecs.circumferenceIn.toFixed(2)],
      ['revolutions / mile', String(Math.round(expectedSpecs.revsPerMile))],
    ]);
    for (const card of hub.premiumSpecCards) {
      const expected = expectedCardValues.get(card.label.toLowerCase());
      if (expected != null && card.value !== expected) {
        addIssue(
          context,
          'specification-card',
          `${card.label} card is "${card.value}", expected "${expected}" for ${entry.size}.`,
        );
      }
    }

    const rimRow = guide.glance.find((row) => row.label.toLowerCase() === 'rim diameter');
    const expectedRim = `${expectedSpecs.wheelDiameterIn}"`;
    if (!rimRow || rimRow.value !== expectedRim) {
      addIssue(
        context,
        'rim-diameter',
        `Rim Diameter is "${rimRow?.value ?? 'missing'}"; expected "${expectedRim}".`,
      );
    }
    const flotation = parseComparisonTireSize(hub.flotation);
    if (!flotation || !numbersClose(flotation.wheelDiameterIn, expectedSpecs.wheelDiameterIn)) {
      addIssue(context, 'rim-diameter', `Flotation reference does not use the ${expectedRim} rim: ${hub.flotation}.`);
    }
    for (const match of hub.intro.matchAll(/(\d+(?:\.\d+)?)["”]\s+(?:wheel|rim)\b/gi)) {
      if (!numbersClose(Number(match[1]), expectedSpecs.wheelDiameterIn)) {
        addIssue(
          context,
          'rim-diameter',
          `Intro references a ${match[1]}" wheel/rim; expected ${expectedRim}.`,
        );
      }
    }

    const productCollections = [
      ['products', guide.products],
      ['fullSpecProducts', guide.fullSpecProducts],
    ] as const;
    for (const [collection, products] of productCollections) {
      products.forEach((product, index) => {
        if (!geometryMatches(product.tire_size, entry.size)) {
          addIssue(
            context,
            'product-size',
            `${collection}[${index}] has ${product.tire_size}; expected geometry ${entry.size}.`,
          );
        }
      });
    }

    const nearbyCollections = [
      ['equivalents', guide.equivalents],
      ['upgrades', guide.upgrades],
      ['related', guide.related],
    ] as const;
    for (const [collection, links] of nearbyCollections) {
      links.forEach((link, index) => {
        if (!knownPaths.has(link.href) || link.href !== hubPagePath(link.size)) {
          addIssue(
            context,
            'nearby-size-link',
            `${collection}[${index}] points to invalid tire-size page: ${link.href}.`,
          );
        }
      });
    }

    validateTireSizeComparisonHref(guide.compareHref, entry.size, context, 'guide.compareHref');
    hub.quickComparisons.forEach((row, index) =>
      validateTireSizeComparisonHref(
        row.comparisonHref,
        entry.size,
        context,
        `quickComparisons[${index}]`,
      ),
    );
    [...hub.upgradePathsUp, ...hub.upgradePathsDown].forEach((row, index) =>
      validateTireSizeComparisonHref(
        row.comparisonHref,
        entry.size,
        context,
        `upgradePaths[${index}]`,
      ),
    );

    validateIndexableText(title, context, 'title');
    validateIndexableText(h1, context, 'H1');
    validateIndexableText(hub.intro, context, 'intro');
    guide.bestFor.forEach((item, index) =>
      validateIndexableText(item.text, context, `bestFor[${index}]`),
    );
    guide.considerIf.forEach((item, index) =>
      validateIndexableText(item.text, context, `considerIf[${index}]`),
    );
    guide.realWorldImpact.forEach((item, index) =>
      validateIndexableText(item.text, context, `realWorldImpact[${index}]`),
    );
    guide.faq.forEach((faq, index) => {
      validateIndexableText(faq.question, context, `faq[${index}].question`);
      validateIndexableText(faq.answer, context, `faq[${index}].answer`);
    });
  }

  return TIRE_SIZES.length;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)));
}

function stripTags(value: string): string {
  return normalizeText(decodeHtml(value.replace(/<[^>]+>/g, ' ')));
}

function extractVisibleText(html: string): string {
  return stripTags(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' '),
  );
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripTags(match[1]) : null;
}

function extractCanonical(html: string): string | null {
  return html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? null;
}

function extractBreadcrumb(html: string): string | null {
  const match = html.match(
    /<nav\b[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i,
  );
  return match ? stripTags(match[1]) : null;
}

function extractIslandStringProp(html: string, name: string): string | null {
  const encoded = html.match(
    new RegExp(`${name}&quot;:\\[0,&quot;([^&]+)&quot;\\]`, 'i'),
  )?.[1];
  return encoded ? decodeHtml(encoded) : null;
}

function readBuiltPage(distDir: string, relativePath: string): string | null {
  try {
    return readFileSync(join(distDir, relativePath, 'index.html'), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Reversed-duplicate guard against the actual build output: every
 * `dist/compare/<slug>/` directory must be a canonical slug from the
 * generated route list, and the sitemap must contain exactly one comparison
 * URL per unordered pair (never a reversed variant).
 */
export function validateComparisonDistDedup(
  distDir: string,
  issues: GeneratedPageValidationIssue[],
): void {
  const canonicalSlugs = new Set(getAllComparisonSlugs().map(({ slug }) => slug));

  const compareDir = join(distDir, 'compare');
  const builtSlugs = existsSync(compareDir)
    ? readdirSync(compareDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

  for (const slug of builtSlugs) {
    const context: ValidationContext = {
      issues,
      pageType: 'comparison',
      page: `/compare/${slug}/`,
    };
    if (!canonicalSlugs.has(slug)) {
      addIssue(context, 'reversed-page', `Non-canonical comparison page exists in dist: /compare/${slug}/.`);
      continue;
    }
    const [a, b] = slug.split('-vs-');
    if (a && b && builtSlugs.includes(`${b}-vs-${a}`)) {
      addIssue(context, 'reversed-page', `Reversed duplicate page also exists in dist: /compare/${b}-vs-${a}/.`);
    }
  }
  if (builtSlugs.length !== canonicalSlugs.size) {
    const context: ValidationContext = { issues, pageType: 'comparison', page: '/compare/' };
    addIssue(context, 'page-count', `dist has ${builtSlugs.length} comparison pages; expected ${canonicalSlugs.size} unique unordered pairs.`);
  }

  const sitemapFile = join(distDir, 'sitemap-0.xml');
  if (!existsSync(sitemapFile)) {
    const context: ValidationContext = { issues, pageType: 'comparison', page: '/sitemap-0.xml' };
    addIssue(context, 'sitemap', 'sitemap-0.xml is missing from dist.');
    return;
  }
  const sitemap = readFileSync(sitemapFile, 'utf8');
  const compareLocs = [...sitemap.matchAll(/<loc>([^<]*\/compare\/([^<\/]+)\/)<\/loc>/g)];
  const seenPairs = new Map<string, string>();
  for (const [, loc, slug] of compareLocs) {
    const context: ValidationContext = { issues, pageType: 'comparison', page: loc };
    if (!canonicalSlugs.has(slug)) {
      addIssue(context, 'sitemap-reversed', `Sitemap contains a non-canonical comparison URL: ${loc}.`);
      continue;
    }
    const pairKey = slug.split('-vs-').sort().join('|');
    const previous = seenPairs.get(pairKey);
    if (previous) {
      addIssue(context, 'sitemap-duplicate-pair', `Sitemap lists both ${previous} and ${loc} for one unordered pair.`);
    } else {
      seenPairs.set(pairKey, loc);
    }
  }
  if (compareLocs.length !== canonicalSlugs.size) {
    const context: ValidationContext = { issues, pageType: 'comparison', page: '/sitemap-0.xml' };
    addIssue(context, 'sitemap-count', `Sitemap has ${compareLocs.length} comparison URLs; expected ${canonicalSlugs.size}.`);
  }
}

/**
 * Rendered-HTML checks for one comparison page. Exported so failing-fixture
 * tests can prove each check stops the production build.
 * Returns the extracted canonical URL for cross-page duplicate tracking.
 */
export function validateRenderedComparisonPage(
  html: string,
  current: string,
  next: string,
  issues: GeneratedPageValidationIssue[],
): string | null {
  const defaultPair = { current: '225/45R17', new: '235/40R18' };
  const page = canonicalComparisonPath(current, next);
  const context: ValidationContext = { issues, pageType: 'comparison', page };

  const title = extractTag(html, 'title');
  const h1 = extractTag(html, 'h1');
  const breadcrumb = extractBreadcrumb(html);
  const canonical = extractCanonical(html);
  const initialCurrent = extractIslandStringProp(html, 'initialCurrent');
  const initialNew = extractIslandStringProp(html, 'initialNew');
  const expectedCanonical = `${SITE_URL}${page}`;

  // Exact pair-specific templates: catches generic headings and any
  // title/H1 rendered in the reverse of the URL's canonical order.
  const pairLabel = `${current} vs ${next}`;
  const expectedTitle = `${pairLabel} Tire Size Comparison | Tire Reference`;
  const expectedH1 = `${pairLabel} Tire Size Comparison`;
  if (title !== expectedTitle) {
    addIssue(context, 'rendered-title', `Title is "${title ?? 'missing'}"; expected "${expectedTitle}".`);
  }
  if (h1 !== expectedH1) {
    addIssue(context, 'rendered-h1', `H1 is "${h1 ?? 'missing'}"; expected the pair-specific "${expectedH1}".`);
  }
  if (!breadcrumb || !breadcrumb.includes(pairLabel)) {
    addIssue(
      context,
      'rendered-breadcrumb',
      `Breadcrumb "${breadcrumb ?? 'missing'}" does not contain the canonical pair order "${pairLabel}".`,
    );
  }
  if (canonical !== expectedCanonical) {
    addIssue(context, 'rendered-canonical', `Canonical is "${canonical ?? 'missing'}"; expected "${expectedCanonical}".`);
  }
  if (initialCurrent !== current || initialNew !== next) {
    addIssue(
      context,
      'calculator-inputs',
      `Calculator initial values are ${initialCurrent ?? 'missing'} vs ${initialNew ?? 'missing'}; expected ${current} vs ${next}.`,
    );
  }
  if (
    (current !== defaultPair.current || next !== defaultPair.new) &&
    initialCurrent === defaultPair.current &&
    initialNew === defaultPair.new
  ) {
    addIssue(context, 'default-comparison', `Default comparison was rendered instead of the page pair.`);
  }
  if (PLACEHOLDER_PATTERN.test(extractVisibleText(html))) {
    addIssue(context, 'rendered-placeholder', `Rendered indexable copy contains undefined/null/placeholder content.`);
  }

  return canonical;
}

/** Sections that the live TireSizeGuide template always renders. */
const TIRE_SIZE_TEMPLATE_MARKERS = [
  'at-a-glance',
  'available-tires',
  'safety-fitment',
  'methodology',
  'sources-review',
  'faq',
];

function validateRenderedPages(
  distDir: string,
  issues: GeneratedPageValidationIssue[],
): void {
  const seenCanonicals = new Map<string, string>();

  validateComparisonDistDedup(distDir, issues);

  function recordCanonical(
    canonical: string | null,
    context: ValidationContext,
  ): void {
    if (!canonical) return;
    const previous = seenCanonicals.get(canonical);
    if (previous && previous !== context.page) {
      addIssue(
        context,
        'duplicate-canonical',
        `Canonical ${canonical} is also used by ${previous}.`,
      );
    } else {
      seenCanonicals.set(canonical, context.page);
    }
  }

  for (const { current, new: next } of getAllComparisonSlugs()) {
    const page = canonicalComparisonPath(current, next);
    const context: ValidationContext = { issues, pageType: 'comparison', page };
    const slug = page.replace(/^\/compare\//, '').replace(/\/$/, '');
    const html = readBuiltPage(distDir, `compare/${slug}`);
    if (!html) {
      addIssue(context, 'rendered-page', `Generated HTML file is missing.`);
      continue;
    }

    const canonical = validateRenderedComparisonPage(html, current, next, issues);
    recordCanonical(canonical, context);
  }

  for (const entry of TIRE_SIZES) {
    const page = hubPagePath(entry.size);
    const context: ValidationContext = { issues, pageType: 'tire-size', page };
    const slug = sizeToSlug(entry.size);
    const html = readBuiltPage(distDir, `tire-size/${slug}`);
    if (!html) {
      addIssue(context, 'rendered-page', `Generated HTML file is missing.`);
      continue;
    }

    const title = extractTag(html, 'title');
    const h1 = extractTag(html, 'h1');
    const canonical = extractCanonical(html);
    const expectedCanonical = `${SITE_URL}${page}`;
    if (!title || !containsSize(title, entry.size)) {
      addIssue(context, 'rendered-title', `Title does not contain ${entry.size}: "${title ?? 'missing'}".`);
    }
    if (!h1 || !containsSize(h1, entry.size)) {
      addIssue(context, 'rendered-h1', `H1 does not contain ${entry.size}: "${h1 ?? 'missing'}".`);
    }
    if (canonical !== expectedCanonical) {
      addIssue(context, 'rendered-canonical', `Canonical is "${canonical ?? 'missing'}"; expected "${expectedCanonical}".`);
    }
    recordCanonical(canonical, context);

    for (const marker of TIRE_SIZE_TEMPLATE_MARKERS) {
      if (!html.includes(`id="${marker}"`)) {
        addIssue(
          context,
          'rendered-template',
          `Expected TireSizeGuide section #${marker} is missing — page may be using an obsolete or wrong template.`,
        );
      }
    }

    const visibleText = extractVisibleText(html);
    if (PLACEHOLDER_PATTERN.test(visibleText)) {
      addIssue(context, 'rendered-placeholder', `Rendered indexable copy contains undefined/null/placeholder content.`);
    }
  }

  for (const slug of TIRE_HUB_CATEGORY_SLUGS) {
    const hub = buildTireCategoryHubData(slug);
    const context: ValidationContext = {
      issues,
      pageType: 'tire-category',
      page: hub.path,
    };
    const html = readBuiltPage(distDir, `tire-sizes/${slug}`);
    if (!html) {
      addIssue(context, 'rendered-page', 'Generated HTML file is missing.');
      continue;
    }

    const title = extractTag(html, 'title');
    const h1 = extractTag(html, 'h1');
    const breadcrumb = extractBreadcrumb(html);
    const canonical = extractCanonical(html);
    const expectedCanonical = `${SITE_URL}${hub.path}`;

    if (!title || !normalizeText(title).includes(hub.label)) {
      addIssue(context, 'rendered-title', `Title does not contain ${hub.label}: "${title ?? 'missing'}".`);
    }
    if (!h1 || normalizeText(h1) !== hub.h1) {
      addIssue(context, 'rendered-h1', `H1 is "${h1 ?? 'missing'}"; expected "${hub.h1}".`);
    }
    if (!breadcrumb || !breadcrumb.includes('Tire Sizes') || !breadcrumb.includes(hub.label)) {
      addIssue(context, 'rendered-breadcrumb', `Breadcrumb is missing Tire Sizes or ${hub.label}.`);
    }
    if (canonical !== expectedCanonical) {
      addIssue(context, 'rendered-canonical', `Canonical is "${canonical ?? 'missing'}"; expected "${expectedCanonical}".`);
    }
    recordCanonical(canonical, context);

    for (const id of ['common-sizes', 'calculators', 'guides']) {
      if (!html.includes(`id="${id}"`)) {
        addIssue(context, 'rendered-section', `Required section #${id} is missing.`);
      }
    }
    if (hub.products.length > 0 && !html.includes('id="products"')) {
      addIssue(context, 'rendered-section', 'Reliable product data exists but #products is missing.');
    }
    if (hub.comparisons.length > 0 && !html.includes('id="popular-comparisons"')) {
      addIssue(context, 'rendered-section', 'Comparison data exists but #popular-comparisons is missing.');
    }
    if (PLACEHOLDER_PATTERN.test(extractVisibleText(html))) {
      addIssue(context, 'rendered-placeholder', 'Rendered indexable copy contains undefined/null/placeholder content.');
    }
  }
}

export function validateGeneratedSourceData(): GeneratedPageValidationSummary {
  const issues: GeneratedPageValidationIssue[] = [];
  const comparisonPages = validateComparisonSourceData(issues);
  const tireSizePages = validateTireSizeSourceData(issues);
  const tireCategoryPages = validateTireCategorySourceData(issues);

  return {
    totalPages: comparisonPages + tireSizePages + tireCategoryPages,
    comparisonPages,
    tireSizePages,
    tireCategoryPages,
    warnings: issues.filter(({ severity }) => severity === 'warning').length,
    errors: issues.filter(({ severity }) => severity === 'error').length,
    issues,
  };
}

export function validateGeneratedPages(distDir: string): GeneratedPageValidationSummary {
  const summary = validateGeneratedSourceData();
  validateRenderedPages(distDir, summary.issues);
  summary.warnings = summary.issues.filter(({ severity }) => severity === 'warning').length;
  summary.errors = summary.issues.filter(({ severity }) => severity === 'error').length;
  return summary;
}

export function formatGeneratedPageValidationReport(
  summary: GeneratedPageValidationSummary,
): string {
  const lines = [
    'Generated page SEO/data validation',
    `Pages checked: ${summary.totalPages}`,
    `Comparison pages: ${summary.comparisonPages}`,
    `Tire-size pages: ${summary.tireSizePages}`,
    `Tire-category pages: ${summary.tireCategoryPages}`,
    `Warnings: ${summary.warnings}`,
    `Errors: ${summary.errors}`,
  ];

  for (const issue of summary.issues) {
    lines.push(
      `${issue.severity === 'error' ? 'ERROR' : 'WARN'} [${issue.pageType}:${issue.check}] ${issue.page} — ${issue.message}`,
    );
  }

  return lines.join('\n');
}
