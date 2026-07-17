/**
 * Full-width below-dashboard impact, checklist, and SEO explanation.
 * Reads centralized tire-math / comparison outputs — does not redefine formulas.
 */
import type { UnitSystem } from './calculator-types';
import { fmtPct } from './tire-comparison-format';
import { formatDimensionDiff, speedUnitLabel } from './tire-comparison-units';
import type { TireComparison, TireSpecs } from './tire-math';

export interface DashboardImpactCard {
  id: string;
  title: string;
  value: string;
  detail: string;
}

export interface DashboardWhatChangesInsight {
  id: string;
  title: string;
  /** Two or three sentences for the UI block. */
  sentences: string[];
}

export interface DashboardWhatChangesContent {
  heading: string;
  paragraphs: string[];
  /** Compact insight blocks for the UI (presentation only). */
  insights: DashboardWhatChangesInsight[];
  /** Approximate word count of visible insight copy. */
  wordCount: number;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: readonly string[];
}

export const CHECKLIST_GROUPS: readonly ChecklistGroup[] = [
  {
    id: 'wheel-spec',
    title: 'Wheel and tire specifications',
    items: [
      'Approved rim-width range',
      'Load index',
      'Speed rating',
      'Required wheel diameter',
    ],
  },
  {
    id: 'clearance',
    title: 'Vehicle clearance',
    items: [
      'Fender and suspension clearance',
      'Offset and backspacing',
      'Brake and hub clearance',
    ],
  },
  {
    id: 'after-install',
    title: 'After installation',
    items: [
      'Inspect for rubbing',
      'Check TPMS compatibility',
      'Verify speedometer difference',
      'Recheck tire pressure and fasteners where appropriate',
    ],
  },
] as const;

/** @deprecated Use CHECKLIST_GROUPS — flat list kept for tests that scan all items. */
export const THINGS_TO_CHECK_BEFORE_CHANGING_SIZES = CHECKLIST_GROUPS.flatMap(
  (group) => group.items,
) as readonly string[];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

function takeSentences(text: string, max: number): string[] {
  return splitIntoSentences(text).slice(0, max);
}

/**
 * Six Driving & Vehicle Impact cards from formula-calculated comparison values.
 */
