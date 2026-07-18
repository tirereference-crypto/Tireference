import type { TireCategory } from '../data/tire-sizes';
import { getTireSpecs, type TireSpecs } from './tire-math';
import type { HubFaqItem } from './tire-size-hub';
import { getExpertFaqForSize } from './tire-size-faq-expert';
import { getExpertIntroForTireSize } from './tire-size-expert-intro';
import { getTireSizeDataCoverage } from './tire-size-products';

export interface HeroHighlight {
  label: string;
  value: string;
  unit?: string;
}

export interface PremiumSpecCard {
  icon: 'diameter' | 'width' | 'sidewall' | 'circumference' | 'revs';
  label: string;
  value: string;
  unit: string;
  explanation: string;
}

export interface SummaryBarItem {
  label: string;
  value: string;
}

function fmt(size: string): string {
  return size.replace(/^lt/i, 'LT').replace(/^p/i, 'P');
}

/** Cap hub intros to a short paragraph for the size page. */
export function shortenHubIntro(intro: string, maxSentences = 3): string {
  const trimmed = intro.replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;
  // Split only at actual sentence boundaries. A punctuation-only matcher
  // corrupts decimal measurements such as 24.5" into "24. 5".
  const parts = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/);
  if (parts.length <= maxSentences) return trimmed;
  return parts.slice(0, maxSentences).join(' ').trim();
}

interface IntroTraits {
  sizeLabel: string;
  inchCategory: string | null;
  profilePhrase: string;
  footprintPhrase: string;
}

function deriveIntroTraits(size: string, specs: TireSpecs): IntroTraits {
  const d = specs.overallDiameterIn;
  let inchCategory: string | null = null;
  if (d >= 36.5 && d <= 37.5) inchCategory = '37-inch tire category';
  else if (d >= 34.5 && d <= 35.5) inchCategory = '35-inch tire category';
  else if (d >= 32.5 && d <= 33.5) inchCategory = '33-inch tire category';
  else if (d >= 31.5 && d <= 32.5) inchCategory = '32-inch tire category';
  else if (d >= 29.5 && d <= 30.5) inchCategory = '30-inch tire category';
  else if (d >= 27.5 && d <= 28.5) inchCategory = '28-inch tire category';
  else if (d >= 33) inchCategory = 'larger-diameter tire class';

  const profilePhrase =
    specs.aspectRatio <= 45
      ? 'low-profile setup'
      : specs.aspectRatio >= 65
        ? 'tall sidewall setup'
        : 'moderate-profile setup';

  const footprintPhrase =
    specs.widthMm >= 275
      ? 'wide footprint'
      : specs.widthMm <= 215
        ? 'narrow footprint'
        : 'moderate footprint';

  return { sizeLabel: fmt(size), inchCategory, profilePhrase, footprintPhrase };
}

function inchLead(traits: IntroTraits): string {
  return traits.inchCategory
    ? `Sitting in the ${traits.inchCategory}, it `
    : 'It ';
}

function buildPerformanceIntro(traits: IntroTraits): string {
  const profileNote =
    traits.profilePhrase === 'low-profile setup'
      ? 'That short sidewall geometry limits flex under load transfer, giving sport sedans, coupes, and hot hatches the crisp turn-in and lateral stability enthusiasts expect.'
      : 'The sidewall balance here still favors response over plush isolation, making it a common upgrade for drivers who want sharper feedback without fully committing to a track-oriented compound.';

  return `The ${traits.sizeLabel} belongs to the performance tire segment where steering precision and cornering confidence matter more than maximum ride softness. Drivers choose this size when they want a ${traits.profilePhrase} with a ${traits.footprintPhrase} that responds quickly to input and holds a predictable line through fast transitions. ${profileNote} Tradeoffs are real: impact harshness increases on rough pavement, and winter traction can suffer compared with taller, more compliant alternatives. For enthusiasts prioritizing handling feel over everyday isolation, ${traits.sizeLabel} remains a well-regarded fitment in the performance market.`;
}

