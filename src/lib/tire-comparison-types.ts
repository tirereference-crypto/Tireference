/**
 * Shared types for comparison content — breaks circular imports between
 * insights, quality validator, and engineering analysis.
 */
import type { EngineeringAnalysis } from './tire-comparison-engineering-analysis';
import type { PopularComparisonLink, UpgradePathsData } from './tire-comparison-links';
import type { UpgradePersonalityType as RecommendationPersonalityType } from './tire-comparison-recommendations';
import type { FitmentStatus, VerdictLevel } from './tire-comparison-fitment';

export type { FitmentStatus, VerdictLevel };

export interface KpiCard {
  id: string;
  label: string;
  diffAmount: string;
  diffPercent: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface PerformanceImpactCard {
  id: string;
  title: string;
  value: string;
  status: string;
  explanation: string;
  icon: string;
  subtitle?: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'warning';
  badgeStyle?: 'none' | 'dot' | 'diamond' | 'check';
  gaugeNeedle?: number;
}

export interface FitmentCheckRow {
  id: string;
  label: string;
  status: FitmentStatus;
  statusLabel: string;
  explanation: string;
}

export interface UpgradePersonality {
  type: RecommendationPersonalityType;
  badge: string;
  summary: string;
  pros: string[];
  cons: string[];
}

export interface SpecTableRow {
  label: string;
  current: string;
  newTire: string;
  difference: string;
  tone: 'positive' | 'negative' | 'neutral';
  differenceVariant?: 'info';
}

export interface ComparisonPageIntro {
  sentence: string;
}

export interface PersonalityCard {
  id: 'sportier' | 'comfort' | 'offroad';
  title: string;
  bullets: string[];
  isPrimary: boolean;
}

export interface WillThisFitRow {
  id: string;
  label: string;
  status: FitmentStatus;
  statusLabel: 'Safe' | 'Check' | 'Not Recommended';
}

export interface VehicleFitmentDisplay {
  label: string;
  detail: string;
}

export interface VehicleCompatibility {
  current: VehicleFitmentDisplay[];
  newTire: VehicleFitmentDisplay[];
}

export interface ComparisonSummaryChip {
  id: string;
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface ComparisonSeoContent {
  title: string;
  metaDescription: string;
  h1: string;
  whatChanges: string;
  isGoodUpgrade: { headline: string; body: string };
  whoShouldChoose: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface QuickComparisonVerdict {
  label: string;
  tone: 'green' | 'yellow' | 'orange' | 'red';
  indicator: string;
  score: number;
  benefits: string[];
  considerations: string[];
  bestFor: string[];
}

export interface ComparisonQualityFailure {
  approved: false;
  reason: string;
  suggestions: string[];
  failedChecks: string[];
}

export interface ComparisonQualitySuccess {
  approved: true;
}

export type ComparisonQualityResult = ComparisonQualityFailure | ComparisonQualitySuccess;

export interface ComparisonInsights {
  fitmentScore: number;
  fitmentLabel: string;
  fitmentTone: 'green' | 'yellow' | 'red';
  starRating: number;
  recommendation: VerdictLevel;
  recommendationLabel: string;
  kpiCards: KpiCard[];
  performanceCards: PerformanceImpactCard[];
  fitmentChecks: FitmentCheckRow[];
  thingsToConsider: string[];
  personality: UpgradePersonality;
  specRows: SpecTableRow[];
  quickVerdict: QuickComparisonVerdict;
  pageIntro: ComparisonPageIntro;
  summaryChips: ComparisonSummaryChip[];
  understandingDifference: string;
  personalityCards: PersonalityCard[];
  willThisFitRows: WillThisFitRow[];
  upgradePaths: UpgradePathsData | null;
  popularComparisons: PopularComparisonLink[];
  vehicleCompatibility: VehicleCompatibility;
  seo: ComparisonSeoContent;
  engineeringAnalysis: EngineeringAnalysis;
  qualityValidation: ComparisonQualityResult;
}
