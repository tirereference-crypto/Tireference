import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TIRE_SIZES } from '../src/data/tire-sizes.ts';
import { getAllComparisonSlugs } from '../src/lib/tire-comparison-links.ts';
import { buildCompareOgData, buildTireOgData } from '../src/lib/og/og-data.ts';
import { renderCompareOgPng, renderTireOgPng } from '../src/lib/og/render-og-image';
import { sizeToSlug } from '../src/lib/tire-size-url.ts';

const OUT_DIR = join(process.cwd(), 'public', 'og', 'prebuilt');
const TIRE_DIR = join(OUT_DIR, 'tire');
const COMPARE_DIR = join(OUT_DIR, 'compare');

async function main() {
  mkdirSync(TIRE_DIR, { recursive: true });
  mkdirSync(COMPARE_DIR, { recursive: true });

  let tireCount = 0;
  let compareCount = 0;

  for (const entry of TIRE_SIZES) {
    const data = buildTireOgData(entry.size);
    if (!data) continue;
    const slug = sizeToSlug(entry.size);
    const png = await renderTireOgPng(data);
    writeFileSync(join(TIRE_DIR, `${slug}.png`), Buffer.from(png));
    tireCount++;
  }

  const expectedCompareFiles = new Set<string>();
  for (const { slug, current, new: newSize } of getAllComparisonSlugs()) {
    const data = buildCompareOgData(current, newSize);
    if (!data) continue;
    const png = await renderCompareOgPng(data);
    writeFileSync(join(COMPARE_DIR, `${slug}.png`), Buffer.from(png));
    expectedCompareFiles.add(`${slug}.png`);
    compareCount++;
  }

  // Remove images for slugs that no longer exist (e.g. reversed duplicates
  // eliminated by canonical pair ordering) so they never ship in dist.
  let staleCount = 0;
  for (const file of readdirSync(COMPARE_DIR)) {
    if (!file.endsWith('.png') || expectedCompareFiles.has(file)) continue;
    rmSync(join(COMPARE_DIR, file));
    staleCount++;
  }

  console.info(
    `Generated ${tireCount} tire OG images and ${compareCount} comparison OG images.` +
      (staleCount ? ` Removed ${staleCount} stale comparison OG images.` : ''),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
