/** Google Analytics 4 event helpers — safe for SSR and optional client availability. */

export const CALCULATOR_NAMES = {
  tireSize: 'tire_size',
  tireDiameter: 'tire_diameter',
  tireComparison: 'tire_comparison',
  wheelOffset: 'wheel_offset',
  gearRatio: 'gear_ratio',
} as const;

export type CalculatorName = (typeof CALCULATOR_NAMES)[keyof typeof CALCULATOR_NAMES];

export type AnalyticsEventName =
  | 'calculator_started'
  | 'calculator_completed'
  | 'tire_comparison_completed'
  | 'tire_size_selected'
  | 'related_calculator_clicked'
  | 'calculator_compare_clicked'
  | 'calculator_guide_clicked'
  | 'calculator_related_size_clicked'
  | 'calculator_tire_model_clicked'
  | 'calculator_view_all_tires_clicked'
  | 'calculator_brand_fallback_clicked'
  | 'calculator_popular_tires_shown'
  | 'calculator_issue_clicked'
  | 'calculator_faq_expanded'
  | 'calculator_display_unit_changed'
  | 'calculator_size_format_changed'
  | 'share_link_copied';

export type PopularTiresFallbackLevel = 'models' | 'brands' | 'categories' | 'none';

export interface AnalyticsEventParameters {
  calculator_name?: CalculatorName;
  current_tire_size?: string;
  new_tire_size?: string;
  diameter_difference_percent?: number;
  source_page?: string;
  destination_calculator?: CalculatorName;
  /** Popular tires section availability tier. */
  fallback_level?: PopularTiresFallbackLevel;
}

const TIRE_SIZE_PATTERN =
  /^(?:LT|P)?\d{2,3}\/\d{2}(?:\.\d+)?R\d{1,2}(?:\.\d+)?$|^(?:LT)?\d{1,3}X\d{1,2}\.\d{2}R\d{1,2}(?:\.\d+)?$/i;
const PATH_PATTERN = /^\/[a-z0-9\-./]*$/i;

function sanitizeTireSize(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length > 24 || !TIRE_SIZE_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

function sanitizePathname(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.length > 200 || !PATH_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function sanitizePercent(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded) > 100) return undefined;
  return rounded;
}

function sanitizeParameters(
  parameters?: AnalyticsEventParameters,
): Record<string, string | number> | undefined {
  if (!parameters) return undefined;

  const sanitized: Record<string, string | number> = {};

  if (parameters.calculator_name) {
    sanitized.calculator_name = parameters.calculator_name;
  }
  if (parameters.destination_calculator) {
    sanitized.destination_calculator = parameters.destination_calculator;
  }

  const currentTireSize = sanitizeTireSize(parameters.current_tire_size);
  if (currentTireSize) sanitized.current_tire_size = currentTireSize;

  const newTireSize = sanitizeTireSize(parameters.new_tire_size);
  if (newTireSize) sanitized.new_tire_size = newTireSize;

  const sourcePage = sanitizePathname(parameters.source_page);
  if (sourcePage) sanitized.source_page = sourcePage;

  const diameterDiff = sanitizePercent(parameters.diameter_difference_percent);
  if (diameterDiff !== undefined) {
    sanitized.diameter_difference_percent = diameterDiff;
  }

  if (
    parameters.fallback_level === 'models' ||
    parameters.fallback_level === 'brands' ||
    parameters.fallback_level === 'categories' ||
    parameters.fallback_level === 'none'
  ) {
    sanitized.fallback_level = parameters.fallback_level;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/** Current pathname for event context — empty string during SSR. */
export function getSourcePage(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

/** Map a calculator href to a stable analytics identifier. */
export function calculatorNameFromHref(href: string): CalculatorName | undefined {
  if (href.includes('tire-size-calculator')) return CALCULATOR_NAMES.tireSize;
  if (href.includes('tire-comparison-calculator')) return CALCULATOR_NAMES.tireComparison;
  if (href.includes('tire-diameter-calculator')) return CALCULATOR_NAMES.tireDiameter;
  if (href.includes('wheel-offset-calculator')) return CALCULATOR_NAMES.wheelOffset;
  if (href.includes('gear-ratio-calculator')) return CALCULATOR_NAMES.gearRatio;
  return undefined;
}

/** Send a GA4 event when gtag is available; never throws. */
export function trackEvent(
  eventName: AnalyticsEventName,
  parameters?: AnalyticsEventParameters,
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  try {
    const eventParameters = sanitizeParameters({
      ...parameters,
      source_page: parameters?.source_page ?? getSourcePage(),
    });
    window.gtag('event', eventName, eventParameters);
  } catch {
    // Analytics must never break the app.
  }
}

/** Track a validated tire size selection from calculator UI. */
export function trackTireSizeSelected(
  tireSize: string,
  calculatorName?: CalculatorName,
): void {
  const sanitized = sanitizeTireSize(tireSize);
  if (!sanitized) return;

  trackEvent('tire_size_selected', {
    calculator_name: calculatorName,
    current_tire_size: sanitized,
    source_page: getSourcePage(),
  });
}

/** Track a related-calculator navigation click. */
export function trackRelatedCalculatorClick(
  href: string,
  sourceCalculator: CalculatorName,
): void {
  trackEvent('related_calculator_clicked', {
    calculator_name: sourceCalculator,
    destination_calculator: calculatorNameFromHref(href),
    source_page: getSourcePage(),
  });
}

/** Dedup helper — prevents duplicate completion events for the same input signature. */
export function createAnalyticsDedupTracker() {
  let lastSignature: string | null = null;

  return {
    trackCalculatorCompleted(
      signature: string,
      parameters: AnalyticsEventParameters,
    ): boolean {
      if (lastSignature === signature) return false;
      lastSignature = signature;
      trackEvent('calculator_completed', parameters);
      return true;
    },
    trackComparisonCompleted(
      signature: string,
      parameters: AnalyticsEventParameters,
    ): boolean {
      if (lastSignature === signature) return false;
      lastSignature = signature;
      trackEvent('tire_comparison_completed', parameters);
      return true;
    },
    reset(): void {
      lastSignature = null;
    },
  };
}
