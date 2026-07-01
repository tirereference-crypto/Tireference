import { useTireSizeCalculator } from './useTireSizeCalculator';
import { UnitSegmentedToggle } from '../ui/UnitSegmentedToggle';
import { SizeInput } from '../ui/SizeInput';
import { StatGrid } from '../ui/StatGrid';
import { CalculatorEmptyState } from '../ui/CalculatorEmptyState';
import { Badge } from '../ui/Badge';

export interface TireSizeCalculatorProps {
  initialSize?: string;
}

export default function TireSizeCalculator({
  initialSize,
}: TireSizeCalculatorProps) {
  const {
    fields,
    fullSizePaste,
    unitSystem,
    message,
    results,
    builtSizeLabel,
    updateField,
    handleFullSizePaste,
    setUnitSystem,
  } = useTireSizeCalculator(initialSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <UnitSegmentedToggle unitSystem={unitSystem} onChange={setUnitSystem} />
        {builtSizeLabel && (
          <Badge variant="info">
            <span className="font-mono">{builtSizeLabel}</span>
          </Badge>
        )}
      </div>

      <SizeInput
        title="Tire size"
        idPrefix="size"
        fields={fields}
        fullSizePaste={fullSizePaste}
        onFieldChange={updateField}
        onFullSizePaste={handleFullSizePaste}
      />

      <section aria-live="polite" className="space-y-4">
        <h2 className="text-lg font-semibold text-heading">Results</h2>

        {results ? (
          <StatGrid stats={results} />
        ) : (
          <CalculatorEmptyState
            message={message.text}
            status={message.status === 'invalid' ? 'invalid' : 'empty'}
          />
        )}
      </section>
    </div>
  );
}
