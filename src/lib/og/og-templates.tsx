import type { CompareOgData, TireOgData } from './og-data';
import { fmtIn, fmtSignedMm, fmtSignedPct } from './og-data';

const BRAND = '#5b4fe6';
const BG = '#0f172a';
const PANEL = '#1e293b';
const TEXT = '#f8fafc';
const MUTED = '#94a3b8';
const BORDER = '#334155';

function BrandHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: BRAND,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: TEXT,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          TR
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: MUTED, fontSize: 20, fontWeight: 600 }}>{eyebrow}</span>
          <span style={{ color: TEXT, fontSize: 28, fontWeight: 700 }}>Tire Reference</span>
        </div>
      </div>
      <div style={{ color: TEXT, fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '18px 22px',
        borderRadius: 16,
        background: PANEL,
        border: `1px solid ${BORDER}`,
        flex: 1,
      }}
    >
      <span style={{ color: MUTED, fontSize: 18, fontWeight: 600 }}>{label}</span>
      <span style={{ color: TEXT, fontSize: 30, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function TireVisual({
  label,
  diameterIn,
  widthIn,
  accent,
}: {
  label: string;
  diameterIn: number;
  widthIn: number;
  accent: string;
}) {
  const tireHeight = Math.min(220, Math.max(120, diameterIn * 6.2));
  const tireWidth = Math.min(140, Math.max(70, widthIn * 10));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: 250,
        }}
      >
        <div
          style={{
            width: tireWidth,
            height: tireHeight,
            borderRadius: 18,
            border: `8px solid ${accent}`,
            background: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: Math.max(24, tireWidth * 0.45),
              height: Math.max(24, tireWidth * 0.45),
              borderRadius: 999,
              border: `4px solid ${BORDER}`,
              background: '#0b1220',
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ color: TEXT, fontSize: 28, fontWeight: 700 }}>{label}</span>
        <span style={{ color: MUTED, fontSize: 20 }}>{fmtIn(diameterIn)} overall</span>
      </div>
    </div>
  );
}

export function TireOgTemplate({ data }: { data: TireOgData }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${BG} 0%, #111827 55%, #1e1b4b 100%)`,
        padding: '48px 56px',
        fontFamily: 'Inter',
      }}
    >
      <BrandHeader eyebrow="Tire Size Specs" title={data.size} />

      <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 40, marginTop: 36 }}>
        <TireVisual label={data.size} diameterIn={data.diameterIn} widthIn={data.widthIn} accent={BRAND} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1.2 }}>
          <StatPill label="Overall Diameter" value={fmtIn(data.diameterIn)} />
          <StatPill label="Section Width" value={fmtIn(data.widthIn)} />
          <StatPill label="Sidewall Height" value={fmtIn(data.sidewallIn)} />
          <StatPill label="Revs / Mile" value={Math.round(data.revsPerMile).toLocaleString()} />
        </div>
      </div>

      <div style={{ color: MUTED, fontSize: 18, marginTop: 24 }}>tirereference.com</div>
    </div>
  );
}

export function CompareOgTemplate({ data }: { data: CompareOgData }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${BG} 0%, #111827 50%, #172554 100%)`,
        padding: '44px 52px',
        fontFamily: 'Inter',
      }}
    >
      <BrandHeader eyebrow="Tire Comparison" title={`${data.from} vs ${data.to}`} />

      <div style={{ display: 'flex', gap: 18, marginTop: 28 }}>
        <StatPill label="Diameter Δ" value={fmtSignedPct(data.diameterDeltaPct)} />
        <StatPill label="Width Δ" value={fmtSignedMm(data.widthDeltaMm)} />
        <StatPill label="Revs / Mile Δ" value={fmtSignedPct(data.revsDeltaPct)} />
        <StatPill label="Fitment Score" value={`${data.fitmentScore.toFixed(1)}/10`} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          marginTop: 28,
          flex: 1,
        }}
      >
        <TireVisual label={data.from} diameterIn={data.fromSpecs.diameterIn} widthIn={data.fromSpecs.widthIn} accent="#38bdf8" />
        <div style={{ color: MUTED, fontSize: 42, fontWeight: 700 }}>vs</div>
        <TireVisual label={data.to} diameterIn={data.toSpecs.diameterIn} widthIn={data.toSpecs.widthIn} accent={BRAND} />
      </div>

      <div style={{ color: MUTED, fontSize: 18, marginTop: 16 }}>tirereference.com</div>
    </div>
  );
}

export function FallbackOgTemplate({ title }: { title: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${BG} 0%, #1e1b4b 100%)`,
        padding: 64,
        fontFamily: 'Inter',
      }}
    >
      <BrandHeader eyebrow="Tire Reference" title={title} />
    </div>
  );
}
