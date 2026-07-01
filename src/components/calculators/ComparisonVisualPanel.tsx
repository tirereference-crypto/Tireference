import { useId } from 'react';
import type { UnitSystem } from '../../lib/calculator-types';
import type { SpecTableRow } from '../../lib/tire-comparison-insights';
import {
  formatCircumference,
  formatDimension,
  formatDimensionDiff,
} from '../../lib/tire-comparison-units';
import type { TireSpecs } from '../../lib/tire-math';
import { TireSpecsSummaryTable } from './ComparisonReferenceWidgets';

const BLUE = '#2563eb';
const ORANGE = '#ea580c';
const GRAY = '#94a3b8';

const CURRENT_TIRE_SRC = '/images/tires/tire-side-blue.png';
const NEW_TIRE_SRC = '/images/tires/tire-side-orange.png';

interface ComparisonVisualPanelProps {
  specsA: TireSpecs;
  specsB: TireSpecs;
  sizeA: string;
  sizeB: string;
  specRows: SpecTableRow[];
  activeTab: 'visual' | 'specs';
  onTabChange: (tab: 'visual' | 'specs') => void;
  unitSystem?: UnitSystem;
}

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 Z" fill={color} />
    </marker>
  );
}

function ComparisonVisualCanvas({
  specsA,
  specsB,
  sizeA,
  sizeB,
  unitSystem = 'imperial',
}: {
  specsA: TireSpecs;
  specsB: TireSpecs;
  sizeA: string;
  sizeB: string;
  unitSystem?: UnitSystem;
}) {
  const uid = useId().replace(/:/g, '');
  const blueMarker = `arrow-blue-${uid}`;
  const orangeMarker = `arrow-orange-${uid}`;

  // viewBox space: 800 x 320
  const groundY = 262;
  const leftCx = 235;
  const rightCx = 565;
  const centerX = 400;

  // Scale tire diameters to pixels. Side view is a round wheel face → square render.
  const maxDiam = Math.max(specsA.overallDiameterIn, specsB.overallDiameterIn);
  const pxPerIn = 170 / maxDiam;
  const dA = specsA.overallDiameterIn * pxPerIn; // visual diameter (= height = width)
  const dB = specsB.overallDiameterIn * pxPerIn;
  const rA = dA / 2;
  const rB = dB / 2;
  const topA = groundY - dA;
  const topB = groundY - dB;
  // Keep diameter arrowheads tucked just inside the top/bottom reference lines.
  const diamInset = 7;
  const cyA = groundY - rA;
  const cyB = groundY - rB;

  const diamDiff = specsB.overallDiameterIn - specsA.overallDiameterIn;
  const tallerIsB = diamDiff >= 0;
  const shorterTop = tallerIsB ? topA : topB;
  const tallerTop = tallerIsB ? topB : topA;
  const diffGapPx = shorterTop - tallerTop;
  const diffArrowH = Math.min(3.5, Math.max(1.2, diffGapPx * 0.2), (diffGapPx - 0.5) / 2);
  const diffArrowW = diffArrowH * 0.9;
  const shorterIsLeft = tallerIsB;
  const diffLabelX = shorterIsLeft ? centerX - 16 : centerX + 16;
  const diffLabelY = shorterTop - 4;

  const pctX = (v: number) => `${(v / 800) * 100}%`;
  const pctY = (v: number) => `${(v / 320) * 100}%`;

  return (
    <div className="cmp-viz-canvas">
      {/* Tire images (round side view), sized by diameter, sitting on the ground line */}
      <div className="cmp-viz-canvas__tires">
        <div
          className="cmp-viz-canvas__tire cmp-viz-canvas__tire--current"
          style={{
            left: pctX(leftCx - rA),
            top: pctY(topA),
            width: pctX(dA),
            height: pctY(dA),
          }}
        >
          <img src={CURRENT_TIRE_SRC} alt={`Current tire ${sizeA} side view`} decoding="async" loading="lazy" />
        </div>
        <div
          className="cmp-viz-canvas__tire cmp-viz-canvas__tire--new"
          style={{
            left: pctX(rightCx - rB),
            top: pctY(topB),
            width: pctX(dB),
            height: pctY(dB),
          }}
        >
          <img src={NEW_TIRE_SRC} alt={`New tire ${sizeB} side view`} decoding="async" loading="lazy" />
        </div>
      </div>

      {/* Reference lines, arrows and rings */}
      <svg className="cmp-viz-canvas__bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <ArrowHead id={blueMarker} color={BLUE} />
          <ArrowHead id={orangeMarker} color={ORANGE} />
        </defs>

        {/* Ground line */}
        <line x1="36" y1={groundY} x2="764" y2={groundY} stroke="#cbd5e1" strokeWidth="1.5" />

        {/* Center divider */}
        <line x1={centerX} y1="78" x2={centerX} y2={groundY} stroke={GRAY} strokeWidth="1.5" strokeDasharray="6 5" />

        {/* Colored glow rings around each tire */}
        <circle cx={leftCx} cy={cyA} r={rA + 3} fill="none" stroke={BLUE} strokeWidth="2.5" opacity="0.85" />
        <circle cx={rightCx} cy={cyB} r={rB + 3} fill="none" stroke={ORANGE} strokeWidth="2.5" opacity="0.85" />

        {/* Top alignment dashed horizontals across canvas */}
        <line x1="64" y1={topA} x2={centerX - 6} y2={topA} stroke={BLUE} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
        <line x1={centerX + 6} y1={topB} x2="736" y2={topB} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />

        {/* Center dashed line from each tire top up to its label */}
        <line x1={leftCx} y1="64" x2={leftCx} y2={topA - 2} stroke={BLUE} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />
        <line x1={rightCx} y1="64" x2={rightCx} y2={topB - 2} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />

        {/* Diameter-difference bracket in the center gap between tires */}
        {Math.abs(diamDiff) >= 0.01 && (
          <>
            <line
              x1={centerX}
              y1={tallerTop + diffArrowH}
              x2={centerX}
              y2={shorterTop - diffArrowH - 2}
              stroke={ORANGE}
              strokeWidth="1.5"
            />
            <path
              d={`M ${centerX} ${tallerTop} L ${centerX - diffArrowW} ${tallerTop + diffArrowH} L ${centerX + diffArrowW} ${tallerTop + diffArrowH} Z`}
              fill={ORANGE}
            />
            <path
              d={`M ${centerX} ${shorterTop - 2} L ${centerX - diffArrowW} ${shorterTop - 2 - diffArrowH} L ${centerX + diffArrowW} ${shorterTop - 2 - diffArrowH} Z`}
              fill={ORANGE}
            />
            <text
              x={diffLabelX}
              y={diffLabelY}
              textAnchor={shorterIsLeft ? 'end' : 'start'}
              dominantBaseline="text-after-edge"
              fill={ORANGE}
              fontSize="13"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
            >
              {formatDimensionDiff(diamDiff, unitSystem)}
            </text>
          </>
        )}

        {/* Left diameter arrow (outer edge) — points to tire top & bottom */}
        <line x1={leftCx - rA - 26} y1={topA} x2={leftCx} y2={topA} stroke={BLUE} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line x1={leftCx - rA - 26} y1={groundY} x2={leftCx} y2={groundY} stroke={BLUE} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line
          x1={leftCx - rA - 26}
          y1={topA + diamInset}
          x2={leftCx - rA - 26}
          y2={groundY - diamInset}
          stroke={BLUE}
          strokeWidth="2"
          markerStart={`url(#${blueMarker})`}
          markerEnd={`url(#${blueMarker})`}
        />
        <text x={leftCx - rA - 34} y={cyA - 6} fill={BLUE} fontSize="11" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif" textAnchor="end">
          Diameter
        </text>
        <text x={leftCx - rA - 34} y={cyA + 10} fill={BLUE} fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace" textAnchor="end">
          {formatDimension(specsA.overallDiameterIn, unitSystem)}
        </text>

        {/* Right diameter arrow (outer edge) — points to tire top & bottom */}
        <line x1={rightCx} y1={topB} x2={rightCx + rB + 26} y2={topB} stroke={ORANGE} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line x1={rightCx} y1={groundY} x2={rightCx + rB + 26} y2={groundY} stroke={ORANGE} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line
          x1={rightCx + rB + 26}
          y1={topB + diamInset}
          x2={rightCx + rB + 26}
          y2={groundY - diamInset}
          stroke={ORANGE}
          strokeWidth="2"
          markerStart={`url(#${orangeMarker})`}
          markerEnd={`url(#${orangeMarker})`}
        />
        <text x={rightCx + rB + 34} y={cyB - 6} fill={ORANGE} fontSize="11" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif" textAnchor="start">
          Diameter
        </text>
        <text x={rightCx + rB + 34} y={cyB + 10} fill={ORANGE} fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace" textAnchor="start">
          {formatDimension(specsB.overallDiameterIn, unitSystem)}
        </text>

      </svg>

      {/* Size labels */}
      <div className="cmp-viz-canvas__labels">
        <div className="cmp-viz-canvas__label cmp-viz-canvas__label--current" style={{ left: pctX(leftCx) }}>
          <p className="cmp-viz-canvas__size">{sizeA}</p>
          <p className="cmp-viz-canvas__diam">Circumference: {formatCircumference(specsA.circumferenceIn, unitSystem)}</p>
        </div>
        <div className="cmp-viz-canvas__label cmp-viz-canvas__label--new" style={{ left: pctX(rightCx) }}>
          <p className="cmp-viz-canvas__size">{sizeB}</p>
          <p className="cmp-viz-canvas__diam">Circumference: {formatCircumference(specsB.circumferenceIn, unitSystem)}</p>
        </div>
      </div>
    </div>
  );
}

export function ComparisonVisualPanel({
  specsA,
  specsB,
  sizeA,
  sizeB,
  specRows,
  activeTab,
  onTabChange,
  unitSystem = 'imperial',
}: ComparisonVisualPanelProps) {
  return (
    <section className="cmp-viz-panel" id="visual-comparison" aria-label="Visual comparison">
      <div className="cmp-viz-panel__toolbar">
        <div className="cmp-viz-panel__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'visual'}
            className={`cmp-viz-panel__tab ${activeTab === 'visual' ? 'cmp-viz-panel__tab--active' : ''}`}
            onClick={() => onTabChange('visual')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Visual Comparison
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'specs'}
            className={`cmp-viz-panel__tab ${activeTab === 'specs' ? 'cmp-viz-panel__tab--active' : ''}`}
            onClick={() => onTabChange('specs')}
          >
            Side by Side Table
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <ComparisonVisualCanvas
          specsA={specsA}
          specsB={specsB}
          sizeA={sizeA}
          sizeB={sizeB}
          unitSystem={unitSystem}
        />
      ) : (
        <div className="cmp-viz-panel__table">
          <TireSpecsSummaryTable rows={specRows} variant="panel" />
        </div>
      )}
    </section>
  );
}
