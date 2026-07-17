import {
  EDUCATIONAL_CONTENT,
  buildDiameterVsWheelExample,
} from '../../../lib/tire-diameter-insights';
import type { WheelDiameterOption } from '../../../lib/tire-diameter-search';
import { DiameterVsWheelVisual } from '../DiameterVsWheelVisual';
import { MeasureDiameterVisual } from '../MeasureDiameterVisual';

export function TireDiameterEducation({
  wheelDiameterIn,
  preferredSize,
  targetDiameterIn,
}: {
  wheelDiameterIn: WheelDiameterOption;
  preferredSize?: string;
  targetDiameterIn?: number | null;
}) {
  const measureSteps = EDUCATIONAL_CONTENT.howToMeasureSteps.slice(0, 3);
  const example = buildDiameterVsWheelExample(wheelDiameterIn, {
    targetDiameterIn: targetDiameterIn ?? undefined,
    preferredSize,
  });
  const wheelLabel = Number.isInteger(example.wheelIn)
    ? String(Math.round(example.wheelIn))
    : example.wheelIn.toFixed(1);
  const overallLabel = example.overallDiameterIn.toFixed(2);
  const sidewallLabel = example.sidewallIn.toFixed(2);
  const wheelArticle =
    Number(wheelLabel) === 8 ||
    Number(wheelLabel) === 11 ||
    Number(wheelLabel) === 18
      ? 'An'
      : 'A';

  return (
    <section className="dia-education" aria-label="Tire diameter education">
      <article className="dia-education__card dia-education__card--vs">
        <h2 className="dia-education__title">Tire Diameter vs Wheel Diameter</h2>
        <p className="dia-education__lede">
          Tire diameter includes the wheel plus both sidewalls.
        </p>
        <div className="dia-education__visual dia-education__visual--vs">
          <DiameterVsWheelVisual
            wheelDiameterIn={example.wheelIn}
            overallDiameterIn={example.overallDiameterIn}
            exampleSize={example.exampleSize}
          />
        </div>
        <dl className="dia-education__metrics">
          <div>
            <dt>Example size</dt>
            <dd>{example.exampleSize}</dd>
          </div>
          <div>
            <dt>Overall diameter</dt>
            <dd>{overallLabel} in</dd>
          </div>
          <div>
            <dt>Wheel diameter</dt>
            <dd>{wheelLabel} in</dd>
          </div>
          <div>
            <dt>Sidewall height</dt>
            <dd>{sidewallLabel} in</dd>
          </div>
        </dl>
        <p className="dia-education__formula" role="note">
          Overall diameter = wheel diameter + 2 × sidewall height
        </p>
        <p className="dia-education__takeaway">
          {wheelArticle} {wheelLabel}-inch wheel does not mean {wheelArticle.toLowerCase()}{' '}
          {wheelLabel}-inch tire.
        </p>
      </article>

      <div className="dia-education__stack">
        <article className="dia-education__card dia-education__card--measure">
          <h2 className="dia-education__title">How to Measure Actual Tire Diameter</h2>
          <div className="dia-education__measure-layout">
            <div className="dia-education__visual dia-education__visual--measure">
              <MeasureDiameterVisual />
            </div>
            <div className="dia-education__measure-copy">
              <ol className="dia-education__steps">
                {measureSteps.map((step, index) => (
                  <li key={step}>
                    <span className="dia-education__step-num">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="dia-education__note">
                Mounted height can differ with construction, pressure, load, tread depth, and
                measuring-rim width.
              </p>
            </div>
          </div>
        </article>

        <article className="dia-education__card dia-education__card--what">
          <h2 className="dia-education__title">What Is Tire Diameter?</h2>
          <p className="dia-education__lede">
            Overall tire diameter is the full height of the mounted tire from the ground to the top
            of the tread — not the rim size alone.
          </p>
          <p className="dia-education__formula" role="note">
            Overall diameter = wheel diameter + 2 × sidewall height
          </p>
          <p className="dia-education__why-label">Diameter directly influences</p>
          <ul className="dia-education__bullets">
            <li>Speedometer / odometer calculation</li>
            <li>Effective gearing</li>
            <li>Revolutions per mile</li>
            <li>Approximate static ground clearance</li>
            <li>Wheel-well clearance</li>
          </ul>
          <p className="dia-education__note">
            Diameter alone does not determine fuel economy, ride quality, handling, or grip — those
            also depend on mass, width, construction, pressure, tread, and vehicle setup.
          </p>
        </article>
      </div>
    </section>
  );
}
