/**
 * Scan the completed production output for unfinished or sensitive content.
 * This command must run after Astro and the existing production validators.
 */
import { resolve } from 'node:path';
import {
  formatPublicOutputScanReport,
  publicOutputScanExitCode,
  scanPublicOutput,
} from '../src/lib/public-output-scanner';

try {
  const outputDirectory = resolve(process.cwd(), process.argv[2] ?? 'dist');
  const report = scanPublicOutput(outputDirectory);
  console.log(formatPublicOutputScanReport(report));
  process.exitCode = publicOutputScanExitCode(report);
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(`Public output scanner: ERROR\n${message}`);
  process.exitCode = 1;
}
