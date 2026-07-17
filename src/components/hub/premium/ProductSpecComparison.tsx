import { useEffect, useState } from 'react';
import type { TireProduct } from '../../../lib/tire-size-products';
import {
  formatCategoryLabel,
  formatNum,
} from '../../../lib/tire-size-products';
import { formatTireModelDisplayName } from '../../../lib/tire-size-guide';
import { canonicalProductBrand } from '../../../lib/tire-product-display';

interface Props {
  products: TireProduct[];
  initialVisible?: number;
  /** Start collapsed so the table does not dominate the page. */
  startCollapsed?: boolean;
  /** Short section explanation under the title. */
  description?: string;
}

function fmtLoad(p: TireProduct): string {
  const svc = p.service_description?.trim();
  if (svc) return svc;
  const parts = [p.load_range, p.speed_rating].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

function isSpecComparisonHash(): boolean {
  return typeof window !== 'undefined' && window.location.hash === '#spec-comparison';
}

export default function ProductSpecComparison({
  products,
  initialVisible = 6,
  startCollapsed = true,
  description = 'Compare tread depth, weight, max load, pressure, and revs per mile for full-spec products in this size.',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(!startCollapsed);

  useEffect(() => {
    const revealAll = () => {
      setOpen(true);
      setExpanded(true);
    };

    const syncFromHash = () => {
      if (isSpecComparisonHash()) revealAll();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.('a[href="#spec-comparison"]');
      if (link) revealAll();
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    document.addEventListener('click', onClick);
    document.addEventListener('astro:page-load', syncFromHash);

    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      document.removeEventListener('click', onClick);
      document.removeEventListener('astro:page-load', syncFromHash);
    };
  }, []);

  if (products.length === 0) return null;

  const visible = expanded ? products : products.slice(0, initialVisible);
  const canExpand = products.length > initialVisible;

  return (
    <section id="spec-comparison" className="ref-section ref-section--alt ref-section--spec-table">
      <div className="flex flex-wrap items-end justify-between gap-3 px-[var(--ref-section-px,1.25rem)]">
        <div>
          <h2 className="ref-section__title text-2xl font-bold tracking-tight text-heading !px-0">
            Product Spec Comparison
          </h2>
          <p className="ref-section__subtitle !px-0 mt-1">
            {description}
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Hide table' : 'Compare full-spec tires'}
        </button>
      </div>

      {open && (
        <div className="ref-section__body--full">
          <div className="ref-card overflow-hidden rounded-card border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="ref-table w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="py-3 px-3">Tire</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Load/Speed</th>
                    <th className="py-3 px-2">Tread</th>
                    <th className="py-3 px-2">Weight</th>
                    <th className="py-3 px-2">Max Load</th>
                    <th className="py-3 px-2">Pressure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((p) => {
                    const tread = formatNum(p.tread_depth_32nds, 1);
                    const weight = formatNum(p.weight_lb, 1);
                    const maxLoad = formatNum(p.max_load_lb, 0);
                    const psi = formatNum(p.max_pressure_psi, 0);
                    return (
                      <tr
                        key={`${p.brand}-${p.model}-${p.service_description}-${p.product_code}`}
                        className="transition-colors hover:bg-surface-subtle/60"
                      >
                        <td className="py-3 px-3">
                          <p className="font-semibold text-heading">{canonicalProductBrand(p)}</p>
                          <p className="text-xs text-body leading-snug">
                            {formatTireModelDisplayName(p.model)}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-xs text-body whitespace-nowrap">
                          {formatCategoryLabel(p.product_category)}
                        </td>
                        <td className="py-3 px-2 font-mono text-xs tabular-nums text-body whitespace-nowrap">
                          {fmtLoad(p)}
                        </td>
                        <td className="py-3 px-2 tabular-nums text-body whitespace-nowrap">
                          {tread ? `${tread}/32` : '—'}
                        </td>
                        <td className="py-3 px-2 tabular-nums text-body whitespace-nowrap">
                          {weight ? `${weight} lb` : '—'}
                        </td>
                        <td className="py-3 px-2 tabular-nums text-body whitespace-nowrap">
                          {maxLoad
                            ? `${Number(maxLoad).toLocaleString('en-US')} lb`
                            : '—'}
                        </td>
                        <td className="py-3 px-2 tabular-nums text-body whitespace-nowrap">
                          {psi ? `${psi} psi` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {canExpand && (
              <div className="border-t border-border bg-surface-subtle/40 px-4 py-3 text-center">
                <button
                  type="button"
                  className="text-sm font-semibold text-primary hover:underline"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded
                    ? 'Show fewer'
                    : `Show more (${products.length - initialVisible} more)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
