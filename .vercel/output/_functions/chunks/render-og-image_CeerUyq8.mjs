import { jsxs, jsx } from 'react/jsx-runtime';
import { ImageResponse } from '@vercel/og';

function inferTireCategory(widthMm, aspectRatio, wheelIn) {
  if (aspectRatio <= 45 && widthMm >= 235) return "performance";
  if (aspectRatio >= 70 && widthMm >= 265) return "off-road";
  if (aspectRatio >= 75 || widthMm >= 285 && aspectRatio >= 65) {
    return "light-truck";
  }
  if (aspectRatio >= 60 && widthMm >= 225) return "SUV";
  return "passenger";
}
const TIRE_SIZES = [
  { size: "185/65R15", category: "passenger", ratings: { loadIndex: "88", speedRating: "T" } },
  { size: "195/60R15", category: "passenger", ratings: { loadIndex: "88", speedRating: "H" } },
  { size: "195/65R15", category: "passenger", ratings: { loadIndex: "91", speedRating: "H" } },
  { size: "205/55R16", category: "passenger", ratings: { loadIndex: "91", speedRating: "V" } },
  { size: "205/60R16", category: "passenger", ratings: { loadIndex: "92", speedRating: "H" } },
  { size: "215/55R17", category: "passenger", ratings: { loadIndex: "94", speedRating: "V" } },
  { size: "215/60R16", category: "passenger", ratings: { loadIndex: "95", speedRating: "H" } },
  { size: "225/45R17", category: "performance", ratings: { loadIndex: "91", speedRating: "W" } },
  { size: "225/50R17", category: "performance", ratings: { loadIndex: "94", speedRating: "V" } },
  { size: "225/55R17", category: "passenger", ratings: { loadIndex: "97", speedRating: "W" } },
  { size: "225/65R17", category: "SUV", ratings: { loadIndex: "102", speedRating: "H" } },
  { size: "235/40R18", category: "performance", ratings: { loadIndex: "95", speedRating: "Y" } },
  { size: "235/45R18", category: "performance", ratings: { loadIndex: "94", speedRating: "W" } },
  { size: "235/55R18", category: "SUV", ratings: { loadIndex: "100", speedRating: "V" } },
  { size: "235/60R18", category: "SUV", ratings: { loadIndex: "103", speedRating: "V" } },
  { size: "235/65R17", category: "SUV", ratings: { loadIndex: "104", speedRating: "V" } },
  { size: "245/40R18", category: "performance" },
  { size: "245/45R18", category: "performance", ratings: { loadIndex: "96", speedRating: "W" } },
  { size: "245/60R18", category: "SUV", ratings: { loadIndex: "105", speedRating: "H" } },
  { size: "255/35R19", category: "performance", ratings: { loadIndex: "96", speedRating: "Y" } },
  { size: "255/55R19", category: "SUV", ratings: { loadIndex: "111", speedRating: "V" } },
  { size: "265/60R18", category: "SUV", ratings: { loadIndex: "110", speedRating: "H" } },
  { size: "265/65R18", category: "SUV", ratings: { loadIndex: "114", speedRating: "H" } },
  { size: "265/70R17", category: "off-road", ratings: { loadIndex: "115", speedRating: "T" } },
  { size: "275/55R20", category: "SUV", ratings: { loadIndex: "117", speedRating: "H" } },
  { size: "275/60R20", category: "SUV", ratings: { loadIndex: "115", speedRating: "H" } },
  { size: "275/65R18", category: "SUV", ratings: { loadIndex: "116", speedRating: "T" } },
  { size: "275/70R18", category: "off-road", ratings: { loadIndex: "125/122", speedRating: "R", loadRange: "E" } },
  { size: "285/55R20", category: "SUV", ratings: { loadIndex: "122", speedRating: "H" } },
  { size: "285/65R20", category: "light-truck", ratings: { loadIndex: "127/124", speedRating: "S", loadRange: "E" } },
  { size: "285/70R17", category: "off-road", ratings: { loadIndex: "121/118", speedRating: "S", loadRange: "D" } },
  { size: "285/75R16", category: "light-truck", ratings: { loadIndex: "126/123", speedRating: "R", loadRange: "E" } },
  { size: "295/35R21", category: "performance", ratings: { loadIndex: "107", speedRating: "Y" } },
  { size: "305/55R20", category: "light-truck" },
  { size: "305/70R18", category: "off-road", ratings: { loadIndex: "126/123", speedRating: "R", loadRange: "E" } },
  { size: "315/70R17", category: "off-road", ratings: { loadIndex: "121/118", speedRating: "S", loadRange: "D" } },
  { size: "LT265/75R16", category: "light-truck", ratings: { loadIndex: "123/120", speedRating: "R", loadRange: "E" } }
];

const METRIC_PATTERN = /^(?:P|LT)?(\d+)\/(\d+)([A-Z])(\d+(?:\.\d+)?)$/i;
const FLOTATION_PATTERN = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)([A-Z])(\d+(?:\.\d+)?)$/i;
function flotationDimensionsToMetric(overallDiameterIn, sectionWidthIn, wheelDiameterIn) {
  const sidewallIn = (overallDiameterIn - wheelDiameterIn) / 2;
  const widthMm = sectionWidthIn * 25.4;
  const aspectRatio = sidewallIn / sectionWidthIn * 100;
  return { widthMm, aspectRatio };
}
function parseTireSize(size) {
  const trimmed = size.trim();
  const metricMatch = trimmed.match(METRIC_PATTERN);
  if (metricMatch) {
    const [, width, aspect, construction, wheel] = metricMatch;
    return {
      type: "metric",
      widthMm: Number(width),
      aspectRatio: Number(aspect),
      wheelDiameterIn: Number(wheel),
      construction: construction.toUpperCase()
    };
  }
  const flotationMatch = trimmed.match(FLOTATION_PATTERN);
  if (flotationMatch) {
    const [, overallIn, sectionIn, construction, wheel] = flotationMatch;
    const overallDiameterIn = Number(overallIn);
    const sectionWidthIn = Number(sectionIn);
    const wheelDiameterIn = Number(wheel);
    const { widthMm, aspectRatio } = flotationDimensionsToMetric(
      overallDiameterIn,
      sectionWidthIn,
      wheelDiameterIn
    );
    return {
      type: "flotation",
      widthMm,
      aspectRatio,
      wheelDiameterIn,
      construction: construction.toUpperCase()
    };
  }
  throw new Error(`Invalid tire size: "${size}"`);
}
function getTireSpecs(size) {
  const parsed = parseTireSize(size);
  const sidewallMm = parsed.widthMm * (parsed.aspectRatio / 100);
  const overallDiameterMm = parsed.wheelDiameterIn * 25.4 + 2 * sidewallMm;
  const overallDiameterIn = overallDiameterMm / 25.4;
  const sectionWidthIn = parsed.widthMm / 25.4;
  const sidewallIn = sidewallMm / 25.4;
  const circumferenceIn = overallDiameterIn * Math.PI;
  const circumferenceMm = circumferenceIn * 25.4;
  const revsPerMile = 63360 / circumferenceIn;
  const revsPerKm = 1e5 / (circumferenceIn * 2.54);
  return {
    ...parsed,
    sidewallMm,
    overallDiameterMm,
    overallDiameterIn,
    sectionWidthIn,
    sidewallIn,
    circumferenceIn,
    circumferenceMm,
    revsPerMile,
    revsPerKm
  };
}
function percentChange(newValue, referenceValue) {
  return (newValue - referenceValue) / referenceValue * 100;
}
function compareTires(sizeA, sizeB, indicatedSpeed = 60) {
  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);
  const diameterDiffMm = specsB.overallDiameterMm - specsA.overallDiameterMm;
  const diameterDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const diameterDiffPercent = percentChange(
    specsB.overallDiameterIn,
    specsA.overallDiameterIn
  );
  const trueSpeed = indicatedSpeed * (specsB.overallDiameterIn / specsA.overallDiameterIn);
  const errorPercent = percentChange(trueSpeed, indicatedSpeed);
  return {
    diameterDiffMm: Math.abs(diameterDiffMm),
    diameterDiffIn: Math.abs(diameterDiffIn),
    diameterDiffPercent,
    widthDiffMm: specsB.widthMm - specsA.widthMm,
    sidewallDiffMm: specsB.sidewallMm - specsA.sidewallMm,
    circumferenceDiffIn: specsB.circumferenceIn - specsA.circumferenceIn,
    revsPerMileDiff: specsB.revsPerMile - specsA.revsPerMile,
    revsPerMileDiffPercent: percentChange(
      specsB.revsPerMile,
      specsA.revsPerMile
    ),
    speedometer: {
      indicatedSpeed,
      trueSpeed,
      errorPercent
    },
    groundClearanceChangeIn: (specsB.overallDiameterIn - specsA.overallDiameterIn) / 2
  };
}

