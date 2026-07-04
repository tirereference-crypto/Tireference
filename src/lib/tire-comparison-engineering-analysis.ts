/**
 * Measurement-driven engineering analysis for tire size comparisons.
 *
 * Every section explains *why* using only calculated dimensions and ratings —
 * no invented performance percentages or marketing labels.
 */
import type { UnitSystem } from './calculator-types';
import { getTireSizeEntry } from './tire-size-hub';
import { resolveTireRatings, type ResolvedTireRatings } from './tire-ratings';
import type { TireComparison, TireSpecs } from './tire-math';
import {
  ENGINEERING_ANALYSIS_SECTION_ORDER,
  type EngineeringAnalysisSectionId,
} from './tire-comparison-engineering-prompts';
import { fmtInQuote, fmtPct, fmtSigned, nearZero } from './tire-comparison-format';
import { upgradeHeadlineFromAnalysis } from './tire-comparison-fitment';
import { rpmAtSpeed, speedUnitLabel } from './tire-comparison-units';
import {
  buildCategoryBenefits,
  buildCategoryConsiderations,
  buildCategoryPersonalityBullets,
  buildCategoryRecommendationBody,
  buildCategoryWhoShouldChoose,
  buildRecommendationContext,
} from './tire-comparison-recommendations';

export interface ComparisonMeasurements {
  sizeA: string;
  sizeB: string;
  specsA: TireSpecs;
  specsB: TireSpecs;
  comparison: TireComparison;
  unitSystem: UnitSystem;
  indicatedSpeed: number;
  rpmA: number;
  rpmB: number;
  rpmDelta: number;
  widthPct: number;
  sidewallPct: number;
  ratingsA: ResolvedTireRatings | null;
  ratingsB: ResolvedTireRatings | null;
  fitmentScore: number;
}

export interface EngineeringAnalysisSection {
  id: EngineeringAnalysisSectionId;
  title: string;
  body: string;
}

export interface EngineeringAnalysis {
  measurements: ComparisonMeasurements;
  sections: EngineeringAnalysisSection[];
  byId: Record<EngineeringAnalysisSectionId, EngineeringAnalysisSection>;
}

function fmtIn(n: number, digits = 2): string {
  return `${n.toFixed(digits)} in`;
}

function fmtMm(n: number, digits = 1): string {
  return `${n.toFixed(digits)} mm`;
}

function formatDimensionDelta(
  signedIn: number,
  signedMm: number,
  pct: number,
  unitSystem: UnitSystem,
): string {
  if (unitSystem === 'metric') {
    return `${fmtSigned(signedMm, 1, ' mm')} (${fmtPct(pct)})`;
  }
  return `${fmtSigned(signedIn, 2, '"')} (${fmtPct(pct)})`;
}

function ratingsSummary(ratings: ResolvedTireRatings | null, fallback: string): string {
  if (!ratings) return fallback;
  const parts: string[] = [];
  if (ratings.loadIndex) parts.push(`load index ${ratings.loadIndex}`);
  if (ratings.speedRating) {
    parts.push(
      ratings.speedRatingLabel
        ? `speed rating ${ratings.speedRating} (${ratings.speedRatingLabel})`
        : `speed rating ${ratings.speedRating}`,
    );
  }
  if (ratings.loadRange) {
    parts.push(
      ratings.loadRangePly
        ? `load range ${ratings.loadRange} (${ratings.loadRangePly})`
        : `load range ${ratings.loadRange}`,
    );
  }
  return parts.length > 0 ? parts.join(', ') : fallback;
}

