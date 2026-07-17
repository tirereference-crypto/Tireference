/**
 * Right-rail dimensional decision support.
 *
 * Score and statuses are deterministic and documented below.
 * Vehicle clearance / rubbing / offset are never marked safe from size data alone.
 *
 * ## Dimensional Compatibility Score thresholds (documented)
 *
 * Diameter |Δ%|:
 * - ≤ 3%  → within threshold (pass)
 * - ≤ 5%  → moderate change (warning)
 * - > 5%  → significant change (fail band for diameter row)
 *
 * Width |Δ%|:
 * - ≤ 3%  → within threshold
 * - ≤ 7%  → moderate change
 * - > 7%  → significant change
 *
 * Speedometer |error%| (tracks diameter %):
 * - ≤ 3%  → within threshold
 * - ≤ 5%  → moderate change
 * - > 5%  → significant change
 *
 * Score start: 10.0, clamped to [1.0, 10.0], rounded to 1 decimal.
 * Penalties (deterministic):
 * - |diameter%| × 0.35
 * - |width%| × 0.12
 * - |speedometer%| × 0.18
 * - different wheel diameter: −0.6
 * - published load index lower on Tire 2: −0.8
 * - published speed rating lower on Tire 2: −0.5
 * - published approved rim ranges present and non-overlapping: −0.7
 *
 * Not scored (vehicle-specific without vehicle data):
 * fender, suspension, brake clearance, wheel offset, rubbing risk.
 */
import type { ComparisonDataSourceSummary, PublishedTireMeasurements } from './comparison-data-sources';
import { parsePrimaryLoadIndex } from './tire-ratings';
import type { TireComparison, TireSpecs } from './tire-math';

export const DIMENSIONAL_COMPATIBILITY = {
  diameterPassPct: 3,
  diameterModeratePct: 5,
  widthPassPct: 3,
  widthModeratePct: 7,
  speedoPassPct: 3,
  speedoModeratePct: 5,
  diameterWeight: 0.35,
  widthWeight: 0.12,
  speedoWeight: 0.18,
  differentWheelPenalty: 0.6,
  lowerLoadIndexPenalty: 0.8,
  lowerSpeedRatingPenalty: 0.5,
  incompatibleRimPenalty: 0.7,
  /** Score at/above this → close-match band. */
  closeScore: 8,
  /** Score at/above this → moderate band. */
  moderateScore: 5,
} as const;

const SPEED_ORDER = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y'] as const;

export type DecisionFitmentStatus = 'pass' | 'warning' | 'fail' | 'info' | 'unknown';

export interface DecisionFitmentRow {
  id: string;
  label: string;
  status: DecisionFitmentStatus;
  statusLabel: string;
}

export interface DecisionFeelItem {
  id: string;
  title: string;
  body: string;
}

export interface DecisionBullet {
  kind: 'note' | 'warning';
  text: string;
}

export interface DimensionalDecisionSupport {
  heading: string;
  tone: 'green' | 'yellow' | 'orange' | 'red';
  score: number;
  scoreTitle: 'Dimensional Compatibility Score';
  scoreDisclaimer: string;
  bullets: DecisionBullet[];
  fitmentRows: DecisionFitmentRow[];
  feelItems: DecisionFeelItem[];
}

function speedRank(rating: string | null | undefined): number | null {
  if (!rating) return null;
  const key = rating.trim().toUpperCase();
  const idx = SPEED_ORDER.indexOf(key as (typeof SPEED_ORDER)[number]);
  return idx >= 0 ? idx : null;
}

function loadIndexNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  return parsePrimaryLoadIndex(value);
}

/** Rough overlap check for rim ranges like "7.0-8.5" or "8J". */
export function rimRangesCompatible(a: string | null, b: string | null): boolean | null {
  if (!a || !b) return null;
  const parse = (raw: string): { min: number; max: number } | null => {
    const nums = raw.match(/(\d+(?:\.\d+)?)/g)?.map(Number).filter((n) => Number.isFinite(n));
    if (!nums || nums.length === 0) return null;
    if (nums.length === 1) return { min: nums[0], max: nums[0] };
    return { min: Math.min(...nums), max: Math.max(...nums) };
  };
  const ra = parse(a);
  const rb = parse(b);
  if (!ra || !rb) return null;
  return !(ra.max < rb.min || rb.max < ra.min);
}