const CALCULATOR_PATHS = {
  tireSize: "/calculators/tire-size-calculator/",
  tireComparison: "/calculators/tire-comparison-calculator/",
  tireDiameter: "/calculators/tire-diameter-calculator/",
  wheelOffset: "/calculators/wheel-offset-calculator/",
  speedometerError: "/calculators/speedometer-error-calculator/",
  gearRatio: "/calculators/gear-ratio-calculator/"
};
const CALCULATOR_REGISTRY = [
  {
    id: "tireSize",
    label: "Tire Size Calculator",
    description: "Convert metric tire size into diameter, width, and revolutions per mile",
    href: CALCULATOR_PATHS.tireSize,
    icon: "size",
    status: "published",
    relatedPriority: 1
  },
  {
    id: "tireComparison",
    label: "Tire Comparison Calculator",
    description: "Compare two tire sizes with fitment score and diameter change",
    href: CALCULATOR_PATHS.tireComparison,
    icon: "compare",
    status: "published",
    relatedPriority: 2
  },
  {
    id: "tireDiameter",
    label: "Tire Diameter Calculator",
    description: "Reverse-search tire sizes by target overall diameter",
    href: CALCULATOR_PATHS.tireDiameter,
    icon: "diameter",
    status: "published",
    relatedPriority: 3
  },
  {
    id: "wheelOffset",
    label: "Wheel Offset Calculator",
    description: "Compare offset, poke, and clearance before buying wheels",
    href: CALCULATOR_PATHS.wheelOffset,
    icon: "offset",
    status: "published",
    relatedPriority: 5
  },
  {
    id: "speedometerError",
    label: "Speedometer Error Calculator",
    description: "See how tire-size changes affect indicated speed and odometer accuracy",
    href: CALCULATOR_PATHS.speedometerError,
    icon: "speedometer",
    status: "published",
    relatedPriority: 4
  },
  {
    id: "gearRatio",
    label: "Gear Ratio Calculator",
    description: "Find ideal differential gears after changing tire size",
    href: CALCULATOR_PATHS.gearRatio,
    icon: "gear",
    status: "published",
    relatedPriority: 6
  }
];
CALCULATOR_REGISTRY.filter(
  (calc) => calc.status === "published"
).map(({ label, description, href, icon }) => ({ label, description, href, icon }));
function getPublishedCalculators() {
  return CALCULATOR_REGISTRY.filter((calc) => calc.status === "published");
}
function normalizeCalculatorHref(href) {
  const [pathname, ...queryParts] = href.split("?");
  const base = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const query = queryParts.length ? `?${queryParts.join("?")}` : "";
  return `${base}${query}`;
}
function relatedFromRegistry(excludeHref, options) {
  const normalizedExclude = excludeHref ? normalizeCalculatorHref(excludeHref) : void 0;
  const limit = 6;
  return getPublishedCalculators().filter((calc) => calc.href !== normalizedExclude).filter((calc) => calc.relatedPriority != null).sort((a, b) => (a.relatedPriority ?? 99) - (b.relatedPriority ?? 99)).slice(0, limit);
}
function getRelatedCalculators(excludeHref, options) {
  return relatedFromRegistry(excludeHref).map(({ label, description, href }) => ({
    label,
    description,
    href
  }));
}

function parseFullSizeToFields(size) {
  const trimmed = normalizeTireSizeInput(size.trim());
  if (!trimmed) return null;
  try {
    const parsed = parseTireSize(trimmed);
    return {
      width: String(Math.round(parsed.widthMm)),
      aspectRatio: String(Math.round(parsed.aspectRatio)),
      wheelDiameter: parsed.wheelDiameterIn % 1 === 0 ? String(parsed.wheelDiameterIn) : String(parsed.wheelDiameterIn)
    };
  } catch {
    return null;
  }
}

new Set(
  TIRE_SIZES.map((entry) => normalizeSizeKey(entry.size))
);
function normalizeSizeKey(size) {
  return size.trim().toUpperCase().replace(/\s+/g, "");
}
function normalizeTireSizeInput(raw) {
  let input = raw.trim().toUpperCase();
  if (!input) return "";
  const prefixMatch = input.match(/^(LT|P)(.+)$/);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  let body = prefixMatch ? prefixMatch[2] : input;
  if (body.includes("X")) {
    return `${prefix}${body.replace(/[\s-]+/g, "")}`;
  }
  body = body.replace(/[\s-]+/g, "/").replace(/\/+/g, "/");
  const compact = body.replace(/\//g, "");
  const compactWithR = compact.match(/^(\d{3})(\d{2})R(\d+(?:\.\d+)?)$/);
  if (compactWithR) {
    const [, width, aspect, wheel] = compactWithR;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }
  const digitsOnly = compact.match(/^(\d{3})(\d{2})(\d{1,2}(?:\.\d+)?)$/);
  if (digitsOnly) {
    const [, width, aspect, wheel] = digitsOnly;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }
  const threePart = body.match(/^(\d+)\/(\d+)\/(\d+(?:\.\d+)?)$/);
  if (threePart) {
    const [, width, aspect, wheel] = threePart;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }
  const missingConstruction = body.match(/^(\d+)\/(\d+)(\d+(?:\.\d+)?)$/);
  if (missingConstruction) {
    const [, width, aspect, wheel] = missingConstruction;
    return `${prefix}${width}/${aspect}R${wheel}`;
  }
  if (!/[A-Z]/.test(body)) {
    body = body.replace(/(\d)\/(\d)(?=\d)/, "$1/$2R");
  }
  return `${prefix}${body}`;
}

const LOAD_INDEX_KG = {
  71: 345,
  72: 355,
  73: 365,
  74: 375,
  75: 387,
  76: 400,
  77: 412,
  78: 425,
  79: 437,
  80: 450,
  81: 462,
  82: 475,
  83: 487,
  84: 500,
  85: 515,
  86: 530,
  87: 545,
  88: 560,
  89: 580,
  90: 600,
  91: 615,
  92: 630,
  93: 650,
  94: 670,
  95: 690,
  96: 710,
  97: 730,
  98: 750,
  99: 775,
  100: 800,
  101: 825,
  102: 850,
  103: 875,
  104: 900,
  105: 925,
  106: 950,
  107: 975,
  108: 1e3,
  109: 1030,
  110: 1060,
  111: 1090,
  112: 1120,
  113: 1150,
  114: 1180,
  115: 1215,
  116: 1250,
  117: 1285,
  118: 1320,
  119: 1360,
  120: 1400,
  121: 1450,
  122: 1500,
  123: 1550,
  124: 1600,
  125: 1650,
  126: 1700,
  127: 1750,
  128: 1800,
  129: 1850,
  130: 1900
};
const SPEED_RATING_KMH = {
  L: 120,
  M: 130,
  N: 140,
  P: 150,
  Q: 160,
  R: 170,
  S: 180,
  T: 190,
  U: 200,
  H: 210,
  V: 240,
  W: 270,
  Y: 300
};
const LOAD_RANGE_PLY = {
  B: "4-ply rated",
  C: "6-ply rated",
  D: "8-ply rated",
  E: "10-ply rated",
  F: "12-ply rated",
  G: "14-ply rated"
};
function kgToLbs(kg) {
  return Math.round(kg * 2.2046226);
}
function lbsToKg(lbs) {
  return Math.round(lbs / 2.2046226);
}
function kmhToMph(kmh) {
  return Math.round(kmh / 1.609344);
}
function parsePrimaryLoadIndex(loadIndex) {
  const first = loadIndex.split("/")[0]?.trim();
  const value = Number(first);
  return Number.isFinite(value) ? value : null;
}
function loadIndexToKg(index) {
  return LOAD_INDEX_KG[index] ?? null;
}
function resolveTireRatings(ratings) {
  if (!ratings) return null;
  const resolved = {};
  if (ratings.loadIndex) {
    resolved.loadIndex = ratings.loadIndex;
  }
  if (ratings.speedRating) {
    const symbol = ratings.speedRating.toUpperCase();
    resolved.speedRating = symbol;
    const kmh = SPEED_RATING_KMH[symbol];
    if (kmh) {
      resolved.speedRatingLabel = `${kmh} km/h (${kmhToMph(kmh)} mph)`;
    }
  }
  if (ratings.loadRange) {
    const letter = ratings.loadRange.toUpperCase();
    resolved.loadRange = letter;
    const ply = LOAD_RANGE_PLY[letter];
    if (ply) {
      resolved.loadRangePly = ply;
    }
  }
  let maxLbs = ratings.maxLoadLbs ?? null;
  let maxKg = null;
  if (maxLbs != null) {
    maxKg = lbsToKg(maxLbs);
  } else if (ratings.loadIndex) {
    const index = parsePrimaryLoadIndex(ratings.loadIndex);
    if (index != null) {
      maxKg = loadIndexToKg(index);
      if (maxKg != null) maxLbs = kgToLbs(maxKg);
    }
  }
  if (maxLbs != null) resolved.maxLoadLbs = maxLbs;
  if (maxKg != null) resolved.maxLoadKg = maxKg;
  const hasAnyField = resolved.loadIndex != null || resolved.speedRating != null || resolved.loadRange != null || resolved.maxLoadLbs != null;
  return hasAnyField ? resolved : null;
}

function getTireSizeEntry(size) {
  return TIRE_SIZES.find(
    (e) => e.size.toUpperCase() === size.toUpperCase()
  );
}

const ENGINEERING_ANALYSIS_SECTION_ORDER = [
  "ride-quality",
  "handling",
  "fuel-economy",
  "acceleration",
  "clearance",
  "fitment",
  "daily-driving",
  "highway-driving",
  "recommendation"
];
const COMPARISON_PAGE_SECTION_ROLES = {
  summary: {
    role: "Quick answer",
    owns: ["diameter %", "width %", "speedometer %", "KPI deltas", "spec table values"],
    mustNot: ["Mechanism essays", "Recommendations", "Mock-fit procedures"]
  },
  engineering: {
    role: "Why the differences exist",
    owns: ["Causal chains", "Independent variables (diameter vs sidewall vs width)", "Half-diameter rule concept"],
    mustNot: ["Repeat exact figures already in the summary bar", "Verdict language", "FAQ procedures"]
  },
  performanceImpact: {
    role: "Driving consequences",
    owns: ["Owner-visible effects at the wheel", "Measured deltas tied to feel (comfort, RPM, clearance)"],
    mustNot: ["Re-derive geometry formulas", "Fitment checklists"]
  },
  verdict: {
    role: "Recommendation",
    owns: ["Fitment score", "Category-appropriate use case", "Go / no-go decision", "Verification action"],
    mustNot: ["Full dimension recap", "Engineering tutorials", "Invented MPG claims"]
  },
  faq: {
    role: "New questions only",
    owns: ["Mock-fit steps", "Recalibration methods", "TPMS/ABS relearn", "Replace-all-four guidance"],
    mustNot: ["Restate spec-table numbers", "Duplicate engineering or performance paragraphs"]
  }
};

function fmtPct(n) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
function fmtSigned(n, digits = 2, suffix = "") {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(digits)}${suffix}`;
}
function fmtInQuote(n, digits = 2) {
  return `${n.toFixed(digits)}"`;
}
function nearZero(n, threshold) {
  return Math.abs(n) < threshold;
}
const SIDEWALL_CHANGE_PCT = {
  /** |sidewallPct| below this → largely unchanged ride character. */
  UNCHANGED: 3,
  /** |sidewallPct| above this → significant ride/handling shift. */
  SIGNIFICANT: 10
};
function sidewallPctFromSpecs(specsA, specsB) {
  return (specsB.sidewallIn - specsA.sidewallIn) / specsA.sidewallIn * 100;
}
function sidewallRideTier(sidewallPct) {
  const abs = Math.abs(sidewallPct);
  if (abs < SIDEWALL_CHANGE_PCT.UNCHANGED) return "unchanged";
  if (abs <= SIDEWALL_CHANGE_PCT.SIGNIFICANT) return "noticeable";
  return "significant";
}
function isSidewallRideUnchanged(sidewallPct) {
  return sidewallRideTier(sidewallPct) === "unchanged";
}

