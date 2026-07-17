import { useId } from 'react';
import type { UnitSystem } from '../../lib/calculator-types';
import {
  formatCircumference,
  formatDimension,
  formatDimensionDiff,
} from '../../lib/tire-comparison-units';
import type { TireSpecs } from '../../lib/tire-math';

const BLUE = '#2563eb'; /* --cmp-original */
const ORANGE = '#ea580c'; /* --cmp-new */
const PURPLE = '#64748b'; /* muted third-tire accent — avoid competing brand purple */
const GRAY = '#94a3b8';

const CURRENT_TIRE_SRC = '/images/tires/tire-side-blue.png';
const NEW_TIRE_SRC = '/images/tires/tire-side-orange.png';
const THIRD_TIRE_SRC = '/images/tires/tire-side-orange.png';

interface ComparisonVisualPanelProps {
  specsA: TireSpecs;
  specsB: TireSpecs;
  sizeA: string;
  sizeB: string;
  specsC?: TireSpecs;
  sizeC?: string;
  unitSystem?: UnitSystem;
  /** When true, omit the outer card chrome (used inside tab panel). */
  embedded?: boolean;
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
  const descId = `viz-desc-${uid}`;

  const groundY = 288;
  const viewH = 320;
  const leftCx = 230;
  const rightCx = 570;
  const centerX = 400;

  const maxDiam = Math.max(specsA.overallDiameterIn, specsB.overallDiameterIn);
  /** Slightly undersize vs canvas so labels clear the tire glow ring. */
  const pxPerIn = 220 / maxDiam;
  const dA = specsA.overallDiameterIn * pxPerIn;
  const dB = specsB.overallDiameterIn * pxPerIn;
  const rA = dA / 2;
  const rB = dB / 2;
  const topA = groundY - dA;
  const topB = groundY - dB;
  const diamInset = 7;
  const cyA = groundY - rA;
  const cyB = groundY - rB;
  const wA = Math.min(rA * 1.35, specsA.sectionWidthIn * pxPerIn * 0.55);
  const wB = Math.min(rB * 1.35, specsB.sectionWidthIn * pxPerIn * 0.55);

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
  const pctY = (v: number) => `${(v / viewH) * 100}%`;
  const labelClearance = 58;
  const labelTopA = Math.max(4, topA - labelClearance);
  const labelTopB = Math.max(4, topB - labelClearance);

  const description = [
    `Side-by-side proportional comparison of Original tire ${sizeA} and New tire ${sizeB} on a shared ground baseline.`,
    `Overall diameter ${formatDimension(specsA.overallDiameterIn, unitSystem)} versus ${formatDimension(specsB.overallDiameterIn, unitSystem)}`,
    `(difference ${formatDimensionDiff(diamDiff, unitSystem)}).`,
    `Section width ${formatDimension(specsA.sectionWidthIn, unitSystem)} versus ${formatDimension(specsB.sectionWidthIn, unitSystem)}.`,
    `Wheel diameter ${specsA.wheelDiameterIn}" versus ${specsB.wheelDiameterIn}".`,
  ].join(' ');