function buildPassengerIntro(traits: IntroTraits): string {
  const footprintNote =
    traits.footprintPhrase === 'narrow footprint'
      ? 'The narrower contact patch helps keep rolling resistance and steering effort low — priorities for compact and midsize sedans.'
      : 'The footprint supports stable highway cruising without the weight and drag penalties of oversized light-truck fitments.';

  return `The ${traits.sizeLabel} is a passenger-market size aimed at drivers who value comfort, efficiency, and predictable daily behavior over aggressive styling or trail capability. ${inchLead(traits)}occupies the mainstream replacement space where OEM fitments emphasize low noise, smooth ride quality, and sensible fuel economy. ${footprintNote} With its ${traits.profilePhrase}, this size absorbs everyday road imperfections better than stiff low-profile alternatives while avoiding the bulk that larger SUV and truck tires add. It is a practical choice for commuting, family errands, and long highway miles where reliability and operating cost outweigh maximum grip or ground clearance.`;
}

function buildSuvIntro(traits: IntroTraits): string {
  const adventureNote =
    traits.profilePhrase === 'tall sidewall setup'
      ? 'The taller sidewall adds compliance for light trails and unpaved access roads without the harshness of a performance-oriented series.'
      : 'The sidewall height preserves enough compliance for driveway transitions and light gravel while maintaining crossover-friendly handling.';

  return `The ${traits.sizeLabel} is a crossover and SUV fitment that balances everyday comfort with the versatility owners expect from a do-it-all family vehicle. ${inchLead(traits)}sits in a popular middle ground: enough stature for a confident road presence and modest trail capability, yet restrained enough to keep steering effort, fuel use, and cabin noise in check. ${adventureNote} Drivers often land here when they want a ${traits.footprintPhrase} that handles school runs and road trips cleanly, then still feels capable on seasonal camping trips or forest-service roads. It is less specialized than a dedicated off-road build, but more adaptable than a pure commuter tire.`;
}

function buildLightTruckIntro(traits: IntroTraits): string {
  const dutyNote =
    traits.footprintPhrase === 'wide footprint'
      ? 'The wider section supports confident traction when a trailer is hitched or a bed is loaded.'
      : 'The footprint is sized for work-truck duty cycles where even wear and predictable braking matter under variable loads.';

  return `The ${traits.sizeLabel} is a light-truck size chosen for durability, load capacity, and towing confidence rather than sporty handling or maximum fuel economy. ${inchLead(traits)}targets owners who need a tire that tolerates payload swings, long highway pulls, and jobsite debris without giving up reasonable on-road manners. ${dutyNote} With its ${traits.profilePhrase}, it resists the sidewall damage that plagues softer passenger compounds when pressures drop or curbs bite. Tradeoffs include higher mass and rolling resistance than compact-car fitments, but for half-ton and midsize truck applications, ${traits.sizeLabel} remains a dependable anchor size in the replacement market.`;
}

function buildOffRoadIntro(traits: IntroTraits): string {
  const sidewallNote =
    traits.profilePhrase === 'tall sidewall setup'
      ? 'The tall sidewall also provides additional compliance over rough terrain, helping absorb impacts that would otherwise be transmitted through lower-profile tire setups.'
      : 'The sidewall height still offers more cushion than performance-oriented alternatives, which helps on rocky approaches and washboard surfaces.';

  const inchNote = traits.inchCategory?.includes('33-inch')
    ? 'one of the most popular larger-diameter tire sizes for truck and SUV owners because it delivers meaningful increases in ride height and off-road capability without pushing into the extreme territory of oversized builds. '
    : 'a common upgrade path for truck and SUV owners who want more ride height and trail capability without jumping to an extreme oversized build. ';

  return `The ${traits.sizeLabel} is ${inchNote}${inchLead(traits)}represents a balance point where drivers gain additional ground clearance, improved obstacle approach characteristics, and a more aggressive stance while still maintaining reasonable road manners, fuel economy, and gearing behavior. ${sidewallNote} With its ${traits.footprintPhrase}, this size suits drivers bridging everyday usability and adventure-oriented performance. As a result, ${traits.sizeLabel} is frequently considered when overlanding, weekend trail use, or a taller stance are goals—but full-size truck compromises on pavement are still a consideration.`;
}

