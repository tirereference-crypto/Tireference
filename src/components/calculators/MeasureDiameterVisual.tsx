import { useId } from 'react';

const TIRE_FRONT_SRC = '/images/tire-front.webp';
const TIRE_ASPECT = 842 / 307;
const ARROW_COLOR = '#5b4fe6';

const VIEW_W = 200;
const VIEW_H = 300;

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 Z" fill={color} />
    </marker>
  );
}

export function MeasureDiameterVisual() {
  const uid = useId().replace(/:/g, '');
  const markerId = `dia-measure-arrow-${uid}`;

  const groundY = 268;
  const tireW = 88;
  const tireH = tireW * TIRE_ASPECT;
  const tireLeft = 8;
  const tireTop = groundY - tireH;
  const tireRight = tireLeft + tireW;
  const arrowX = tireRight + 16;
  const diamInset = 8;

  const pctX = (v: number) => `${(v / VIEW_W) * 100}%`;
  const pctY = (v: number) => `${(v / VIEW_H) * 100}%`;

  return (
    <div className="dia-measure-visual" aria-hidden="true">
      <div className="dia-measure-visual__canvas">
        <div
          className="dia-measure-visual__tire dia-measure-visual__tire--front"
          style={{
            left: pctX(tireLeft),
            top: pctY(tireTop),
            width: pctX(tireW),
            height: pctY(tireH),
          }}
        >
          <img src={TIRE_FRONT_SRC} alt="" decoding="async" />
        </div>

        <svg
          className="dia-measure-visual__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <ArrowHead id={markerId} color={ARROW_COLOR} />
          </defs>

          <line x1="4" y1={groundY} x2={VIEW_W - 4} y2={groundY} stroke="#cbd5e1" strokeWidth="1.5" />

          <line x1="4" y1={tireTop} x2={arrowX - 6} y2={tireTop} stroke={ARROW_COLOR} strokeWidth="2" strokeDasharray="5 4" />
          <line x1="4" y1={groundY} x2={arrowX - 6} y2={groundY} stroke={ARROW_COLOR} strokeWidth="2" strokeDasharray="5 4" />

          <line x1={arrowX} y1={tireTop} x2={tireRight} y2={tireTop} stroke={ARROW_COLOR} strokeWidth="1.25" strokeDasharray="3 3" opacity="0.7" />
          <line x1={arrowX} y1={groundY} x2={tireRight} y2={groundY} stroke={ARROW_COLOR} strokeWidth="1.25" strokeDasharray="3 3" opacity="0.7" />

          <line
            x1={arrowX}
            y1={tireTop + diamInset}
            x2={arrowX}
            y2={groundY - diamInset}
            stroke={ARROW_COLOR}
            strokeWidth="2.5"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
        </svg>

        <div className="dia-measure-visual__dim-label">
          <span className="dia-measure-visual__dim-label-text">Overall</span>
          <span className="dia-measure-visual__dim-label-text">diameter</span>
        </div>
      </div>
    </div>
  );
}
