import type { TireSizeValidationResult } from '../../lib/tire-size-validation';

function ValidationIcon({ tone }: { tone: TireSizeValidationResult['tone'] }) {
  if (tone === 'green') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 8v4" strokeLinecap="round" />
      <path d="M12 16h.01" strokeLinecap="round" />
      <path d="M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TireSizeValidationBanner({
  validation,
  onSelectSuggestion,
  compact = false,
  hideStatusBadge = false,
  hideNormalized = false,
}: {
  validation: TireSizeValidationResult;
  onSelectSuggestion: (size: string) => void;
  compact?: boolean;
  /** When a production-status line already covers common/uncommon messaging. */
  hideStatusBadge?: boolean;
  /** When the input card already shows the normalized size prominently. */
  hideNormalized?: boolean;
}) {
  if (validation.status === 'empty') return null;

  const showNormalized =
    !hideNormalized &&
    Boolean(validation.canonicalSize) &&
    Boolean(validation.normalizedInput) &&
    validation.normalizedInput.toUpperCase() !== validation.canonicalSize!.toUpperCase();
  const showSuggestions = validation.showSuggestions && validation.suggestions.length > 0;
  const showBadge = !hideStatusBadge && Boolean(validation.badgeLabel);

  if (!showBadge && !showNormalized && !showSuggestions) return null;

  return (
    <div className={`calc-size-validation${compact ? ' calc-size-validation--compact' : ''}`} aria-live="polite">
      {showBadge ? (
        <div className={`calc-size-validation__badge calc-size-validation__badge--${validation.tone}`}>
          {!compact ? <ValidationIcon tone={validation.tone} /> : null}
          <span>{validation.badgeLabel}</span>
        </div>
      ) : null}

      {showNormalized ? (
        <p className="calc-size-validation__normalized">
          Normalized to <strong>{validation.canonicalSize}</strong>
        </p>
      ) : null}

      {showSuggestions ? (
        <div className="calc-size-validation__suggestions">
          <p className="calc-size-validation__suggestions-label">Did you mean:</p>
          <div className="calc-size-validation__pills">
            {validation.suggestions.map((size) => (
              <button
                key={size}
                type="button"
                className="calc-size-validation__pill"
                onClick={() => onSelectSuggestion(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
