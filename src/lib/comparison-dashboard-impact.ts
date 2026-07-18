/**
 * Full-width below-dashboard impact, checklist, and SEO explanation.
 * Reads centralized tire-math / comparison outputs — does not redefine formulas.
 */
import type { UnitSystem } from './calculator-types';
import {
  buildComparisonPairRelationships,
  formatDiameterThresholdFact,
  formatRevsPerMileFact,
  formatSpeedExamples,
} from './comparison-pair-relationships';
import { fmtPct, fmtSigned } from './tire-comparison-format';
import { FITMENT_DIAMETER_PCT } from './tire-comparison-fitment';
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
  /** Compact insight blocks for the UI (presentation only). */
  insights: DashboardWhatChangesInsight[];
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
        ? 'Bead-seat diameter can be reused; rim width and offset are separate checks.'
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

/** Pair-specific factual insights. Empty optional blocks are not emitted. */
export function buildDashboardWhatChangesContent(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): DashboardWhatChangesContent {
  const heading = `What changes when switching from ${sizeA} to ${sizeB}?`;
  const relationship = buildComparisonPairRelationships(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
  );
  const diameterDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;

  const sizingLabel =
    relationship.sizingMode === 'plus-size'
      ? `This is a plus-size change from a ${specsA.wheelDiameterIn}" to a ${specsB.wheelDiameterIn}" wheel.`
      : relationship.sizingMode === 'downsize'
        ? `This is a downsize from a ${specsA.wheelDiameterIn}" to a ${specsB.wheelDiameterIn}" wheel.`
        : `Both sizes use a ${specsA.wheelDiameterIn}" bead-seat diameter.`;
  const reuseFact = relationship.canReuseWheelDiameter
    ? `The wheel diameter can be reused; approved rim width, offset, load rating and clearance still require separate checks.`
    : `The ${specsA.wheelDiameterIn}" wheel cannot be reused for the ${specsB.wheelDiameterIn}" tire.`;

  const insights: DashboardWhatChangesInsight[] = [
    {
      id: 'wheel',
      title:
        relationship.sizingMode === 'plus-size'
          ? 'Plus-sizing and wheel use'
          : relationship.sizingMode === 'downsize'
            ? 'Downsizing and wheel use'
            : 'Same-wheel change',
      sentences: [sizingLabel, reuseFact, formatDiameterThresholdFact(relationship)],
    },
    {
      id: 'width',
      title: 'Dimensional direction',
      sentences: [
        `${sizeB} is ${
          relationship.diameterDirection === 'unchanged'
            ? 'effectively the same overall diameter as'
            : relationship.diameterDirection === 'increase'
              ? 'taller than'
              : 'shorter than'
        } ${sizeA} (${fmtSigned(diameterDiff, 2, '"')}) and ${
          relationship.widthDirection === 'unchanged'
            ? 'the same nominal width'
            : relationship.widthDirection === 'increase'
              ? 'wider'
              : 'narrower'
        } (${fmtSigned(widthDiffMm, 0, ' mm')}).`,
        `Sidewall height ${
          relationship.sidewallDirection === 'unchanged'
            ? 'is essentially unchanged'
            : relationship.sidewallDirection === 'increase'
              ? 'increases'
              : 'decreases'
        } by ${Math.abs(sidewallDiff).toFixed(2)}"; static ground clearance ${
          relationship.clearanceDirection === 'unchanged'
            ? 'is essentially unchanged'
            : relationship.clearanceDirection === 'increase'
              ? 'increases'
              : 'decreases'
        } by ${Math.abs(comparison.groundClearanceChangeIn).toFixed(2)}".`,
      ],
    },
    {
      id: 'speedometer',
      title: 'Road speed, revs and gearing',
      sentences: [
        `Theoretical road speeds: ${formatSpeedExamples(relationship.speedExamples)}.`,
        formatRevsPerMileFact(relationship),
      ],
    },
    ...(relationship.awdCaution
      ? [
          {
            id: 'awd',
            title: 'AWD/4WD circumference caution',
            sentences: [
              `${fmtPct(comparison.diameterDiffPercent)} is outside the site’s ±${FITMENT_DIAMETER_PCT.pass}% comparison threshold. Do not mix these sizes across driven axles unless the vehicle manufacturer specifies that combination.`,
            ],
          },
        ]
      : []),
    ...(relationship.sharedModels.length > 0
      ? [
          {
            id: 'models',
            title: 'Tire models sold in both sizes',
            sentences: [
              `${relationship.sharedModels.length} indexed brand/model ${
                relationship.sharedModels.length === 1 ? 'name exists' : 'names exist'
              } in both sizes: ${relationship.sharedModels
                .slice(0, 4)
                .map((model) => `${model.brand} ${model.model}`)
                .join(', ')}${
                relationship.sharedModels.length > 4
                  ? `, plus ${relationship.sharedModels.length - 4} more`
                  : ''
              }. Service descriptions and specifications can differ by size.`,
            ],
          },
        ]
      : []),
  ];

  return { heading, insights };
}

/** Only checks triggered by this pair; no generic always-on checklist. */
export function buildPairSpecificChecklistGroups(
  sizeA: string,
  sizeB: string,
  comparison: TireComparison,
  specsA: TireSpecs,
  specsB: TireSpecs,
): ChecklistGroup[] {
  const relationship = buildComparisonPairRelationships(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
  );
  const groups: ChecklistGroup[] = [];

  groups.push({
    id: 'wheel-spec',
    title: relationship.sameWheelDiameter ? 'Wheel reuse check' : 'Replacement wheel required',
    items: relationship.sameWheelDiameter
      ? [
          `Both sizes use a ${specsA.wheelDiameterIn}" bead seat`,
          'Confirm the new tire model’s approved rim-width range',
        ]
      : [
          `${sizeB} requires a ${specsB.wheelDiameterIn}" wheel`,
          `The ${specsA.wheelDiameterIn}" wheel used by ${sizeA} cannot be reused`,
        ],
  });

  if (
    relationship.widthDirection === 'increase' ||
    relationship.diameterDirection === 'increase'
  ) {
    groups.push({
      id: 'clearance',
      title: 'Larger envelope check',
      items: [
        ...(relationship.widthDirection === 'increase'
          ? [`Section width increases ${fmtSigned(specsB.widthMm - specsA.widthMm, 0, ' mm')}`]
          : []),
        ...(relationship.diameterDirection === 'increase'
          ? [`Overall diameter increases ${fmtSigned(specsB.overallDiameterIn - specsA.overallDiameterIn, 2, '"')}`]
          : []),
        'Verify fender and suspension clearance at full lock and compression',
      ],
    });
  }

  if (relationship.awdCaution) {
    groups.push({
      id: 'after-install',
      title: 'Drivetrain check',
      items: [
        `${fmtPct(comparison.diameterDiffPercent)} diameter difference exceeds ±${FITMENT_DIAMETER_PCT.pass}%`,
        'Do not mix across driven axles without manufacturer approval',
      ],
    });
  }

  return groups;
}