const FITMENT_SCORE = {
  /** Score at or above this → good upgrade tier. */
  GOOD: 8,
  /** Score at or above this → workable tier (below GOOD). */
  WORKABLE: 5
};
const REVS_PER_MILE_THRESHOLD = 3;
function fitmentVerdictFromScore(score) {
  if (score >= FITMENT_SCORE.GOOD) {
    return {
      tier: "good",
      headline: "Very close dimensional match — vehicle checks still apply",
      shortLabel: "Very close dimensional match",
      tone: "green",
      indicator: "🟢",
      fitmentLabel: "Close dimensional match",
      level: "excellent"
    };
  }
  if (score >= FITMENT_SCORE.WORKABLE) {
    return {
      tier: "workable",
      headline: "Moderate dimensional change — vehicle checks required",
      shortLabel: "Moderate change — vehicle checks required",
      tone: "yellow",
      indicator: "🟡",
      fitmentLabel: "Moderate dimensional change",
      level: "good"
    };
  }
  return {
    tier: "aggressive",
    headline: "Significant dimensional change — vehicle checks required",
    shortLabel: "Significant dimensional change",
    tone: "red",
    indicator: "🔴",
    fitmentLabel: "Significant dimensional change",
    level: "not-recommended"
  };
}
function fitmentLabelFromScore(score) {
  const verdict = fitmentVerdictFromScore(score);
  return { score, tone: verdict.tone, label: verdict.fitmentLabel };
}
function computeFitmentScore(comparison, specsA, specsB) {
  let score = 10;
  const diamPct = Math.abs(comparison.diameterDiffPercent);
  const widthPct = Math.abs((specsB.widthMm - specsA.widthMm) / specsA.widthMm * 100);
  const speedo = Math.abs(comparison.speedometer.errorPercent);
  score -= diamPct * 0.35;
  score -= widthPct * 0.12;
  score -= speedo * 0.18;
  if (specsB.wheelDiameterIn !== specsA.wheelDiameterIn) score -= 0.6;
  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  return fitmentLabelFromScore(score);
}

function speedUnitLabel(unitSystem) {
  return unitSystem === "metric" ? "km/h" : "mph";
}
function rpmAtSpeed(speed, specs, unitSystem) {
  if (unitSystem === "metric") {
    return speed * specs.revsPerKm / 60;
  }
  return speed * specs.revsPerMile / 60;
}

