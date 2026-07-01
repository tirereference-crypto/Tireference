// @ts-check
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

/** Copy generated sitemap-0.xml to /sitemap.xml for robots.txt */
function sitemapXmlAlias() {
  return {
    name: 'sitemap-xml-alias',
    hooks: {
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
  integrations: [react(), sitemap(), sitemapXmlAlias()],

  vite: {
    plugins: [tailwindcss()],
  },
});