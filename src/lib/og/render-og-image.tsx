import type { ReactElement } from 'react';
import { ImageResponse } from '@vercel/og';
import type { CompareOgData, TireOgData } from './og-data';
import { CompareOgTemplate, FallbackOgTemplate, TireOgTemplate } from './og-templates';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const OG_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, max-age=604800',
  'Vercel-CDN-Cache-Control': 'public, max-age=604800',
};

type FontWeight = 400 | 700;

interface OgFonts {
  regular: ArrayBuffer;
  bold: ArrayBuffer;
}

let fontPromise: Promise<OgFonts> | null = null;

async function loadFonts(): Promise<OgFonts> {
  const [regular, bold] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.0.0/latin-400-normal.woff').then((res) =>
      res.arrayBuffer(),
    ),
    fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.0.0/latin-700-normal.woff').then((res) =>
      res.arrayBuffer(),
    ),
  ]);
  return { regular, bold };
}

async function getFonts(): Promise<OgFonts> {
  if (!fontPromise) fontPromise = loadFonts();
  return fontPromise;
}

function fontConfig(fonts: OgFonts, weight: FontWeight) {
  return {
    name: 'Inter',
    data: weight === 700 ? fonts.bold : fonts.regular,
    weight,
    style: 'normal' as const,
  };
}

async function renderImage(element: ReactElement, title: string): Promise<Response> {
  const fonts = await getFonts();
  return new ImageResponse(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    headers: OG_CACHE_HEADERS,
    fonts: [fontConfig(fonts, 400), fontConfig(fonts, 700)],
  });
}

export async function renderTireOgImage(data: TireOgData): Promise<Response> {
  return renderImage(<TireOgTemplate data={data} />, data.size);
}

export async function renderCompareOgImage(data: CompareOgData): Promise<Response> {
  return renderImage(
    <CompareOgTemplate data={data} />,
    `${data.from} vs ${data.to}`,
  );
}

export async function renderFallbackOgImage(title: string): Promise<Response> {
  return renderImage(<FallbackOgTemplate title={title} />, title);
}

/** Render PNG bytes for build-time pre-generation. */
export async function renderTireOgPng(data: TireOgData): Promise<ArrayBuffer> {
  const response = await renderTireOgImage(data);
  return response.arrayBuffer();
}

export async function renderCompareOgPng(data: CompareOgData): Promise<ArrayBuffer> {
  const response = await renderCompareOgImage(data);
  return response.arrayBuffer();
}