/** Collect every measurable fact used across section builders. */
export function buildComparisonMeasurements(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem = 'imperial',
  fitmentScore = 10,
): ComparisonMeasurements {
  const indicatedSpeed = comparison.speedometer.indicatedSpeed;
  const rpmA = Math.round(rpmAtSpeed(indicatedSpeed, specsA, unitSystem));
  const rpmB = Math.round(rpmAtSpeed(indicatedSpeed, specsB, unitSystem));

  const entryA = getTireSizeEntry(sizeA);
  const entryB = getTireSizeEntry(sizeB);

  return {
    sizeA,
    sizeB,
    specsA,
    specsB,
    comparison,
    unitSystem,
    indicatedSpeed,
    rpmA,
    rpmB,
    rpmDelta: rpmB - rpmA,
    widthPct: ((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100,
    sidewallPct: ((specsB.sidewallIn - specsA.sidewallIn) / specsA.sidewallIn) * 100,
    ratingsA: entryA ? resolveTireRatings(entryA.ratings) : null,
    ratingsB: entryB ? resolveTireRatings(entryB.ratings) : null,
    fitmentScore,
  };
}

function buildRideQualitySection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { specsA, specsB, comparison, unitSystem } = m;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const sidewallDiffMm = specsB.sidewallMm - specsA.sidewallMm;
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;

  let body: string;

  if (nearZero(sidewallDiff, 0.05)) {
    body = [
      `Sidewall height is essentially unchanged — ${fmtInQuote(specsA.sidewallIn)} on ${m.sizeA} versus ${fmtInQuote(specsB.sidewallIn)} on ${m.sizeB} (${formatDimensionDelta(sidewallDiff, sidewallDiffMm, m.sidewallPct, unitSystem)}).`,
      `With aspect ratio moving only ${fmtSigned(aspectDiff, 0)} points (${specsA.aspectRatio} → ${specsB.aspectRatio}), the air-spring volume in the sidewall stays similar, so impact absorption and road-texture transmission should remain close to the reference tire.`,
    ].join(' ');
  } else if (sidewallDiff > 0) {
    body = [
      `${m.sizeB} carries ${formatDimensionDelta(sidewallDiff, sidewallDiffMm, m.sidewallPct, unitSystem)} more sidewall height than ${m.sizeA} (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}; aspect ratio ${specsA.aspectRatio} → ${specsB.aspectRatio}).`,
      `That taller sidewall behaves like a larger air spring: it can absorb more vertical deflection before the tread contacts the rim, which generally softens the ride over potholes and expansion joints.`,
      `The trade-off is increased sidewall flex under cornering load, which can feel less precise than a shorter sidewall on the same overall diameter (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}, ${fmtPct(comparison.diameterDiffPercent)}).`,
    ].join(' ');
  } else {
    body = [
      `${m.sizeB} shortens the sidewall by ${formatDimensionDelta(sidewallDiff, sidewallDiffMm, m.sidewallPct, unitSystem)} relative to ${m.sizeA} (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}; aspect ratio ${specsA.aspectRatio} → ${specsB.aspectRatio}).`,
      `The shorter sidewall reduces vertical compliance — less air volume deflects under impact, so road texture and sharp edges transfer more directly to the suspension and cabin.`,
      `That same reduction in sidewall flex generally firms up transient response on paved surfaces, at the cost of a harsher ride over broken pavement compared with the taller ${fmtInQuote(specsA.sidewallIn)} sidewall on ${m.sizeA}.`,
    ].join(' ');
  }

  return { id: 'ride-quality', title: 'Ride Quality', body };
}

function buildHandlingSection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { specsA, specsB, comparison, unitSystem } = m;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDiffIn = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const wheelDiff = specsB.wheelDiameterIn - specsA.wheelDiameterIn;

  const sidewallPart = nearZero(sidewallDiff, 0.05)
    ? `Sidewall height is nearly identical (${fmtInQuote(specsA.sidewallIn)} vs ${fmtInQuote(specsB.sidewallIn)}), so sidewall flex during turn-in should remain similar.`
    : sidewallDiff < 0
      ? `The ${formatDimensionDelta(sidewallDiff, specsB.sidewallMm - specsA.sidewallMm, m.sidewallPct, unitSystem)} sidewall reduction limits tread squirm under lateral load, which generally sharpens steering response on paved roads — at the expense of transmitting more impact energy when the sidewall cannot deflect as far.`
      : `The ${formatDimensionDelta(sidewallDiff, specsB.sidewallMm - specsA.sidewallMm, m.sidewallPct, unitSystem)} taller sidewall allows more tread movement under cornering load, which can feel softer in transitions even though overall diameter changed ${fmtPct(comparison.diameterDiffPercent)}.`;

  const widthPart = nearZero(widthDiffMm, 2)
    ? `Section width is essentially unchanged (${fmtInQuote(specsA.sectionWidthIn)} vs ${fmtInQuote(specsB.sectionWidthIn)}), so contact-patch width and steering effort should stay familiar.`
    : widthDiffIn > 0
      ? `Section width grows ${formatDimensionDelta(widthDiffIn, widthDiffMm, m.widthPct, unitSystem)} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}), enlarging the contact patch and typically increasing steering effort and scrub radius at full lock.`
      : `Section width narrows ${formatDimensionDelta(widthDiffIn, widthDiffMm, m.widthPct, unitSystem)} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}), reducing contact-patch area and usually lowering steering effort.`;

  const wheelPart =
    wheelDiff === 0
      ? `Both sizes mount on ${specsA.wheelDiameterIn}" wheels, so wheel diameter does not add a separate handling variable.`
      : `Wheel diameter changes from ${specsA.wheelDiameterIn}" to ${specsB.wheelDiameterIn}" (${fmtSigned(wheelDiff, 0, '"')}), which shifts the rim-to-tread geometry and can alter turn-in feel independent of the sidewall change.`;

  return {
    id: 'handling',
    title: 'Handling',
    body: [sidewallPart, widthPart, wheelPart].join(' '),
  };
}

