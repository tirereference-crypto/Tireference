/**
 * Alternative comparison paths for the comparison calculator lower page.
 * Reuses getCalculatorRelatedSizes — does not invent sizes or change formulas.
 */
import {
  getCalculatorRelatedSizes,
  type CalculatorRelatedSize,
  type RelatedSizeRole,
} from './calculator-related-sizes';
import { fmtPct, fmtSigned } from './tire-comparison-format';
import type { UnitSystem } from './calculator-types';

export interface AlternativeComparisonPathCard {
  id: string;
  roleLabel: string;
  size: string;
  diameterDiff: string;
  widthDiff: string;
  wheelDiameter: string;
  wheelBadge: 'Same Wheel' | 'Different Wheel';
  compareHref: string;
}

const ROLE_LABELS: Partial<Record<RelatedSizeRole, string>> = {
  nearest_same_wheel: 'Closest diameter',
  narrower_same_wheel: 'Same-wheel narrower',
  wider_same_wheel: 'Same-wheel wider',
  larger_diameter: 'Larger-diameter option',
  smaller_diameter: 'Smaller-diameter option',
  different_wheel: 'Different-wheel setup',
};

/** Preferred display order for the full-width path row. */
const ROLE_PRIORITY: RelatedSizeRole[] = [
  'nearest_same_wheel',
  'wider_same_wheel',
  'narrower_same_wheel',
  'larger_diameter',
  'different_wheel',
  'smaller_diameter',
];

function formatWidthDiff(widthDiffMm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    return `${fmtSigned(widthDiffMm, 0, ' mm')}`;
  }
  const inches = widthDiffMm / 25.4;
  return fmtSigned(inches, 2, ' in');
}

function toCard(
  row: CalculatorRelatedSize,
  unitSystem: UnitSystem,
): AlternativeComparisonPathCard | null {
  const roleLabel = ROLE_LABELS[row.role];
  if (!roleLabel) return null;
  return {
    id: `${row.role}-${row.size}`,
    roleLabel,
    size: row.size,
    diameterDiff: fmtPct(row.diameterDiffPercent),
    widthDiff: formatWidthDiff(row.widthDiffMm, unitSystem),
    wheelDiameter: `${row.rimIn}"`,
    wheelBadge: row.sameWheel ? 'Same Wheel' : 'Different Wheel',
    compareHref: row.compareHref,
  };
}

/**
 * Build unique alternative path cards vs the original (Tire 1) size.
 * Skips duplicates and invalid paths.
 */
export function buildAlternativeComparisonPaths(
  baseSize: string,
  unitSystem: UnitSystem = 'imperial',
  limit = 5,
): AlternativeComparisonPathCard[] {
  const related = getCalculatorRelatedSizes(baseSize, 8);
  const byRole = new Map<RelatedSizeRole, CalculatorRelatedSize>();
  for (const row of related) {
    if (!byRole.has(row.role)) byRole.set(row.role, row);
  }

  const cards: AlternativeComparisonPathCard[] = [];
  const seenSizes = new Set<string>();

  for (const role of ROLE_PRIORITY) {
    const row = byRole.get(role);
    if (!row) continue;
    if (seenSizes.has(row.size)) continue;
    const card = toCard(row, unitSystem);
    if (!card) continue;
    seenSizes.add(row.size);
    cards.push(card);
    if (cards.length >= limit) break;
  }

  return cards;
}
