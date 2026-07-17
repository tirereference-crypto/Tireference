import type { TireSpecs } from '../../../lib/tire-math';
import { partsForSize, TireCodeVisual } from './TireCodeVisuals';

export function TireCodeExplanation({
  specs,
  sizeLabel,
}: {
  specs: TireSpecs;
  sizeLabel: string;
}) {
  const parts = partsForSize(sizeLabel, specs);
  const isFlotation = /x/i.test(sizeLabel);

  const intro = isFlotation
    ? 'Section width, overall diameter, construction type and wheel diameter.'
    : 'Section width, aspect ratio, construction type and wheel diameter.';

  return (
    <section id="tsc-tire-code" className="tsc-explain" aria-label="Tire size code explained">
      <h2 className="tsc-section-title">What does {sizeLabel} mean?</h2>
      <p className="tsc-explain__lede">{intro}</p>
      <div className="tsc-explain__grid">
        {parts.map((part) => (
          <article key={part.id} className={`tsc-explain__card tsc-explain__card--${part.visual}`}>
            <div className="tsc-explain__content">
              <p className="tsc-explain__value">{part.value}</p>
              <h3 className="tsc-explain__title">{part.title}</h3>
              <p className="tsc-explain__body">{part.body}</p>
            </div>
            <div className="tsc-explain__visual-wrap" aria-hidden="true">
              <TireCodeVisual visual={part.visual} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
