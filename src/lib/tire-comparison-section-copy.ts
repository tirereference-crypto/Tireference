/**
 * Role-based comparison page copy — each section has a distinct purpose:
 *
 * Summary (chips/KPI/specs) → numbers live here only
 * Engineering narrative → why dimensions cause downstream effects
 * Performance impact → driving consequences (tire-real-world-impact)
 * Verdict → recommendation and decision
 * FAQ → procedural questions not answered above
 */
import type {
  ComparisonDataSourceSummary,
  ComparisonSourceMode,
  PublishedTireMeasurements,
} from './comparison-data-sources';
import { resolveComparisonDataSources } from './comparison-data-sources';
import type { EngineeringAnalysis } from './tire-comparison-engineering-analysis';
import {
  buildComparisonPairRelationships,
} from './comparison-pair-relationships';
import { FITMENT_DIAMETER_PCT } from './tire-comparison-fitment';

import {
  fmtInQuote,
  fmtPct,
  fmtSigned,
  isSidewallRideUnchanged,
  nearZero,
  sidewallRideTier,
} from './tire-comparison-format';

/** Engineering narrative: causal relationships without repeating spec-table numbers. */
export function buildEngineeringNarrative(
  analysis: EngineeringAnalysis,
  sizeA: string,
  sizeB: string,
): string {
  const { specsA, specsB, diamDiffIn, sidewallPct, widthDiffMm, sidewallDiffIn } = analysis.measurements;

  const parts: string[] = [
    `Moving from ${sizeA} to ${sizeB} changes three independent geometric variables that compound on the vehicle. The summary bar and spec table quantify those deltas; this section explains the mechanical relationships behind them.`,
  ];

  if (nearZero(diamDiffIn, 0.05)) {
    parts.push(
      `Overall diameter stays effectively matched, so rolling circumference — and everything tied to it — should track the factory tire closely. Speedometer calibration, revolutions per distance, static ride height at the axle, and effective final-drive ratio all scale with circumference rather than tread width or sidewall height.`,
    );
  } else if (diamDiffIn > 0) {
    parts.push(
      `The larger overall diameter lengthens rolling circumference. That single change simultaneously raises static ride height under the axle centerline, slows wheel revolutions for a given road speed, and shifts speedometer and odometer readings because the cluster assumes the factory tire covers less ground per revolution. Effective gearing also lengthens — the drivetrain turns fewer times per mile, which typically drops cruising engine speed but can soften throttle response from a stop.`,
    );
  } else {
    parts.push(
      `The smaller overall diameter shortens rolling circumference, which lowers static ride height, increases revolutions per distance at the same road speed, and can make the speedometer read high relative to true speed. Shorter effective gearing usually sharpens throttle response while raising cruising RPM and engine load at highway speed.`,
    );
  }

  if (isSidewallRideUnchanged(sidewallPct)) {
    parts.push(
      `Sidewall height is essentially unchanged between these sizes (${fmtPct(sidewallPct)}). Because sidewall volume acts as an air spring between rim and tread, ride compliance and sidewall flex under cornering loads should feel similar even if diameter or width shifted.`,
    );
  } else if (sidewallDiffIn > 0) {
    parts.push(
      `Sidewall height increases independently of overall diameter. A taller sidewall carries more air volume between bead and tread, allowing greater vertical deflection over potholes and expansion joints before impact energy reaches the rim. Under lateral load the taller sidewall also permits more tread movement, which can feel softer during turn-in even when contact patch width is unchanged.`,
    );
  } else {
    parts.push(
      `The sidewall shortens relative to the reference tire. Less air volume between bead and tread means less vertical compliance — road texture and sharp impacts transfer more directly to the suspension. The shorter sidewall limits tread squirm under lateral load, which generally firms steering response on smooth pavement at the cost of a harsher ride over broken surfaces.`,
    );
  }

  if (nearZero(widthDiffMm, 2)) {
    parts.push(
      `Section width is nearly unchanged, so contact-patch area, steering effort at full lock, and tramlining susceptibility should remain familiar.`,
    );
  } else if (widthDiffMm > 0) {
    parts.push(
      `Section width grows, widening the contact patch and increasing the scrub radius at full steering lock. That typically adds steering effort and can make the tire more sensitive to road crown and groove tracking, even when diameter and sidewall height are held constant.`,
    );
  } else {
    parts.push(
      `Section width narrows, reducing contact-patch area and usually lowering steering effort. The narrower footprint can reduce rolling resistance slightly but also reduces dry-surface grip margin.`,
    );
  }

  parts.push(
    `Diameter and width together define the tire envelope — the three-dimensional space the assembly occupies as the suspension cycles and the steering rack reaches full lock. A change in one dimension without the other still alters clearance to the fender lip, inner liner, strut tower, and pinch weld. Wheel offset positions that envelope laterally; a tire that fits on paper can still rub if backspacing pushes the sidewall inward toward the spring perch.`,
  );

  return parts.join(' ');
}

