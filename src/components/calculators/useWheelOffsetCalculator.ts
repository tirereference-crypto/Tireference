import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  parseWheelOffsetFromSearch,
  syncCalculatorUrl,
  wheelOffsetUrlValues,
  WHEEL_OFFSET_URL_KEYS,
} from '../../lib/calculator-url-state';
import type { WheelSetupFields } from '../../lib/wheel-offset-math';
import {
  compareWheelSetups,
  convertBackspacing,
  parseWheelSpec,
  type BackspacingDirection,
  type WheelOffsetComparison,
} from '../../lib/wheel-offset-math';
import {
  buildWheelPositionSummary,
  DEFAULT_CURRENT_WHEEL,
  DEFAULT_NEW_WHEEL,
  type OffsetComparisonPreset,
  type WheelPositionSummary,
} from '../../lib/wheel-offset-insights';
import {
  type WheelFieldKey,
  validateWheelSetup,
} from '../../lib/wheel-offset-validation';

export interface UseWheelOffsetCalculatorOptions {
  initialCurrent?: WheelSetupFields;
  initialNew?: WheelSetupFields;
}

type TouchedFields = Partial<Record<WheelFieldKey, boolean>>;

export function useWheelOffsetCalculator(options: UseWheelOffsetCalculatorOptions = {}) {
  const defaults = useMemo(
    () => ({
      current: options.initialCurrent ?? DEFAULT_CURRENT_WHEEL,
      new: options.initialNew ?? DEFAULT_NEW_WHEEL,
    }),
    [options.initialCurrent, options.initialNew],
  );

  const resolvedInitial = useMemo(() => {
    if (typeof window === 'undefined') return defaults;
    return parseWheelOffsetFromSearch(new URLSearchParams(window.location.search), defaults);
  }, [defaults]);

  const [currentFields, setCurrentFields] = useState<WheelSetupFields>(resolvedInitial.current);
  const [newFields, setNewFields] = useState<WheelSetupFields>(resolvedInitial.new);
  const [hasAnalyzed, setHasAnalyzed] = useState(true);
  const [touchedCurrent, setTouchedCurrent] = useState<TouchedFields>({});
  const [touchedNew, setTouchedNew] = useState<TouchedFields>({});

  const [converterWidth, setConverterWidth] = useState('8');
  const [converterValue, setConverterValue] = useState('35');
  const [converterDirection, setConverterDirection] =
    useState<BackspacingDirection>('offset-to-backspacing');

  const currentValidation = useMemo(
    () => validateWheelSetup(currentFields, touchedCurrent),
    [currentFields, touchedCurrent],
  );
  const newValidation = useMemo(
    () => validateWheelSetup(newFields, touchedNew),
    [newFields, touchedNew],
  );
  const inputsValid = currentValidation.valid && newValidation.valid;

  const currentSpec = useMemo(() => {
    if (!currentValidation.valid) return null;
    return parseWheelSpec(currentFields);
  }, [currentFields, currentValidation.valid]);

  const newSpec = useMemo(() => {
    if (!newValidation.valid) return null;
    return parseWheelSpec(newFields);
  }, [newFields, newValidation.valid]);

  const comparison = useMemo((): WheelOffsetComparison | null => {
    if (!hasAnalyzed || !inputsValid || !currentSpec || !newSpec) return null;
    return compareWheelSetups(currentSpec, newSpec);
  }, [hasAnalyzed, inputsValid, currentSpec, newSpec]);

  const positionSummary = useMemo((): WheelPositionSummary | null => {
    if (!comparison) return null;
    return buildWheelPositionSummary(comparison);
  }, [comparison]);

  const converterResult = useMemo(() => {
    const width = Number(converterWidth);
    const value = Number(converterValue);
    if (!Number.isFinite(width) || !Number.isFinite(value) || width <= 0) return null;
    return convertBackspacing(width, value, converterDirection);
  }, [converterWidth, converterValue, converterDirection]);

  const touchCurrentField = useCallback((key: WheelFieldKey) => {
    setTouchedCurrent((prev) => ({ ...prev, [key]: true }));
  }, []);

  const touchNewField = useCallback((key: WheelFieldKey) => {
    setTouchedNew((prev) => ({ ...prev, [key]: true }));
  }, []);

  const updateCurrentField = useCallback((key: keyof WheelSetupFields, value: string) => {
    setCurrentFields((prev) => ({ ...prev, [key]: value }));
    setHasAnalyzed(true);
  }, []);

  const updateNewField = useCallback((key: keyof WheelSetupFields, value: string) => {
    setNewFields((prev) => ({ ...prev, [key]: value }));
    setHasAnalyzed(true);
  }, []);

  const applyOffsetComparison = useCallback((preset: OffsetComparisonPreset) => {
    setCurrentFields((prev) => ({
      ...prev,
      offsetMm: String(preset.currentOffsetMm),
    }));
    setNewFields((prev) => ({
      ...prev,
      offsetMm: String(preset.newOffsetMm),
    }));
    setHasAnalyzed(true);
  }, []);

  const analyze = useCallback(() => {
    setTouchedCurrent({ widthIn: true, diameterIn: true, offsetMm: true });
    setTouchedNew({ widthIn: true, diameterIn: true, offsetMm: true });
    setHasAnalyzed(true);
  }, []);

  const restoreFromUrl = useCallback(() => {
    const parsed = parseWheelOffsetFromSearch(
      new URLSearchParams(window.location.search),
      defaults,
    );
    setCurrentFields(parsed.current);
    setNewFields(parsed.new);
    setHasAnalyzed(true);
  }, [defaults]);

  useEffect(() => {
    syncCalculatorUrl(WHEEL_OFFSET_URL_KEYS, wheelOffsetUrlValues(currentFields, newFields));
  }, [currentFields, newFields]);

  useEffect(() => {
    const onPopState = () => restoreFromUrl();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [restoreFromUrl]);

  const ready = Boolean(comparison && positionSummary && inputsValid);

  return {
    currentFields,
    newFields,
    updateCurrentField,
    updateNewField,
    touchCurrentField,
    touchNewField,
    applyOffsetComparison,
    analyze,
    ready,
    inputsValid,
    currentFieldErrors: currentValidation.errors,
    newFieldErrors: newValidation.errors,
    comparison,
    positionSummary,
    converterWidth,
    converterValue,
    converterDirection,
    setConverterWidth,
    setConverterValue,
    setConverterDirection,
    converterResult,
  };
}
