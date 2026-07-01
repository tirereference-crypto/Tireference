import type { UnitSystem } from '../../lib/calculator-types';
import { SegmentedToggle } from './SegmentedToggle';

export interface UnitSegmentedToggleProps {
  unitSystem: UnitSystem;
  onChange: (unit: UnitSystem) => void;
}

const unitOptions = [
  { value: 'metric' as const, label: 'Metric' },
  { value: 'imperial' as const, label: 'Inches' },
];

export function UnitSegmentedToggle({
  unitSystem,
  onChange,
}: UnitSegmentedToggleProps) {
  return (
    <SegmentedToggle
      label="Units"
      options={unitOptions}
      value={unitSystem}
      onChange={onChange}
    />
  );
}
