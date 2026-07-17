import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DisplayUnits,
  FlotationInputFields,
  SizeFormat,
  TireSizeInputFields,
} from '../../lib/calculator-types';
import {
  syncCalculatorUrl,
  TIRE_SIZE_URL_KEYS,
  tireSizeUrlValues,
  parseDisplayUnitsFromSearch,
  parseSizeFormatFromSearch,
} from '../../lib/calculator-url-state';
import { formatTireSizeResults } from '../../lib/format-tire-display';
import {
  detectSizeFormat,
  fieldsToTireSizeString,
  flotationFieldsToTireSizeString,
  getCalculatorMessage,
  getSpecsFromFields,
  getSpecsFromFlotationFields,
  parseFullSizeToFields,
  parseFullSizeToFlotationFields,
} from '../../lib/tire-size-input';
import { getTireSizeValidation, normalizeTireSizeInput } from '../../lib/tire-size-validation';

const INITIAL_FIELDS: TireSizeInputFields = {
  width: '',
  aspectRatio: '',
  wheelDiameter: '',
};

const INITIAL_FLOTATION: FlotationInputFields = {
  overallDiameter: '',
  sectionWidth: '',
  wheelDiameter: '',
};

function fieldsFromInitialSize(initialSize?: string): {
  fields: TireSizeInputFields;
  flotationFields: FlotationInputFields;
  paste: string;
  sizeFormat: SizeFormat;
} {
  if (!initialSize) {
    return {
      fields: INITIAL_FIELDS,
      flotationFields: INITIAL_FLOTATION,
      paste: '',
      sizeFormat: 'metric',
    };
  }
  const format = detectSizeFormat(initialSize);
  return {
    fields: parseFullSizeToFields(initialSize) ?? INITIAL_FIELDS,
    flotationFields: parseFullSizeToFlotationFields(initialSize) ?? INITIAL_FLOTATION,
    paste: initialSize,
    sizeFormat: format,
  };
}

