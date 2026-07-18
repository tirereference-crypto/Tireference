/**
 * Measurement-driven Real World Impact copy for comparisons and single-size views.
 *
 * Every description follows: measurement → engineering explanation → practical effect.
 */
import type { UnitSystem } from './calculator-types';
import type { TireComparison, TireSpecs } from './tire-math';
import {
  buildHandlingCardLabels,
  type EngineeringAnalysis,
} from './tire-comparison-engineering-analysis';
import { fmtInQuote, fmtPct, fmtSigned, isSidewallRideUnchanged, nearZero, SIDEWALL_CHANGE_PCT, sidewallPctFromSpecs } from './tire-comparison-format';
import {
  formatDimensionDiff,
  formatRevsDiff,
  rpmAtSpeed,
  speedUnitLabel,
} from './tire-comparison-units';

export interface ImpactCopyParts {
  measurement: string;
  engineering: string;
  practical: string;
}

export function formatImpactCopy({ measurement, engineering, practical }: ImpactCopyParts): string {
  return `${measurement} ${engineering} ${practical}`.replace(/\s+/g, ' ').trim();
}

function clearanceStatus(changeIn: number, unitSystem: UnitSystem): string {
  if (changeIn > 0) {
    return unitSystem === 'metric'
      ? `${(changeIn * 25.4).toFixed(1)} mm higher`
      : `${changeIn.toFixed(2)}" higher`;
  }
  if (changeIn < 0) {
    return unitSystem === 'metric'
      ? `${Math.abs(changeIn * 25.4).toFixed(1)} mm lower`
      : `${Math.abs(changeIn).toFixed(2)}" lower`;
  }
  return 'No change';
}

export function buildSpeedometerImpactCopy(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem,
): ImpactCopyParts {
  const indicated = comparison.speedometer.indicatedSpeed;
  const speedUnit = speedUnitLabel(unitSystem);
  const err = comparison.speedometer.errorPercent;
  const trueSpeed = comparison.speedometer.trueSpeed;
  const circA = unitSystem === 'metric' ? specsA.circumferenceMm : specsA.circumferenceIn;
  const circB = unitSystem === 'metric' ? specsB.circumferenceMm : specsB.circumferenceIn;
  const circUnit = unitSystem === 'metric' ? 'mm' : 'in';

  if (nearZero(err, 0.1)) {
    return {
      measurement: `Rolling circumference stays at ${circA.toFixed(unitSystem === 'metric' ? 0 : 2)} ${circUnit} on ${sizeA} versus ${circB.toFixed(unitSystem === 'metric' ? 0 : 2)} ${circUnit} on ${sizeB} (${fmtPct(comparison.diameterDiffPercent)} diameter).`,
      engineering: `The cluster is calibrated to revolutions per ${unitSystem === 'metric' ? 'kilometre' : 'mile'} (${specsA.revsPerMile.toFixed(1)} → ${specsB.revsPerMile.toFixed(1)}), so indicated speed tracks true road speed within ${Math.abs(err).toFixed(2)}%.`,
      practical: `At ${indicated} ${speedUnit} indicated, true speed is ${trueSpeed.toFixed(1)} ${speedUnit} — daily driving and typical enforcement margins stay unaffected.`,
    };
  }

  const readsLow = err > 0;
  return {
    measurement: `Circumference changes ${fmtSigned(comparison.circumferenceDiffIn, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}), from ${circA.toFixed(unitSystem === 'metric' ? 0 : 2)} to ${circB.toFixed(unitSystem === 'metric' ? 0 : 2)} ${circUnit} per revolution.`,
    engineering: `Revs per ${unitSystem === 'metric' ? 'km' : 'mile'} shift ${fmtSigned(comparison.revsPerMileDiff, 1)} (${fmtPct(comparison.revsPerMileDiffPercent)}), so the speedometer ${readsLow ? 'under-reports' : 'over-reports'} true speed by ${Math.abs(err).toFixed(2)}%.`,
    practical: `At ${indicated} ${speedUnit} indicated, you are actually traveling ${trueSpeed.toFixed(1)} ${speedUnit}${Math.abs(err) > 3 ? ' — recalibration may be needed for precise cruise control and navigation ETAs' : ' — within many OEM tolerance bands'}.`,
  };
}