function buildFuelEconomySection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { specsA, specsB, comparison, unitSystem, indicatedSpeed, rpmA, rpmB, rpmDelta } = m;
  const speedUnit = speedUnitLabel(unitSystem);
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';
  const revsA = unitSystem === 'metric' ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === 'metric' ? specsB.revsPerKm : specsB.revsPerMile;
  const revsDiff = revsB - revsA;
  const revsDiffPct =
    unitSystem === 'metric'
      ? ((specsB.revsPerKm - specsA.revsPerKm) / specsA.revsPerKm) * 100
      : comparison.revsPerMileDiffPercent;

  const widthDiffMm = specsB.widthMm - specsA.widthMm;

  const rpmPart =
    revsDiff > 0
      ? `At ${indicatedSpeed} ${speedUnit} indicated, engine speed rises from ${rpmA.toLocaleString()} to ${rpmB.toLocaleString()} RPM (${fmtSigned(rpmDelta, 0, ' RPM')}) because ${revsLabel} increase ${fmtSigned(revsDiff, unitSystem === 'metric' ? 1 : 0)} (${fmtPct(revsDiffPct)}).`
      : revsDiff < 0
        ? `At ${indicatedSpeed} ${speedUnit} indicated, engine speed falls from ${rpmA.toLocaleString()} to ${rpmB.toLocaleString()} RPM (${fmtSigned(rpmDelta, 0, ' RPM')}) because ${revsLabel} decrease ${fmtSigned(revsDiff, unitSystem === 'metric' ? 1 : 0)} (${fmtPct(revsDiffPct)}).`
        : `At ${indicatedSpeed} ${speedUnit} indicated, engine speed stays at ${rpmA.toLocaleString()} RPM because ${revsLabel} are unchanged (${revsA.toFixed(1)} → ${revsB.toFixed(1)}).`;

  const circPart = `Rolling circumference shifts ${unitSystem === 'metric' ? fmtSigned(comparison.circumferenceDiffIn * 25.4, 1, ' mm') : fmtSigned(comparison.circumferenceDiffIn, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}), from ${unitSystem === 'metric' ? fmtMm(specsA.circumferenceMm) : fmtIn(specsA.circumferenceIn)} to ${unitSystem === 'metric' ? fmtMm(specsB.circumferenceMm) : fmtIn(specsB.circumferenceIn)} per revolution.`;

  const widthPart = nearZero(widthDiffMm, 2)
    ? `Section width is nearly unchanged, so rolling resistance from tread width should remain similar.`
    : widthDiffMm > 0
      ? `Section width increases ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(m.widthPct)}), which adds tread rubber on the road and can increase rolling resistance at a given pressure — a separate factor from the ${revsLabel} change.`
      : `Section width decreases ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(m.widthPct)}), which reduces tread contact area and can lower rolling resistance at a given pressure.`;

  return {
    id: 'fuel-economy',
    title: 'Fuel Economy',
    body: `${rpmPart} ${circPart} ${widthPart} These are the measurable drivers of engine load at cruising speed; actual fuel consumption also depends on vehicle weight, aerodynamics, and tire compound, which are outside this dimensional comparison.`,
  };
}

