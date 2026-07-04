/**
 * Role-based comparison page copy — each section has a distinct purpose:
 *
 * Summary (chips/KPI/specs) → numbers live here only
 * Engineering narrative → why dimensions cause downstream effects
 * Performance impact → driving consequences (tire-real-world-impact)
 * Verdict → recommendation and decision
 * FAQ → procedural questions not answered above
 */
import type { EngineeringAnalysis } from './tire-comparison-engineering-analysis';
import type { TireComparison, TireSpecs } from './tire-math';
import { resolveTireCategory } from './tire-comparison-recommendations';

import { nearZero } from './tire-comparison-format';

/** Engineering narrative: causal relationships without repeating spec-table numbers. */
export function buildEngineeringNarrative(
  analysis: EngineeringAnalysis,
  sizeA: string,
  sizeB: string,
): string {
  const { specsA, specsB } = analysis.measurements;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;

  const parts: string[] = [
    `Moving from ${sizeA} to ${sizeB} changes three independent geometric variables that compound on the vehicle. The summary bar and spec table quantify those deltas; this section explains the mechanical relationships behind them.`,
  ];

  if (nearZero(diamDiff, 0.05)) {
    parts.push(
      `Overall diameter stays effectively matched, so rolling circumference — and everything tied to it — should track the factory tire closely. Speedometer calibration, revolutions per distance, static ride height at the axle, and effective final-drive ratio all scale with circumference rather than tread width or sidewall height.`,
    );
  } else if (diamDiff > 0) {
    parts.push(
      `The larger overall diameter lengthens rolling circumference. That single change simultaneously raises static ride height under the axle centerline, slows wheel revolutions for a given road speed, and shifts speedometer and odometer readings because the cluster assumes the factory tire covers less ground per revolution. Effective gearing also lengthens — the drivetrain turns fewer times per mile, which typically drops cruising engine speed but can soften throttle response from a stop.`,
    );
  } else {
    parts.push(
      `The smaller overall diameter shortens rolling circumference, which lowers static ride height, increases revolutions per distance at the same road speed, and can make the speedometer read high relative to true speed. Shorter effective gearing usually sharpens throttle response while raising cruising RPM and engine load at highway speed.`,
    );
  }

  if (nearZero(sidewallDiff, 0.05)) {
    parts.push(
      `Sidewall height is essentially unchanged between these sizes. Because sidewall volume acts as an air spring between rim and tread, ride compliance and sidewall flex under cornering loads should feel similar even if diameter or width shifted.`,
    );
  } else if (sidewallDiff > 0) {
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
  const { specsA, specsB, comparison } = analysis.measurements;
  const sameWheel = specsB.wheelDiameterIn === specsA.wheelDiameterIn;
  const largeStep =
    Math.abs(comparison.diameterDiffPercent) > 3 ||
    Math.abs(specsB.widthMm - specsA.widthMm) > 10;

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

/** FAQ: fuel economy — practical guidance without repeating RPM figures from performance cards. */
export function buildFuelEconomyFaqAnswer(analysis: EngineeringAnalysis): string {
  const { rpmDelta } = analysis.measurements;
  const fewer = rpmDelta < -10;
  const more = rpmDelta > 10;

  return [
    `Highway fuel use follows two tire-driven variables: cruising engine speed and rolling resistance. Both shift when overall diameter, sidewall height, or section width change — the Performance & Driving Impact section covers the directional effect on your setup.`,
    fewer
      ? `When cruising RPM drops meaningfully, the engine does less work per mile at steady speed, which tends to help highway economy. Around-town consumption also depends on tire weight, tread compound, and sidewall flex — factors not captured by diameter alone.`
      : more
        ? `When cruising RPM rises, the engine turns more revolutions per mile at the same indicated speed, which usually increases highway fuel load. A taller or softer sidewall can add rolling resistance from flex even when overall diameter is unchanged.`
        : `With cruising RPM nearly unchanged, fuel economy should track the reference tire closely — tire construction, tread compound, and inflation pressure drive most real-world differences at this point.`,
    `Track a full tank on your regular commute before and after the swap. Calculated dimensions predict the direction of change, not an exact MPG figure — your driving style, terrain, and vehicle load dominate the outcome.`,
  ].join(' ');
}

/** FAQ: ride/handling — suspension interaction, not a repeat of engineering sections. */
export function buildRideHandlingFaqAnswer(analysis: EngineeringAnalysis): string {
  const { specsA, specsB } = analysis.measurements;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const softer = sidewallDiff > 0.1;
  const firmer = sidewallDiff < -0.1;

  const feel = firmer
    ? `The shorter sidewall on ${analysis.measurements.sizeB} generally firms transient response and sharpens turn-in on smooth pavement, but transmits more harshness over expansion joints and potholes.`
    : softer
      ? `The taller sidewall on ${analysis.measurements.sizeB} generally absorbs more vertical impact before the rim sees load, which softens the ride — but can feel less precise during quick direction changes.`
      : `Sidewall height is similar between these sizes, so ride and handling differences likely come from section width and overall diameter rather than sidewall compliance alone.`;

  return [
    feel,
    `Tire pressure matters as much as geometry: even a correctly sized tire feels harsh when over-inflated or vague when under-inflated. Reset to the placard cold pressure after mounting and recheck after the first hundred miles.`,
    `Suspension bushings, shock condition, and alignment settings amplify or mask tire changes. If the vehicle pulls, tram-lines on grooved pavement, or shows uneven wear after the swap, schedule an alignment — especially when section width or wheel offset changed.`,
    `For winter or all-season compounds, tread block design and siping influence noise and wet grip independently of the size label — compare UTQG traction ratings when choosing between brands at the same size.`,
  ].join(' ');
}

/** FAQ set: procedural questions not covered by summary, engineering, performance, or verdict. */
export function buildComparisonFaqs(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
  analysis: EngineeringAnalysis,
): Array<{ question: string; answer: string }> {
  const sameWheel = specsB.wheelDiameterIn === specsA.wheelDiameterIn;
  const largeStep =
    Math.abs(comparison.diameterDiffPercent) > 3 ||
    Math.abs(specsB.widthMm - specsA.widthMm) > 10;
  const speedoHigh = Math.abs(comparison.speedometer.errorPercent) > 3;
  const categoryB = resolveTireCategory(sizeB, specsB);
  const isTrailCategory = categoryB === 'off-road' || categoryB === 'light-truck';

  return [
    {
      question: `What should I inspect during a mock-fit before mounting ${sizeB}?`,
      answer: [
        `Mount one tire on the intended wheel and install it at the corner that typically rubs first on your platform — often the front driver side on lowered or wide-track vehicles.`,
        `Turn the steering to full lock in both directions while watching the gap between the tire shoulder and inner fender liner, pinch weld, and strut.`,
        `Have an assistant bounce that corner through full suspension compression while you check for contact at the liner, control arm, and brake line.`,
        largeStep
          ? `This comparison involves a large dimensional step — repeat the check at the rear, where the tire arc can contact the quarter panel lip under load.`
          : `Even moderate size changes can rub on tightly packaged platforms — do not skip the rear corners on independent rear suspension vehicles.`,
      ].join(' '),
    },
    {
      question: `How can I recalibrate the speedometer after switching to ${sizeB}?`,
      answer: [
        speedoHigh
          ? `The speedometer error on this comparison exceeds the ±2–3% band most OEMs target, so recalibration is worth planning before long-term use.`
          : `The speedometer error on this comparison sits within many OEM tolerance bands, but verify against a GPS or known speed trap on your first highway drive.`,
        `Dealer scan tools, manufacturer apps, and platform-specific tuners (FORScan on Ford, HP Tuners, etc.) can apply a tire-size correction factor where supported.`,
        `Aftermarket speedometer correction modules and some aftermarket clusters accept a rolling-circumference input directly.`,
        `Odometer distance accumulates the same proportional error as the speedometer — factor that into lease mileage or maintenance-interval tracking if you rely on the cluster counter.`,
      ].join(' '),
    },
    {
      question: `Will ${sizeB} require new wheels compared with ${sizeA}?`,
      answer: sameWheel
        ? [
            `Both sizes use a ${specsA.wheelDiameterIn}" bead seat, so your existing wheels may work if the internal barrel width supports the new section width and the offset positions the tire correctly in the well.`,
            `As a rule of thumb, each 10 mm of additional tire width typically needs roughly 5 mm of additional wheel width.`,
            `Confirm the wheel load rating meets or exceeds the new tire's load index and that the hub bore and lug pattern match your hub.`,
          ].join(' ')
        : [
            `${sizeA} mounts on a ${specsA.wheelDiameterIn}" wheel while ${sizeB} requires ${specsB.wheelDiameterIn}" — the bead seat diameter differs, so factory wheels from the current size cannot mount the new tire.`,
            `Plan on a complete wheel set with correct hub bore, load rating, and brake caliper clearance for the larger or smaller rim.`,
            `Plus-sizing and minus-sizing also change the brake rotor-to-wheel-barrel relationship — confirm caliper clearance before purchase.`,
          ].join(' '),
    },
    {
      question: `Do I need a lift kit or fender modification to fit ${sizeB} on a vehicle currently running ${sizeA}?`,
      answer: [
        isTrailCategory && largeStep
          ? `Trail and truck builds with large diameter or width steps often need a mild lift, negative-offset wheels, or fender trimming to prevent contact at full articulation — mock-fit before committing.`
          : largeStep
            ? `Large dimensional steps enlarge the tire envelope in every direction. Some vehicles need a mild lift, revised offset, or minor trimming even when the diameter change looks modest on paper.`
            : `Many factory-height vehicles absorb moderate size changes without a lift kit, but clearance depends on your exact wheel offset, suspension travel, and fender shape — not tire math alone.`,
        `Static ride height is only half the picture: the tire moves through an arc as the suspension compresses and the steering turns. Always verify at full droop and full compression.`,
        `Break-over and approach angles improve when diameter grows, but only if the tire clears the fender at maximum compression — contact at full travel negates the clearance gain.`,
      ].join(' '),
    },
    {
      question: `How does switching to ${sizeB} affect ABS, traction control, and TPMS?`,
      answer: [
        `ABS and stability-control modules compare wheel-speed sensor inputs across all four corners. A tire with a different rolling circumference changes the expected speed ratio at any given road speed.`,
        Math.abs(comparison.revsPerMileDiffPercent) > 3
          ? `The revolutions-per-mile shift on this comparison exceeds the ±3% wheel-speed tolerance cited by many OEMs — a brief fault code or reduced intervention is possible until the system relearns or is recalibrated.`
          : `The revolutions-per-mile shift on this comparison is within the tolerance band most factory ABS modules accept without fault codes, though a 10–15 minute mixed driving relearn cycle helps establish new baselines.`,
        `Traction control, hill-descent, and adaptive cruise systems use the same wheel-speed data — the same tolerance applies.`,
        `Confirm your TPMS module supports the new size and that sensors are relearned after mounting. Some modules require a dealer tool; others relearn after a drive cycle at specified speeds.`,
      ].join(' '),
    },
    {
      question: `Should I replace all four tires when moving from ${sizeA} to ${sizeB}?`,
      answer: [
        `Mixing significantly different rolling circumferences across an axle — or between front and rear on AWD platforms — can stress differentials and confuse traction systems.`,
        `The recommended approach is to replace all four tires at once when overall diameter changes meaningfully, so every corner reports a consistent wheel speed to ABS and AWD controllers.`,
        `If budget requires a staggered approach, keep the most worn tires on the same axle and never mix bias-ply with radial or widely different tread depths on AWD vehicles.`,
        `After installing four matching tires, rotate on the schedule in your owner's manual and recheck inflation cold — mismatched pressure mimics mismatched diameter.`,
      ].join(' '),
    },
    {
      question: `How will fuel economy change with ${sizeB} versus ${sizeA}?`,
      answer: buildFuelEconomyFaqAnswer(analysis),
    },
    {
      question: `How does the switch from ${sizeA} to ${sizeB} affect ride quality and handling feel?`,
      answer: buildRideHandlingFaqAnswer(analysis),
    },
  ];
}

/** Fitment checklist bullets for "Things to Consider" — process, not measurements. */
export function buildFitmentConsiderations(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): string[] {
  const sameWheel = specsB.wheelDiameterIn === specsA.wheelDiameterIn;
  const speedoHigh = Math.abs(comparison.speedometer.errorPercent) > 3;
  const largeStep =
    Math.abs(comparison.diameterDiffPercent) > 3 ||
    Math.abs(specsB.widthMm - specsA.widthMm) > 10;

  const items = [
    'Mock-fit one tire at full steering lock before purchasing all four.',
    'Cycle suspension through full compression and inspect inner liner clearance.',
    sameWheel
      ? 'Confirm existing wheel width and offset support the new section width.'
      : `Plan for new ${specsB.wheelDiameterIn}" wheels — bead seat differs from ${sizeA}.`,
    largeStep
      ? 'Budget for possible trimming, revised offset, or mild lift if mock-fit shows contact.'
      : 'Verify rear corners under load — independent rear suspension can rub where the front clears.',
    speedoHigh
      ? 'Investigate speedometer recalibration before relying on cruise control long-term.'
      : 'Drive a mixed cycle after install so ABS and ESC relearn wheel-speed baselines.',
    'Match load index and speed rating to your door-placard minimum.',
  ];

  return items.slice(0, 6);
}
