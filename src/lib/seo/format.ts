import { SITE_NAME } from '../site-brand';
import {
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
  SEO_TITLE_SUFFIX,
} from './constants';

/** Append brand suffix and keep titles ≤ 60 characters when possible. */
export function formatPageTitle(title: string, siteName = SITE_NAME): string {
  const suffix = ` | ${siteName}`;
  if (title.includes(siteName)) {
    return title;
  }

  const combined = `${title}${suffix}`;
  if (combined.length <= SEO_TITLE_MAX_LENGTH) return combined;

  const budget = SEO_TITLE_MAX_LENGTH - suffix.length - 1;
  if (budget < 12) {
    return stripTrailingSeparators(truncateAtWord(combined, SEO_TITLE_MAX_LENGTH));
  }

  return `${stripTrailingSeparators(truncateAtWord(title, budget))}${suffix}`;
}

/** Trim meta descriptions to ~150–160 characters. */
export function truncateDescription(
  description: string,
  maxLength = SEO_DESCRIPTION_MAX_LENGTH,
): string {
  const trimmed = description.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${stripTrailingSeparators(truncateAtWord(trimmed, maxLength - 1))}…`;
}

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.6) {
    return slice.slice(0, lastSpace).trim();
  }
  return slice.trim();
}

/**
 * Remove trailing separators/conjunctions left behind after truncation so
 * titles never end with dangling punctuation like "&", "—", "," or "|".
 */
function stripTrailingSeparators(text: string): string {
  return text.replace(/[\s]*[|&,·/–—-]+\s*$/u, '').trim();
}

/** Strip brand suffix for pages that pass a pre-formatted document title. */
export function stripBrandSuffix(title: string, siteName = SITE_NAME): string {
  const suffix = ` | ${siteName}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}
