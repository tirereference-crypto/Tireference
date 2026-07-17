import { useLayoutEffect, useRef, useState } from 'react';
import type { WheelOffsetComparison } from '../../lib/wheel-offset-math';
import { backspacingInches, outboardPositionMm } from '../../lib/wheel-offset-math';
import {
  buildDiagramAriaDescription,
  formatInnerChangePrimary,
  formatOuterChangePrimary,
  formatTrackWidthPrimary,
  formatTrackWidthSecondary,
} from '../../lib/wheel-offset-display';

const REFERENCE_IMAGE = '/images/wheels/wheel-offset-suspension-reference.png?v=11';

const IMG_W = 608;
const IMG_H = 622;
const IMG_TOP = 48;
const VIEW_H = IMG_TOP + IMG_H;
/** Wheel image scale pivot — unchanged so renders stay put. */
const SCALE_PIVOT_PX = 515;
const REF_SPEC = { widthIn: 8, offsetMm: 35 };

/** Leftmost grey suspension reference line in reference artwork (image px) */
const SUSPENSION_PX = 202;

/** Rightmost tire bulge in reference art (image px). */
const TIRE_VISUAL_OUTER_PX = 578;
/** Minimum clearance from tire bulge — matches the right-panel outer rim look. */
const OUTER_RIM_MIN_GAP_PX = 52;

/** Reference landmarks calibrated to the artwork (8" +35 reference).
 *  Inner lip just outside the tire art (left); outer lip baseline for offset math. */
const REF_INNER_PX = 248;
const REF_OUTER_PX = 590;
const FENDER_PX = 682;

/** Fixed vehicle hub mounting face in reference artwork (image px). */
const MOUNTING_PX = 360;

/** px/mm derived from full wheel width in the reference art (inner → outer lip). */
const PX_PER_MM = (REF_OUTER_PX - REF_INNER_PX) / (REF_SPEC.widthIn * 25.4);
const TIRE_SCALE = 0.8;
const LEFT_PANEL_SCALE = TIRE_SCALE * 1.2;
/** Extra viewBox width so scaled fender line (~609px) is not clipped */
const VIEW_PAD_RIGHT = 52;
/** Shift left (current) panel tire, lines, and tags leftward */
const LEFT_PANEL_SHIFT_X = -100;
/** Keep ~half the empty margin on the left of the tire art */
const LEFT_PANEL_GAP_PX = 54;
const IMG_CY = IMG_TOP + IMG_H / 2;
/** Longest (grey suspension) line span in reference image pixels */
const LINE_IMG_Y1 = 6;
const LINE_IMG_Y2 = 591;
/** Shared SVG y-bounds — matches longest grey line after IMG_TOP offset */
const LINE_Y1 = IMG_TOP + LINE_IMG_Y1;
const LINE_Y2 = IMG_TOP + LINE_IMG_Y2;
/** Hide baked offset arrows in reference image (keeps dynamic SVG arrow only) */
const IMG_CLIP_BOTTOM = 80;
/** Blue track-width callout row — stays at the diagram baseline */
const TRACK_CALLOUT_Y = IMG_TOP + IMG_H - 52;
/** Orange offset arrow + label — midway between track callout and prior top position */
const OFFSET_ARROW_Y = IMG_TOP + IMG_H - 80;
const OFFSET_LABEL_Y = OFFSET_ARROW_Y + 16;

const LINE_COLORS = {
  suspension: '#94a3b8',
  inner: '#22c55e',
  hub: '#ef4444',
  center: '#2563eb',
  outer: '#9333ea',
  fender: '#f97316',
} as const;

function scalePanelX(x: number, tireScale: number): number {
  return SCALE_PIVOT_PX + (x - SCALE_PIVOT_PX) * tireScale;
}

function scaledImgLeftX(tireScale: number): number {
  return scalePanelX(0, tireScale);
}

interface PanelGeom {
  innerX: number;
  centerlineX: number;
  mountingX: number;
  outerX: number;
  fenderX: number;
}

