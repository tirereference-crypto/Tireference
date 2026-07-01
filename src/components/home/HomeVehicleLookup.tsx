import { useCallback, useMemo, useState, type FormEvent } from 'react';
import {
  getVehicleMakes,
  getVehicleModels,
  getVehicleTrims,
  getVehicleYears,
  resolveVehicleLookup,
  type VehicleSelection,
} from '../../lib/vehicle-lookup';

const EMPTY: VehicleSelection = { year: '', make: '', model: '', trim: '' };

export default function HomeVehicleLookup() {
  const [selection, setSelection] = useState<VehicleSelection>(EMPTY);

  const years = useMemo(() => getVehicleYears(), []);
  const makes = useMemo(
    () => (selection.year ? getVehicleMakes(selection.year) : []),
    [selection.year],
  );
  const models = useMemo(
    () => (selection.year && selection.make ? getVehicleModels(selection.year, selection.make) : []),
    [selection.year, selection.make],
  );
  const trims = useMemo(
    () =>
      selection.year && selection.make && selection.model
        ? getVehicleTrims(selection.year, selection.make, selection.model)
        : [],
    [selection.year, selection.make, selection.model],
  );

  const update = useCallback((patch: Partial<VehicleSelection>) => {
    setSelection((current) => {
      const next = { ...current, ...patch };
      if ('year' in patch) return { year: next.year, make: '', model: '', trim: '' };
      if ('make' in patch) return { ...next, model: '', trim: '' };
      if ('model' in patch) return { ...next, trim: '' };
      return next;
    });
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selection.year || !selection.make || !selection.model || !selection.trim) return;
      window.location.assign(resolveVehicleLookup(selection));
    },
    [selection],
  );

  const canContinue =
    Boolean(selection.year) &&
    Boolean(selection.make) &&
    Boolean(selection.model) &&
    Boolean(selection.trim);

  return (
    <form className="home-vehicle-lookup__form" onSubmit={onSubmit}>
      <div className="home-vehicle-lookup__fields">
        <label className="home-vehicle-lookup__field">
          <span className="home-vehicle-lookup__label">Year</span>
          <select
            className="home-vehicle-lookup__select"
            value={selection.year}
            onChange={(event) => update({ year: event.target.value })}
            required
          >
            <option value="">Select year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="home-vehicle-lookup__field">
          <span className="home-vehicle-lookup__label">Make</span>
          <select
            className="home-vehicle-lookup__select"
            value={selection.make}
            onChange={(event) => update({ make: event.target.value })}
            disabled={!selection.year}
            required
          >
            <option value="">Select make</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </label>

        <label className="home-vehicle-lookup__field">
          <span className="home-vehicle-lookup__label">Model</span>
          <select
            className="home-vehicle-lookup__select"
            value={selection.model}
            onChange={(event) => update({ model: event.target.value })}
            disabled={!selection.make}
            required
          >
            <option value="">Select model</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>

        <label className="home-vehicle-lookup__field">
          <span className="home-vehicle-lookup__label">Trim</span>
          <select
            className="home-vehicle-lookup__select"
            value={selection.trim}
            onChange={(event) => update({ trim: event.target.value })}
            disabled={!selection.model}
            required
          >
            <option value="">Select trim</option>
            {trims.map((trim) => (
              <option key={trim} value={trim}>
                {trim}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" className="tl-btn-primary home-vehicle-lookup__submit" disabled={!canContinue}>
        Continue
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M7 10h8M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <p className="home-vehicle-lookup__note">
        Verified OEM fitment data helps recommend compatible tire sizes and calculators.
      </p>
    </form>
  );
}
