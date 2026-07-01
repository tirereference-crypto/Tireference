import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

const variantClasses = {
  primary:
    'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/30',
  ghost:
    'border border-border bg-surface text-heading hover:bg-surface-subtle focus-visible:ring-border',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
