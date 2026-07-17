import { useEffect, useRef, useState } from 'react';
import type { DisplayUnits, SizeFormat } from '../../../lib/calculator-types';
import type { useTireSizeCalculator } from '../useTireSizeCalculator';
import { TireSizeValidationBanner } from '../TireSizeValidationBanner';
import { CALCULATOR_NAMES, trackEvent, getSourcePage } from '../../../lib/analytics';

type Calculator = ReturnType<typeof useTireSizeCalculator>;

export function CalculatorHeroInput({
  calculator,
  onUserInteraction,
  onSelectSuggestion,
  onCalculateClick,
}: {
  calculator: Calculator;
  onUserInteraction?: () => void;
  onSelectSuggestion?: (size: string) => void;
  onCalculateClick?: () => void;
}) {
  const {
    fields,
    flotationFields,
    fullSizePaste,
    sizeFormat,
    displayUnits,
    validation,
    updateField,
    updateFlotationField,
    handleFullSizePaste,
    selectTireSize,
    setSizeFormat,
    setDisplayUnits,
  } = calculator;

  const [pasteOpen, setPasteOpen] = useState(false);
  const pasteInputRef = useRef<HTMLInputElement>(null);
  const userOpenedPaste = useRef(false);

  useEffect(() => {
    if (pasteOpen && userOpenedPaste.current) {
      pasteInputRef.current?.focus();
    }
  }, [pasteOpen]);

  const openPasteField = () => {
    userOpenedPaste.current = true;
    setPasteOpen(true);
  };

  const closePasteField = () => {
    userOpenedPaste.current = false;
    setPasteOpen(false);
  };

  const handleSuggestionSelect = (size: string) => {
    onUserInteraction?.();
    (onSelectSuggestion ?? selectTireSize)(size);
  };

  const formatOptions: { id: SizeFormat; label: string }[] = [
    { id: 'metric', label: 'Metric (P-Metric)' },
    { id: 'flotation', label: 'Flotation' },
  ];

  const unitOptions: { id: DisplayUnits; label: string }[] = [
    { id: 'imperial', label: 'Inches' },
    { id: 'metric', label: 'Metric' },
    { id: 'both', label: 'Both' },
  ];

  const pastePlaceholder = sizeFormat === 'flotation' ? '33x12.50R17' : '275/70R18';

  return (
    <aside className="tsc-input-card" aria-label="Enter your tire size">
      <header className="tsc-input-card__header">
        <h2 className="tsc-input-card__title">
          <span className="tsc-input-card__step" aria-hidden="true">
            1
          </span>
          Enter Your Tire Size
        </h2>
      </header>

      <div className="tsc-input-card__group">
        <span className="tsc-input-card__label" id="size-format-label">
          Size format
        </span>
        <div className="tsc-segment" role="group" aria-labelledby="size-format-label">
          {formatOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`tsc-segment__btn${sizeFormat === opt.id ? ' tsc-segment__btn--active' : ''}`}
              aria-pressed={sizeFormat === opt.id}
              onClick={() => {
                onUserInteraction?.();
                setSizeFormat(opt.id);
                trackEvent('calculator_size_format_changed', {
                  calculator_name: CALCULATOR_NAMES.tireSize,
                  source_page: getSourcePage(),
                });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {sizeFormat === 'metric' ? (
        <div className="tsc-metric-row" role="group" aria-label="Tire size fields">
          <div className="tsc-metric-segment">
            <input
              id="tsc-width"
              type="number"
              inputMode="numeric"
              placeholder="275"
              value={fields.width}
              onChange={(e) => {
                onUserInteraction?.();
                updateField('width', e.target.value);
              }}
              className="tsc-metric-segment__input"
              aria-label="Width in millimeters"
            />
            <label htmlFor="tsc-width" className="tsc-metric-segment__label">
              Width (mm)
            </label>
          </div>
          <span className="tsc-metric-sep" aria-hidden="true">
            /
          </span>
          <div className="tsc-metric-segment">
            <input
              id="tsc-aspectRatio"
              type="number"
              inputMode="numeric"
              placeholder="70"
              value={fields.aspectRatio}
              onChange={(e) => {
                onUserInteraction?.();
                updateField('aspectRatio', e.target.value);
              }}
              className="tsc-metric-segment__input"
              aria-label="Aspect ratio as a percentage"
            />
            <label htmlFor="tsc-aspectRatio" className="tsc-metric-segment__label">
              Aspect Ratio (%)
            </label>
          </div>
          <div className="tsc-metric-segment tsc-metric-segment--construction">
            <span className="tsc-metric-segment__static" aria-label="Construction type">
              R
            </span>
            <span className="tsc-metric-segment__label">Construction</span>
          </div>
          <div className="tsc-metric-segment">
            <input
              id="tsc-wheelDiameter"
              type="number"
              inputMode="numeric"
              placeholder="18"
              value={fields.wheelDiameter}
              onChange={(e) => {
                onUserInteraction?.();
                updateField('wheelDiameter', e.target.value);
              }}
              className="tsc-metric-segment__input"
              aria-label="Wheel diameter in inches"
            />
            <label htmlFor="tsc-wheelDiameter" className="tsc-metric-segment__label">
              Wheel (in)
            </label>
          </div>
        </div>
      ) : (
        <div className="tsc-input-card__dims tsc-input-card__dims--flotation">
          {(
            [
              {
                key: 'overallDiameter' as const,
                label: 'Overall Diameter',
                placeholder: '33',
                unit: 'in',
              },
              {
                key: 'sectionWidth' as const,
                label: 'Section Width',
                placeholder: '12.50',
                unit: 'in',
              },
              {
                key: 'wheelDiameter' as const,
                label: 'Wheel',
                placeholder: '17',
                unit: 'in',
              },
            ] as const
          ).map((field) => (
            <div key={field.key} className="tsc-flotation-field">
              <div className="tsc-flotation-field__wrap">
                <input
                  id={`tsc-f-${field.key}`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder={field.placeholder}
                  value={flotationFields[field.key]}
                  onChange={(e) => {
                    onUserInteraction?.();
                    updateFlotationField(field.key, e.target.value);
                  }}
                  className="tsc-flotation-field__input"
                  aria-label={field.label}
                />
                <span className="tsc-flotation-field__unit">{field.unit}</span>
              </div>
              <label htmlFor={`tsc-f-${field.key}`} className="tsc-flotation-field__label">
                {field.label}
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="tsc-input-card__group">
        <span className="tsc-input-card__label" id="display-units-label">
          Display units
        </span>
        <div className="tsc-segment" role="group" aria-labelledby="display-units-label">
          {unitOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`tsc-segment__btn${displayUnits === opt.id ? ' tsc-segment__btn--active' : ''}`}
              aria-pressed={displayUnits === opt.id}
              onClick={() => {
                onUserInteraction?.();
                setDisplayUnits(opt.id);
                trackEvent('calculator_display_unit_changed', {
                  calculator_name: CALCULATOR_NAMES.tireSize,
                  source_page: getSourcePage(),
                });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <TireSizeValidationBanner
        validation={validation}
        onSelectSuggestion={handleSuggestionSelect}
      />

      <button
        type="button"
        className="tsc-input-card__cta"
        onClick={() => {
          onUserInteraction?.();
          onCalculateClick?.();
        }}
      >
        Calculate Size
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="8" x2="8" y1="10" y2="10.01" />
          <line x1="12" x2="12" y1="10" y2="10.01" />
          <line x1="16" x2="16" y1="10" y2="10.01" />
          <line x1="8" x2="8" y1="14" y2="14.01" />
          <line x1="12" x2="12" y1="14" y2="14.01" />
          <line x1="16" x2="16" y1="14" y2="14.01" />
          <line x1="8" x2="8" y1="18" y2="18.01" />
          <line x1="12" x2="16" y1="18" y2="18" />
        </svg>
      </button>

      <div className="tsc-input-card__footer">
        {pasteOpen ? (
          <div className="tsc-input-card__paste-field">
            <label htmlFor="tsc-size-paste" className="sr-only">
              Paste complete tire size
            </label>
            <input
              ref={pasteInputRef}
              id="tsc-size-paste"
              className="tsc-input-card__paste-input"
              placeholder={pastePlaceholder}
              inputMode="text"
              autoComplete="off"
              value={fullSizePaste}
              onChange={(e) => {
                onUserInteraction?.();
                handleFullSizePaste(e.target.value);
              }}
            />
            <button
              type="button"
              className="tsc-input-card__paste-clear"
              aria-label="Close paste tire size field"
              onClick={() => {
                onUserInteraction?.();
                closePasteField();
              }}
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="tsc-input-card__footer-links">
          <button
            type="button"
            className="tsc-input-card__paste-toggle"
            aria-expanded={pasteOpen}
            onClick={() => {
              onUserInteraction?.();
              if (pasteOpen) {
                closePasteField();
              } else {
                openPasteField();
              }
            }}
          >
            {pasteOpen ? 'Hide paste field' : 'Paste complete tire size'}
          </button>
          <a href="#tsc-tire-code" className="tsc-input-card__help">
            How do I read a tire size?
          </a>
        </div>
      </div>
    </aside>
  );
}