function magnitudeStatus(
  absPct: number,
  pass: number,
  moderate: number,
): { status: DecisionFitmentStatus; statusLabel: string } {
  if (absPct <= pass) return { status: 'pass', statusLabel: 'Within comparison threshold' };
  if (absPct <= moderate) return { status: 'warning', statusLabel: 'Moderate change' };
  return { status: 'fail', statusLabel: 'Significant change' };
}

export function computeDimensionalCompatibilityScore(input: {
  comparison: TireComparison;
  specsA: TireSpecs;
  specsB: TireSpecs;
  publishedA?: PublishedTireMeasurements | null;
  publishedB?: PublishedTireMeasurements | null;
}): number {
  const { comparison, specsA, specsB, publishedA, publishedB } = input;
  const t = DIMENSIONAL_COMPATIBILITY;
  let score = 10;

  const diamPct = Math.abs(comparison.diameterDiffPercent);
  const widthPct = Math.abs(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100);
  const speedo = Math.abs(comparison.speedometer.errorPercent);

  score -= diamPct * t.diameterWeight;
  score -= widthPct * t.widthWeight;
  score -= speedo * t.speedoWeight;

  if (specsB.wheelDiameterIn !== specsA.wheelDiameterIn) {
    score -= t.differentWheelPenalty;
  }

  const liA = loadIndexNumber(publishedA?.loadIndex ?? null);
  const liB = loadIndexNumber(publishedB?.loadIndex ?? null);
  if (liA != null && liB != null && liB < liA) {
    score -= t.lowerLoadIndexPenalty;
  }

  const srA = speedRank(publishedA?.speedRating ?? null);
  const srB = speedRank(publishedB?.speedRating ?? null);
  if (srA != null && srB != null && srB < srA) {
    score -= t.lowerSpeedRatingPenalty;
  }

  const rimOk = rimRangesCompatible(
    publishedA?.approvedRimRange ?? null,
    publishedB?.approvedRimRange ?? null,
  );
  if (rimOk === false) {
    score -= t.incompatibleRimPenalty;
  }

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

function buildHeading(input: {
  absDiamPct: number;
  wheelDiff: boolean;
  lowerLoad: boolean;
  lowerSpeed: boolean;
}): { heading: string; tone: DimensionalDecisionSupport['tone'] } {
  const { absDiamPct, wheelDiff, lowerLoad, lowerSpeed } = input;
  const t = DIMENSIONAL_COMPATIBILITY;

  if (wheelDiff) {
    return {
      heading: 'Different wheel required — vehicle checks required',
      tone: 'orange',
    };
  }

  if (lowerLoad && lowerSpeed) {
    return {
      heading: 'Published load and speed ratings lower than original — vehicle checks required',
      tone: 'red',
    };
  }
  if (lowerLoad) {
    return {
      heading: 'Published load rating lower than original — vehicle checks required',
      tone: 'red',
    };
  }
  if (lowerSpeed) {
    return {
      heading: 'Published speed rating lower than original — vehicle checks required',
      tone: 'orange',
    };
  }

  if (absDiamPct > t.diameterModeratePct) {
    return {
      heading: 'Significant dimensional change — vehicle checks required',
      tone: 'red',
    };
  }
  if (absDiamPct > t.diameterPassPct) {
    return {
      heading: 'Moderate change — vehicle checks required',
      tone: 'yellow',
    };
  }
  return {
    heading: 'Very close dimensional match — vehicle checks still apply',
    tone: 'green',
  };
}

function buildFeelItems(specsA: TireSpecs, specsB: TireSpecs, comparison: TireComparison): DecisionFeelItem[] {
  const items: DecisionFeelItem[] = [];
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDiff = specsB.sectionWidthIn - specsA.sectionWidthIn;

  if (Math.abs(sidewallDiff) >= 0.05) {
    if (sidewallDiff < 0) {
      items.push({
        id: 'steering',
        title: 'Steering response',
        body: 'Shorter sidewall may reduce flex, although tire construction, pressure and vehicle setup also affect response.',
      });
      items.push({
        id: 'ride',
        title: 'Ride comfort',
        body: 'Shorter sidewall generally transmits more impact harshness.',
      });
      items.push({
        id: 'sidewall',
        title: 'Sidewall compliance',
        body: 'Reduced sidewall height typically means less vertical compliance over sharp edges; construction still matters.',
      });
    } else {
      items.push({
        id: 'steering',
        title: 'Steering response',
        body: 'Taller sidewall may allow more flex, although tire construction, pressure and vehicle setup also affect response.',
      });
      items.push({
        id: 'ride',
        title: 'Ride comfort',
        body: 'Taller sidewall can absorb more impact energy, subject to tire construction and inflation.',
      });
      items.push({
        id: 'sidewall',
        title: 'Sidewall compliance',
        body: 'Increased sidewall height generally adds compliance; exact feel depends on compound and carcass design.',
      });
    }
  } else {
    items.push({
      id: 'sidewall',
      title: 'Sidewall compliance',
      body: 'Sidewall height is nearly unchanged, so compliance shifts from size alone should be modest.',
    });
  }

  if (Math.abs(diamDiff) >= 0.05) {
    items.push({
      id: 'gearing',
      title: 'Effective gearing',
      body:
        diamDiff > 0
          ? 'The larger rolling diameter produces slightly taller effective gearing.'
          : 'The smaller rolling diameter produces slightly shorter effective gearing.',
    });
  } else {
    items.push({
      id: 'gearing',
      title: 'Effective gearing',
      body: 'Rolling diameter is nearly unchanged, so effective gearing shift from size alone should be small.',
    });
  }

  if (Math.abs(widthDiff) >= 0.1 || Math.abs(sidewallDiff) >= 0.05) {
    items.push({
      id: 'character',
      title: 'Road-use character',
      body: 'Width and profile changes can alter road feel and noise; they do not by themselves prove better grip, snow performance or towing ability.',
    });
  } else {
    items.push({
      id: 'character',
      title: 'Road-use character',
      body: 'Dimensional character is similar; remaining differences are more likely from tire model and construction than from size code alone.',
    });
  }

  // Keep speedo/context out of overstated claims
  void comparison;
  return items.slice(0, 5);
}

export function buildDimensionalDecisionSupport(input: {
  comparison: TireComparison;
  specsA: TireSpecs;
  specsB: TireSpecs;
  dataSources: ComparisonDataSourceSummary;
}): DimensionalDecisionSupport {
  const { comparison, specsA, specsB, dataSources } = input;
  const publishedA = dataSources.publishedA;
  const publishedB = dataSources.publishedB;
  const t = DIMENSIONAL_COMPATIBILITY;

  const absDiamPct = Math.abs(comparison.diameterDiffPercent);
  const widthPct = Math.abs(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100);
  const absSpeedo = Math.abs(comparison.speedometer.errorPercent);
  const wheelDiff = specsB.wheelDiameterIn !== specsA.wheelDiameterIn;

  const liA = loadIndexNumber(publishedA?.loadIndex ?? null);
  const liB = loadIndexNumber(publishedB?.loadIndex ?? null);
  const lowerLoad = liA != null && liB != null && liB < liA;
  const srA = speedRank(publishedA?.speedRating ?? null);
  const srB = speedRank(publishedB?.speedRating ?? null);
  const lowerSpeed = srA != null && srB != null && srB < srA;
  const rimOk = rimRangesCompatible(
    publishedA?.approvedRimRange ?? null,
    publishedB?.approvedRimRange ?? null,
  );

  const score = computeDimensionalCompatibilityScore({
    comparison,
    specsA,
    specsB,
    publishedA,
    publishedB,
  });

  const { heading, tone } = buildHeading({
    absDiamPct,
    wheelDiff,
    lowerLoad,
    lowerSpeed,
  });

  const bullets: DecisionBullet[] = [];
  bullets.push({
    kind: 'note',
    text: `Diameter change ${comparison.diameterDiffPercent >= 0 ? '+' : '−'}${absDiamPct.toFixed(2)}%.`,
  });
  bullets.push({
    kind: absSpeedo > t.speedoPassPct ? 'warning' : 'note',
    text: `Speedometer difference ${comparison.speedometer.errorPercent >= 0 ? '+' : '−'}${absSpeedo.toFixed(2)}%.`,
  });
  if (wheelDiff) {
    bullets.push({
      kind: 'warning',
      text: `Wheel diameter changes from ${specsA.wheelDiameterIn}" to ${specsB.wheelDiameterIn}" — a different wheel is required.`,
    });
  } else {
    bullets.push({
      kind: 'note',
      text: `Same ${specsA.wheelDiameterIn}" wheel diameter in the size codes.`,
    });
  }
  if (lowerLoad) {
    bullets.push({
      kind: 'warning',
      text: `Published load index falls from ${publishedA?.loadIndex} to ${publishedB?.loadIndex}.`,
    });
  }
  if (lowerSpeed) {
    bullets.push({
      kind: 'warning',
      text: `Published speed rating falls from ${publishedA?.speedRating} to ${publishedB?.speedRating}.`,
    });
  }

  // Keep at most four ATF supporting reasons (presentation cap — thresholds unchanged).
  const atfBullets = bullets.slice(0, 4);

  const diamRow = magnitudeStatus(absDiamPct, t.diameterPassPct, t.diameterModeratePct);
  const speedoRow = magnitudeStatus(absSpeedo, t.speedoPassPct, t.speedoModeratePct);
  const widthRow = magnitudeStatus(widthPct, t.widthPassPct, t.widthModeratePct);

  const fitmentRows: DecisionFitmentRow[] = [
    { id: 'diameter', label: 'Diameter difference', ...diamRow },
    { id: 'speedo', label: 'Speedometer difference', ...speedoRow },
    {
      id: 'wheel',
      label: 'Wheel diameter',
      status: wheelDiff ? 'fail' : 'pass',
      statusLabel: wheelDiff ? 'Different wheel required' : 'Within comparison threshold',
    },
    { id: 'width', label: 'Width difference', ...widthRow },
    publishedA?.approvedRimRange || publishedB?.approvedRimRange
      ? {
          id: 'rim',
          label: 'Approved rim-width range',
          status: rimOk === false ? 'fail' : rimOk === true ? 'pass' : 'info',
          statusLabel:
            rimOk === false
              ? 'Significant change'
              : rimOk === true
                ? 'Verified'
                : 'Check required',
        }
      : {
          id: 'rim',
          label: 'Approved rim-width range',
          status: 'info',
          statusLabel: 'Data unavailable',
        },
    liA != null || liB != null
      ? {
          id: 'load',
          label: 'Load index',
          status:
            liA != null && liB != null
              ? lowerLoad
                ? 'fail'
                : liB === liA
                  ? 'pass'
                  : 'info'
              : 'info',
          statusLabel:
            liA != null && liB != null
              ? lowerLoad
                ? 'Lower than original'
                : 'Verified'
              : 'Check required',
        }
      : {
          id: 'load',
          label: 'Load index',
          status: 'info',
          statusLabel: 'Data unavailable',
        },
    srA != null || srB != null
      ? {
          id: 'speed-rating',
          label: 'Speed rating',
          status:
            srA != null && srB != null
              ? lowerSpeed
                ? 'fail'
                : srB === srA
                  ? 'pass'
                  : 'info'
              : 'info',
          statusLabel:
            srA != null && srB != null
              ? lowerSpeed
                ? 'Lower than original'
                : 'Verified'
              : 'Check required',
        }
      : {
          id: 'speed-rating',
          label: 'Speed rating',
          status: 'info',
          statusLabel: 'Data unavailable',
        },
    {
      id: 'fender',
      label: 'Fender clearance',
      status: 'unknown',
      statusLabel: 'Check required',
    },
    {
      id: 'suspension',
      label: 'Suspension clearance',
      status: 'unknown',
      statusLabel: 'Check required',
    },
    {
      id: 'brake',
      label: 'Brake clearance',
      status: 'unknown',
      statusLabel: 'Check required',
    },
    {
      id: 'offset',
      label: 'Wheel offset',
      status: 'unknown',
      statusLabel: 'Check required',
    },
    {
      id: 'hub',
      label: 'Hub compatibility',
      status: 'unknown',
      statusLabel: 'Check required',
    },
    {
      id: 'rubbing',
      label: 'Rubbing risk',
      status: 'unknown',
      statusLabel: 'Check required',
    },
  ];

  return {
    heading,
    tone,
    score,
    scoreTitle: 'Dimensional Compatibility Score',
    scoreDisclaimer: 'Dimensional assessment only—not confirmed vehicle fitment.',
    bullets: atfBullets,
    fitmentRows,
    feelItems: buildFeelItems(specsA, specsB, comparison),
  };
}
