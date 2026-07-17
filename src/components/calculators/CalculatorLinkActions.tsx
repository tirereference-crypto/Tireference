import CopyLinkButton from './CopyLinkButton';
import ShareLinkButton from './ShareLinkButton';
import type { CalculatorName } from '../../lib/analytics';

export interface CalculatorLinkActionsProps {
  shareTitle?: string;
  calculatorName?: CalculatorName;
}

export default function CalculatorLinkActions({
  shareTitle,
  calculatorName,
}: CalculatorLinkActionsProps) {
  return (
    <div className="calc-link-actions">
      <ShareLinkButton title={shareTitle} />
      <CopyLinkButton calculatorName={calculatorName} />
    </div>
  );
}
