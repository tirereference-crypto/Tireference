/**
 * Second-pass quality validator for comparison page content.
 *
 * Runs automatically after content generation. Rejects or regenerates prose
 * that contains fabricated claims, contradictions, filler, or unsupported
 * recommendations.
 */
import type { ComparisonInsights } from './tire-comparison-types';
import type { EngineeringAnalysis } from './tire-comparison-engineering-analysis';
import { REVS_PER_MILE_THRESHOLD } from './tire-comparison-fitment';
import {
  buildMeasuredBenefits,
  buildMeasuredConsiderations,
  buildEngineeringPersonalityBullets,
  synthesizeUnderstandingDifference,
  synthesizeUpgradeRecommendation,
  synthesizeWhatChanges,
  synthesizeWhoShouldChoose,
} from './tire-comparison-engineering-analysis';
import {
  buildFuelEconomyFaqAnswer,
  buildRideHandlingFaqAnswer,
  buildFitmentConsiderations,
} from './tire-comparison-section-copy';
import {
  ALLOWED_TOLERANCE_PERCENT_PATTERNS,
  BANNED_COMPARISON_PHRASES,
  CONCLUSION_SENTENCE_PATTERN,
  FABRICATED_CLAIM_PATTERNS,
  QUALITY_REVIEW_CRITERIA,
  REPETITIVE_OPENER_PATTERNS,
  type QualityReviewCheckId,
} from './tire-comparison-quality-prompts';

export interface ComparisonQualityFailure {
  approved: false;
  reason: string;
  suggestions: string[];
  /** Individual check failures for debugging and regeneration targeting. */
  failedChecks: QualityReviewCheckId[];
}

export interface ComparisonQualitySuccess {
  approved: true;
}

export type ComparisonQualityResult = ComparisonQualityFailure | ComparisonQualitySuccess;

export interface ComparisonContentBlock {
  id: string;
  text: string;
}

const PERCENT_TOLERANCE = 0.15;
const DUPLICATE_OVERLAP_THRESHOLD = 0.85;
const MAX_REGENERATION_ATTEMPTS = 2;

/** Block IDs checked for duplicate long-form narrative only. */
const DUPLICATE_CHECK_PREFIXES = [
  'understandingDifference',
  'seo.whatChanges',
  'seo.whoShouldChoose',
  'seo.isGoodUpgrade.body',
] as const;

/** Block IDs where recommendation/conclusion sentences must cite measurements. */
const MEASUREMENT_REQUIRED_PREFIXES = [
  'seo.isGoodUpgrade.',
  'personality.pros.',
  'quickVerdict.benefits.',
] as const;

/** Guidance/meta sentences exempt from measurement requirement. */
const MEASUREMENT_EXEMPT_PATTERNS: readonly RegExp[] = [
  /^drivers comparing\b/i,
  /^anyone unsure about fitment\b/i,
  /^treat these as calculated\b/i,
  /^these are the measurable drivers\b/i,
  /\?\s*$/,
];

/** Flatten all user-facing prose from a comparison insights object. */
export function extractComparisonContentBlocks(
  insights: ComparisonInsights,
): ComparisonContentBlock[] {
  const blocks: ComparisonContentBlock[] = [
    { id: 'understandingDifference', text: insights.understandingDifference },
    { id: 'seo.whatChanges', text: insights.seo.whatChanges },
    { id: 'seo.isGoodUpgrade.headline', text: insights.seo.isGoodUpgrade.headline },
    { id: 'seo.isGoodUpgrade.body', text: insights.seo.isGoodUpgrade.body },
    { id: 'seo.whoShouldChoose', text: insights.seo.whoShouldChoose },
    { id: 'personality.summary', text: insights.personality.summary },
    ...insights.personality.pros.map((text, i) => ({ id: `personality.pros.${i}`, text })),
    ...insights.personality.cons.map((text, i) => ({ id: `personality.cons.${i}`, text })),
    ...insights.thingsToConsider.map((text, i) => ({ id: `thingsToConsider.${i}`, text })),
    ...insights.quickVerdict.benefits.map((text, i) => ({ id: `quickVerdict.benefits.${i}`, text })),
    ...insights.quickVerdict.considerations.map((text, i) => ({
      id: `quickVerdict.considerations.${i}`,
      text,
    })),
    ...insights.performanceCards.map((card) => ({
      id: `performance.${card.id}.explanation`,
      text: card.explanation,
    })),
    ...insights.seo.faqs.flatMap((faq, i) => [
      { id: `faq.${i}.question`, text: faq.question },
      { id: `faq.${i}.answer`, text: faq.answer },
    ]),
  ];

  return blocks.filter((block) => block.text.trim().length > 0);
}

