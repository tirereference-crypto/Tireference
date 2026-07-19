import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

export interface PublicOutputRule {
  id: string;
  description: string;
  pattern: RegExp;
}

export interface PublicOutputAllowlistEntry {
  ruleId: string;
  /** Exact relative file path or a narrowly scoped regular expression. */
  fileScope: string | RegExp;
  /** Exact matched text or a narrowly scoped regular expression. */
  match: string | RegExp;
  /** Written justification; short or empty reasons are rejected. */
  reason: string;
}

export interface PublicOutputFinding {
  file: string;
  relativeFile: string;
  line: number;
  column: number;
  ruleId: string;
  ruleDescription: string;
  matchedText: string;
}

export interface PublicOutputScanReport {
  root: string;
  filesScanned: number;
  bytesScanned: number;
  findings: PublicOutputFinding[];
  allowlistedMatches: number;
  ok: boolean;
}

/**
 * Text formats generated into dist/ and publicly retrievable after deploy.
 * Binary image/font formats are intentionally absent. SVG is text XML, so it
 * is scanned even though browsers can render it as an image.
 */
export const PUBLIC_OUTPUT_TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

const PUBLIC_OUTPUT_TEXT_FILENAMES = new Set(['_headers', '_redirects']);

export const PUBLIC_OUTPUT_RULES: readonly PublicOutputRule[] = [
  {
    id: 'legal-entity-name',
    description: 'unfinished legal entity name',
    pattern: /\[LEGAL ENTITY NAME\]/gi,
  },
  {
    id: 'contact-address',
    description: 'unfinished contact address',
    pattern: /\[CONTACT ADDRESS\]/gi,
  },
  {
    id: 'data-controller-name',
    description: 'unfinished data controller name',
    pattern: /\[DATA CONTROLLER NAME\]/gi,
  },
  {
    id: 'jurisdiction',
    description: 'unfinished jurisdiction',
    pattern: /\[JURISDICTION\]/gi,
  },
  {
    id: 'state-country',
    description: 'unfinished state or country',
    pattern: /\[STATE\/COUNTRY\]/gi,
  },
  {
    id: 'venue-placeholder',
    description: 'unfinished legal venue',
    pattern: /\[VENUE PLACEHOLDER\]/gi,
  },
  {
    id: 'placeholder',
    description: 'generic unfinished placeholder marker',
    // Ignore legitimate HTML/JS `placeholder=` / `"placeholder":` syntax and
    // CSS `.placeholder` / `::placeholder` selectors, but catch visible text,
    // comments, metadata, and string values containing the marker.
    pattern: /(?<![.:#\w-])placeholder\b(?!["']?\s*[:=])/gi,
  },
  {
    id: 'todo',
    description: 'unfinished TODO marker',
    pattern: /(?<![.#\w-])todo\b/gi,
  },
  {
    id: 'fixme',
    description: 'unfinished FIXME marker',
    pattern: /(?<![.#\w-])fixme\b/gi,
  },
  {
    id: 'lorem-ipsum',
    description: 'Lorem ipsum filler copy',
    pattern: /\blorem\s+ipsum\b/gi,
  },
  {
    id: 'before-enabling-ads',
    description: 'internal advertising enablement instruction',
    pattern: /\bbefore\s+enabling\s+ads\b/gi,
  },
  {
    id: 'before-enabling-affiliates',
    description: 'internal affiliate enablement instruction',
    pattern: /\bbefore\s+enabling\s+affiliates\b/gi,
  },
  {
    id: 'monetization-flag',
    description: 'internal monetization flag',
    pattern: /\bMONETIZATION_[A-Z0-9_]*\b/gi,
  },
  {
    id: 'src-data-path',
    description: 'internal src/data path',
    pattern: /\bsrc\/data\//gi,
  },
  {
    id: 'src-pages-path',
    description: 'internal src/pages path',
    pattern: /\bsrc\/pages\//gi,
  },
  {
    id: 'process-env',
    description: 'server environment access expression',
    pattern: /\bprocess\.env\b/gi,
  },
  {
    id: 'import-meta-env',
    description: 'build environment access expression',
    pattern: /\bimport\.meta\.env\b/gi,
  },
  {
    id: 'localhost',
    description: 'localhost development reference',
    pattern: /\blocalhost(?::\d{1,5})?\b/gi,
  },
  {
    id: 'example-domain',
    description: 'example.com placeholder domain',
    pattern: /\bexample\.com\b/gi,
  },
  {
    id: 'your-token',
    description: 'unfinished YOUR_* replacement token',
    pattern: /\bYOUR_[A-Z0-9_]+\b/gi,
  },
  {
    id: 'replace-me',
    description: 'unfinished REPLACE_ME token',
    pattern: /\bREPLACE_ME\b/gi,
  },
  {
    id: 'insert-token',
    description: 'unfinished INSERT_* replacement token',
    pattern: /\bINSERT_[A-Z0-9_]+\b/gi,
  },
  {
    id: 'tbd',
    description: 'unfinished TBD marker',
    pattern: /(?<![.\w-])TBD\b/gi,
  },
] as const;

/** No production exceptions are currently required. */
export const PUBLIC_OUTPUT_ALLOWLIST: readonly PublicOutputAllowlistEntry[] = [];

function normalizeRelativePath(path: string): string {
  return path.split(sep).join('/');
}

function exactOrPatternMatches(value: string, expected: string | RegExp): boolean {
  if (typeof expected === 'string') return value === expected;
  const pattern = new RegExp(expected.source, expected.flags.replaceAll('g', ''));
  return pattern.test(value);
}

function validateAllowlist(
  allowlist: readonly PublicOutputAllowlistEntry[],
  rules: readonly PublicOutputRule[],
): void {
  const ruleIds = new Set(rules.map(({ id }) => id));
  if (ruleIds.size !== rules.length) {
    throw new Error('Public-output rule IDs must be unique.');
  }
  for (const rule of rules) {
    if (!rule.pattern.ignoreCase) {
      throw new Error(`Public-output rule "${rule.id}" must be case-insensitive.`);
    }
  }

  for (const [index, entry] of allowlist.entries()) {
    if (!ruleIds.has(entry.ruleId)) {
      throw new Error(`Public-output allowlist entry ${index} references unknown rule "${entry.ruleId}".`);
    }
    if (typeof entry.fileScope === 'string' && entry.fileScope.trim().length === 0) {
      throw new Error(`Public-output allowlist entry ${index} has an empty file scope.`);
    }
    if (typeof entry.match === 'string' && entry.match.length === 0) {
      throw new Error(`Public-output allowlist entry ${index} has an empty match.`);
    }
    if (entry.fileScope instanceof RegExp) {
      const source = entry.fileScope.source;
      if (
        !source.startsWith('^') ||
        !source.endsWith('$') ||
        /^(?:\^)?(?:\.\*|\[\\s\\S\]\*)(?:\$)?$/.test(source)
      ) {
        throw new Error(
          `Public-output allowlist entry ${index} must use an anchored, narrow file-scope pattern.`,
        );
      }
    }
    if (
      entry.match instanceof RegExp &&
      /^(?:\^)?(?:\.\*|\[\\s\\S\]\*)(?:\$)?$/.test(entry.match.source)
    ) {
      throw new Error(
        `Public-output allowlist entry ${index} cannot use a match-all pattern.`,
      );
    }
    if (entry.reason.trim().length < 20) {
      throw new Error(
        `Public-output allowlist entry ${index} must include a written reason of at least 20 characters.`,
      );
    }
  }
}

function collectPublicTextFiles(root: string): string[] {
  if (!existsSync(root)) {
    throw new Error(`Public output directory does not exist: ${root}`);
  }

  const files: string[] = [];
  const visit = (directory: string) => {
    const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        const lowerName = entry.name.toLowerCase();
        const isNamedPublicText =
          PUBLIC_OUTPUT_TEXT_FILENAMES.has(lowerName) ||
          lowerName.includes('manifest') ||
          lowerName.includes('metadata');
        if (
          PUBLIC_OUTPUT_TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase()) ||
          isNamedPublicText
        ) {
          files.push(path);
        }
      } else {
        throw new Error(`Unsupported filesystem entry in public output: ${path}`);
      }
    }
  };

  visit(root);
  return files;
}

function locationAt(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  const lastNewline = before.lastIndexOf('\n');
  return {
    line: before.split('\n').length,
    column: index - lastNewline,
  };
}

function isAllowlisted(
  finding: PublicOutputFinding,
  allowlist: readonly PublicOutputAllowlistEntry[],
): boolean {
  return allowlist.some(
    (entry) =>
      entry.ruleId === finding.ruleId &&
      exactOrPatternMatches(finding.relativeFile, entry.fileScope) &&
      exactOrPatternMatches(finding.matchedText, entry.match),
  );
}

export function scanPublicOutput(
  outputDirectory: string,
  options: {
    rules?: readonly PublicOutputRule[];
    allowlist?: readonly PublicOutputAllowlistEntry[];
  } = {},
): PublicOutputScanReport {
  const root = resolve(outputDirectory);
  const rules = options.rules ?? PUBLIC_OUTPUT_RULES;
  const allowlist = options.allowlist ?? PUBLIC_OUTPUT_ALLOWLIST;
  validateAllowlist(allowlist, rules);

  const files = collectPublicTextFiles(root);
  const findings: PublicOutputFinding[] = [];
  let bytesScanned = 0;
  let allowlistedMatches = 0;

  for (const file of files) {
    // readFileSync errors intentionally propagate and fail the scanner.
    const content = readFileSync(file, 'utf8');
    bytesScanned += Buffer.byteLength(content, 'utf8');
    const relativeFile = normalizeRelativePath(relative(root, file));

    for (const rule of rules) {
      const flags = `${rule.pattern.flags.replaceAll('g', '')}g`;
      const pattern = new RegExp(rule.pattern.source, flags);
      for (const match of content.matchAll(pattern)) {
        if (match.index === undefined || !match[0]) continue;
        const location = locationAt(content, match.index);
        const finding: PublicOutputFinding = {
          file,
          relativeFile,
          line: location.line,
          column: location.column,
          ruleId: rule.id,
          ruleDescription: rule.description,
          matchedText: match[0],
        };

        if (isAllowlisted(finding, allowlist)) {
          allowlistedMatches += 1;
        } else {
          findings.push(finding);
        }
      }
    }
  }

  return {
    root,
    filesScanned: files.length,
    bytesScanned,
    findings,
    allowlistedMatches,
    ok: findings.length === 0,
  };
}

export function formatPublicOutputScanReport(report: PublicOutputScanReport): string {
  const lines = [
    `Public output scanner: ${report.ok ? 'PASS' : 'FAIL'}`,
    `Scanned ${report.filesScanned} text files (${report.bytesScanned} bytes) under ${report.root}.`,
  ];

  if (report.allowlistedMatches > 0) {
    lines.push(`Allowlisted matches: ${report.allowlistedMatches}.`);
  }

  for (const finding of report.findings) {
    lines.push(
      `${finding.file}:${finding.line}:${finding.column} ` +
        `[${finding.ruleId}] ${finding.ruleDescription}`,
      `  matched: ${JSON.stringify(finding.matchedText)}`,
    );
  }

  if (!report.ok) {
    lines.push(`Found ${report.findings.length} prohibited public-output match(es).`);
  }

  return lines.join('\n');
}

export function publicOutputScanExitCode(report: PublicOutputScanReport): 0 | 1 {
  return report.ok ? 0 : 1;
}
