import type {
  GearRatioFields,
  GearRatioResult,
  GearVerdict,
  GearVerdictLabel,
  GearVerdictTone,
  GearImpactRow,
} from './gear-ratio-math';
import { CALCULATOR_PATHS, getRelatedCalculators, type RelatedCalculatorItem } from './calculator-links';

export type { RelatedCalculatorItem };

export const RELATED_CALCULATOR_LINKS = getRelatedCalculators(CALCULATOR_PATHS.gearRatio);

export interface GearFaq {
  question: string;
  answer: string;
}

export const DEFAULT_GEAR_FIELDS: GearRatioFields = {
  currentDiameterIn: '31',
  stockGearRatio: '3.73',
  transTopGear: '1.00',
  newDiameterIn: '35',
  speed: '65',
  speedUnit: 'mph',
  cruiseRpm: '2000',
  desiredRpm: '2000',
  squatEnabled: true,
  squatPercent: '3',
  crawlEnabled: false,
  firstGearRatio: '4.00',
  transferLowRatio: '2.72',
};

export const GEAR_RATIO_OPTIONS = [
  '3.08',
  '3.23',
  '3.42',
  '3.55',
  '3.73',
  '3.92',
  '4.10',
  '4.30',
  '4.56',
  '4.88',
  '5.13',
];

export const BEFORE_INSTALL_EXPECTATIONS = [
  { icon: 'launch', text: 'Slower launches & acceleration' },
  { icon: 'towing', text: 'Weaker towing & hill climbing' },
  { icon: 'rpm', text: 'Lower engine RPM at highway speeds' },
  { icon: 'downshift', text: 'More transmission downshifts' },
] as const;

function impactStatus(lossPct: number): 'pass' | 'warning' | 'fail' {
  const abs = Math.abs(lossPct);
  if (abs < 5) return 'pass';
  if (abs < 10) return 'warning';
  return 'fail';
}

export function buildGearVerdict(result: GearRatioResult): GearVerdict {
  const loss = result.gearingLossPct;

  let label: GearVerdictLabel;
  let tone: GearVerdictTone;
  let summary: string;

  if (loss < 3) {
    label = 'Stock Gears Are Fine';
    tone = 'green';
    summary =
      loss <= 0
        ? 'Your new tire is the same size or smaller, so effective gearing is unchanged. Keep your current gears and enjoy the new tires.'
        : 'The size change is small enough that you barely lose any effective gearing. Most drivers will be perfectly happy on stock gears.';
  } else if (loss < 7) {
    label = 'Mild Performance Loss';
    tone = 'yellow';
    summary =
      'You give up a noticeable bit of effective gearing. Daily driving still feels fine — acceleration and towing just feel a touch softer. A regear is optional.';
  } else if (loss < 12) {
    label = 'Worth Regearing';
    tone = 'orange';
    summary =
      'The larger tire takes a real bite out of your effective gearing. Acceleration, towing, and throttle response all suffer enough that a regear is worth the money.';
  } else {
    label = 'Regear Recommended';
    tone = 'red';
    summary =
      'This is a big jump in tire size and your effective gearing drops well past the comfortable range. Expect sluggish launches and constant downshifts until you regear.';
  }

  const accelStatus = impactStatus(loss);
  const towStatus = impactStatus(loss * 1.1);
  const rpmStatus: GearImpactRow['status'] =
    Math.abs(result.rpmChangePct) < 5 ? 'pass' : Math.abs(result.rpmChangePct) < 10 ? 'warning' : 'fail';
  const fuelStatus = impactStatus(loss * 0.7);

  const rows: GearImpactRow[] = [
    {
      id: 'acceleration',
      icon: 'acceleration',
      label: 'Acceleration',
      status: accelStatus,
      detail:
        loss < 3
          ? 'Essentially unchanged from stock — launches feel the same.'
          : `Roughly ${loss.toFixed(0)}% less torque multiplication off the line.`,
    },
    {
      id: 'fuel',
      icon: 'fuel',
      label: 'Fuel Economy',
      status: fuelStatus,
      detail:
        loss < 5
          ? 'Highway fuel economy stays roughly the same.'
          : 'More downshifts and engine load can lower real-world mpg until regeared.',
    },
    {
      id: 'towing',
      icon: 'towing',
      label: 'Towing',
      status: towStatus,
      detail:
        loss < 5
          ? 'Towing capability stays close to stock.'
          : 'Less low-end torque makes towing and grades harder in the higher gears.',
    },
    {
      id: 'highway',
      icon: 'highway',
      label: 'Highway Driving',
      status: rpmStatus,
      detail:
        result.rpmChange < -25
          ? `Cruise RPM drops about ${Math.abs(Math.round(result.rpmChange))} at the same speed on stock gears.`
          : 'Cruise RPM stays close to your current comfortable range.',
    },
    {
      id: 'offroad',
      icon: 'offroad',
      label: 'Off-Road',
      status: loss < 5 ? 'pass' : 'warning',
      detail:
        result.currentCrawlRatio && result.performanceCrawlRatio
          ? `Crawl ratio recovers from ${result.currentCrawlRatio.toFixed(1)}:1 toward ${result.performanceCrawlRatio.toFixed(1)}:1 with a performance regear.`
          : 'Bigger tires raise effective crawl gearing — deeper gears restore low-speed control.',
    },
  ];

  return { label, tone, summary, rows };
}

