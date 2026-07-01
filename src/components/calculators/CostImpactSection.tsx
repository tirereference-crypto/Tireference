import { useMemo, useState } from 'react';
import type { TireSpecs } from '../../lib/tire-math';
import {
  calculateFuelCostImpact,
  DEFAULT_FUEL_ASSUMPTIONS,
  type FuelCostAssumptions,
} from '../../lib/fuel-cost-impact';
import { Card } from '../ui/Card';
import { TextInput } from '../ui/TextInput';
import { Badge } from '../ui/Badge';

export interface CostImpactSectionProps {
  specsCurrent: TireSpecs;
  specsNew: TireSpecs;
}

function formatCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}$${Math.abs(value).toFixed(0)}`;
}

export function CostImpactSection({
  specsCurrent,
  specsNew,
}: CostImpactSectionProps) {
  const [assumptions, setAssumptions] = useState<FuelCostAssumptions>(
    DEFAULT_FUEL_ASSUMPTIONS,
  );

  const impact = useMemo(
    () => calculateFuelCostImpact(specsCurrent, specsNew, assumptions),
    [specsCurrent, specsNew, assumptions],
  );

  const updateAssumption = (key: keyof FuelCostAssumptions, value: string) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return;
    setAssumptions((prev) => ({ ...prev, [key]: num }));
  };

  const diffColor =
    impact.annualDifference > 0
      ? 'text-danger'
      : impact.annualDifference < 0
        ? 'text-success'
        : 'text-heading';

  return (
    <section className="space-y-4" aria-labelledby="cost-impact-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="cost-impact-heading" className="text-lg font-semibold text-heading">
          Cost impact
        </h2>
        <Badge variant="info">Estimate</Badge>
      </div>

      <p className="text-sm text-body">
        Estimated annual fuel-cost difference from rolling-circumference change.
        Larger tires travel farther per revolution — model assumes MPG scales with
        circumference ratio. Not a precise fuel-economy test.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <TextInput
          id="fuel-price"
          label="Fuel price ($/gal)"
          type="number"
          inputMode="decimal"
          min={0.01}
          step={0.01}
          value={String(assumptions.fuelPricePerGallon)}
          onChange={(e) => updateAssumption('fuelPricePerGallon', e.target.value)}
        />
        <TextInput
          id="annual-miles"
          label="Annual miles"
          type="number"
          inputMode="numeric"
          min={1}
          step={100}
          value={String(assumptions.annualMiles)}
          onChange={(e) => updateAssumption('annualMiles', e.target.value)}
        />
        <TextInput
          id="baseline-mpg"
          label="Baseline MPG (current tires)"
          type="number"
          inputMode="decimal"
          min={1}
          step={0.1}
          value={String(assumptions.baselineMpg)}
          onChange={(e) => updateAssumption('baselineMpg', e.target.value)}
        />
      </div>

      <Card padding="sm" className="bg-surface-subtle/60">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Est. MPG (current)</dt>
            <dd className="text-2xl font-semibold tabular-nums text-heading">
              {impact.mpgCurrent.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Est. MPG (new)</dt>
            <dd className="text-2xl font-semibold tabular-nums text-heading">
              {impact.mpgNew.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Est. annual fuel cost (current)</dt>
            <dd className="text-xl font-semibold tabular-nums text-heading">
              ${impact.annualCostCurrent.toFixed(0)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Est. annual fuel cost (new)</dt>
            <dd className="text-xl font-semibold tabular-nums text-heading">
              ${impact.annualCostNew.toFixed(0)}
            </dd>
          </div>
        </dl>

        <p className={`mt-4 text-center text-3xl font-bold tabular-nums ${diffColor}`}>
          {formatCurrency(impact.annualDifference)}
          <span className="ml-2 text-base font-medium text-muted">/ year</span>
        </p>
        <p className="mt-2 text-center text-xs text-muted">
          {impact.gallonsCurrent.toFixed(0)} gal → {impact.gallonsNew.toFixed(0)} gal
          at ${assumptions.fuelPricePerGallon.toFixed(2)}/gal over{' '}
          {assumptions.annualMiles.toLocaleString()} mi
        </p>
      </Card>
    </section>
  );
}
