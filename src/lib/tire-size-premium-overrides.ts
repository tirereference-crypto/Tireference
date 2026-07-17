import type { HubFaqItem } from './tire-size-hub';
import type { CostTier } from './tire-size-premium';
import type { QuickTakeData } from './tire-size-quick-take';

export interface PremiumSizeOverride {
  fitmentNotes?: { title: string; points: string[] };
  costTiers?: CostTier[];
  quickTake?: QuickTakeData;
  expertFaq?: HubFaqItem[];
  popularComparisons?: string[];
  upgradeTargets?: string[];
}

const OVERRIDES: Record<string, PremiumSizeOverride> = {
  '275/70R18': {
    fitmentNotes: {
      title: 'Will 275/70R18 Fit My Vehicle?',
      points: [
        'Factory fitment on ¾-ton trucks (F-250, Ram 2500, Silverado 2500HD) and full-size SUVs (Land Cruiser, LX570) with adequate wheel-well volume.',
        'Half-ton pickups (F-150, Tundra, Ram 1500) typically need a 1.5–2.5 in level or lift kit — verify inner-fender and crash-bar clearance at full steering lock.',
        'At 33.16 in overall diameter, switching from 265/70R17 (~31.6 in) adds ~0.78 in ground clearance and +1.7% speedometer error.',
        'Confirm Load Range E for hauling, speed rating for highway use, and TPMS sensor compatibility when upsizing from P-metric OEM tires.',
      ],
    },
    popularComparisons: ['285/70R18', '305/70R18', '275/65R20'],
    upgradeTargets: ['285/70R18', '305/70R18', '315/70R17'],
  },
};

export function getPremiumOverride(size: string): PremiumSizeOverride | null {
  return OVERRIDES[size.toUpperCase()] ?? null;
}
