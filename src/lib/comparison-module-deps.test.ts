import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Lightweight cycle guard for the layered comparison modules.
 * Parses relative `from './…'` imports among the protected set and fails if
 * any directed cycle exists.
 */
const MODULES = [
  'tire-size-primitives',
  'comparison-url',
  'tire-comparison-insights-core',
  'tire-comparison-links',
  'tire-comparison-insights',
] as const;

type ModuleName = (typeof MODULES)[number];

const ROOT = dirname(fileURLToPath(import.meta.url));

function modulePath(name: ModuleName): string {
  return join(ROOT, `${name}.ts`);
}

function localImports(source: string): string[] {
  const matches = [
    ...source.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g),
  ];
  const names = matches
    .map((match) => match[1].replace(/\.ts$/, ''))
    .filter((name): name is ModuleName =>
      (MODULES as readonly string[]).includes(name),
    );
  return [...new Set(names)];
}

function findCycle(graph: Map<ModuleName, ModuleName[]>): ModuleName[] | null {
  const visiting = new Set<ModuleName>();
  const visited = new Set<ModuleName>();
  const stack: ModuleName[] = [];

  function dfs(node: ModuleName): ModuleName[] | null {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      return [...stack.slice(start), node];
    }
    if (visited.has(node)) return null;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = dfs(next);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of MODULES) {
    const cycle = dfs(node);
    if (cycle) return cycle;
  }
  return null;
}

describe('comparison module dependency layering', () => {
  it('has no circular imports among Layer 1–3 comparison modules', () => {
    const graph = new Map<ModuleName, ModuleName[]>();
    for (const name of MODULES) {
      const source = readFileSync(modulePath(name), 'utf8');
      graph.set(name, localImports(source));
    }

    // Explicit layering expectations.
    expect(graph.get('tire-size-primitives')).toEqual([]);
    expect(graph.get('comparison-url')).toEqual(['tire-size-primitives']);
    expect(graph.get('tire-comparison-insights-core')).not.toContain(
      'tire-comparison-links',
    );
    expect(graph.get('tire-comparison-insights-core')).not.toContain(
      'tire-comparison-insights',
    );
    expect(graph.get('tire-comparison-links')).toContain(
      'tire-comparison-insights-core',
    );
    expect(graph.get('tire-comparison-links')).not.toContain(
      'tire-comparison-insights',
    );

    const cycle = findCycle(graph);
    expect(cycle, cycle ? `Cycle: ${cycle.join(' -> ')}` : undefined).toBeNull();
  });

  it('deprecated Layer 1 wrappers in comparison-url re-export tire-size-primitives', () => {
    const source = readFileSync(modulePath('comparison-url'), 'utf8');
    expect(source).toContain("from './tire-size-primitives'");
    expect(source).toContain('parseComparisonTireSize');
    expect(source).toContain('normalizeComparisonTireSize');
    expect(source).not.toMatch(/COMPARISON_CALCULATOR_PATH/);
    expect(source).not.toMatch(/function comparisonCalculatorPath/);
  });
});
