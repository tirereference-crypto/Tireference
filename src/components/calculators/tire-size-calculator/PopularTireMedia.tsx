import { useMemo, useState } from 'react';
import type { VerifiedTireCategory } from '../../../lib/size-availability';
import {
  brandInitials,
  canonicalProductBrand,
  getBrandLogoSrc,
  getProductImageCandidates,
} from '../../../lib/tire-product-display';

export function PopularTireImage({
  category,
  brand = null,
  model = null,
  exactImageSrc = null,
}: {
  category: VerifiedTireCategory | null;
  brand?: string | null;
  model?: string | null;
  exactImageSrc?: string | null;
}) {
  const candidates = useMemo(
    () => getProductImageCandidates(category, exactImageSrc, null, brand, model),
    [category, exactImageSrc, brand, model],
  );
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || candidates.length === 0) {
    return (
      <div className="tsc-popular__image-fallback" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="tsc-popular__silhouette">
          <ellipse cx="32" cy="32" rx="26" ry="26" fill="#e2e8f0" />
          <ellipse cx="32" cy="32" rx="12" ry="12" fill="#f8fafc" stroke="#cbd5e1" />
        </svg>
      </div>
    );
  }

  const src = candidates[Math.min(index, candidates.length - 1)];

  return (
    <img
      src={src}
      alt=""
      className="tsc-popular__image"
      width={200}
      height={160}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (index + 1 < candidates.length) {
          setIndex((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export function PopularBrandMark({ brand }: { brand: string }) {
  const displayBrand = useMemo(() => canonicalProductBrand({ brand }), [brand]);
  const logoSrc = useMemo(() => getBrandLogoSrc(displayBrand), [displayBrand]);
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoSrc && !logoFailed) {
    return (
      <span className="tsc-popular__brand-logo-wrap">
        <img
          src={logoSrc}
          alt={`${displayBrand} logo`}
          className="tsc-popular__brand-logo"
          height={22}
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  const name = displayBrand.trim();
  if (name.length >= 2) {
    return <span className="tsc-popular__brand-wordmark">{name}</span>;
  }

  return (
    <span className="tsc-popular__brand-initials" aria-label={displayBrand || 'Brand'}>
      {brandInitials(displayBrand || 'NA')}
    </span>
  );
}
