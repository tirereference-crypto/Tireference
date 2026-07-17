import {
  buildCuratedPopularComparisons,
  comparisonSlugFromSizes,
  getAllComparisonSlugs,
} from './tire-comparison-links';
import { buildComparisonInsights } from './tire-comparison-insights';
import { compareTires, getTireSpecs } from './tire-math';
import {
  extractComparisonContentBlocks,
  extractProseForDuplicateCheck,
  validateComparisonQuality,
} from './tire-comparison-quality-validator';
import {
  fitmentVerdictFromScore,
  recommendationFromScore,
  upgradeHeadlineFromScore,
} from './tire-comparison-fitment';
import {
  buildComparisonAnalysis,
  synthesizeUpgradeRecommendation,
} from './tire-comparison-engineering-analysis';
import { buildComparisonPerformanceImpactCards } from './tire-real-world-impact';
import { buildComparisonFaqs } from './tire-comparison-section-copy';

export interface ComparisonConsistencyIssue {
  pair: string;
  category: string;
  detail: string;
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\s+/).filter((t) => t.length > 3));
  const tokensB = new Set(b.toLowerCase().split(/\s+/).filter((t) => t.length > 3));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared++;
  }
  return shared / Math.min(tokensA.size, tokensB.size);
}

function expectedStarRating(fitmentScore: number): number {
  return Math.max(1, Math.min(5, Math.round((fitmentScore / 10) * 5 * 2) / 2));
}

