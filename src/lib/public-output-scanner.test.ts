import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  formatPublicOutputScanReport,
  publicOutputScanExitCode,
  scanPublicOutput,
  type PublicOutputAllowlistEntry,
} from './public-output-scanner';

let root = '';

function makeRoot(): string {
  const directory = join(
    tmpdir(),
    `tire-public-output-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(directory, { recursive: true });
  return directory;
}

function write(relativePath: string, content: string): void {
  const path = join(root, relativePath);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = '';
});

describe('scanPublicOutput', () => {
  it('fails a rendered placeholder fixture with file, text, line, and rule', () => {
    root = makeRoot();
    write('privacy-policy/index.html', '<h1>Privacy</h1>\n<p>[LEGAL ENTITY NAME]</p>');

    const report = scanPublicOutput(root);

    expect(report.ok).toBe(false);
    expect(publicOutputScanExitCode(report)).toBe(1);
    expect(report.findings).toEqual([
      expect.objectContaining({
        relativeFile: 'privacy-policy/index.html',
        line: 2,
        ruleId: 'legal-entity-name',
        matchedText: '[LEGAL ENTITY NAME]',
      }),
    ]);
    expect(formatPublicOutputScanReport(report)).toContain(
      'privacy-policy/index.html:2:4 [legal-entity-name]',
    );
  });

  it('fails a developer-instruction fixture', () => {
    root = makeRoot();
    write(
      'disclaimer/index.html',
      '<!-- Before enabling ads, set MONETIZATION_ADS_ENABLED in src/data/config.ts -->',
    );

    const report = scanPublicOutput(root);

    expect(report.ok).toBe(false);
    expect(report.findings.map(({ ruleId }) => ruleId)).toEqual(
      expect.arrayContaining([
        'before-enabling-ads',
        'monetization-flag',
        'src-data-path',
      ]),
    );
  });

  it('passes clean fixtures and ignores legitimate placeholder syntax and binary images', () => {
    root = makeRoot();
    write(
      'contact/index.html',
      '<input placeholder="Tire size"><script>const field = {"placeholder":"Email"};</script>',
    );
    write('assets/site.css', 'input::placeholder { color: gray; }');
    write('manifest.webmanifest', '{"name":"Tire Reference"}');
    write('_redirects', '/legacy /current 301');
    write('images/example.png', 'TODO [LEGAL ENTITY NAME]');

    const report = scanPublicOutput(root);

    expect(report.ok).toBe(true);
    expect(publicOutputScanExitCode(report)).toBe(0);
    expect(report.findings).toEqual([]);
    expect(report.filesScanned).toBe(4);
  });

  it('allows an exact match only in its explicitly permitted file', () => {
    root = makeRoot();
    write('approved/metadata.json', '{"documentation":"https://example.com"}');

    const allowlist: PublicOutputAllowlistEntry[] = [
      {
        ruleId: 'example-domain',
        fileScope: 'approved/metadata.json',
        match: 'example.com',
        reason: 'This exact metadata fixture documents an external standards example.',
      },
    ];

    const report = scanPublicOutput(root, { allowlist });
    expect(report.ok).toBe(true);
    expect(report.allowlistedMatches).toBe(1);
  });

  it('fails the same content outside the allowlisted file', () => {
    root = makeRoot();
    write('approved/metadata.json', '{"documentation":"https://example.com"}');
    write('other/metadata.json', '{"documentation":"https://example.com"}');

    const allowlist: PublicOutputAllowlistEntry[] = [
      {
        ruleId: 'example-domain',
        fileScope: 'approved/metadata.json',
        match: 'example.com',
        reason: 'This exact metadata fixture documents an external standards example.',
      },
    ];

    const report = scanPublicOutput(root, { allowlist });
    expect(report.ok).toBe(false);
    expect(report.allowlistedMatches).toBe(1);
    expect(report.findings).toEqual([
      expect.objectContaining({
        relativeFile: 'other/metadata.json',
        ruleId: 'example-domain',
        matchedText: 'example.com',
      }),
    ]);
  });

  it('rejects malformed allowlist entries and missing output directories', () => {
    root = makeRoot();
    expect(() =>
      scanPublicOutput(root, {
        allowlist: [
          {
            ruleId: 'example-domain',
            fileScope: 'approved/metadata.json',
            match: 'example.com',
            reason: 'too short',
          },
        ],
      }),
    ).toThrow(/written reason/i);

    expect(() =>
      scanPublicOutput(root, {
        allowlist: [
          {
            ruleId: 'example-domain',
            fileScope: /.*/,
            match: 'example.com',
            reason: 'This intentionally broad file scope must be rejected by validation.',
          },
        ],
      }),
    ).toThrow(/anchored, narrow file-scope/i);

    expect(() => scanPublicOutput(join(root, 'missing'))).toThrow(/does not exist/i);
  });
});
