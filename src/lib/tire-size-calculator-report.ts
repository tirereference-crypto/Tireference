import { CONTACT_EMAIL } from './info-pages';
import { REPORT_ISSUE_PATH } from './eeat-metadata';

export const REPORT_ISSUE_CATEGORIES = [
  { value: 'incorrect_calculation', label: 'Incorrect calculation' },
  { value: 'incorrect_model_availability', label: 'Incorrect tire model availability' },
  { value: 'incorrect_production_status', label: 'Incorrect production status' },
  { value: 'broken_link', label: 'Broken link' },
  { value: 'incorrect_vehicle_example', label: 'Incorrect vehicle example' },
  { value: 'other_data', label: 'Other data issue' },
] as const;

export type ReportIssueCategory = (typeof REPORT_ISSUE_CATEGORIES)[number]['value'];

/** Client report URL with calculator context (SSR-safe defaults to path). */
export function buildCalculatorReportHref(sizeLabel?: string | null): string {
  if (typeof window === 'undefined') {
    return reportIssuePath({ size: sizeLabel ?? undefined });
  }

  return reportIssuePath({
    size: sizeLabel ?? undefined,
    pageUrl: window.location.href,
    calculator: 'Tire Size Calculator',
    category: 'incorrect_calculation',
  });
}

/** Prefill path for SSR-safe markup. */
export function contactReportPath(sizeLabel?: string | null): string {
  return reportIssuePath({
    size: sizeLabel ?? undefined,
    category: 'incorrect_calculation',
    calculator: 'Tire Size Calculator',
  });
}

export function reportIssuePath(params: {
  size?: string;
  pageUrl?: string;
  calculator?: string;
  category?: string;
  section?: string;
}): string {
  const q = new URLSearchParams();
  if (params.size) q.set('size', params.size);
  if (params.pageUrl) q.set('pageUrl', params.pageUrl);
  if (params.calculator) q.set('calculator', params.calculator);
  if (params.category) q.set('category', params.category);
  if (params.section) q.set('section', params.section);
  const qs = q.toString();
  return qs ? `${REPORT_ISSUE_PATH}?${qs}` : REPORT_ISSUE_PATH;
}

/** Build a mailto link as the safe fallback when no backend exists. */
export function buildReportMailto(input: {
  categoryLabel: string;
  size?: string;
  pageUrl?: string;
  calculator?: string;
  section?: string;
  description?: string;
  manufacturerUrl?: string;
  email?: string;
}): string {
  const subject = input.size
    ? `${SITE_REPORT_SUBJECT} — ${input.size}`
    : SITE_REPORT_SUBJECT;

  const body = [
    `Category: ${input.categoryLabel}`,
    input.calculator ? `Tool: ${input.calculator}` : '',
    input.size ? `Tire size: ${input.size}` : '',
    input.pageUrl ? `Page URL: ${input.pageUrl}` : '',
    input.section ? `Section: ${input.section}` : '',
    '',
    'Description:',
    input.description?.trim() || '(please describe the issue)',
    '',
    input.manufacturerUrl ? `Supporting manufacturer URL: ${input.manufacturerUrl}` : '',
    input.email ? `Reply email: ${input.email}` : '',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const params = new URLSearchParams({ subject, body });
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

const SITE_REPORT_SUBJECT = 'Tire Reference data correction';
