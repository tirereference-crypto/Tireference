/**
 * Build-time audit for the preferred production origin across generated SEO
 * output. This validates dist/, not source templates.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { SITE_URL } from './constants';

export interface ProductionHostnameIssue {
  check: string;
  file: string;
  message: string;
}

export interface ProductionHostnameReport {
  issues: ProductionHostnameIssue[];
  filesScanned: number;
  htmlFiles: number;
  canonicalsChecked: number;
  sitemapUrlsChecked: number;
  jsonLdUrlsChecked: number;
  robotsSitemap: string | null;
  ok: boolean;
}

const PUBLIC_METADATA_EXTENSIONS = new Set([
  '.atom',
  '.html',
  '.json',
  '.rss',
  '.txt',
  '.webmanifest',
  '.xml',
]);

function walkPublicMetadataFiles(directory: string, out: string[] = []): string[] {
  if (!existsSync(directory)) {
    throw new Error(`Generated output directory is missing: ${directory}`);
  }
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      walkPublicMetadataFiles(full, out);
    } else if (entry.isFile() && PUBLIC_METADATA_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out.sort();
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1]?.replace(/&amp;/g, '&') ?? null;
}

function publicPath(file: string, distDir: string): string {
  return `/${relative(distDir, file).split('\\').join('/')}`;
}

function collectJsonLdUrlStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdUrlStrings(item, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectJsonLdUrlStrings(item, out);
    }
  }
  return out;
}

function ownedOrForbiddenUrlIssue(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return `localhost URL is not allowed in generated production output: ${url}`;
  }
  if (hostname === 'pages.dev' || hostname.endsWith('.pages.dev')) {
    return `Cloudflare preview URL is not allowed in generated production output: ${url}`;
  }
  if (hostname === 'tirereference.com' || hostname === 'www.tirereference.com') {
    if (parsed.origin !== SITE_URL) {
      return `Tire Reference URL must use the preferred origin ${SITE_URL}: ${url}`;
    }
  }
  return null;
}

export function validateProductionHostnames(distDir: string): ProductionHostnameReport {
  const issues: ProductionHostnameIssue[] = [];
  const issueKeys = new Set<string>();
  const add = (check: string, file: string, message: string) => {
    const key = `${check}\0${file}\0${message}`;
    if (issueKeys.has(key)) return;
    issueKeys.add(key);
    issues.push({ check, file, message });
  };

  const files = walkPublicMetadataFiles(distDir);
  let htmlFiles = 0;
  let canonicalsChecked = 0;
  let sitemapUrlsChecked = 0;
  let jsonLdUrlsChecked = 0;

  for (const file of files) {
    const path = publicPath(file, distDir);
    const content = readFileSync(file, 'utf8');

    // Catch wrong Tire Reference variants, preview hosts, and localhost in all
    // generated public metadata/feed formats, not only in canonical tags.
    for (const match of content.matchAll(/https?:\/\/[^\s"'<>\\]+/gi)) {
      const url = match[0].replace(/[),.;]+$/, '').replace(/&amp;/g, '&');
      const message = ownedOrForbiddenUrlIssue(url);
      if (message) add('public-url-origin', path, message);
    }

    if (extname(file).toLowerCase() !== '.html') continue;
    htmlFiles += 1;

    const canonicalTags = content.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi) ?? [];
    const canonicals = canonicalTags
      .map((tag) => attribute(tag, 'href'))
      .filter((value): value is string => Boolean(value));
    canonicalsChecked += canonicals.length;
    for (const canonical of canonicals) {
      const message = ownedOrForbiddenUrlIssue(canonical);
      if (message) add('canonical-origin', path, message);
      try {
        if (new URL(canonical).origin !== SITE_URL) {
          add('canonical-origin', path, `Canonical must use ${SITE_URL}: ${canonical}`);
        }
      } catch {
        add('canonical-origin', path, `Canonical is not an absolute URL: ${canonical}`);
      }
    }

    const ogTags = content.match(/<meta\b[^>]*>/gi) ?? [];
    const ogUrl = ogTags
      .filter((tag) => attribute(tag, 'property')?.toLowerCase() === 'og:url')
      .map((tag) => attribute(tag, 'content'))
      .find((value): value is string => Boolean(value));
    if (ogUrl) {
      const message = ownedOrForbiddenUrlIssue(ogUrl);
      if (message) add('og-url-origin', path, message);
      if (canonicals.length === 1 && ogUrl !== canonicals[0]) {
        add('og-canonical-parity', path, `og:url "${ogUrl}" differs from canonical "${canonicals[0]}".`);
      }
    }

    for (const match of content.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      let schema: unknown;
      try {
        schema = JSON.parse(match[1]);
      } catch {
        add('json-ld-parse', path, 'JSON-LD script is not valid JSON.');
        continue;
      }
      for (const url of collectJsonLdUrlStrings(schema)) {
        jsonLdUrlsChecked += 1;
        const message = ownedOrForbiddenUrlIssue(url);
        if (message) add('json-ld-origin', path, message);
      }
    }
  }

  for (const sitemapName of ['sitemap-index.xml', 'sitemap-0.xml', 'sitemap.xml']) {
    const file = join(distDir, sitemapName);
    const path = `/${sitemapName}`;
    if (!existsSync(file)) {
      add('sitemap-file', path, `${sitemapName} is missing from generated output.`);
      continue;
    }
    const xml = readFileSync(file, 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) =>
      match[1].trim().replace(/&amp;/g, '&'),
    );
    sitemapUrlsChecked += locs.length;
    for (const loc of locs) {
      let origin: string | null = null;
      try {
        origin = new URL(loc).origin;
      } catch {
        add('sitemap-origin', path, `Sitemap loc is not an absolute URL: ${loc}`);
        continue;
      }
      if (origin !== SITE_URL) {
        add('sitemap-origin', path, `Sitemap loc must use ${SITE_URL}: ${loc}`);
      }
    }
  }

  const robotsFile = join(distDir, 'robots.txt');
  let robotsSitemap: string | null = null;
  if (!existsSync(robotsFile)) {
    add('robots-file', '/robots.txt', 'robots.txt is missing from generated output.');
  } else {
    const robots = readFileSync(robotsFile, 'utf8');
    const declarations = [...robots.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)].map(
      (match) => match[1],
    );
    robotsSitemap = declarations[0] ?? null;
    const expected = `${SITE_URL}/sitemap-index.xml`;
    if (declarations.length !== 1 || declarations[0] !== expected) {
      add(
        'robots-sitemap',
        '/robots.txt',
        `robots.txt must contain exactly one Sitemap declaration for ${expected}.`,
      );
    }
  }

  return {
    issues,
    filesScanned: files.length,
    htmlFiles,
    canonicalsChecked,
    sitemapUrlsChecked,
    jsonLdUrlsChecked,
    robotsSitemap,
    ok: issues.length === 0,
  };
}
