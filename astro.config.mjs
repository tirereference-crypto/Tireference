// @ts-check
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

/** Permanent redirects from legacy root-level calculator routes. */
const LEGACY_CALCULATOR_REDIRECTS = {
  '/tire-size-calculator': '/calculators/tire-size-calculator/',
  '/tire-diameter-calculator': '/calculators/tire-diameter-calculator/',
  '/tire-size-comparison': '/calculators/tire-comparison-calculator/',
  '/tire-comparison-calculator': '/calculators/tire-comparison-calculator/',
  '/wheel-offset-calculator': '/calculators/wheel-offset-calculator/',
  '/speedometer-error-calculator': '/calculators/speedometer-error-calculator/',
  '/gear-ratio-calculator': '/calculators/gear-ratio-calculator/',
};

/** Copy generated sitemap-0.xml to /sitemap.xml for robots.txt */
function sitemapXmlAlias() {
  return {
    name: 'sitemap-xml-alias',
    hooks: {
      /**
       * @param {{ dir: URL }} opts
       */
      'astro:build:done': ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const generated = join(outDir, 'sitemap-0.xml');
        const sitemapXml = join(outDir, 'sitemap.xml');
        if (existsSync(generated)) {
          copyFileSync(generated, sitemapXml);
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://tirereference.com',
  trailingSlash: 'always',
  output: 'static',
  integrations: [react(), sitemap(), sitemapXmlAlias()],
  redirects: Object.fromEntries(
    Object.entries(LEGACY_CALCULATOR_REDIRECTS).map(([source, destination]) => [
      source,
      { status: 301, destination },
    ]),
  ),

  vite: {
    plugins: [tailwindcss()],
    // Keep React JSX runtime on the development build during `astro dev`.
    // A poisoned production optimizeDeps cache sets `jsxDEV` to undefined and blanks client islands.
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client'],
    },
  },
});