function resolveTireCategory(size, specs) {
  return getTireSizeEntry(size)?.category ?? inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn);
}
function buildRecommendationContext(sizeA, sizeB, comparison, specsA, specsB, options = {}) {
  const indicatedSpeed = options.indicatedSpeed ?? comparison.speedometer.indicatedSpeed;
  return {
    sizeA,
    sizeB,
    categoryA: resolveTireCategory(sizeA, specsA),
    categoryB: resolveTireCategory(sizeB, specsB),
    specsA,
    specsB,
    comparison,
    ratingsA: options.ratingsA ?? null,
    ratingsB: options.ratingsB ?? null,
    fitmentScore: options.fitmentScore ?? 10,
    unitSystem: options.unitSystem ?? "imperial",
    indicatedSpeed,
    rpmA: options.rpmA ?? 0,
    rpmB: options.rpmB ?? 0,
    rpmDelta: options.rpmDelta ?? 0,
    widthPct: options.widthPct ?? (specsB.widthMm - specsA.widthMm) / specsA.widthMm * 100,
    sidewallPct: options.sidewallPct ?? (specsB.sidewallIn - specsA.sidewallIn) / specsA.sidewallIn * 100
  };
}
function loadIndexValue(ratings) {
  if (!ratings?.loadIndex) return null;
  return parsePrimaryLoadIndex(ratings.loadIndex);
}
function dimensionalSignals(ctx) {
  const { specsA, specsB, comparison } = ctx;
  const diamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDeltaMm = specsB.widthMm - specsA.widthMm;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;
  return {
    diamDiffIn,
    widthDeltaMm,
    sidewallDiff,
    aspectDiff,
    taller: diamDiffIn > 0.05,
    shorter: diamDiffIn < -0.05,
    wider: widthDeltaMm > 3,
    narrower: widthDeltaMm < -3,
    softer: ctx.sidewallPct >= SIDEWALL_CHANGE_PCT.UNCHANGED,
    firmer: ctx.sidewallPct <= -3,
    balanced: Math.abs(comparison.diameterDiffPercent) < 2 && Math.abs(widthDeltaMm) < 8,
    highway: comparison.revsPerMileDiff < -3 && Math.abs(comparison.speedometer.errorPercent) < 3,
    winter: widthDeltaMm < -3 || ctx.sidewallPct >= SIDEWALL_CHANGE_PCT.UNCHANGED && widthDeltaMm <= 0,
    revsDown: comparison.revsPerMileDiff < -REVS_PER_MILE_THRESHOLD,
    revsUp: comparison.revsPerMileDiff > REVS_PER_MILE_THRESHOLD,
    speedoHigh: Math.abs(comparison.speedometer.errorPercent) > 3,
    clearanceGain: comparison.groundClearanceChangeIn > 0.01
  };
}
function buildCategoryRecommendationBody(ctx) {
  const { sizeA, sizeB, categoryB, fitmentScore } = ctx;
  const verdict = fitmentVerdictFromScore(fitmentScore);
  const headline = `Fitment score ${fitmentScore.toFixed(1)}/10 — ${verdict.headline}.`;
  const usage = buildCategoryUsageParagraph(ctx);
  const action = verdict.tier === "good" ? `Confirm load index${ctx.ratingsB?.loadIndex ? ` (${ctx.ratingsB.loadIndex})` : ""}, speed rating${ctx.ratingsB?.speedRating ? ` (${ctx.ratingsB.speedRating})` : ""}, and inner fender clearance on your vehicle before purchasing four tires.` : verdict.tier === "workable" ? `Mock-fit at full lock and full compression, verify wheel offset, and confirm inner fender clearance before purchasing four tires.` : `Plan for trimming, revised offset, lift, or regearing as needed — mock-fit every corner at full articulation before committing to ${sizeB}.`;
  return `${headline} ${usage} ${action}`;
}
function buildCategoryUsageParagraph(ctx) {
  const { categoryB, sizeB, specsB } = ctx;
  const d = dimensionalSignals(ctx);
  const loadB = loadIndexValue(ctx.ratingsB);
  switch (categoryB) {
    case "performance":
      return [
        `${sizeB} is a performance-class fitment — steering response and contact-patch stability on paved roads drive the recommendation, not towing or trail duty.`,
        d.firmer ? `The shorter sidewall limits tread squirm under lateral load, which suits highway and spirited driving.` : d.wider ? `The wider section enlarges the contact patch for dry-pavement grip — not off-road clearance work.` : `Dimensional character stays near the reference size — a measured plus-size step for performance duty.`,
        d.revsDown ? `Lower cruising RPM at highway speed reduces engine load — a secondary benefit for daily commuting.` : ""
      ].filter(Boolean).join(" ");
    case "SUV":
      return [
        `${sizeB} fits SUV and crossover use — comfort and family hauling matter more than track response.`,
        d.softer ? `The taller sidewall adds vertical compliance for loaded suspension travel and rough pavement.` : d.taller ? `The taller overall diameter adds static ride height for light trails — not rock-crawling articulation.` : `Ride height and sidewall stay close to the reference — an OEM-style swap for daily SUV duty.`,
        loadB && loadB >= 100 ? `Load index ${ctx.ratingsB?.loadIndex} supports light towing when paired with appropriate vehicle ratings.` : ""
      ].filter(Boolean).join(" ");
    case "light-truck":
      return [
        `${sizeB} is sized for light-truck duty — payload and towing ratings drive the recommendation, not lap times.`,
        loadB ? `Load index ${ctx.ratingsB?.loadIndex}${ctx.ratingsB?.loadRange ? ` with load range ${ctx.ratingsB.loadRange}` : ""} defines rated carrying capacity; verify against your door-placard minimum.` : `Section width changes the footprint under loaded axles — confirm against your payload needs.`,
        d.taller ? `Taller overall diameter adds static clearance when the truck is loaded — measure at ride height, not curb weight only.` : d.wider ? `Wider section spreads load across a larger contact patch for towing stability.` : ""
      ].filter(Boolean).join(" ");
    case "off-road":
      return [
        `${sizeB} targets off-road and trail use where clearance and sidewall compliance matter.`,
        d.taller ? `Taller overall diameter raises static clearance — verify fender envelope at full articulation before trail use.` : `Diameter change is limited — focus on width and sidewall compliance for trail performance.`,
        d.softer || specsB.sidewallIn >= ctx.specsA.sidewallIn ? `Sidewall compliance affects how the tire conforms over uneven terrain.` : d.firmer ? `The shorter sidewall reduces flex — decide whether trail articulation or pavement response is the priority.` : ""
      ].filter(Boolean).join(" ");
    default:
      return [
        `${sizeB} is a passenger-size fitment focused on daily transportation.`,
        d.revsDown ? `Lower cruising RPM at highway speed is the primary efficiency driver for commuting duty.` : d.softer ? `The taller sidewall improves impact absorption on daily routes.` : `Dimensional deltas are moderate — treat as an OEM-adjacent replacement step.`
      ].join(" ");
  }
}

