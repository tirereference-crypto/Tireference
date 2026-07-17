/**
 * Saved comparison pairs stored in localStorage (client-only).
 */
import type { RecentComparisonItem } from './comparison-recent';

const STORAGE_KEY = 'tireref-saved-comparisons';
const MAX_ITEMS = 24;

function canUseStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
  } catch {
    return false;
  }
}

export function readSavedComparisons(): RecentComparisonItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentComparisonItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.sizeA === 'string' &&
          typeof item.sizeB === 'string' &&
          typeof item.href === 'string',
      )
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function isSavedComparison(sizeA: string, sizeB: string): boolean {
  return readSavedComparisons().some((item) => item.sizeA === sizeA && item.sizeB === sizeB);
}

export function saveComparison(
  item: Pick<RecentComparisonItem, 'sizeA' | 'sizeB' | 'label' | 'href'>,
): RecentComparisonItem[] {
  if (!canUseStorage() || !item.sizeA || !item.sizeB) return readSavedComparisons();
  const next: RecentComparisonItem = {
    ...item,
    savedAt: Date.now(),
  };
  const existing = readSavedComparisons().filter(
    (entry) => !(entry.sizeA === item.sizeA && entry.sizeB === item.sizeB),
  );
  const merged = [next, ...existing].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
  return merged;
}

export function removeSavedComparison(sizeA: string, sizeB: string): RecentComparisonItem[] {
  if (!canUseStorage()) return readSavedComparisons();
  const merged = readSavedComparisons().filter(
    (item) => !(item.sizeA === sizeA && item.sizeB === sizeB),
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
  return merged;
}
