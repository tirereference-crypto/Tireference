/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type GtagCommand = 'config' | 'event' | 'js' | 'set';

interface Gtag {
  (command: 'config', targetId: string, config?: Record<string, string | number | boolean>): void;
  (command: 'event', eventName: string, eventParameters?: Record<string, string | number>): void;
  (command: 'js', date: Date): void;
  (command: GtagCommand, ...args: unknown[]): void;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: Gtag;
}
