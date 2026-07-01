/** FAQ copy for the tire size calculator page (UI + FAQPage schema). */
export const TIRE_SIZE_CALCULATOR_FAQS = [
  {
    question: 'How do I use a tire size calculator?',
    answer:
      'Enter the tire width, aspect ratio, and wheel diameter, or paste a full size such as 275/70R18. The calculator converts those values into real dimensions: overall diameter, section width, sidewall height, circumference, and revolutions per mile. Those numbers explain how a tire will fit and behave, but they are not the same as comparing two sizes. For speedometer change, clearance gain, or gearing difference, use a tire comparison calculator with both the current and new tire sizes.',
  },
  {
    question: 'What does a tire size like 275/70R18 mean?',
    answer:
      'The first number is the section width in millimeters. The second number is the aspect ratio, meaning the sidewall height is that percentage of the width. The letter describes construction, usually R for radial. The final number is the wheel diameter in inches. Together, those values determine the tire’s real outside diameter and sidewall height. That is why two sizes that look close on paper can ride differently or fit differently once installed.',
  },
  {
    question: 'Which tire dimension matters most for fitment?',
    answer:
      'Overall diameter and section width matter most. Diameter determines how much vertical wheel-well space the tire needs and how much it affects gearing. Section width determines inner clearance near suspension components and outer clearance near fenders. Wheel offset and wheel width can make the same tire size fit differently on two vehicles. Always treat calculator results as a measurement baseline, then verify clearance on the exact vehicle and wheel combination.',
  },
  {
    question: 'How does tire size affect driving?',
    answer:
      'Tire size affects ride comfort, steering response, braking feel, fuel economy, and speedometer behavior. Taller tires can soften impacts and increase ground clearance, but they may feel heavier and reduce acceleration. Wider tires can improve dry grip, but they may increase road noise, tramlining, and rolling resistance. Lower-profile tires typically sharpen handling but transmit more impact into the cabin. The best size depends on whether the vehicle is used for commuting, towing, off-road travel, or performance driving.',
  },
  {
    question: 'Can I choose a tire size based only on diameter?',
    answer:
      'Diameter is important, but it is not enough. Two tires can share a similar overall diameter while having different widths, sidewall heights, load ratings, and tread constructions. A narrow touring tire and a heavy all-terrain tire can calculate similarly but feel completely different on the road. Use diameter to protect speedometer accuracy and clearance, then evaluate width, load range, tread type, and intended use before choosing a final size.',
  },
] as const;