/** Prose blocks used for duplicate detection — long-form narrative only. */
export function extractProseForDuplicateCheck(
  insights: ComparisonInsights,
): ComparisonContentBlock[] {
  return extractComparisonContentBlocks(insights).filter(
    (block) =>
      DUPLICATE_CHECK_PREFIXES.some((prefix) => block.id.startsWith(prefix)) &&
      block.text.length >= 120,
  );
}

/** Percentages derived from calculated tire data — the only values allowed in prose. */
export function buildAllowedPercentages(analysis: EngineeringAnalysis): number[] {
  const { comparison, widthPct, sidewallPct, fitmentScore } = analysis.measurements;
  const values = [
    comparison.diameterDiffPercent,
    widthPct,
    sidewallPct,
    comparison.speedometer.errorPercent,
    comparison.revsPerMileDiffPercent,
    fitmentScore * 10,
    fitmentScore,
  ];

  const absValues = values.flatMap((v) => [v, Math.abs(v)]);
  const rounded = absValues.flatMap((v) => [
    Math.round(v * 10) / 10,
    Math.round(v * 100) / 100,
    Number(v.toFixed(1)),
    Number(v.toFixed(2)),
  ]);

  return [...new Set(rounded.filter((n) => Number.isFinite(n)))];
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s%./+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeForComparison(text).split(' ').filter(Boolean);
}

function tokenOverlapRatio(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared++;
  }

  return shared / Math.min(tokensA.size, tokensB.size);
}

function extractPercentages(text: string): number[] {
  const matches = text.match(/[+-]?\d+(?:\.\d+)?\s*%/g) ?? [];
  return matches.map((m) => Number.parseFloat(m.replace('%', '').trim()));
}

function isAllowedTolerancePercent(context: string, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return ALLOWED_TOLERANCE_PERCENT_PATTERNS.some((pattern) => pattern.test(context));
}

function percentIsAllowed(value: number, allowed: number[], context: string): boolean {
  if (isAllowedTolerancePercent(context, value)) return true;
  return allowed.some((allowedValue) => Math.abs(value - allowedValue) <= PERCENT_TOLERANCE);
}

function sentenceHasMeasurement(sentence: string): boolean {
  return (
    /\d/.test(sentence) &&
    (/%/.test(sentence) ||
      /\b(?:mm|in|inch|inches|"|rpm|revs?\/(?:mi|km|mile)|mph|km\/h|kph|score)\b/i.test(sentence) ||
      /\b\d+(?:\.\d+)?\/\d+\b/.test(sentence))
  );
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function checkFabricatedPercentages(
  blocks: ComparisonContentBlock[],
  allowed: number[],
): { failed: boolean; suggestions: string[] } {
  const suggestions: string[] = [];

  for (const block of blocks) {
    for (const pattern of FABRICATED_CLAIM_PATTERNS) {
      if (pattern.test(block.text)) {
        suggestions.push(
          `Remove performance claim in "${block.id}": matched fabricated pattern "${pattern.source}".`,
        );
      }
    }

    for (const pct of extractPercentages(block.text)) {
      if (!percentIsAllowed(pct, allowed, block.text)) {
        suggestions.push(
          `Replace ${pct}% in "${block.id}" with a calculated delta from the spec table or remove it.`,
        );
      }
    }
  }

  return { failed: suggestions.length > 0, suggestions };
}

function checkGenericFiller(blocks: ComparisonContentBlock[]): {
  failed: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  for (const block of blocks) {
    const lower = block.text.toLowerCase();
    for (const phrase of BANNED_COMPARISON_PHRASES) {
      if (lower.includes(phrase)) {
        suggestions.push(`Remove banned phrase "${phrase}" from "${block.id}".`);
      }
    }
  }

  return { failed: suggestions.length > 0, suggestions };
}

function checkDuplicateContent(blocks: ComparisonContentBlock[]): {
  failed: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      // FAQ questions are never compared for duplication.
      if (blocks[i].id.endsWith('.question') || blocks[j].id.endsWith('.question')) continue;

      const overlap = tokenOverlapRatio(blocks[i].text, blocks[j].text);
      if (blocksAreRelated(blocks[i].id, blocks[j].id) && overlap < 0.95) continue;

      if (overlap >= DUPLICATE_OVERLAP_THRESHOLD) {
        suggestions.push(
          `Reduce duplication between "${blocks[i].id}" and "${blocks[j].id}" (${Math.round(overlap * 100)}% overlap).`,
        );
      }
    }
  }

  return { failed: suggestions.length > 0, suggestions: [...new Set(suggestions)] };
}