export function buildRpmImpactCopy(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem,
  indicatedSpeed: number,
  rpmA: number,
  rpmB: number,
  rpmDelta: number,
): ImpactCopyParts {
  const speedUnit = speedUnitLabel(unitSystem);
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';
  const revsA = unitSystem === 'metric' ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === 'metric' ? specsB.revsPerKm : specsB.revsPerMile;

  if (nearZero(rpmDelta, 1) && nearZero(comparison.revsPerMileDiff, 0.5)) {
    return {
      measurement: `${revsLabel} remain ${revsA.toFixed(1)} on ${sizeA} and ${revsB.toFixed(1)} on ${sizeB}.`,
      engineering: `Rolling radius is unchanged (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}), so the drivetrain turns the same number of revolutions per ${unitSystem === 'metric' ? 'kilometre' : 'mile'}.`,
      practical: `Cruising RPM stays ${rpmA.toLocaleString()} at ${indicatedSpeed} ${speedUnit} — highway fuel load and engine noise should feel the same.`,
    };
  }

  const fewer = rpmDelta < 0;
  return {
    measurement: `At ${indicatedSpeed} ${speedUnit} indicated, engine speed moves from ${rpmA.toLocaleString()} to ${rpmB.toLocaleString()} RPM (${fmtSigned(rpmDelta, 0, ' RPM')}); ${revsLabel} change ${fmtSigned(revsB - revsA, unitSystem === 'metric' ? 1 : 0)} (${fmtPct(comparison.revsPerMileDiffPercent)}).`,
    engineering: `Each drive-wheel revolution covers ${unitSystem === 'metric' ? `${specsA.circumferenceMm.toFixed(0)} → ${specsB.circumferenceMm.toFixed(0)} mm` : `${fmtInQuote(specsA.circumferenceIn)} → ${fmtInQuote(specsB.circumferenceIn)}`} of road, acting like a ${fewer ? 'taller' : 'shorter'} effective gear ratio.`,
    practical: fewer
      ? `Lower cruising RPM reduces engine load at highway speed — a measurable driver of fuel economy — but throttle response can feel slightly softer from a stop.`
      : `Higher cruising RPM increases engine load at highway speed — often nudging fuel use up — while throttle response can feel more immediate.`,
  };
}

