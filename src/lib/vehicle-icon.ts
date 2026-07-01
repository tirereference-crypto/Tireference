import type { HubIconName } from './hub-icons';

/** Infer a vehicle-type icon from manufacturer and model names. */
export function getVehicleIcon(manufacturer: string, model: string): HubIconName {
  const label = `${manufacturer} ${model}`.toLowerCase();

  if (
    /\bf-250\b|\bf-350\b|\b2500\b|\b3500\b|silverado hd|ram 2500|ram 3500|titan xd|tundra/.test(
      label,
    )
  ) {
    return 'truck';
  }

  if (/bronco|wrangler|gladiator|4runner|land cruiser|lx570|sequoia/.test(label)) {
    return 'mountain';
  }

  if (
    /mustang|corvette|camaro|challenger|m3|m4|giulia|wrx|type r|911|supra|gti|focus rs/.test(
      label,
    )
  ) {
    return 'zap';
  }

  return 'car-front';
}
