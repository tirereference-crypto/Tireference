/** FAQ copy for the tire size calculator page (UI + FAQPage schema). */
export const TIRE_SIZE_CALCULATOR_FAQ_VISIBLE = 8;

/**
 * Ordered for two-column row balance on desktop:
 * odd indices → left column, even pairing → right when interleaved.
 */
export const TIRE_SIZE_CALCULATOR_FAQS = [
  {
    question: 'How accurate is this tire size calculator?',
    answer:
      'Results use standard ISO/ETRTO formulas from the size code you enter. They reflect nominal published dimensions for a new tire at rated pressure and are reliable for comparing sizes. Mounted tires can differ by model, tread depth, pressure, and load.',
  },
  {
    question: 'What does revolutions per mile mean?',
    answer:
      'It is the theoretical number of complete tire revolutions over one mile, based on calculated circumference. Speedometers and odometers depend on rolling distance; manufacturer or measured values may differ slightly.',
  },
  {
    question: 'How are these dimensions calculated?',
    answer:
      'Sidewall height = width × aspect ratio. Overall diameter = wheel diameter + two sidewalls. Circumference = π × diameter. Revolutions per mile = inches per mile ÷ circumference. Metric sidewall uses width in millimetres and aspect ratio as a percentage. Results are nominal values from the size code.',
  },
  {
    question: 'Can two different tire sizes use the same wheel?',
    answer:
      'Only when the wheel diameter in the size code matches—the number after the R (or in a flotation size). Overall diameter and section width can still differ. Always follow the tire maker’s approved rim width and diameter range.',
  },
  {
    question: 'Why do actual tire sizes differ from calculated dimensions?',
    answer:
      'Manufacturers build to nominal specs, but real mounted height and width change with tread wear, inflation, load, rim width, and construction. A tape-measured tire often reads slightly different from the label-based calculation.',
  },
  {
    question: 'How does tire diameter affect the speedometer?',
    answer:
      'A taller tire travels farther per revolution, so the speedometer may read lower than actual speed—and the opposite when diameter decreases. Error scales roughly with diameter change. Use the tire comparison calculator with your stock and new sizes for a specific estimate.',
  },
  {
    question: 'Does this calculator confirm vehicle fitment?',
    answer:
      'No. It reports mathematical dimensions only. Wheel width, offset, load rating, speed rating, and fender or suspension clearance must be verified with the vehicle and tire manufacturer or a qualified installer.',
  },
  {
    question: 'What is the difference between overall diameter and radius?',
    answer:
      'Overall diameter is the full height of the mounted tire from ground to tread crown. Radius is half of that—the distance from the wheel centerline to the tread. Tire size labels encode values used to calculate diameter, not radius directly.',
  },
  {
    question: 'What is the difference between metric and flotation sizes?',
    answer:
      'Metric sizes such as 275/70R18 list section width in millimetres, aspect ratio, construction, and wheel diameter in inches. Flotation sizes such as 33x12.50R17 list overall diameter and section width in inches, then wheel diameter.',
  },
  {
    question: 'How is sidewall height calculated?',
    answer:
      'For metric sizes: sidewall height = section width × aspect ratio ÷ 100 (one sidewall, in millimetres). Convert to inches, then overall diameter = wheel diameter + two sidewalls. Flotation sizes derive sidewall from overall diameter minus wheel diameter.',
  },
  {
    question: 'Where can I find the original tire size for my vehicle?',
    answer:
      'Check the driver-side door jamb placard, owner’s manual, or the sidewall of your current tires. Dealer parts departments and manufacturer fitment guides can confirm OE sizes by year, make, model, and trim.',
  },
] as const;

/** FAQs included in JSON-LD — matches initially visible accordion rows. */
export function getVisibleTireSizeCalculatorFaqs() {
  return TIRE_SIZE_CALCULATOR_FAQS.slice(0, TIRE_SIZE_CALCULATOR_FAQ_VISIBLE);
}