export function buildDashboardImpactCards(input: {
  comparison: TireComparison;
  specsA: TireSpecs;
  specsB: TireSpecs;
  unitSystem: UnitSystem;
}): DashboardImpactCard[] {
  const { comparison, specsA, specsB, unitSystem } = input;
  const speedUnit = speedUnitLabel(unitSystem);
  const indicated = comparison.speedometer.indicatedSpeed;
  const trueSpeed = comparison.speedometer.trueSpeed;
  const diamPct = comparison.diameterDiffPercent;
  const sidewallDiffIn = specsB.sidewallIn - specsA.sidewallIn;
  const clearance = comparison.groundClearanceChangeIn;
  const wheelA = specsA.wheelDiameterIn;
  const wheelB = specsB.wheelDiameterIn;
  const sameWheel = wheelA === wheelB;

  return [
    {
      id: 'speedometer',
      title: 'Speedometer at selected speed',
      value: `${indicated.toFixed(0)} ${speedUnit} indicated ≈ ${trueSpeed.toFixed(1)} ${speedUnit} actual`,
      detail: 'Based on the selected vehicle-speed input.',
    },
    {
      id: 'clearance',
      title: 'Ground-clearance effect',
      value: `Approximately ${formatDimensionDiff(clearance, unitSystem)}`,
      detail:
        Math.abs(clearance) < 0.02
          ? 'Little change to axle-centre ride height.'
          : clearance > 0
            ? 'Half of the overall diameter increase.'
            : 'Half of the overall diameter decrease.',
    },
    {
      id: 'sidewall',
      title: 'Sidewall behaviour',
      value:
        Math.abs(sidewallDiffIn) < 0.02
          ? 'Sidewall height similar'
          : sidewallDiffIn < 0
            ? 'Shorter sidewall'
            : 'Taller sidewall',
      detail:
        Math.abs(sidewallDiffIn) < 0.02
          ? 'Ride compliance should feel familiar for this size pair.'
          : sidewallDiffIn < 0
            ? 'May reduce flex and increase impact harshness.'
            : 'May increase flex and soften smaller impacts.',
    },
    {
      id: 'gearing',
      title: 'Effective gearing',
      value:
        Math.abs(diamPct) < 0.05
          ? 'Essentially unchanged'
          : diamPct > 0
            ? `Approximately ${fmtPct(diamPct)} taller`
            : `Approximately ${fmtPct(Math.abs(diamPct))} shorter`,
      detail:
        Math.abs(diamPct) < 0.05
          ? 'Wheel revolutions per road mile stay nearly the same.'
          : diamPct > 0
            ? 'Slightly fewer wheel revolutions per road mile.'
            : 'Slightly more wheel revolutions per road mile.',
    },
    {
      id: 'wheel',
      title: 'Wheel requirement',
      value: sameWheel
        ? `Same ${wheelA}-inch wheel`
        : `${wheelB}-inch wheel required`,
      detail: sameWheel
        ? 'Bead-seat diameter matches; confirm rim width and clearance.'
        : `The original ${wheelA}-inch wheel cannot be reused.`,
    },
    {
      id: 'install',
      title: 'Installation complexity',
      value: installComplexityValue({
        absDiamPct: Math.abs(diamPct),
        sameWheel,
        absWidthPct: Math.abs(((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100),
      }),
      detail: sameWheel
        ? 'Clearance, load rating and offset checks still matter.'
        : 'Wheel, load, clearance and offset checks remain.',
    },
  ];
}

function installComplexityValue(input: {
  absDiamPct: number;
  sameWheel: boolean;
  absWidthPct: number;
}): string {
  if (!input.sameWheel || input.absDiamPct > 5 || input.absWidthPct > 7) {
    return 'Moderate verification required';
  }
  if (input.absDiamPct > 3 || input.absWidthPct > 3) {
    return 'Light verification recommended';
  }
  return 'Straightforward size check';
}

/**
 * Concise SEO explanation (~150–250 words) — avoids dumping every KPI again.
 */
export function buildDashboardWhatChangesContent(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): DashboardWhatChangesContent {
  const heading = `What changes when switching from ${sizeA} to ${sizeB}?`;
  const diamPct = comparison.diameterDiffPercent;
  const absDiam = Math.abs(diamPct);
  const widthDiff = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const sameWheel = specsA.wheelDiameterIn === specsB.wheelDiameterIn;
  const clearance = comparison.groundClearanceChangeIn;

  const diameterPara =
    absDiam < 0.15
      ? `Overall diameter stays nearly the same between ${sizeA} and ${sizeB}, so speedometer readings and theoretical road speed move only slightly at a given indicated speed. Treat any residual cluster offset as something to confirm with GPS on your first few drives. Nominal circumference and revolutions per mile should track together when diameter is matched.`
      : diamPct > 0
        ? `Moving to ${sizeB} increases overall diameter versus ${sizeA}. That same percentage roughly appears as speedometer difference: the cluster understates true road speed until you recalibrate or cross-check with GPS on a steady cruise. Plan a quick GPS check on your usual highway route before relying on the cluster for long trips.`
        : `Moving to ${sizeB} reduces overall diameter versus ${sizeA}. Speedometer difference tracks that change, so indicated speed can read higher than theoretical road speed until you verify with an independent reference. A steady cruise GPS check is the fastest way to confirm the offset on your vehicle.`;

  const widthPara =
    Math.abs(widthDiff) < 0.05 && Math.abs(sidewallDiff) < 0.05
      ? `Section width and sidewall height stay close to ${sizeA}, so the visual profile and nominal contact-patch proportion remain familiar. Remaining feel differences are more likely from tire model and construction than from the size codes alone. Compare published rim-width range and load index on the specific products you are considering.`
      : `Expect a ${widthDiff >= 0 ? 'wider' : 'narrower'} section and a ${sidewallDiff >= 0 ? 'taller' : 'shorter'} nominal sidewall. Those shape changes influence ride compliance and steering feel, but construction, pressure and vehicle setup still dominate day-to-day response. Mock-fit at full steering lock if width or sidewall moved materially.`;

  const wheelPara = sameWheel
    ? `Both sizes share a ${specsA.wheelDiameterIn}-inch wheel diameter in the size code, so a wheel swap is not required by the tire size alone. You still need a rim width that falls in the tire maker’s approved range for the specific product. Confirm brake caliper, hub bore and TPMS compatibility on the wheel you plan to reuse.`
    : `${sizeB} needs a ${specsB.wheelDiameterIn}-inch wheel. The original ${specsA.wheelDiameterIn}-inch wheel from ${sizeA} cannot be reused for this size change, and hub, brake and offset clearance become part of the install review. Budget time to verify the new wheel package on the vehicle before buying four tires.`;

  const gearingPara =
    absDiam < 0.15
      ? `Effective gearing barely shifts because rolling circumference is nearly unchanged, so engine RPM at a given road speed should feel similar. That helps keep highway cruising character close to ${sizeA}. Throttle response from a stop should also feel familiar unless vehicle weight or tire construction changed.`
      : diamPct > 0
        ? `The larger rolling diameter produces slightly taller effective gearing—fewer revolutions per mile for the same road distance, typically with a small highway RPM drop at cruise. Throttle response from a stop can feel slightly softer until you adapt to the taller roll-out.`
        : `The smaller rolling diameter produces slightly shorter effective gearing—more revolutions per mile and a small rise in engine RPM at the same road speed. Throttle response from a stop can feel sharper while highway RPM may climb slightly at cruise.`;

  const clearancePara =
    Math.abs(clearance) < 0.05
      ? `Static axle-centre height stays about the same. Still confirm full-lock and suspension-compression clearance on the vehicle; size data alone cannot verify fender, caliper or liner fit after the tires are mounted. Repeat the check at every corner if width or wheel offset changed.`
      : `Approximate ground clearance at the axle centre changes by about ${formatDimensionDiff(clearance, 'imperial')}. Treat that as a planning figure, then verify load index, speed rating, wheel width range and real-world clearance before you commit to the change. Mock-fit at full suspension compression before final purchase.`;

  const paragraphs = [diameterPara, widthPara, wheelPara, gearingPara, clearancePara];

  const insights: DashboardWhatChangesInsight[] = [
    {
      id: 'diameter',
      title: 'Diameter and speedometer',
      sentences: takeSentences(diameterPara, 3),
    },
    {
      id: 'width',
      title: 'Width and sidewall',
      sentences: takeSentences(widthPara, 3),
    },
    {
      id: 'wheel',
      title: 'Wheel requirement',
      sentences: takeSentences(wheelPara, 3),
    },
    {
      id: 'gearing-clearance',
      title: 'Gearing and clearance',
      sentences: [...takeSentences(gearingPara, 2), ...takeSentences(clearancePara, 2)].slice(0, 3),
    },
  ].map((row) => ({
    ...row,
    sentences: row.sentences.length >= 2 ? row.sentences : [...row.sentences, diameterPara].slice(0, 2),
  }));

  const visibleCopy = insights.flatMap((row) => row.sentences).join(' ');
  const wordCount = countWords(visibleCopy);

  return { heading, paragraphs, insights, wordCount };
}
