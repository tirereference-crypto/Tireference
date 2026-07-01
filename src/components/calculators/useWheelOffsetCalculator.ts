import { useCallback, useMemo, useState } from 'react';
import type { WheelSetupFields } from '../../lib/wheel-offset-math';
import {
  compareWheelSetups,
  convertBackspacing,
  parseWheelSpec,
  type BackspacingDirection,
  type WheelOffsetComparison,
} from '../../lib/wheel-offset-math';
import { buildWheelFitmentVerdict, type WheelFitmentVerdict } from '../../lib/wheel-offset-insights';
import { DEFAULT_CURRENT_WHEEL, DEFAULT_NEW_WHEEL } from '../../lib/wheel-offset-insights';

export interface UseWheelOffsetCalculatorOptions {
  initialCurrent?: WheelSetupFields;
  initialNew?: WheelSetupFields;
}

export function useWheelOffsetCalculator(options: UseWheelOffsetCalculatorOptions = {}) {
  const [currentFields, setCurrentFields] = useState<WheelSetupFields>(
    options.initialCurrent ?? DEFAULT_CURRENT_WHEEL,
  );
  const [newFields, setNewFields] = useState<WheelSetupFields>(
    options.initialNew ?? DEFAULT_NEW_WHEEL,
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(true);

  const [converterWidth, setConverterWidth] = useState('8');
  const [converterValue, setConverterValue] = useState('35');
  const [converterDirection, setConverterDirection] =
    useState<BackspacingDirection>('offset-to-backspacing');

  const currentSpec = useMemo(() => parseWheelSpec(currentFields), [currentFields]);
  const newSpec = useMemo(() => parseWheelSpec(newFields), [newFields]);

  const comparison = useMemo((): WheelOffsetComparison | null => {
    if (!hasAnalyzed || !currentSpec || !newSpec) return null;
    return compareWheelSetups(currentSpec, newSpec);
  }, [hasAnalyzed, currentSpec, newSpec]);

  const verdict = useMemo((): WheelFitmentVerdict | null => {
    if (!comparison) return null;
    return buildWheelFitmentVerdict(comparison);
  }, [comparison]);

  const converterResult = useMemo(() => {
    const width = Number(converterWidth);
    const value = Number(converterValue);
    if (!Number.isFinite(width) || !Number.isFinite(value) || width <= 0) return null;
    return convertBackspacing(width, value, converterDirection);
  }, [converterWidth, converterValue, converterDirection]);

  const updateCurrentField = useCallback((key: keyof WheelSetupFields, value: string) => {
    setCurrentFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateNewField = useCallback((key: keyof WheelSetupFields, value: string) => {
    setNewFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyNewPreset = useCallback((widthIn: number, diameterIn: number, offsetMm: number) => {
    setNewFields({
      widthIn: String(widthIn),
      diameterIn: String(diameterIn),
      offsetMm: String(offsetMm),
    });
    setHasAnalyzed(true);
  }, []);

  const analyze = useCallback(() => {
    setHasAnalyzed(true);
  }, []);

  const ready = Boolean(comparison && verdict);

  return {
    currentFields,
    newFields,
    updateCurrentField,
    updateNewField,
    applyNewPreset,
    analyze,
    ready,
    comparison,
    verdict,
    converterWidth,
    converterValue,
    converterDirection,
    setConverterWidth,
    setConverterValue,
    setConverterDirection,
    converterResult,
  };
}
