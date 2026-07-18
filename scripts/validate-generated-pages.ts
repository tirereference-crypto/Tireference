import { resolve } from 'node:path';
import {
  formatGeneratedPageValidationReport,
  validateGeneratedPages,
} from '../src/lib/generated-page-validation';

const distDir = resolve(process.cwd(), process.argv[2] ?? 'dist');
const summary = validateGeneratedPages(distDir);

console.log(formatGeneratedPageValidationReport(summary));

if (summary.errors > 0) {
  process.exitCode = 1;
}
