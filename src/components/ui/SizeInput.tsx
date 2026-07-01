import type { TireSizeInputFields } from '../../lib/calculator-types';
import { Card } from './Card';
import { TextInput } from './TextInput';

function TireIcon() {
  return (
    <svg
      className="h-5 w-5 text-primary"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface SizeInputProps {
  title: string;
  idPrefix: string;
  fields: TireSizeInputFields;
  fullSizePaste: string;
  onFieldChange: (key: keyof TireSizeInputFields, value: string) => void;
  onFullSizePaste: (value: string) => void;
  widthPlaceholder?: string;
  aspectPlaceholder?: string;
  wheelPlaceholder?: string;
}

export function SizeInput({
  title,
  idPrefix,
  fields,
  fullSizePaste,
  onFieldChange,
  onFullSizePaste,
  widthPlaceholder = '275',
  aspectPlaceholder = '70',
  wheelPlaceholder = '18',
}: SizeInputProps) {
  return (
    <Card padding="sm" className="bg-surface-subtle/60">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light">
          <TireIcon />
        </span>
        <h3 className="text-base font-semibold text-heading">{title}</h3>
      </div>

      <div className="space-y-4">
        <TextInput
          id={`${idPrefix}-paste`}
          label="Paste full size"
          placeholder='e.g. 275/70R18'
          inputMode="text"
          autoComplete="off"
          value={fullSizePaste}
          onChange={(e) => onFullSizePaste(e.target.value)}
          hint="Paste a complete size to auto-fill the fields below."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextInput
            id={`${idPrefix}-width`}
            label="Width (mm)"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder={widthPlaceholder}
            value={fields.width}
            onChange={(e) => onFieldChange('width', e.target.value)}
          />
          <TextInput
            id={`${idPrefix}-aspect`}
            label="Aspect ratio"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder={aspectPlaceholder}
            value={fields.aspectRatio}
            onChange={(e) => onFieldChange('aspectRatio', e.target.value)}
          />
          <TextInput
            id={`${idPrefix}-wheel`}
            label="Wheel (in)"
            type="number"
            inputMode="decimal"
            min={1}
            step="0.5"
            placeholder={wheelPlaceholder}
            value={fields.wheelDiameter}
            onChange={(e) => onFieldChange('wheelDiameter', e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
