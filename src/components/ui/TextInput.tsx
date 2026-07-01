import type { InputHTMLAttributes } from 'react';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: boolean;
}

export function TextInput({
  label,
  hint,
  error = false,
  id,
  className = '',
  ...props
}: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-body">
        {label}
      </label>
      <input
        id={id}
        className={`mt-1.5 w-full rounded-lg border bg-surface px-4 py-2.5 text-base text-heading shadow-card placeholder:text-muted focus:outline-none focus:ring-2 ${
          error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-border focus:border-primary focus:ring-primary/20'
        } ${className}`}
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
