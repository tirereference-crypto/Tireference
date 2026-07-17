import { useMemo, useState } from 'react';
import {
  formatDiameterDiff,
  type TireDiameterMatch,
} from '../../../lib/tire-diameter-search';
import { hasTireSizeGuide } from '../../../lib/has-tire-size-guide';
import { tireSizeCalculatorPath } from '../../../lib/tire-size-url';
import { getExactSizeCoverage } from '../../../lib/exact-size-coverage';
import { formatIn } from './diameter-display';

type SortKey = 'closest' | 'wheel' | 'width' | 'sidewall' | 'models';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'closest', label: 'Closest diameter' },
  { value: 'wheel', label: 'Wheel diameter' },
  { value: 'width', label: 'Section width' },
  { value: 'sidewall', label: 'Sidewall height' },
  { value: 'models', label: 'Unique tire model count' },
];

function sortMatches(matches: TireDiameterMatch[], sortKey: SortKey): TireDiameterMatch[] {
  const next = [...matches];
  switch (sortKey) {
    case 'closest':
      return next.sort((a, b) => Math.abs(a.diameterDiffIn) - Math.abs(b.diameterDiffIn));
    case 'wheel':
      return next.sort(
        (a, b) =>
          a.wheelDiameterIn - b.wheelDiameterIn ||
          Math.abs(a.diameterDiffIn) - Math.abs(b.diameterDiffIn),
      );
    case 'width':
      return next.sort((a, b) => a.specs.sectionWidthIn - b.specs.sectionWidthIn);
    case 'sidewall':
      return next.sort((a, b) => a.specs.sidewallIn - b.specs.sidewallIn);
    case 'models':
      return next.sort((a, b) => {
        const ma = getExactSizeCoverage(a.size).uniqueModelCount;
        const mb = getExactSizeCoverage(b.size).uniqueModelCount;
        return mb - ma || Math.abs(a.diameterDiffIn) - Math.abs(b.diameterDiffIn);
      });
    default:
      return next;
  }
}

export function DiameterMatchTable({
  matches,
  targetDiameterIn,
}: {
  matches: TireDiameterMatch[];
  targetDiameterIn: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('closest');
  const rows = useMemo(() => sortMatches(matches, sortKey), [matches, sortKey]);

  return (
    <div className="dia-match-table-wrap" id="dia-all-matches">
      <div className="dia-match-table__toolbar">
        <h3 className="dia-match-table__title">All matching sizes</h3>
        <label className="dia-match-table__sort">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort matching tire sizes"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="dia-match-table__scroll">
        <table className="dia-match-table">
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">Diameter</th>
              <th scope="col">Δ Target</th>
              <th scope="col">Wheel</th>
              <th scope="col">Width</th>
              <th scope="col">Sidewall</th>
              <th scope="col">Unique tire models</th>
              <th scope="col">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((match) => {
              const diff = formatDiameterDiff(match.diameterDiffIn, targetDiameterIn);
              const guide = hasTireSizeGuide(match.size);
              const uniqueModelCount = getExactSizeCoverage(match.size).uniqueModelCount;
              const href = guide ? match.hubHref : tireSizeCalculatorPath(match.size);
              return (
                <tr key={match.size}>
                  <td>
                    <strong>{match.size}</strong>
                  </td>
                  <td>{formatIn(match.diameterIn)}</td>
                  <td>
                    {diff.signed} {diff.percent}
                  </td>
                  <td>{Math.round(match.wheelDiameterIn)}&quot;</td>
                  <td>{formatIn(match.specs.sectionWidthIn)}</td>
                  <td>{formatIn(match.specs.sidewallIn)}</td>
                  <td>{uniqueModelCount > 0 ? uniqueModelCount : '—'}</td>
                  <td>
                    <a href={href}>
                      {guide || uniqueModelCount > 0 ? 'View tire models' : 'View size'}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
