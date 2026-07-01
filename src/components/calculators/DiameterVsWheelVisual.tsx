import { useId } from 'react';

const TIRE_SIDE_VIEW_SRC = '/images/tires/tire-flat-side-view.png';
const WHEEL_RIM_SIDE_VIEW_SRC = '/images/tires/wheel-rim-side-view.png?v=3';

const WHEEL_COLOR = '#475569';
const TIRE_COLOR = '#5b4fe6';
const GROUND_COLOR = '#cbd5e1';

interface DiameterVsWheelVisualProps {
  wheelDiameterIn: number;
  overallDiameterIn: number;
  exampleSize: string;
}

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 Z" fill={color} />
    </marker>
  );
}

function formatInches(value: number, decimals = 2): string {
  const rounded = decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  return `${rounded}"`;
}

export function DiameterVsWheelVisual({
  wheelDiameterIn,
  overallDiameterIn,
  exampleSize,
}: DiameterVsWheelVisualProps) {
  const uid = useId().replace(/:/g, '');
  const wheelMarker = `dia-wheel-arrow-${uid}`;
  const tireMarker = `dia-tire-arrow-${uid}`;

  const groundY = 248;
  const leftCx = 188;
  const rightCx = 532;
  const centerX = 360;
  const diamInset = 7;

  const pxPerIn = 178 / overallDiameterIn;
  const dTire = overallDiameterIn * pxPerIn;
  const dWheel = wheelDiameterIn * pxPerIn;
  const rTire = dTire / 2;
  const rWheel = dWheel / 2;
  const topTire = groundY - dTire;
  const topWheel = groundY - dWheel;
  const cyTire = groundY - rTire;
  const cyWheel = groundY - rWheel;

  const diamDiff = overallDiameterIn - wheelDiameterIn;
  const diffGapPx = topWheel - topTire;
  const diffArrowH = Math.min(3.5, Math.max(1.2, diffGapPx * 0.2), (diffGapPx - 0.5) / 2);
  const diffArrowW = diffArrowH * 0.9;

  const pctX = (v: number) => `${(v / 720) * 100}%`;
  const pctY = (v: number) => `${(v / 300) * 100}%`;

  return (
    <>
      <div className="dia-visual-compare__canvas">
        <div className="dia-visual-compare__images">
        <div
          className="dia-visual-compare__image dia-visual-compare__image--wheel"
          style={{
            left: pctX(leftCx - rWheel),
            top: pctY(topWheel),
            width: pctX(dWheel),
            height: pctY(dWheel),
          }}
        >
          <img src={WHEEL_RIM_SIDE_VIEW_SRC} alt="" decoding="async" />
        </div>
        <div
          className="dia-visual-compare__image dia-visual-compare__image--tire"
          style={{
            left: pctX(rightCx - rTire),
            top: pctY(topTire),
            width: pctX(dTire),
            height: pctY(dTire),
          }}
        >
          <img src={TIRE_SIDE_VIEW_SRC} alt="" decoding="async" />
        </div>
      </div>

      <svg className="dia-visual-compare__svg" viewBox="0 0 720 300" preserveAspectRatio="xMidYMid meet">
        <defs>
          <ArrowHead id={wheelMarker} color={WHEEL_COLOR} />
          <ArrowHead id={tireMarker} color={TIRE_COLOR} />
        </defs>

        <line x1="28" y1={groundY} x2="692" y2={groundY} stroke={GROUND_COLOR} strokeWidth="1.5" />

        <line x1={centerX} y1="72" x2={centerX} y2={groundY} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 5" />

        <circle cx={leftCx} cy={cyWheel} r={rWheel + 3} fill="none" stroke={WHEEL_COLOR} strokeWidth="2" opacity="0.75" />
        <circle cx={rightCx} cy={cyTire} r={rTire + 3} fill="none" stroke={TIRE_COLOR} strokeWidth="2.5" opacity="0.85" />

        <line x1="52" y1={topWheel} x2={centerX - 8} y2={topWheel} stroke={WHEEL_COLOR} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
        <line x1={centerX + 8} y1={topTire} x2="668" y2={topTire} stroke={TIRE_COLOR} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />

        <line x1={leftCx} y1="58" x2={leftCx} y2={topWheel - 2} stroke={WHEEL_COLOR} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />
        <line x1={rightCx} y1="58" x2={rightCx} y2={topTire - 2} stroke={TIRE_COLOR} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />

        {diamDiff >= 0.01 && (
          <>
            <line
              x1={centerX}
              y1={topTire + diffArrowH}
              x2={centerX}
              y2={topWheel - diffArrowH - 2}
              stroke={TIRE_COLOR}
              strokeWidth="1.5"
            />
            <path
              d={`M ${centerX} ${topTire} L ${centerX - diffArrowW} ${topTire + diffArrowH} L ${centerX + diffArrowW} ${topTire + diffArrowH} Z`}
              fill={TIRE_COLOR}
            />
            <path
              d={`M ${centerX} ${topWheel - 2} L ${centerX - diffArrowW} ${topWheel - 2 - diffArrowH} L ${centerX + diffArrowW} ${topWheel - 2 - diffArrowH} Z`}
              fill={TIRE_COLOR}
            />
            <text
              x={centerX + 12}
              y={(topTire + topWheel) / 2 + 4}
              fill={TIRE_COLOR}
              fontSize="12"
              fontWeight="700"
              fontFamily="ui-monospace, monospace"
            >
              +{formatInches(diamDiff)}
            </text>
          </>
        )}

        <line x1={leftCx - rWheel - 24} y1={topWheel} x2={leftCx} y2={topWheel} stroke={WHEEL_COLOR} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line x1={leftCx - rWheel - 24} y1={groundY} x2={leftCx} y2={groundY} stroke={WHEEL_COLOR} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line
          x1={leftCx - rWheel - 24}
          y1={topWheel + diamInset}
          x2={leftCx - rWheel - 24}
          y2={groundY - diamInset}
          stroke={WHEEL_COLOR}
          strokeWidth="2"
          markerStart={`url(#${wheelMarker})`}
          markerEnd={`url(#${wheelMarker})`}
        />
        <text x={leftCx - rWheel - 32} y={cyWheel - 6} fill={WHEEL_COLOR} fontSize="10" fontWeight="600" textAnchor="end">
          Wheel
        </text>
        <text x={leftCx - rWheel - 32} y={cyWheel + 10} fill={WHEEL_COLOR} fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace" textAnchor="end">
          {formatInches(wheelDiameterIn, Number.isInteger(wheelDiameterIn) ? 0 : 1)}
        </text>

        <line x1={rightCx} y1={topTire} x2={rightCx + rTire + 24} y2={topTire} stroke={TIRE_COLOR} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line x1={rightCx} y1={groundY} x2={rightCx + rTire + 24} y2={groundY} stroke={TIRE_COLOR} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line
          x1={rightCx + rTire + 24}
          y1={topTire + diamInset}
          x2={rightCx + rTire + 24}
          y2={groundY - diamInset}
          stroke={TIRE_COLOR}
          strokeWidth="2"
          markerStart={`url(#${tireMarker})`}
          markerEnd={`url(#${tireMarker})`}
        />
        <text x={rightCx + rTire + 32} y={cyTire - 6} fill={TIRE_COLOR} fontSize="10" fontWeight="600">
          Overall
        </text>
        <text x={rightCx + rTire + 32} y={cyTire + 10} fill={TIRE_COLOR} fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
          {formatInches(overallDiameterIn)}
        </text>
      </svg>
      </div>

      <div className="dia-visual-compare__captions">
        <div className="dia-visual-compare__caption dia-visual-compare__caption--wheel">
          <p className="dia-visual-compare__caption-title">Wheel only</p>
          <p className="dia-visual-compare__caption-size">{wheelDiameterIn}&quot; rim</p>
        </div>
        <span className="dia-visual-compare__vs" aria-hidden="true">
          vs
        </span>
        <div className="dia-visual-compare__caption dia-visual-compare__caption--tire">
          <p className="dia-visual-compare__caption-title">{exampleSize}</p>
          <p className="dia-visual-compare__caption-size">{overallDiameterIn.toFixed(2)}&quot; overall</p>
        </div>
      </div>
    </>
  );
}