function buildAccelerationSection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { specsA, specsB, comparison, unitSystem } = m;
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';
  const revsA = unitSystem === 'metric' ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === 'metric' ? specsB.revsPerKm : specsB.revsPerMile;

  let body: string;

  if (nearZero(comparison.diameterDiffPercent, 0.1)) {
    body = [
      `Overall diameter is effectively unchanged (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}, ${fmtPct(comparison.diameterDiffPercent)}), so effective axle ratio at the tire remains the same.`,
      `${revsLabel} stay at ${revsA.toFixed(1)} versus ${revsB.toFixed(1)} per ${unitSystem === 'metric' ? 'kilometre' : 'mile'}, meaning the drivetrain turns the same number of revolutions for each unit of road distance.`,
    ].join(' ');
  } else if (comparison.diameterDiffPercent > 0) {
    body = [
      `${m.sizeB} is ${formatDimensionDelta(specsB.overallDiameterIn - specsA.overallDiameterIn, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} taller in overall diameter (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Each drive-wheel revolution covers more ground (${unitSystem === 'metric' ? fmtMm(specsA.circumferenceMm) : fmtIn(specsA.circumferenceIn)} → ${unitSystem === 'metric' ? fmtMm(specsB.circumferenceMm) : fmtIn(specsB.circumferenceIn)} circumference), which acts like a taller effective gear ratio — the engine turns ${fmtSigned(revsB - revsA, unitSystem === 'metric' ? 1 : 0)} fewer ${revsLabel} (${fmtPct(comparison.revsPerMileDiffPercent)}) for the same road speed.`,
      `That mechanical advantage can make throttle response feel softer from a stop, because each crankshaft revolution delivers more forward distance at the contact patch.`,
    ].join(' ');
  } else {
    body = [
      `${m.sizeB} is ${formatDimensionDelta(specsB.overallDiameterIn - specsA.overallDiameterIn, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} shorter in overall diameter (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Each drive-wheel revolution covers less ground (${unitSystem === 'metric' ? fmtMm(specsA.circumferenceMm) : fmtIn(specsA.circumferenceIn)} → ${unitSystem === 'metric' ? fmtMm(specsB.circumferenceMm) : fmtIn(specsB.circumferenceIn)} circumference), which acts like a shorter effective gear ratio — the engine turns ${fmtSigned(revsB - revsA, unitSystem === 'metric' ? 1 : 0)} more ${revsLabel} (${fmtPct(comparison.revsPerMileDiffPercent)}) for the same road speed.`,
      `That shorter rolling radius can make throttle response feel more immediate from a stop, because each crankshaft revolution delivers less forward distance at the contact patch.`,
    ].join(' ');
  }

  return { id: 'acceleration', title: 'Acceleration', body };
}

