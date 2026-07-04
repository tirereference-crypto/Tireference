/**
 * Second-pass review criteria for comparison page content.
 *
 * These rules mirror an AI editorial review: every check maps to a concrete
 * programmatic test in `tire-comparison-quality-validator.ts`. The same
 * structure can drive a future LLM reviewer without changing the page layout.
 */
import { COMPARISON_PAGE_SECTION_ROLES, ENGINEERING_VOICE } from './tire-comparison-engineering-prompts';

export const QUALITY_REVIEW_CHECK_IDS = [
  'measurement-support',
  'exaggerated-claims',
  'internal-contradictions',
  'recommendation-rationale',
  'duplicate-content',
  'generic-filler',
  'fabricated-percentages',
  'reasoning-before-conclusion',
  'repetitive-structure',
] as const;

export type QualityReviewCheckId = (typeof QUALITY_REVIEW_CHECK_IDS)[number];

export interface QualityReviewCriterion {
  id: QualityReviewCheckId;
  /** Question the reviewer must answer. */
  question: string;
  /** Pass condition in plain language. */
  passCondition: string;
  /** Failure triggers regeneration when true. */
  regenerateOnFail: boolean;
}

/** Master reviewer voice — evidence-based editor, not marketer. */
export const QUALITY_REVIEW_SYSTEM_PROMPT = {
  persona:
    'A technical editor reviewing tire comparison copy for accuracy, density, and non-duplication across page sections.',
  tone: ENGINEERING_VOICE.tone,
  reviewOrder: [
    'Verify each section stays within its role (see COMPARISON_PAGE_SECTION_ROLES).',
    'Reject conclusion-first sentences lacking a nearby measurement.',
    'Reject marketing language and invented performance percentages.',
    'Reject paragraphs that duplicate another section\'s core claim.',
    'Reject three or more consecutive sentences sharing the same opening pattern.',
  ] as const,
} as const;

export const QUALITY_REVIEW_CRITERIA: readonly QualityReviewCriterion[] = [
  {
    id: 'measurement-support',
    question: 'Are directional claims supported by calculated tire data?',
    passCondition:
      'Sentences that recommend, compare, or predict an owner-visible effect cite a number with unit or a calculated % from this pair.',
    regenerateOnFail: true,
  },
  {
    id: 'reasoning-before-conclusion',
    question: 'Does prose explain mechanism before stating an effect?',
    passCondition:
      'Each paragraph follows measurement → physical mechanism → practical consequence; no standalone superlatives.',
    regenerateOnFail: true,
  },
  {
    id: 'exaggerated-claims',
    question: 'Are any claims exaggerated beyond what the measurements show?',
    passCondition:
      'No superlatives, invented performance deltas, or marketing labels unless tied to a measured dimension and mechanism.',
    regenerateOnFail: true,
  },
  {
    id: 'internal-contradictions',
    question: 'Does the article contradict itself?',
    passCondition:
      'Pros, cons, clearance, diameter, width, and RPM statements align with computed directional deltas.',
    regenerateOnFail: true,
  },
  {
    id: 'recommendation-rationale',
    question: 'Does the verdict explain why using fitment score and category context?',
    passCondition:
      'Recommendation and verdict sections cite fitment score and give a verification action — not a dimension recap.',
    regenerateOnFail: true,
  },
  {
    id: 'duplicate-content',
    question: 'Does the page repeat the same claim across sections?',
    passCondition:
      'Engineering, performance, verdict, and FAQ each add new information; no two blocks share >70% token overlap.',
    regenerateOnFail: true,
  },
  {
    id: 'repetitive-structure',
    question: 'Is sentence structure varied and non-template?',
    passCondition:
      'No three consecutive sentences start the same way; no banned template openers from WRITING_STYLE_RULES.',
    regenerateOnFail: false,
  },
  {
    id: 'generic-filler',
    question: 'Is there generic filler or copy that could apply to any tire pair?',
    passCondition:
      'No banned marketing phrases; every paragraph references this pair\'s sizes or calculated deltas.',
    regenerateOnFail: true,
  },
  {
    id: 'fabricated-percentages',
    question: 'Are all cited percentages traceable to calculated values?',
    passCondition:
      'Every % matches diameter, width, sidewall, speedometer, revs/mile, or fitment score — not invented MPG or grip gains.',
    regenerateOnFail: true,
  },
];

