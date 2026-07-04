/**
 * Engineering AI prompt architecture for tire size comparison content.
 *
 * These templates define voice, section roles, and per-section generation rules.
 * The deterministic generator in `tire-comparison-engineering-analysis.ts`
 * follows them today; the same structure can drive a future LLM pass without
 * changing page layout.
 */

export const ENGINEERING_ANALYSIS_SECTION_ORDER = [
  'ride-quality',
  'handling',
  'fuel-economy',
  'acceleration',
  'clearance',
  'fitment',
  'daily-driving',
  'highway-driving',
  'recommendation',
] as const;

export type EngineeringAnalysisSectionId =
  (typeof ENGINEERING_ANALYSIS_SECTION_ORDER)[number];

/** Master system voice — how every comparison explanation should read. */
export const ENGINEERING_VOICE = {
  persona:
    'An experienced tire engineer explaining trade-offs to a vehicle owner who can read a spec table but needs the mechanics translated.',
  tone: ['clear', 'technical', 'practical', 'evidence-based'] as const,
  principles: [
    'Explain reasoning before conclusions — show the causal chain (measurement → mechanism → what the driver may notice).',
    'Anchor every directional claim to a calculated value with units (in, mm, %, RPM, revs/mile).',
    'Describe trade-offs, not winners — both sides of a dimensional change matter.',
    'Write in plain language; define jargon once, then use it consistently.',
    'Keep sentences information-dense — no throat-clearing, no padding, no repeated openers.',
  ] as const,
  forbiddenPatterns: [
    'Marketing labels (aggressive, trail ready, must-have, ultimate).',
    'Unsupported performance claims (better handling, improved grip, faster acceleration) without a measured mechanism.',
    'Invented percentages (save X%, Y% better fuel economy) not traceable to calculated deltas.',
    'Generic filler (this is an important factor, many drivers find, overall speaking).',
    'Conclusion-first sentences that never cite a number.',
  ] as const,
} as const;

/**
 * Page-level section boundaries — each surface has one job so prose does not
 * repeat the spec table or other blocks.
 */
export const COMPARISON_PAGE_SECTION_ROLES = {
  summary: {
    role: 'Quick answer',
    owns: ['diameter %', 'width %', 'speedometer %', 'KPI deltas', 'spec table values'],
    mustNot: ['Mechanism essays', 'Recommendations', 'Mock-fit procedures'],
  },
  engineering: {
    role: 'Why the differences exist',
    owns: ['Causal chains', 'Independent variables (diameter vs sidewall vs width)', 'Half-diameter rule concept'],
    mustNot: ['Repeat exact figures already in the summary bar', 'Verdict language', 'FAQ procedures'],
  },
  performanceImpact: {
    role: 'Driving consequences',
    owns: ['Owner-visible effects at the wheel', 'Measured deltas tied to feel (comfort, RPM, clearance)'],
    mustNot: ['Re-derive geometry formulas', 'Fitment checklists'],
  },
  verdict: {
    role: 'Recommendation',
    owns: ['Fitment score', 'Category-appropriate use case', 'Go / no-go decision', 'Verification action'],
    mustNot: ['Full dimension recap', 'Engineering tutorials', 'Invented MPG claims'],
  },
  faq: {
    role: 'New questions only',
    owns: ['Mock-fit steps', 'Recalibration methods', 'TPMS/ABS relearn', 'Replace-all-four guidance'],
    mustNot: ['Restate spec-table numbers', 'Duplicate engineering or performance paragraphs'],
  },
} as const;

/** Cross-cutting writing rules for all generated prose. */
export const WRITING_STYLE_RULES = {
  sentenceStructure: [
    'Vary sentence openings — do not begin three consecutive sentences with the same word or pattern.',
    'Prefer "Because [measurement], [mechanism], [effect]" over "[Effect]. This is because…".',
    'Use one idea per sentence; split compound claims.',
    'Limit each paragraph to 2–4 sentences.',
  ] as const,
  measurementCitation: [
    'Introduce each dimension once with value + unit, then refer by name (sidewall, diameter, width).',
    'Percentages must match calculated diameter, width, sidewall, speedometer, or revs/mile deltas only.',
    'When near zero, say so explicitly — do not invent a directional claim.',
  ] as const,
  conciseness: [
    'Target 40–90 words per engineering section unless the delta set is large.',
    'Delete sentences that could apply to any tire pair without changing a number.',
    'No rhetorical questions; no engagement bait.',
  ] as const,
  avoidOpeners: [
    'When switching from',
    'This means that',
    'It is important to note',
    'Overall,',
    'In terms of',
    'Many drivers',
    'Larger tires',
    'Smaller tires',
  ] as const,
} as const;