function buildClearanceSection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { specsA, specsB, comparison, unitSystem } = m;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const clearance = comparison.groundClearanceChangeIn;
  const halfDiam = diamDiff / 2;

  let body: string;

  if (nearZero(clearance, 0.01)) {
    body = [
      `Overall diameter is unchanged (${fmtInQuote(specsA.overallDiameterIn)} on both sizes), so static ground clearance at the lowest chassis point should remain the same.`,
      `The half-diameter rule applies: with ${fmtSigned(diamDiff, 2, '"')} diameter change, ride height shifts ${fmtSigned(clearance, 2, ' in')} at the axle centerline.`,
    ].join(' ');
  } else if (clearance > 0) {
    body = [
      `Overall diameter increases ${formatDimensionDelta(diamDiff, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Static ground clearance at the differential or lowest chassis point rises approximately ${unitSystem === 'metric' ? fmtSigned(clearance * 25.4, 1, ' mm') : fmtSigned(clearance, 2, ' in')} — half the ${unitSystem === 'metric' ? fmtSigned(diamDiff * 25.4, 1, ' mm') : fmtSigned(diamDiff, 2, '"')} diameter delta (${fmtSigned(halfDiam, 2, '"')} at each axle).`,
      `Break-over angle improves because the contact patches sit farther from the vehicle centerline, but verify that the larger tire envelope clears the fender and liner at full suspension compression before relying on the extra height.`,
    ].join(' ');
  } else {
    body = [
      `Overall diameter decreases ${formatDimensionDelta(diamDiff, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Static ground clearance falls approximately ${unitSystem === 'metric' ? fmtSigned(Math.abs(clearance) * 25.4, 1, ' mm') : fmtSigned(Math.abs(clearance), 2, ' in')} — half the ${unitSystem === 'metric' ? fmtSigned(Math.abs(diamDiff) * 25.4, 1, ' mm') : fmtSigned(Math.abs(diamDiff), 2, '"')} diameter reduction.`,
      `Approach and departure angles tighten accordingly; confirm this trade-off against your clearance needs.`,
    ].join(' ');
  }

  return { id: 'clearance', title: 'Clearance', body };
}

function buildFitmentSection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { specsA, specsB, comparison, unitSystem, ratingsA, ratingsB } = m;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDiffIn = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const wheelDiff = specsB.wheelDiameterIn - specsA.wheelDiameterIn;

  const envelopePart = [
    `Diameter change: ${formatDimensionDelta(diamDiff, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
    `Section width change: ${formatDimensionDelta(widthDiffIn, specsB.widthMm - specsA.widthMm, m.widthPct, unitSystem)} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}).`,
    wheelDiff === 0
      ? `Wheel diameter is unchanged at ${specsA.wheelDiameterIn}".`
      : `Wheel diameter changes ${specsA.wheelDiameterIn}" → ${specsB.wheelDiameterIn}" (${fmtSigned(wheelDiff, 0, '"')}), requiring a wheel matched to the new bead seat.`,
  ].join(' ');

  const ratingsPart = `Reference ratings for ${m.sizeA}: ${ratingsSummary(ratingsA, 'not in dataset')}. New size ${m.sizeB}: ${ratingsSummary(ratingsB, 'not in dataset')}. Verify that load index and speed rating meet or exceed your vehicle placard before installation.`;

  const verifyPart =
    Math.abs(comparison.diameterDiffPercent) > 3 || Math.abs(m.widthPct) > 5
      ? `With combined diameter and width growth, mock-fit at full steering lock and maximum suspension compression before purchasing — the tire envelope expands upward into the fender lip, inward toward the strut, and rearward into the inner liner.`
      : `Dimensional deltas are moderate; still verify inner fender, suspension, and brake clearance on your exact wheel offset before committing to a full set.`;

  return {
    id: 'fitment',
    title: 'Fitment',
    body: `${envelopePart} ${ratingsPart} ${verifyPart}`,
  };
}

