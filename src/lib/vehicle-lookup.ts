import { TIRE_SIZES } from '../data/tire-sizes';
import { getVehicleFitment } from '../data/vehicle-fitment';
import { hubPagePath } from './tire-size-url';

export interface VehicleSelection {
  year: string;
  make: string;
  model: string;
  trim: string;
}

interface VehicleRecord {
  year: number;
  make: string;
  model: string;
  trim: string;
  sizes: string[];
}

function parseYearRange(yearRange: string): number[] {
  const match = yearRange.trim().match(/(\d{4})\s*[–-]\s*(\d{4})/);
  if (!match) return [];
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
}

function buildVehicleRecords(): VehicleRecord[] {
  const map = new Map<string, VehicleRecord>();

  for (const entry of TIRE_SIZES) {
    for (const fitment of getVehicleFitment(entry.size)) {
      for (const year of parseYearRange(fitment.yearRange)) {
        const key = `${year}|${fitment.manufacturer}|${fitment.model}|${fitment.trim}`;
        const existing = map.get(key);
        if (existing) {
          if (!existing.sizes.includes(entry.size)) existing.sizes.push(entry.size);
        } else {
          map.set(key, {
            year,
            make: fitment.manufacturer,
            model: fitment.model,
            trim: fitment.trim,
            sizes: [entry.size],
          });
        }
      }
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return `${a.make}${a.model}${a.trim}`.localeCompare(`${b.make}${b.model}${b.trim}`);
  });
}

const VEHICLE_RECORDS = buildVehicleRecords();

export function getVehicleYears(): string[] {
  return [...new Set(VEHICLE_RECORDS.map((record) => String(record.year)))].sort(
    (a, b) => Number(b) - Number(a),
  );
}

export function getVehicleMakes(year: string): string[] {
  return [
    ...new Set(
      VEHICLE_RECORDS.filter((record) => String(record.year) === year).map((record) => record.make),
    ),
  ].sort();
}

export function getVehicleModels(year: string, make: string): string[] {
  return [
    ...new Set(
      VEHICLE_RECORDS.filter(
        (record) => String(record.year) === year && record.make === make,
      ).map((record) => record.model),
    ),
  ].sort();
}

export function getVehicleTrims(year: string, make: string, model: string): string[] {
  return VEHICLE_RECORDS.filter(
    (record) =>
      String(record.year) === year && record.make === make && record.model === model,
  )
    .map((record) => record.trim)
    .sort();
}

export function resolveVehicleLookup(selection: VehicleSelection): string {
  const year = Number(selection.year);
  const record = VEHICLE_RECORDS.find(
    (item) =>
      item.year === year &&
      item.make === selection.make &&
      item.model === selection.model &&
      item.trim === selection.trim,
  );

  if (record?.sizes[0]) return hubPagePath(record.sizes[0]);
  return '/tire-sizes';
}
