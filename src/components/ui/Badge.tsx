import type { ReactNode } from 'react';

export interface BadgeProps {
  variant?: 'info' | 'success';
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
};

export function Badge({
  variant = 'info',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