  return (
    <div
      className="cmp-viz-canvas"
      role="img"
      aria-labelledby={descId}
    >
      <p id={descId} className="sr-only">
        {description}
      </p>
      <div className="cmp-viz-canvas__tires" aria-hidden="true">
        <div
          className="cmp-viz-canvas__tire cmp-viz-canvas__tire--current"
          style={{
            left: pctX(leftCx - rA),
            top: pctY(topA),
            width: pctX(dA),
            height: pctY(dA),
          }}
        >
          <img src={CURRENT_TIRE_SRC} alt="" decoding="async" loading="lazy" />
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
          <img src={NEW_TIRE_SRC} alt="" decoding="async" loading="lazy" />
        </div>
      </div>

      <svg className="cmp-viz-canvas__bg" viewBox={`0 0 800 ${viewH}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <ArrowHead id={blueMarker} color={BLUE} />
          <ArrowHead id={orangeMarker} color={ORANGE} />
        </defs>

        <line x1="36" y1={groundY} x2="764" y2={groundY} stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1={centerX} y1={Math.min(topA, topB) - 8} x2={centerX} y2={groundY} stroke={GRAY} strokeWidth="1.5" strokeDasharray="6 5" />
        <circle cx={leftCx} cy={cyA} r={rA + 3} fill="none" stroke={BLUE} strokeWidth="2.5" opacity="0.85" />
        <circle cx={rightCx} cy={cyB} r={rB + 3} fill="none" stroke={ORANGE} strokeWidth="2.5" opacity="0.85" />
        <line x1="64" y1={topA} x2={centerX - 6} y2={topA} stroke={BLUE} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
        <line x1={centerX + 6} y1={topB} x2="736" y2={topB} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
        <line x1={leftCx} y1={Math.max(28, topA - 18)} x2={leftCx} y2={topA - 2} stroke={BLUE} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />
        <line x1={rightCx} y1={Math.max(28, topB - 18)} x2={rightCx} y2={topB - 2} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />

        {/* Section-width cues at ground (text identity also below). */}
        <line x1={leftCx - wA} y1={groundY - 10} x2={leftCx + wA} y2={groundY - 10} stroke={BLUE} strokeWidth="2" opacity="0.7" />
        <line x1={rightCx - wB} y1={groundY - 10} x2={rightCx + wB} y2={groundY - 10} stroke={ORANGE} strokeWidth="2" opacity="0.7" />

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

      <div className="cmp-viz-canvas__labels">
        <div
          className="cmp-viz-canvas__label cmp-viz-canvas__label--current"
          style={{ left: pctX(leftCx), top: pctY(labelTopA) }}
        >
          <p className="cmp-viz-canvas__role">Original</p>
          <p className="cmp-viz-canvas__size">{sizeA}</p>
        </div>
        <div
          className="cmp-viz-canvas__label cmp-viz-canvas__label--new"
          style={{ left: pctX(rightCx), top: pctY(labelTopB) }}
        >
          <p className="cmp-viz-canvas__role">New</p>
          <p className="cmp-viz-canvas__size">{sizeB}</p>
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
  specsC,
  sizeC,
  unitSystem = 'imperial',
  embedded = false,
}: ComparisonVisualPanelProps) {
  const body =
    specsC && sizeC ? (
      <ComparisonTripleVisualCanvas
        specsA={specsA}
        specsB={specsB}
        specsC={specsC}
        sizeA={sizeA}
        sizeB={sizeB}
        sizeC={sizeC}
        unitSystem={unitSystem}
      />
    ) : (
      <ComparisonVisualCanvas
        specsA={specsA}
        specsB={specsB}
        sizeA={sizeA}
        sizeB={sizeB}
        unitSystem={unitSystem}
      />
    );

  if (embedded) return body;

  return (
    <section className="cmp-viz-panel" id="visual-comparison" aria-label="Visual comparison">
      {body}
    </section>
  );
}

function ComparisonTripleVisualCanvas({
  specsA,
  specsB,
  specsC,
  sizeA,
  sizeB,
  sizeC,
  unitSystem = 'imperial',
}: {
  specsA: TireSpecs;
  specsB: TireSpecs;
  specsC: TireSpecs;
  sizeA: string;
  sizeB: string;
  sizeC: string;
  unitSystem?: UnitSystem;
}) {
  const uid = useId().replace(/:/g, '');
  const descId = `viz-triple-desc-${uid}`;
  const groundY = 248;
  const viewH = 278;
  const positions = [150, 400, 650];
  const specs = [specsA, specsB, specsC];
  const sizes = [sizeA, sizeB, sizeC];
  const colors = [BLUE, ORANGE, PURPLE];
  const roles = ['Original', 'New', 'Third'];
  const tireClasses = ['current', 'new', 'third'] as const;
  const tireSrcs = [CURRENT_TIRE_SRC, NEW_TIRE_SRC, THIRD_TIRE_SRC];

  const maxDiam = Math.max(...specs.map((s) => s.overallDiameterIn));
  const pxPerIn = 170 / maxDiam;

  const tires = specs.map((spec, index) => {
    const d = spec.overallDiameterIn * pxPerIn;
    const r = d / 2;
    const cx = positions[index];
    const top = groundY - d;
    return { d, r, cx, top, cy: groundY - r, spec, size: sizes[index], role: roles[index] };
  });

  const pctX = (v: number) => `${(v / 800) * 100}%`;
  const pctY = (v: number) => `${(v / viewH) * 100}%`;

  return (
    <div
      className="cmp-viz-canvas cmp-viz-canvas--triple"
      role="img"
      aria-labelledby={descId}
    >
      <p id={descId} className="sr-only">
        Proportional three-tire comparison of {sizeA}, {sizeB}, and {sizeC} on a shared ground baseline.
      </p>
      <div className="cmp-viz-canvas__tires" aria-hidden="true">
        {tires.map((tire, index) => (
          <div
            key={tire.size}
            className={`cmp-viz-canvas__tire cmp-viz-canvas__tire--${tireClasses[index]}`}
            style={{
              left: pctX(tire.cx - tire.r),
              top: pctY(tire.top),
              width: pctX(tire.d),
              height: pctY(tire.d),
            }}
          >
            <img src={tireSrcs[index]} alt="" decoding="async" loading="lazy" />
          </div>
        ))}
      </div>

      <svg className="cmp-viz-canvas__bg" viewBox={`0 0 800 ${viewH}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          {colors.map((color, index) => (
            <ArrowHead key={color} id={`arrow-${index}-${uid}`} color={color} />
          ))}
        </defs>
        <line x1="36" y1={groundY} x2="764" y2={groundY} stroke="#cbd5e1" strokeWidth="1.5" />
        {tires.map((tire, index) => (
          <circle
            key={tire.size}
            cx={tire.cx}
            cy={tire.cy}
            r={tire.r + 3}
            fill="none"
            stroke={colors[index]}
            strokeWidth="2.5"
            opacity="0.85"
          />
        ))}
      </svg>

      <div className="cmp-viz-canvas__labels cmp-viz-canvas__labels--triple">
        {tires.map((tire, index) => (
          <div
            key={tire.size}
            className={`cmp-viz-canvas__label cmp-viz-canvas__label--${tireClasses[index]}`}
            style={{ left: pctX(tire.cx), top: pctY(Math.max(6, tire.top - 58)) }}
          >
            <p className="cmp-viz-canvas__role">{tire.role}</p>
            <p className="cmp-viz-canvas__size">{tire.size}</p>
            <p className="cmp-viz-canvas__diam">
              Circumference {formatCircumference(tire.spec.circumferenceIn, unitSystem)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
