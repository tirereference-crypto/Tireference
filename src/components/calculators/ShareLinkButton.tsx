import { useCallback, useState } from 'react';
import { copyPageUrl } from '../../lib/copy-page-url';

export interface ShareLinkButtonProps {
  className?: string;
  label?: string;
  sharedLabel?: string;
  title?: string;
}

export default function ShareLinkButton({
  className = '',
  label = 'Share',
  sharedLabel = 'Link copied',
  title,
}: ShareLinkButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareTitle = title ?? document.title;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url, title: shareTitle });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    const copied = await copyPageUrl(url);
    if (copied) {
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    }
  }, [title]);

  return (
    <button
      type="button"
      className={`calc-share-link ${shared ? 'calc-share-link--shared' : ''} ${className}`.trim()}
      onClick={handleShare}
      aria-live="polite"
    >
      <span className="calc-share-link__icon" aria-hidden="true">
        {shared ? (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 4.5h3.5v3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 11.5L15.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 7.5v7a1.5 1.5 0 001.5 1.5h7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {shared ? sharedLabel : label}
    </button>
  );
}
