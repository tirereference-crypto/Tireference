import { useId } from 'react';
import {
  formatToleranceLabel,
  valueFromInches,
} from '../../../lib/tire-diameter-search';

const TIRE_SIDE_VIEW_SRC = '/images/tires/tire-flat-side-view.png';
const OVERALL_COLOR = '#2563eb';
const WHEEL_COLOR = '#ea580c';

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
      <path d="M0,0 L7,3.5 L0,7 Z" fill={color} />
    </marker>
  );
}

function formatDisplayDiameter(
  inches: number,
  unit: 'imperial' | 'metric',
): string {
  if (unit === 'metric') {
    const mm = valueFromInches(inches, 'metric');
    return `${Math.round(mm * 10) / 10} mm`;
  }
  return `${inches.toFixed(1)} in`;
}

/** Annotated visual reference for target overall diameter vs wheel. */
export function TargetTireVisual({
  targetDiameterIn,
  wheelDiameterIn: _wheelDiameterIn,
  wheelLabel,
  toleranceIn,
  diameterUnit = 'imperial',
}: {
  targetDiameterIn: number;
  /** Reserved — photo rim is fixed; label still reflects selection. */
  wheelDiameterIn: number;
  /** Display label — e.g. `18` or `Any`. */
  wheelLabel: string;
  toleranceIn: number;
  diameterUnit?: 'imperial' | 'metric';
}) {
  const uid = useId().replace(/:/g, '');
  const overallMarker = `dia-tv-overall-${uid}`;
  const wheelMarker = `dia-tv-wheel-${uid}`;

  const low = Math.max(0, targetDiameterIn - toleranceIn);
  const high = targetDiameterIn + toleranceIn;

  // Wide canvas: tire centered with dedicated outer gutters for arrows + labels.
  const viewW = 420;
  const viewH = 300;
  const cx = 210;
  const groundY = 262;
  const tireR = 96;
  /**
   * Outer rim lip in `tire-flat-side-view.png` (bright flange ring), as a
   * fraction of tire radius. The photo is fixed — do not use wheel/overall
   * inches here or the circle floats inside the spokes.
   */
  const ASSET_WHEEL_RATIO = 0.635;
  const wheelR = tireR * ASSET_WHEEL_RATIO;
  const tireCy = groundY - tireR;
  const tireTop = tireCy - tireR;
  // Photo rim sits slightly left of the geometric tire center.
  const wheelCx = cx - 8;
  const wheelCy = tireCy;
  const wheelTop = wheelCy - wheelR;
  const wheelBottom = wheelCy + wheelR;

  // Arrows in the outer gutters — never over the tire.
  const tireRight = cx + tireR;
  const wheelX = 48;
  const overallX = viewW - 48;
  const inset = 6;
  const isAnyWheel = wheelLabel === 'Any';

  const overallSpec = formatDisplayDiameter(targetDiameterIn, diameterUnit);
  const wheelSpec = isAnyWheel
    ? 'Any'
    : diameterUnit === 'metric'
      ? `${Math.round(valueFromInches(Number(wheelLabel), 'metric') * 10) / 10} mm`
      : `${wheelLabel} in`;
  const overallMidY = (tireTop + groundY) / 2;
  const wheelMidY = (wheelTop + wheelBottom) / 2;

  // Horizontal labels sit outside the arrows (away from the tire).
  const wheelLabelX = wheelX - 6;
  const overallLabelX = overallX + 6;

  return (
    <div className={`dia-target-visual${isAnyWheel ? ' dia-target-visual--any-wheel' : ''}`}>
      <div className="dia-target-visual__frame" aria-hidden="true">
        <div
          className="dia-target-visual__tire-img"
          style={{
            width: `${((tireR * 2) / viewW) * 100}%`,
            height: `${((tireR * 2) / viewH) * 100}%`,
            left: `${((cx - tireR) / viewW) * 100}%`,
            top: `${(tireTop / viewH) * 100}%`,
          }}
        >
          <img src={TIRE_SIDE_VIEW_SRC} alt="" decoding="async" width={280} height={280} />
        </div>

        <svg
          className="dia-target-visual__svg"
          viewBox={`0 0 ${viewW} ${viewH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <ArrowHead id={overallMarker} color={OVERALL_COLOR} />
            {!isAnyWheel ? <ArrowHead id={wheelMarker} color={WHEEL_COLOR} /> : null}
          </defs>

          <line
            x1="12"
            y1={groundY}
            x2={viewW - 12}
            y2={groundY}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {isAnyWheel ? (
            <text
              x={wheelLabelX}
              y={wheelMidY}
              fill={WHEEL_COLOR}
              fontSize="11"
              fontWeight="700"
              textAnchor="end"
              dominantBaseline="middle"
              opacity="0.85"
              style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
            >
              {wheelSpec}
            </text>
          ) : (
            <>
              <circle
                cx={wheelCx}
                cy={wheelCy}
                r={wheelR}
                fill="none"
                stroke={WHEEL_COLOR}
                strokeWidth="1.75"
                opacity="0.7"
                strokeDasharray="4 3"
              />
              <line
                x1={wheelX}
                y1={wheelTop + inset}
                x2={wheelX}
                y2={wheelBottom - inset}
                stroke={WHEEL_COLOR}
                strokeWidth="2.25"
                markerStart={`url(#${wheelMarker})`}
                markerEnd={`url(#${wheelMarker})`}
              />
              <line
                x1={wheelX}
                y1={wheelTop}
                x2={wheelCx - wheelR + 2}
                y2={wheelTop}
                stroke={WHEEL_COLOR}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              <line
                x1={wheelX}
                y1={wheelBottom}
                x2={wheelCx - wheelR + 2}
                y2={wheelBottom}
                stroke={WHEEL_COLOR}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              <text
                x={wheelLabelX}
                y={wheelMidY}
                fill={WHEEL_COLOR}
                fontSize="11"
                fontWeight="700"
                textAnchor="end"
                dominantBaseline="middle"
                style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
              >
                {wheelSpec}
              </text>
            </>
          )}

          <line
            x1={overallX}
            y1={tireTop + inset}
            x2={overallX}
            y2={groundY - inset}
            stroke={OVERALL_COLOR}
            strokeWidth="2.5"
            markerStart={`url(#${overallMarker})`}
            markerEnd={`url(#${overallMarker})`}
          />
          <line
            x1={tireRight - 2}
            y1={tireTop}
            x2={overallX}
            y2={tireTop}
            stroke={OVERALL_COLOR}
            strokeWidth="1.25"
            strokeDasharray="4 3"
            opacity="0.85"
          />
          <line
            x1={tireRight - 2}
            y1={groundY}
            x2={overallX}
            y2={groundY}
            stroke={OVERALL_COLOR}
            strokeWidth="1.25"
            strokeDasharray="4 3"
            opacity="0.85"
          />
          <text
            x={overallLabelX}
            y={overallMidY}
            fill={OVERALL_COLOR}
            fontSize="11"
            fontWeight="700"
            textAnchor="start"
            dominantBaseline="middle"
            style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
          >
            {overallSpec}
          </text>
        </svg>
      </div>

      <dl className="dia-target-visual__stats">
        <div className="dia-target-visual__stat dia-target-visual__stat--overall">
          <dt>Overall Diameter</dt>
          <dd>{formatDisplayDiameter(targetDiameterIn, diameterUnit)}</dd>
        </div>
        <div className="dia-target-visual__stat dia-target-visual__stat--wheel">
          <dt>Wheel Diameter</dt>
          <dd>{isAnyWheel ? 'Any' : `${wheelLabel} in`}</dd>
        </div>
        <div className="dia-target-visual__stat dia-target-visual__stat--tol">
          <dt>Tolerance Range</dt>
          <dd>
            {diameterUnit === 'metric'
              ? `${Math.round(valueFromInches(low, 'metric') * 10) / 10}–${
                  Math.round(valueFromInches(high, 'metric') * 10) / 10
                } mm`
              : `${low.toFixed(1)}–${high.toFixed(1)} in`}
            <span className="dia-target-visual__tol-chip">
              {' '}
              ({formatToleranceLabel(toleranceIn, diameterUnit)})
            </span>
          </dd>
        </div>
      </dl>

      <p className="dia-target-visual__note">
        <span className="dia-target-visual__info" aria-hidden="true">
          i
        </span>
        {isAnyWheel
          ? 'Searches indexed production sizes across all wheel diameters within the selected range.'
          : 'Searches indexed production sizes within the selected range.'}
      </p>
    </div>
  );
}
