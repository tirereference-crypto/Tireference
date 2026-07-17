/**
 * Deliberately maintained freshness dates for E-E-A-T signals.
 * Update only when the corresponding work actually happens.
 * Do not set these to Date.now() or build time.
 */

/**
 * Last genuine change to tire comparison / geometry calculator logic and UI.
 * Use `YYYY-MM` or `YYYY-MM-DD`. Month-only values render as “Month Year”
 * (e.g. 2026-07 → July 2026) without a build-time freshness stamp.
 */
export const CALCULATION_LOGIC_UPDATED = '2026-07';

/** Alias matching maintained metadata docs / structured naming. */
export const calculationLogicUpdated = CALCULATION_LOGIC_UPDATED;

/**
 * Last deliberate check of structured tire catalog / product index.
 * Null when no curated check date has been recorded.
 */
export const CATALOG_DATA_CHECKED: string | null = '2026-07-04';

/** Path for data & calculation standards. */
export const DATA_STANDARDS_PATH = '/data-standards/';

/** Path for correction / issue reports. */
export const REPORT_ISSUE_PATH = '/report-an-issue/';

/** Expand YYYY-MM to YYYY-MM-01 for Date / schema consumers. */
export function toCalendarDate(iso: string): string {
  if (/^\d{4}-\d{2}$/.test(iso)) return `${iso}-01`;
  return iso;
}

/**
 * Schema.org dateModified value derived from a maintained freshness field.
 * Never uses Date.now() or build time.
 */
export function toSchemaDateTime(iso: string): string {
  return `${toCalendarDate(iso)}T00:00:00Z`;
}

/** Render a maintained YYYY-MM or YYYY-MM-DD field as “July 2026”. */
export function formatMonthYear(iso: string): string {
  const date = new Date(`${toCalendarDate(iso)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}
