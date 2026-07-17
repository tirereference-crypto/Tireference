import { buildComparisonAnalysis } from '../tire-comparison-engineering-analysis';
import {
  parseTireComparisonFromSearch,
  parseTireSizeFromSearch,
} from '../calculator-url-state';
import { compareTires, getTireSpecs, type TireSpecs } from '../tire-math';
import { normalizeTireSizeInput } from '../tire-size-validation';
import { parseFullSizeToFields } from '../tire-size-input';

export interface TireOgData {
  size: string;
  diameterIn: number;
  widthIn: number;
  sidewallIn: number;
  revsPerMile: number;
  wheelIn: number;
}

export interface CompareOgData {
  from: string;
  to: string;
  fitmentScore: number;
  diameterDeltaPct: number;
  widthDeltaMm: number;
  revsDeltaPct: number;
  fromSpecs: TireOgData;
  toSpecs: TireOgData;
}

function specsToOgData(size: string, specs: TireSpecs): TireOgData {
  return {
    size,
    diameterIn: specs.overallDiameterIn,
    widthIn: specs.sectionWidthIn,
    sidewallIn: specs.sidewallIn,
    revsPerMile: specs.revsPerMile,
    wheelIn: specs.wheelDiameterIn,
  };
}

export function isValidTireSizeParam(size: string | null | undefined): size is string {
  if (!size?.trim()) return false;
  const normalized = normalizeTireSizeInput(size.trim());
  return Boolean(parseFullSizeToFields(normalized));
}

export function buildTireOgData(size: string): TireOgData | null {
  if (!isValidTireSizeParam(size)) return null;
  const normalized = normalizeTireSizeInput(size.trim());
  try {
    return specsToOgData(normalized, getTireSpecs(normalized));
  } catch {
    return null;
  }
}

export function buildCompareOgData(from: string, to: string): CompareOgData | null {
  if (!isValidTireSizeParam(from) || !isValidTireSizeParam(to)) return null;

  const sizeA = normalizeTireSizeInput(from.trim());
  const sizeB = normalizeTireSizeInput(to.trim());

  try {
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const comparison = compareTires(sizeA, sizeB, 60);
    const analysis = buildComparisonAnalysis(sizeA, sizeB, comparison, specsA, specsB);

    return {
      from: sizeA,
      to: sizeB,
      fitmentScore: analysis.measurements.fitmentScore,
      diameterDeltaPct: comparison.diameterDiffPercent,
      widthDeltaMm: comparison.widthDiffMm,
      revsDeltaPct: comparison.revsPerMileDiffPercent,
      fromSpecs: specsToOgData(sizeA, specsA),
      toSpecs: specsToOgData(sizeB, specsB),
    };
  } catch {
    return null;
  }
}

export function parseTireSizeSearchParam(params: URLSearchParams): string | null {
  const size = parseTireSizeFromSearch(params);
  return size && isValidTireSizeParam(size) ? normalizeTireSizeInput(size) : null;
}

export function parseCompareSearchParams(params: URLSearchParams): { from: string; to: string } | null {
  const { from, to } = parseTireComparisonFromSearch(params, { from: '', to: '' });
  if (!isValidTireSizeParam(from) || !isValidTireSizeParam(to)) return null;
  return {
    from: normalizeTireSizeInput(from),
    to: normalizeTireSizeInput(to),
  };
}

export function fmtIn(value: number, digits = 2): string {
  return `${value.toFixed(digits)}"`;
}

export function fmtSignedPct(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function fmtSignedMm(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)} mm`;
}