/** Vehicle-level change narrative: fitment process, not repeated measurements. */
export function buildVehicleChangeNarrative(
  analysis: EngineeringAnalysis,
  sizeA: string,
  sizeB: string,
): string {
  const { specsA, specsB, comparison, absDiamPct, widthDiffMm } = analysis.measurements;
  const sameWheel = specsB.wheelDiameterIn === specsA.wheelDiameterIn;
  const largeStep = absDiamPct > 3 || Math.abs(widthDiffMm) > 10;

  return [
    `Switching from ${sizeA} to ${sizeB} changes more than the numbers in the spec table — it changes how the tire package moves inside your wheel well under real suspension travel.`,
    largeStep
      ? `This is a substantial dimensional step. Before buying, cycle the suspension through full compression and full droop, turn the steering to lock in both directions, and inspect the inner fender liner, pinch weld, and control-arm clearance at each corner. Budget time for trimming, revised offset, or ride-height adjustment if contact is found during mock-fit.`
      : `The dimensional shift is moderate for many factory wheel wells, but clearance is never guaranteed from tire math alone. Verify at full steering lock and under maximum suspension compression on your exact vehicle — especially if ride height has changed from stock.`,
    sameWheel
      ? `Both sizes mount on the same wheel diameter, so existing rims may work if barrel width and offset match the new section width. Confirm load index, speed rating, and TPMS compatibility before reusing factory wheels.`
      : `These sizes require different wheel diameters — plan on a complete wheel set matched to the new bead seat, hub bore, and brake clearance geometry, not just new rubber.`,
    `After installation, plan a mixed driving relearn cycle so ABS and stability-control modules establish fresh wheel-speed baselines. If indicated speed drifts beyond your comfort band, investigate recalibration options before relying on cruise control or navigation ETA logic long-term.`,
  ].join(' ');
}

/** Single merged explanation — engineering cause + vehicle fitment process, no duplicate sections. */
export function buildWhatThisChangeMeans(
  analysis: EngineeringAnalysis,
  sizeA: string,
  sizeB: string,
): string {
  return [
    buildEngineeringNarrative(analysis, sizeA, sizeB),
    buildVehicleChangeNarrative(analysis, sizeA, sizeB),
  ].join(' ');
}

/** FAQ: fuel economy — RPM and revs deltas from shared measurements. */
export function buildFuelEconomyFaqAnswer(analysis: EngineeringAnalysis): string {
  const {
    sizeA,
    specsA,
    comparison,
    unitSystem,
    indicatedSpeed,
    speedUnit,
    rpmA,
    rpmB,
    rpmDelta,
    revsDiff,
    revsDiffPct,
    widthDiffMm,
    widthPct,
  } = analysis.measurements;
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';

  return [
    `Rolling circumference changes ${fmtSigned(comparison.circumferenceDiffIn, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}), shifting ${revsLabel} by ${fmtSigned(revsDiff, unitSystem === 'metric' ? 1 : 0)} (${fmtPct(revsDiffPct)}).`,
    `At ${indicatedSpeed} ${speedUnit} indicated, engine speed moves ${rpmA.toLocaleString()} → ${rpmB.toLocaleString()} RPM (${fmtSigned(rpmDelta, 0, ' RPM')}) — the primary highway fuel load variable when comparing ${sizeA} to this size.`,
    nearZero(widthDiffMm, 2)
      ? `Section width stays at ${specsA.widthMm} mm, so tread-width rolling resistance should track ${sizeA} closely at the same inflation pressure.`
      : `Section width shifts ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(widthPct)}), changing tread contact area and rolling resistance independently of the ${fmtPct(revsDiffPct)} ${revsLabel} change.`,
  ].join(' ');
}

