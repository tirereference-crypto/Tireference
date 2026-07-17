import { describe, expect, it } from 'vitest';
import {
  LEGAL_ENTITY,
  LEGAL_PLACEHOLDER_CHECKLIST,
  MONETIZATION_ADS_ENABLED,
  MONETIZATION_AFFILIATES_ENABLED,
  operatingEntitySentence,
} from '../data/legal-entity';

describe('legal-entity placeholders', () => {
  it('uses bracketed placeholders for fields only the operator can supply', () => {
    expect(LEGAL_ENTITY.name).toMatch(/^\[/);
    expect(LEGAL_ENTITY.jurisdiction).toMatch(/^\[/);
    expect(LEGAL_ENTITY.address).toMatch(/^\[/);
    expect(LEGAL_ENTITY.dataController).toMatch(/^\[/);
    expect(LEGAL_ENTITY.governingLaw).toMatch(/^\[/);
    expect(LEGAL_ENTITY.venue).toMatch(/^\[/);
  });

  it('keeps monetization flags off until launch', () => {
    expect(MONETIZATION_ADS_ENABLED).toBe(false);
    expect(MONETIZATION_AFFILIATES_ENABLED).toBe(false);
  });

  it('builds operating entity sentence from placeholders', () => {
    expect(operatingEntitySentence()).toContain(LEGAL_ENTITY.name);
    expect(operatingEntitySentence()).toContain(LEGAL_ENTITY.jurisdiction);
  });

  it('lists unresolved placeholders for the legal-page checklist', () => {
    const unresolved = LEGAL_PLACEHOLDER_CHECKLIST.filter((item) => item.value.includes('['));
    expect(unresolved.length).toBeGreaterThan(5);
    expect(unresolved.some((item) => item.id === 'legal-entity-name')).toBe(true);
  });
});
