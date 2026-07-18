/**
 * Mandatory production validation. Runs after `astro build` as part of
 * `npm run build` and exits non-zero when any mandatory check fails, so a
 * broken page set can never reach Cloudflare Pages.
 */
import { resolve } from 'node:path';
import {
  formatProductionValidationReport,
  runProductionValidation,
} from '../src/lib/production-validation';

const distDir = resolve(process.cwd(), process.argv[2] ?? 'dist');
const report = runProductionValidation(distDir);

console.log(formatProductionValidationReport(report));

if (!report.ok) {
  process.exitCode = 1;
}