function fmtIn$1(n, digits = 2) {
  return `${n.toFixed(digits)} in`;
}
function fmtMm(n, digits = 1) {
  return `${n.toFixed(digits)} mm`;
}
function formatDimensionDelta(signedIn, signedMm, pct, unitSystem) {
  if (unitSystem === "metric") {
    return `${fmtSigned(signedMm, 1, " mm")} (${fmtPct(pct)})`;
  }
  return `${fmtSigned(signedIn, 2, '"')} (${fmtPct(pct)})`;
}
function ratingsSummary(ratings, fallback) {
  if (!ratings) return fallback;
  const parts = [];
  if (ratings.loadIndex) parts.push(`load index ${ratings.loadIndex}`);
  if (ratings.speedRating) {
    parts.push(
      ratings.speedRatingLabel ? `speed rating ${ratings.speedRating} (${ratings.speedRatingLabel})` : `speed rating ${ratings.speedRating}`
    );
  }
  if (ratings.loadRange) {
    parts.push(
      ratings.loadRangePly ? `load range ${ratings.loadRange} (${ratings.loadRangePly})` : `load range ${ratings.loadRange}`
    );
  }
  return parts.length > 0 ? parts.join(", ") : fallback;
}
function buildComparisonMeasurements(sizeA, sizeB, comparison, specsA, specsB, unitSystem = "imperial", fitmentScore = 10) {
  const indicatedSpeed = comparison.speedometer.indicatedSpeed;
  const rpmA = Math.round(rpmAtSpeed(indicatedSpeed, specsA, unitSystem));
  const rpmB = Math.round(rpmAtSpeed(indicatedSpeed, specsB, unitSystem));
  const speedUnit = speedUnitLabel(unitSystem);
  const widthPct = (specsB.widthMm - specsA.widthMm) / specsA.widthMm * 100;
  const sidewallPct = sidewallPctFromSpecs(specsA, specsB);
  const revsDiff = unitSystem === "metric" ? specsB.revsPerKm - specsA.revsPerKm : comparison.revsPerMileDiff;
  const revsDiffPct = unitSystem === "metric" ? (specsB.revsPerKm - specsA.revsPerKm) / specsA.revsPerKm * 100 : comparison.revsPerMileDiffPercent;
  const entryA = getTireSizeEntry(sizeA);
  const entryB = getTireSizeEntry(sizeB);
  return {
    sizeA,
    sizeB,
    specsA,
    specsB,
    comparison,
    unitSystem,
    indicatedSpeed,
    rpmA,
    rpmB,
    rpmDelta: rpmB - rpmA,
    widthPct,
    sidewallPct,
    revsDiffPct,
    revsDiff,
    diamDiffIn: specsB.overallDiameterIn - specsA.overallDiameterIn,
    diamDiffMm: specsB.overallDiameterMm - specsA.overallDiameterMm,
    widthDiffIn: specsB.sectionWidthIn - specsA.sectionWidthIn,
    widthDiffMm: comparison.widthDiffMm,
    sidewallDiffIn: specsB.sidewallIn - specsA.sidewallIn,
    sidewallDiffMm: comparison.sidewallDiffMm,
    circumferenceDiffIn: comparison.circumferenceDiffIn,
    groundClearanceChangeIn: comparison.groundClearanceChangeIn,
    absDiamPct: Math.abs(comparison.diameterDiffPercent),
    absWidthPct: Math.abs(widthPct),
    absSpeedoPct: Math.abs(comparison.speedometer.errorPercent),
    wheelDelta: specsB.wheelDiameterIn - specsA.wheelDiameterIn,
    trueSpeed: comparison.speedometer.trueSpeed,
    speedUnit,
    ratingsA: entryA ? resolveTireRatings(entryA.ratings) : null,
    ratingsB: entryB ? resolveTireRatings(entryB.ratings) : null,
    fitmentScore
  };
}
function buildRideQualitySection(m) {
  const { specsA, specsB, comparison, unitSystem } = m;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const sidewallDiffMm = specsB.sidewallMm - specsA.sidewallMm;
  const aspectDiff = specsB.aspectRatio - specsA.aspectRatio;
  let body;
  if (isSidewallRideUnchanged(m.sidewallPct)) {
    body = [
      `Sidewall height is essentially unchanged — ${fmtInQuote(specsA.sidewallIn)} on ${m.sizeA} versus ${fmtInQuote(specsB.sidewallIn)} on ${m.sizeB} (${formatDimensionDelta(sidewallDiff, sidewallDiffMm, m.sidewallPct, unitSystem)}).`,
      `With aspect ratio moving only ${fmtSigned(aspectDiff, 0)} points (${specsA.aspectRatio} → ${specsB.aspectRatio}), the air-spring volume in the sidewall stays similar, so impact absorption and road-texture transmission should remain close to the reference tire.`
    ].join(" ");
  } else if (sidewallDiff > 0) {
    body = [
      `${m.sizeB} carries ${formatDimensionDelta(sidewallDiff, sidewallDiffMm, m.sidewallPct, unitSystem)} more sidewall height than ${m.sizeA} (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}; aspect ratio ${specsA.aspectRatio} → ${specsB.aspectRatio}).`,
      `That taller sidewall behaves like a larger air spring: it can absorb more vertical deflection before the tread contacts the rim, which generally softens the ride over potholes and expansion joints.`,
      `The trade-off is increased sidewall flex under cornering load, which can feel less precise than a shorter sidewall on the same overall diameter (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}, ${fmtPct(comparison.diameterDiffPercent)}).`
    ].join(" ");
  } else {
    body = [
      `${m.sizeB} shortens the sidewall by ${formatDimensionDelta(sidewallDiff, sidewallDiffMm, m.sidewallPct, unitSystem)} relative to ${m.sizeA} (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}; aspect ratio ${specsA.aspectRatio} → ${specsB.aspectRatio}).`,
      `The shorter sidewall reduces vertical compliance — less air volume deflects under impact, so road texture and sharp edges transfer more directly to the suspension and cabin.`,
      `That same reduction in sidewall flex generally firms up transient response on paved surfaces, at the cost of a harsher ride over broken pavement compared with the taller ${fmtInQuote(specsA.sidewallIn)} sidewall on ${m.sizeA}.`
    ].join(" ");
  }
  return { id: "ride-quality", title: "Ride Quality", body };
}
function buildHandlingSection(m) {
  const { specsA, specsB, comparison, unitSystem } = m;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDiffIn = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const wheelDiff = specsB.wheelDiameterIn - specsA.wheelDiameterIn;
  const sidewallPart = isSidewallRideUnchanged(m.sidewallPct) ? `Sidewall height is nearly identical (${fmtInQuote(specsA.sidewallIn)} vs ${fmtInQuote(specsB.sidewallIn)}), so sidewall flex during turn-in should remain similar.` : sidewallDiff < 0 ? `The ${formatDimensionDelta(sidewallDiff, specsB.sidewallMm - specsA.sidewallMm, m.sidewallPct, unitSystem)} sidewall reduction limits tread squirm under lateral load, which generally sharpens steering response on paved roads — at the expense of transmitting more impact energy when the sidewall cannot deflect as far.` : `The ${formatDimensionDelta(sidewallDiff, specsB.sidewallMm - specsA.sidewallMm, m.sidewallPct, unitSystem)} taller sidewall allows more tread movement under cornering load, which can feel softer in transitions even though overall diameter changed ${fmtPct(comparison.diameterDiffPercent)}.`;
  const widthPart = nearZero(widthDiffMm, 2) ? `Section width is essentially unchanged (${fmtInQuote(specsA.sectionWidthIn)} vs ${fmtInQuote(specsB.sectionWidthIn)}), so contact-patch width and steering effort should stay familiar.` : widthDiffIn > 0 ? `Section width grows ${formatDimensionDelta(widthDiffIn, widthDiffMm, m.widthPct, unitSystem)} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}), enlarging the contact patch and typically increasing steering effort and scrub radius at full lock.` : `Section width narrows ${formatDimensionDelta(widthDiffIn, widthDiffMm, m.widthPct, unitSystem)} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}), reducing contact-patch area and usually lowering steering effort.`;
  const wheelPart = wheelDiff === 0 ? `Both sizes mount on ${specsA.wheelDiameterIn}" wheels, so wheel diameter does not add a separate handling variable.` : `Wheel diameter changes from ${specsA.wheelDiameterIn}" to ${specsB.wheelDiameterIn}" (${fmtSigned(wheelDiff, 0, '"')}), which shifts the rim-to-tread geometry and can alter turn-in feel independent of the sidewall change.`;
  return {
    id: "handling",
    title: "Handling",
    body: [sidewallPart, widthPart, wheelPart].join(" ")
  };
}
function buildFuelEconomySection(m) {
  const { specsA, specsB, comparison, unitSystem, indicatedSpeed, rpmA, rpmB, rpmDelta } = m;
  const speedUnit = speedUnitLabel(unitSystem);
  const revsLabel = unitSystem === "metric" ? "revs/km" : "revs/mi";
  const revsA = unitSystem === "metric" ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === "metric" ? specsB.revsPerKm : specsB.revsPerMile;
  const revsDiff = revsB - revsA;
  const revsDiffPct = unitSystem === "metric" ? (specsB.revsPerKm - specsA.revsPerKm) / specsA.revsPerKm * 100 : comparison.revsPerMileDiffPercent;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const rpmPart = revsDiff > 0 ? `At ${indicatedSpeed} ${speedUnit} indicated, engine speed rises from ${rpmA.toLocaleString()} to ${rpmB.toLocaleString()} RPM (${fmtSigned(rpmDelta, 0, " RPM")}) because ${revsLabel} increase ${fmtSigned(revsDiff, unitSystem === "metric" ? 1 : 0)} (${fmtPct(revsDiffPct)}).` : revsDiff < 0 ? `At ${indicatedSpeed} ${speedUnit} indicated, engine speed falls from ${rpmA.toLocaleString()} to ${rpmB.toLocaleString()} RPM (${fmtSigned(rpmDelta, 0, " RPM")}) because ${revsLabel} decrease ${fmtSigned(revsDiff, unitSystem === "metric" ? 1 : 0)} (${fmtPct(revsDiffPct)}).` : `At ${indicatedSpeed} ${speedUnit} indicated, engine speed stays at ${rpmA.toLocaleString()} RPM because ${revsLabel} are unchanged (${revsA.toFixed(1)} → ${revsB.toFixed(1)}).`;
  const circPart = `Rolling circumference shifts ${unitSystem === "metric" ? fmtSigned(comparison.circumferenceDiffIn * 25.4, 1, " mm") : fmtSigned(comparison.circumferenceDiffIn, 2, '"')} (${fmtPct(comparison.diameterDiffPercent)}), from ${unitSystem === "metric" ? fmtMm(specsA.circumferenceMm) : fmtIn$1(specsA.circumferenceIn)} to ${unitSystem === "metric" ? fmtMm(specsB.circumferenceMm) : fmtIn$1(specsB.circumferenceIn)} per revolution.`;
  const widthPart = nearZero(widthDiffMm, 2) ? `Section width is nearly unchanged, so rolling resistance from tread width should remain similar.` : widthDiffMm > 0 ? `Section width increases ${fmtSigned(widthDiffMm, 0, " mm")} (${fmtPct(m.widthPct)}), which adds tread rubber on the road and can increase rolling resistance at a given pressure — a separate factor from the ${revsLabel} change.` : `Section width decreases ${fmtSigned(widthDiffMm, 0, " mm")} (${fmtPct(m.widthPct)}), which reduces tread contact area and can lower rolling resistance at a given pressure.`;
  return {
    id: "fuel-economy",
    title: "Fuel Economy",
    body: `${rpmPart} ${circPart} ${widthPart} These are the measurable drivers of engine load at cruising speed; actual fuel consumption also depends on vehicle weight, aerodynamics, and tire compound, which are outside this dimensional comparison.`
  };
}
function buildAccelerationSection(m) {
  const { specsA, specsB, comparison, unitSystem } = m;
  const revsLabel = unitSystem === "metric" ? "revs/km" : "revs/mi";
  const revsA = unitSystem === "metric" ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === "metric" ? specsB.revsPerKm : specsB.revsPerMile;
  let body;
  if (nearZero(comparison.diameterDiffPercent, 0.1)) {
    body = [
      `Overall diameter is effectively unchanged (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}, ${fmtPct(comparison.diameterDiffPercent)}), so effective axle ratio at the tire remains the same.`,
      `${revsLabel} stay at ${revsA.toFixed(1)} versus ${revsB.toFixed(1)} per ${unitSystem === "metric" ? "kilometre" : "mile"}, meaning the drivetrain turns the same number of revolutions for each unit of road distance.`
    ].join(" ");
  } else if (comparison.diameterDiffPercent > 0) {
    body = [
      `${m.sizeB} is ${formatDimensionDelta(specsB.overallDiameterIn - specsA.overallDiameterIn, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} taller in overall diameter (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Each drive-wheel revolution covers more ground (${unitSystem === "metric" ? fmtMm(specsA.circumferenceMm) : fmtIn$1(specsA.circumferenceIn)} → ${unitSystem === "metric" ? fmtMm(specsB.circumferenceMm) : fmtIn$1(specsB.circumferenceIn)} circumference), which acts like a taller effective gear ratio — the engine turns ${fmtSigned(revsB - revsA, unitSystem === "metric" ? 1 : 0)} fewer ${revsLabel} (${fmtPct(comparison.revsPerMileDiffPercent)}) for the same road speed.`,
      `That mechanical advantage can make throttle response feel softer from a stop, because each crankshaft revolution delivers more forward distance at the contact patch.`
    ].join(" ");
  } else {
    body = [
      `${m.sizeB} is ${formatDimensionDelta(specsB.overallDiameterIn - specsA.overallDiameterIn, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} shorter in overall diameter (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Each drive-wheel revolution covers less ground (${unitSystem === "metric" ? fmtMm(specsA.circumferenceMm) : fmtIn$1(specsA.circumferenceIn)} → ${unitSystem === "metric" ? fmtMm(specsB.circumferenceMm) : fmtIn$1(specsB.circumferenceIn)} circumference), which acts like a shorter effective gear ratio — the engine turns ${fmtSigned(revsB - revsA, unitSystem === "metric" ? 1 : 0)} more ${revsLabel} (${fmtPct(comparison.revsPerMileDiffPercent)}) for the same road speed.`,
      `That shorter rolling radius can make throttle response feel more immediate from a stop, because each crankshaft revolution delivers less forward distance at the contact patch.`
    ].join(" ");
  }
  return { id: "acceleration", title: "Acceleration", body };
}
function buildClearanceSection(m) {
  const { specsA, specsB, comparison, unitSystem } = m;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const clearance = comparison.groundClearanceChangeIn;
  const halfDiam = diamDiff / 2;
  let body;
  if (nearZero(clearance, 0.01)) {
    body = [
      `Overall diameter is unchanged (${fmtInQuote(specsA.overallDiameterIn)} on both sizes), so static ground clearance at the lowest chassis point should remain the same.`,
      `The half-diameter rule applies: with ${fmtSigned(diamDiff, 2, '"')} diameter change, ride height shifts ${fmtSigned(clearance, 2, " in")} at the axle centerline.`
    ].join(" ");
  } else if (clearance > 0) {
    body = [
      `Overall diameter increases ${formatDimensionDelta(diamDiff, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Static ground clearance at the differential or lowest chassis point rises approximately ${unitSystem === "metric" ? fmtSigned(clearance * 25.4, 1, " mm") : fmtSigned(clearance, 2, " in")} — half the ${unitSystem === "metric" ? fmtSigned(diamDiff * 25.4, 1, " mm") : fmtSigned(diamDiff, 2, '"')} diameter delta (${fmtSigned(halfDiam, 2, '"')} at each axle).`,
      `Break-over angle improves because the contact patches sit farther from the vehicle centerline, but verify that the larger tire envelope clears the fender and liner at full suspension compression before relying on the extra height.`
    ].join(" ");
  } else {
    body = [
      `Overall diameter decreases ${formatDimensionDelta(diamDiff, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
      `Static ground clearance falls approximately ${unitSystem === "metric" ? fmtSigned(Math.abs(clearance) * 25.4, 1, " mm") : fmtSigned(Math.abs(clearance), 2, " in")} — half the ${unitSystem === "metric" ? fmtSigned(Math.abs(diamDiff) * 25.4, 1, " mm") : fmtSigned(Math.abs(diamDiff), 2, '"')} diameter reduction.`,
      `Approach and departure angles tighten accordingly; confirm this trade-off against your clearance needs.`
    ].join(" ");
  }
  return { id: "clearance", title: "Clearance", body };
}
function buildFitmentSection(m) {
  const { specsA, specsB, comparison, unitSystem, ratingsA, ratingsB } = m;
  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const widthDiffIn = specsB.sectionWidthIn - specsA.sectionWidthIn;
  const wheelDiff = specsB.wheelDiameterIn - specsA.wheelDiameterIn;
  const envelopePart = [
    `Diameter change: ${formatDimensionDelta(diamDiff, specsB.overallDiameterMm - specsA.overallDiameterMm, comparison.diameterDiffPercent, unitSystem)} (${fmtInQuote(specsA.overallDiameterIn)} → ${fmtInQuote(specsB.overallDiameterIn)}).`,
    `Section width change: ${formatDimensionDelta(widthDiffIn, specsB.widthMm - specsA.widthMm, m.widthPct, unitSystem)} (${fmtInQuote(specsA.sectionWidthIn)} → ${fmtInQuote(specsB.sectionWidthIn)}).`,
    wheelDiff === 0 ? `Wheel diameter is unchanged at ${specsA.wheelDiameterIn}".` : `Wheel diameter changes ${specsA.wheelDiameterIn}" → ${specsB.wheelDiameterIn}" (${fmtSigned(wheelDiff, 0, '"')}), requiring a wheel matched to the new bead seat.`
  ].join(" ");
  const ratingsPart = `Reference ratings for ${m.sizeA}: ${ratingsSummary(ratingsA, "not in dataset")}. New size ${m.sizeB}: ${ratingsSummary(ratingsB, "not in dataset")}. Verify that load index and speed rating meet or exceed your vehicle placard before installation.`;
  const verifyPart = Math.abs(comparison.diameterDiffPercent) > 3 || Math.abs(m.widthPct) > 5 ? `With combined diameter and width growth, mock-fit at full steering lock and maximum suspension compression before purchasing — the tire envelope expands upward into the fender lip, inward toward the strut, and rearward into the inner liner.` : `Dimensional deltas are moderate; still verify inner fender, suspension, and brake clearance on your exact wheel offset before committing to a full set.`;
  return {
    id: "fitment",
    title: "Fitment",
    body: `${envelopePart} ${ratingsPart} ${verifyPart}`
  };
}
function buildDailyDrivingSection(m) {
  const { comparison, specsA, specsB, unitSystem, indicatedSpeed, rpmA, rpmB } = m;
  const speedUnit = speedUnitLabel(unitSystem);
  const trueSpeed = comparison.speedometer.trueSpeed;
  const sidewallDiff = specsB.sidewallIn - specsA.sidewallIn;
  const widthDiffMm = specsB.widthMm - specsA.widthMm;
  const speedoPart = nearZero(comparison.speedometer.errorPercent, 0.1) ? `Speedometer error is negligible (${fmtPct(comparison.speedometer.errorPercent)}): at ${indicatedSpeed} ${speedUnit} indicated, true speed is ${trueSpeed.toFixed(1)} ${speedUnit}.` : `Speedometer reads ${fmtPct(comparison.speedometer.errorPercent)} versus true speed — at ${indicatedSpeed} ${speedUnit} indicated, actual road speed is ${trueSpeed.toFixed(1)} ${speedUnit}. ${Math.abs(comparison.speedometer.errorPercent) > 3 ? "Recalibration may be needed for drivers who rely on precise indicated speed." : "Most daily drivers stay within a typical OEM tolerance band."}`;
  const ridePart = isSidewallRideUnchanged(m.sidewallPct) ? `Sidewall height is similar (${fmtInQuote(specsA.sidewallIn)} vs ${fmtInQuote(specsB.sidewallIn)}), so commute ride compliance should feel familiar.` : sidewallDiff > 0 ? `The ${fmtSigned(sidewallDiff, 2, '"')} taller sidewall (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}) adds impact absorption on broken urban pavement.` : `The ${fmtSigned(Math.abs(sidewallDiff), 2, '"')} shorter sidewall (${fmtInQuote(specsA.sidewallIn)} → ${fmtInQuote(specsB.sidewallIn)}) transmits more road texture during stop-and-go driving.`;
  const steerPart = nearZero(widthDiffMm, 2) ? `Section width is unchanged at ${fmtInQuote(specsA.sectionWidthIn)}, so steering effort should remain similar.` : widthDiffMm > 0 ? `Section width grows ${fmtSigned(widthDiffMm, 0, " mm")} (${fmtPct(m.widthPct)}), which typically increases steering effort at parking speeds.` : `Section width narrows ${fmtSigned(widthDiffMm, 0, " mm")} (${fmtPct(m.widthPct)}), which typically lowers steering effort at parking speeds.`;
  const rpmPart = `Cruising RPM at ${indicatedSpeed} ${speedUnit}: ${rpmA.toLocaleString()} → ${rpmB.toLocaleString()} (${fmtSigned(m.rpmDelta, 0, " RPM")}).`;
  return {
    id: "daily-driving",
    title: "Daily Driving",
    body: [speedoPart, ridePart, steerPart, rpmPart].join(" ")
  };
}
function buildHighwayDrivingSection(m) {
  const { specsA, specsB, comparison, unitSystem, indicatedSpeed, rpmA, rpmB, rpmDelta } = m;
  const speedUnit = speedUnitLabel(unitSystem);
  const revsLabel = unitSystem === "metric" ? "revs/km" : "revs/mi";
  const revsA = unitSystem === "metric" ? specsA.revsPerKm : specsA.revsPerMile;
  const revsB = unitSystem === "metric" ? specsB.revsPerKm : specsB.revsPerMile;
  const rpmPart = `At ${indicatedSpeed} ${speedUnit} indicated, engine speed is ${rpmA.toLocaleString()} RPM on ${m.sizeA} versus ${rpmB.toLocaleString()} RPM on ${m.sizeB} (${fmtSigned(rpmDelta, 0, " RPM")}).`;
  const revsPart = `${revsLabel}: ${revsA.toFixed(1)} → ${revsB.toFixed(1)} (${fmtSigned(revsB - revsA, unitSystem === "metric" ? 1 : 0)}, ${fmtPct(comparison.revsPerMileDiffPercent)}).`;
  const speedoPart = `True speed at ${indicatedSpeed} ${speedUnit} indicated: ${comparison.speedometer.trueSpeed.toFixed(1)} ${speedUnit} (${fmtPct(comparison.speedometer.errorPercent)} error).`;
  const circPart = `Circumference per revolution: ${unitSystem === "metric" ? fmtMm(specsA.circumferenceMm) : fmtIn$1(specsA.circumferenceIn)} → ${unitSystem === "metric" ? fmtMm(specsB.circumferenceMm) : fmtIn$1(specsB.circumferenceIn)} (${unitSystem === "metric" ? fmtSigned(comparison.circumferenceDiffIn * 25.4, 1, " mm") : fmtSigned(comparison.circumferenceDiffIn, 2, '"')}).`;
  return {
    id: "highway-driving",
    title: "Highway Driving",
    body: [rpmPart, revsPart, speedoPart, circPart].join(" ")
  };
}
function buildRecommendationSection(m) {
  const ctx = buildRecommendationContext(m.sizeA, m.sizeB, m.comparison, m.specsA, m.specsB, {
    fitmentScore: m.fitmentScore,
    unitSystem: m.unitSystem,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    indicatedSpeed: m.indicatedSpeed,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct
  });
  return {
    id: "recommendation",
    title: "Recommendation",
    body: buildCategoryRecommendationBody(ctx)
  };
}
const SECTION_BUILDERS = {
  "ride-quality": buildRideQualitySection,
  handling: buildHandlingSection,
  "fuel-economy": buildFuelEconomySection,
  acceleration: buildAccelerationSection,
  clearance: buildClearanceSection,
  fitment: buildFitmentSection,
  "daily-driving": buildDailyDrivingSection,
  "highway-driving": buildHighwayDrivingSection,
  recommendation: buildRecommendationSection
};
function buildEngineeringAnalysis(sizeA, sizeB, comparison, specsA, specsB, unitSystem = "imperial", fitmentScore = 10) {
  const measurements = buildComparisonMeasurements(
    sizeA,
    sizeB,
    comparison,
    specsA,
    specsB,
    unitSystem,
    fitmentScore
  );
  const sections = ENGINEERING_ANALYSIS_SECTION_ORDER.map((id) => SECTION_BUILDERS[id](measurements));
  const byId = Object.fromEntries(sections.map((s) => [s.id, s]));
  return { measurements, sections, byId };
}
function buildComparisonAnalysis(sizeA, sizeB, comparison, specsA, specsB, unitSystem = "imperial") {
  const { score } = computeFitmentScore(comparison, specsA, specsB);
  return buildEngineeringAnalysis(sizeA, sizeB, comparison, specsA, specsB, unitSystem, score);
}

[
  CALCULATOR_PATHS.tireSize,
  CALCULATOR_PATHS.tireComparison,
  CALCULATOR_PATHS.wheelOffset,
  CALCULATOR_PATHS.tireDiameter
].map((href) => getRelatedCalculators(CALCULATOR_PATHS.gearRatio).find((item) => item.href === href)).filter((item) => Boolean(item));

Object.entries(COMPARISON_PAGE_SECTION_ROLES).map(
  ([key, role]) => ({
    section: key,
    mustOwn: role.owns.join("; "),
    mustAvoid: role.mustNot.join("; ")
  })
);

getRelatedCalculators(CALCULATOR_PATHS.wheelOffset);

function isParsableTireSize(size) {
  try {
    parseTireSize(normalizeTireSizeInput(size));
    return true;
  } catch {
    return false;
  }
}
function parseTireSizeFromSearch(params, fallback) {
  const raw = params.get("size")?.trim();
  if (!raw) return fallback;
  const normalized = normalizeTireSizeInput(raw);
  if (!isParsableTireSize(normalized)) return void 0;
  return normalized;
}
function parseTireComparisonFromSearch(params, defaults) {
  const fromRaw = params.get("from") ?? params.get("current");
  const toRaw = params.get("to") ?? params.get("new");
  const thirdRaw = params.get("third");
  const from = fromRaw ? normalizeTireSizeInput(fromRaw) : defaults.from;
  const to = toRaw ? normalizeTireSizeInput(toRaw) : defaults.to;
  const result = {
    from: parseFullSizeToFields(from) ? from : defaults.from,
    to: parseFullSizeToFields(to) ? to : defaults.to
  };
  if (thirdRaw?.trim()) {
    const third = normalizeTireSizeInput(thirdRaw);
    if (parseFullSizeToFields(third)) result.third = third;
  } else if (defaults.third && parseFullSizeToFields(defaults.third)) {
    result.third = defaults.third;
  }
  return result;
}

function specsToOgData(size, specs) {
  return {
    size,
    diameterIn: specs.overallDiameterIn,
    widthIn: specs.sectionWidthIn,
    sidewallIn: specs.sidewallIn,
    revsPerMile: specs.revsPerMile,
    wheelIn: specs.wheelDiameterIn
  };
}
function isValidTireSizeParam(size) {
  if (!size?.trim()) return false;
  const normalized = normalizeTireSizeInput(size.trim());
  return Boolean(parseFullSizeToFields(normalized));
}
function buildTireOgData(size) {
  if (!isValidTireSizeParam(size)) return null;
  const normalized = normalizeTireSizeInput(size.trim());
  try {
    return specsToOgData(normalized, getTireSpecs(normalized));
  } catch {
    return null;
  }
}
function buildCompareOgData(from, to) {
  if (!isValidTireSizeParam(from) || !isValidTireSizeParam(to)) return null;
  const sizeA = normalizeTireSizeInput(from.trim());
  const sizeB = normalizeTireSizeInput(to.trim());
  try {
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const comparison = compareTires(sizeA, sizeB, 60);
    const analysis = buildComparisonAnalysis(sizeA, sizeB, comparison, specsA, specsB);
    return {
      from: sizeA,
      to: sizeB,
      fitmentScore: analysis.measurements.fitmentScore,
      diameterDeltaPct: comparison.diameterDiffPercent,
      widthDeltaMm: comparison.widthDiffMm,
      revsDeltaPct: comparison.revsPerMileDiffPercent,
      fromSpecs: specsToOgData(sizeA, specsA),
      toSpecs: specsToOgData(sizeB, specsB)
    };
  } catch {
    return null;
  }
}
function parseTireSizeSearchParam(params) {
  const size = parseTireSizeFromSearch(params);
  return size && isValidTireSizeParam(size) ? normalizeTireSizeInput(size) : null;
}
function parseCompareSearchParams(params) {
  const { from, to } = parseTireComparisonFromSearch(params, { from: "", to: "" });
  if (!isValidTireSizeParam(from) || !isValidTireSizeParam(to)) return null;
  return {
    from: normalizeTireSizeInput(from),
    to: normalizeTireSizeInput(to)
  };
}
function fmtIn(value, digits = 2) {
  return `${value.toFixed(digits)}"`;
}
function fmtSignedPct(value, digits = 1) {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(digits)}%`;
}
function fmtSignedMm(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value)} mm`;
}

