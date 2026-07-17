import { describe, expect, it } from 'vitest';
import { SITE_NAME } from './site-brand';
import { ORGANIZATION_LOGO_URL, SITE_URL } from './seo/constants';
import { buildHomePageSchema } from './seo/schema';

describe('buildHomePageSchema', () => {
  it('returns WebSite and Organization graph without fake SearchAction', () => {
    const data = buildHomePageSchema();
    const graph = (data as { '@graph': Record<string, unknown>[] })['@graph'];

    expect(data['@context']).toBe('https://schema.org');
    expect(graph).toHaveLength(2);

    const website = graph.find((node) => node['@type'] === 'WebSite');
    const organization = graph.find((node) => node['@type'] === 'Organization');

    expect(website).toMatchObject({
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#organization` },
    });
    expect(website?.potentialAction).toBeUndefined();

    expect(organization).toMatchObject({
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: ORGANIZATION_LOGO_URL,
    });
  });
});
