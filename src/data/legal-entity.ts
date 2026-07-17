/**
 * Legal & privacy placeholders — replace every [BRACKETED] value before launch.
 * Do not invent legal entity names, jurisdictions, or addresses in code.
 */

/** Set to `true` only after a cookie-consent banner is live and ad tags are configured. */
export const MONETIZATION_ADS_ENABLED = false;

/** Set to `true` only when Amazon Associates (or similar) links are live and disclosed. */
export const MONETIZATION_AFFILIATES_ENABLED = false;

export const LEGAL_ENTITY = {
  /** Registered legal name, e.g. "Tire Reference LLC" */
  name: '[LEGAL ENTITY NAME]',
  /** State or country of registration, e.g. "Delaware, United States" */
  jurisdiction: '[JURISDICTION]',
  /** Mailing or business address for legal/privacy correspondence */
  address: '[CONTACT ADDRESS]',
  /** GDPR data controller — usually the same as LEGAL ENTITY NAME */
  dataController: '[DATA CONTROLLER NAME]',
  /** Governing law for Terms, e.g. "the State of California, United States" */
  governingLaw: '[STATE/COUNTRY]',
  /** Exclusive venue, e.g. "state and federal courts located in San Francisco County, California" */
  venue: '[VENUE PLACEHOLDER]',
  /** Server/log retention, e.g. "90 days" */
  logRetention: '[LOG RETENTION PERIOD]',
  /** Support message retention, e.g. "24 months" */
  supportRetention: '[SUPPORT RETENTION PERIOD]',
  /** Consent record retention, e.g. "24 months" */
  consentRetention: '[CONSENT RECORD RETENTION]',
} as const;

/** Human-readable checklist shown at the bottom of legal pages. */
export const LEGAL_PLACEHOLDER_CHECKLIST: Array<{
  id: string;
  label: string;
  location: string;
  value: string;
}> = [
  {
    id: 'legal-entity-name',
    label: 'Legal entity name',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.name',
    value: LEGAL_ENTITY.name,
  },
  {
    id: 'jurisdiction',
    label: 'Jurisdiction of registration',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.jurisdiction',
    value: LEGAL_ENTITY.jurisdiction,
  },
  {
    id: 'contact-address',
    label: 'Contact / mailing address',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.address',
    value: LEGAL_ENTITY.address,
  },
  {
    id: 'data-controller',
    label: 'GDPR data controller',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.dataController',
    value: LEGAL_ENTITY.dataController,
  },
  {
    id: 'governing-law',
    label: 'Governing law (Terms)',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.governingLaw',
    value: LEGAL_ENTITY.governingLaw,
  },
  {
    id: 'venue',
    label: 'Exclusive venue (Terms)',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.venue',
    value: LEGAL_ENTITY.venue,
  },
  {
    id: 'log-retention',
    label: 'Server/log retention period',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.logRetention',
    value: LEGAL_ENTITY.logRetention,
  },
  {
    id: 'support-retention',
    label: 'Support message retention period',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.supportRetention',
    value: LEGAL_ENTITY.supportRetention,
  },
  {
    id: 'consent-retention',
    label: 'Consent record retention period',
    location: 'src/data/legal-entity.ts → LEGAL_ENTITY.consentRetention',
    value: LEGAL_ENTITY.consentRetention,
  },
  {
    id: 'monetization-ads',
    label: 'Enable display ads (AdSense)',
    location: 'src/data/legal-entity.ts → MONETIZATION_ADS_ENABLED',
    value: MONETIZATION_ADS_ENABLED ? 'Enabled' : 'Disabled — enable after cookie banner',
  },
  {
    id: 'monetization-affiliates',
    label: 'Enable affiliate disclosures (Amazon Associates)',
    location: 'src/data/legal-entity.ts → MONETIZATION_AFFILIATES_ENABLED',
    value: MONETIZATION_AFFILIATES_ENABLED ? 'Enabled' : 'Disabled — enable when links go live',
  },
];

export function operatingEntitySentence(): string {
  return `Tire Reference is operated by ${LEGAL_ENTITY.name}, ${LEGAL_ENTITY.jurisdiction}.`;
}
