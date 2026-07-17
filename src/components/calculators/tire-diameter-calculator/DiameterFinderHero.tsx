import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  countIndexedSizesInDiameterGroup,
  DIAMETER_PRESETS,
  formatDiameterTargetChipMeta,
} from '../../../lib/tire-diameter-insights';
import {
  formatToleranceLabel,
  MM_PER_INCH,
  type ToleranceOption,
} from '../../../lib/tire-diameter-search';
import {
  MORE_TOLERANCE_OPTIONS,
  MORE_WHEEL_OPTIONS,
  PRIMARY_TOLERANCE_OPTIONS,
  PRIMARY_WHEEL_OPTIONS,
  type WheelSelection,
} from './diameter-search';
import { TargetTireVisual } from './TargetTireVisual';

export function DiameterFinderHero({
  diameterInput,
  diameterUnit,
  wheelSelection,
  tolerance,
  targetDiameterIn,
  formRef,
  onDiameterChange,
  onUnitChange,
  onWheelChange,
  onToleranceChange,
  onSearch,
  onPreset,
}: {
  diameterInput: string;
  diameterUnit: 'imperial' | 'metric';
  wheelSelection: WheelSelection;
  tolerance: ToleranceOption;
  targetDiameterIn: number | null;
  formRef: RefObject<HTMLElement | null>;
  onDiameterChange: (value: string) => void;
  onUnitChange: (unit: 'imperial' | 'metric') => void;
  onWheelChange: (wheel: WheelSelection) => void;
  onToleranceChange: (tolerance: ToleranceOption) => void;
  onSearch: () => void;
  onPreset: (diameterIn: number) => void;
}) {
  const [lastValidTargetIn, setLastValidTargetIn] = useState(
    () => targetDiameterIn ?? 33,
  );
  const [wheelMoreOpen, setWheelMoreOpen] = useState(false);
  const [tolMoreOpen, setTolMoreOpen] = useState(false);

  useEffect(() => {
    if (targetDiameterIn != null) setLastValidTargetIn(targetDiameterIn);
  }, [targetDiameterIn]);

  useEffect(() => {
    if (MORE_WHEEL_OPTIONS.includes(wheelSelection as (typeof MORE_WHEEL_OPTIONS)[number])) {
      setWheelMoreOpen(true);
    }
  }, [wheelSelection]);

  useEffect(() => {
    if (MORE_TOLERANCE_OPTIONS.includes(tolerance)) {
      setTolMoreOpen(true);
    }
  }, [tolerance]);

  const visualTargetIn = targetDiameterIn ?? lastValidTargetIn;
  const visualWheel = wheelSelection === 'any' ? 18 : wheelSelection;
  const wheelLabel = wheelSelection === 'any' ? 'Any' : String(wheelSelection);
  const moreWheelSelected =
    wheelSelection !== 'any' && MORE_WHEEL_OPTIONS.includes(wheelSelection);
  const moreTolSelected = MORE_TOLERANCE_OPTIONS.includes(tolerance);
  const metricMaxMm = Math.round(60 * MM_PER_INCH);

  const presetCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const preset of DIAMETER_PRESETS) {
      counts.set(
        preset.diameterIn,
        countIndexedSizesInDiameterGroup(preset.diameterIn, wheelSelection),
      );
    }
    return counts;
  }, [wheelSelection]);

  const selectedPresetIn =
    targetDiameterIn != null && Number.isFinite(targetDiameterIn)
      ? Math.round(targetDiameterIn)
      : null;

  return (
    <section className="dia-hero" aria-label="Find tire sizes by target diameter">
      <article ref={formRef} className="dia-hero__card dia-hero__card--form">
        <h2 className="dia-hero__card-title">Find Tire Sizes by Target Diameter</h2>

        <div className="dia-field">
          <label className="dia-field__label" htmlFor="dia-target">
            Target Overall Diameter
          </label>
          <div className="dia-field__row dia-field__row--target">
            <input
              id="dia-target"
              className="dia-field__input dia-field__input--target"
              type="number"
              inputMode="decimal"
              min={1}
              max={diameterUnit === 'metric' ? metricMaxMm : 60}
              step={diameterUnit === 'metric' ? 1 : 0.1}
              value={diameterInput}
              onChange={(e) => onDiameterChange(e.target.value)}
              aria-invalid={targetDiameterIn == null && diameterInput.trim() !== ''}
            />
            <div className="dia-unit-toggle" role="group" aria-label="Diameter unit">
              <button
                type="button"
                className={`dia-unit-toggle__btn${diameterUnit === 'imperial' ? ' dia-unit-toggle__btn--active' : ''}`}
                onClick={() => onUnitChange('imperial')}
                aria-pressed={diameterUnit === 'imperial'}
              >
                Inches
              </button>
              <button
                type="button"
                className={`dia-unit-toggle__btn${diameterUnit === 'metric' ? ' dia-unit-toggle__btn--active' : ''}`}
                onClick={() => onUnitChange('metric')}
                aria-pressed={diameterUnit === 'metric'}
              >
                Millimetres
              </button>
            </div>
          </div>
          {targetDiameterIn == null && diameterInput.trim() !== '' ? (
            <p className="dia-field__hint dia-field__hint--error" role="alert">
              Enter a diameter between 1&quot; and 60&quot; (or equivalent in millimetres).
            </p>
          ) : null}
        </div>

        <div className="dia-field">
          <p className="dia-field__label" id="dia-wheel-label">
            Wheel Diameter
          </p>
          <div className="dia-segment" role="group" aria-labelledby="dia-wheel-label">
            {PRIMARY_WHEEL_OPTIONS.map((wheel) => (
              <button
                key={wheel}
                type="button"
                className={`dia-segment__btn${wheelSelection === wheel ? ' dia-segment__btn--active' : ''}`}
                onClick={() => onWheelChange(wheel)}
                aria-pressed={wheelSelection === wheel}
              >
                {wheel}&quot;
              </button>
            ))}
            <button
              type="button"
              className={`dia-segment__btn${wheelSelection === 'any' ? ' dia-segment__btn--active' : ''}`}
              onClick={() => onWheelChange('any')}
              aria-pressed={wheelSelection === 'any'}
            >
              Any
            </button>
            <div
              className={`dia-segment__more${moreWheelSelected || wheelMoreOpen ? ' dia-segment__more--active' : ''}`}
            >
              <button
                type="button"
                className="dia-segment__more-toggle"
                aria-expanded={wheelMoreOpen}
                aria-controls="dia-more-wheels"
                onClick={() => setWheelMoreOpen((open) => !open)}
              >
                More wheel sizes
              </button>
              {wheelMoreOpen ? (
                <label className="dia-segment__more-panel" id="dia-more-wheels">
                  <span className="sr-only">Additional wheel diameters</span>
                  <select
                    className="dia-segment__select-visible"
                    aria-label="Additional wheel diameters"
                    value={moreWheelSelected ? String(wheelSelection) : ''}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (MORE_WHEEL_OPTIONS.includes(next as (typeof MORE_WHEEL_OPTIONS)[number])) {
                        onWheelChange(next as (typeof MORE_WHEEL_OPTIONS)[number]);
                      }
                    }}
                  >
                    <option value="" disabled>
                      Select wheel size
                    </option>
                    {MORE_WHEEL_OPTIONS.map((wheel) => (
                      <option key={wheel} value={wheel}>
                        {wheel}&quot;
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div className="dia-field">
          <p className="dia-field__label" id="dia-tol-label">
            Maximum Diameter Difference
          </p>
          <p className="dia-field__hint" id="dia-tol-hint">
            How close results must be to your target
            {diameterUnit === 'metric' ? ' (shown in millimetres).' : '.'}
          </p>
          <div
            className="dia-segment dia-segment--tol"
            role="group"
            aria-labelledby="dia-tol-label"
            aria-describedby="dia-tol-hint"
          >
            {PRIMARY_TOLERANCE_OPTIONS.map((tol) => (
              <button
                key={tol}
                type="button"
                className={`dia-segment__btn${tolerance === tol ? ' dia-segment__btn--active' : ''}`}
                onClick={() => onToleranceChange(tol)}
                aria-pressed={tolerance === tol}
              >
                {formatToleranceLabel(tol, diameterUnit)}
              </button>
            ))}
            <div
              className={`dia-segment__more${moreTolSelected || tolMoreOpen ? ' dia-segment__more--active' : ''}`}
            >
              <button
                type="button"
                className="dia-segment__more-toggle"
                aria-expanded={tolMoreOpen}
                aria-controls="dia-custom-tolerance"
                onClick={() => setTolMoreOpen((open) => !open)}
              >
                Custom tolerance
              </button>
              {tolMoreOpen ? (
                <label className="dia-segment__more-panel" id="dia-custom-tolerance">
                  <span className="sr-only">Custom diameter difference</span>
                  <select
                    className="dia-segment__select-visible"
                    aria-label="Custom diameter difference"
                    value={moreTolSelected ? String(tolerance) : ''}
                    onChange={(e) => {
                      const next = Number(e.target.value) as ToleranceOption;
                      if (MORE_TOLERANCE_OPTIONS.includes(next)) {
                        onToleranceChange(next);
                      }
                    }}
                  >
                    <option value="" disabled>
                      Select tolerance
                    </option>
                    {MORE_TOLERANCE_OPTIONS.map((tol) => (
                      <option key={tol} value={tol}>
                        {formatToleranceLabel(tol, diameterUnit)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <button type="button" className="dia-search-btn" onClick={onSearch}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Find Matching Sizes
        </button>

        <div className="dia-quick-links" role="group" aria-label="Popular target diameters">
          <span className="dia-quick-links__label">Popular targets:</span>
          {DIAMETER_PRESETS.map((preset) => {
            const count = presetCounts.get(preset.diameterIn) ?? 0;
            const countLabel = formatDiameterTargetChipMeta(count, wheelSelection);
            const selected = selectedPresetIn === preset.diameterIn;
            const disabled = count <= 0;
            return (
              <button
                key={preset.diameterIn}
                type="button"
                className={`dia-quick-links__chip${selected ? ' dia-quick-links__chip--selected' : ''}${
                  disabled ? ' dia-quick-links__chip--disabled' : ''
                }`}
                onClick={() => {
                  if (!disabled) onPreset(preset.diameterIn);
                }}
                disabled={disabled}
                aria-pressed={selected}
                aria-label={`${preset.label}: ${countLabel}`}
                title={countLabel}
              >
                {preset.label}
                <span className="dia-quick-links__meta">{countLabel}</span>
              </button>
            );
          })}
        </div>
      </article>

      <aside className="dia-hero__card dia-hero__card--visual" aria-label="Visual reference">
        <h2 className="dia-hero__card-title dia-hero__card-title--visual">Visual Reference</h2>
        <TargetTireVisual
          targetDiameterIn={visualTargetIn}
          wheelDiameterIn={visualWheel}
          wheelLabel={wheelLabel}
          toleranceIn={tolerance}
          diameterUnit={diameterUnit}
        />
      </aside>
    </section>
  );
}
