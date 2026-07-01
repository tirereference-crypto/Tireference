import type { TireCategory } from '../data/tire-sizes';
import type { HubFaqItem } from './tire-size-hub';
import type { TireSizeHubData } from './tire-size-hub';
import { getExpertFaqForSize } from './tire-size-faq-expert';
import { getPremiumOverride } from './tire-size-premium-overrides';

function fmt(size: string): string {
  return size.replace(/^lt/i, 'LT').replace(/^p/i, 'P');
}

function closestAlt(hub: TireSizeHubData): string {
  return (
    hub.quickComparisons[0]?.size ??
    hub.equivalents[0]?.size ??
    hub.upgradePathsUp[0]?.size ??
    'a similar size in our dataset'
  );
}

type FaqTemplate = { question: string; answer: string };

function buildOffRoadFaq(hub: TireSizeHubData, alt: string): FaqTemplate[] {
  const size = fmt(hub.entry.size);
  return [
    {
      question: `Is ${size} worth upgrading to?`,
      answer:
        `For most truck and SUV owners stepping up from factory tires, ${size} is worth it when you actually use the extra capability — gravel roads, snowy approaches, and loaded weekend trips where stock rubber feels limited. The upgrade makes less sense if you rarely leave pavement and care most about mpg and the quietest possible commute. Value also depends on fitment: many full-size SUVs and trucks accept this size cleanly, while some half-ton platforms need a mild level or careful wheel offset. Treat it as a purposeful upgrade — the payoff shows in where you drive, not how it looks parked.`,
    },
    {
      question: `Does ${size} hurt fuel economy?`,
      answer:
        `Expect a modest mpg hit versus shorter, lighter factory tires — many owners see roughly 1–3 mpg combined depending on tread pattern and load. The penalty comes from increased rolling resistance and heavier rotating mass, which shows up most in city driving and mountain cruising. All-terrain and mud-terrain compounds usually cost more fuel than highway-terrain patterns in the same size. Towing amplifies the difference. The impact rarely cancels the upgrade for adventure-focused owners, but daily commuters should plan for it. Keep pressures correct — under-inflation is a common hidden mpg killer after upsizing.`,
    },
    {
      question: `Can I run ${size} without a lift?`,
      answer:
        `On many full-size SUVs and ¾-ton trucks, yes — which is why this size is popular. Half-ton pickups are more variable: a 2-inch level is commonly used to reduce inner-fender contact at full lock. Rubbing is the deciding factor, not just static garage fitment — test full steering lock, suspension compression, and rear travel when loaded. Wider aftermarket wheels push the tire outward and cause rubbing before taller diameter does. If you want no lift and no trimming, stay near factory wheel width and offset. A lift solves clearance but is not mandatory on every platform.`,
    },
    {
      question: `Does ${size} ride better than stock tires?`,
      answer:
        `Usually yes on broken pavement if your stock tires were a shorter, stiffer highway size. The taller sidewall absorbs more impact before it reaches the suspension, softening potholes and washboard gravel. The tradeoff is steering feel: more sidewall compliance can make turn-in slightly slower during quick lane changes. Ride quality still depends on tread construction — a stiff mud-terrain can ride harder than a touring all-terrain despite the taller profile. Owners coming from plush OEM SUV tires may notice more road hum but still prefer the calmer impact feel.`,
    },
    {
      question: `Why do overlanders prefer ${size}?`,
      answer:
        `Overlanders choose ${size} because it adds clearance, loose-surface traction, and durability on mixed routes without the lift, gearing, and alignment headaches that extreme builds demand. It fits many expedition rigs with minimal sheet-metal compromise and still behaves predictably on long highway transfers between trailheads. Strong all-terrain lineups and rural shop availability matter on multi-week trips. It also preserves towing and loaded handling better than oversized packages that need constant driveline attention. The choice is about reliability and range, not just peak trail performance.`,
    },
    {
      question: `What's the difference between ${size} and ${alt}?`,
      answer:
        `The alternative size ${alt} will differ in overall diameter, section width, and fitment tolerance — use the comparison tool on this page for exact deltas. Generally, a slightly larger neighbor adds footprint and stance but tightens wheel-well clearance and may increase steering effort and fuel use. A smaller neighbor improves fitment margin and efficiency but reduces clearance and loose-surface confidence. Choose based on whether your priority is easiest installation, maximum trail capability, or balanced daily drivability. Always confirm rubbing at full lock before buying four tires.`,
    },
  ];
}