function buildDailyDrivingSection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { comparison, specsA, specsB, unitSystem, indicatedSpeed, rpmA, rpmB } = m;
  const speedUnit = speedUnitLabel(unitSystem);
  const trueSpeed = comparison.speedometer.trueSpeed;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;

  const speedoPart = nearZero(comparison.speedometer.errorPercent, 0.1)
    ? `Speedometer error is negligible (${fmtPct(comparison.speedometer.errorPercent)}): at ${indicatedSpeed} ${speedUnit} indicated, true speed is ${trueSpeed.toFixed(1)} ${speedUnit}.`
    : `Speedometer reads ${fmtPct(comparison.speedometer.errorPercent)} versus true speed — at ${indicatedSpeed} ${speedUnit} indicated, actual road speed is ${trueSpeed.toFixed(1)} ${speedUnit}. ${Math.abs(comparison.speedometer.errorPercent) > 3 ? 'Recalibration may be needed for drivers who rely on precise indicated speed.' : 'Most daily drivers stay within a typical OEM tolerance band.'}`;

  const ridePart = nearZero(sidewallDiff, 0.05)
    ? `Sidewall height is similar (${fmtInQuote(specsA.sidewallIn)} vs ${fmtInQuote(specsB.sidewallIn)}), so commute ride compliance should feel familiar.`
    : sidewallDiff > 0
      ? `The ${fmtSigned(sidewallDiff, 2, '"')} taller sidewall (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}) adds impact absorption on broken urban pavement.`
      : `The ${fmtSigned(Math.abs(sidewallDiff), 2, '"')} shorter sidewall (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}) transmits more road texture during stop-and-go driving.`;

  const steerPart = nearZero(widthDiffMm, 2)
    ? `Section width is unchanged at ${fmtInQuote(specsA.sectionWidthIn)}, so steering effort should remain similar.`
    : widthDiffMm > 0
      ? `Section width grows ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(m.widthPct)}), which typically increases steering effort at parking speeds.`
      : `Section width narrows ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(m.widthPct)}), which typically lowers steering effort at parking speeds.`;

  const rpmPart = `Cruising RPM at ${indicatedSpeed} ${speedUnit}: ${rpmA.toLocaleString()} → ${rpmB.toLocaleString()} (${fmtSigned(m.rpmDelta, 0, ' RPM')}).`;

  return {
    id: 'daily-driving',
    title: 'Daily Driving',
    body: [speedoPart, ridePart, steerPart, rpmPart].join(' '),
  };
}

function buildHighwayDrivingSection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const { specsA, specsB, comparison, unitSystem, indicatedSpeed, rpmA, rpmB, rpmDelta } = m;
  const speedUnit = speedUnitLabel(unitSystem);
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';
  const revsA = unitSystem === 'metric' ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === 'metric' ? specsB.revsPerKm : specsB.revsPerMile;

  const rpmPart = `At ${indicatedSpeed} ${speedUnit} indicated, engine speed is ${rpmA.toLocaleString()} RPM on ${m.sizeA} versus ${rpmB.toLocaleString()} RPM on ${m.sizeB} (${fmtSigned(rpmDelta, 0, ' RPM')}).`;

  const revsPart = `${revsLabel}: ${revsA.toFixed(1)} → ${revsB.toFixed(1)} (${fmtSigned(revsB - revsA, unitSystem === 'metric' ? 1 : 0)}, ${fmtPct(comparison.revsPerMileDiffPercent)}).`;

  const speedoPart = `True speed at ${indicatedSpeed} ${speedUnit} indicated: ${comparison.speedometer.trueSpeed.toFixed(1)} ${speedUnit} (${fmtPct(comparison.speedometer.errorPercent)} error).`;

  const circPart = `Circumference per revolution: ${unitSystem === 'metric' ? fmtMm(specsA.circumferenceMm) : fmtIn(specsA.circumferenceIn)} → ${unitSystem === 'metric' ? fmtMm(specsB.circumferenceMm) : fmtIn(specsB.circumferenceIn)} (${unitSystem === 'metric' ? fmtSigned(comparison.circumferenceDiffIn * 25.4, 1, ' mm') : fmtSigned(comparison.circumferenceDiffIn, 2, '"')}).`;

  return {
    id: 'highway-driving',
    title: 'Highway Driving',
    body: [rpmPart, revsPart, speedoPart, circPart].join(' '),
  };
}

