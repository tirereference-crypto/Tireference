export interface CalculatorEmptyStateProps {
  message: string;
  status: 'empty' | 'invalid';
}

export function CalculatorEmptyState({
  message,
  status,
}: CalculatorEmptyStateProps) {
  return (
    <p
      className={`rounded-xl border px-4 py-8 text-center text-sm ${
        status === 'invalid'
          ? 'border-accent/30 bg-accent/5 text-accent'
          : 'border-border bg-surface-subtle text-body'
      }`}
    >
      {message}
    </p>
  );
}