function buildLightTruckFaq(hub: TireSizeHubData, alt: string): FaqTemplate[] {
  const size = fmt(hub.entry.size);
  return [
    {
      question: `Is ${size} worth upgrading to?`,
      answer:
        `For truck owners who tow, haul, or drive rough rural roads, ${size} is often worth the upgrade when you need more load confidence and durability than passenger-rated replacements provide. The value drops if you run empty miles on smooth highways and prioritize maximum mpg above all else. Match load range to your GVWR — LT or E-rated constructions matter more than diameter alone when the bed is loaded. Confirm fitment on your exact wheel offset before committing, especially on lifted or leveled trucks.`,
    },
    {
      question: `Does ${size} hurt fuel economy?`,
      answer:
        `Larger truck tires typically add 1–2 mpg penalty versus stock highway tires because of mass and rolling resistance. The effect is most noticeable in stop-and-go weeks and when towing — not always on steady interstate cruising. Highway-terrain patterns recover some efficiency versus aggressive all-terrain tread. Keeping alignment correct and rotating on schedule limits uneven wear that can further hurt economy. Budget the fuel change if you drive high annual mileage with an empty bed most of the time.`,
    },
    {
      question: `Can I run ${size} without a lift?`,
      answer:
        `Many ¾-ton and heavy-duty trucks accept ${size} on stock suspension with factory-offset wheels. Half-ton trucks vary by generation — test inner-fender clearance at full lock and under compression. If you run a level kit for aesthetics, verify the tire still clears crash bars and mud flaps. Wider wheels are the most common rubbing culprit, not diameter alone. Measure before you buy four tires, especially if you carry a toolbox or camper that changes rear squat.`,
    },
    {
      question: `Is ${size} good for towing?`,
      answer:
        `Yes, when you select a load-rated construction that matches your truck's GVWR and tongue weight. ${size} is commonly used on towing-focused pickups because the taller sidewall handles road impacts better under load than low-profile alternatives. Verify speed rating for interstate use and check that your brake system is in good condition — heavier tire assemblies carry more momentum. After upsizing, allow extra stopping distance until you adapt. Pair with correct inflation for the trailer load, not just the empty-truck placard.`,
    },
    {
      question: `Will ${size} rub at full lock?`,
      answer:
        `Rubbing depends on your truck generation, wheel offset, and whether the front end is level or lifted. Test slow turns in both directions with a helper watching the inner fender and crash bar. Rear rubbing under load is possible on short beds with heavy payloads. If you hear scrubbing only at full lock, minor trimming or a small level may fix it — if it scrubs mid-travel, the combination is too aggressive. Do not assume forum fitment reports match your exact trim and wheel package.`,
    },
    {
      question: `What's the difference between ${size} and ${alt}?`,
      answer:
        `Compared with ${alt}, differences show up in diameter, width, load capacity, and fitment margin — check the comparison table on this page for computed deltas. A taller/wider neighbor improves traction and stance but may require leveling and can increase fuel use. A smaller neighbor fits more trucks stock but gives up clearance and payload-friendly sidewall height. Pick the size that matches your towing schedule, wheel-well space, and tolerance for installation work.`,
    },
  ];
}