/** Known parent/child content relationships — sections now have distinct roles. */
function blocksAreRelated(idA: string, idB: string): boolean {
  const relatedGroups = [['seo.isGoodUpgrade.body', 'personality.summary']];

  return relatedGroups.some(
    (group) => group.includes(idA) && group.includes(idB),
  );
}

function checkMeasurementSupport(blocks: ComparisonContentBlock[]): {
  failed: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  const targetBlocks = blocks.filter((block) =>
    MEASUREMENT_REQUIRED_PREFIXES.some((prefix) => block.id.startsWith(prefix)),
  );

  for (const block of targetBlocks) {
    for (const sentence of splitSentences(block.text)) {
      if (MEASUREMENT_EXEMPT_PATTERNS.some((pattern) => pattern.test(sentence))) continue;
      if (sentence.endsWith('?')) continue;
      if (CONCLUSION_SENTENCE_PATTERN.test(sentence) && !sentenceHasMeasurement(sentence)) {
        suggestions.push(
          `Add a measured value to conclusion sentence in "${block.id}": "${sentence.slice(0, 80)}…"`,
        );
      }
    }
  }

  return { failed: suggestions.length > 0, suggestions: [...new Set(suggestions)].slice(0, 8) };
}

function checkRecommendationRationale(insights: ComparisonInsights): {
  failed: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  const recommendationTargets = [
    { id: 'seo.isGoodUpgrade.headline', text: insights.seo.isGoodUpgrade.headline },
    { id: 'seo.isGoodUpgrade.body', text: insights.seo.isGoodUpgrade.body },
    { id: 'engineering.recommendation', text: insights.engineeringAnalysis.byId.recommendation.body },
  ];

  for (const target of recommendationTargets) {
    if (!/\d/.test(target.text)) {
      suggestions.push(`Add fitment score or dimensional measurement to "${target.id}".`);
    }
  }

  return { failed: suggestions.length > 0, suggestions };
}

function checkInternalContradictions(insights: ComparisonInsights): {
  failed: boolean;
  suggestions: string[];
} {
  const { specsA, specsB, comparison } = insights.engineeringAnalysis.measurements;
  const suggestions: string[] = [];
  const pros = insights.personality.pros.join(' ').toLowerCase();
  const benefits = insights.quickVerdict.benefits.join(' ').toLowerCase();
  const combinedPositive = `${pros} ${benefits}`;

  const taller = specsB.overallDiameterIn > specsA.overallDiameterIn + 0.05;
  const shorter = specsB.overallDiameterIn < specsA.overallDiameterIn - 0.05;
  const wider = specsB.widthMm > specsA.widthMm + 3;
  const narrower = specsB.widthMm < specsA.widthMm - 3;
  const revsUp = comparison.revsPerMileDiff > REVS_PER_MILE_THRESHOLD;
  const revsDown = comparison.revsPerMileDiff < -REVS_PER_MILE_THRESHOLD;

  if (taller && /\bless ground clearance\b|\blower clearance\b|\breduced clearance\b/.test(combinedPositive)) {
    suggestions.push(
      'Pros/benefits claim lower clearance but diameter increased — align with measured ground clearance gain.',
    );
  }
  if (shorter && /\bground clearance \+|more ground clearance\b/.test(combinedPositive)) {
    suggestions.push(
      'Pros/benefits claim higher clearance but diameter decreased — align with measured ground clearance loss.',
    );
  }
  if (wider && /\bsmaller contact patch\b|\bnarrower\b/.test(combinedPositive)) {
    suggestions.push('Pros/benefits claim narrower footprint but section width increased.');
  }
  if (narrower && /\blarger contact patch\b|\bwider section\b/.test(combinedPositive)) {
    suggestions.push('Pros/benefits claim wider footprint but section width decreased.');
  }
  if (revsUp && /\bfewer rpm\b|\blower rpm\b|\blower cruising rpm\b/.test(combinedPositive)) {
    suggestions.push('Pros/benefits claim lower RPM but revs/mile increased in the calculated data.');
  }
  if (revsDown && /\bhigher rpm\b|\bmore rpm\b/.test(combinedPositive)) {
    suggestions.push('Pros/benefits claim higher RPM but revs/mile decreased in the calculated data.');
  }

  return { failed: suggestions.length > 0, suggestions };
}