export function buildGroundClearanceImpactCopy(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ImpactCopyParts {
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const clearance = comparison.groundClearanceChangeIn;

  if (nearZero(clearance, 0.01)) {
    return {
      measurement: `Overall diameter is unchanged at ${fmtInQuote(specsA.overallDiameterIn)} on both ${sizeA} and ${sizeB}.`,
      engineering: `The half-diameter rule applies: with ${fmtSigned(diamDiff, 2, '"')} diameter change, static ride height shifts ${fmtSigned(clearance, 2, ' in')} at the axle centerline.`,
      practical: `Approach, departure, and break-over angles stay the same — obstacle clearance does not improve or worsen from diameter alone.`,
    };
  }

  const gain = clearance > 0;
  return {
    measurement: `Overall diameter ${gain ? 'increases' : 'decreases'} ${fmtSigned(diamDiff, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}), from ${fmtInQuote(specsA.overallDiameterIn)} to ${fmtInQuote(specsB.overallDiameterIn)}.`,
    engineering: `Static ground clearance at the lowest chassis point ${gain ? 'rises' : 'falls'} approximately ${fmtSigned(Math.abs(clearance), 2, ' in')} — half the ${fmtSigned(Math.abs(diamDiff), 2, '"')} diameter delta at each axle.`,
    practical: gain
      ? `Break-over angle improves because contact patches sit farther from the vehicle centerline, but verify the larger tire envelope clears the fender at full suspension compression.`
      : `Approach and departure angles tighten — confirm this trade-off against driveway ramps and trail obstacles before committing.`,
  };
}

export function buildRideComfortImpactCopy(
  sizeA: string,
  sizeB: string,
  _comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ImpactCopyParts {
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const sidewallDiffMm = specsB.sidewallMm - specsA.sidewallMm;
  const sidewallPct = sidewallPctFromSpecs(specsA, specsB);
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;

  if (isSidewallRideUnchanged(sidewallPct)) {
    return {
      measurement: `Sidewall height stays ${fmtInQuote(specsA.sidewallIn)} (${specsA.aspectRatio}-series aspect ratio) on both sizes — a ${Math.abs(sidewallDiffMm).toFixed(0)} mm difference.`,
      engineering: `Air-spring volume in the sidewall is essentially unchanged, so vertical deflection before the tread contacts the rim remains similar.`,
      practical: `With only a ${Math.abs(sidewallDiffMm).toFixed(0)} mm sidewall-height change, impact absorption over potholes and expansion joints should feel familiar to ${sizeA}.`,
    };
  }

  const taller = sidewallDiff > 0;
  return {
    measurement: `The sidewall ${taller ? 'increases' : 'decreases'} by ${Math.abs(sidewallDiffMm).toFixed(0)} mm (${fmtSigned(sidewallDiff, 2, '"')}; aspect ratio ${specsA.aspectRatio} → ${specsB.aspectRatio}, ${fmtSigned(aspectDiff, 0)} points).`,
    engineering: taller
      ? `That taller sidewall behaves like a larger air spring — more vertical deflection absorbs impact energy before it reaches the rim.`
      : `The shorter sidewall reduces vertical compliance — less air volume deflects under impact, so road texture transfers more directly to the suspension.`,
    practical: taller
      ? `Ride comfort generally improves over broken pavement, but steering can feel slightly less sharp under quick transitions.`
      : `Steering response on smooth pavement often feels crisper, but bumps and expansion joints transmit more harshness to the cabin.`,
  };
}

export function buildHandlingImpactCopy(
  sizeA: string,
  sizeB: string,
  _comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ImpactCopyParts {
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const sidewallDiffMm = specsB.sidewallMm - specsA.sidewallMm;
  const sidewallPct = sidewallPctFromSpecs(specsA, specsB);
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const widthPct = ((widthDiffMm) / specsA.widthMm) * 100;
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;

  if (isSidewallRideUnchanged(sidewallPct) && nearZero(widthDiffMm, 2)) {
    return {
      measurement: `Section width stays ${fmtInQuote(specsA.sectionWidthIn)} (${specsA.widthMm} mm) and sidewall stays ${fmtInQuote(specsA.sidewallIn)} between ${sizeA} and ${sizeB}.`,
      engineering: `Contact-patch width and sidewall flex under lateral load remain near the reference size.`,
      practical: `Steering effort, turn-in feel, and tramlining should stay familiar to ${sizeA}.`,
    };
  }

  const parts: string[] = [];
  if (!nearZero(widthDiffMm, 2)) {
    parts.push(
      `section width ${widthDiffMm > 0 ? 'grows' : 'narrows'} ${Math.abs(widthDiffMm).toFixed(0)} mm (${fmtPct(widthPct)}; ${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)})`,
    );
  }
  if (!isSidewallRideUnchanged(sidewallPct)) {
    parts.push(
      `sidewall ${sidewallDiff > 0 ? 'lengthens' : 'shortens'} ${Math.abs(sidewallDiffMm).toFixed(0)} mm (${fmtSigned(sidewallDiff, 2, '"')}; aspect ${specsA.aspectRatio} → ${specsB.aspectRatio})`,
    );
  }

  const engineering =
    sidewallPct <= -SIDEWALL_CHANGE_PCT.UNCHANGED
      ? `A shorter sidewall limits tread squirm under lateral load, which generally sharpens steering response on paved roads.`
      : sidewallPct >= SIDEWALL_CHANGE_PCT.UNCHANGED
        ? `A taller sidewall allows more tread deflection under cornering load, which can feel softer in transitions.`
        : `The primary handling variable is contact-patch width changing with section width.`;

  const practical =
    widthDiffMm > 5
      ? `Expect slightly higher steering effort at parking speeds and a wider contact patch under braking.`
      : widthDiffMm < -5
        ? `Steering effort typically lightens and the contact patch narrows — useful for winter sizing but with less dry grip.`
        : sidewallPct <= -SIDEWALL_CHANGE_PCT.UNCHANGED
          ? `Turn-in feels sharper on pavement; rough surfaces feel firmer.`
          : `Handling balance shifts modestly — confirm on your wheel offset and alignment settings.`;

  return {
    measurement: `Versus ${sizeA}, ${parts.join(' and ')}.`,
    engineering,
    practical,
  };
}

export function buildAccelerationImpactCopy(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem,
): ImpactCopyParts {
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';
  const revsA = unitSystem === 'metric' ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === 'metric' ? specsB.revsPerKm : specsB.revsPerMile;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;

  if (nearZero(comparison.diameterDiffPercent, 0.1)) {
    return {
      measurement: `Overall diameter is ${fmtInQuote(specsA.overallDiameterIn)} on both sizes (${fmtPct(comparison.diameterDiffPercent)} change).`,
      engineering: `${revsLabel} stay ${revsA.toFixed(1)} versus ${revsB.toFixed(1)} — the drivetrain covers the same road distance per wheel revolution.`,
      practical: `Throttle response from a stop and effective gearing feel unchanged versus ${sizeA}.`,
    };
  }

  const taller = diamDiff > 0;
  return {
    measurement: `Overall diameter ${taller ? 'increases' : 'decreases'} ${fmtSigned(diamDiff, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}); ${revsLabel} shift ${fmtSigned(revsB - revsA, unitSystem === 'metric' ? 1 : 0)} (${fmtPct(comparison.revsPerMileDiffPercent)}).`,
    engineering: taller
      ? `Each drive-wheel revolution covers more ground (${unitSystem === 'metric' ? `${specsA.circumferenceMm.toFixed(0)} → ${specsB.circumferenceMm.toFixed(0)} mm` : `${fmtInQuote(specsA.circumferenceIn)} → ${fmtInQuote(specsB.circumferenceIn)}`} circumference), acting like a taller effective gear ratio.`
      : `Each drive-wheel revolution covers less ground, acting like a shorter effective gear ratio — the engine turns more revolutions for the same road speed.`,
    practical: taller
      ? `Throttle response can feel slightly softer from a stop because each crankshaft revolution delivers more forward distance at the contact patch.`
      : `Throttle response can feel more immediate from a stop because each crankshaft revolution delivers less forward distance at the contact patch.`,
  };
}

export function buildFuelEconomyImpactCopy(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  unitSystem: UnitSystem,
): ImpactCopyParts {
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const widthPct = (widthDiffMm / specsA.widthMm) * 100;

  const revPart =
    Math.abs(comparison.revsPerMileDiffPercent) >= 0.5
      ? `${revsLabel} change ${fmtSigned(comparison.revsPerMileDiff, unitSystem === 'metric' ? 1 : 0)} (${fmtPct(comparison.revsPerMileDiffPercent)})`
      : `${revsLabel} stay within ${Math.abs(comparison.revsPerMileDiff).toFixed(1)} of ${sizeA}`;

  const widthPart =
    Math.abs(widthDiffMm) >= 3
      ? `section width shifts ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(widthPct)})`
      : `section width stays within ${Math.abs(widthDiffMm).toFixed(0)} mm of ${sizeA}`;

  return {
    measurement: `Versus ${sizeA}, ${revPart} and ${widthPart} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}).`,
    engineering: `Rolling circumference (${fmtSigned(comparison.circumferenceDiffIn, 2, '"')}, ${fmtPct(comparison.diameterDiffPercent)}) sets cruising RPM; tread width adds rolling resistance at a given pressure — compound and vehicle weight are outside this dimensional comparison.`,
    practical:
      comparison.revsPerMileDiff < -2
        ? `Lower highway RPM reduces engine load — the primary measurable driver of steady-state fuel use versus ${sizeA}.`
        : comparison.revsPerMileDiff > 2
          ? `Higher highway RPM increases engine load — steady-state fuel use often rises versus ${sizeA}.`
          : `With minimal revs/mile and width change, highway fuel economy should stay close to ${sizeA}.`,
  };
}

export interface RealWorldImpactCard {
  id: string;
  title: string;
  value: string;
  status: string;
  explanation: string;
  icon: string;
  subtitle?: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'warning';
  badgeStyle?: 'none' | 'dot' | 'diamond' | 'check';
  gaugeNeedle?: number;
}

/** Comparison page performance cards — derived from shared engineering analysis. */
export function buildComparisonPerformanceImpactCards(
  analysis: EngineeringAnalysis,
): RealWorldImpactCard[] {
  const m = analysis.measurements;
  const {
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
    indicatedSpeed,
    rpmA,
    rpmB,
    rpmDelta,
    speedUnit,
    trueSpeed,
    sidewallDiffIn,
    groundClearanceChangeIn,
    widthDiffMm,
    revsDiff,
  } = m;

  const speedoCopy = buildSpeedometerImpactCopy(sizeA, sizeB, comparison, specsA, specsB, unitSystem);
  const rpmCopy = buildRpmImpactCopy(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
    indicatedSpeed,
    rpmA,
    rpmB,
    rpmDelta,
  );
  const clearanceCopy = buildGroundClearanceImpactCopy(sizeA, sizeB, comparison, specsA, specsB);
  const comfortCopy = buildRideComfortImpactCopy(sizeA, sizeB, comparison, specsA, specsB);
  const handlingCopy = buildHandlingImpactCopy(sizeA, sizeB, comparison, specsA, specsB);
  const accelCopy = buildAccelerationImpactCopy(sizeA, sizeB, comparison, specsA, specsB, unitSystem);

  const handlingLabels = buildHandlingCardLabels(analysis);

  return [
    {
      id: 'speedo',
      title: 'Speedometer Error',
      value: fmtPct(comparison.speedometer.errorPercent),
      subtitle: `At ${indicatedSpeed} ${speedUnit}`,
      status: `True speed: ${trueSpeed.toFixed(1)} ${speedUnit} at ${indicatedSpeed} indicated`,
      explanation: formatImpactCopy(speedoCopy),
      icon: 'speedo',
      tone: m.absSpeedoPct <= 3 ? 'positive' : 'warning',
      gaugeNeedle: Math.min(100, Math.max(0, 50 + (comparison.speedometer.errorPercent / 5) * 50)),
    },
    {
      id: 'rpm',
      title: 'RPM Change',
      value: fmtSigned(rpmDelta, 0, ' RPM'),
      subtitle: `At ${indicatedSpeed} ${speedUnit}`,
      status: `${rpmB.toLocaleString()} RPM on ${sizeB} (${formatRevsDiff(revsDiff, unitSystem, specsA, specsB)} ${unitSystem === 'metric' ? 'revs/km' : 'revs/mi'})`,
      explanation: formatImpactCopy(rpmCopy),
      icon: 'rpm',
      tone: revsDiff > 0 ? 'negative' : revsDiff < 0 ? 'positive' : 'neutral',
      gaugeNeedle: Math.min(100, Math.max(0, 50 + (rpmDelta / 250) * 50)),
    },
    {
      id: 'clearance',
      title: 'Ground Clearance',
      value: formatDimensionDiff(groundClearanceChangeIn, unitSystem),
      status: clearanceStatus(groundClearanceChangeIn, unitSystem),
      explanation: formatImpactCopy(clearanceCopy),
      icon: 'clearance',
      tone: groundClearanceChangeIn > 0 ? 'positive' : groundClearanceChangeIn < 0 ? 'negative' : 'neutral',
    },
    {
      id: 'height',
      title: 'Ride Height Change',
      value: formatDimensionDiff(groundClearanceChangeIn, unitSystem),
      status: `Sidewall ${fmtSigned(sidewallDiffIn, 2, '"')} (${specsA.aspectRatio} → ${specsB.aspectRatio} aspect)`,
      explanation: formatImpactCopy(comfortCopy),
      icon: 'height',
      tone: groundClearanceChangeIn > 0 ? 'positive' : groundClearanceChangeIn < 0 ? 'negative' : 'neutral',
    },
    {
      id: 'handling',
      title: 'Handling Impact',
      value: handlingLabels.value,
      status: `${handlingLabels.status}${widthDiffMm !== 0 ? ` · ${fmtSigned(widthDiffMm, 0, ' mm')} width` : ''}`,
      explanation: formatImpactCopy(handlingCopy),
      icon: 'handling',
      tone: specsB.aspectRatio < specsA.aspectRatio - 2 ? 'positive' : 'neutral',
      badgeStyle: specsB.aspectRatio < specsA.aspectRatio - 2 ? 'check' : 'none',
    },
    {
      id: 'gearing',
      title: 'Gearing Effect',
      value:
        comparison.diameterDiffPercent > 0.2
          ? `+${comparison.diameterDiffPercent.toFixed(2)}% Dia`
          : comparison.diameterDiffPercent < -0.2
            ? `${comparison.diameterDiffPercent.toFixed(2)}% Dia`
            : 'Neutral',
      status:
        comparison.diameterDiffPercent > 0.2
          ? `${fmtSigned(-comparison.revsPerMileDiff, 0)} revs/mi · taller effective gearing`
          : comparison.diameterDiffPercent < -0.2
            ? `${fmtSigned(comparison.revsPerMileDiff, 0)} revs/mi · shorter effective gearing`
            : `Revs/mi within ${Math.abs(comparison.revsPerMileDiff).toFixed(0)} of ${sizeA}`,
      explanation: formatImpactCopy(accelCopy),
      icon: 'gearing',
      tone: comparison.diameterDiffPercent > 0.2 ? 'warning' : comparison.diameterDiffPercent < -0.2 ? 'positive' : 'neutral',
      badgeStyle: comparison.diameterDiffPercent > 0.2 || comparison.diameterDiffPercent < -0.2 ? 'diamond' : 'none',
    },
  ];
}

/** Single-size absolute impact copy (no reference tire). */
export function buildAbsoluteRideComfortCopy(specs: TireSpecs): ImpactCopyParts {
  return {
    measurement: `Sidewall height is ${fmtInQuote(specs.sidewallIn)} (${specs.sidewallMm.toFixed(0)} mm, ${specs.aspectRatio}% aspect on a ${specs.wheelDiameterIn}" wheel).`,
    engineering: `That air-spring volume deflects vertically before the tread contacts the rim — ${specs.aspectRatio >= 60 ? 'a taller profile with more compliance' : specs.aspectRatio <= 45 ? 'a shorter profile with less compliance' : 'a mid-profile balance'}.`,
    practical:
      specs.aspectRatio >= 60
        ? `Impact absorption over potholes and rough roads is generally strong; steering precision trades off slightly on paved surfaces.`
        : specs.aspectRatio <= 45
          ? `Road texture and sharp edges transfer more directly to the cabin; steering response on smooth pavement is typically sharper.`
          : `Daily comfort and steering response sit between touring and performance profiles.`,
  };
}

export function buildAbsoluteHandlingCopy(specs: TireSpecs): ImpactCopyParts {
  return {
    measurement: `Section width is ${fmtInQuote(specs.sectionWidthIn)} (${specs.widthMm} mm) with a ${fmtInQuote(specs.sidewallIn)} sidewall (${specs.aspectRatio}% aspect).`,
    engineering: `Contact-patch width and sidewall flex under lateral load scale with these dimensions — lower aspect ratios limit tread squirm; wider sections increase patch area.`,
    practical:
      specs.aspectRatio <= 45
        ? `Steering response on pavement is typically sharp; rough-road comfort is firmer.`
        : specs.aspectRatio >= 65
          ? `Turn-in feels softer with more sidewall flex; straight-line stability is often strong.`
          : `Handling feels balanced for mixed daily driving.`,
  };
}

export function buildAbsoluteFuelEconomyCopy(specs: TireSpecs): ImpactCopyParts {
  return {
    measurement: `Rolling ${specs.revsPerMile.toFixed(1)} revs/mile (${specs.revsPerKm.toFixed(1)} revs/km) at ${fmtInQuote(specs.overallDiameterIn)} overall diameter and ${fmtInQuote(specs.sectionWidthIn)} section width.`,
    engineering: `Each revolution covers ${fmtInQuote(specs.circumferenceIn)} of road; wider tread adds rolling resistance at a given inflation pressure.`,
    practical:
      specs.revsPerMile >= 680
        ? `Higher revs/mile typically raise cruising RPM and steady-state engine load versus larger-diameter alternatives.`
        : specs.revsPerMile <= 620
          ? `Lower revs/mile typically reduce cruising RPM — a measurable highway-efficiency advantage over smaller-diameter alternatives.`
          : `Cruising RPM and rolling resistance sit in a typical daily-driver range for this diameter class.`,
  };
}

export function buildAbsoluteGroundClearanceCopy(specs: TireSpecs): ImpactCopyParts {
  return {
    measurement: `Overall diameter is ${fmtInQuote(specs.overallDiameterIn)} (${specs.overallDiameterMm.toFixed(0)} mm).`,
    engineering: `Static ride height and axle-to-ground clearance scale with half the mounted diameter at each corner — tread depth and inflation also affect real mounted height.`,
    practical:
      specs.overallDiameterIn >= 33
        ? `Useful obstacle clearance for light trails when fitment allows; verify fender envelope at full compression.`
        : specs.overallDiameterIn >= 31
          ? `Moderate ride height for SUVs and crossovers without extreme lift requirements.`
          : `Passenger-car ride height — limited clearance gain versus truck and off-road sizing.`,
  };
}

export function buildAbsoluteAccelerationCopy(specs: TireSpecs): ImpactCopyParts {
  return {
    measurement: `Rolling radius ${fmtInQuote(specs.overallDiameterIn / 2)} (half of ${fmtInQuote(specs.overallDiameterIn)} diameter) with ${specs.revsPerMile.toFixed(1)} revs/mile.`,
    engineering: `Each drive-wheel revolution covers ${fmtInQuote(specs.circumferenceIn)} — this sets effective gearing together with your axle ratio and transmission.`,
    practical:
      specs.revsPerMile >= 680
        ? `Throttle response from a stop tends to feel immediate because each revolution covers less ground.`
        : specs.revsPerMile <= 620
          ? `Throttle response can feel softer from a stop because each revolution covers more ground.`
          : `Acceleration feel aligns with typical OEM sizing in this diameter class.`,
  };
}
