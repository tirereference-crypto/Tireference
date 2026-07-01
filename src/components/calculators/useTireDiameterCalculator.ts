import { useMemo } from 'react';
import { formatTireDiameterResults } from '../../lib/format-tire-diameter';
import { getSpecsFromFields } from '../../lib/tire-size-input';
import { useTireSizeCalculator } from './useTireSizeCalculator';

/** Diameter calculator — reuses single-tire input state and getTireSpecs via shared hook. */
export function useTireDiameterCalculator() {
  const calculator = useTireSizeCalculator();

  const display = useMemo(() => {
    if (calculator.message.status !== 'ready') return null;
    const specs = getSpecsFromFields(calculator.fields);
    if (!specs) return null;
    return formatTireDiameterResults(specs, calculator.unitSystem);
  }, [calculator.fields, calculator.message.status, calculator.unitSystem]);

  return {
    ...calculator,
    display,
  };
}