function buildSuvFaq(hub: TireSizeHubData, alt: string): FaqTemplate[] {
  const size = fmt(hub.entry.size);
  return [
    {
      question: `Is ${size} worth upgrading to?`,
      answer:
        `For SUV owners who want more all-weather confidence and light trail capability, ${size} is worth considering when it stays within your vehicle's fitment limits. The upgrade pays off on snowy approaches, gravel campground roads, and long family road trips where stability matters. It is harder to justify if you only drive smooth suburban pavement and want the softest possible ride and lowest fuel bill. Verify plus-size clearance on your exact crossover before buying — not every platform tolerates diameter changes equally.`,
    },
    {
      question: `Does ${size} hurt fuel economy?`,
      answer:
        `Upsizing usually costs a small amount of fuel economy — often 1–2 mpg for SUV fitments — because of added weight and rolling resistance. All-weather and all-terrain patterns typically use more fuel than pure highway touring compounds. The change is gradual; you will notice it over a few tanks rather than immediately. Proper inflation and alignment matter more after upsizing than many owners expect. If efficiency is your primary goal, stay with a low-resistance touring tire in the OEM size class.`,
    },
    {
      question: `Does ${size} ride better than stock tires?`,
      answer:
        `If you are moving to a taller sidewall, ride comfort on rough pavement often improves because the tire absorbs more impact before the suspension does. If you are widening without much diameter change, steering may feel heavier but impact harshness might not improve much. Stiffer all-terrain carcasses can ride harder than plush OEM all-seasons despite similar dimensions. Test-drive a known brand in this size before committing to four tires if comfort is your main concern.`,
    },
    {
      question: `Is ${size} good in snow?`,
      answer:
        `Snow performance depends more on tread compound and 3PMSF certification than size alone. ${size} can be excellent in winter when mounted with a dedicated all-weather or winter pattern with siping and flexible rubber. A tall all-terrain without winter rating may underperform a smaller winter tire in ice and slush. If you see regular below-freezing months, consider a two-wheel-set strategy rather than one compromise tire year-round. Correct inflation is critical in cold weather — pressure drops as temperatures fall.`,
    },
    {
      question: `Is ${size} good for daily SUV driving?`,
      answer:
        `Yes for many crossovers when fitment is confirmed and you choose a road-biased compound. ${size} handles school runs, highway commuting, and warehouse-store parking lots without the compromises of extreme off-road builds. Cabin noise and steering effort may shift slightly versus OEM rubber — usually acceptable for adventure-oriented owners. Rotate on schedule and monitor TPMS after upsizing. Daily drivability stays strong when you avoid the most aggressive mud-terrain treads for pavement-only use.`,
    },
    {
      question: `What's the difference between ${size} and ${alt}?`,
      answer:
        `The key differences versus ${alt} are overall diameter, width, and how much fitment margin your SUV retains — see the comparison section for exact numbers. A larger neighbor adds stance and light-trail confidence but may require attention to rubbing and speedometer accuracy. A smaller neighbor maximizes efficiency and fitment ease. Choose based on whether your SUV sees occasional gravel and snow or stays primarily on paved commuter routes.`,
    },
  ];
}

function buildPerformanceFaq(hub: TireSizeHubData, alt: string): FaqTemplate[] {
  const size = fmt(hub.entry.size);
  return [
    {
      question: `Is ${size} worth upgrading to?`,
      answer:
        `For enthusiasts who want sharper handling and stronger grip, ${size} is worth it when your suspension and brakes are in good condition and you actually drive spirited roads. The upgrade is harder to justify for pure commuting on rough city streets where ride comfort matters most. Match the compound to your climate — max-performance summer tires disappoint in cold weather. Confirm wheel width and offset support this section width before buying. Worth it means you value feedback and grip over plush isolation.`,
    },
    {
      question: `Does ${size} improve handling?`,
      answer:
        `A performance-sized tire in ${size} typically improves turn-in response and lateral grip versus taller, softer OEM rubber because the sidewall flexes less and the contact patch is tuned for dry and wet pavement. You will feel more road texture and impact harshness on broken surfaces — that is the tradeoff. Alignment and tire pressure become more noticeable to handling balance. For track-oriented drivers, heat management and tread compound matter as much as size. Expect better precision, not a softer commute.`,
    },
    {
      question: `Does ${size} ride harsher than stock tires?`,
      answer:
        `Usually yes, especially if you are downsizing sidewall height or moving to a stiffer ultra-high-performance carcass. Low-profile setups transmit more impact into the cabin on potholes and expansion joints. The harshness is the price of quicker steering response and higher grip limits. Some owners adapt quickly; others prefer a slightly taller aspect ratio for daily use. If ride quality is non-negotiable, consider a grand-touring performance tire rather than a max-grip summer compound.`,
    },
    {
      question: `Is ${size} good in the rain?`,
      answer:
        `Rain performance depends on tread design and compound, not diameter alone. Quality UHP tires in ${size} can be excellent in wet conditions when they have deep grooves and modern silica compounds. Worn or track-biased tires hydroplane earlier regardless of size. Check wet ratings and reviews for the specific brand you plan to buy. Rotate and replace before tread depth gets too shallow — wet safety drops quickly on performance patterns below 4/32 inch.`,
    },
    {
      question: `Can I use ${size} year-round?`,
      answer:
        `Only if you choose an all-season or all-weather performance compound rated for your coldest months. Dedicated summer tires in ${size} are unsafe below roughly 40°F and on snow. Many enthusiasts run a winter wheel set and swap compounds seasonally — the better approach for year-round driving in mixed climates. Storage and swap cost is part of ownership. Do not stretch a summer tire through winter because the size fits — compound flexibility matters more than dimensions.`,
    },
    {
      question: `What's the difference between ${size} and ${alt}?`,
      answer:
        `Versus ${alt}, expect differences in width, diameter, and steering feel — use the on-page comparison for computed deltas. A wider neighbor adds grip but can increase tramlining and steering effort. A narrower or shorter neighbor may ride slightly softer but give up ultimate grip. Pick based on whether you need maximum track-day grip, daily sporty feel, or a compromise that tolerates rough pavement better.`,
    },
  ];
}

