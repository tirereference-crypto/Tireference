import { CALCULATOR_PATHS } from '../calculator-links';
import {
  canonicalComparisonPath,
  formatDisplaySize,
  orderComparisonSizes,
} from '../comparison-url';
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  mergeJsonLd,
  resolveCanonical,
  type BreadcrumbItem,
  type FaqItem,
} from './index';

export interface PageSeoSchemaInput {
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FaqItem[];
  extra?: Array<Record<string, unknown> | null | undefined>;
}

export function buildPageSchema({
  breadcrumbs,
  faqs,
  extra = [],
}: PageSeoSchemaInput): Record<string, unknown> | undefined {
  return mergeJsonLd([
    breadcrumbs?.length ? buildBreadcrumbSchema(breadcrumbs) : null,
    faqs?.length ? buildFaqPageSchema(faqs) : null,
    ...extra,
  ]);
}

export function calculatorBreadcrumbs(label: string): BreadcrumbItem[] {
  return [
    { name: 'Home', item: '/' },
    { name: label },
  ];
}

export function comparisonBreadcrumbs(current: string, next: string): BreadcrumbItem[] {
  const ordered = orderComparisonSizes(current, next);
  const currentLabel = formatDisplaySize(ordered.current) ?? ordered.current;
  const nextLabel = formatDisplaySize(ordered.new) ?? ordered.new;
  return [
    { name: 'Home', item: '/' },
    { name: 'Compare', item: CALCULATOR_PATHS.tireComparison },
    {
      name: `${currentLabel} vs ${nextLabel}`,
      item: canonicalComparisonPath(ordered.current, ordered.new),
    },
  ];
}

export function hubBreadcrumbs(
  displaySize: string,
  pagePath: string,
  category?: { name: string; item: string },
): BreadcrumbItem[] {
  return [
    { name: 'Home', item: '/' },
    { name: 'Tire Sizes', item: '/tire-sizes/' },
    ...(category ? [category] : []),
    { name: displaySize, item: pagePath },
  ];
}

export function hubPageUrl(pagePath: string): string {
  return resolveCanonical(pagePath);
}
