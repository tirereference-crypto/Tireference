import type { StatValueColor } from '../../lib/calculator-types';

export interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  valueColor?: StatValueColor;
  size?: 'normal' | 'hero';
}

const valueColorClasses: Record<StatValueColor, string> = {
  neutral: 'text-heading',
  positive: 'text-success',
  negative: 'text-danger',
};

export function StatCard({
  label,
  value,
  unit,
  subtext,
  valueColor = 'neutral',
  size = 'normal',
}: StatCardProps) {
  const isHero = size === 'hero';

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 shadow-card ${
        isHero ? 'border-primary/20 bg-primary-light/40 p-6 sm:p-8' : ''
      }`}
    >
      <dt
        className={`font-medium text-muted ${
          isHero ? 'text-xs uppercase tracking-wide' : 'text-sm'
        }`}
      >
        {label}
      </dt>
      <dd className={`mt-1 flex items-baseline gap-2 ${isHero ? 'justify-center' : ''}`}>
        <span
          className={`font-semibold tabular-nums tracking-tight ${valueColorClasses[valueColor]} ${
            isHero ? 'text-5xl sm:text-6xl' : 'text-3xl'
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className={`text-muted ${isHero ? 'text-xl' : 'text-base'}`}>
            {unit}
          </span>
        )}
      </dd>
      {subtext && (
        <p className={`mt-2 text-xs text-muted ${isHero ? 'text-center' : ''}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}
