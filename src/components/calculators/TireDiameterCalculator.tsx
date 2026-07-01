import { useTireDiameterCalculator } from './useTireDiameterCalculator';
import { UnitSegmentedToggle } from '../ui/UnitSegmentedToggle';
import { SizeInput } from '../ui/SizeInput';
import { StatGrid } from '../ui/StatGrid';
import { StatCard } from '../ui/StatCard';
import { CalculatorEmptyState } from '../ui/CalculatorEmptyState';
import { Badge } from '../ui/Badge';

export default function TireDiameterCalculator() {
  const {
    fields,
    fullSizePaste,
    unitSystem,
    message,
    display,
    builtSizeLabel,
    updateField,
    handleFullSizePaste,
    setUnitSystem,
  } = useTireDiameterCalculator();

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
        idPrefix="diameter"
        fields={fields}
        fullSizePaste={fullSizePaste}
        onFieldChange={updateField}
        onFullSizePaste={handleFullSizePaste}
        widthPlaceholder="275"
        aspectPlaceholder="70"
        wheelPlaceholder="18"
      />

      <section aria-live="polite" className="space-y-4">
        <h2 className="text-lg font-semibold text-heading">Diameter</h2>

        {display ? (
          <>
            <StatCard {...display.diameter} />
            <StatGrid stats={display.details} />
          </>
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
