import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TireSizeInputFields, UnitSystem } from '../../lib/calculator-types';
import { buildComparisonInsights } from '../../lib/tire-comparison-insights';
import { appendThirdTireSpecRows } from '../../lib/tire-triple-comparison';
import { convertSpeedForUnitSystem } from '../../lib/tire-comparison-units';
import {
  parseTireComparisonFromSearch,
  syncCalculatorUrl,
  TIRE_COMPARISON_LEGACY_KEYS,
  TIRE_COMPARISON_URL_KEYS,
  tireComparisonUrlValues,
} from '../../lib/calculator-url-state';
import {
  buildComparisonVerdict,
  formatTireComparisonResults,
} from '../../lib/format-tire-comparison';
import {
  compareTiresFromFields,
  getComparisonMessage,
} from '../../lib/tire-comparison-input';
import {
  fieldsToTireSizeString,
  getCalculatorMessage,
  getSpecsFromFields,
  parseFullSizeToFields,
} from '../../lib/tire-size-input';
import { getTireSizeValidation, normalizeTireSizeInput } from '../../lib/tire-size-validation';
import { compareTires } from '../../lib/tire-math';
import type { SpecTableRow } from '../../lib/tire-comparison-types';

const DEFAULT_CURRENT = '225/45R17';
const DEFAULT_NEW = '235/40R18';

const EMPTY_FIELDS: TireSizeInputFields = {
  width: '',
  aspectRatio: '',
  wheelDiameter: '',
};

function fieldsFromSize(size?: string): TireSizeInputFields {
  if (!size) return EMPTY_FIELDS;
  return parseFullSizeToFields(size) ?? EMPTY_FIELDS;
}

function hasAnyFieldValue(fields: TireSizeInputFields, paste: string): boolean {
  return Boolean(
    paste.trim() ||
      fields.width.trim() ||
      fields.aspectRatio.trim() ||
      fields.wheelDiameter.trim(),
  );
}

export interface UseTireSizeComparisonOptions {
  initialCurrent?: string;
  initialNew?: string;
  initialThird?: string;
}