export type GearStarTone = 'red' | 'orange' | 'green';

export interface GearStarRating {
  filled: number;
  tone: GearStarTone;
}

export interface GearComparisonSetup {
  key: 'current' | 'ideal' | 'performance';
  name: string;
  gear: number;
  effective: number;
  barTone: 'red' | 'green' | 'orange';
  ratings: {
    acceleration: GearStarRating;
    towing: GearStarRating;
    fuelEconomy: GearStarRating;
    highwayRpm: GearStarRating;
  };
}

export interface GearComparisonMatrix {
  tireDiameterIn: number;
  setups: GearComparisonSetup[];
  barMin: number;
  barMax: number;
}

function gearStarRating(filled: number, tone: GearStarTone): GearStarRating {
  return { filled: Math.min(5, Math.max(1, filled)), tone };
}

function accelerationStars(ratioToStock: number): GearStarRating {
  if (ratioToStock < 0.97) return gearStarRating(2, 'red');
  if (ratioToStock < 1.03) return gearStarRating(3, 'orange');
  if (ratioToStock < 1.12) return gearStarRating(4, 'green');
  return gearStarRating(5, 'green');
}

function towingStars(ratioToStock: number): GearStarRating {
  if (ratioToStock < 0.93) return gearStarRating(1, 'red');
  if (ratioToStock < 0.98) return gearStarRating(2, 'red');
  if (ratioToStock < 1.05) return gearStarRating(3, 'orange');
  if (ratioToStock < 1.13) return gearStarRating(4, 'orange');
  return gearStarRating(5, 'green');
}

function highwayRpmStars(rpmRatio: number): GearStarRating {
  if (rpmRatio < 0.88) return gearStarRating(3, 'orange');
  if (rpmRatio < 0.97) return gearStarRating(4, 'green');
  if (rpmRatio <= 1.06) return gearStarRating(5, 'green');
  if (rpmRatio <= 1.12) return gearStarRating(4, 'orange');
  if (rpmRatio <= 1.18) return gearStarRating(3, 'orange');
  return gearStarRating(2, 'red');
}

export function buildGearComparisonMatrix(result: GearRatioResult): GearComparisonMatrix {
  const { input } = result;
  const scale = result.effectiveCurrentDiameterIn / result.effectiveNewDiameterIn;
  const stock = input.stockGearRatio;
  const stockRpm = result.currentRpm;

  const currentEffective = result.effectiveRatio;
  const idealEffective = result.idealGear * scale;
  const performanceEffective = result.performanceGear * scale;

  const currentRpmRatio = stockRpm > 0 ? result.newRpmSameGear / stockRpm : 1;
  const idealRpmRatio = stockRpm > 0 ? result.idealRpm / stockRpm : 1;
  const performanceRpmRatio = stockRpm > 0 ? result.performanceRpm / stockRpm : 1;

  const setups: GearComparisonSetup[] = [
    {
      key: 'current',
      name: 'Keep Current',
      gear: stock,
      effective: currentEffective,
      barTone: 'red',
      ratings: {
        acceleration: accelerationStars(currentEffective / stock),
        towing: towingStars(currentEffective / stock),
        fuelEconomy: highwayRpmStars(currentRpmRatio),
        highwayRpm: highwayRpmStars(currentRpmRatio),
      },
    },
    {
      key: 'ideal',
      name: 'Ideal',
      gear: result.idealGear,
      effective: idealEffective,
      barTone: 'green',
      ratings: {
        acceleration: accelerationStars(idealEffective / stock),
        towing: towingStars(idealEffective / stock),
        fuelEconomy: highwayRpmStars(idealRpmRatio),
        highwayRpm: highwayRpmStars(idealRpmRatio),
      },
    },
    {
      key: 'performance',
      name: 'Performance',
      gear: result.performanceGear,
      effective: performanceEffective,
      barTone: 'orange',
      ratings: {
        acceleration: accelerationStars(performanceEffective / stock),
        towing: towingStars(performanceEffective / stock),
        fuelEconomy: highwayRpmStars(performanceRpmRatio),
        highwayRpm: highwayRpmStars(performanceRpmRatio),
      },
    },
  ];

  const values = setups.map((s) => s.effective);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.08 || 0.1;

  return {
    tireDiameterIn: Math.round(input.newDiameterIn),
    setups,
    barMin: min - padding,
    barMax: max + padding,
  };
}