export function useTireSizeCalculator(
  initialSize?: string,
  options?: { initialFormat?: SizeFormat; initialUnits?: DisplayUnits },
) {
  const seeded = fieldsFromInitialSize(initialSize);
  if (options?.initialFormat) seeded.sizeFormat = options.initialFormat;

  const [fields, setFields] = useState<TireSizeInputFields>(seeded.fields);
  const [flotationFields, setFlotationFields] = useState<FlotationInputFields>(
    seeded.flotationFields,
  );
  const [fullSizePaste, setFullSizePaste] = useState(seeded.paste);
  const [sizeFormat, setSizeFormatState] = useState<SizeFormat>(seeded.sizeFormat);
  const [displayUnits, setDisplayUnitsState] = useState<DisplayUnits>(
    options?.initialUnits ?? 'imperial',
  );
  const [queryParseFailed, setQueryParseFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const units = parseDisplayUnitsFromSearch(params);
    if (units) setDisplayUnitsState(units);
    const formatParam = parseSizeFormatFromSearch(params);
    if (formatParam) setSizeFormatState(formatParam);

    const raw = params.get('size')?.trim();
    if (!raw) return;
    const normalized = normalizeTireSizeInput(raw);
    const metric = parseFullSizeToFields(normalized);
    const flotation = parseFullSizeToFlotationFields(normalized);
    if (!metric && !flotation) {
      setQueryParseFailed(true);
      setFullSizePaste('');
      setFields(INITIAL_FIELDS);
      setFlotationFields(INITIAL_FLOTATION);
      return;
    }
    setQueryParseFailed(false);
    const format = formatParam ?? detectSizeFormat(normalized);
    setSizeFormatState(format);
    setFullSizePaste(normalized);
    if (metric) setFields(metric);
    if (flotation) setFlotationFields(flotation);
  }, []);

  const message = useMemo(
    () => getCalculatorMessage(fields, flotationFields, sizeFormat),
    [fields, flotationFields, sizeFormat],
  );

  const specs = useMemo(() => {
    if (message.status !== 'ready') return null;
    return sizeFormat === 'flotation'
      ? getSpecsFromFlotationFields(flotationFields)
      : getSpecsFromFields(fields);
  }, [fields, flotationFields, message.status, sizeFormat]);

  const results = useMemo(() => {
    if (!specs) return null;
    const system = displayUnits === 'both' ? 'imperial' : displayUnits;
    return formatTireSizeResults(specs, system === 'metric' ? 'metric' : 'imperial');
  }, [specs, displayUnits]);

  const updateField = useCallback((key: keyof TireSizeInputFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateFlotationField = useCallback(
    (key: keyof FlotationInputFields, value: string) => {
      setFlotationFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleFullSizePaste = useCallback((value: string) => {
    const normalized = normalizeTireSizeInput(value);
    setFullSizePaste(value);
    if (!normalized) return;
    const format = detectSizeFormat(normalized);
    setSizeFormatState(format);
    const metric = parseFullSizeToFields(normalized);
    const flotation = parseFullSizeToFlotationFields(normalized);
    if (metric) setFields(metric);
    if (flotation) setFlotationFields(flotation);
  }, []);

  const selectTireSize = useCallback((size: string) => {
    const normalized = normalizeTireSizeInput(size);
    setFullSizePaste(normalized);
    const format = detectSizeFormat(normalized);
    setSizeFormatState(format);
    const metric = parseFullSizeToFields(normalized);
    const flotation = parseFullSizeToFlotationFields(normalized);
    if (metric) setFields(metric);
    if (flotation) setFlotationFields(flotation);
  }, []);

  const setSizeFormat = useCallback(
    (next: SizeFormat) => {
      setSizeFormatState(next);
      if (next === 'flotation') {
        const fromPaste = fullSizePaste
          ? parseFullSizeToFlotationFields(fullSizePaste)
          : null;
        const fromMetric = fieldsToTireSizeString(fields)
          ? parseFullSizeToFlotationFields(fieldsToTireSizeString(fields)!)
          : null;
        const flotation = fromPaste ?? fromMetric;
        if (flotation) setFlotationFields(flotation);
      } else {
        const fromPaste = fullSizePaste ? parseFullSizeToFields(fullSizePaste) : null;
        const fromFloat = flotationFieldsToTireSizeString(flotationFields)
          ? parseFullSizeToFields(flotationFieldsToTireSizeString(flotationFields)!)
          : null;
        const metric = fromPaste ?? fromFloat;
        if (metric) setFields(metric);
      }
    },
    [fields, flotationFields, fullSizePaste],
  );

  const setDisplayUnits = useCallback((next: DisplayUnits) => {
    setDisplayUnitsState(next);
  }, []);

  const validation = useMemo(
    () => getTireSizeValidation(fullSizePaste, fields),
    [fullSizePaste, fields],
  );

  const builtSizeLabel = useMemo(() => {
    if (message.status !== 'ready' || !specs) return null;
    if (sizeFormat === 'flotation') {
      return flotationFieldsToTireSizeString(flotationFields);
    }
    return (
      fieldsToTireSizeString(fields) ??
      `${Math.round(specs.widthMm)}/${Math.round(specs.aspectRatio)}${specs.construction}${specs.wheelDiameterIn}`
    );
  }, [message.status, specs, fields, flotationFields, sizeFormat]);

  useEffect(() => {
    if (message.status === 'ready' && builtSizeLabel) {
      setFullSizePaste(builtSizeLabel);
    }
  }, [message.status, builtSizeLabel]);

  useEffect(() => {
    if (message.status !== 'ready' || !builtSizeLabel) return;
    syncCalculatorUrl(
      [...TIRE_SIZE_URL_KEYS, 'units', 'format'],
      {
        ...tireSizeUrlValues(builtSizeLabel),
        units: displayUnits === 'imperial' ? null : displayUnits,
        format: sizeFormat === 'metric' ? null : sizeFormat,
      },
    );
  }, [message.status, builtSizeLabel, displayUnits, sizeFormat]);

  return {
    fields,
    flotationFields,
    fullSizePaste,
    sizeFormat,
    displayUnits,
    /** @deprecated Use displayUnits */
    unitSystem: displayUnits === 'both' ? 'imperial' : displayUnits,
    message,
    specs,
    results,
    builtSizeLabel,
    validation,
    queryParseFailed,
    updateField,
    updateFlotationField,
    handleFullSizePaste,
    selectTireSize,
    setSizeFormat,
    setDisplayUnits,
    /** @deprecated Use setDisplayUnits */
    setUnitSystem: setDisplayUnits,
  };
}
