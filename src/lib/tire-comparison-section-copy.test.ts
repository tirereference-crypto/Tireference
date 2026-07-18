import { describe, expect, it } from 'vitest';
import { resolveComparisonDataSources } from './comparison-data-sources';
import { buildComparisonFaqs, buildFitmentConsiderations, buildFuelEconomyFaqAnswer, buildRideHandlingFaqAnswer } from './tire-comparison-section-copy';
import { buildComparisonAnalysis } from './tire-comparison-engineering-analysis';
import { compareTires, getTireSpecs } from './tire-math';

function things(sizeA: string, sizeB: string): string[] {
  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);
  const comparison = compareTires(sizeA, sizeB, 60);
  return buildFitmentConsiderations(
    buildComparisonAnalysis(sizeA, sizeB, comparison, specsA, specsB),
  );
}

describe('buildFitmentConsiderations', () => {
  it('larger-diameter upsize: bullets match positive diameter and width deltas', () => {
    const sizeA = '275/70R18';
    const sizeB = '305/70R18';
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const comparison = compareTires(sizeA, sizeB, 60);
    const bullets = things(sizeA, sizeB);
    const joined = bullets.join(' | ').toLowerCase();

    expect(specsB.overallDiameterIn).toBeGreaterThan(specsA.overallDiameterIn);
    expect(comparison.groundClearanceChangeIn).toBeGreaterThan(0);
    expect(specsB.widthMm).toBeGreaterThan(specsA.widthMm);

    expect(joined).toMatch(/more ground clearance/);
    expect(joined).toMatch(/larger contact patch/);
    expect(joined).toMatch(/heavier rotating mass/);
    expect(joined).toMatch(/tighter fitment margin/);
    expect(joined).not.toMatch(/less ground clearance/);
    expect(joined).not.toMatch(/smaller contact patch/);
    expect(joined).not.toMatch(/lighter rotating mass/);
    expect(joined).not.toMatch(/easier fitment margin/);

    expect(bullets[0]).toContain(`+${comparison.groundClearanceChangeIn.toFixed(2)} in`);
  });

  it('same-diameter lower-profile change: sidewall and width drive bullets, not inverted clearance', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const comparison = compareTires(sizeA, sizeB, 60);
    const bullets = things(sizeA, sizeB);
    const joined = bullets.join(' | ').toLowerCase();

    expect(Math.abs(comparison.diameterDiffPercent)).toBeLessThan(2.5);
    expect(specsB.sidewallIn).toBeLessThan(specsA.sidewallIn);
    expect(specsB.widthMm).toBeGreaterThan(specsA.widthMm);

    if (comparison.groundClearanceChangeIn > 0.01) {
      expect(joined).toMatch(/more ground clearance/);
    } else if (comparison.groundClearanceChangeIn < -0.01) {
      expect(joined).toMatch(/less ground clearance/);
    } else {
      expect(joined).toMatch(/ground clearance unchanged/);
    }

    expect(joined).toMatch(/shorter sidewall/);
    expect(joined).toMatch(/larger contact patch/);
    expect(joined).not.toMatch(/smaller contact patch/);
    expect(joined).not.toMatch(/taller sidewall/);
  });

  it('225/45R17 vs 235/40R18 ride FAQ says noticeably firmer, not largely unchanged', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const analysis = buildComparisonAnalysis(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );
    const answer = buildRideHandlingFaqAnswer(analysis);

    expect(analysis.measurements.sidewallPct).toBeLessThan(-6);
    expect(answer).toMatch(/shortens|−7\.16%|compliance/i);
    expect(answer).not.toMatch(/largely unchanged/i);
    expect(answer).not.toMatch(/Sidewall height is similar between these sizes/i);
    expect(answer).toMatch(/\d/);
    expect(answer).toMatch(/mm|"|RPM|%/);
  });

  it('smaller downsize: bullets match negative diameter and width deltas', () => {
    const sizeA = '305/70R18';
    const sizeB = '275/70R18';
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const comparison = compareTires(sizeA, sizeB, 60);
    const bullets = things(sizeA, sizeB);
    const joined = bullets.join(' | ').toLowerCase();

    expect(specsB.overallDiameterIn).toBeLessThan(specsA.overallDiameterIn);
    expect(comparison.groundClearanceChangeIn).toBeLessThan(0);
    expect(specsB.widthMm).toBeLessThan(specsA.widthMm);

    expect(joined).toMatch(/less ground clearance/);
    expect(joined).toMatch(/smaller contact patch/);
    expect(joined).toMatch(/lighter rotating mass/);
    expect(joined).not.toMatch(/more ground clearance/);
    expect(joined).not.toMatch(/larger contact patch/);
    expect(joined).not.toMatch(/heavier rotating mass/);

    expect(bullets[0]).toContain(Math.abs(comparison.groundClearanceChangeIn).toFixed(2));
  });

  it('every comparison FAQ answer cites calculated measurements', () => {
    const pairs: [string, string][] = [
      ['225/45R17', '235/40R18'],
      ['275/70R18', '285/75R18'],
      ['265/70R17', '245/70R16'],
    ];

    for (const [sizeA, sizeB] of pairs) {
      const analysis = buildComparisonAnalysis(
        sizeA,
        sizeB,
        compareTires(sizeA, sizeB, 60),
        getTireSpecs(sizeA),
        getTireSpecs(sizeB),
      );
      const faqs = buildComparisonFaqs(sizeA, sizeB, analysis);

      expect(faqs.length).toBeGreaterThanOrEqual(12);
      expect(faqs.map((f) => f.question)).toEqual(
        expect.arrayContaining([
          'Does this comparison confirm vehicle fitment?',
          'How accurate are the comparison results?',
          'How are tire dimensions calculated?',
          'Will the speedometer be affected?',
          'Do I need new wheels?',
          'Can different tire sizes use the same wheel?',
          'How much clearance should I check?',
          'Can I mix tire sizes front and rear?',
          'Why do actual tire dimensions differ between brands?',
          'What is the difference between nominal and published tire dimensions?',
          'How does tire size affect effective gearing?',
          'Why does sidewall height matter?',
        ]),
      );
      expect(faqs[0].question).toBe('Does this comparison confirm vehicle fitment?');
      for (const faq of faqs) {
        expect(faq.answer).toMatch(/\d/);
        expect(faq.answer.toLowerCase()).not.toMatch(
          /it depends on your priorities|both sizes have advantages|depends on driving style|guaranteed fit|safe fit|perfect replacement|will not rub|always acceptable|100% accurate/,
        );
      }
    }
  });

  it('adds AWD caution only when the shared diameter threshold is exceeded', () => {
    const close = buildComparisonFaqs(
      '225/45R17',
      '235/40R18',
      buildComparisonAnalysis(
        '225/45R17',
        '235/40R18',
        compareTires('225/45R17', '235/40R18', 60),
        getTireSpecs('225/45R17'),
        getTireSpecs('235/40R18'),
      ),
    );
    const significant = buildComparisonFaqs(
      '275/70R18',
      '305/70R18',
      buildComparisonAnalysis(
        '275/70R18',
        '305/70R18',
        compareTires('275/70R18', '305/70R18', 60),
        getTireSpecs('275/70R18'),
        getTireSpecs('305/70R18'),
      ),
    );
    expect(close.some((faq) => /AWD/.test(faq.question))).toBe(false);
    expect(significant.find((faq) => /AWD/.test(faq.question))?.answer).toMatch(
      /outside.*±3%|±3%.*outside/i,
    );
  });

  it('mentions published source mode when product data is provided', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/45R17';
    const analysis = buildComparisonAnalysis(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );
    const product = {
      brand: 'Acme',
      model: 'Grip',
      display_size: sizeA,
      tire_size: sizeA,
      overall_diameter_in: 24.97,
      section_width_in: 8.9,
      revs_per_mile: 833,
      load_range: 'XL',
      speed_rating: 'W',
      service_description: '94W',
      approved_rim_range: '7.0-8.5',
      max_load_lb: null,
      weight_lb: null,
      tread_depth_32nds: null,
      source_url: 'https://example.com',
      product_category: 'Passenger',
      overall_width_in: null,
    };
    const dataSources = resolveComparisonDataSources({
      sizeA,
      sizeB,
      productA: product as never,
      productB: { ...product, display_size: sizeB, tire_size: sizeB, approved_rim_range: '7.5-9.0' } as never,
    });
    const faqs = buildComparisonFaqs(sizeA, sizeB, analysis, dataSources);
    const published = faqs.find(
      (f) => f.question === 'Are published product measurements available for this pair?',
    )!;
    expect(published.answer).toMatch(/published catalog rows for both/i);
    expect(published.answer).toMatch(/Acme Grip/);
  });

  it('fuel economy FAQ cites RPM and revs deltas', () => {
    const sizeA = '275/70R18';
    const sizeB = '285/75R18';
    const analysis = buildComparisonAnalysis(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );
    const answer = buildFuelEconomyFaqAnswer(analysis);

    expect(answer).toMatch(/RPM/i);
    expect(answer).toMatch(/%/);
    expect(answer).not.toMatch(/driving style/i);
  });
});
