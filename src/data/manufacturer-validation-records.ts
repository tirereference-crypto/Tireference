/**
 * Manufacturer-spec validation records for future publication.
 * Keep empty until real manufacturer-published diameters have been checked.
 * Do not display scores, sample sizes, or accuracy percentages from this file.
 */

export interface ManufacturerValidationRecord {
  brand: string;
  model: string;
  size: string;
  calculatedOverallDiameterIn: number;
  manufacturerPublishedOverallDiameterIn: number;
  differenceIn: number;
  manufacturerSourceUrl: string;
  dateChecked: string; // ISO yyyy-mm-dd
}

/** Populated only after independently checked manufacturer specs exist. */
export const MANUFACTURER_VALIDATION_RECORDS: ManufacturerValidationRecord[] = [];

export function hasPublishedValidationResults(): boolean {
  return MANUFACTURER_VALIDATION_RECORDS.length > 0;
}
