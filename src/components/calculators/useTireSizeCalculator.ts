import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TireSizeInputFields, UnitSystem } from '../../lib/calculator-types';
import { formatTireSizeResults } from '../../lib/format-tire-display';
import {
  fieldsToTireSizeString,
  getCalculatorMessage,
  getSpecsFromFields,
  parseFullSizeToFields,
} from '../../lib/tire-size-input';
import { getTireSizeValidation, normalizeTireSizeInput } from '../../lib/tire-size-validation';

const INITIAL_FIELDS: TireSizeInputFields = {
  width: '',
  aspectRatio: '',
  wheelDiameter: '',
};

function fieldsFromInitialSize(initialSize?: string): {
  fields: TireSizeInputFields;
  paste: string;
} {
  if (!initialSize) {
    return { fields: INITIAL_FIELDS, paste: '' };
  }
  const parsed = parseFullSizeToFields(initialSize);
  if (parsed) {
    return { fields: parsed, paste: initialSize };
  }
  return { fields: INITIAL_FIELDS, paste: '' };
}

export function useTireSizeCalculator(initialSize?: string) {
  const resolvedInitial =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('size')?.trim() || initialSize
      : initialSize;

  const initial = fieldsFromInitialSize(resolvedInitial);
  const [fields, setFields] = useState<TireSizeInputFields>(initial.fields);
  const [fullSizePaste, setFullSizePaste] = useState(initial.paste);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  useEffect(() => {
    const size = new URLSearchParams(window.location.search).get('size')?.trim();
    if (!size) return;
    const normalized = normalizeTireSizeInput(size);
    setFullSizePaste(normalized);
    const parsed = parseFullSizeToFields(normalized);
    if (parsed) {
      setFields(parsed);
    }
  }, []);

  const message = useMemo(() => getCalculatorMessage(fields), [fields]);

  const specs = useMemo(() => {
    if (message.status !== 'ready') return null;
    return getSpecsFromFields(fields);
  }, [fields, message.status]);

  const results = useMemo(() => {
    if (!specs) return null;
    return formatTireSizeResults(specs, unitSystem);
  }, [specs, unitSystem]);

  const updateField = useCallback(
    (key: keyof TireSizeInputFields, value: string) => {
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleFullSizePaste = useCallback((value: string) => {
    const normalized = normalizeTireSizeInput(value);
    setFullSizePaste(value);
    const parsed = parseFullSizeToFields(normalized);
    if (parsed) {
      setFields(parsed);
    }
  }, []);

  const selectTireSize = useCallback((size: string) => {
    const normalized = normalizeTireSizeInput(size);
    setFullSizePaste(normalized);
    const parsed = parseFullSizeToFields(normalized);
    if (parsed) {
      setFields(parsed);
    }
  }, []);

  const validation = useMemo(
    () => getTireSizeValidation(fullSizePaste, fields),
    [fullSizePaste, fields],
  );

  const builtSizeLabel = useMemo(() => {
    if (message.status !== 'ready' || !specs) return null;
    return fieldsToTireSizeString(fields) ?? `${Math.round(specs.widthMm)}/${Math.round(specs.aspectRatio)}${specs.construction}${specs.wheelDiameterIn}`;
  }, [message.status, specs, fields]);

  /** Keep paste field aligned when width / aspect / wheel inputs change. */
  useEffect(() => {
    if (message.status === 'ready' && builtSizeLabel) {
      setFullSizePaste(builtSizeLabel);
    }
  }, [message.status, builtSizeLabel]);

  return {
    fields,
    fullSizePaste,
    unitSystem,
    message,
    specs,
    results,
    builtSizeLabel,
    validation,
    updateField,
    handleFullSizePaste,
    selectTireSize,
    setUnitSystem,
  };
}