export type GearComparisonCellTone = 'default' | 'orange' | 'red' | 'green';

export interface GearComparisonTableCell {
  text: string;
  tone?: GearComparisonCellTone;
  bold?: boolean;
}

export interface GearComparisonTableRow {
  setup: string;
  tireDiameter: string;
  axleGear: string;
  effectiveRatio: GearComparisonTableCell;
  changeFromStock: GearComparisonTableCell;
  acceleration: GearComparisonTableCell;
  towing: GearComparisonTableCell;
  cruisingRpm: string;
}

function formatTableDiameter(inches: number): string {
  return `${inches.toFixed(2)}"`;
}

function formatTableRatio(value: number): string {
  return value.toFixed(2);
}

function formatChangeFromStock(effective: number, stockEffective: number): GearComparisonTableCell {
  const pct = ((effective / stockEffective) - 1) * 100;
  if (Math.abs(pct) < 0.05) {
    return { text: '—', tone: 'default' };
  }
  const sign = pct > 0 ? '+' : '';
  return {
    text: `${sign}${pct.toFixed(1)}%`,
    tone: pct < 0 ? 'red' : 'green',
    bold: true,
  };
}

function performanceLabel(rating: GearStarRating): GearComparisonTableCell {
  if (rating.filled >= 5) return { text: 'Excellent', tone: 'green', bold: true };
  if (rating.filled >= 4) return { text: 'Good', tone: 'green', bold: true };
  if (rating.filled >= 2) return { text: 'Fair', tone: 'orange', bold: true };
  return { text: 'Poor', tone: 'red', bold: true };
}

function formatCruiseRpm(pctChange: number | null): string {
  if (pctChange === null) return 'Baseline';
  const sign = pctChange > 0 ? '+' : '';
  const direction = pctChange < 0 ? 'Lower' : 'Higher';
  return `${sign}${pctChange.toFixed(1)}% (${direction})`;
}

