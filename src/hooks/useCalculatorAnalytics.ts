import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CALCULATOR_NAMES,
  createAnalyticsDedupTracker,
  getSourcePage,
  trackEvent,
  type AnalyticsEventParameters,
  type CalculatorName,
} from '../lib/analytics';

/** Fire calculator_started once per component mount. */
export function useCalculatorStarted(calculatorName: CalculatorName): void {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('calculator_started', {
      calculator_name: calculatorName,
      source_page: getSourcePage(),
    });
  }, [calculatorName]);
}

/** Track whether the user has interacted with calculator inputs. */
export function useUserInteractionFlag() {
  const [interacted, setInteracted] = useState(false);

  const markInteracted = useCallback(() => {
    setInteracted(true);
  }, []);

  return { markInteracted, interacted };
}

/** Shared dedup tracker for deliberate calculator completion events. */
export function useAnalyticsDedupTracker() {
  const trackerRef = useRef(createAnalyticsDedupTracker());
  return trackerRef.current;
}

export function trackCalculatorCompletedOnce(
  tracker: ReturnType<typeof createAnalyticsDedupTracker>,
  signature: string,
  parameters: AnalyticsEventParameters,
): void {
  tracker.trackCalculatorCompleted(signature, {
    ...parameters,
    source_page: getSourcePage(),
  });
}

export function trackComparisonCompletedOnce(
  tracker: ReturnType<typeof createAnalyticsDedupTracker>,
  signature: string,
  parameters: AnalyticsEventParameters,
): void {
  tracker.trackComparisonCompleted(signature, {
    ...parameters,
    source_page: getSourcePage(),
  });
}

export { CALCULATOR_NAMES };
