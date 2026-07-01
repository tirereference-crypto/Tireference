export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
}: SegmentedToggleProps<T>) {
  return (
    <div className={className}>
      {label && (
        <span className="mb-2 block text-sm font-medium text-body">{label}</span>
      )}
      <div
        className="inline-flex rounded-full border border-border bg-surface-subtle p-1"
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-body hover:text-heading'
              }`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