function buildRecommendationSection(m: ComparisonMeasurements): EngineeringAnalysisSection {
  const ctx = buildRecommendationContext(m.sizeA, m.sizeB, m.comparison, m.specsA, m.specsB, {
    fitmentScore: m.fitmentScore,
    unitSystem: m.unitSystem,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    indicatedSpeed: m.indicatedSpeed,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct,
  });

  return {
    id: 'recommendation',
    title: 'Recommendation',
    body: buildCategoryRecommendationBody(ctx),
  };
}

const SECTION_BUILDERS: Record<
  EngineeringAnalysisSectionId,
  (m: ComparisonMeasurements) => EngineeringAnalysisSection
> = {
  'ride-quality': buildRideQualitySection,
  handling: buildHandlingSection,
  'fuel-economy': buildFuelEconomySection,
  acceleration: buildAccelerationSection,
  clearance: buildClearanceSection,
  fitment: buildFitmentSection,
  'daily-driving': buildDailyDrivingSection,
  'highway-driving': buildHighwayDrivingSection,
  recommendation: buildRecommendationSection,
};

/** Build all nine engineering analysis sections from measured tire data. */
export function buildEngineeringAnalysis(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem = 'imperial',
  fitmentScore = 10,
): EngineeringAnalysis {
  const measurements = buildComparisonMeasurements(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
    fitmentScore,
  );

  const sections = ENGINEERING_ANALYSIS_SECTION_ORDER.map((id) => SECTION_BUILDERS[id](measurements));
  const byId = Object.fromEntries(sections.map((s) => [s.id, s])) as Record<
    EngineeringAnalysisSectionId,
    EngineeringAnalysisSection
  >;

  return { measurements, sections, byId };
}

import {
  buildEngineeringNarrative,
  buildFuelEconomyFaqAnswer,
  buildRideHandlingFaqAnswer,
  buildVehicleChangeNarrative,
} from './tire-comparison-section-copy';

export { buildFuelEconomyFaqAnswer, buildRideHandlingFaqAnswer } from './tire-comparison-section-copy';

/** Engineering narrative: why dimensions cause downstream effects (no spec-table repetition). */
export function synthesizeUnderstandingDifference(
  analysis: EngineeringAnalysis,
  sizeA: string,
  sizeB: string,
): string {
  return buildEngineeringNarrative(analysis, sizeA, sizeB);
}

/** Vehicle-level fitment narrative — what to verify on the car, not repeated measurements. */
export function synthesizeWhatChanges(
  analysis: EngineeringAnalysis,
  sizeA: string,
  sizeB: string,
): string {
  return buildVehicleChangeNarrative(analysis, sizeA, sizeB);
}

/** SEO upgrade recommendation headline and body from the recommendation section. */
export function synthesizeUpgradeRecommendation(
  analysis: EngineeringAnalysis,
): { headline: string; body: string } {
  const rec = analysis.byId.recommendation.body;
  const { fitmentScore, comparison, sizeA, sizeB, widthPct } = analysis.measurements;

  return {
    headline: upgradeHeadlineFromAnalysis(
      fitmentScore,
      comparison.diameterDiffPercent,
      widthPct,
      sizeA,
      sizeB,
    ),
    body: rec,
  };
}

/** "Who should choose" paragraph from category-aware recommendation engine. */
export function synthesizeWhoShouldChoose(
  analysis: EngineeringAnalysis,
  sizeA: string,
  sizeB: string,
): string {
  const m = analysis.measurements;
  const ctx = buildRecommendationContext(sizeA, sizeB, m.comparison, m.specsA, m.specsB, {
    fitmentScore: m.fitmentScore,
    unitSystem: m.unitSystem,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    indicatedSpeed: m.indicatedSpeed,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct,
  });
  return buildCategoryWhoShouldChoose(ctx);
}