export function buildGearComparisonTable(result: GearRatioResult): GearComparisonTableRow[] {
  const { input } = result;
  const stockEffective = input.stockGearRatio;
  const scale = result.effectiveCurrentDiameterIn / result.effectiveNewDiameterIn;
  const stockDiameter = result.effectiveCurrentDiameterIn;
  const newDiameter = result.effectiveNewDiameterIn;

  const idealEffective = result.idealGear * scale;
  const performanceEffective = result.performanceGear * scale;

  const newAccel = accelerationStars(result.effectiveRatio / stockEffective);
  const newTow = towingStars(result.effectiveRatio / stockEffective);
  const idealAccel = accelerationStars(idealEffective / stockEffective);
  const idealTow = towingStars(idealEffective / stockEffective);
  const perfAccel = accelerationStars(performanceEffective / stockEffective);
  const perfTow = towingStars(performanceEffective / stockEffective);

  const idealRpmPct =
    result.currentRpm > 0 ? ((result.idealRpm - result.currentRpm) / result.currentRpm) * 100 : 0;
  const performanceRpmPct =
    result.currentRpm > 0 ? ((result.performanceRpm - result.currentRpm) / result.currentRpm) * 100 : 0;

  return [
    {
      setup: 'Stock (Current)',
      tireDiameter: formatTableDiameter(stockDiameter),
      axleGear: formatTableRatio(stockEffective),
      effectiveRatio: { text: formatTableRatio(stockEffective), bold: true },
      changeFromStock: { text: '—', tone: 'default' },
      acceleration: { text: 'Good', tone: 'default' },
      towing: { text: 'Fair', tone: 'default' },
      cruisingRpm: 'Baseline',
    },
    {
      setup: 'New Tires (Stock Gears)',
      tireDiameter: formatTableDiameter(newDiameter),
      axleGear: formatTableRatio(stockEffective),
      effectiveRatio: { text: formatTableRatio(result.effectiveRatio), bold: true },
      changeFromStock: formatChangeFromStock(result.effectiveRatio, stockEffective),
      acceleration: performanceLabel(newAccel),
      towing: performanceLabel(newTow),
      cruisingRpm: formatCruiseRpm(result.rpmChangePct),
    },
    {
      setup: 'Recommended (Ideal)',
      tireDiameter: formatTableDiameter(newDiameter),
      axleGear: formatTableRatio(result.idealGear),
      effectiveRatio: { text: formatTableRatio(idealEffective), bold: true },
      changeFromStock: formatChangeFromStock(idealEffective, stockEffective),
      acceleration: performanceLabel(idealAccel),
      towing: performanceLabel(idealTow),
      cruisingRpm: formatCruiseRpm(idealRpmPct),
    },
    {
      setup: 'Performance',
      tireDiameter: formatTableDiameter(newDiameter),
      axleGear: formatTableRatio(result.performanceGear),
      effectiveRatio: { text: formatTableRatio(performanceEffective), bold: true },
      changeFromStock: formatChangeFromStock(performanceEffective, stockEffective),
      acceleration: performanceLabel(perfAccel),
      towing: performanceLabel(perfTow),
      cruisingRpm: formatCruiseRpm(performanceRpmPct),
    },
  ];
}

export type BeforeYouBuyTone = 'green' | 'yellow' | 'orange' | 'red';

export interface BeforeYouBuyItem {
  tire: string;
  status: string;
  detail: string;
  tone: BeforeYouBuyTone;
  icon: string;
}

export const BEFORE_YOU_BUY: BeforeYouBuyItem[] = [
  {
    tire: '31"',
    status: 'Usually No Regear Needed',
    detail: 'Close to most factory sizes — stock gears stay comfortable for daily driving.',
    tone: 'green',
    icon: 'check',
  },
  {
    tire: '33"',
    status: 'May Need 3.73–4.10',
    detail: 'Works well on many trucks; mild gears help if you tow or run lower stock ratios.',
    tone: 'yellow',
    icon: 'mild',
  },
  {
    tire: '35"',
    status: 'Recommended 4.10–4.56',
    detail: 'Often sluggish on stock 3.21–3.55 gears — a regear restores stock-like response.',
    tone: 'orange',
    icon: 'regear',
  },
  {
    tire: '37"',
    status: 'Strongly Consider 4.88+',
    detail: 'Needs deep gears to recover acceleration, towing power, and drivability.',
    tone: 'red',
    icon: 'strong',
  },
];

export interface RegearCostTier {
  key: string;
  icon: string;
  name: string;
  range: string;
  unit: string;
  featured?: boolean;
  features: string[];
}

export const REGEAR_COSTS: RegearCostTier[] = [
  {
    key: 'diy',
    icon: 'wrench',
    name: 'DIY',
    range: '$300–700',
    unit: 'parts only',
    features: ['Ring & pinion + install kit', 'Your own time & tools', 'Setup experience required'],
  },
  {
    key: 'pro',
    icon: 'shop',
    name: 'Professional Shop',
    range: '$800–2,000',
    unit: 'per axle',
    featured: true,
    features: ['Parts, labor & precision setup', 'Pattern & backlash dialed in', 'Warranty on the work'],
  },
  {
    key: 'complete',
    icon: 'axles',
    name: 'Complete Front + Rear',
    range: '$1,500–3,500+',
    unit: 'both axles',
    features: ['4WD / AWD dual-diff regear', 'Optional lockers add cost', 'Best long-term drivability'],
  },
];

