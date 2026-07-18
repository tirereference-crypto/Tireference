import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import '../../styles/calculator-diameter.css';
import '../../styles/tire-size-calculator-page.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { CALCULATOR_PATHS } from '../../lib/calculator-links';
import {
  formatDiameterInputValue,
  inchesFromUnit,
  type ToleranceOption,
  type WheelDiameterOption,
} from '../../lib/tire-diameter-search';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';
import {
  CALCULATOR_NAMES,
  trackCalculatorCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
  useUserInteractionFlag,
} from '../../hooks/useCalculatorAnalytics';
import {
  parseTireDiameterFromSearch,
  syncCalculatorUrl,
  TIRE_DIAMETER_LEGACY_KEYS,
  TIRE_DIAMETER_URL_KEYS,
  tireDiameterUrlValues,
} from '../../lib/calculator-url-state';
import { PopularTiresBySize } from './tire-size-calculator/PopularTiresBySize';
import { DiameterFinderHero } from './tire-diameter-calculator/DiameterFinderHero';
import { ClosestDiameterMatch } from './tire-diameter-calculator/ClosestDiameterMatch';
import { DiameterMatchCards } from './tire-diameter-calculator/DiameterMatchCards';
import { PopularDiameterCards } from './tire-diameter-calculator/PopularDiameterCards';
import { TireDiameterEducation } from './tire-diameter-calculator/TireDiameterEducation';
import { DiameterCalculatorFaq } from './tire-diameter-calculator/DiameterCalculatorFaq';
import { DiameterCalculatorTrustStrip } from './tire-diameter-calculator/DiameterCalculatorTrustStrip';
import { DiameterRelatedCalculators } from './tire-diameter-calculator/DiameterRelatedCalculators';
import {
  filterMatchesWithinTolerance,
  rankDiameterMatches,
} from '../../lib/tire-diameter-ranking';
import { DiameterEmptyResults } from './tire-diameter-calculator/DiameterEmptyResults';
import {
  isWheelSelection,
  MORE_TOLERANCE_OPTIONS,
  PRIMARY_TOLERANCE_OPTIONS,
  searchTiresByTarget,
  type WheelSelection,
} from './tire-diameter-calculator/diameter-search';

export interface PremiumTireDiameterCalculatorProps {
  initialDiameter?: number;
  initialWheel?: WheelSelection;
}

