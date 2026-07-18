import '../../../styles/tire-size-calculator-page.css';
import { TscSectionCarousel } from '../../calculators/tire-size-calculator/TscSectionCarousel';
import { VerifiedProductCard } from '../../calculators/tire-size-calculator/VerifiedProductCard';
import type { VerifiedTireModel } from '../../../lib/size-availability';

/**
 * Image-card presentation for hub “Real Tires Available”.
 * Product selection stays in buildTireSizeGuideData / selectTopGuideProducts —
 * this component only renders the already-chosen models.
 */
export default function HubAvailableTires({
  displaySize,
  models,
}: {
  displaySize: string;
  models: VerifiedTireModel[];
  /** @deprecated Unused — section-level links avoid duplicate destinations. */
  detailHref?: string | null;
}) {
  if (models.length === 0) return null;

  return (
    <div className="tsc-popular tsc-popular-scope guide-available-tires-media">
      <TscSectionCarousel trackVariant="popular" itemCount={models.length}>
        {models.map((model) => (
          <VerifiedProductCard
            key={`${model.brand}|${model.model}|${model.service ?? ''}|${model.loadRange ?? ''}`}
            model={model}
            sizeLabel={displaySize}
            detailHref={null}
            onTrack={() => undefined}
          />
        ))}
      </TscSectionCarousel>
    </div>
  );
}
