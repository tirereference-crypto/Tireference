import { mkdirSync, writeFileSync } from 'node:fs';
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

  for (const { slug, current, new: newSize } of getAllComparisonSlugs()) {
    const data = buildCompareOgData(current, newSize);
    if (!data) continue;
    const png = await renderCompareOgPng(data);
    writeFileSync(join(COMPARE_DIR, `${slug}.png`), Buffer.from(png));
    compareCount++;
  }

  console.info(`Generated ${tireCount} tire OG images and ${compareCount} comparison OG images.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
