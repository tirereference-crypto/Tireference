import type { HubFaqItem } from './tire-size-hub';

const EXPERT_FAQ_BY_SIZE: Record<string, HubFaqItem[]> = {
  '275/70R18': [
    {
      question: 'Is 275/70R18 worth upgrading to?',
      answer:
        'For most truck and SUV owners stepping up from factory all-season or highway tires, yes — if your goal is more clearance, a tougher footprint, and better loose-surface confidence without committing to a full oversized build. The upgrade pays off when you actually use the capability: forest roads, gravel campsites, snowy approaches, and loaded weekend trips where stock rubber feels limited. The case weakens if you rarely leave pavement and care most about mpg and the quietest possible commute; in that scenario, a quality stock-replacement highway tire may be the smarter spend. Worth it also depends on fitment: on many full-size SUVs and ¾-ton trucks, this size fits cleanly, while some half-ton trucks need a mild level or careful wheel offset to avoid rubbing. Treat it as a purposeful upgrade — the value shows in where you drive, not how it looks parked.',
    },
    {
      question: 'Does 275/70R18 hurt fuel economy?',
      answer:
        'Expect a modest mpg hit compared with shorter, lighter factory tires — most owners report roughly 1–3 mpg combined depending on tread pattern, driving style, and load. The penalty comes from increased rolling resistance, taller gearing effect, and heavier rotating mass, which matters most in city stop-and-go and mountain cruising where the engine works harder to maintain speed. All-terrain and mud-terrain compounds usually cost more fuel than highway-terrain or touring-oriented all-terrains in the same size. Towing amplifies the difference because the driveline is already under load. The economy impact is rarely dramatic enough to cancel the upgrade for adventure-focused owners, but it is real enough that daily commuters should budget for it. Rotating on schedule and keeping pressures correct helps limit unnecessary drag; under-inflation is a common hidden mpg killer after upsizing.',
    },
    {
      question: 'Can I run 275/70R18 without a lift?',
      answer:
        'On many full-size SUVs and ¾-ton trucks, yes — this is one reason the size is popular. Land Cruiser, LX, Sequoia, and heavy-duty pickup platforms often accept 275/70R18 with stock suspension when wheel offset and width stay conservative. Half-ton trucks are more variable: a 2-inch level is commonly used on F-150, Silverado, and Tundra builds to restore rake and reduce inner-fender contact at full lock. Rubbing is the deciding factor, not just static garage fitment — test full steering lock, suspension compression over bumps, and rear travel when loaded. Wider aftermarket wheels and aggressive positive offset push the tire outward and cause rubbing before taller diameter does. If you want no lift and no trimming, stick with OEM-width wheels, factory offset ranges, and test drive before a long trip. A lift solves clearance but is not mandatory on every platform.',
    },
    {
      question: 'Does 275/70R18 ride better than stock tires?',
      answer:
        'Usually yes on broken pavement — especially if your stock tires were a short, stiff highway size on 18-inch wheels. The taller sidewall absorbs more impact before it reaches the suspension, which softens expansion joints, potholes, and washboard gravel that feel harsh on factory rubber. The tradeoff is steering feel: more sidewall compliance can make turn-in slightly slower and less sharp during quick lane changes or fast trail inputs. Ride quality still depends heavily on tread construction; a stiff mud-terrain can ride harder than a touring all-terrain despite the taller profile. Owners coming from plush OEM SUV tires sometimes notice more road hum but still prefer the calmer impact feel. If your stock setup was already a tall, compliant factory all-terrain, the ride difference may be subtle — the bigger change then is traction and confidence, not comfort.',
    },
    {
      question: 'Why do overlanders prefer 275/70R18?',
      answer:
        'Overlanders gravitate to this size because it solves the problems they hit most often — clearance, traction on loose surfaces, and durability on long mixed routes — without the cascading modifications that 35-inch builds demand. It fits many expedition rigs with minimal sheet-metal compromise, airs down effectively for sand and gravel, and still behaves predictably on multi-day highway transfers between trailheads. Tire brands offer strong all-terrain lineups here, so sourcing replacements in remote areas is realistic — a practical concern on Pan-American or backcountry loops. It also preserves towing and loaded handling better than extreme tall setups that need re-gearing or constant alignment attention. Overlanders are not avoiding bigger tires on principle; they choose 275/70R18 when reliability, range, and repairability matter as much as peak trail performance.',
    },
    {
      question: 'What\'s the difference between 275/70R18 and 285/70R18?',
      answer:
        'The 285/70R18 is slightly wider and taller, which adds footprint and stance but tightens fitment on some trucks and SUVs. You gain more contact patch for soft terrain and a more aggressive look, yet inner-fender rubbing at full lock becomes more common without a level, spacer, or minor trim — especially on half-ton platforms. Steering effort and fuel use typically increase a step beyond 275 because of the added mass and width. Ride can feel marginally softer on rough roads thanks to more sidewall volume, but highway noise and groove tracking sometimes increase with the wider section. For owners prioritizing the easiest bolt-on upgrade with fewer surprises, 275/70R18 is usually the less fussy choice. Choose 285/70R18 when you have confirmed clearance, accept possible suspension tweaks, and want maximum traction over simplicity.',
    },
  ],
};

export function getExpertFaqForSize(size: string): HubFaqItem[] | null {
  return EXPERT_FAQ_BY_SIZE[size.toUpperCase()] ?? null;
}
