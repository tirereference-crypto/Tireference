import { DIAMETER_PRESETS } from '../../../lib/tire-diameter-insights';
import type { ToleranceOption } from '../../../lib/tire-diameter-search';
import type { WheelSelection } from './diameter-search';

export function DiameterEmptyResults({
  targetDiameterIn,
  toleranceIn,
  wheelSelection,
  onIncreaseTolerance,
  onSelectAnyWheel,
  onSelectPreset,
}: {
  targetDiameterIn: number;
  toleranceIn: ToleranceOption;
  wheelSelection: WheelSelection;
  onIncreaseTolerance: () => void;
  onSelectAnyWheel: () => void;
  onSelectPreset: (diameterIn: number) => void;
}) {
  const nextTolerance =
    toleranceIn < 1 ? 1 : toleranceIn < 2 ? 2 : toleranceIn < 3 ? 3 : null;
  const nearbyPresets = DIAMETER_PRESETS.filter(
    (preset) => Math.abs(preset.diameterIn - targetDiameterIn) >= 0.5,
  ).slice(0, 3);

  return (
    <section className="dia-empty" aria-live="polite">
      <h2 className="dia-section-title">No matching sizes</h2>
      <p>
        No indexed production sizes were found within ±{toleranceIn.toFixed(1)}&quot; of{' '}
        {targetDiameterIn.toFixed(1)}&quot;.
      </p>
      <ul className="dia-empty__actions">
        {nextTolerance != null ? (
          <li>
            <button type="button" className="dia-btn dia-btn--primary" onClick={onIncreaseTolerance}>
              Increase maximum diameter difference to ±{nextTolerance.toFixed(1)}&quot;
            </button>
          </li>
        ) : null}
        {wheelSelection !== 'any' ? (
          <li>
            <button type="button" className="dia-btn dia-btn--outline" onClick={onSelectAnyWheel}>
              Select Any wheel diameter
            </button>
          </li>
        ) : null}
        {nearbyPresets.length > 0 ? (
          <li className="dia-empty__presets">
            <span className="dia-empty__presets-label">Try a nearby popular target diameter:</span>
            <div className="dia-empty__preset-row">
              {nearbyPresets.map((preset) => (
                <button
                  key={preset.diameterIn}
                  type="button"
                  className="dia-quick-links__chip"
                  onClick={() => onSelectPreset(preset.diameterIn)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