export interface EngineeringSectionPrompt {
  title: string;
  /** What the section must explain — derived only from calculated measurements. */
  objective: string;
  /** Cause → mechanism → practical effect chain the writer must follow. */
  reasoningPattern: string;
  /** Measurements this section is allowed to cite. */
  allowedFacts: readonly string[];
  /** Language patterns that must never appear. */
  forbidden: readonly string[];
  /** Soft cap for information density. */
  maxSentences: number;
}

export const ENGINEERING_SECTION_PROMPTS: Record<
  EngineeringAnalysisSectionId,
  EngineeringSectionPrompt
> = {
  'ride-quality': {
    title: 'Ride Quality',
    objective:
      'Explain how sidewall height and aspect ratio change vertical compliance and impact transmission — not whether the ride is "better".',
    reasoningPattern:
      '1) State sidewall delta (in/mm) and aspect ratio change. 2) Explain air-spring volume and deflection before the rim sees load. 3) Describe what the owner may feel over potholes, expansion joints, and sharp edges.',
    allowedFacts: [
      'sidewall height (in/mm)',
      'aspect ratio (points)',
      'overall diameter (context only)',
    ],
    forbidden: [
      'better ride',
      'improved comfort',
      'percent improvement',
      'aggressive',
      'luxury ride',
    ],
    maxSentences: 4,
  },
  handling: {
    title: 'Handling',
    objective:
      'Explain how sidewall flex and section width change contact-patch behavior and steering effort — trade-offs, not superlatives.',
    reasoningPattern:
      '1) Cite sidewall and/or width delta. 2) Link sidewall height to tread squirm and turn-in. 3) Link section width to contact-patch area and scrub radius at full lock. 4) State the pavement vs rough-road trade-off.',
    allowedFacts: [
      'sidewall height (in/mm)',
      'section width (in/mm)',
      'aspect ratio',
      'wheel diameter (plus-size context)',
    ],
    forbidden: [
      'better handling',
      'improved grip',
      'percent improvement',
      'sportier',
      'razor sharp',
    ],
    maxSentences: 4,
  },
  'fuel-economy': {
    title: 'Fuel Economy',
    objective:
      'Explain how rolling circumference and cruising RPM change engine load — direction only, never invent MPG percentages.',
    reasoningPattern:
      '1) Cite revs/mile or revs/km delta and RPM change at indicated speed. 2) Explain fewer/more revolutions per mile as an effective gearing change. 3) Note rolling resistance from width/sidewall as secondary. 4) State that real MPG requires owner measurement.',
    allowedFacts: [
      'circumference (in/mm)',
      'revs per mile / revs per km',
      'RPM at indicated speed',
      'section width (secondary)',
    ],
    forbidden: [
      'mpg will improve by',
      'save X%',
      'percent better fuel economy',
      'guaranteed savings',
    ],
    maxSentences: 4,
  },
  acceleration: {
    title: 'Acceleration',
    objective:
      'Explain effective gearing from overall diameter — throttle response vs highway load, not 0–60 claims.',
    reasoningPattern:
      '1) Cite diameter and circumference delta. 2) Explain shorter/longer gearing from revs per distance. 3) Describe stop-and-go throttle feel vs cruising RPM consequence.',
    allowedFacts: [
      'overall diameter (in/%)',
      'circumference',
      'revs per mile',
      'diameter difference (%)',
    ],
    forbidden: [
      'faster acceleration',
      'quicker 0-60',
      'percent faster',
      'launch control',
    ],
    maxSentences: 3,
  },
  clearance: {
    title: 'Clearance',
    objective:
      'Explain static ride-height change from diameter using the half-diameter rule — measured, not aspirational.',
    reasoningPattern:
      '1) Cite overall diameter delta. 2) Apply half-diameter rule to static clearance change. 3) Distinguish static clearance from fender-envelope clearance at full compression.',
    allowedFacts: [
      'overall diameter (in/%)',
      'ground clearance change (in)',
      'diameter difference (%)',
    ],
    forbidden: ['trail ready', 'overlanding upgrade', 'percent more clearance', 'dominate trails'],
    maxSentences: 3,
  },
  fitment: {
    title: 'Fitment',
    objective:
      'Explain how diameter, width, and wheel size enlarge the tire envelope — what to verify, not a guarantee.',
    reasoningPattern:
      '1) Cite diameter, width, and wheel deltas. 2) Name contact points (liner, pinch weld, strut). 3) List mock-fit checks (full lock, full compression). 4) Reference load index/speed rating vs placard if available.',
    allowedFacts: [
      'overall diameter',
      'section width',
      'wheel diameter',
      'load index',
      'speed rating',
      'fitment score',
    ],
    forbidden: ['will fit perfectly', 'guaranteed fitment', 'aggressive upgrade', 'bolt-on fit'],
    maxSentences: 4,
  },
  'daily-driving': {
    title: 'Daily Driving',
    objective:
      'Summarise commuting-relevant effects: speedometer drift, steering effort, ride compliance — from measured errors only.',
    reasoningPattern:
      '1) Cite speedometer error % and true speed at indicated speed. 2) Tie width delta to steering effort if material. 3) Tie sidewall delta to commute-route ride feel if material.',
    allowedFacts: [
      'speedometer error (%)',
      'true speed at indicated speed',
      'sidewall height',
      'section width',
    ],
    forbidden: ['ideal daily driver', 'perfect for commuting', 'best choice for city driving'],
    maxSentences: 3,
  },
  'highway-driving': {
    title: 'Highway Driving',
    objective:
      'Explain cruising RPM and speedometer behaviour at highway speed — calculated values only.',
    reasoningPattern:
      '1) Cite RPM delta at indicated speed. 2) Link to revs/mile change and engine load direction. 3) Note speedometer drift impact on cruise control and navigation if error exceeds typical OEM band.',
    allowedFacts: [
      'RPM at indicated speed',
      'revs per mile',
      'speedometer error (%)',
      'circumference',
    ],
    forbidden: ['lower rpm saves X%', 'highway mpg gain', 'effortless cruising'],
    maxSentences: 3,
  },
  recommendation: {
    title: 'Recommendation',
    objective:
      'Decision summary: fitment score, category-appropriate use, verification steps — no marketing tier labels.',
    reasoningPattern:
      '1) Lead with fitment score and what it implies for this category. 2) State the primary measured trade-off (one dimension). 3) Give a concrete verification action before purchase.',
    allowedFacts: [
      'fitment score',
      'overall diameter (direction)',
      'section width (direction)',
      'speedometer error',
      'wheel diameter',
      'load index',
      'speed rating',
    ],
    forbidden: [
      'aggressive upgrade',
      'trail ready',
      'must buy',
      'percent better',
      'no-brainer',
    ],
    maxSentences: 4,
  },
};