/** Full consistency audit across every published comparison page. */
export function auditComparisonConsistency(): ComparisonConsistencyIssue[] {
  const issues: ComparisonConsistencyIssue[] = [];
  const publishedHrefs = new Set(
    getAllComparisonSlugs().map(({ slug }) => `/compare/${slug}`),
  );

  for (const { current, new: newSize } of getAllComparisonSlugs()) {
    const pair = `${current} vs ${newSize}`;
    const specsA = getTireSpecs(current);
    const specsB = getTireSpecs(newSize);
    const comparison = compareTires(current, newSize, 60);
    const insights = buildComparisonInsights(current, newSize, comparison, specsA, specsB);
    const m = insights.engineeringAnalysis.measurements;

    if (!insights.qualityValidation.approved) {
      issues.push({
        pair,
        category: 'quality-gate',
        detail: `Failed quality validation: ${JSON.stringify(insights.qualityValidation)}`,
      });
    }

    const expectedVerdict = fitmentVerdictFromScore(insights.fitmentScore);
    if (insights.quickVerdict.label !== expectedVerdict.shortLabel) {
      issues.push({
        pair,
        category: 'verdict-score',
        detail: `quickVerdict.label "${insights.quickVerdict.label}" != expected "${expectedVerdict.shortLabel}" for score ${insights.fitmentScore}`,
      });
    }
    if (insights.quickVerdict.score !== insights.fitmentScore) {
      issues.push({
        pair,
        category: 'verdict-score',
        detail: `quickVerdict.score ${insights.quickVerdict.score} != fitmentScore ${insights.fitmentScore}`,
      });
    }
    if (insights.recommendationLabel !== recommendationFromScore(insights.fitmentScore).label) {
      issues.push({
        pair,
        category: 'verdict-score',
        detail: `recommendationLabel "${insights.recommendationLabel}" != score band label`,
      });
    }
    if (insights.fitmentLabel !== expectedVerdict.fitmentLabel) {
      issues.push({
        pair,
        category: 'verdict-score',
        detail: `fitmentLabel "${insights.fitmentLabel}" != expected "${expectedVerdict.fitmentLabel}"`,
      });
    }
    if (insights.starRating !== expectedStarRating(insights.fitmentScore)) {
      issues.push({
        pair,
        category: 'verdict-score',
        detail: `starRating ${insights.starRating} != score-derived ${expectedStarRating(insights.fitmentScore)}`,
      });
    }

    const upgrade = synthesizeUpgradeRecommendation(insights.engineeringAnalysis);
    if (insights.seo.isGoodUpgrade.headline !== upgrade.headline) {
      issues.push({
        pair,
        category: 'verdict-score',
        detail: `SEO upgrade headline drifted from synthesizeUpgradeRecommendation`,
      });
    }
    if (insights.seo.isGoodUpgrade.headline !== upgradeHeadlineFromScore(insights.fitmentScore)) {
      issues.push({
        pair,
        category: 'verdict-score',
        detail: `SEO upgrade headline "${insights.seo.isGoodUpgrade.headline}" != score band headline`,
      });
    }

    const recomputedAnalysis = buildComparisonAnalysis(
      current,
      newSize,
      comparison,
      specsA,
      specsB,
    );
    const measurementKeys: (keyof typeof m)[] = [
      'diamDiffIn',
      'widthPct',
      'sidewallPct',
      'revsDiffPct',
      'fitmentScore',
      'rpmDelta',
      'groundClearanceChangeIn',
    ];
    for (const key of measurementKeys) {
      if (m[key] !== recomputedAnalysis.measurements[key]) {
        issues.push({
          pair,
          category: 'engineering-analysis',
          detail: `measurements.${String(key)} stale: ${m[key]} vs ${recomputedAnalysis.measurements[key]}`,
        });
      }
    }

    const expectedPerf = buildComparisonPerformanceImpactCards(insights.engineeringAnalysis);
    for (const expected of expectedPerf) {
      const actual = insights.performanceCards.find((c) => c.id === expected.id);
      if (!actual) {
        issues.push({ pair, category: 'performance-delta', detail: `Missing performance card ${expected.id}` });
        continue;
      }
      if (actual.value !== expected.value) {
        issues.push({
          pair,
          category: 'performance-delta',
          detail: `performance.${expected.id}.value "${actual.value}" != computed "${expected.value}"`,
        });
      }
      if (actual.explanation !== expected.explanation) {
        issues.push({
          pair,
          category: 'performance-delta',
          detail: `performance.${expected.id}.explanation drifted from engineering analysis`,
        });
      }
    }

    const expectedFaqs = buildComparisonFaqs(current, newSize, insights.engineeringAnalysis);
    for (const faq of insights.seo.faqs) {
      const expected = expectedFaqs.find((f) => f.question === faq.question);
      if (!expected) continue;
      if (faq.answer !== expected.answer) {
        issues.push({
          pair,
          category: 'faq-engineering',
          detail: `FAQ "${faq.question.slice(0, 40)}…" answer drifted from engineering values`,
        });
      }
    }

    const selfHref = `/compare/${comparisonSlugFromSizes(current, newSize)}`;
    const pageHrefs = new Set<string>();
    for (const link of insights.popularComparisons) {
      if (!publishedHrefs.has(link.href)) {
        issues.push({ pair, category: 'internal-link', detail: `Broken popular link ${link.href}` });
      }
      if (link.href === selfHref) {
        issues.push({ pair, category: 'internal-link', detail: `Self-link ${link.href}` });
      }
      if (pageHrefs.has(link.href)) {
        issues.push({ pair, category: 'internal-link', detail: `Duplicate popular link ${link.href}` });
      }
      pageHrefs.add(link.href);
    }
    for (const card of insights.upgradePaths?.cards ?? []) {
      if (!card.href) continue;
      if (!publishedHrefs.has(card.href)) {
        issues.push({ pair, category: 'internal-link', detail: `Broken upgrade link ${card.href}` });
      }
      if (card.href === selfHref) {
        issues.push({ pair, category: 'internal-link', detail: `Upgrade self-link ${card.href}` });
      }
    }

    const duplicateBlocks = extractProseForDuplicateCheck(insights);
    for (let i = 0; i < duplicateBlocks.length; i++) {
      for (let j = i + 1; j < duplicateBlocks.length; j++) {
        const overlap = tokenOverlap(duplicateBlocks[i].text, duplicateBlocks[j].text);
        if (overlap >= 0.85) {
          issues.push({
            pair,
            category: 'duplicate-content',
            detail: `${duplicateBlocks[i].id} vs ${duplicateBlocks[j].id} (${Math.round(overlap * 100)}% overlap)`,
          });
        }
      }
    }

    const allBlocks = extractComparisonContentBlocks(insights);
    const quality = validateComparisonQuality(insights);
    if (!quality.approved && 'failedChecks' in quality) {
      for (const check of quality.failedChecks) {
        issues.push({ pair, category: 'fabricated-or-filler', detail: `Quality check failed: ${check}` });
      }
    }

    for (const block of allBlocks) {
      for (const pattern of [/39% better/i, /improved handling/i, /save \d+% on fuel/i, /mpg will improve/i]) {
        if (pattern.test(block.text)) {
          issues.push({
            pair,
            category: 'fabricated-or-filler',
            detail: `Banned claim in ${block.id}: ${pattern}`,
          });
        }
      }
    }
  }

  for (const link of buildCuratedPopularComparisons(20)) {
    if (!publishedHrefs.has(link.href)) {
      issues.push({
        pair: link.label,
        category: 'internal-link',
        detail: `Curated broken link ${link.href}`,
      });
    }
  }

  return issues;
}

export function formatConsistencyAuditReport(issues: ComparisonConsistencyIssue[]): string {
  if (issues.length === 0) {
    return `Comparison consistency audit: 0 issues across ${getAllComparisonSlugs().length} published pages.`;
  }

  const grouped = issues.reduce<Record<string, ComparisonConsistencyIssue[]>>((acc, issue) => {
    (acc[issue.category] ??= []).push(issue);
    return acc;
  }, {});

  const lines = [`Comparison consistency audit: ${issues.length} issue(s)`];
  for (const [category, items] of Object.entries(grouped)) {
    lines.push(`\n[${category}] (${items.length})`);
    for (const item of items) {
      lines.push(`  ${item.pair}: ${item.detail}`);
    }
  }
  return lines.join('\n');
}
