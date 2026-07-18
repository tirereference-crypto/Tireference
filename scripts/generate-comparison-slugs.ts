/**
 * Generates the published /compare/ slug allowlist consumed by
 * src/lib/comparison-redirect.ts (edge redirects + internal links).
 *
 * Run via `npm run data:comparison-slugs` (also part of `npm run build`).
 * A vitest guard (comparison-redirect.test.ts) fails when this file drifts
 * from getAllComparisonSlugs(), so stale allowlists cannot ship silently.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllComparisonSlugs } from '../src/lib/tire-comparison-links';

const outFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/data/generated/comparison-slug-allowlist.json',
);

const slugs = getAllComparisonSlugs()
  .map(({ slug }) => slug)
  .sort();

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(slugs, null, 2)}\n`);

console.log(`Wrote ${slugs.length} published comparison slugs to ${outFile}`);
