#!/usr/bin/env node
/**
 * Build a client-safe slim availability index from master_size_to_products.json.
 * Allowed brands only; brand-diverse top models per size.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const masterPath = path.join(root, 'src/data/generated/master_size_to_products.json');
const outPath = path.join(root, 'src/data/generated/size-availability-slim.json');

const ALLOWED = ['Michelin', 'Goodyear', 'BFGoodrich', 'Toyo', 'Falken'];
const ALLOWED_SET = new Set(ALLOWED.map((b) => b.toLowerCase()));

function categoryLabel(raw) {
  const c = String(raw || '').toLowerCase();
  if (c.includes('mud')) return 'Mud-Terrain';
  if (c.includes('all_terrain') || c.includes('all-terrain') || c.includes('rugged')) {
    return 'All-Terrain';
  }
  if (c.includes('winter') || c.includes('snow')) return 'Winter';
  if (c.includes('performance') || c.includes('summer') || c.includes('sport')) {
    return 'Performance';
  }
  if (
    c.includes('highway') ||
    c.includes('ht') ||
    c.includes('h/t') ||
    c.includes('touring') ||
    c.includes('alenza') ||
    c.includes('hl')
  ) {
    return 'Highway Terrain';
  }
  if (c.includes('passenger') || c.includes('truck') || c.includes('suv')) return 'Touring';
  return null;
}

const data = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const slim = {};

for (const [slug, products] of Object.entries(data)) {
  const brands = new Set();
  const categories = new Set();
  const groupedByModel = new Map();

  for (const p of products) {
    const brand = (p.brand || '').trim();
    if (!brand || !ALLOWED_SET.has(brand.toLowerCase())) continue;
    brands.add(brand);
    const cat = categoryLabel(p.product_category);
    if (cat) categories.add(cat);

    const model = String(p.model || '')
      .replace(/[®™]/g, '')
      .trim();
    if (!model) continue;

    const key = `${brand}|${model}`.toLowerCase();
    const existing = groupedByModel.get(key);
    if (!existing) {
      groupedByModel.set(key, {
        brand,
        model,
        category: cat,
        loads: new Set(p.load_range ? [String(p.load_range).trim()] : []),
        services: new Set(
          p.service_description ? [String(p.service_description).trim()] : [],
        ),
      });
      continue;
    }
    if (p.load_range) existing.loads.add(String(p.load_range).trim());
    if (p.service_description) existing.services.add(String(p.service_description).trim());
    if (!existing.category && cat) existing.category = cat;
  }

  const allModels = [...groupedByModel.values()].map((g) => ({
    brand: g.brand,
    model: g.model,
    category: g.category,
    loadRange: [...g.loads].sort().join('/') || null,
    service: [...g.services].slice(0, 3).join(' · ') || null,
  }));

  const byBrand = new Map();
  for (const m of allModels) {
    if (!byBrand.has(m.brand)) byBrand.set(m.brand, []);
    byBrand.get(m.brand).push(m);
  }

  if (products.length === 0) continue;

  // Full master-database counts (all brands/models), not capped UI sample.
  const catalogBrands = new Set();
  const catalogModels = new Set();
  for (const p of products) {
    const brand = (p.brand || '').trim();
    if (brand) catalogBrands.add(brand);
    const model = String(p.model || '')
      .replace(/[®™]/g, '')
      .trim();
    if (brand && model) catalogModels.add(`${brand}|${model}`.toLowerCase());
  }

  const brandOrder = ALLOWED.filter((b) => byBrand.has(b));
  const models = [];
  while (models.length < 6) {
    let added = false;
    for (const b of brandOrder) {
      const list = byBrand.get(b);
      const pickAt = models.filter((m) => m.brand === b).length;
      if (pickAt < list.length) {
        models.push(list[pickAt]);
        added = true;
        if (models.length >= 6) break;
      }
    }
    if (!added) break;
  }

  // Include every master size so production badges can use full DB coverage.
  slim[slug] = {
    b: [...brands].sort(),
    c: [...categories].sort(),
    m: models,
    bc: catalogBrands.size,
    mc: catalogModels.size,
    pc: products.length,
  };
}

fs.writeFileSync(outPath, JSON.stringify(slim));
console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes, ${Object.keys(slim).length} sizes)`);
