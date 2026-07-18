import { describe, expect, it } from 'vitest';
import { PEOPLE } from '../data/people';
import {
  buildPersonSchema,
  defaultEditorialSchemaRefs,
  getPersonCreditGroups,
  personProfilePath,
  toEditorialPerson,
} from './people';

describe('people', () => {
  it('maps people to editorial bylines with author profile URLs', () => {
    const person = PEOPLE[0]!;
    const editorial = toEditorialPerson(person);
    expect(editorial.profileUrl).toBe(personProfilePath(person.slug));
    expect(editorial.initials).toMatch(/^[A-Z]{1,2}$/);
    expect(editorial.photoUrl).toBe(person.photo);
  });

  it('builds Person schema with profile URL and credentials', () => {
    const person = PEOPLE[0]!;
    const schema = buildPersonSchema(person);
    expect(schema['@type']).toBe('Person');
    expect(schema.url).toContain(`/author/${person.slug}/`);
    expect(schema.knowsAbout).toEqual(person.credentials);
  });

  it('expands credit groups for tire hubs and calculators', () => {
    const groups = getPersonCreditGroups(PEOPLE[0]!);
    expect(groups.some((group) => group.title === 'Tire size guides' && group.count > 0)).toBe(true);
    expect(groups.some((group) => group.title === 'Interactive calculators' && group.count === 5)).toBe(
      true,
    );
  });

  it('provides default editorial schema refs as Person nodes', () => {
    const refs = defaultEditorialSchemaRefs();
    expect(refs.authorRef.type).toBe('Person');
    expect(refs.reviewerRef.type).toBe('Person');
    expect(refs.authorRef.url).toContain('/author/');
    expect(refs.reviewerRef.url).toContain('/author/');
  });
});
