/**
 * Single source of truth for site-wide trust / methodology signals.
 *
 * Article pages credit Tire Reference (Organization) as publisher/author in
 * structured data. Visible bylines no longer name individual people.
 */

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

export const METHODOLOGY: { intro: string; steps: EditorialStep[] } = {
  intro:
    'Every dimension on this site is computed in code from the tire size label — we do not scrape or hand-copy manufacturer spec sheets for overall diameter or circumference.',
  steps: [
    {
      title: 'Parse the size label',
      detail:
        'Metric sizes (e.g. 275/70R18, LT265/75R16) and flotation sizes (e.g. 33x12.50R15) are parsed into section width, aspect ratio, construction type, and bead-seat wheel diameter.',
    },
    {
      title: 'Derive nominal dimensions',
      detail:
        'Sidewall height = section width × aspect ratio ÷ 100. Overall diameter = wheel diameter + 2 × sidewall height. Rolling circumference = π × overall diameter. Revs per mile = 63,360 ÷ circumference (inches per mile). Revs per km uses the same circumference converted to millimetres.',
    },
    {
      title: 'Compare two sizes',
      detail:
        'Diameter, width, sidewall, and circumference deltas are signed differences between parsed specs. Speedometer error assumes the cluster is calibrated to the reference tire: true speed = indicated speed × (new diameter ÷ reference diameter). Static ground clearance change uses half the overall-diameter delta at each axle.',
    },
    {
      title: 'Resolve service ratings',
      detail:
        'Where a size includes load index, speed rating, or LT load range in our dataset, maximum load and speed limits are looked up from embedded ISO/ETRTO reference tables — not estimated from tire dimensions.',
    },
    {
      title: 'Generate recommendations',
      detail:
        'Comparison verdicts combine a fitment score from dimensional thresholds with the tire\'s dataset category (passenger, performance, SUV, light-truck, off-road). Use-case tags and upgrade guidance are filtered so performance tires are not recommended for towing, and LT tires are not recommended for track use.',
    },
    {
      title: 'Validate before publish',
      detail:
        'Comparison pages pass a structural gate (same category, wheel-diameter limits, width/aspect bounds) and a content quality gate that rejects fabricated performance percentages, internal contradictions with calculated specs, and duplicated narrative blocks.',
    },
  ],
};

export const DATA_SOURCES: DataSource[] = [
  {
    name: 'Curated tire-size dataset',
    detail:
      'Production tire labels, vehicle categories, and optional load/speed ratings maintained in our internal catalog. Only field-valid sizes that round-trip through the parser are published.',
  },
  {
    name: 'ISO / ETRTO service-description tables',
    detail:
      'Load index → maximum load (kg) and speed rating symbol → maximum sustained speed (km/h) mappings embedded in our rating resolver, aligned with widely published ETRTO reference values.',
    url: 'https://www.etrto.org/',
  },
  {
    name: 'Nominal tire geometry formulas',
    detail:
      'Overall diameter, sidewall, circumference, and revolutions per mile are calculated from the size code using standard metric and flotation geometric relationships — the same relationships used across the tire industry for nominal sizing.',
  },
  {
    name: 'Documented OE fitment mappings',
    detail:
      'Vehicle make, model, trim, and year-range associations linked to specific tire sizes in our fitment data. These are representative applications for research — always confirm against your door placard.',
  },
  {
    name: 'Manufacturer variance (limitation)',
    detail:
      'Published tire dimensions can differ from nominal calculations because of tread depth, inflation pressure, rim width, and production tolerance. Our numbers are planning baselines, not mounted-tire guarantees.',
  },
];

export const EDITORIAL_PROCESS: {
  intro: string;
  steps: EditorialStep[];
  policyUrl: string;
} = {
  intro:
    'Tire Reference is an independent calculator site. Content moves from code to page through defined checks — not ad-hoc copywriting.',
  steps: [
    {
      title: 'Calculate first',
      detail:
        'Hub specs, comparison KPIs, speedometer error, RPM curves, and impact cards all read from the same tire-math module. Prose sections reference calculated direction and category — not hand-entered dimensions.',
    },
    {
      title: 'Gate comparison pairs',
      detail:
        'Only same-category pairs within wheel-diameter, width, aspect-ratio, and overall-diameter limits generate comparison URLs. Cross-class pairings (e.g. performance vs off-road) are blocked explicitly.',
    },
    {
      title: 'Review generated prose',
      detail:
        'A second-pass validator scans comparison page copy for fabricated percentage claims, marketing filler, duplicate sections, and statements that contradict the underlying specs (e.g. claiming lower clearance when diameter increased). Failed pages are regenerated or withheld.',
    },
    {
      title: 'Separate numbers from narrative',
      detail:
        'Summary chips and spec tables hold measured deltas. Engineering, verdict, and FAQ sections explain mechanisms and procedures without repeating the same figures — reducing stale or conflicting copy.',
    },
    {
      title: 'Report errors',
      detail:
        'If a calculation, rating lookup, or fitment note is wrong, contact us with the size label and source. Verified corrections update the dataset and propagate to every page that uses it.',
    },
  ],
  policyUrl: '/disclaimer',
};

/**
 * Site-wide "content last reviewed" date (ISO). Single source of truth for the
 * Last Updated signal and the legal pages so no date is hardcoded per template.
 */
export const SITE_CONTENT_UPDATED = '2026-07-04';

/** Format an ISO date (yyyy-mm-dd) as e.g. "July 4, 2026" in a stable timezone. */
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
