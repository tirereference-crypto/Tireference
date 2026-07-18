import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { crawlableComparisonPath } from '../../../lib/crawlable-links';
import { isValidComparisonPair } from '../../../lib/tire-comparison-validation';

export interface PopularComparison {
  target: string;
}

export interface CompareThisSizeProps {
  currentSize: string;
  sizeOptions: string[];
  popularComparisons: PopularComparison[];
  defaultTarget?: string;
}

function formatSizeLabel(size: string): string {
  return size.replace(/^lt/i, 'LT');
}

export default function CompareThisSize({
  currentSize,
  sizeOptions,
  popularComparisons,
  defaultTarget,
}: CompareThisSizeProps) {
  const validSizeOptions = useMemo(
    () => sizeOptions.filter((size) => isValidComparisonPair(currentSize, size)),
    [sizeOptions, currentSize],
  );

  const validPopularComparisons = useMemo(
    () =>
      popularComparisons
        .filter(({ target }) => isValidComparisonPair(currentSize, target))
        .map(({ target }) => ({
          target,
          href: crawlableComparisonPath(currentSize, target),
        }))
        .filter((row): row is { target: string; href: string } => Boolean(row.href)),
    [popularComparisons, currentSize],
  );

  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(
    defaultTarget && validSizeOptions.includes(defaultTarget)
      ? defaultTarget
      : validSizeOptions[0] ?? '',
  );
  const [query, setQuery] = useState(
    defaultTarget && validSizeOptions.includes(defaultTarget)
      ? formatSizeLabel(defaultTarget)
      : validSizeOptions[0]
        ? formatSizeLabel(validSizeOptions[0])
        : '',
  );
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return validSizeOptions;
    return validSizeOptions.filter((s) => s.toLowerCase().includes(q));
  }, [validSizeOptions, query]);

  const selectedHref = selected ? crawlableComparisonPath(currentSize, selected) : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectSize(size: string) {
    setSelected(size);
    setQuery(formatSizeLabel(size));
    setOpen(false);
  }

  const displayCurrent = formatSizeLabel(currentSize);
  const compareLabel = selected
    ? `Compare ${displayCurrent} vs ${formatSizeLabel(selected)}`
    : 'Compare tire sizes';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
        <div className="rounded-card border border-border bg-surface-subtle/70 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Current Size</p>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-heading sm:text-[1.75rem]">
            {displayCurrent}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path strokeLinecap="round" d="M8 11V8a4 4 0 118 0v3" />
            </svg>
            Locked to this page
          </p>
        </div>

        <div ref={containerRef} className="relative">
          <label htmlFor={`${listId}-input`} className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path strokeLinecap="round" d="M8 7h12M8 12h12M8 17h8M4 7h.01M4 12h.01M4 17h.01" />
              </svg>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Compare Against</span>
          </label>
          <div className="relative">
            <input
              id={`${listId}-input`}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${listId}-listbox`}
              aria-autocomplete="list"
              placeholder="Search tire sizes…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                const match = validSizeOptions.find(
                  (s) => formatSizeLabel(s).toLowerCase() === e.target.value.trim().toLowerCase(),
                );
                if (match) setSelected(match);
              }}
              onFocus={() => setOpen(true)}
              className="w-full rounded-card border border-border bg-surface py-3.5 pl-4 pr-10 font-mono text-base font-semibold text-heading shadow-sm transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              aria-label="Show size options"
              onClick={() => setOpen((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-heading"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          {open && filtered.length > 0 && (
            <ul
              id={`${listId}-listbox`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-card border border-border bg-surface py-1 shadow-lg"
            >
              {filtered.map((size) => (
                <li key={size} role="option" aria-selected={size === selected}>
                  <button
                    type="button"
                    onClick={() => selectSize(size)}
                    className={`w-full px-4 py-2.5 text-left font-mono text-sm transition-colors hover:bg-surface-subtle ${
                      size === selected ? 'bg-primary-light font-semibold text-primary' : 'text-heading'
                    }`}
                  >
                    {formatSizeLabel(size)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedHref ? (
        <a
          href={selectedHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto sm:min-w-[12rem]"
        >
          {compareLabel}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      ) : (
        <span
          className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-primary/40 px-4 py-3 text-base font-semibold text-white sm:w-auto sm:min-w-[12rem]"
          aria-disabled="true"
        >
          {selected
            ? `No published comparison for ${displayCurrent} vs ${formatSizeLabel(selected)}`
            : 'Select a size to compare'}
        </span>
      )}

      {validPopularComparisons.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Popular Comparisons</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {validPopularComparisons.map(({ target, href }) => (
              <a
                key={target}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-heading shadow-card transition-all hover:border-primary/30 hover:bg-primary-light/50 hover:text-primary hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path strokeLinecap="round" d="M7 7h10v10H7z" />
                </svg>
                {displayCurrent} vs {formatSizeLabel(target)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