/** Assembled system prompt for a future LLM engineering pass. */
export function buildEngineeringSystemPrompt(): string {
  const voice = ENGINEERING_VOICE;
  const style = WRITING_STYLE_RULES;

  return [
    `Persona: ${voice.persona}`,
    `Tone: ${voice.tone.join(', ')}.`,
    '',
    'Principles:',
    ...voice.principles.map((p) => `- ${p}`),
    '',
    'Writing style:',
    ...style.sentenceStructure.map((r) => `- ${r}`),
    ...style.measurementCitation.map((r) => `- ${r}`),
    ...style.conciseness.map((r) => `- ${r}`),
    '',
    'Never open with:',
    style.avoidOpeners.join(', '),
    '',
    'Forbidden patterns:',
    ...voice.forbiddenPatterns.map((p) => `- ${p}`),
  ].join('\n');
}

/** Section-specific user prompt fragment for a future LLM pass. */
export function buildEngineeringSectionPrompt(sectionId: EngineeringAnalysisSectionId): string {
  const section = ENGINEERING_SECTION_PROMPTS[sectionId];
  return [
    `Section: ${section.title}`,
    `Objective: ${section.objective}`,
    `Reasoning pattern: ${section.reasoningPattern}`,
    `Allowed facts: ${section.allowedFacts.join('; ')}`,
    `Forbidden: ${section.forbidden.join('; ')}`,
    `Max sentences: ${section.maxSentences}`,
  ].join('\n');
}