function panelViewBox(
  spec: { widthIn: number; offsetMm: number },
  tireScale: number,
  shiftX: number,
): { viewMinX: number; viewWidth: number } {
  const g = panelGeom(spec);
  const contentLeftX = scaledImgLeftX(tireScale) + shiftX;
  const viewMinX = shiftX < 0 ? contentLeftX - LEFT_PANEL_GAP_PX : 0;
  const fenderRightX = scalePanelX(g.fenderX, tireScale) + shiftX + 14;
  const viewWidth = Math.max(IMG_W + VIEW_PAD_RIGHT - viewMinX, fenderRightX - viewMinX);
  return { viewMinX, viewWidth };
}

function panelSvgXToClientX(
  svgX: number,
  panelRect: DOMRect,
  spec: { widthIn: number; offsetMm: number },
  tireScale: number,
  shiftX: number,
): number {
  const { viewMinX, viewWidth } = panelViewBox(spec, tireScale, shiftX);
  const scaledSvgX = scalePanelX(svgX, tireScale) + shiftX;
  return panelRect.left + ((scaledSvgX - viewMinX) / viewWidth) * panelRect.width;
}

function panelGeom(spec: { widthIn: number; offsetMm: number }): PanelGeom {
  const refBackMm = backspacingInches(REF_SPEC.widthIn, REF_SPEC.offsetMm) * 25.4;
  const refOutMm = outboardPositionMm(REF_SPEC.widthIn, REF_SPEC.offsetMm);
  const backMm = backspacingInches(spec.widthIn, spec.offsetMm) * 25.4;
  const outMm = outboardPositionMm(spec.widthIn, spec.offsetMm);

  const innerX = REF_INNER_PX - (backMm - refBackMm) * PX_PER_MM;
  const outerX = Math.max(
    REF_OUTER_PX + (outMm - refOutMm) * PX_PER_MM,
    TIRE_VISUAL_OUTER_PX + OUTER_RIM_MIN_GAP_PX,
  );
  const mountingX = MOUNTING_PX;

  return {
    innerX,
    centerlineX: (mountingX + outerX) / 2,
    mountingX,
    outerX,
    fenderX: FENDER_PX,
  };
}

interface LineTag {
  key: string;
  x: number;
  label: string;
  color: string;
}

const LINE_TAGS: Omit<LineTag, 'x'>[] = [
  { key: 'inner', label: 'Inner Rim', color: LINE_COLORS.inner },
  { key: 'centerline', label: 'Wheel Centerline', color: LINE_COLORS.hub },
  { key: 'mounting', label: 'Mounting Surface', color: LINE_COLORS.center },
  { key: 'outer', label: 'Outer Rim', color: LINE_COLORS.outer },
  { key: 'fender', label: 'Fender', color: LINE_COLORS.fender },
];

function RefLine({
  x,
  color,
  dashed,
  weight = 1.5,
}: {
  x: number;
  color: string;
  dashed?: boolean;
  weight?: number;
}) {
  return (
    <line
      x1={x}
      y1={LINE_Y1}
      x2={x}
      y2={LINE_Y2}
      stroke={color}
      strokeWidth={weight}
      strokeDasharray={dashed ? '6 4' : undefined}
    />
  );
}

/** Mounting surface (vehicle hub face) — drawn after tire art, no background fill */
function MountingSurfaceLine({ x }: { x: number }) {
  return (
    <line
      x1={x}
      y1={LINE_Y1}
      x2={x}
      y2={LINE_Y2}
      stroke={LINE_COLORS.center}
      strokeWidth={1.75}
      strokeDasharray="7 5"
      strokeLinecap="butt"
    />
  );
}

function layoutTagY(key: string, geom: PanelGeom, tireScale: number): number {
  const close = (a: number, b: number, px: number) =>
    Math.abs(scalePanelX(a, tireScale) - scalePanelX(b, tireScale)) < px;
  if (key === 'mounting' && close(geom.mountingX, geom.centerlineX, 95)) return 32;
  if (key === 'centerline' && close(geom.mountingX, geom.centerlineX, 95)) return 14;
  if (key === 'fender' && close(geom.fenderX, geom.outerX, 30)) return 32;
  if (key === 'outer' && close(geom.fenderX, geom.outerX, 30)) return 14;
  return 14;
}

