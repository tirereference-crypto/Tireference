import {
  useCallback,
  useId,
  useState,
  type FormEvent,
} from 'react';
import { resolveHomeSearch } from '../lib/home-hero';
import { NAV_SEARCH_EXAMPLES } from '../lib/site-nav';

function SearchIcon() {
  return (
    <svg className="site-nav__search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export default function SiteHeaderSearch({
  className,
  inputId = 'site-header-search',
  onNavigate,
}: {
  className?: string;
  inputId?: string;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const listId = useId();

  const submit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      window.location.assign(resolveHomeSearch(trimmed));
      onNavigate?.();
    },
    [onNavigate],
  );

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit(query);
    },
    [query, submit],
  );

  return (
    <div className={`site-nav__search-wrap ${className ?? ''}`}>
      <form role="search" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor={inputId}>
          Search sizes or calculators
        </label>
        <SearchIcon />
        <input
          id={inputId}
          type="search"
          className="site-nav__search-input"
          placeholder="Search sizes or calculators"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          autoComplete="off"
          spellCheck={false}
          aria-controls={focused ? listId : undefined}
          aria-expanded={focused}
        />
      </form>

      {focused ? (
        <div className="site-nav__search-examples" id={listId}>
          <p className="site-nav__search-examples-label">Examples</p>
          <div className="site-nav__search-examples-list">
            {NAV_SEARCH_EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                className="site-nav__search-example"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submit(example.query)}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
