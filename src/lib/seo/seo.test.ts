import { describe, expect, it } from 'vitest';
import { SITE_NAME } from '../site-brand';
import {
  DEFAULT_OG_IMAGE,
  ORGANIZATION_LOGO_URL,
  SEO_DESCRIPTIONS,
  SEO_TITLES,
  SITE_URL,
} from './constants';
import { formatPageTitle, truncateDescription } from './format';
import { resolveCanonical } from './urls';
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildHomePageSchema,
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
    expect(resolveCanonical('/calculators/tire-size-calculator')).toBe(
      'https://tirereference.com/calculators/tire-size-calculator',
    );
    expect(resolveCanonical('/')).toBe('https://tirereference.com/');
  });

  it('strips trailing slashes', () => {
    expect(resolveCanonical('/tire-sizes/')).toBe('https://tirereference.com/tire-sizes');
  });
});

describe('buildHomePageSchema', () => {
  it('includes WebSite SearchAction and Organization', () => {
    const data = buildHomePageSchema();
    const graph = (data as { '@graph': Record<string, unknown>[] })['@graph'];

    const website = graph.find((node) => node['@type'] === 'WebSite');
    const organization = graph.find((node) => node['@type'] === 'Organization');

    expect(website).toMatchObject({
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SEO_DESCRIPTIONS.homepage,
    });

    expect(website?.potentialAction).toMatchObject({
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    });

    expect(organization).toMatchObject({
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: ORGANIZATION_LOGO_URL,
      sameAs: [],
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
  it('outputs ordered breadcrumb items', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Home', item: '/' },
      { name: 'Tire Sizes', item: '/tire-sizes' },
    ]);

    const items = (schema.itemListElement as { position: number; name: string }[]);
    expect(items[0]).toMatchObject({ position: 1, name: 'Home' });
    expect(items[1]).toMatchObject({ position: 2, name: 'Tire Sizes' });
  });
});

describe('buildFaqPageSchema', () => {
  it('returns undefined for empty FAQ lists', () => {
    expect(buildFaqPageSchema([])).toBeUndefined();
  });
});
