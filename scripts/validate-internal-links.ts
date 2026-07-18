import { resolve } from 'node:path';
import {
  formatInternalLinkReport,
  validateInternalLinks,
  writeInternalLinkReport,
} from '../src/lib/internal-link-validation';

const distDir = resolve(process.cwd(), process.argv[2] ?? 'dist');
const report = validateInternalLinks(distDir);
const outPath = writeInternalLinkReport(distDir, report);

console.log(formatInternalLinkReport(report));
console.log(`Wrote ${outPath}`);

if (report.errors > 0) {
  process.exitCode = 1;
}