function checkReasoningBeforeConclusion(blocks: ComparisonContentBlock[]): {
  failed: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  const targetPrefixes = ['performance.', 'understandingDifference', 'seo.whatChanges'];

  for (const block of blocks) {
    if (!targetPrefixes.some((prefix) => block.id.startsWith(prefix))) continue;

    const sentences = splitSentences(block.text);
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (!CONCLUSION_SENTENCE_PATTERN.test(sentence)) continue;
      if (sentenceHasMeasurement(sentence)) continue;

      const prior = i > 0 ? sentences[i - 1] : '';
      if (sentenceHasMeasurement(prior)) continue;

      suggestions.push(
        `Lead with a measured mechanism before the conclusion in "${block.id}": "${sentence.slice(0, 80)}…"`,
      );
    }
  }

  return { failed: suggestions.length > 0, suggestions: [...new Set(suggestions)].slice(0, 6) };
}

function sentenceOpener(sentence: string): string {
  const first = sentence.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return first.replace(/[^\w]/g, '');
}

function checkRepetitiveStructure(blocks: ComparisonContentBlock[]): {
  failed: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  for (const block of blocks) {
    const sentences = splitSentences(block.text);
    if (sentences.length < 3) continue;

    for (let i = 0; i < sentences.length - 2; i++) {
      const openers = [sentences[i], sentences[i + 1], sentences[i + 2]].map(sentenceOpener);
      if (openers[0] && openers[0] === openers[1] && openers[1] === openers[2]) {
        suggestions.push(
          `Vary sentence openings in "${block.id}" — three consecutive sentences start with "${openers[0]}".`,
        );
        break;
      }
    }

    for (const sentence of sentences) {
      if (REPETITIVE_OPENER_PATTERNS.some((pattern) => pattern.test(sentence))) {
        suggestions.push(`Replace template opener in "${block.id}": "${sentence.slice(0, 60)}…"`);
        break;
      }
    }
  }

  return { failed: suggestions.length > 0, suggestions: [...new Set(suggestions)].slice(0, 6) };
}

function checkExaggeratedClaims(blocks: ComparisonContentBlock[]): {
  failed: boolean;
  suggestions: string[];
} {
  const patterns = [
    /\b(?:dramatically|significantly|massively|huge|enormous|major)\s+(?:better|improved|faster|more)\b/i,
    /\b(?:best|perfect|ultimate|superior|outstanding)\b/i,
    /\b(?:will|guaranteed to)\s+(?:improve|increase|boost)\b/i,
  ];
  const suggestions: string[] = [];

  for (const block of blocks) {
    for (const pattern of patterns) {
      if (pattern.test(block.text)) {
        suggestions.push(
          `Replace exaggerated language in "${block.id}" with measured deltas only.`,
        );
        break;
      }
    }
  }

  return { failed: suggestions.length > 0, suggestions: [...new Set(suggestions)] };
}

/**
 * Run the full second-pass quality review on generated comparison content.
 */