/** Section-role violations the reviewer should flag. */
export const SECTION_ROLE_CHECKS = Object.entries(COMPARISON_PAGE_SECTION_ROLES).map(
  ([key, role]) => ({
    section: key,
    mustOwn: role.owns.join('; '),
    mustAvoid: role.mustNot.join('; '),
  }),
);

/**
 * Marketing and filler phrases that indicate low-quality or hallucinated content.
 * Case-insensitive matching is applied at validation time.
 */
export const BANNED_COMPARISON_PHRASES: readonly string[] = [
  'aggressive upgrade',
  'trail ready',
  'better handling',
  'improved handling',
  'improved grip',
  'better grip',
  'improved performance',
  'better performance',
  'must buy',
  'guaranteed fit',
  'guaranteed fitment',
  'perfect for',
  'ideal daily driver',
  'ideal for',
  '39% better',
  'percent better',
  'percent faster',
  'percent improvement',
  'save fuel',
  'mpg will improve',
  'improved road presence',
  'better off-road capability',
  'improved trail performance',
  'better cornering stability',
  'sharper steering response',
  'good upgrade for most daily drivers',
  'off-road upgrade',
  'it is important to note',
  'many drivers find',
  'overall speaking',
  'in terms of',
  'when it comes to',
  'no-brainer',
  'game changer',
  'must-have',
  'take your driving to the next level',
  'unsurpassed',
  'best-in-class',
];

/**
 * Performance-improvement patterns where a percentage is paired with a subjective
 * claim — these are always rejected even if the number happens to match data.
 */
export const FABRICATED_CLAIM_PATTERNS: readonly RegExp[] = [
  /\d+(?:\.\d+)?\s*%\s+(?:better|worse|faster|slower|more|less|improved|reduced)\b/i,
  /\b(?:better|improved|faster|quicker)\s+by\s+\d+(?:\.\d+)?\s*%/i,
  /\bsave\s+\d+(?:\.\d+)?\s*%\b/i,
  /\b\d+(?:\.\d+)?\s*%\s+(?:mpg|fuel\s+economy|handling|grip|acceleration)\b/i,
];

/** Template openers that signal repetitive, low-effort structure. */
export const REPETITIVE_OPENER_PATTERNS: readonly RegExp[] = [
  /^when switching from\b/i,
  /^this means that\b/i,
  /^it is important to note\b/i,
  /^overall,\b/i,
  /^in terms of\b/i,
  /^many drivers\b/i,
];

/** Sentence stems that require a nearby measurement (digit + unit or %). */
export const CONCLUSION_SENTENCE_PATTERN =
  /\b(recommend|should|prefer|better|worse|ideal|avoid|choose|upgrade|not recommended|excellent|good fit)\b/i;

/** OEM tolerance bands that may appear without being calculated from this pair. */
export const ALLOWED_TOLERANCE_PERCENT_PATTERNS: readonly RegExp[] = [
  /±\s*\d+(?:\.\d+)?\s*–?\s*\d*\s*%/,
  /±\s*\d+(?:\.\d+)?\s*%/,
  /within (?:the )?(?:±\s*)?\d+(?:\.\d+)?\s*(?:–\s*\d+\s*)?%/i,
  /~\s*\d+(?:\.\d+)?\s*%/,
  /±\s*\d+(?:\.\d+)?\s*[–-]\s*\d+(?:\.\d+)?\s*%/,
];

/** Assembled reviewer prompt for a future LLM quality pass. */
export function buildQualityReviewSystemPrompt(): string {
  const sys = QUALITY_REVIEW_SYSTEM_PROMPT;
  return [
    `Persona: ${sys.persona}`,
    `Tone: ${sys.tone.join(', ')}.`,
    '',
    'Review order:',
    ...sys.reviewOrder.map((step, i) => `${i + 1}. ${step}`),
    '',
    'Section roles:',
    ...SECTION_ROLE_CHECKS.map(
      (check) => `- ${check.section}: own [${check.mustOwn}]; avoid [${check.mustAvoid}]`,
    ),
  ].join('\n');
}
