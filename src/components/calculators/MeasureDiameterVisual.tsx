import { useId } from 'react';

/** Native tire-front.webp is 307×842 (portrait). */
const TIRE_FRONT_SRC = '/images/tire-front.webp';
const TIRE_ASPECT_H_OVER_W = 842 / 307;
const ARROW_COLOR = '#5b4fe6';

const VIEW_W = 220;
const VIEW_H = 300;

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 Z" fill={color} />
    </marker>
  );
}

/**
 * How-to-measure illustration. Geometry is kept fully inside the view box
 * with top/side padding so parent overflow clipping cannot create a stray edge.
 */
export function MeasureDiameterVisual() {
  const uid = useId().replace(/:/g, '');
  const markerId = `dia-measure-arrow-${uid}`;

  const groundY = 278;
  const topPad = 18;
  const tireW = 72;
  const tireH = tireW * TIRE_ASPECT_H_OVER_W;
  // Fit tire between topPad and ground with a little breathing room.
  const maxTireH = groundY - topPad - 4;
  const scale = Math.min(1, maxTireH / tireH);
  const drawW = tireW * scale;
  const drawH = tireH * scale;
  const tireLeft = 18;
  const tireTop = groundY - drawH;
  const tireRight = tireLeft + drawW;
  const arrowX = tireRight + 22;
  const diamInset = 10;

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
            width: pctX(drawW),
            height: pctY(drawH),
          }}
        >
          <img src={TIRE_FRONT_SRC} alt="" decoding="async" width={307} height={842} />
        </div>

        <svg
          className="dia-measure-visual__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <ArrowHead id={markerId} color={ARROW_COLOR} />
          </defs>

          <line
            x1="10"
            y1={groundY}
            x2={VIEW_W - 10}
            y2={groundY}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          <line
            x1="12"
            y1={tireTop}
            x2={arrowX - 8}
            y2={tireTop}
            stroke={ARROW_COLOR}
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <line
            x1="12"
            y1={groundY}
            x2={arrowX - 8}
            y2={groundY}
            stroke={ARROW_COLOR}
            strokeWidth="2"
            strokeDasharray="5 4"
          />

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

        <div
          className="dia-measure-visual__dim-label"
          style={{
            left: pctX(arrowX + 8),
            top: pctY((tireTop + groundY) / 2),
          }}
        >
          <span className="dia-measure-visual__dim-label-text">Overall</span>
          <span className="dia-measure-visual__dim-label-text">diameter</span>
        </div>
      </div>
    </div>
  );
}
