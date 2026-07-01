export interface StickyAnalyzeButtonProps {
  visible: boolean;
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

/** Mobile-only sticky bottom primary CTA for calculator pages. */
export function StickyAnalyzeButton({
  visible,
  label,
  onClick,
  ariaLabel,
}: StickyAnalyzeButtonProps) {
  return (
    <div
      className={`tl-sticky-analyze${visible ? ' tl-sticky-analyze--visible' : ''}`}
      role="region"
      aria-label={ariaLabel ?? label}
      aria-hidden={!visible}
    >
      <div className="tl-sticky-analyze__inner">
        <button type="button" className="tl-sticky-analyze__btn" onClick={onClick}>
          {label}
        </button>
      </div>
    </div>
  );
}