/** FAQ: ride/handling — sidewall, width, diameter, and RPM from shared measurements. */
export function buildRideHandlingFaqAnswer(analysis: EngineeringAnalysis): string {
  const {
    specsA,
    specsB,
    sizeA,
    sizeB,
    comparison,
    sidewallPct,
    sidewallDiffIn,
    widthDiffMm,
    widthPct,
    diamDiffIn,
    groundClearanceChangeIn,
    rpmA,
    rpmB,
    rpmDelta,
    indicatedSpeed,
    speedUnit,
  } = analysis.measurements;
  const tier = sidewallRideTier(sidewallPct);

  let sidewallPart: string;
  if (tier === 'unchanged') {
    sidewallPart = `Sidewall height stays ${fmtInQuote(specsA.sidewallIn)} on both sizes (${fmtPct(sidewallPct)}), so vertical compliance and sidewall flex under cornering load should match ${sizeA}.`;
  } else if (tier === 'noticeable') {
    sidewallPart =
      sidewallPct > 0
        ? `Sidewall grows ${fmtSigned(sidewallDiffIn, 2, '"')} (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}, ${fmtPct(sidewallPct)}), adding air-spring volume for bump absorption while allowing more tread movement in transitions.`
        : `Sidewall shortens ${fmtSigned(sidewallDiffIn, 2, '"')} (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}, ${fmtPct(sidewallPct)}), reducing vertical compliance and limiting tread squirm under lateral load.`;
  } else {
    sidewallPart =
      sidewallPct > 0
        ? `Sidewall increases ${fmtSigned(sidewallDiffIn, 2, '"')} (${fmtPct(sidewallPct)}), a large air-volume change that noticeably softens impact absorption versus ${fmtInQuote(specsA.sidewallIn)} on ${sizeA}.`
        : `Sidewall drops ${fmtSigned(Math.abs(sidewallDiffIn), 2, '"')} (${fmtPct(sidewallPct)}), sharply reducing sidewall deflection compared with ${fmtInQuote(specsA.sidewallIn)} on ${sizeA}.`;
  }

  const widthPart = nearZero(widthDiffMm, 2)
    ? `Section width is unchanged at ${specsA.widthMm} mm (${fmtInQuote(specsA.sectionWidthIn)}), so contact-patch width and parking-lot steering effort should stay near ${sizeA}.`
    : `Section width shifts ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(widthPct)}; ${specsA.widthMm} → ${specsB.widthMm} mm), changing scrub radius and steering effort at full lock.`;

  const diamPart = nearZero(diamDiffIn, 0.05)
    ? `Overall diameter stays ${fmtInQuote(specsA.overallDiameterIn)}, so ride height at the axle and effective gearing remain aligned with ${sizeA}.`
    : `Overall diameter changes ${fmtSigned(diamDiffIn, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}), moving static clearance ${fmtSigned(groundClearanceChangeIn, 2, ' in')} at the axle centerline.`;

  const rpmPart =
    Math.abs(rpmDelta) >= 5
      ? `At ${indicatedSpeed} ${speedUnit} indicated, cruising RPM shifts ${rpmA.toLocaleString()} → ${rpmB.toLocaleString()} (${fmtSigned(rpmDelta, 0, ' RPM')}), which changes engine load during steady highway driving.`
      : `Cruising RPM stays within ${Math.abs(rpmDelta)} RPM of ${sizeA} at ${indicatedSpeed} ${speedUnit} indicated, so highway engine load should feel similar.`;

  return [sidewallPart, widthPart, diamPart, rpmPart].join(' ');
}