export function buildCategoryIntro(
  size: string,
  specs: TireSpecs,
  category: TireCategory,
  _flotation: string,
): string {
  const sizeKey = fmt(size);
  const expertIntro = getExpertIntroForTireSize(
    { size: sizeKey, specs, category },
    sizeKey.toUpperCase() === '275/70R18' ? getTireSizeDataCoverage(sizeKey) : null,
  );
  if (expertIntro) return expertIntro;

  const traits = deriveIntroTraits(size, specs);

  switch (category) {
    case 'performance':
      return buildPerformanceIntro(traits);
    case 'SUV':
      return buildSuvIntro(traits);
    case 'off-road':
      return buildOffRoadIntro(traits);
    case 'light-truck':
      return buildLightTruckIntro(traits);
    default:
      return buildPassengerIntro(traits);
  }
}

export function buildHeroHighlights(
  specs: TireSpecs,
  flotation: string,
): HeroHighlight[] {
  return [
    {
      label: 'Overall diameter',
      value: specs.overallDiameterIn.toFixed(2),
      unit: 'in',
    },
    {
      label: 'Revolutions',
      value: String(Math.round(specs.revsPerMile)),
      unit: 'revs/mi',
    },
    {
      label: 'Section width',
      value: specs.sectionWidthIn.toFixed(2),
      unit: 'in',
    },
    {
      label: 'Flotation equiv.',
      value: flotation,
    },
  ];
}

export function buildPremiumSpecCards(specs: TireSpecs): PremiumSpecCard[] {
  return [
    {
      icon: 'diameter',
      label: 'Overall diameter',
      value: specs.overallDiameterIn.toFixed(2),
      unit: 'in',
      explanation: 'Determines ride height, gearing, and speedometer accuracy.',
    },
    {
      icon: 'width',
      label: 'Section width',
      value: specs.sectionWidthIn.toFixed(2),
      unit: 'in',
      explanation: 'Affects traction footprint and steering effort.',
    },
    {
      icon: 'sidewall',
      label: 'Sidewall height',
      value: specs.sidewallIn.toFixed(2),
      unit: 'in',
      explanation: 'More sidewall = more compliance; less = sharper response.',
    },
    {
      icon: 'circumference',
      label: 'Circumference',
      value: specs.circumferenceIn.toFixed(2),
      unit: 'in',
      explanation: 'Directly drives revs/mile and odometer calibration.',
    },
    {
      icon: 'revs',
      label: 'Revolutions / mile',
      value: String(Math.round(specs.revsPerMile)),
      unit: 'revs',
      explanation: 'Fewer revs = slightly better highway fuel efficiency.',
    },
  ];
}

export function buildSummaryBar(
  category: TireCategory,
  categoryLabel: string,
  specs: TireSpecs,
  flotation: string,
  vehicleNames: string[],
): SummaryBarItem[] {
  const clearanceImpact =
    category === 'off-road' || category === 'light-truck'
      ? 'High'
      : category === 'SUV'
        ? 'Moderate'
        : category === 'performance'
          ? 'Low'
          : 'Minimal';

  return [
    { label: 'Category', value: categoryLabel },
    { label: 'Diameter', value: `${specs.overallDiameterIn.toFixed(2)} in` },
    { label: 'Clearance impact', value: clearanceImpact },
    { label: 'Flotation', value: flotation },
    {
      label: 'Typical vehicles',
      value:
        vehicleNames.length > 0
          ? vehicleNames.slice(0, 3).join(', ')
          : 'See fitment below',
    },
  ];
}

export function buildTypicalUses(category: TireCategory): string[] {
  switch (category) {
    case 'performance':
      return [
        'Sport sedans',
        'Autocross',
        'Spirited driving',
        'Hot hatches',
        'Track days',
      ];
    case 'SUV':
      return [
        'Daily driving',
        'Family hauling',
        'Light trails',
        'Crossover comfort',
      ];
    case 'off-road':
      return [
        'Overlanding',
        'Trail driving',
        'Truck upgrades',
        'Rock crawling',
        'Off-road travel',
      ];
    case 'light-truck':
      return [
        'Towing',
        'Payload hauling',
        'Work trucks',
        'Highway cruising',
      ];
    default:
      return [
        'Commuting',
        'Fuel economy',
        'Daily transportation',
        'OEM replacement',
      ];
  }
}

