import { useCallback, useMemo, useState } from 'react';
import {
  computeGearRatio,
  parseGearRatioInput,
  type GearRatioFields,
  type GearRatioResult,
} from '../../lib/gear-ratio-math';
import { buildGearVerdict, DEFAULT_GEAR_FIELDS, type GearVerdict } from '../../lib/gear-ratio-insights';

export interface UseGearRatioCalculatorOptions {
  initialFields?: GearRatioFields;
}

export function useGearRatioCalculator(options: UseGearRatioCalculatorOptions = {}) {
  const [fields, setFields] = useState<GearRatioFields>(
    options.initialFields ?? DEFAULT_GEAR_FIELDS,
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(true);

  const input = useMemo(() => parseGearRatioInput(fields), [fields]);

  const result = useMemo((): GearRatioResult | null => {
    if (!hasAnalyzed || !input) return null;
    return computeGearRatio(input);
  }, [hasAnalyzed, input]);

  const verdict = useMemo((): GearVerdict | null => {
    if (!result) return null;
    return buildGearVerdict(result);
  }, [result]);

  const updateField = useCallback(
    <K extends keyof GearRatioFields>(key: K, value: GearRatioFields[K]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const analyze = useCallback(() => {
    setHasAnalyzed(true);
  }, []);

  const ready = Boolean(result && verdict);

  return {
    fields,
    updateField,
    analyze,
    ready,
    result,
    verdict,
  };
}
