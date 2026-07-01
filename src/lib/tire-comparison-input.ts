import { compareTires, type TireComparison } from './tire-math';
import type { CalculatorMessage, TireSizeInputFields } from './calculator-types';
import {
  fieldsToTireSizeString,
  getCalculatorMessage,
} from './tire-size-input';

const EMPTY_MESSAGE =
  'Enter both tire sizes (current and new), or paste full sizes like 225/45R17.';
const INVALID_MESSAGE =
  'Enter valid positive numbers for both tires and vehicle speed.';

export function getComparisonMessage(
  currentFields: TireSizeInputFields,
  newFields: TireSizeInputFields,
  vehicleSpeed: string,
): CalculatorMessage {
  const currentMsg = getCalculatorMessage(currentFields);
  const newMsg = getCalculatorMessage(newFields);

  const hasAny =
    currentMsg.status !== 'empty' ||
    newMsg.status !== 'empty' ||
    vehicleSpeed.trim() !== '';

  if (!hasAny) {
    return { status: 'empty', text: EMPTY_MESSAGE };
  }

  if (currentMsg.status !== 'ready' || newMsg.status !== 'ready') {
    if (
      currentMsg.status === 'invalid' ||
      newMsg.status === 'invalid' ||
      (vehicleSpeed.trim() !== '' && !isValidVehicleSpeed(vehicleSpeed))
    ) {
      return { status: 'invalid', text: INVALID_MESSAGE };
    }
    return { status: 'empty', text: EMPTY_MESSAGE };
  }

  if (!isValidVehicleSpeed(vehicleSpeed)) {
    return { status: 'invalid', text: INVALID_MESSAGE };
  }

  return { status: 'ready', text: '' };
}

function isValidVehicleSpeed(value: string): boolean {
  const speed = Number(value);
  return Number.isFinite(speed) && speed > 0;
}

export function compareTiresFromFields(
  currentFields: TireSizeInputFields,
  newFields: TireSizeInputFields,
  vehicleSpeed: string,
): TireComparison | null {
  const sizeA = fieldsToTireSizeString(currentFields);
  const sizeB = fieldsToTireSizeString(newFields);
  const speed = Number(vehicleSpeed);

  if (!sizeA || !sizeB || !isValidVehicleSpeed(vehicleSpeed)) {
    return null;
  }

  try {
    return compareTires(sizeA, sizeB, speed);
  } catch {
    return null;
  }
}