/** Horizontal nudge when outer rim and fender tags sit on nearby lines. */
function layoutTagX(key: string, x: number, geom: PanelGeom, tireScale: number): number {
  const close = (a: number, b: number, px: number) =>
    Math.abs(scalePanelX(a, tireScale) - scalePanelX(b, tireScale)) < px;
  if (key === 'outer' && close(geom.fenderX, geom.outerX, 30)) return x - 28;
  if (key === 'fender' && close(geom.fenderX, geom.outerX, 30)) return x + 28;
  return x;
}

function WheelPanel({
  spec,
  uid,
  shiftX = 0,
  tireScale = TIRE_SCALE,
  offsetMm,
  panelRef,
}: {
  spec: { widthIn: number; diameterIn: number; offsetMm: number };
  uid: string;
  shiftX?: number;
  tireScale?: number;
  /** Override offset label only (e.g. new setup value on mirrored panel) */
  offsetMm?: number;
  panelRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const g = panelGeom(spec);
  const xByKey: Record<string, number> = {
    inner: g.innerX,
    centerline: g.centerlineX,
    mounting: g.mountingX,
    outer: g.outerX,
    fender: g.fenderX,
  };
  const labelOffset = offsetMm ?? spec.offsetMm;
  const offsetLabel = `${labelOffset >= 0 ? '+' : ''}${labelOffset}mm Offset`;

  const { viewMinX, viewWidth } = panelViewBox(spec, tireScale, shiftX);

  return (
    <div ref={panelRef} className="wof-fitment-viz__wheel-panel">
      <svg
        className="wof-fitment-viz__wheel-svg"
        viewBox={`${viewMinX} 0 ${viewWidth} ${VIEW_H}`}
        role="img"
        aria-label="Wheel position diagram"
      >
        <defs>
          <clipPath id={`img-clip-${uid}`}>
            <rect x={0} y={IMG_TOP} width={IMG_W} height={IMG_H - IMG_CLIP_BOTTOM} />
          </clipPath>
          <marker id={`arrowOrangeStart-${uid}`} markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
            <path d="M7,0 L0,3.5 L7,7 Z" fill={LINE_COLORS.fender} />
          </marker>
          <marker id={`arrowOrangeEnd-${uid}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={LINE_COLORS.fender} />
          </marker>
        </defs>

        <g transform={`translate(${shiftX}, 0)`}>
          <g
            transform={`translate(${SCALE_PIVOT_PX} ${IMG_CY}) scale(${tireScale}) translate(${-SCALE_PIVOT_PX} ${-IMG_CY})`}
          >
            <image
              href={REFERENCE_IMAGE}
              x={0}
              y={IMG_TOP}
              width={IMG_W}
              height={IMG_H}
              clipPath={`url(#img-clip-${uid})`}
            />

            <RefLine x={g.innerX} color={LINE_COLORS.inner} dashed />
            <RefLine x={g.centerlineX} color={LINE_COLORS.hub} weight={2.5} />
            <RefLine x={g.outerX} color={LINE_COLORS.outer} dashed />
            <RefLine x={g.fenderX} color={LINE_COLORS.fender} dashed weight={2} />
            <MountingSurfaceLine x={g.mountingX} />

            <line
              x1={g.mountingX}
              y1={OFFSET_ARROW_Y}
              x2={g.centerlineX}
              y2={OFFSET_ARROW_Y}
              stroke={LINE_COLORS.fender}
              strokeWidth="2"
              markerStart={`url(#arrowOrangeStart-${uid})`}
              markerEnd={`url(#arrowOrangeEnd-${uid})`}
            />
            <text
              x={(g.mountingX + g.centerlineX) / 2}
              y={OFFSET_LABEL_Y}
              textAnchor="middle"
              className="wof-fitment-viz__offset-label"
            >
              {offsetLabel}
            </text>
          </g>

          {LINE_TAGS.map((tag) => (
            <text
              key={tag.key}
              x={layoutTagX(tag.key, scalePanelX(xByKey[tag.key], tireScale), g, tireScale)}
              y={layoutTagY(tag.key, g, tireScale)}
              textAnchor="middle"
              className="wof-fitment-viz__line-tag"
              fill={tag.color}
            >
              {tag.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

function specLabel(widthIn: number, diameterIn: number, offsetMm: number): string {
  return `${diameterIn}x${widthIn} ${offsetMm >= 0 ? '+' : ''}${offsetMm}`;
}

interface WheelOffsetFitmentVisualProps {
  comparison: WheelOffsetComparison;
}

function innerClearanceSubtext(mm: number): string {
  if (Math.abs(mm) < 0.05) return 'Suspension-side position unchanged';
  return 'Suspension-side rim lip';
}

function outerPositionSubtext(mm: number): string {
  if (Math.abs(mm) < 0.05) return 'Fender-side position unchanged';
  return 'Fender-side rim lip';
}

function trackWidthSubtext(mm: number): string {
  return formatTrackWidthSecondary(mm);
}

function isDiagramStacked(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

function CalloutArrowLeft({
  calloutRef,
  panelRef,
  targetSvgX,
  spec,
  color,
  markerId,
  headInsetRatio = 0.02,
}: {
  calloutRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  targetSvgX: number;
  spec: { widthIn: number; offsetMm: number };
  color: string;
  markerId: string;
  /** Shorten line from arrowhead end (fraction of total length). */
  headInsetRatio?: number;
}) {
  const [length, setLength] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const callout = calloutRef.current;
      const panel = panelRef.current;
      if (!callout || !panel || isDiagramStacked()) {
        setLength(0);
        return;
      }
      const calloutRect = callout.getBoundingClientRect();
      const targetX = panelSvgXToClientX(
        targetSvgX,
        panel.getBoundingClientRect(),
        spec,
        LEFT_PANEL_SCALE,
        LEFT_PANEL_SHIFT_X,
      );
      setLength(Math.max(0, calloutRect.left - targetX));
    };

    update();
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    if (calloutRef.current) ro.observe(calloutRef.current);
    if (panelRef.current) ro.observe(panelRef.current);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [calloutRef, panelRef, targetSvgX, spec]);

  if (length < 2) return null;

  const headX = length * headInsetRatio;

  return (
    <svg
      className="wof-fitment-viz__callout-arrow wof-fitment-viz__callout-arrow--left"
      width={length}
      height={12}
      aria-hidden="true"
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={length}
        y1={6}
        x2={headX}
        y2={6}
        stroke={color}
        strokeWidth="2.5"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
}

function CalloutArrowRight({
  calloutRef,
  panelRef,
  targetSvgX,
  spec,
  color,
  markerId,
  headInsetRatio = 0.12,
}: {
  calloutRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  targetSvgX: number;
  spec: { widthIn: number; offsetMm: number };
  color: string;
  markerId: string;
  /** Shorten line from arrowhead end (fraction of total length). */
  headInsetRatio?: number;
}) {
  const [length, setLength] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const callout = calloutRef.current;
      const panel = panelRef.current;
      if (!callout || !panel || isDiagramStacked()) {
        setLength(0);
        return;
      }
      const calloutRect = callout.getBoundingClientRect();
      const targetX = panelSvgXToClientX(
        targetSvgX,
        panel.getBoundingClientRect(),
        spec,
        LEFT_PANEL_SCALE,
        LEFT_PANEL_SHIFT_X,
      );
      setLength(Math.max(0, targetX - calloutRect.right));
    };

    update();
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    if (calloutRef.current) ro.observe(calloutRef.current);
    if (panelRef.current) ro.observe(panelRef.current);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [calloutRef, panelRef, targetSvgX, spec]);

  if (length < 2) return null;

  const headX = length * (1 - headInsetRatio);

  return (
    <svg
      className="wof-fitment-viz__callout-arrow wof-fitment-viz__callout-arrow--right"
      width={length}
      height={12}
      aria-hidden="true"
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={0}
        y1={6}
        x2={headX}
        y2={6}
        stroke={color}
        strokeWidth="2.5"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
}

function TrackCalloutSlot({
  wrapRef,
  calloutsColRef,
  panelRef,
  children,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  calloutsColRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const [stacked, setStacked] = useState(false);
  const [layout, setLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const stackedNow = isDiagramStacked();
      setStacked(stackedNow);
      if (stackedNow) {
        setLayout(null);
        return;
      }

      const wrap = wrapRef.current;
      const col = calloutsColRef.current;
      const panel = panelRef.current;
      if (!wrap || !col || !panel) {
        setLayout(null);
        return;
      }

      const wrapRect = wrap.getBoundingClientRect();
      const colRect = col.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const offsetArrowY = panelRect.top + (TRACK_CALLOUT_Y / VIEW_H) * panelRect.height;

      setLayout({
        top: offsetArrowY - wrapRect.top,
        left: colRect.left - wrapRect.left,
        width: colRect.width,
      });
    };

    update();
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    for (const node of [wrapRef.current, calloutsColRef.current, panelRef.current]) {
      if (node) ro.observe(node);
    }
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [wrapRef, calloutsColRef, panelRef]);

  if (stacked) {
    return <div className="wof-fitment-viz__callout-slot--track-inflow">{children}</div>;
  }

  if (!layout) return null;

  return (
    <div
      className="wof-fitment-viz__callout-slot--track"
      style={{
        top: layout.top,
        left: layout.left,
        width: layout.width,
      }}
    >
      {children}
    </div>
  );
}

function HtmlCallout({
  value,
  label,
  sub,
  tone,
  calloutRef,
}: {
  value: string;
  label: string;
  sub: string;
  tone: 'inner' | 'outer' | 'track';
  calloutRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={calloutRef}
      className={`wof-fitment-viz__callout wof-fitment-viz__callout--${tone}`}
    >
      <div className="wof-fitment-viz__callout-value">{value}</div>
      <div className="wof-fitment-viz__callout-label">{label}</div>
      <div className="wof-fitment-viz__callout-sub">{sub}</div>
    </div>
  );
}

const REFERENCE_LINES = [
  { color: LINE_COLORS.suspension, dashed: true, label: 'Suspension', desc: 'Suspension and brake components' },
  { color: LINE_COLORS.inner, dashed: true, label: 'Inner Rim (Closest Point)', desc: 'Closest point between wheel and suspension' },
  {
    color: LINE_COLORS.center,
    dashed: true,
    label: 'Mounting Surface (Vehicle Hub)',
    desc: 'Where the wheel bolts to the vehicle hub (does not move)',
  },
  {
    color: LINE_COLORS.hub,
    dashed: false,
    label: 'Wheel Centerline',
    desc: 'Centerline of the wheel. Offset is measured from mounting surface to this line.',
  },
  { color: LINE_COLORS.outer, dashed: true, label: 'Outer Rim (Outer Lip)', desc: 'Furthest outer point of the wheel' },
  { color: LINE_COLORS.fender, dashed: true, label: 'Fender', desc: 'Fender/body clearance' },
];

export function WheelOffsetFitmentVisual({ comparison }: WheelOffsetFitmentVisualProps) {
  const { current, newSetup, innerClearanceChangeMm, outerPositionChangeMm, trackWidthChangeMm } =
    comparison;

  const trackLabel = 'Estimated track-width change';
  const diagramDescription = buildDiagramAriaDescription(comparison);

  const innerCalloutRef = useRef<HTMLDivElement>(null);
  const outerCalloutRef = useRef<HTMLDivElement>(null);
  const trackCalloutRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const diagramWrapRef = useRef<HTMLDivElement>(null);
  const calloutsColRef = useRef<HTMLDivElement>(null);
  const panelGeomCurrent = panelGeom(current);
  const panelGeomNew = panelGeom(newSetup);

  return (
    <div className="wof-fitment-viz">
      <h3 className="wof-fitment-viz__title">Wheel Position Comparison</h3>
      <p className="wof-fitment-viz__subtitle">
        See how the new wheel moves relative to your current wheel. Actual vehicle clearance is not
        measured.
      </p>

      <div className="wof-fitment-viz__setups-row">
        <div className="wof-fitment-viz__setup-meta wof-fitment-viz__setup-meta--current">
          <span className="wof-fitment-viz__setup-name">Current wheel</span>
          <span className="wof-fitment-viz__setup-spec">
            {specLabel(current.widthIn, current.diameterIn, current.offsetMm)}
          </span>
        </div>
        <div className="wof-fitment-viz__setup-meta wof-fitment-viz__setup-meta--new">
          <span className="wof-fitment-viz__setup-name">New wheel</span>
          <span className="wof-fitment-viz__setup-spec">
            {specLabel(newSetup.widthIn, newSetup.diameterIn, newSetup.offsetMm)}
          </span>
        </div>
      </div>

      <p className="wof-fitment-viz__offset-brief">
        Positive offset moves the mounting face toward the wheel’s outer face; negative offset moves
        it toward the suspension side.
      </p>

      <div
        ref={diagramWrapRef}
        className="wof-fitment-viz__diagram-wrap"
        role="img"
        aria-label={diagramDescription}
      >
        <WheelPanel
          spec={current}
          uid="current"
          shiftX={LEFT_PANEL_SHIFT_X}
          tireScale={LEFT_PANEL_SCALE}
          panelRef={leftPanelRef}
        />

        <div ref={calloutsColRef} className="wof-fitment-viz__callouts-col">
          <div className="wof-fitment-viz__callout-row">
            <HtmlCallout
              calloutRef={innerCalloutRef}
              value={formatInnerChangePrimary(innerClearanceChangeMm)}
              label="Inner position change"
              sub={innerClearanceSubtext(innerClearanceChangeMm)}
              tone="inner"
            />
            <CalloutArrowLeft
              calloutRef={innerCalloutRef}
              panelRef={leftPanelRef}
              targetSvgX={panelGeomCurrent.innerX}
              spec={current}
              color="#15803d"
              markerId="wof-inner-clearance-arrow-head"
            />
          </div>
          <div className="wof-fitment-viz__callout-row">
            <HtmlCallout
              calloutRef={outerCalloutRef}
              value={formatOuterChangePrimary(outerPositionChangeMm)}
              label="Outer position change"
              sub={outerPositionSubtext(outerPositionChangeMm)}
              tone="outer"
            />
            <CalloutArrowRight
              calloutRef={outerCalloutRef}
              panelRef={rightPanelRef}
              targetSvgX={panelGeomNew.outerX}
              spec={newSetup}
              color="#7e22ce"
              markerId="wof-outer-position-arrow-head"
            />
          </div>
          <div className="wof-fitment-viz__callout-spacer" aria-hidden="true" />
          <TrackCalloutSlot
            wrapRef={diagramWrapRef}
            calloutsColRef={calloutsColRef}
            panelRef={leftPanelRef}
          >
            <div className="wof-fitment-viz__callout-row">
              <HtmlCallout
                calloutRef={trackCalloutRef}
                value={formatTrackWidthPrimary(trackWidthChangeMm)}
                label={trackLabel}
                sub={trackWidthSubtext(trackWidthChangeMm)}
                tone="track"
              />
              <CalloutArrowLeft
                calloutRef={trackCalloutRef}
                panelRef={leftPanelRef}
                targetSvgX={panelGeomCurrent.centerlineX}
                spec={current}
                color="#1d4ed8"
                markerId="wof-track-width-arrow-left-head"
                headInsetRatio={0.02}
              />
              <CalloutArrowRight
                calloutRef={trackCalloutRef}
                panelRef={rightPanelRef}
                targetSvgX={panelGeomNew.centerlineX}
                spec={newSetup}
                color="#1d4ed8"
                markerId="wof-track-width-arrow-right-head"
                headInsetRatio={0.02}
              />
            </div>
          </TrackCalloutSlot>
        </div>

        <WheelPanel
          spec={newSetup}
          uid="new"
          shiftX={LEFT_PANEL_SHIFT_X}
          tireScale={LEFT_PANEL_SCALE}
          panelRef={rightPanelRef}
        />
      </div>

      <details className="wof-fitment-viz__diagram-accordion">
        <summary>Understanding the diagram</summary>
        <div className="wof-fitment-viz__diagram-accordion-body">
          <p className="wof-fitment-viz__diagram-accordion-lead">
            Left diagram is the <strong>current wheel</strong>; right is the <strong>new wheel</strong>.
            Suspension side is inward; fender side is outward.
          </p>

          <h4 className="wof-fitment-viz__legend-title">Key reference lines</h4>
          <ul className="wof-fitment-viz__legend-list">
            {REFERENCE_LINES.map((line) => (
              <li key={line.label} className="wof-fitment-viz__legend-item">
                <span
                  className={`wof-fitment-viz__legend-vline${line.dashed ? ' wof-fitment-viz__legend-vline--dashed' : ''}`}
                  style={{ borderColor: line.color }}
                  aria-hidden="true"
                />
                <span className="wof-fitment-viz__legend-body">
                  <strong style={{ color: line.color }}>{line.label}</strong>
                  <span className="wof-fitment-viz__legend-desc">{line.desc}</span>
                </span>
              </li>
            ))}
          </ul>

          <h4>How to read inward and outward movement</h4>
          <ul>
            <li>
              <strong>Inner position</strong> compares how close the inner rim lip sits to suspension
              and brake components.
            </li>
            <li>
              <strong>Outer position</strong> compares how far the outer lip extends toward the fender
              and tire sidewall.
            </li>
            <li>
              <strong>Estimated track-width change</strong> is twice the per-wheel outer-position
              change when the same setup is used on both sides.
            </li>
          </ul>

          <h4>What this diagram does not evaluate</h4>
          <ul>
            <li>Vehicle-specific suspension, brake, and steering clearance</li>
            <li>Fender, tire, and bodywork clearance at ride height</li>
            <li>Camber, toe, and alignment settings</li>
          </ul>

          <p className="wof-fitment-viz__diagram-disclaimer">
            Results describe relative wheel position only. Measure actual clearances on your vehicle
            before purchasing wheels or tires.
          </p>
        </div>
      </details>
    </div>
  );
}

const OFFSET_EXPLAINER_COLORS = {
  positive: '#1f8a4c',
  zero: '#2563eb',
  negative: '#b45309',
} as const;

const OFFSET_EXPLAINER_TYPES = [
  {
    key: 'positive',
    title: 'POSITIVE OFFSET',
    color: OFFSET_EXPLAINER_COLORS.positive,
    description:
      'The mounting face sits farther toward the outside face of the wheel and usually moves the wheel inward relative to a wheel of the same width.',
    points: [
      'Common on modern cars, crossovers, and many OEM truck wheels.',
      'Higher positive offset typically increases inner packaging toward the suspension on the same width.',
      'Width and offset must still be evaluated together.',
    ],
  },
  {
    key: 'zero',
    title: 'ZERO OFFSET',
    color: OFFSET_EXPLAINER_COLORS.zero,
    description:
      'The mounting face aligns with the wheel centerline. Backspacing equals half the nominal wheel width.',
    points: [
      'Useful baseline when comparing positive and negative setups.',
      'Neither tucks nor pushes the wheel relative to the rim centerline alone.',
      'A wider zero-offset wheel still moves both lips outward from center.',
    ],
  },
  {
    key: 'negative',
    title: 'NEGATIVE OFFSET',
    color: OFFSET_EXPLAINER_COLORS.negative,
    description:
      'The mounting face sits toward the suspension side of the centerline and usually moves the wheel outward relative to a wheel of the same width.',
    points: [
      'Often used when a wider stance is desired.',
      'Outer lip movement depends on both offset and width.',
      'Confirm fender and tire clearance on the vehicle — this page does not measure them.',
    ],
  },
] as const;

export function WheelOffsetTypesExplainer() {
  return (
    <div className="wof-offset-types">
      <h2 className="wof-offset-types__title">How Wheel Offset Changes Wheel Position</h2>
      <p className="wof-offset-types__intro">
        Wheel width and offset must be evaluated together. An offset change of 0 mm can still create a
        major position change when the new wheel is wider.
      </p>
      <div className="wof-offset-types__grid">
        {OFFSET_EXPLAINER_TYPES.map((type) => (
          <article key={type.key} className={`wof-offset-types__col wof-offset-types__col--${type.key}`}>
            <h3 className="wof-offset-types__heading" style={{ color: type.color }}>
              {type.title}
            </h3>
            <p className="wof-offset-types__desc">{type.description}</p>
            <ul className="wof-offset-types__points">
              {type.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
