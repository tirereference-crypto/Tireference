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

export function comparisonBreadcrumbs(current: string, next: string, slug: string): BreadcrumbItem[] {
  return [
    { name: 'Home', item: '/' },
    { name: 'Compare', item: '/calculators/tire-comparison-calculator' },
    { name: `${current} vs ${next}`, item: `/compare/${slug}` },
  ];
}

export function hubBreadcrumbs(displaySize: string, pagePath: string): BreadcrumbItem[] {
  return [
    { name: 'Home', item: '/' },
    { name: 'Tire Sizes', item: '/tire-sizes' },
    { name: displaySize, item: pagePath },
  ];
}

export function hubPageUrl(pagePath: string): string {
  return resolveCanonical(pagePath);
}