export function validateComparisonQuality(insights: ComparisonInsights): ComparisonQualityResult {
  const blocks = extractComparisonContentBlocks(insights);
  const duplicateBlocks = extractProseForDuplicateCheck(insights);
  const allowed = buildAllowedPercentages(insights.engineeringAnalysis);
  const failedChecks: QualityReviewCheckId[] = [];
  const allSuggestions: string[] = [];

  const checks: Array<{ id: QualityReviewCheckId; result: { failed: boolean; suggestions: string[] } }> = [
    {
      id: 'fabricated-percentages',
      result: checkFabricatedPercentages(blocks, allowed),
    },
    { id: 'generic-filler', result: checkGenericFiller(blocks) },
    { id: 'duplicate-content', result: checkDuplicateContent(duplicateBlocks) },
    { id: 'measurement-support', result: checkMeasurementSupport(blocks) },
    { id: 'recommendation-rationale', result: checkRecommendationRationale(insights) },
    { id: 'internal-contradictions', result: checkInternalContradictions(insights) },
    { id: 'exaggerated-claims', result: checkExaggeratedClaims(blocks) },
    { id: 'reasoning-before-conclusion', result: checkReasoningBeforeConclusion(blocks) },
    { id: 'repetitive-structure', result: checkRepetitiveStructure(blocks) },
  ];

  const blockingChecks = new Set(
    QUALITY_REVIEW_CRITERIA.filter((c) => c.regenerateOnFail).map((c) => c.id),
  );

  for (const check of checks) {
    if (check.result.failed) {
      if (blockingChecks.has(check.id)) {
        failedChecks.push(check.id);
      }
      allSuggestions.push(...check.result.suggestions);
    }
  }

  if (failedChecks.length === 0) {
    return { approved: true };
  }

  const primaryReason =
    failedChecks.length === 1
      ? `Quality review failed: ${failedChecks[0]}.`
      : `Quality review failed ${failedChecks.length} checks: ${failedChecks.join(', ')}.`;

  return {
    approved: false,
    reason: primaryReason,
    suggestions: [...new Set(allSuggestions)].slice(0, 12),
    failedChecks,
  };
}

/**
 * Regenerate user-facing prose strictly from engineering analysis when the
 * first pass fails quality review.
 */
export function regenerateComparisonProse(insights: ComparisonInsights): ComparisonInsights {
  const { engineeringAnalysis, personality } = insights;
  const { sizeA, sizeB } = engineeringAnalysis.measurements;
  const upgrade = synthesizeUpgradeRecommendation(engineeringAnalysis);
  const bullets = buildEngineeringPersonalityBullets(engineeringAnalysis);

  const repairedPersonalityCards = insights.personalityCards.map((card) => ({
    ...card,
    bullets:
      card.id === 'sportier'
        ? bullets.sportier
        : card.id === 'comfort'
          ? bullets.comfort
          : bullets.offroad,
  }));

  const repairedFaqs = insights.seo.faqs.map((faq) => {
    if (/fuel economy|highway engine rpm/i.test(faq.question)) {
      return { ...faq, answer: buildFuelEconomyFaqAnswer(engineeringAnalysis) };
    }
    if (/ride quality and handling/i.test(faq.question)) {
      return { ...faq, answer: buildRideHandlingFaqAnswer(engineeringAnalysis) };
    }
    return faq;
  });

  const repairedBenefits = buildMeasuredBenefits(engineeringAnalysis);
  const repairedConsiderations = buildMeasuredConsiderations(engineeringAnalysis);

  return {
    ...insights,
    understandingDifference: synthesizeUnderstandingDifference(engineeringAnalysis, sizeA, sizeB),
    personality: {
      ...personality,
      summary: engineeringAnalysis.byId.recommendation.body.split('.')[0] + '.',
      pros: repairedBenefits.length > 0 ? repairedBenefits : personality.pros,
      cons: repairedConsiderations.length > 0 ? repairedConsiderations : personality.cons,
    },
    personalityCards: repairedPersonalityCards,
    thingsToConsider: buildFitmentConsiderations(
      sizeA,
      sizeB,
      engineeringAnalysis.measurements.comparison,
      engineeringAnalysis.measurements.specsA,
      engineeringAnalysis.measurements.specsB,
    ),
    quickVerdict: {
      ...insights.quickVerdict,
      benefits: repairedBenefits,
      considerations: repairedConsiderations,
    },
    seo: {
      ...insights.seo,
      whatChanges: synthesizeWhatChanges(engineeringAnalysis, sizeA, sizeB),
      isGoodUpgrade: upgrade,
      whoShouldChoose: synthesizeWhoShouldChoose(engineeringAnalysis, sizeA, sizeB),
      faqs: repairedFaqs,
    },
  };
}

/**
 * Build comparison insights and run the quality gate with automatic regeneration.
 */
export function applyComparisonQualityGate(insights: ComparisonInsights): {
  insights: ComparisonInsights;
  quality: ComparisonQualityResult;
} {
  let current = insights;
  let quality = validateComparisonQuality(current);

  for (let attempt = 0; !quality.approved && attempt < MAX_REGENERATION_ATTEMPTS; attempt++) {
    current = regenerateComparisonProse(current);
    quality = validateComparisonQuality(current);
  }

  return { insights: current, quality };
}
