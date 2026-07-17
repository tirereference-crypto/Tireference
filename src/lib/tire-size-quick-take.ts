import type { TireCategory } from '../data/tire-sizes';
import type { TireSizeHubData } from './tire-size-hub';
import { getPremiumOverride } from './tire-size-premium-overrides';

export interface QuickTakeData {
  bestFor: string[];
  considerAnotherSizeIf: string[];
}

const QUICK_TAKE_BY_SIZE: Record<string, QuickTakeData> = {
  '275/70R18': {
    bestFor: [
      'Near-33-inch truck tire with meaningful sidewall, stronger load-range availability, and broad all-terrain coverage.',
      'Daily-driven pickups and body-on-frame SUVs that also see towing, gravel, trails, or overland use.',
      'Owners who want more clearance and load capacity without stepping into a full 35-inch setup.',
    ],
    considerAnotherSizeIf: [
      'Fuel economy, light steering, and factory-like ride comfort matter more than clearance and tire strength.',
      'You prefer a smaller, more stock look or the quietest possible highway commute.',
      'You are building a dedicated rock-crawler that needs the largest tire possible regardless of daily drivability.',
    ],
  },
};

function buildCategoryQuickTake(hub: TireSizeHubData): QuickTakeData {
  const size = hub.displaySize;
  const category = hub.entry.category;
  const tallSidewall = hub.specs.aspectRatio >= 60;
  const lowProfile = hub.specs.aspectRatio <= 50;

  switch (category) {
    case 'off-road':
      return {
        bestFor: [
          `Owners stepping up from factory truck or SUV tires who want more clearance and trail confidence without a full oversized build.`,
          'Mixed pavement and gravel use where airing down and obstacle clearance matter on weekend trips.',
          tallSidewall
            ? 'Drivers who value sidewall compliance on washboard roads and rocky approaches.'
            : 'Drivers who want a more capable stance while keeping reasonable on-road manners.',
          'Overlanding setups that balance highway transfers with moderate off-road terrain.',
        ],
        considerAnotherSizeIf: [
          'Maximum fuel economy and the quietest highway commute are your top priorities.',
          'You are building a dedicated rock-crawling rig that needs the largest tire possible.',
          'Your vehicle has tight wheel wells and you cannot accommodate any lift or trim work.',
        ],
      };
    case 'light-truck':
      return {
        bestFor: [
          `Truck owners who tow, haul, or run loaded beds and need durable rubber with confident highway stability.`,
          'Daily-driven pickups that see jobsite gravel, ranch roads, and long interstate miles.',
          'Replacing worn factory LT or all-terrain tires with a size that preserves load capacity.',
          tallSidewall
            ? 'Drivers who want extra impact absorption on rough rural roads without sacrificing load rating.'
            : 'Drivers who want a work-ready footprint with predictable steering on paved highways.',
        ],
        considerAnotherSizeIf: [
          'You rarely tow or haul and want the lowest rolling resistance for commuting.',
          'You need maximum off-road articulation and are considering a dedicated mud-terrain upsize.',
          'Your truck has limited clearance and rubbing occurs at full steering lock.',
        ],
      };
    case 'SUV':
      return {
        bestFor: [
          `Crossover and SUV owners who want balanced comfort, all-weather confidence, and light trail capability.`,
          'Family vehicles that handle school runs, road trips, and seasonal camping on forest-service roads.',
          tallSidewall
            ? 'Drivers who prefer a smoother ride over broken pavement and driveway transitions.'
            : 'Drivers who want a stable highway footprint with moderate adventure versatility.',
          'Replacing OEM tires with a size that keeps speedometer accuracy within a safe range.',
        ],
        considerAnotherSizeIf: [
          'You want the sharpest handling response and lowest-profile sport-compound feel.',
          'You need dedicated rock-crawling capability beyond light gravel and snow.',
          'Your crossover was never designed for plus-sizing and clearance is already tight.',
        ],
      };
    case 'performance':
      return {
        bestFor: [
          `Enthusiasts who want sharper turn-in, stronger lateral grip, and a sport-focused contact patch.`,
          'Sport sedans, coupes, and hot hatches used on twisty roads and occasional track days.',
          lowProfile
            ? 'Drivers who accept firmer ride quality in exchange for precise steering feedback.'
            : 'Drivers upgrading from comfort-biased OEM rubber who want more responsive handling.',
          'Warm-weather driving where dry and wet pavement grip matter most.',
        ],
        considerAnotherSizeIf: [
          'Ride comfort on rough city streets is your highest priority.',
          'You drive frequently in snow or near-freezing temperatures without a dedicated winter set.',
          'You want maximum fuel economy from low rolling resistance touring compounds.',
        ],
      };
    default:
      return {
        bestFor: [
          `Daily commuters who want predictable wet-weather grip and low cabin noise on ${size}.`,
          'Sedan and compact owners replacing worn OEM tires with a size matched to the door placard.',
          tallSidewall
            ? 'Drivers who prioritize comfort over sharp handling on rough urban pavement.'
            : 'Drivers who want balanced efficiency and comfort for mixed city and highway use.',
          'Budget-conscious owners who need widely available replacement options at most tire shops.',
        ],
        considerAnotherSizeIf: [
          'You want aggressive off-road capability or a lifted truck stance.',
          'You need maximum cornering grip from a dedicated performance compound.',
          'You are upsizing diameter significantly and have not verified fitment clearance.',
        ],
      };
  }
}

export function buildQuickTakeForSize(hub: TireSizeHubData): QuickTakeData {
  const override = getPremiumOverride(hub.entry.size);
  if (override?.quickTake) return override.quickTake;
  return QUICK_TAKE_BY_SIZE[hub.entry.size.toUpperCase()] ?? buildCategoryQuickTake(hub);
}

/** Condensed use-case summary for the hero — merges Quick Take with typical usage tags. */
export interface HeroUseSummary {
  typicalUses: string[];
  bestFor: string[];
  considerIf: string[];
}

export function buildHeroUseSummary(hub: TireSizeHubData): HeroUseSummary {
  const quickTake = buildQuickTakeForSize(hub);
  return {
    typicalUses: hub.typicalUses,
    bestFor: quickTake.bestFor.slice(0, 3),
    considerIf: quickTake.considerAnotherSizeIf.slice(0, 2),
  };
}

/** @deprecated Use buildQuickTakeForSize */
export function getQuickTakeForSize(size: string): QuickTakeData | null {
  return QUICK_TAKE_BY_SIZE[size.toUpperCase()] ?? null;
}