function sourceModeSentence(
  mode: ComparisonSourceMode,
  sizeA: string,
  sizeB: string,
  publishedA: PublishedTireMeasurements | null,
  publishedB: PublishedTireMeasurements | null,
): string {
  if (mode === 'model_vs_model' && publishedA && publishedB) {
    return `This page has published catalog rows for both ${sizeA} (${publishedA.brand} ${publishedA.model}) and ${sizeB} (${publishedB.brand} ${publishedB.model}); headline diameter and speedometer deltas still use nominal geometry, while published fields appear in dedicated table rows.`;
  }
  if (mode === 'mixed_source') {
    const which =
      publishedA && !publishedB
        ? `${sizeA} has manufacturer-published fields while ${sizeB} is formula-only`
        : publishedB && !publishedA
          ? `${sizeB} has manufacturer-published fields while ${sizeA} is formula-only`
          : `published fields are available for only one side of ${sizeA} vs ${sizeB}`;
    return `This is a mixed-source comparison: ${which}. Do not mix a published diameter on one tire with a nominal diameter on the other when judging absolute height.`;
  }
  return `This comparison is running on nominal size-code calculations for both ${sizeA} and ${sizeB}. Prefer manufacturer-published overall diameter and revs/mile when you have selected a specific tire model.`;
}

function rimRangeSnippet(
  publishedA: PublishedTireMeasurements | null,
  publishedB: PublishedTireMeasurements | null,
  sizeA: string,
  sizeB: string,
): string {
  const a = publishedA?.approvedRimRange?.trim() || null;
  const b = publishedB?.approvedRimRange?.trim() || null;
  if (a && b) {
    return `Published approved rim-width ranges in the dataset are ${a} for ${sizeA} and ${b} for ${sizeB}.`;
  }
  if (a) return `Published approved rim-width range for ${sizeA} is ${a}; no approved rim range is listed for ${sizeB} in this dataset.`;
  if (b) return `Published approved rim-width range for ${sizeB} is ${b}; no approved rim range is listed for ${sizeA} in this dataset.`;
  return `No approved rim-width range is listed for either size in this dataset, so rim fit must be confirmed from the specific tire maker’s documentation.`;
}

function loadSpeedSnippet(
  publishedA: PublishedTireMeasurements | null,
  publishedB: PublishedTireMeasurements | null,
): string {
  const parts: string[] = [];
  if (publishedA?.loadIndex || publishedB?.loadIndex) {
    parts.push(
      `Load index ${publishedA?.loadIndex ?? '—'} → ${publishedB?.loadIndex ?? '—'}`,
    );
  }
  if (publishedA?.speedRating || publishedB?.speedRating) {
    parts.push(
      `speed rating ${publishedA?.speedRating ?? '—'} → ${publishedB?.speedRating ?? '—'}`,
    );
  }
  if (parts.length === 0) {
    return 'Load index and speed rating are not populated for both sizes in this dataset.';
  }
  return `${parts.join('; ')}. Treat those fields as product-specific when present — they are not encoded in the bare metric size string.`;
}

/**
 * Expert FAQ set for the comparison calculator.
 * Primary questions (first 8) show by default; remaining are behind “Show more questions”.
 * Every answer cites calculated values from this pair so pages stay non-duplicative.
 */
