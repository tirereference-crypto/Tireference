import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TireSizeInputFields, UnitSystem } from '../../lib/calculator-types';
import type { UnitSystem } from '../../lib/calculator-types';
import { buildComparisonInsights } from '../../lib/tire-comparison-insights';
import { convertSpeedForUnitSystem } from '../../lib/tire-comparison-units';
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

export interface UseTireSizeComparisonOptions {
  initialCurrent?: string;
  initialNew?: string;
}

export function useTireSizeComparison(options: UseTireSizeComparisonOptions = {}) {
  const initialCurrent = options.initialCurrent ?? DEFAULT_CURRENT;
  const initialNew = options.initialNew ?? DEFAULT_NEW;

  const [currentFields, setCurrentFields] = useState<TireSizeInputFields>(
    fieldsFromSize(initialCurrent),
  );
  const [newFields, setNewFields] = useState<TireSizeInputFields>(
    fieldsFromSize(initialNew),
  );
  const [currentPaste, setCurrentPaste] = useState(initialCurrent);
  const [newPaste, setNewPaste] = useState(initialNew);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get('current');
    const newSize = params.get('new');
    if (current) {
      const parsed = parseFullSizeToFields(current);
      if (parsed) {
        setCurrentFields(parsed);
        setCurrentPaste(current);
      }
    }
    if (newSize) {
      const parsed = parseFullSizeToFields(newSize);
      if (parsed) {
        setNewFields(parsed);
        setNewPaste(newSize);
      }
    }
  }, []);
  const [vehicleSpeed, setVehicleSpeed] = useState('60');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  const message = useMemo(
    () => getComparisonMessage(currentFields, newFields, vehicleSpeed),
    [currentFields, newFields, vehicleSpeed],
  );

  const comparison = useMemo(() => {
    if (message.status !== 'ready') return null;
    return compareTiresFromFields(currentFields, newFields, vehicleSpeed);
  }, [currentFields, newFields, vehicleSpeed, message.status]);

  const specsA = useMemo(
    () => getSpecsFromFields(currentFields),
    [currentFields],
  );
  const specsB = useMemo(() => getSpecsFromFields(newFields), [newFields]);

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

  const insights = useMemo(() => {
    if (!comparison || !specsA || !specsB || !currentSizeLabel || !newSizeLabel) return null;
    return buildComparisonInsights(currentSizeLabel, newSizeLabel, comparison, specsA, specsB, unitSystem);
  }, [comparison, specsA, specsB, currentSizeLabel, newSizeLabel, unitSystem]);

  useEffect(() => {
    if (!currentSizeLabel || !newSizeLabel || message.status !== 'ready') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('current') === currentSizeLabel && params.get('new') === newSizeLabel) return;
    params.set('current', currentSizeLabel);
    params.set('new', newSizeLabel);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', next);
  }, [currentSizeLabel, newSizeLabel, message.status]);

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

  const currentValidation = useMemo(
    () => getTireSizeValidation(currentPaste, currentFields),
    [currentPaste, currentFields],
  );

  const newValidation = useMemo(
    () => getTireSizeValidation(newPaste, newFields),
    [newPaste, newFields],
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
    currentPaste,
    newPaste,
    vehicleSpeed,
    unitSystem,
    message,
    comparison,
    results,
    verdict,
    insights,
    specsA,
    specsB,
    currentSizeLabel,
    newSizeLabel,
    updateCurrentField,
    updateNewField,
    handleCurrentPaste,
    handleNewPaste,
    selectCurrentTireSize,
    selectNewTireSize,
    currentValidation,
    newValidation,
    setVehicleSpeed,
    setUnitSystem: handleSetUnitSystem,
  };
}
