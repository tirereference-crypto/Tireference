/**
 * Hub-page availability for tire sizes.
 * Uses the catalog (`TIRE_SIZES`) only — never product master JSON.
 */
import { tireSizeHasHubPage } from './home-hero';

/** True when `/tire-size/{slug}/` is a generated hub page for this size. */
export function hasTireSizeGuide(size: string): boolean {
  return tireSizeHasHubPage(size);
}