export default function PremiumTireDiameterCalculator({
  initialDiameter = 33,
  initialWheel = 18,
}: PremiumTireDiameterCalculatorProps) {
  const [diameterInput, setDiameterInput] = useState(String(initialDiameter));
  const [diameterUnit, setDiameterUnit] = useState<'imperial' | 'metric'>('imperial');
  const [wheelSelection, setWheelSelection] = useState<WheelSelection>(initialWheel);
  const [tolerance, setTolerance] = useState<ToleranceOption>(1);
  const [hasSearched, setHasSearched] = useState(true);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useCalculatorStarted(CALCULATOR_NAMES.tireDiameter);
  const { markInteracted, interacted } = useUserInteractionFlag();
  const dedupTracker = useAnalyticsDedupTracker();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parsed = parseTireDiameterFromSearch(new URLSearchParams(window.location.search), {
      diameter: initialDiameter,
      rim: initialWheel,
    });
    setDiameterUnit(parsed.unit);
    setTolerance(parsed.tolerance);
    setDiameterInput(formatDiameterInputValue(parsed.diameter, parsed.unit));
    if (isWheelSelection(parsed.rim)) {
      setWheelSelection(parsed.rim);
    }
    setUrlHydrated(true);
  }, [initialDiameter, initialWheel]);

  const targetDiameterIn = useMemo(() => {
    const parsed = Number(diameterInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    const inches = inchesFromUnit(parsed, diameterUnit);
    if (!Number.isFinite(inches) || inches <= 0 || inches > 60) return null;
    return inches;
  }, [diameterInput, diameterUnit]);

  const searchResult = useMemo(() => {
    if (!targetDiameterIn || !hasSearched) return null;
    return searchTiresByTarget(targetDiameterIn, wheelSelection, tolerance);
  }, [targetDiameterIn, wheelSelection, tolerance, hasSearched]);

  const matches = useMemo(() => {
    if (!searchResult) return [];
    const within = filterMatchesWithinTolerance(searchResult.matches, tolerance);
    return rankDiameterMatches(within, wheelSelection);
  }, [searchResult, tolerance, wheelSelection]);

  const bestMatch = matches[0] ?? null;
  const cardsWheel: WheelDiameterOption =
    wheelSelection === 'any' ? 18 : wheelSelection;
  const verifiedTiresRef = useRef<HTMLDivElement>(null);

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const runSearch = useCallback(() => {
    markInteracted();
    setHasSearched(true);
    scrollToResults();
  }, [markInteracted, scrollToResults]);

  useEffect(() => {
    if (!interacted || !targetDiameterIn || !hasSearched) return;
    const signature = `${targetDiameterIn}|${wheelSelection}|${tolerance}`;
    trackCalculatorCompletedOnce(dedupTracker, signature, {
      calculator_name: CALCULATOR_NAMES.tireDiameter,
    });
  }, [interacted, targetDiameterIn, wheelSelection, tolerance, hasSearched, dedupTracker]);

  useEffect(() => {
    if (!targetDiameterIn) return;
    setHasSearched(true);
  }, [targetDiameterIn, wheelSelection, tolerance]);

  const applyPreset = useCallback(
    (diameterIn: number) => {
      markInteracted();
      setDiameterInput(formatDiameterInputValue(diameterIn, diameterUnit));
      setHasSearched(true);
      scrollToResults();
    },
    [markInteracted, scrollToResults, diameterUnit],
  );

  useEffect(() => {
    if (!urlHydrated || !targetDiameterIn) return;
    syncCalculatorUrl(
      TIRE_DIAMETER_URL_KEYS,
      tireDiameterUrlValues(targetDiameterIn, wheelSelection, diameterUnit, tolerance),
      TIRE_DIAMETER_LEGACY_KEYS,
    );
  }, [targetDiameterIn, wheelSelection, diameterUnit, tolerance, urlHydrated]);

  const hasResults = matches.length > 0;
  const stickyVisible = useStickyAnalyzeButton(formRef, resultsRef, { resultsReady: hasResults });

  const scrollToVerifiedTires = useCallback(() => {
    requestAnimationFrame(() => {
      verifiedTiresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const increaseTolerance = useCallback(() => {
    const order = [...PRIMARY_TOLERANCE_OPTIONS, ...MORE_TOLERANCE_OPTIONS];
    const idx = order.indexOf(tolerance);
    const next = order.find((t, i) => i > idx && t > tolerance);
    if (next != null) {
      markInteracted();
      setTolerance(next);
    }
  }, [tolerance, markInteracted]);

  return (
    <div className="cmp-page dia-page dia-page--wide tl-has-sticky-analyze">
      <div className="cmp-shell dia-shell">
        <div className="cmp-toolbar">
          <nav className="cmp-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href={CALCULATOR_PATHS.tireSize}>Calculators</a>
            <span>/</span>
            <span>Tire Diameter Calculator</span>
          </nav>
        </div>

        <header className="dia-page-header">
          <h1 className="dia-page-header__title">Tire Diameter Calculator</h1>
          <p className="dia-page-header__intro">
            Find indexed production tire sizes that match a target overall diameter and wheel size.
          </p>
        </header>

        <DiameterFinderHero
          diameterInput={diameterInput}
          diameterUnit={diameterUnit}
          wheelSelection={wheelSelection}
          tolerance={tolerance}
          targetDiameterIn={targetDiameterIn}
          formRef={formRef as RefObject<HTMLElement | null>}
          onDiameterChange={(value) => {
            markInteracted();
            setDiameterInput(value);
          }}
          onUnitChange={(unit) => {
            markInteracted();
            if (unit === diameterUnit) return;
            const parsed = Number(diameterInput);
            if (Number.isFinite(parsed) && parsed > 0) {
              const inches = inchesFromUnit(parsed, diameterUnit);
              setDiameterInput(formatDiameterInputValue(inches, unit));
            }
            setDiameterUnit(unit);
          }}
          onWheelChange={(wheel) => {
            markInteracted();
            setWheelSelection(wheel);
          }}
          onToleranceChange={(tol) => {
            markInteracted();
            setTolerance(tol);
          }}
          onSearch={runSearch}
          onPreset={applyPreset}
        />

        <div className="dia-results-anchor" ref={resultsRef}>
          {hasResults && bestMatch && targetDiameterIn ? (
            <>
              <ClosestDiameterMatch
                match={bestMatch}
                targetDiameterIn={targetDiameterIn}
                toleranceIn={tolerance}
                onViewTiresAvailable={scrollToVerifiedTires}
              />
              <DiameterMatchCards
                matches={matches}
                targetDiameterIn={targetDiameterIn}
                toleranceIn={tolerance}
                wheelSelection={wheelSelection}
                onIncreaseTolerance={increaseTolerance}
                onSelectAnyWheel={() => {
                  markInteracted();
                  setWheelSelection('any');
                }}
              />
              <div ref={verifiedTiresRef} id="dia-verified-tires">
                <PopularTiresBySize
                  sizeLabel={bestMatch.size}
                  calculatorName={CALCULATOR_NAMES.tireDiameter}
                  context="diameter-calculator"
                />
              </div>
            </>
          ) : targetDiameterIn && hasSearched ? (
            <DiameterEmptyResults
              targetDiameterIn={targetDiameterIn}
              toleranceIn={tolerance}
              wheelSelection={wheelSelection}
              onIncreaseTolerance={increaseTolerance}
              onSelectAnyWheel={() => {
                markInteracted();
                setWheelSelection('any');
              }}
              onSelectPreset={applyPreset}
            />
          ) : null}
        </div>

        <PopularDiameterCards
          onSelectDiameter={applyPreset}
          selectedDiameterIn={targetDiameterIn}
        />

        <TireDiameterEducation
          wheelDiameterIn={cardsWheel}
          preferredSize={bestMatch?.size}
          targetDiameterIn={targetDiameterIn}
        />

        <DiameterCalculatorFaq
          targetDiameterIn={targetDiameterIn}
          wheelSelection={wheelSelection}
          closestSize={bestMatch?.size}
          closestDiameterIn={bestMatch?.diameterIn}
          toleranceIn={tolerance}
        />
        <DiameterCalculatorTrustStrip sizeLabel={bestMatch?.size} />
        <DiameterRelatedCalculators />
      </div>

      <StickyAnalyzeButton visible={stickyVisible} label="Find Matching Sizes" onClick={runSearch} />
    </div>
  );
}