/** Measurement-grounded personality card bullets — category-aware. */
export function buildEngineeringPersonalityBullets(
  analysis: EngineeringAnalysis,
): { sportier: string[]; comfort: string[]; offroad: string[] } {
  const m = analysis.measurements;
  const ctx = buildRecommendationContext(m.sizeA, m.sizeB, m.comparison, m.specsA, m.specsB, {
    fitmentScore: m.fitmentScore,
    unitSystem: m.unitSystem,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    indicatedSpeed: m.indicatedSpeed,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct,
  });
  return buildCategoryPersonalityBullets(ctx);
}

/** Performance card value labels derived from measurements — no generic "Improved". */
export function buildHandlingCardLabels(
  specsA: TireSpecs,
  specsB: TireSpecs,
): { value: string; status: string; explanation: string } {
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;

  if (nearZero(sidewallDiff, 0.05) && nearZero(widthDiffMm, 2)) {
    return {
      value: 'Minimal change',
      status: `Sidewall ${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}`,
      explanation: `Sidewall and width deltas are below measurable handling thresholds; response should remain similar to ${specsA.widthMm}/${specsA.aspectRatio}R${specsA.wheelDiameterIn}.`,
    };
  }

  if (sidewallDiff < -0.05) {
    return {
      value: `−${Math.abs(sidewallDiff).toFixed(2)}" sidewall`,
      status: `Aspect ${specsA.aspectRatio} → ${specsB.aspectRatio}`,
      explanation: `The ${fmtSigned(sidewallDiff, 2, '"')} sidewall reduction (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}) limits tread squirm under lateral load, which generally sharpens steering response on paved roads. The trade-off is a firmer ride over rough surfaces.`,
    };
  }

  if (sidewallDiff > 0.05) {
    return {
      value: `+${sidewallDiff.toFixed(2)}" sidewall`,
      status: `Aspect ${specsA.aspectRatio} → ${specsB.aspectRatio}`,
      explanation: `The ${fmtSigned(sidewallDiff, 2, '"')} taller sidewall (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}) allows more tread deflection under cornering load, which can feel softer in transitions. ${widthDiffMm > 2 ? `Width also grows ${fmtSigned(widthDiffMm, 0, ' mm')}, increasing contact-patch area and steering effort.` : ''}`,
    };
  }

  return {
    value: widthDiffMm > 0 ? `+${widthDiffMm} mm width` : `−${Math.abs(widthDiffMm)} mm width`,
    status: `Aspect Δ ${fmtSigned(aspectDiff, 0)}`,
    explanation: `Sidewall height is similar; the primary handling variable is section width changing ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}).`,
  };
}

/** Verdict benefit lines grounded in category-aware measurements. */
export function buildMeasuredBenefits(analysis: EngineeringAnalysis): string[] {
  const m = analysis.measurements;
  const ctx = buildRecommendationContext(m.sizeA, m.sizeB, m.comparison, m.specsA, m.specsB, {
    fitmentScore: m.fitmentScore,
    unitSystem: m.unitSystem,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    indicatedSpeed: m.indicatedSpeed,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct,
  });
  return buildCategoryBenefits(ctx);
}

/** Verdict consideration lines grounded in category-aware measurements. */
export function buildMeasuredConsiderations(analysis: EngineeringAnalysis): string[] {
  const m = analysis.measurements;
  const ctx = buildRecommendationContext(m.sizeA, m.sizeB, m.comparison, m.specsA, m.specsB, {
    fitmentScore: m.fitmentScore,
    unitSystem: m.unitSystem,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    indicatedSpeed: m.indicatedSpeed,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct,
  });
  return buildCategoryConsiderations(ctx);
}

