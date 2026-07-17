import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  gearRatioUrlValues,
  parseGearRatioFromSearch,
  syncCalculatorUrl,
  GEAR_RATIO_URL_KEYS,
  GEAR_RATIO_LEGACY_KEYS,
} from '../../lib/calculator-url-state';
import {
  computeGearRatio,
  parseGearRatioInput,
  validateGearField,
  type GearFieldKey,
  type GearRatioFields,
  type GearRatioResult,
} from '../../lib/gear-ratio-math';
import {
  buildGearingChangeSummary,
  DEFAULT_GEAR_FIELDS,
  type GearingChangeSummary,
} from '../../lib/gear-ratio-insights';

export interface UseGearRatioCalculatorOptions {
  initialFields?: GearRatioFields;
}

type TouchedFields = Partial<Record<GearFieldKey, boolean>>;

const RESULT_DEBOUNCE_MS = 250;

export function useGearRatioCalculator(options: UseGearRatioCalculatorOptions = {}) {
  const resolvedInitial = useMemo(() => {
    if (typeof window === 'undefined') {
      return options.initialFields ?? DEFAULT_GEAR_FIELDS;
    }
    return parseGearRatioFromSearch(
      new URLSearchParams(window.location.search),
      options.initialFields ?? DEFAULT_GEAR_FIELDS,
    );
  }, [options.initialFields]);

  const [fields, setFields] = useState<GearRatioFields>(resolvedInitial);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [displayResult, setDisplayResult] = useState<GearRatioResult | null>(() => {
    const parsed = parseGearRatioInput(resolvedInitial);
    return parsed ? computeGearRatio(parsed) : null;
  });
  const [inputsValid, setInputsValid] = useState(() => Boolean(parseGearRatioInput(resolvedInitial)));
  const lastValidRef = useRef<GearRatioResult | null>(displayResult);

  const input = useMemo(() => parseGearRatioInput(fields), [fields]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (input) {
        const next = computeGearRatio(input);
        lastValidRef.current = next;
        setDisplayResult(next);
        setInputsValid(true);
      } else {
        setInputsValid(false);
        if (lastValidRef.current) {
          setDisplayResult(lastValidRef.current);
        } else {
          setDisplayResult(null);
        }
      }
    }, RESULT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  const result = displayResult;

  const gearingSummary = useMemo((): GearingChangeSummary | null => {
    if (!result) return null;
    return buildGearingChangeSummary(result);
  }, [result]);

  const fieldErrors = useMemo(() => {
    const keys: GearFieldKey[] = [
      'currentDiameterIn',
      'newDiameterIn',
      'stockGearRatio',
      'transTopGear',
      'firstGearRatio',
      'transferLowRatio',
      'speed',
    ];
    const errors: Partial<Record<GearFieldKey, string | null>> = {};
    for (const key of keys) {
      const message = validateGearField(key, fields);
      const isPrimary =
        key === 'currentDiameterIn' || key === 'newDiameterIn' || key === 'stockGearRatio';
      const show =
        Boolean(touched[key]) ||
        (isPrimary && fields[key].trim() !== '' && Boolean(message));
      errors[key] = show ? message : null;
    }
    return errors;
  }, [fields, touched]);

  const hasPrimaryErrors = Boolean(
    fieldErrors.currentDiameterIn || fieldErrors.newDiameterIn || fieldErrors.stockGearRatio,
  );

  const updateField = useCallback(
    <K extends keyof GearRatioFields>(key: K, value: GearRatioFields[K]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const touchField = useCallback((key: GearFieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const reset = useCallback(() => {
    setFields(DEFAULT_GEAR_FIELDS);
    setTouched({});
    const parsed = parseGearRatioInput(DEFAULT_GEAR_FIELDS);
    const next = parsed ? computeGearRatio(parsed) : null;
    lastValidRef.current = next;
    setDisplayResult(next);
    setInputsValid(Boolean(parsed));
  }, []);

  const restoreFromUrl = useCallback(() => {
    const parsedFields = parseGearRatioFromSearch(
      new URLSearchParams(window.location.search),
      options.initialFields ?? DEFAULT_GEAR_FIELDS,
    );
    setFields(parsedFields);
    setTouched({});
  }, [options.initialFields]);

  useEffect(() => {
    syncCalculatorUrl(GEAR_RATIO_URL_KEYS, gearRatioUrlValues(fields), GEAR_RATIO_LEGACY_KEYS);
  }, [fields]);

  useEffect(() => {
    const onPopState = () => restoreFromUrl();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [restoreFromUrl]);

  const ready = Boolean(result && gearingSummary);
  const resultsStale = Boolean(result && !inputsValid);

  return {
    fields,
    updateField,
    touchField,
    fieldErrors,
    hasPrimaryErrors,
    reset,
    ready,
    result,
    gearingSummary,
    inputsValid,
    resultsStale,
  };
}