export function buildCategoryFaq(
  size: string,
  specs: TireSpecs,
  category: TireCategory,
  flotation: string,
  closestSize: string | null,
  closestDiffPct: number | null,
): HubFaqItem[] {
  const expertFaq = getExpertFaqForSize(fmt(size));
  if (expertFaq) {
    return expertFaq;
  }

  const d = specs.overallDiameterIn.toFixed(2);
  const sw = specs.sidewallIn.toFixed(2);
  const w = specs.sectionWidthIn.toFixed(2);
  const inch33 = specs.overallDiameterIn >= 32.5 && specs.overallDiameterIn <= 33.5;

  switch (category) {
    case 'off-road':
      return [
        {
          question: `Is ${fmt(size)} considered a 33-inch tire?`,
          answer: inch33
            ? `Yes — at ${d} in overall diameter, ${fmt(size)} falls in the 33-inch class (${specs.overallDiameterMm.toFixed(0)} mm). Flotation equivalent: ${flotation}.`
            : `${fmt(size)} measures ${d} in overall — ${inch33 ? 'within' : 'outside'} the common 33-inch reference range. Closest flotation: ${flotation}.`,
        },
        {
          question: `What flotation size is closest to ${fmt(size)}?`,
          answer: `${flotation} is the direct flotation equivalent (${d} in diameter, ${w} in section width on ${specs.wheelDiameterIn} in wheel).`,
        },
        {
          question: `How much ground clearance does ${fmt(size)} add vs a smaller tire?`,
          answer: `Each 1 in of overall diameter adds ~0.5 in ground clearance at the axle. At ${d} in (${specs.overallDiameterMm.toFixed(0)} mm), compare your current size in the comparison tool — diameter differences map directly to clearance change ÷ 2.`,
        },
      ];
    case 'performance':
      return [
        {
          question: `Does ${fmt(size)} improve handling?`,
          answer: `The ${sw} in sidewall (${Math.round(specs.aspectRatio)}% aspect) reduces flex versus taller series — quicker steering response on a ${w} in contact patch. Trade-off: less bump absorption than 225/50R17 or 225/55R17 on the same wheel.`,
        },
        {
          question: `What is the closest alternative to ${fmt(size)}?`,
          answer: closestSize
            ? `${closestSize} is ${closestDiffPct! >= 0 ? '+' : ''}${closestDiffPct!.toFixed(1)}% diameter (${diameterOf(closestSize)} in vs ${d} in).`
            : `No dataset size within ±3% diameter — check ${flotation} flotation equivalents or use the comparison tool.`,
        },
        {
          question: `What wheel width works best for ${fmt(size)}?`,
          answer: `A ${w} in (${specs.widthMm} mm) section width typically mounts on ${(specs.widthMm / 25.4 * 0.85).toFixed(1)}–${(specs.widthMm / 25.4 * 1.1).toFixed(1)} in wheel widths; OEM ${specs.wheelDiameterIn} in wheels are common on sport-compact and sedan fitments.`,
        },
      ];
    case 'light-truck':
      return [
        {
          question: `Is ${fmt(size)} good for towing?`,
          answer: `At ${d} in diameter and ${sw} in sidewall, ${fmt(size)} suits load-rated truck applications. Verify load index and speed rating against your GVWR — LT variants often carry higher ply ratings than P-metric sizes.`,
        },
        {
          question: `How does ${fmt(size)} affect fuel economy?`,
          answer: `${Math.round(specs.revsPerMile)} revs/mile means ${specs.circumferenceIn.toFixed(1)} in circumference per revolution. Taller diameters reduce revs/mile slightly vs shorter alternatives — compare in the cost-impact section of the comparison tool.`,
        },
        {
          question: `What sizes are equivalent to ${fmt(size)}?`,
          answer: closestSize
            ? `${closestSize} is within ${Math.abs(closestDiffPct!).toFixed(1)}% overall diameter. Flotation: ${flotation}.`
            : `Flotation equivalent ${flotation} at ${d} in overall diameter.`,
        },
      ];
    case 'SUV':
      return [
        {
          question: `Is ${fmt(size)} good for daily SUV driving?`,
          answer: `${sw} in sidewall on ${specs.wheelDiameterIn} in wheels balances comfort and clearance — ${d} in diameter, ${Math.round(specs.revsPerMile)} revs/mile. Suitable for paved daily use with occasional light-duty trails.`,
        },
        {
          question: `Will ${fmt(size)} change my speedometer?`,
          answer: `Overall diameter drives speedo error proportionally. ${fmt(size)} at ${d} in is the reference; switching to a ±1% diameter size shifts indicated vs true speed by ~±1% at highway speeds.`,
        },
        {
          question: `What are common upsize options from ${fmt(size)}?`,
          answer: closestSize
            ? `${closestSize} (${closestDiffPct! >= 0 ? '+' : ''}${closestDiffPct!.toFixed(1)}% diameter) is the nearest dataset alternative. Use upgrade paths below for mild/moderate/aggressive options.`
            : `See equivalent and upgrade sections below for dataset alternatives within ±3% diameter.`,
        },
      ];
    default:
      return [
        {
          question: `Is ${fmt(size)} good for daily driving?`,
          answer: `${d} in diameter, ${sw} in sidewall, ${Math.round(specs.revsPerMile)} revs/mile — optimized for comfort and efficiency on sedans and compacts. Low rolling resistance compounds pair well with this geometry.`,
        },
        {
          question: `What are common replacement sizes for ${fmt(size)}?`,
          answer: closestSize
            ? `${closestSize} is ${closestDiffPct! >= 0 ? '+' : ''}${closestDiffPct!.toFixed(1)}% overall diameter — the closest dataset match. Stay within ±3% to preserve speedometer accuracy.`
            : `Check equivalent sizes below — staying within ±3% overall diameter (${d} in) avoids speedo drift.`,
        },
        {
          question: `How many revs per mile does ${fmt(size)} make?`,
          answer: `${Math.round(specs.revsPerMile)} revs/mile (${Math.round(specs.revsPerKm)} revs/km) at ${specs.circumferenceIn.toFixed(2)} in circumference.`,
        },
      ];
  }
}

