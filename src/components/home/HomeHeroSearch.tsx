import { useCallback, useMemo, useState, type FormEvent } from 'react';
import type { TireSizeInputFields } from '../../lib/calculator-types';
import {
  HOME_POPULAR_SEARCHES,
  popularSearchHref,
  resolveHomeSearch,
  resolveNonTireHomeSearch,
} from '../../lib/home-hero';
import { getTireSizeValidation } from '../../lib/tire-size-validation';
import { TireSizeValidationBanner } from '../calculators/TireSizeValidationBanner';

const EMPTY_FIELDS: TireSizeInputFields = {
  width: '',
  aspectRatio: '',
  wheelDiameter: '',
};

export default function HomeHeroSearch() {
  const [query, setQuery] = useState('');

  const validation = useMemo(
    () => getTireSizeValidation(query, EMPTY_FIELDS),
    [query],
  );

  const showValidation =
    query.trim() !== '' &&
    (validation.status === 'invalid' || validation.status === 'custom');

  const navigate = useCallback((value: string) => {
    window.location.assign(resolveHomeSearch(value));
  }, []);

  const onSelectSuggestion = useCallback(
    (size: string) => {
      setQuery(size);
      navigate(size);
    },
    [navigate],
  );

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = new FormData(event.currentTarget).get('q');
      const trimmed = typeof value === 'string' ? value.trim() : '';
      setQuery(trimmed);

      const nonTireDestination = resolveNonTireHomeSearch(trimmed);
      if (nonTireDestination) {
        window.location.assign(nonTireDestination);
        return;
      }

      const result = getTireSizeValidation(trimmed, EMPTY_FIELDS);
      if (result.status === 'common' || result.status === 'uncommon') {
        navigate(result.canonicalSize ?? trimmed);
        return;
      }

      if (result.showSuggestions) {
        return;
      }

      navigate(trimmed);
    },
    [navigate],
  );

  return (
    <div className="home-hero__search-ui">
      <form className="home-hero__search-form" onSubmit={onSubmit} role="search">
        <label className="sr-only" htmlFor="home-hero-search">
          Search tire sizes, calculators, and guides
        </label>
        <span className="home-hero__search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id="home-hero-search"
          name="q"
          type="text"
          className="home-hero__search-input"
          placeholder="Enter a tire size (e.g. 275/70R18)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="home-hero__search-btn" aria-label="Search">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M7 10h8M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      {showValidation ? (
        <div className="home-hero__search-validation">
          <TireSizeValidationBanner
            compact
            validation={validation}
            onSelectSuggestion={onSelectSuggestion}
          />
        </div>
      ) : null}

      <div className="home-hero__popular">
        <span className="home-hero__popular-label">Popular examples:</span>
        <div className="home-hero__popular-list">
          {HOME_POPULAR_SEARCHES.map((size, index) => (
            <span key={size} className="home-hero__popular-item">
              {index > 0 ? <span className="home-hero__popular-sep" aria-hidden="true"> </span> : null}
              <button
                type="button"
                className="home-hero__popular-link"
                onClick={() => window.location.assign(popularSearchHref(size))}
              >
                {size}
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