export const GEAR_FAQS: GearFaq[] = [
  {
    question: 'Do I need new gears after increasing tire size?',
    answer:
      'It depends on how much bigger the tire is and how you drive. A small jump of 3–5% in diameter usually feels fine on stock gears. Once you lose more than about 7–10% of effective gearing — common when going up 3+ inches in tire size — acceleration, towing, and highway response suffer enough that a regear is worth it. This calculator shows your exact effective gearing loss so you can decide.',
  },
  {
    question: 'Will bigger tires reduce acceleration?',
    answer:
      'Yes. A larger tire increases the distance traveled per axle revolution, which reduces torque multiplication at the contact patch. The effect is the same as installing a numerically lower (taller) gear. The bigger the tire relative to stock, the more noticeable the loss — especially from a stop, while towing, and on grades. Regearing back to your original effective ratio restores stock-like acceleration.',
  },
  {
    question: 'How much does a gear swap cost?',
    answer:
      'Parts for a ring-and-pinion plus install kit typically run $300–800 per axle. Professional installation and setup adds $500–1,200 per axle because gear setup is precision work. A 2WD truck with one driven axle lands near the lower end, while a 4WD or AWD vehicle with two differentials can total $1,500–3,500+ once both axles are done. Doing it yourself saves labor but requires specialized tools and experience.',
  },
  {
    question: "What's the difference between actual and effective gear ratio?",
    answer:
      'Your actual (or numerical) gear ratio is the physical ring-and-pinion ratio in the axle, such as 3.73:1. The effective gear ratio is how that ratio behaves once tire size changes. Fitting a taller tire makes a 3.73 axle perform like a numerically lower ratio because the wheel travels farther per turn. Effective gearing is what you actually feel — it drives acceleration, towing, and cruise RPM.',
  },
  {
    question: 'Will larger tires hurt fuel economy?',
    answer:
      'Often, yes — at least until you regear. Bigger, heavier tires add rotating mass and reduce effective gearing, so the engine works harder and downshifts more, especially while towing or climbing. Highway cruise RPM drops, which can help economy slightly in isolation, but the added weight and aerodynamic drag of taller tires usually outweighs that. Restoring effective gearing with a regear typically recovers most of the lost economy.',
  },
  {
    question: 'Should I regear for towing?',
    answer:
      'If you tow regularly on larger tires, regearing is one of the best upgrades you can make. Larger tires reduce low-end torque exactly when you need it most, forcing the transmission to hold lower gears and run hotter. A deeper (numerically higher) gear restores torque multiplication, keeps the engine in its powerband, reduces heat, and improves control on grades. For towing builds, choosing a slightly deeper gear than the daily-driving ideal is common.',
  },
];

export const SEO_GEAR_CONTENT = {
  heading: 'How Tire Size Changes Affect Your Gearing',
  paragraphs: [
    'When you install larger tires, you change far more than ground clearance and looks. A taller tire travels a greater distance with every rotation of the axle, which reduces the torque delivered to the ground for a given engine output. Mechanically, this behaves exactly like switching to a numerically lower differential gear — your axle still reads 3.73:1, but it performs like something taller.',
    'The effective gear ratio is the number that actually matters for how the vehicle feels. It is calculated by multiplying your stock gear ratio by the ratio of stock tire diameter to new tire diameter. The further your new tire diameter is from stock, the more effective gearing you lose, and the more your acceleration, towing capability, and throttle response degrade.',
    'Restoring lost performance is the job of a regear. The ideal gear ratio is found by multiplying your stock gear by the ratio of new tire diameter to stock diameter — it returns your effective gearing to its original value. Because differential gears are only made in fixed steps, the calculator snaps the ideal value to the closest commonly available ratio so you can shop realistically.',
    'Drivers who tow, crawl, or carry heavy loads often choose a gear slightly deeper than the daily-driving ideal. A deeper ratio multiplies torque further, keeps the engine in its powerband under load, lowers transmission temperatures, and improves low-speed control off-road. The trade-off is marginally higher cruise RPM and a small fuel-economy penalty at steady highway speeds.',
    'Cruise RPM is the other half of the equation. Engine speed at a given road speed scales with both gear ratio and vehicle speed and falls as tire diameter grows. Larger tires drop your highway RPM with stock gears, which can push the engine out of its efficient operating range and trigger frequent downshifts. Matching your gear ratio to your tire size and driving style keeps RPM where the engine is happiest.',
    'Finally, remember that tires deform under vehicle weight. The loaded, rolling diameter is typically 2–4% smaller than the advertised size, so an effective-diameter correction produces more realistic gearing, speedometer, and RPM numbers than using the nominal tire size alone.',
  ],
};

export function formatVerdictRowIcon(status: GearImpactRow['status']): string {
  switch (status) {
    case 'pass':
      return '✓';
    case 'warning':
      return '⚠';
    default:
      return '✕';
  }
}