const BRAND = "#5b4fe6";
const BG = "#0f172a";
const PANEL = "#1e293b";
const TEXT = "#f8fafc";
const MUTED = "#94a3b8";
const BORDER = "#334155";
function BrandHeader({ eyebrow, title }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      },
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 12
            },
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: BRAND,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TEXT,
                    fontSize: 22,
                    fontWeight: 700
                  },
                  children: "TR"
                }
              ),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column" }, children: [
                /* @__PURE__ */ jsx("span", { style: { color: MUTED, fontSize: 20, fontWeight: 600 }, children: eyebrow }),
                /* @__PURE__ */ jsx("span", { style: { color: TEXT, fontSize: 28, fontWeight: 700 }, children: "Tire Reference" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { color: TEXT, fontSize: 52, fontWeight: 700, lineHeight: 1.1 }, children: title })
      ]
    }
  );
}
function StatPill({ label, value }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "18px 22px",
        borderRadius: 16,
        background: PANEL,
        border: `1px solid ${BORDER}`,
        flex: 1
      },
      children: [
        /* @__PURE__ */ jsx("span", { style: { color: MUTED, fontSize: 18, fontWeight: 600 }, children: label }),
        /* @__PURE__ */ jsx("span", { style: { color: TEXT, fontSize: 30, fontWeight: 700 }, children: value })
      ]
    }
  );
}
function TireVisual({
  label,
  diameterIn,
  widthIn,
  accent
}) {
  const tireHeight = Math.min(220, Math.max(120, diameterIn * 6.2));
  const tireWidth = Math.min(140, Math.max(70, widthIn * 10));
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        flex: 1
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              height: 250
            },
            children: /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  width: tireWidth,
                  height: tireHeight,
                  borderRadius: 18,
                  border: `8px solid ${accent}`,
                  background: "#111827",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      width: Math.max(24, tireWidth * 0.45),
                      height: Math.max(24, tireWidth * 0.45),
                      borderRadius: 999,
                      border: `4px solid ${BORDER}`,
                      background: "#0b1220"
                    }
                  }
                )
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
          /* @__PURE__ */ jsx("span", { style: { color: TEXT, fontSize: 28, fontWeight: 700 }, children: label }),
          /* @__PURE__ */ jsxs("span", { style: { color: MUTED, fontSize: 20 }, children: [
            fmtIn(diameterIn),
            " overall"
          ] })
        ] })
      ]
    }
  );
}
function TireOgTemplate({ data }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${BG} 0%, #111827 55%, #1e1b4b 100%)`,
        padding: "48px 56px",
        fontFamily: "Inter"
      },
      children: [
        /* @__PURE__ */ jsx(BrandHeader, { eyebrow: "Tire Size Specs", title: data.size }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flex: 1, alignItems: "center", gap: 40, marginTop: 36 }, children: [
          /* @__PURE__ */ jsx(TireVisual, { label: data.size, diameterIn: data.diameterIn, widthIn: data.widthIn, accent: BRAND }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16, flex: 1.2 }, children: [
            /* @__PURE__ */ jsx(StatPill, { label: "Overall Diameter", value: fmtIn(data.diameterIn) }),
            /* @__PURE__ */ jsx(StatPill, { label: "Section Width", value: fmtIn(data.widthIn) }),
            /* @__PURE__ */ jsx(StatPill, { label: "Sidewall Height", value: fmtIn(data.sidewallIn) }),
            /* @__PURE__ */ jsx(StatPill, { label: "Revs / Mile", value: Math.round(data.revsPerMile).toLocaleString() })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { color: MUTED, fontSize: 18, marginTop: 24 }, children: "tirereference.com" })
      ]
    }
  );
}
function CompareOgTemplate({ data }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${BG} 0%, #111827 50%, #172554 100%)`,
        padding: "44px 52px",
        fontFamily: "Inter"
      },
      children: [
        /* @__PURE__ */ jsx(BrandHeader, { eyebrow: "Tire Comparison", title: `${data.from} vs ${data.to}` }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 18, marginTop: 28 }, children: [
          /* @__PURE__ */ jsx(StatPill, { label: "Diameter Δ", value: fmtSignedPct(data.diameterDeltaPct) }),
          /* @__PURE__ */ jsx(StatPill, { label: "Width Δ", value: fmtSignedMm(data.widthDeltaMm) }),
          /* @__PURE__ */ jsx(StatPill, { label: "Revs / Mile Δ", value: fmtSignedPct(data.revsDeltaPct) }),
          /* @__PURE__ */ jsx(StatPill, { label: "Fitment Score", value: `${data.fitmentScore.toFixed(1)}/10` })
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              marginTop: 28,
              flex: 1
            },
            children: [
              /* @__PURE__ */ jsx(TireVisual, { label: data.from, diameterIn: data.fromSpecs.diameterIn, widthIn: data.fromSpecs.widthIn, accent: "#38bdf8" }),
              /* @__PURE__ */ jsx("div", { style: { color: MUTED, fontSize: 42, fontWeight: 700 }, children: "vs" }),
              /* @__PURE__ */ jsx(TireVisual, { label: data.to, diameterIn: data.toSpecs.diameterIn, widthIn: data.toSpecs.widthIn, accent: BRAND })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { color: MUTED, fontSize: 18, marginTop: 16 }, children: "tirereference.com" })
      ]
    }
  );
}
function FallbackOgTemplate({ title }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${BG} 0%, #1e1b4b 100%)`,
        padding: 64,
        fontFamily: "Inter"
      },
      children: /* @__PURE__ */ jsx(BrandHeader, { eyebrow: "Tire Reference", title })
    }
  );
}

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
  "CDN-Cache-Control": "public, max-age=604800",
  "Vercel-CDN-Cache-Control": "public, max-age=604800"
};
let fontPromise = null;
async function loadFonts() {
  const [regular, bold] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@5.0.0/latin-400-normal.woff").then(
      (res) => res.arrayBuffer()
    ),
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@5.0.0/latin-700-normal.woff").then(
      (res) => res.arrayBuffer()
    )
  ]);
  return { regular, bold };
}
async function getFonts() {
  if (!fontPromise) fontPromise = loadFonts();
  return fontPromise;
}
function fontConfig(fonts, weight) {
  return {
    name: "Inter",
    data: weight === 700 ? fonts.bold : fonts.regular,
    weight,
    style: "normal"
  };
}
async function renderImage(element, title) {
  const fonts = await getFonts();
  return new ImageResponse(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    headers: OG_CACHE_HEADERS,
    fonts: [fontConfig(fonts, 400), fontConfig(fonts, 700)]
  });
}
async function renderTireOgImage(data) {
  return renderImage(/* @__PURE__ */ jsx(TireOgTemplate, { data }), data.size);
}
async function renderCompareOgImage(data) {
  return renderImage(
    /* @__PURE__ */ jsx(CompareOgTemplate, { data }),
    `${data.from} vs ${data.to}`
  );
}
async function renderFallbackOgImage(title) {
  return renderImage(/* @__PURE__ */ jsx(FallbackOgTemplate, { title }));
}

export { renderCompareOgImage as a, buildCompareOgData as b, parseTireSizeSearchParam as c, buildTireOgData as d, renderTireOgImage as e, parseCompareSearchParams as p, renderFallbackOgImage as r };