function diameterOf(size: string): string {
  try {
    return getTireSpecs(size).overallDiameterIn.toFixed(2);
  } catch {
    return '—';
  }
}

export interface SidebarRelatedSizeLink {
  size: string;
  href: string;
  diameterDiffPercent: number;
}

/** Closest overall-diameter matches for sidebar — equivalents first, then quick comparisons. */
export function buildSidebarRelatedSizes(
  currentDiameterIn: number,
  equivalents: Array<{ size: string; href: string; diameterDiffPercent: number }>,
  quickComparisons: Array<{ size: string; href: string; diameterIn: number }>,
  limit = 5,
): SidebarRelatedSizeLink[] {
  const seen = new Set<string>();
  const items: SidebarRelatedSizeLink[] = [];

  for (const e of equivalents) {
    if (seen.has(e.size)) continue;
    seen.add(e.size);
    items.push({
      size: e.size,
      href: e.href,
      diameterDiffPercent: e.diameterDiffPercent,
    });
  }

  for (const q of quickComparisons) {
    if (seen.has(q.size)) continue;
    seen.add(q.size);
    items.push({
      size: q.size,
      href: q.href,
      diameterDiffPercent: ((q.diameterIn - currentDiameterIn) / currentDiameterIn) * 100,
    });
  }

  return items
    .sort((a, b) => Math.abs(a.diameterDiffPercent) - Math.abs(b.diameterDiffPercent))
    .slice(0, limit);
}

/** Short buying-guide blurb for sidebar — category-aware, no filler. */
export function buildBuyingGuideSummary(
  size: string,
  specs: TireSpecs,
  category: TireCategory,
): string {
  const s = fmt(size);
  if (s.toUpperCase() === '275/70R18') {
    const diameterRounded = (Math.round(specs.overallDiameterIn * 10) / 10).toFixed(1);
    return `${s} is a near-${diameterRounded}" truck/SUV size often selected for extra sidewall, load capacity, and trail capability without committing to a true 35-inch build.`;
  }
  const inchClass = Math.round(specs.overallDiameterIn);

  switch (category) {
    case 'light-truck':
    case 'off-road':
      return `${s} is a ${inchClass}-inch truck tire offering additional ground clearance while maintaining reasonable on-road comfort.`;
    case 'performance':
      return `${s} prioritizes handling response and steering precision over ride softness.`;
    case 'SUV':
      return `${s} balances SUV ride comfort with a ${inchClass}-inch footprint suited to crossovers that need light trail capability without harsh speedometer drift.`;
    default:
      return `${s} is a commuter-oriented ${inchClass}-inch tire tuned for comfort, efficiency, and predictable wet-weather grip.`;
  }
}
