import { describe, expect, it } from 'vitest';
import { SITE_NAME } from '../site-brand';
import {
  DEFAULT_OG_IMAGE,
  ORGANIZATION_LOGO_URL,
  SEO_DESCRIPTIONS,
  SEO_TITLES,
  SITE_URL,
} from './constants';
import { formatPageTitle, truncateDescription, buildTireSizeHubPageTitle } from './format';
import { resolveCanonical } from './urls';
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildHomePageSchema,
  buildItemListSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from './schema';

describe('formatPageTitle', () => {
  it('appends brand suffix when missing', () => {
    expect(formatPageTitle('Tire Size Calculator')).toBe('Tire Size Calculator | Tire Reference');
  });

  it('does not duplicate brand suffix', () => {
    expect(formatPageTitle('Tire Size Calculator | Tire Reference')).toBe(
      'Tire Size Calculator | Tire Reference',
    );
  });

  it('uses the configured homepage title', () => {
    expect(SEO_TITLES.homepage).toBe(
      'Tire Reference | Tire Size Calculators, Wheel Fitment & Comparison Tools',
    );
    expect(formatPageTitle(SEO_TITLES.homepage)).toBe(SEO_TITLES.homepage);
  });

  it('builds tire-size hub titles with fitment and brand suffix', () => {
    expect(buildTireSizeHubPageTitle('275/70R18')).toBe(
      '275/70R18 Tire Size — Diameter, Specs & Fitment | Tire Reference',
    );
    expect(formatPageTitle(buildTireSizeHubPageTitle('275/70R18'))).toBe(
      buildTireSizeHubPageTitle('275/70R18'),
    );
  });

  it('never leaves a dangling ampersand before the brand pipe when truncating', () => {
    const truncated = formatPageTitle('275/70R18 Tire Size — Diameter, Specs & Fitment');
    expect(truncated).not.toMatch(/&\s*\|/);
    expect(truncated.endsWith('| Tire Reference')).toBe(true);
  });
});

describe('truncateDescription', () => {
  it('keeps short descriptions unchanged', () => {
    expect(truncateDescription(SEO_DESCRIPTIONS.calculator).length).toBeLessThanOrEqual(160);
  });

  it('truncates long descriptions', () => {
    const long = 'a'.repeat(200);
    expect(truncateDescription(long).length).toBeLessThanOrEqual(160);
  });
});

describe('resolveCanonical', () => {
  it('builds absolute URLs from tirereference.com', () => {
    expect(resolveCanonical('/calculators/tire-size-calculator/')).toBe(
      'https://tirereference.com/calculators/tire-size-calculator/',
    );
    expect(resolveCanonical('/')).toBe('https://tirereference.com/');
  });

  it('preserves trailing slashes when present in the input', () => {
    expect(resolveCanonical('/tire-sizes/')).toBe('https://tirereference.com/tire-sizes/');
    expect(resolveCanonical('/calculators/tire-size-calculator/?size=275-45r17')).toBe(
      'https://tirereference.com/calculators/tire-size-calculator/',
    );
  });

  it('strips calculator query parameters from canonical URLs', () => {
    expect(
      resolveCanonical('/calculators/tire-comparison-calculator/?from=275/70R18&to=285/70R17'),
    ).toBe('https://tirereference.com/calculators/tire-comparison-calculator/');
    expect(
      resolveCanonical('https://tirereference.com/calculators/gear-ratio-calculator/?stock=31&new=35'),
    ).toBe('https://tirereference.com/calculators/gear-ratio-calculator/');
  });

  it('normalizes paths to trailing-slash form to match site config', () => {
    expect(resolveCanonical('/calculators/tire-size-calculator')).toBe(
      'https://tirereference.com/calculators/tire-size-calculator/',
    );
    expect(resolveCanonical('/tire-sizes')).toBe('https://tirereference.com/tire-sizes/');
  });
});

describe('buildHomePageSchema', () => {
  it('includes WebSite and Organization without unsupported SearchAction', () => {
    const data = buildHomePageSchema();
    const graph = (data as { '@graph': Record<string, unknown>[] })['@graph'];

    const website = graph.find((node) => node['@type'] === 'WebSite');
    const organization = graph.find((node) => node['@type'] === 'Organization');

    expect(website).toMatchObject({
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SEO_DESCRIPTIONS.homepage,
    });

    expect(website?.potentialAction).toBeUndefined();

    expect(organization).toMatchObject({
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: ORGANIZATION_LOGO_URL,
    });
  });
});

describe('buildWebSiteSchema', () => {
  it('uses production OG defaults', () => {
    expect(DEFAULT_OG_IMAGE).toBe(`${SITE_URL}/og-image.png`);
    expect(buildOrganizationSchema().logo).toBe(ORGANIZATION_LOGO_URL);
  });
});

describe('buildBreadcrumbSchema', () => {
  it('outputs ordered breadcrumb items with canonical absolute URLs', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Home', item: '/' },
      { name: 'Tire Sizes', item: '/tire-sizes' },
    ]);

    const items = (schema.itemListElement as { position: number; name: string; item?: string }[]);
    expect(items[0]).toMatchObject({ position: 1, name: 'Home', item: `${SITE_URL}/` });
    expect(items[1]).toMatchObject({
      position: 2,
      name: 'Tire Sizes',
      item: `${SITE_URL}/tire-sizes/`,
    });
  });
});

describe('buildItemListSchema', () => {
  it('returns undefined for empty lists and canonicalizes URLs', () => {
    expect(buildItemListSchema({ name: 'Empty', url: '/tire-sizes/', items: [] })).toBeUndefined();
    const schema = buildItemListSchema({
      name: 'Categories',
      url: '/tire-sizes',
      items: [{ name: 'Passenger', url: '/tire-sizes/passenger' }],
    });
    expect(schema?.url).toBe(`${SITE_URL}/tire-sizes/`);
    expect((schema?.itemListElement as Array<{ item: string }>)[0].item).toBe(
      `${SITE_URL}/tire-sizes/passenger/`,
    );
  });
});

describe('buildFaqPageSchema', () => {
  it('returns undefined for empty FAQ lists', () => {
    expect(buildFaqPageSchema([])).toBeUndefined();
  });
});