export function useTireSizeComparison(options: UseTireSizeComparisonOptions = {}) {
  // Use SSR props only for initial state so server HTML and client hydration match.
  // Live URL sync runs in the effects below — never branch on `window` during first render.
  const urlDefaults = useMemo(
    () => ({
      from: options.initialCurrent ?? DEFAULT_CURRENT,
      to: options.initialNew ?? DEFAULT_NEW,
      third: options.initialThird,
    }),
    [options.initialCurrent, options.initialNew, options.initialThird],
  );

  const [currentFields, setCurrentFields] = useState<TireSizeInputFields>(
    fieldsFromSize(urlDefaults.from),
  );
  const [newFields, setNewFields] = useState<TireSizeInputFields>(
    fieldsFromSize(urlDefaults.to),
  );
  const [thirdFields, setThirdFields] = useState<TireSizeInputFields>(
    fieldsFromSize(urlDefaults.third),
  );
  const [currentPaste, setCurrentPaste] = useState(urlDefaults.from);
  const [newPaste, setNewPaste] = useState(urlDefaults.to);
  const [thirdPaste, setThirdPaste] = useState(urlDefaults.third ?? '');
  const [thirdInputOpen, setThirdInputOpen] = useState(Boolean(urlDefaults.third));
  const [vehicleSpeed, setVehicleSpeed] = useState('60');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  /** Wait until client has applied live query params before writing back to the URL. */
  const [urlHydrated, setUrlHydrated] = useState(false);

  const message = useMemo(
    () => getComparisonMessage(currentFields, newFields, vehicleSpeed),
    [currentFields, newFields, vehicleSpeed],
  );

  const comparison = useMemo(() => {
    if (message.status !== 'ready') return null;
    return compareTiresFromFields(currentFields, newFields, vehicleSpeed);
  }, [currentFields, newFields, vehicleSpeed, message.status]);

  const thirdComparison = useMemo(() => {
    if (message.status !== 'ready') return null;
    const sizeA = fieldsToTireSizeString(currentFields);
    const sizeC = fieldsToTireSizeString(thirdFields);
    const speed = Number(vehicleSpeed);
    if (!sizeA || !sizeC || !Number.isFinite(speed) || speed <= 0) return null;
    try {
      return compareTires(sizeA, sizeC, speed);
    } catch {
      return null;
    }
  }, [currentFields, thirdFields, vehicleSpeed, message.status]);

  const specsA = useMemo(
    () => getSpecsFromFields(currentFields),
    [currentFields],
  );
  const specsB = useMemo(() => getSpecsFromFields(newFields), [newFields]);
  const specsC = useMemo(() => getSpecsFromFields(thirdFields), [thirdFields]);

  const results = useMemo(() => {
    if (!comparison || !specsA || !specsB) return null;
    return formatTireComparisonResults(
      comparison,
      specsA,
      specsB,
      unitSystem,
    );
  }, [comparison, specsA, specsB, unitSystem]);

  const verdict = useMemo(() => {
    if (!comparison || !specsA || !specsB) return null;
    return buildComparisonVerdict(comparison, specsA, specsB);
  }, [comparison, specsA, specsB]);

  const currentSizeLabel = useMemo(() => {
    const size = fieldsToTireSizeString(currentFields);
    return size ?? null;
  }, [currentFields]);

  const newSizeLabel = useMemo(() => {
    const size = fieldsToTireSizeString(newFields);
    return size ?? null;
  }, [newFields]);

  const thirdSizeLabel = useMemo(() => {
    const size = fieldsToTireSizeString(thirdFields);
    return size ?? null;
  }, [thirdFields]);

  const thirdFieldMessage = useMemo(() => getCalculatorMessage(thirdFields), [thirdFields]);
  const thirdTouched = hasAnyFieldValue(thirdFields, thirdPaste);
  const hasThirdTire =
    Boolean(thirdSizeLabel) &&
    thirdFieldMessage.status === 'ready' &&
    Boolean(thirdComparison) &&
    Boolean(specsC);

  const insights = useMemo(() => {
    if (!comparison || !specsA || !specsB || !currentSizeLabel || !newSizeLabel) return null;
    return buildComparisonInsights(currentSizeLabel, newSizeLabel, comparison, specsA, specsB, unitSystem);
  }, [comparison, specsA, specsB, currentSizeLabel, newSizeLabel, unitSystem]);

  const specRows: SpecTableRow[] | null = useMemo(() => {
    if (!insights || !specsA) return null;
    if (!hasThirdTire || !thirdComparison || !thirdSizeLabel || !specsC || !currentSizeLabel) {
      return insights.specRows;
    }
    return appendThirdTireSpecRows(
      insights.specRows,
      currentSizeLabel,
      thirdSizeLabel,
      thirdComparison,
      specsA,
      specsC,
      unitSystem,
    );
  }, [
    insights,
    hasThirdTire,
    thirdComparison,
    thirdSizeLabel,
    specsC,
    currentSizeLabel,
    specsA,
    unitSystem,
  ]);

  // Static prerender cannot bake query params into SSR props. Read the live URL on
  // the client (same pattern as the tire size calculator) so Compare deep-links work.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = parseTireComparisonFromSearch(params, {
      from: urlDefaults.from,
      to: urlDefaults.to,
      third: urlDefaults.third,
    });

    setCurrentPaste(parsed.from);
    setCurrentFields(fieldsFromSize(parsed.from));
    setNewPaste(parsed.to);
    setNewFields(fieldsFromSize(parsed.to));

    if (parsed.third) {
      setThirdPaste(parsed.third);
      setThirdFields(fieldsFromSize(parsed.third));
      setThirdInputOpen(true);
    } else {
      setThirdPaste('');
      setThirdFields(EMPTY_FIELDS);
      setThirdInputOpen(false);
    }

    setUrlHydrated(true);
  }, [urlDefaults.from, urlDefaults.to, urlDefaults.third]);

  useEffect(() => {
    if (!urlHydrated) return;
    if (!currentSizeLabel || !newSizeLabel || message.status !== 'ready') return;
    syncCalculatorUrl(
      TIRE_COMPARISON_URL_KEYS,
      tireComparisonUrlValues(currentSizeLabel, newSizeLabel, hasThirdTire ? thirdSizeLabel : null),
      TIRE_COMPARISON_LEGACY_KEYS,
    );
  }, [
    urlHydrated,
    currentSizeLabel,
    newSizeLabel,
    thirdSizeLabel,
    hasThirdTire,
    message.status,
  ]);

  const updateCurrentField = useCallback(
    (key: keyof TireSizeInputFields, value: string) => {
      setCurrentFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateNewField = useCallback(
    (key: keyof TireSizeInputFields, value: string) => {
      setNewFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateThirdField = useCallback(
    (key: keyof TireSizeInputFields, value: string) => {
      setThirdInputOpen(true);
      setThirdFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleCurrentPaste = useCallback((value: string) => {
    setCurrentPaste(value);
    const parsed = parseFullSizeToFields(normalizeTireSizeInput(value));
    if (parsed) setCurrentFields(parsed);
  }, []);

  const handleNewPaste = useCallback((value: string) => {
    setNewPaste(value);
    const parsed = parseFullSizeToFields(normalizeTireSizeInput(value));
    if (parsed) setNewFields(parsed);
  }, []);

  const handleThirdPaste = useCallback((value: string) => {
    setThirdInputOpen(true);
    setThirdPaste(value);
    const parsed = parseFullSizeToFields(normalizeTireSizeInput(value));
    if (parsed) setThirdFields(parsed);
  }, []);

  const selectCurrentTireSize = useCallback((size: string) => {
    const normalized = normalizeTireSizeInput(size);
    setCurrentPaste(normalized);
    const parsed = parseFullSizeToFields(normalized);
    if (parsed) setCurrentFields(parsed);
  }, []);

  const selectNewTireSize = useCallback((size: string) => {
    const normalized = normalizeTireSizeInput(size);
    setNewPaste(normalized);
    const parsed = parseFullSizeToFields(normalized);
    if (parsed) setNewFields(parsed);
  }, []);

  const selectThirdTireSize = useCallback((size: string) => {
    setThirdInputOpen(true);
    const normalized = normalizeTireSizeInput(size);
    setThirdPaste(normalized);
    const parsed = parseFullSizeToFields(normalized);
    if (parsed) setThirdFields(parsed);
  }, []);

  const clearThirdTire = useCallback(() => {
    setThirdFields(EMPTY_FIELDS);
    setThirdPaste('');
    setThirdInputOpen(false);
  }, []);

  const swapTires = useCallback(() => {
    setCurrentFields(newFields);
    setNewFields(currentFields);
    setCurrentPaste(newPaste);
    setNewPaste(currentPaste);
  }, [currentFields, newFields, currentPaste, newPaste]);

  const currentValidation = useMemo(
    () => getTireSizeValidation(currentPaste, currentFields),
    [currentPaste, currentFields],
  );

  const newValidation = useMemo(
    () => getTireSizeValidation(newPaste, newFields),
    [newPaste, newFields],
  );

  const thirdValidation = useMemo(
    () => (thirdTouched ? getTireSizeValidation(thirdPaste, thirdFields) : null),
    [thirdTouched, thirdPaste, thirdFields],
  );

  const currentFieldMessage = useMemo(() => getCalculatorMessage(currentFields), [currentFields]);
  const newFieldMessage = useMemo(() => getCalculatorMessage(newFields), [newFields]);

  useEffect(() => {
    if (currentFieldMessage.status === 'ready' && currentSizeLabel) {
      setCurrentPaste(currentSizeLabel);
    }
  }, [currentFieldMessage.status, currentSizeLabel]);

  useEffect(() => {
    if (newFieldMessage.status === 'ready' && newSizeLabel) {
      setNewPaste(newSizeLabel);
    }
  }, [newFieldMessage.status, newSizeLabel]);

  useEffect(() => {
    if (thirdFieldMessage.status === 'ready' && thirdSizeLabel) {
      setThirdPaste(thirdSizeLabel);
    }
  }, [thirdFieldMessage.status, thirdSizeLabel]);

  const handleSetUnitSystem = useCallback(
    (next: UnitSystem) => {
      if (next === unitSystem) return;
      const speed = Number(vehicleSpeed);
      if (Number.isFinite(speed) && speed > 0) {
        setVehicleSpeed(String(convertSpeedForUnitSystem(speed, next)));
      }
      setUnitSystem(next);
    },
    [unitSystem, vehicleSpeed],
  );

  return {
    currentFields,
    newFields,
    thirdFields,
    currentPaste,
    newPaste,
    thirdPaste,
    thirdInputOpen,
    vehicleSpeed,
    unitSystem,
    message,
    comparison,
    thirdComparison,
    results,
    verdict,
    insights,
    specRows,
    specsA,
    specsB,
    specsC,
    currentSizeLabel,
    newSizeLabel,
    thirdSizeLabel,
    hasThirdTire,
    thirdTouched,
    updateCurrentField,
    updateNewField,
    updateThirdField,
    handleCurrentPaste,
    handleNewPaste,
    handleThirdPaste,
    selectCurrentTireSize,
    selectNewTireSize,
    selectThirdTireSize,
    clearThirdTire,
    swapTires,
    setThirdInputOpen,
    currentValidation,
    newValidation,
    thirdValidation,
    setVehicleSpeed,
    setUnitSystem: handleSetUnitSystem,
  };
}
