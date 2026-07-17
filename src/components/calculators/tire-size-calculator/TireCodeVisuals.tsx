import type { TireSpecs } from '../../../lib/tire-math';

export type CodeVisual = 'width' | 'aspect' | 'construction' | 'wheel';

export type CodePart = {
  id: string;
  value: string;
  title: string;
  body: string;
  visual: CodeVisual;
};

export function partsForSize(sizeLabel: string, specs: TireSpecs): CodePart[] {
  const flotation = sizeLabel.match(
    /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)([A-Z])(\d+(?:\.\d+)?)$/i,
  );

  if (flotation) {
    const [, diameter, width, construction, wheel] = flotation;
    return [
      {
        id: 'width',
        value: width,
        title: 'Width (in)',
        body: `The tire's section width from sidewall to sidewall (~${specs.sectionWidthIn.toFixed(2)} in).`,
        visual: 'width',
      },
      {
        id: 'aspect',
        value: diameter,
        title: 'Overall Diameter (in)',
        body: `The overall tire height is about ${specs.overallDiameterIn.toFixed(2)} in.`,
        visual: 'aspect',
      },
      {
        id: 'construction',
        value: construction.toUpperCase(),
        title: 'Construction',
        body: `"${construction.toUpperCase()}" means radial construction, the most common type today.`,
        visual: 'construction',
      },
      {
        id: 'wheel',
        value: wheel,
        title: 'Wheel Diameter (in)',
        body: 'The diameter of the wheel (typically the rim diameter) in inches.',
        visual: 'wheel',
      },
    ];
  }

  const aspect = Math.round(specs.aspectRatio);
  const widthMm = Math.round(specs.widthMm);
  return [
    {
      id: 'width',
      value: String(widthMm),
      title: 'Width (mm)',
      body: "The tire's section width from sidewall to sidewall in millimeters.",
      visual: 'width',
    },
    {
      id: 'aspect',
      value: String(aspect),
      title: 'Aspect Ratio (%)',
      body: `The sidewall height is ${aspect}% of the tire's section width (${widthMm} mm).`,
      visual: 'aspect',
    },
    {
      id: 'construction',
      value: specs.construction,
      title: 'Construction',
      body: `"${specs.construction}" means radial construction, the most common type today.`,
      visual: 'construction',
    },
    {
      id: 'wheel',
      value: String(specs.wheelDiameterIn),
      title: 'Wheel Diameter (in)',
      body: 'The diameter of the wheel (typically the rim diameter) in inches.',
      visual: 'wheel',
    },
  ];
}

/** Sharp educational illustrations — white backgrounds, baked-in measure marks. */
const VISUAL_SRC: Record<CodeVisual, { src: string; w: number; h: number }> = {
  width: { src: '/images/tires/code-width.png', w: 600, h: 900 },
  aspect: { src: '/images/tires/code-aspect.png', w: 900, h: 900 },
  construction: { src: '/images/tires/code-construction.png', w: 900, h: 900 },
  wheel: { src: '/images/tires/code-wheel.png', w: 900, h: 900 },
};

export function TireCodeVisual({ visual }: { visual: CodeVisual }) {
  const asset = VISUAL_SRC[visual];
  return (
    <div className={`tsc-explain-diagram tsc-explain-diagram--${visual}`}>
      <img
        src={asset.src}
        alt=""
        className="tsc-explain-diagram__photo"
        width={asset.w}
        height={asset.h}
        decoding="async"
        loading="lazy"
      />
    </div>
  );
}