function buildPassengerFaq(hub: TireSizeHubData, alt: string): FaqTemplate[] {
  const size = fmt(hub.entry.size);
  return [
    {
      question: `Is ${size} worth upgrading to?`,
      answer:
        `For most sedan and compact owners, ${size} is worth upgrading only when you are replacing worn rubber or moving within the fitment range your vehicle supports — not for aggressive upsizing. The best value comes from choosing a high-quality touring compound that matches the door placard load and speed ratings. Upsizing diameter without a clear need can hurt efficiency and ride. If your current tires meet your comfort and wet-grip needs, a like-for-like premium replacement is often the smarter spend.`,
    },
    {
      question: `Does ${size} hurt fuel economy?`,
      answer:
        `Passenger tires in ${size} are usually among the most efficient options when you stay with low rolling resistance touring designs. Fuel economy suffers if you upsize width or choose heavy all-season patterns you do not need. Under-inflation is the most common mpg killer — check monthly. Compared with worn tires, a fresh set in the correct size can actually restore efficiency and braking performance. Match the compound to your driving: commuting favors touring, not off-road tread.`,
    },
    {
      question: `Does ${size} ride better than stock tires?`,
      answer:
        `A new touring tire in ${size} often rides better than worn factory rubber because tread depth and compliant compounds return impact absorption. If you switch to a lower aspect ratio, ride may get firmer even when the tire is new. Taller sidewalls generally soften potholes and driveway lips. For maximum comfort, prioritize touring lines with comfort tuning over sporty patterns. Balance pressure to the placard — over-inflation makes any tire harsh.`,
    },
    {
      question: `Is ${size} good in winter?`,
      answer:
        `Winter suitability depends on the specific tire model, not just ${size}. All-season tires handle light snow; dedicated winter tires are better for regular ice and deep cold. If you see sustained below-freezing months, a winter set on steel wheels is safer than stretching one all-season year-round. Check for 3PMSF symbols when you need all-weather flexibility without a second set. Size matters less than compound flexibility and siping depth.`,
    },
    {
      question: `Is ${size} quiet on the highway?`,
      answer:
        `Highway noise is mostly tread pattern and carcass design, not size alone. Premium touring tires in ${size} can be very quiet when new, with tuned pitch and foam inserts on some models. Aggressive all-season or off-road-styled patterns will hum more regardless of fitment. Rotate on schedule to prevent uneven wear that increases noise. If cabin quiet is your priority, read noise-focused reviews rather than choosing by appearance alone.`,
    },
    {
      question: `What's the difference between ${size} and ${alt}?`,
      answer:
        `Compared with ${alt}, differences in diameter and width affect speedometer accuracy, steering effort, and comfort — see the comparison table for exact values. Staying within a close diameter range preserves calibration and ABS behavior. Larger jumps may require fitment checks even on sedans. For daily drivers, choose the alternative that keeps you within placard load rating and maintains the ride quality you want on your regular roads.`,
    },
  ];
}

const CATEGORY_BUILDERS: Record<
  TireCategory,
  (hub: TireSizeHubData, alt: string) => FaqTemplate[]
> = {
  'off-road': buildOffRoadFaq,
  'light-truck': buildLightTruckFaq,
  SUV: buildSuvFaq,
  performance: buildPerformanceFaq,
  passenger: buildPassengerFaq,
};

export function buildSearchableFaq(hub: TireSizeHubData): HubFaqItem[] {
  const override = getPremiumOverride(hub.entry.size);
  if (override?.expertFaq) return override.expertFaq;

  const expert = getExpertFaqForSize(hub.entry.size);
  if (expert) return expert;

  const alt = closestAlt(hub);
  return CATEGORY_BUILDERS[hub.entry.category](hub, alt);
}
