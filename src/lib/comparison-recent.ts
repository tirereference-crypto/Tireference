/**
 * Recent comparison pairs stored in localStorage (client-only).
 */
const STORAGE_KEY = 'tireref-recent-comparisons';
const MAX_ITEMS = 6;

export interface RecentComparisonItem {
  sizeA: string;
  sizeB: string;
  label: string;
  href: string;
  savedAt: number;
}

function canUseStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
  } catch {
    return false;
  }
}

export function readRecentComparisons(): RecentComparisonItem[] {
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

export function pushRecentComparison(sizeA: string, sizeB: string, href: string): RecentComparisonItem[] {
  if (!canUseStorage() || !sizeA || !sizeB) return readRecentComparisons();
  const next: RecentComparisonItem = {
    sizeA,
    sizeB,
    label: `${sizeA} vs ${sizeB}`,
    href,
    savedAt: Date.now(),
  };
  const existing = readRecentComparisons().filter(
    (item) => !(item.sizeA === sizeA && item.sizeB === sizeB),
  );
  const merged = [next, ...existing].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
  return merged;
}
