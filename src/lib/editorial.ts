/**
 * Single source of truth for site-wide trust / E-E-A-T signals.
 *
 * Nothing about authorship, review, methodology, sources, or update dates is
 * hardcoded inside page templates — every trust component reads from here, so
 * updating a name, a source, or the review date happens in exactly one place.
 */

export interface EditorialPerson {
  /** Display name (individual or team). */
  name: string;
  /** Short role/title shown under the name. */
  role: string;
  /** One-line description used in expanded contexts. */
  bio: string;
  /** Uppercase initials for the avatar fallback. */
  initials: string;
  /** Where the name links to (author/reviewer profile). */
  profileUrl: string;
}

export interface EditorialStep {
  title: string;
  detail: string;
}

export interface DataSource {
  name: string;
  detail: string;
  /** Optional outbound reference; omitted when we don't link out. */
  url?: string;
}

/** Person credited as the author of research/editorial content. */
export const EDITORIAL_AUTHOR: EditorialPerson = {
  name: 'Tire Reference Editorial Team',
  role: 'Tire Sizing & Fitment Research',
  bio: 'Researches, calculates, and writes Tire Reference sizing data using standardized tire-geometry formulas.',
  initials: 'TR',
  profileUrl: '/about',
};

/** Person/team credited with reviewing content for technical accuracy. */
export const EDITORIAL_REVIEWER: EditorialPerson = {
  name: 'Tire Reference Technical Review',
  role: 'Fitment & Calculation Verification',
  bio: 'Verifies every calculation, rating lookup, and fitment note against recognized tire and wheel standards before publication.',
  initials: 'TR',
  profileUrl: '/about',
};

export const METHODOLOGY: { intro: string; steps: EditorialStep[] } = {
  intro:
    'Specs on this site are calculated, not copied — here is how the numbers are produced.',
  steps: [
    {
      title: 'Standardized sizing math',
      detail:
        'Overall diameter, section width, sidewall height, circumference, and revolutions per mile are derived from ISO metric and flotation tire-geometry formulas.',
    },
    {
      title: 'Consistent comparisons',
      detail:
        'Diameter change, speedometer error, and ground-clearance deltas are computed against a defined reference size so every result is directly comparable.',
    },
    {
      title: 'Rating resolution',
      detail:
        'Load index, speed rating, and load range are translated into real-world load and speed limits using published reference tables.',
    },
    {
      title: 'Fitment context',
      detail:
        'Vehicle applications are mapped from documented OE and common aftermarket fitments, then paired with plain-language clearance guidance.',
    },
  ],
};

export const DATA_SOURCES: DataSource[] = [
  {
    name: 'ISO / ETRTO sizing conventions',
    detail:
      'Metric and flotation tire-geometry standards used to derive dimensional specifications.',
  },
  {
    name: 'Load index & speed rating tables',
    detail:
      'Published service-description references used to resolve maximum load and speed capability.',
  },
  {
    name: 'Vehicle OE fitment specifications',
    detail:
      'Manufacturer original-equipment sizing used to map tires to compatible vehicles.',
  },
  {
    name: 'Aftermarket tire catalogs',
    detail:
      'Current tire-model availability used for practical upgrade and alternative suggestions.',
  },
];

export const EDITORIAL_PROCESS: {
  intro: string;
  steps: EditorialStep[];
  policyUrl: string;
} = {
  intro:
    'Tire Reference is an independent resource. Our editorial standards keep guidance accurate and unbiased.',
  steps: [
    {
      title: 'Calculated, not estimated',
      detail:
        'Every dimension traces back to a formula or a documented reference — never a guess.',
    },
    {
      title: 'Independent & free',
      detail:
        'No sign-up walls, and recommendations are never influenced by advertisers or retailers.',
    },
    {
      title: 'Reviewed & maintained',
      detail:
        'Content is checked for calculation accuracy and refreshed as sizing data and fitments change.',
    },
    {
      title: 'Corrections welcome',
      detail:
        'Spot something off? Report it and we will verify and update the page.',
    },
  ],
  policyUrl: '/disclaimer',
};

/**
 * Site-wide "content last reviewed" date (ISO). Single source of truth for the
 * Last Updated signal and the legal pages so no date is hardcoded per template.
 */
export const SITE_CONTENT_UPDATED = '2026-07-01';

/** Format an ISO date (yyyy-mm-dd) as e.g. "July 1, 2026" in a stable timezone. */
export function formatEditorialDate(iso: string = SITE_CONTENT_UPDATED): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
