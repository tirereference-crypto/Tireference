import {
  formatProductSizeServiceLine,
  getCategoryBadgeTone,
  isRunFlatModel,
  isXlOrReinforced,
  normalizeTireProductRecord,
} from '../../../lib/tire-product-display';
import { formatTireModelDisplayName } from '../../../lib/tire-size-guide';
import type { VerifiedTireModel } from '../../../lib/size-availability';
import { PopularBrandMark, PopularTireImage } from './PopularTireMedia';

/**
 * Shared exact-size product card used by calculator Popular Tires sections
 * (Tire Size, Comparison, Diameter) — same visual system as hub product presentation.
 */
export function VerifiedProductCard({
  model,
  sizeLabel,
  detailHref,
  onTrack,
  featured = false,
}: {
  model: VerifiedTireModel;
  sizeLabel: string;
  detailHref: string | null;
  onTrack: (modelName: string) => void;
  featured?: boolean;
}) {
  const normalized = normalizeTireProductRecord(
    {
      brand: model.brand,
      model: model.model,
      service: model.service,
      category: model.category,
    },
    sizeLabel,
  );
  const badgeTone = getCategoryBadgeTone(model.category);
  const modelName = formatTireModelDisplayName(normalized.canonicalModel);
  const serviceLine = formatProductSizeServiceLine(sizeLabel, model);
  const showXl = isXlOrReinforced(model);
  const showRunFlat = isRunFlatModel(model);
  const markings = [
    showXl && !/\bXL\b/i.test(serviceLine ?? '') ? 'XL' : null,
    showRunFlat ? 'Run-flat' : null,
  ].filter(Boolean);

  return (
    <article
      className={`tsc-popular__card${featured ? ' tsc-popular__card--featured' : ''}`}
      role="listitem"
    >
      <div className="tsc-popular__brand-row">
        <PopularBrandMark brand={normalized.canonicalBrand} />
      </div>

      <div className="tsc-popular__image-wrap">
        <PopularTireImage
          category={model.category}
          brand={normalized.canonicalBrand}
          model={normalized.canonicalModel}
          exactImageSrc={normalized.exactModelImage}
        />
      </div>

      {model.category ? (
        <p className={`tsc-popular__category tsc-popular__category--${badgeTone}`}>
          {model.category}
        </p>
      ) : null}

      <h3 className="tsc-popular__name">{modelName}</h3>

      {serviceLine ? <p className="tsc-popular__service-line">{serviceLine}</p> : null}

      {markings.length > 0 ? (
        <p className="tsc-popular__markings">{markings.join(' · ')}</p>
      ) : null}

      {model.hasMultipleServiceDescriptions ? (
        <p className="tsc-popular__variants">Multiple service descriptions</p>
      ) : null}

      {detailHref ? (
        <a
          href={detailHref}
          className="tsc-popular__link"
          onClick={() =>
            onTrack(`${normalized.canonicalBrand} ${normalized.canonicalModel}`)
          }
        >
          {`Open ${sizeLabel} tire guide`}
        </a>
      ) : null}
    </article>
  );
}
