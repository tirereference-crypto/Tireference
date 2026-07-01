import type { StatDisplay } from '../../lib/calculator-types';
import { StatCard } from './StatCard';

export interface StatGridProps {
  stats: StatDisplay[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </dl>
  );
}
