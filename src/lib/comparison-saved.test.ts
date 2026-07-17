import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isSavedComparison,
  readSavedComparisons,
  removeSavedComparison,
  saveComparison,
} from './comparison-saved';

const item = {
  sizeA: '225/45R17',
  sizeB: '235/40R18',
  label: '225/45R17 vs 235/40R18',
  href: '/compare/225-45-r17-vs-235-40-r18/',
};

function installLocalStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
}

describe('comparison-saved', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty', () => {
    expect(readSavedComparisons()).toEqual([]);
    expect(isSavedComparison(item.sizeA, item.sizeB)).toBe(false);
  });

  it('saves and removes a comparison pair', () => {
    const saved = saveComparison(item);
    expect(saved).toHaveLength(1);
    expect(saved[0].label).toBe(item.label);
    expect(isSavedComparison(item.sizeA, item.sizeB)).toBe(true);

    const removed = removeSavedComparison(item.sizeA, item.sizeB);
    expect(removed).toEqual([]);
    expect(isSavedComparison(item.sizeA, item.sizeB)).toBe(false);
  });

  it('deduplicates saved pairs and keeps newest first', () => {
    saveComparison(item);
    const updated = saveComparison({ ...item, label: 'Updated label' });
    expect(updated).toHaveLength(1);
    expect(updated[0].label).toBe('Updated label');
  });
});