export function buildComparisonFaqs(
  sizeA: string,
  sizeB: string,
  analysis: EngineeringAnalysis,
  dataSources?: ComparisonDataSourceSummary | null,
): Array<{ question: string; answer: string }> {
  const {
    specsA,
    specsB,
    comparison,
    diamDiffIn,
    widthDiffMm,
    widthPct,
    sidewallDiffIn,
    sidewallPct,
    groundClearanceChangeIn,
    wheelDelta,
    indicatedSpeed,
    trueSpeed,
    speedUnit,
    revsDiff,
    revsDiffPct,
    unitSystem,
  } = analysis.measurements;

  const sources =
    dataSources ??
    resolveComparisonDataSources({
      sizeA,
      sizeB,
    });
  const { mode, publishedA, publishedB } = sources;
  const relationship = buildComparisonPairRelationships(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
  );
  const sameWheel = wheelDelta === 0;
  const larger = diamDiffIn > 0.05;
  const smaller = diamDiffIn < -0.05;
  const revsLabel = unitSystem === 'metric' ? 'revs/km' : 'revs/mi';
  const hasFlotation = specsA.type === 'flotation' || specsB.type === 'flotation';
  const dimensionsExample = hasFlotation
    ? `Applied here: ${sizeA} resolves to ${fmtInQuote(specsA.overallDiameterIn)} overall diameter and ${specsA.widthMm} mm nominal section width on a ${specsA.wheelDiameterIn}" wheel; ${sizeB} resolves to ${fmtInQuote(specsB.overallDiameterIn)} overall diameter and ${specsB.widthMm} mm width on a ${specsB.wheelDiameterIn}" wheel.`
    : `Applied here: ${sizeA} uses ${specsA.widthMm} mm width and aspect ratio ${Math.round(specsA.aspectRatio)} on a ${specsA.wheelDiameterIn}" wheel → ${fmtInQuote(specsA.sidewallIn)} sidewall and ${fmtInQuote(specsA.overallDiameterIn)} overall diameter; ${sizeB} works out to ${fmtInQuote(specsB.sidewallIn)} sidewall and ${fmtInQuote(specsB.overallDiameterIn)} overall diameter.`;
  const flotationNote = hasFlotation
    ? ` At least one size uses flotation notation, where overall diameter and width are stated more directly than a metric aspect-ratio code; published catalog dimensions can still differ from those stated values.`
    : '';

  const primary: Array<{ question: string; answer: string }> = [
    {
      question: 'Does this comparison confirm vehicle fitment?',
      answer: [
        `No. It performs a dimensional comparison of ${sizeA} and ${sizeB}, not a complete vehicle fitment analysis.`,
        `Confirmed fitment still needs model year, trim, factory tire specification, wheel width, offset, bolt pattern, hub bore, brake clearance, suspension and fender clearance, plus load and speed-rating requirements.`,
        `What this tool can quantify from size (and published catalog fields when present): diameter difference (${fmtPct(comparison.diameterDiffPercent)}), width difference (${fmtSigned(widthDiffMm, 0, ' mm')}), and wheel diameter requirement (${specsA.wheelDiameterIn}" → ${specsB.wheelDiameterIn}").`,
        rimRangeSnippet(publishedA, publishedB, sizeA, sizeB),
        loadSpeedSnippet(publishedA, publishedB),
        `A diameter change within ±${FITMENT_DIAMETER_PCT.pass}% is only a common screening guideline — not a fitment guarantee for any specific vehicle.`,
      ].join('\n\n'),
    },
    {
      question: 'How accurate are the comparison results?',
      answer: [
        `Nominal tire dimensions for ${sizeA} and ${sizeB} are calculated from the tire-size code using standard geometric relationships, so the arithmetic for those nominal values is exact.`,
        `Real mounted tires can still differ because of tread design, approved measuring rim, inflation, load, remaining tread depth and casing construction.`,
        `For this pair, overall diameter moves ${fmtPct(comparison.diameterDiffPercent)} (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}) and section width moves ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(widthPct)}).`,
        sourceModeSentence(mode, sizeA, sizeB, publishedA, publishedB),
        `Speedometer and gearing figures are theoretical: they assume the indicated speed is based on the original rolling circumference with no cluster recalibration.`,
      ].join('\n\n'),
    },
    {
      question: 'How are tire dimensions calculated?',
      answer: [
        `For metric sizes, sidewall height equals section width × (aspect ratio ÷ 100), wheel diameter is converted with 1 in = 25.4 mm, and overall diameter equals wheel diameter plus two sidewalls.`,
        `Circumference is π × overall diameter, and revolutions per mile equal inches per mile divided by that circumference.`,
        dimensionsExample,
        `The width code is nominal section width, not tread width, and the aspect ratio is a percentage of that section width.${flotationNote}`,
      ].join('\n\n'),
    },
    {
      question: 'Will the speedometer be affected?',
      answer: [
        larger
          ? `Yes — the larger rolling circumference on ${sizeB} travels farther per wheel revolution, so at a given indicated speed the vehicle typically moves slightly faster than the cluster shows.`
          : smaller
            ? `Yes — the smaller rolling circumference on ${sizeB} travels less distance per revolution, so at a given indicated speed the vehicle typically moves slightly slower than the cluster shows.`
            : `Only slightly for this pair: overall diameter and circumference stay nearly the same between ${sizeA} and ${sizeB}.`,
        `Circumference changes ${fmtSigned(comparison.circumferenceDiffIn, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}), which is the same percentage order as the diameter change for this geometric model.`,
        `At an indicated ${indicatedSpeed} ${speedUnit}, the theoretical road speed is approximately ${trueSpeed.toFixed(1)} ${speedUnit} (${fmtPct(comparison.speedometer.errorPercent)} versus ${sizeA}).`,
        `Actual cluster behaviour can still differ after tire wear, load, temperature or any OEM speedometer calibration.`,
      ].join('\n\n'),
    },
    {
      question: 'Do I need new wheels?',
      answer: sameWheel
        ? [
            `Not because of wheel diameter: ${sizeA} and ${sizeB} both specify a ${specsA.wheelDiameterIn}" bead seat, so the size codes alone do not force a diameter change.`,
            `That still does not mean your existing wheel is automatically compatible. The rim width must fall inside the tire maker’s approved range for the specific product, and offset, bolt pattern, hub bore, brake clearance and load rating remain vehicle- and wheel-specific.`,
            rimRangeSnippet(publishedA, publishedB, sizeA, sizeB),
          ].join('\n\n')
        : [
            `Yes for bead-seat diameter: ${sizeA} is an R${specsA.wheelDiameterIn} tire and ${sizeB} is an R${specsB.wheelDiameterIn} tire (${fmtSigned(wheelDelta, 0, '"')} wheel change). An R${specsA.wheelDiameterIn} tire will not correctly seat on an R${specsB.wheelDiameterIn} wheel.`,
            `Plan a ${specsB.wheelDiameterIn}" wheel with appropriate width for ${specsB.widthMm} mm section width, then confirm offset, bolt pattern, hub bore, brake clearance and load rating on the target vehicle.`,
            rimRangeSnippet(publishedA, publishedB, sizeA, sizeB),
          ].join('\n\n'),
    },
    {
      question: 'Can different tire sizes use the same wheel?',
      answer: [
        `Only when wheel diameter matches, the rim width sits in the approved range for both tires, load and speed requirements are met, and the bead-seat type is compatible.`,
        sameWheel
          ? `${sizeA} and ${sizeB} share a ${specsA.wheelDiameterIn}" wheel diameter, so the same wheel diameter is geometrically possible — but section width still differs by ${fmtSigned(widthDiffMm, 0, ' mm')} (${fmtPct(widthPct)}), so rim width must still be checked.`
          : `${sizeA} (R${specsA.wheelDiameterIn}) and ${sizeB} (R${specsB.wheelDiameterIn}) cannot use the same wheel diameter; an R${specsA.wheelDiameterIn} tire and an R${specsB.wheelDiameterIn} tire do not share a bead seat.`,
        `A wider tire does not automatically require a wider wheel, but mounting outside the published rim range can distort the tread profile and change handling and load behaviour.`,
        rimRangeSnippet(publishedA, publishedB, sizeA, sizeB),
      ].join('\n\n'),
    },
    {
      question: 'How much clearance should I check?',
      answer: [
        `Clearance must be checked through the suspension and steering travel, not only when the vehicle is parked on level ground.`,
        `Inspect full steering lock, suspension compression, inner sidewall to strut or control arm, outer shoulder to fender or liner, brake and wheel-barrel clearance, and tire growth/deflection under load — plus any wheel offset or width change.`,
        `For this pair, half the overall diameter change approximates the static radius or ground-clearance shift: about ${fmtSigned(groundClearanceChangeIn, 2, ' in')} from the ${fmtPct(comparison.diameterDiffPercent)} diameter move (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
        `Width change (${fmtSigned(widthDiffMm, 0, ' mm')}) spreads around the wheel centreline only when wheel width and offset stay unchanged; a different offset moves the whole package inward or outward.`,
      ].join('\n\n'),
    },
    {
      question: 'Can I mix tire sizes front and rear?',
      answer: [
        `Only when the vehicle manufacturer approves a staggered or mixed setup — do not create one casually from a comparison tool.`,
        `Mixing ${sizeA} and ${sizeB} across axles would put roughly ${fmtPct(comparison.diameterDiffPercent)} (${fmtSigned(diamDiffIn, 2, '"')}) of rolling-circumference difference between front and rear if one size sat on one axle and the other on the opposite axle.`,
        `ABS, stability control and especially AWD/4WD systems can be sensitive to axle circumference mismatch; transfer-case and differential hardware may see extra stress, and tire rotation patterns become limited.`,
        `Follow the placard or OEM staggered specification. There is no universal “safe” percentage that applies to every drivetrain.`,
      ].join('\n\n'),
    },
  ];

  const secondary: Array<{ question: string; answer: string }> = [
    {
      question: 'Why do actual tire dimensions differ between brands?',
      answer: [
        `Two products sharing the ${sizeA} or ${sizeB} size code can still publish different overall diameters and revolutions per mile.`,
        `Measuring rim width, tread pattern, sidewall and casing construction, rated load and pressure, manufacturing tolerances, and new-versus-worn tread all shift the measured envelope.`,
        `Use the size-code geometry on this page for planning, then prefer the manufacturer’s published diameter and ${revsLabel} for the exact model you intend to buy.`,
      ].join('\n\n'),
    },
    {
      question: 'What is the difference between nominal and published tire dimensions?',
      answer: [
        `Nominal values come from the tire-size formula applied to the size code — for example ${fmtInQuote(specsA.overallDiameterIn)} overall diameter on ${sizeA} and ${fmtInQuote(specsB.overallDiameterIn)} on ${sizeB}.`,
        `Published values come from physical measurement or manufacturer specifications for a specific brand and model, and can differ from that formula result.`,
        `Nominal figures are useful for generic size-to-size comparison; published figures are preferred for exact model-to-model analysis.`,
        sourceModeSentence(mode, sizeA, sizeB, publishedA, publishedB),
      ].join('\n\n'),
    },
    {
      question: 'How does tire size affect effective gearing?',
      answer: [
        larger
          ? `A larger rolling diameter on ${sizeB} produces taller effective gearing: fewer wheel revolutions per road mile and usually a small drop in engine RPM at a given true road speed.`
          : smaller
            ? `A smaller rolling diameter on ${sizeB} produces shorter effective gearing: more wheel revolutions per road mile and usually a small rise in engine RPM at a given true road speed.`
            : `Rolling diameter is nearly matched between ${sizeA} and ${sizeB}, so effective gearing should stay close.`,
        `${revsLabel} moves ${fmtSigned(revsDiff, unitSystem === 'metric' ? 1 : 0)} (${fmtPct(revsDiffPct)}). At ${indicatedSpeed} ${speedUnit} indicated, theoretical engine speed shifts with that circumference change — exact RPM also depends on final-drive ratio and transmission gear.`,
        `Acceleration response can feel slightly softer with taller gearing or sharper with shorter gearing; treat those effects as directional rather than certain for every powertrain.`,
      ].join('\n\n'),
    },
    {
      question: 'Why does sidewall height matter?',
      answer: [
        `Sidewall height sets how much vertical rubber is available to deflect under load.`,
        `For this pair sidewall changes ${fmtSigned(sidewallDiffIn, 2, '"')} (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}, ${fmtPct(sidewallPct)}). Lower sidewalls generally reduce flex; taller sidewalls generally add compliance.`,
        `Construction, inflation pressure, load and tread design still matter — sidewall height alone does not determine handling or comfort.`,
      ].join('\n\n'),
    },
  ];

  if (relationship.awdCaution) {
    secondary.push({
      question: 'Is this diameter difference significant for AWD or 4WD use?',
      answer: `Yes. The ${fmtPct(
        comparison.diameterDiffPercent,
      )} nominal diameter difference is outside the site’s ±${
        FITMENT_DIAMETER_PCT.pass
      }% comparison threshold. Do not mix these sizes across driven axles unless the vehicle manufacturer specifies the combination.`,
    });
  }

  if (mode !== 'generic_vs_generic' || publishedA || publishedB) {
    secondary.push({
      question: 'Are published product measurements available for this pair?',
      answer: `${sourceModeSentence(mode, sizeA, sizeB, publishedA, publishedB)} ${loadSpeedSnippet(
        publishedA,
        publishedB,
      )}`,
    });
  }

  return [...primary, ...secondary];
}

/** Things-to-consider bullets — each line signed from B minus A (current → new). */
export function buildFitmentConsiderations(analysis: EngineeringAnalysis): string[] {
  const {
    sizeA,
    sizeB,
    specsA,
    specsB,
    comparison,
    diamDiffIn,
    widthDiffMm,
    sidewallDiffIn,
    sidewallPct,
    groundClearanceChangeIn,
    absDiamPct,
    absWidthPct,
  } = analysis.measurements;

  const items: string[] = [];

  if (nearZero(diamDiffIn, 0.05)) {
    items.push(
      `Ground clearance unchanged — ${specsA.overallDiameterIn.toFixed(2)} in overall diameter on both sizes`,
    );
  } else if (diamDiffIn > 0) {
    items.push(
      `More ground clearance — +${groundClearanceChangeIn.toFixed(2)} in at the axle from +${diamDiffIn.toFixed(2)} in overall diameter (${specsA.overallDiameterIn.toFixed(2)} → ${specsB.overallDiameterIn.toFixed(2)} in)`,
    );
  } else {
    items.push(
      `Less ground clearance — ${fmtSigned(groundClearanceChangeIn, 2, ' in')} at the axle from ${fmtSigned(diamDiffIn, 2, '"')} overall diameter (${specsA.overallDiameterIn.toFixed(2)} → ${specsB.overallDiameterIn.toFixed(2)} in)`,
    );
  }

  if (nearZero(widthDiffMm, 2)) {
    items.push(`Contact patch unchanged — section width stays at ${specsA.widthMm} mm`);
  } else if (widthDiffMm > 0) {
    items.push(
      `Larger contact patch — +${widthDiffMm} mm section width (${specsA.widthMm} → ${specsB.widthMm} mm)`,
    );
  } else {
    items.push(
      `Smaller contact patch — ${widthDiffMm} mm section width (${specsA.widthMm} → ${specsB.widthMm} mm)`,
    );
  }

  if (isSidewallRideUnchanged(sidewallPct)) {
    items.push(`Sidewall height unchanged — ${specsA.sidewallIn.toFixed(2)} in on both sizes (${fmtPct(sidewallPct)})`);
  } else if (sidewallDiffIn > 0) {
    items.push(
      `Taller sidewall — +${sidewallDiffIn.toFixed(2)} in (${specsA.sidewallIn.toFixed(2)} → ${specsB.sidewallIn.toFixed(2)} in) adds compliance`,
    );
  } else {
    items.push(
      `Shorter sidewall — ${fmtSigned(sidewallDiffIn, 2, ' in')} (${specsA.sidewallIn.toFixed(2)} → ${specsB.sidewallIn.toFixed(2)} in) firms ride response`,
    );
  }

  const envelopeLarger =
    diamDiffIn > 0.05 || widthDiffMm > 3 || sidewallDiffIn > 0.05;
  const envelopeSmaller =
    diamDiffIn < -0.05 || widthDiffMm < -3 || sidewallDiffIn < -0.05;

  if (envelopeLarger && !envelopeSmaller) {
    items.push(`Heavier rotating mass — ${sizeB} carries a larger tire envelope than ${sizeA}`);
  } else if (envelopeSmaller && !envelopeLarger) {
    items.push(`Lighter rotating mass — ${sizeB} carries a smaller tire envelope than ${sizeA}`);
  } else if (envelopeLarger && envelopeSmaller) {
    items.push(
      `Mixed envelope change — compare mounted weight; width and sidewall shifts partly offset diameter (${sizeA} → ${sizeB})`,
    );
  }

  const minimalStep =
    absDiamPct < 1.5 && absWidthPct < 3 && Math.abs(sidewallDiffIn) < 0.1;
  const largeStep = absDiamPct > 3 || absWidthPct > 5;

  if (minimalStep) {
    items.push(`Easier fitment margin — dimensional change stays close to ${sizeA}`);
  } else if (largeStep) {
    items.push(
      `Tighter fitment margin — ${fmtPct(comparison.diameterDiffPercent)} diameter and ${fmtSigned(widthDiffMm, 0, ' mm')} width; mock-fit at full lock and compression`,
    );
  } else {
    items.push(
      `Moderate fitment change — verify fender and steering clearance before buying four tires`,
    );
  }

  if (Math.abs(comparison.speedometer.errorPercent) > 3) {
    items.push(
      `Speedometer error ${fmtPct(comparison.speedometer.errorPercent)} at ${comparison.speedometer.indicatedSpeed} mph — plan for recalibration`,
    );
  }

  return items.slice(0, 6);
}
