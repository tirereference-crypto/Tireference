import { useCallback, useEffect, useRef, useState } from 'react';
import { copyPageUrl } from '../../lib/copy-page-url';
import {
  CALCULATOR_NAMES,
  getSourcePage,
  trackEvent,
  type CalculatorName,
} from '../../lib/analytics';

export interface CopyLinkButtonProps {
  className?: string;
  label?: string;
  copiedLabel?: string;
  calculatorName?: CalculatorName;
}

export default function CopyLinkButton({
  className = '',
  label = 'Copy Link',
  copiedLabel = 'Copied',
  calculatorName = CALCULATOR_NAMES.tireSize,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copyPageUrl();
    if (ok) {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      trackEvent('share_link_copied', {
        calculator_name: calculatorName,
        source_page: getSourcePage(),
      });
    } else {
      setCopied(false);
    }
  }, [calculatorName]);

  return (
    <button
      type="button"
      className={`calc-copy-link ${copied ? 'calc-copy-link--copied' : ''} ${className}`.trim()}
      onClick={handleCopy}
      aria-live="polite"
      aria-label={copied ? 'Link copied to clipboard' : 'Copy calculator link'}
    >
      <span className="calc-copy-link__icon" aria-hidden="true">
        {copied ? (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M7.5 3.5h7a1.5 1.5 0 011.5 1.5v7" strokeLinecap="round" />
            <rect x="3.5" y="6.5" width="9" height="10" rx="1.5" />
          </svg>
        )}
      </span>
      {copied ? copiedLabel : label}
    </button>
  );
}
