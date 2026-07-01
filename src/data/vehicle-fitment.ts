export interface VehicleFitment {
  manufacturer: string;
  model: string;
  trim: string;
  yearRange: string;
}

const VEHICLE_FITMENT_BY_SIZE: Record<string, VehicleFitment[]> = {
  '185/65R15': [
    { manufacturer: 'Toyota', model: 'Corolla', trim: 'LE', yearRange: '2014–2019' },
    { manufacturer: 'Honda', model: 'Civic', trim: 'LX', yearRange: '2012–2015' },
    { manufacturer: 'Nissan', model: 'Sentra', trim: 'S', yearRange: '2013–2019' },
    { manufacturer: 'Hyundai', model: 'Elantra', trim: 'SE', yearRange: '2017–2020' },
  ],
  '195/60R15': [
    { manufacturer: 'Honda', model: 'Accord', trim: 'LX', yearRange: '2008–2012' },
    { manufacturer: 'Toyota', model: 'Camry', trim: 'LE', yearRange: '2007–2011' },
    { manufacturer: 'Mazda', model: 'Mazda6', trim: 'Sport', yearRange: '2014–2017' },
    { manufacturer: 'Nissan', model: 'Altima', trim: '2.5 S', yearRange: '2010–2012' },
  ],
  '195/65R15': [
    { manufacturer: 'Toyota', model: 'Corolla', trim: 'LE', yearRange: '2020–2022' },
    { manufacturer: 'Honda', model: 'Civic', trim: 'LX', yearRange: '2016–2021' },
    { manufacturer: 'Subaru', model: 'Impreza', trim: 'Base', yearRange: '2017–2023' },
    { manufacturer: 'Volkswagen', model: 'Jetta', trim: 'S', yearRange: '2015–2018' },
    { manufacturer: 'Kia', model: 'Forte', trim: 'LX', yearRange: '2019–2023' },
  ],
  '205/55R16': [
    { manufacturer: 'Honda', model: 'Accord', trim: 'Sport', yearRange: '2013–2017' },
    { manufacturer: 'Toyota', model: 'Camry', trim: 'SE', yearRange: '2012–2017' },
    { manufacturer: 'Mazda', model: 'Mazda3', trim: 'Touring', yearRange: '2014–2018' },
    { manufacturer: 'BMW', model: '3 Series', trim: '328i', yearRange: '2012–2015' },
    { manufacturer: 'Volkswagen', model: 'Passat', trim: 'SE', yearRange: '2012–2015' },
  ],
  '205/60R16': [
    { manufacturer: 'Honda', model: 'CR-V', trim: 'LX', yearRange: '2007–2011' },
    { manufacturer: 'Toyota', model: 'RAV4', trim: 'LE', yearRange: '2006–2012' },
    { manufacturer: 'Subaru', model: 'Forester', trim: '2.5i', yearRange: '2009–2012' },
    { manufacturer: 'Nissan', model: 'Rogue', trim: 'S', yearRange: '2014–2019' },
    { manufacturer: 'Hyundai', model: 'Tucson', trim: 'SE', yearRange: '2016–2020' },
  ],
  '215/55R17': [
    { manufacturer: 'Honda', model: 'Accord', trim: 'Touring', yearRange: '2018–2022' },
    { manufacturer: 'Toyota', model: 'Camry', trim: 'XSE', yearRange: '2018–2024' },
    { manufacturer: 'Subaru', model: 'Legacy', trim: 'Premium', yearRange: '2020–2024' },
    { manufacturer: 'Nissan', model: 'Altima', trim: 'SR', yearRange: '2019–2024' },
    { manufacturer: 'Mazda', model: 'Mazda6', trim: 'Grand Touring', yearRange: '2018–2021' },
  ],
  '215/60R16': [
    { manufacturer: 'Toyota', model: 'RAV4', trim: 'LE', yearRange: '2013–2018' },
    { manufacturer: 'Honda', model: 'CR-V', trim: 'LX', yearRange: '2012–2016' },
    { manufacturer: 'Subaru', model: 'Outback', trim: '2.5i', yearRange: '2015–2019' },
    { manufacturer: 'Nissan', model: 'Rogue', trim: 'SV', yearRange: '2014–2020' },
    { manufacturer: 'Ford', model: 'Escape', trim: 'SE', yearRange: '2013–2019' },
  ],
  '225/45R17': [
    { manufacturer: 'BMW', model: '3 Series', trim: '328i Sport Line', yearRange: '2012–2015' },
    { manufacturer: 'Audi', model: 'A4', trim: 'Premium Plus', yearRange: '2017–2023' },
    { manufacturer: 'Mercedes-Benz', model: 'C-Class', trim: 'C300', yearRange: '2015–2021' },
    { manufacturer: 'Volkswagen', model: 'GTI', trim: 'SE', yearRange: '2015–2021' },
    { manufacturer: 'Lexus', model: 'IS', trim: '300', yearRange: '2017–2020' },
  ],
  '225/50R17': [
    { manufacturer: 'BMW', model: '3 Series', trim: '330i xDrive', yearRange: '2019–2023' },
    { manufacturer: 'Audi', model: 'A4', trim: 'quattro Premium', yearRange: '2017–2023' },
    { manufacturer: 'Volvo', model: 'S60', trim: 'T5 Momentum', yearRange: '2019–2022' },
    { manufacturer: 'Genesis', model: 'G70', trim: '2.0T', yearRange: '2019–2024' },
    { manufacturer: 'Honda', model: 'Accord', trim: 'Sport 2.0T', yearRange: '2018–2022' },
  ],
  '225/55R17': [
    { manufacturer: 'Honda', model: 'CR-V', trim: 'Touring', yearRange: '2017–2022' },
    { manufacturer: 'Toyota', model: 'Highlander', trim: 'LE', yearRange: '2014–2019' },
    { manufacturer: 'Subaru', model: 'Outback', trim: 'Limited', yearRange: '2015–2019' },
    { manufacturer: 'Ford', model: 'Edge', trim: 'SEL', yearRange: '2015–2022' },
    { manufacturer: 'Hyundai', model: 'Santa Fe', trim: 'SE', yearRange: '2019–2023' },
  ],
  '225/65R17': [
    { manufacturer: 'Toyota', model: 'RAV4', trim: 'XLE', yearRange: '2019–2024' },
    { manufacturer: 'Honda', model: 'CR-V', trim: 'EX', yearRange: '2017–2022' },
    { manufacturer: 'Subaru', model: 'Forester', trim: 'Premium', yearRange: '2019–2024' },
    { manufacturer: 'Nissan', model: 'Rogue', trim: 'SV', yearRange: '2014–2020' },
    { manufacturer: 'Mazda', model: 'CX-5', trim: 'Touring', yearRange: '2017–2024' },
  ],
  '235/40R18': [
    { manufacturer: 'BMW', model: '3 Series', trim: '330i M Sport', yearRange: '2019–2023' },
    { manufacturer: 'Audi', model: 'A4', trim: '45 TFSI quattro', yearRange: '2020–2024' },
    { manufacturer: 'Mercedes-Benz', model: 'C-Class', trim: 'C300 4MATIC', yearRange: '2015–2021' },
    { manufacturer: 'Lexus', model: 'IS', trim: '350 F Sport', yearRange: '2017–2020' },
    { manufacturer: 'Volkswagen', model: 'Arteon', trim: 'SEL R-Line', yearRange: '2019–2023' },
  ],
  '235/45R18': [
    { manufacturer: 'BMW', model: '4 Series', trim: '428i Gran Coupe', yearRange: '2015–2016' },
    { manufacturer: 'Audi', model: 'A6', trim: 'Premium', yearRange: '2012–2018' },
    { manufacturer: 'Mercedes-Benz', model: 'E-Class', trim: 'E350', yearRange: '2017–2020' },
    { manufacturer: 'Tesla', model: 'Model 3', trim: 'Long Range', yearRange: '2018–2023' },
    { manufacturer: 'Volkswagen', model: 'Passat', trim: 'R-Line', yearRange: '2020–2022' },
  ],
  '235/55R18': [
    { manufacturer: 'Toyota', model: 'Highlander', trim: 'LE', yearRange: '2014–2019' },
    { manufacturer: 'Honda', model: 'Pilot', trim: 'EX-L', yearRange: '2016–2022' },
    { manufacturer: 'Ford', model: 'Explorer', trim: 'XLT', yearRange: '2020–2024' },
    { manufacturer: 'Subaru', model: 'Ascent', trim: 'Premium', yearRange: '2019–2024' },
    { manufacturer: 'Chevrolet', model: 'Traverse', trim: 'LT', yearRange: '2018–2023' },
  ],
  '235/60R18': [
    { manufacturer: 'Toyota', model: 'RAV4', trim: 'Adventure', yearRange: '2019–2024' },
    { manufacturer: 'Honda', model: 'Passport', trim: 'EX-L', yearRange: '2019–2024' },
    { manufacturer: 'Subaru', model: 'Outback', trim: 'Wilderness', yearRange: '2022–2024' },
    { manufacturer: 'Ford', model: 'Bronco Sport', trim: 'Outer Banks', yearRange: '2021–2024' },
    { manufacturer: 'Nissan', model: 'Murano', trim: 'SV', yearRange: '2015–2024' },
  ],
  '235/65R17': [
    { manufacturer: 'Toyota', model: 'Highlander', trim: 'LE', yearRange: '2008–2013' },
    { manufacturer: 'Honda', model: 'Pilot', trim: 'LX', yearRange: '2016–2018' },
    { manufacturer: 'Ford', model: 'Explorer', trim: 'XLT', yearRange: '2011–2019' },
    { manufacturer: 'Nissan', model: 'Pathfinder', trim: 'SV', yearRange: '2013–2020' },
    { manufacturer: 'Jeep', model: 'Grand Cherokee', trim: 'Laredo', yearRange: '2011–2020' },
  ],
  '245/40R18': [
    { manufacturer: 'BMW', model: '3 Series', trim: 'M340i', yearRange: '2020–2024' },
    { manufacturer: 'Audi', model: 'S4', trim: 'Prestige', yearRange: '2018–2024' },
    { manufacturer: 'Mercedes-Benz', model: 'C-Class', trim: 'AMG C43', yearRange: '2017–2022' },
    { manufacturer: 'Cadillac', model: 'CT4', trim: 'V-Series', yearRange: '2020–2024' },
    { manufacturer: 'Genesis', model: 'G70', trim: '3.3T Sport', yearRange: '2019–2024' },
  ],
  '245/45R18': [
    { manufacturer: 'BMW', model: '5 Series', trim: '530i xDrive', yearRange: '2017–2023' },
    { manufacturer: 'Audi', model: 'A6', trim: 'Premium Plus', yearRange: '2019–2024' },
    { manufacturer: 'Mercedes-Benz', model: 'E-Class', trim: 'E350 4MATIC', yearRange: '2017–2023' },
    { manufacturer: 'Lexus', model: 'ES', trim: '350 F Sport', yearRange: '2019–2024' },
    { manufacturer: 'Tesla', model: 'Model Y', trim: 'Long Range', yearRange: '2020–2024' },
  ],
  '245/60R18': [
    { manufacturer: 'Toyota', model: 'Highlander', trim: 'XLE', yearRange: '2020–2024' },
    { manufacturer: 'Honda', model: 'Pilot', trim: 'Touring', yearRange: '2019–2024' },
    { manufacturer: 'Ford', model: 'Edge', trim: 'Titanium', yearRange: '2019–2023' },
    { manufacturer: 'Subaru', model: 'Ascent', trim: 'Touring', yearRange: '2019–2024' },
    { manufacturer: 'Jeep', model: 'Grand Cherokee', trim: 'Limited', yearRange: '2014–2021' },
  ],
  '255/35R19': [
    { manufacturer: 'BMW', model: 'M3', trim: 'Competition', yearRange: '2021–2024' },
    { manufacturer: 'Audi', model: 'RS 5', trim: 'Sportback', yearRange: '2019–2024' },
    { manufacturer: 'Mercedes-Benz', model: 'C-Class', trim: 'AMG C63', yearRange: '2015–2021' },
    { manufacturer: 'Porsche', model: '911', trim: 'Carrera', yearRange: '2012–2019' },
    { manufacturer: 'Cadillac', model: 'CT5-V', trim: 'Blackwing', yearRange: '2022–2024' },
  ],
  '255/55R19': [
    { manufacturer: 'BMW', model: 'X5', trim: 'xDrive40i', yearRange: '2019–2024' },
    { manufacturer: 'Mercedes-Benz', model: 'GLE', trim: '350', yearRange: '2020–2024' },
    { manufacturer: 'Audi', model: 'Q7', trim: 'Premium', yearRange: '2017–2024' },
    { manufacturer: 'Volvo', model: 'XC90', trim: 'T6 Momentum', yearRange: '2016–2024' },
    { manufacturer: 'Lexus', model: 'RX', trim: '350', yearRange: '2016–2022' },
  ],
  '265/60R18': [
    { manufacturer: 'Toyota', model: '4Runner', trim: 'SR5', yearRange: '2010–2024' },
    { manufacturer: 'Ford', model: 'Bronco', trim: 'Badlands', yearRange: '2021–2024' },
    { manufacturer: 'Chevrolet', model: 'Tahoe', trim: 'LS', yearRange: '2015–2020' },
    { manufacturer: 'Jeep', model: 'Grand Cherokee', trim: 'Limited', yearRange: '2011–2021' },
    { manufacturer: 'Nissan', model: 'Armada', trim: 'SV', yearRange: '2017–2024' },
  ],
  '265/65R18': [
    { manufacturer: 'Toyota', model: 'Tacoma', trim: 'TRD Off-Road', yearRange: '2016–2023' },
    { manufacturer: 'Ford', model: 'F-150', trim: 'XLT', yearRange: '2015–2020' },
    { manufacturer: 'Chevrolet', model: 'Colorado', trim: 'Z71', yearRange: '2015–2022' },
    { manufacturer: 'Nissan', model: 'Frontier', trim: 'PRO-4X', yearRange: '2022–2024' },
    { manufacturer: 'Jeep', model: 'Wrangler', trim: 'Sahara', yearRange: '2018–2024' },
  ],
  '265/70R17': [
    { manufacturer: 'Toyota', model: '4Runner', trim: 'TRD Off-Road', yearRange: '2010–2024' },
    { manufacturer: 'Jeep', model: 'Wrangler', trim: 'Rubicon', yearRange: '2018–2024' },
    { manufacturer: 'Ford', model: 'Bronco', trim: 'Base', yearRange: '2021–2024' },
    { manufacturer: 'Toyota', model: 'Land Cruiser', trim: 'Base', yearRange: '2008–2021' },
    { manufacturer: 'Nissan', model: 'Xterra', trim: 'PRO-4X', yearRange: '2005–2015' },
  ],
  '275/55R20': [
    { manufacturer: 'Chevrolet', model: 'Suburban', trim: 'LT', yearRange: '2015–2024' },
    { manufacturer: 'GMC', model: 'Yukon', trim: 'SLT', yearRange: '2015–2024' },
    { manufacturer: 'Ford', model: 'Expedition', trim: 'XLT', yearRange: '2018–2024' },
    { manufacturer: 'Toyota', model: 'Sequoia', trim: 'SR5', yearRange: '2008–2022' },
    { manufacturer: 'Nissan', model: 'Armada', trim: 'Platinum', yearRange: '2017–2024' },
  ],
  '275/60R20': [
    { manufacturer: 'Ford', model: 'F-150', trim: 'Lariat', yearRange: '2021–2024' },
    { manufacturer: 'Ram', model: '1500', trim: 'Big Horn', yearRange: '2019–2024' },
    { manufacturer: 'Chevrolet', model: 'Silverado 1500', trim: 'LT', yearRange: '2019–2024' },
    { manufacturer: 'Toyota', model: 'Tundra', trim: 'SR5', yearRange: '2022–2024' },
    { manufacturer: 'GMC', model: 'Sierra 1500', trim: 'SLT', yearRange: '2019–2024' },
  ],
  '275/65R18': [
    { manufacturer: 'Toyota', model: 'Tacoma', trim: 'TRD Pro', yearRange: '2016–2023' },
    { manufacturer: 'Ford', model: 'Ranger', trim: 'Lariat', yearRange: '2019–2024' },
    { manufacturer: 'Chevrolet', model: 'Colorado', trim: 'LT', yearRange: '2015–2022' },
    { manufacturer: 'Nissan', model: 'Frontier', trim: 'SV', yearRange: '2022–2024' },
    { manufacturer: 'Jeep', model: 'Gladiator', trim: 'Overland', yearRange: '2020–2024' },
  ],
  '275/70R18': [
    { manufacturer: 'Toyota', model: 'Land Cruiser', trim: 'Base', yearRange: '2008–2021' },
    { manufacturer: 'Lexus', model: 'LX', trim: '570', yearRange: '2016–2021' },
    { manufacturer: 'Ford', model: 'F-250 Super Duty', trim: 'XLT', yearRange: '2017–2022' },
    { manufacturer: 'Ram', model: '2500', trim: 'Tradesman', yearRange: '2019–2024' },
    { manufacturer: 'Chevrolet', model: 'Silverado 2500HD', trim: 'LT', yearRange: '2020–2024' },
  ],
  '285/55R20': [
    { manufacturer: 'Ford', model: 'F-150', trim: 'Lariat', yearRange: '2015–2020' },
    { manufacturer: 'Ram', model: '1500', trim: 'Laramie', yearRange: '2019–2024' },
    { manufacturer: 'Chevrolet', model: 'Silverado 1500', trim: 'RST', yearRange: '2019–2024' },
    { manufacturer: 'Toyota', model: 'Tundra', trim: 'Limited', yearRange: '2014–2021' },
    { manufacturer: 'GMC', model: 'Sierra 1500', trim: 'Denali', yearRange: '2019–2024' },
  ],
  '285/65R20': [
    { manufacturer: 'Ford', model: 'F-250 Super Duty', trim: 'Lariat', yearRange: '2017–2022' },
    { manufacturer: 'Ram', model: '2500', trim: 'Power Wagon', yearRange: '2014–2024' },
    { manufacturer: 'Chevrolet', model: 'Silverado 2500HD', trim: 'LTZ', yearRange: '2020–2024' },
    { manufacturer: 'GMC', model: 'Sierra 2500HD', trim: 'Denali', yearRange: '2020–2024' },
    { manufacturer: 'Nissan', model: 'Titan XD', trim: 'PRO-4X', yearRange: '2016–2021' },
  ],
  '285/70R17': [
    { manufacturer: 'Jeep', model: 'Wrangler', trim: 'Rubicon', yearRange: '2007–2018' },
    { manufacturer: 'Toyota', model: 'FJ Cruiser', trim: 'Base', yearRange: '2007–2014' },
    { manufacturer: 'Ford', model: 'Bronco', trim: 'Badlands', yearRange: '2021–2024' },
    { manufacturer: 'Nissan', model: 'Xterra', trim: 'Off-Road', yearRange: '2005–2015' },
    { manufacturer: 'Land Rover', model: 'Defender', trim: '110', yearRange: '2020–2024' },
  ],
  '285/75R16': [
    { manufacturer: 'Toyota', model: 'Tacoma', trim: 'SR5', yearRange: '2005–2015' },
    { manufacturer: 'Nissan', model: 'Frontier', trim: 'SE', yearRange: '2005–2019' },
    { manufacturer: 'Ford', model: 'Ranger', trim: 'XLT', yearRange: '2019–2023' },
    { manufacturer: 'Chevrolet', model: 'Colorado', trim: 'WT', yearRange: '2015–2022' },
    { manufacturer: 'Jeep', model: 'Gladiator', trim: 'Sport', yearRange: '2020–2024' },
  ],
  '295/35R21': [
    { manufacturer: 'BMW', model: 'M5', trim: 'Competition', yearRange: '2018–2024' },
    { manufacturer: 'Mercedes-Benz', model: 'E-Class', trim: 'AMG E63 S', yearRange: '2018–2024' },
    { manufacturer: 'Audi', model: 'RS 7', trim: 'Base', yearRange: '2020–2024' },
    { manufacturer: 'Porsche', model: 'Panamera', trim: '4S', yearRange: '2017–2023' },
    { manufacturer: 'Tesla', model: 'Model S', trim: 'Plaid', yearRange: '2021–2024' },
  ],
  '305/55R20': [
    { manufacturer: 'Ford', model: 'F-150', trim: 'Raptor', yearRange: '2017–2020' },
    { manufacturer: 'Ram', model: '1500', trim: 'Rebel', yearRange: '2019–2024' },
    { manufacturer: 'Chevrolet', model: 'Silverado 1500', trim: 'Trail Boss', yearRange: '2019–2024' },
    { manufacturer: 'Toyota', model: 'Tundra', trim: 'TRD Pro', yearRange: '2015–2021' },
    { manufacturer: 'GMC', model: 'Sierra 1500', trim: 'AT4', yearRange: '2019–2024' },
  ],
  '305/70R18': [
    { manufacturer: 'Jeep', model: 'Gladiator', trim: 'Rubicon', yearRange: '2020–2024' },
    { manufacturer: 'Ford', model: 'Bronco', trim: 'Wildtrak', yearRange: '2021–2024' },
    { manufacturer: 'Toyota', model: 'Land Cruiser', trim: '70 Series', yearRange: '2007–2024' },
    { manufacturer: 'Ram', model: '2500', trim: 'Power Wagon', yearRange: '2014–2024' },
    { manufacturer: 'Chevrolet', model: 'Silverado 2500HD', trim: 'Z71', yearRange: '2020–2024' },
  ],
  '315/70R17': [
    { manufacturer: 'Jeep', model: 'Wrangler', trim: 'Rubicon 392', yearRange: '2021–2024' },
    { manufacturer: 'Ford', model: 'Bronco', trim: 'Raptor', yearRange: '2022–2024' },
    { manufacturer: 'Toyota', model: '4Runner', trim: 'TRD Pro', yearRange: '2015–2024' },
    { manufacturer: 'Nissan', model: 'Frontier', trim: 'PRO-4X', yearRange: '2022–2024' },
    { manufacturer: 'Ram', model: '1500', trim: 'TRX', yearRange: '2021–2023' },
  ],
  'LT265/75R16': [
    { manufacturer: 'Ford', model: 'F-150', trim: 'XLT', yearRange: '1997–2003' },
    { manufacturer: 'Chevrolet', model: 'Silverado 1500', trim: 'WT', yearRange: '1999–2006' },
    { manufacturer: 'Ram', model: '1500', trim: 'ST', yearRange: '2002–2008' },
    { manufacturer: 'Toyota', model: 'Tacoma', trim: 'PreRunner', yearRange: '2005–2015' },
    { manufacturer: 'Nissan', model: 'Titan', trim: 'S', yearRange: '2004–2015' },
  ],
};

const FITMENT_INTRO_BY_SIZE: Record<string, string> = {
  '185/65R15':
    '185/65R15 is a staple passenger-car OEM size on compact sedans where automakers balance rolling efficiency with everyday ride comfort.',
  '195/60R15':
    '195/60R15 appears on midsize passenger sedans as a slightly lower-profile alternative that preserves comfort without aggressive upsizing.',
  '195/65R15':
    '195/65R15 remains a common passenger fitment on compact and subcompact models prioritizing fuel economy and low replacement cost.',
  '205/55R16':
    '205/55R16 is one of the most widespread passenger OEM sizes, fitted to midsize sedans and sport-tuned variants that want sharper handling on 16-inch wheels.',
  '205/60R16':
    '205/60R16 bridges passenger cars and early crossovers, giving a taller sidewall than 55-series rubber without moving to full SUV fitment.',
  '215/55R17':
    '215/55R17 is a passenger-focused 17-inch OEM size common on newer midsize sedans that upsized wheels for style without sacrificing ride quality.',
  '215/60R16':
    '215/60R16 is a crossover-friendly passenger size that automakers use when they need extra sidewall cushion on compact SUVs and tall wagons.',
  '225/45R17':
    '225/45R17 is a performance-oriented OEM size with a low sidewall profile, factory-fitted to sport sedans that trade ride softness for turn-in precision.',
  '225/50R17':
    '225/50R17 splits the difference for performance sedans—wider than commuter rubber but with enough sidewall to stay livable on daily roads.',
  '225/55R17':
    '225/55R17 is a passenger crossover and wagon size that gives midsize SUVs a comfortable sidewall while keeping speedometer error modest.',
  '225/65R17':
    '225/65R17 is a crossover SUV OEM staple, sized for compact utilities that need extra diameter and load capacity without full-size truck geometry.',
  '235/40R18':
    '235/40R18 is a low-profile performance OEM fitment on sport sedans where manufacturers maximize grip and wheel fill on 18-inch rims.',
  '235/45R18':
    '235/45R18 is a performance passenger size found on upscale sedans and EVs that want a planted footprint without the harshest ultra-low sidewalls.',
  '235/55R18':
    '235/55R18 is a midsize SUV OEM size that balances three-row seating load ratings with the ride comfort buyers expect from family crossovers.',
  '235/60R18':
    '235/60R18 is an SUV and adventure-crossover fitment with enough sidewall for light trail use while staying civil on pavement.',
  '235/65R17':
    '235/65R17 is a taller SUV OEM size common on prior-generation crossovers and body-on-frame utilities that needed extra ground clearance.',
  '245/40R18':
    '245/40R18 is a factory performance size on sport sedans and compact executive cars where steering response matters more than maximum comfort.',
  '245/45R18':
    '245/45R18 is a performance and luxury OEM fitment on midsize sedans, wagons, and crossovers that want a wider contact patch on 18-inch wheels.',
  '245/60R18':
    '245/60R18 is a full-size crossover and SUV OEM size that supports heavier curb weights while keeping sidewall height reasonable for daily driving.',
  '255/35R19':
    '255/35R19 is an ultra-low-profile performance OEM size reserved for high-output sport sedans, coupes, and track-biased street cars.',
  '255/55R19':
    '255/55R19 is a luxury SUV OEM fitment on premium crossovers that pair large-diameter wheels with enough sidewall for composed highway manners.',
  '265/60R18':
    '265/60R18 is an SUV and body-on-frame OEM size suited to midsize utilities, SUVs, and trucks that need load capacity with moderate off-pavement clearance.',
  '265/65R18':
    '265/65R18 is a midsize truck and SUV OEM fitment that gives pickups and off-road trims extra sidewall height without jumping to full flotation sizing.',
  '265/70R17':
    '265/70R17 is an off-road-oriented OEM size on trail-ready SUVs and trucks where added diameter improves approach angles and obstacle clearance.',
  '275/55R20':
    '275/55R20 is a full-size SUV OEM size on body-on-frame utilities that need tall overall diameter for towing stability and passenger capacity.',
  '275/60R20':
    '275/60R20 is a half-ton pickup OEM fitment that pairs 20-inch wheels with enough sidewall to support towing and payload duty cycles.',
  '275/65R18':
    '275/65R18 is an SUV and midsize truck OEM size common on adventure trims that want extra height without the width penalty of flotation tires.',
  '275/70R18':
    '275/70R18 is an off-road and heavy-duty OEM size on full-size SUVs and ¾-ton trucks where maximum diameter and load rating take priority.',
  '285/55R20':
    '285/55R20 is a full-size truck and SUV OEM fitment that delivers a wide footprint and tall overall diameter for towing and highway stability.',
  '285/65R20':
    '285/65R20 is a light-truck OEM size on ¾-ton and heavy-duty pickups engineered for high payload ratings and aggressive off-road packages.',
  '285/70R17':
    '285/70R17 is a classic off-road OEM size on trail-focused SUVs and trucks where extra sidewall and diameter matter more than on-road refinement.',
  '285/75R16':
    '285/75R16 is a light-truck OEM flotation-style fitment on midsize pickups and utility rigs built for load carrying and moderate trail work.',
  '295/35R21':
    '295/35R21 is a flagship performance OEM size on high-horsepower sedans and grand tourers that demand maximum grip on 21-inch wheels.',
  '305/55R20':
    '305/55R20 is a light-truck OEM size on off-road and performance pickups where a wide section width and tall sidewall support aggressive terrain use.',
  '305/70R18':
    '305/70R18 is an off-road OEM fitment on dedicated trail trucks and SUVs that need substantial overall height for rock crawling and overlanding.',
  '315/70R17':
    '315/70R17 is a maximum-traction off-road OEM size on factory trail rigs where diameter and flotation take precedence over highway noise and fuel economy.',
  'LT265/75R16':
    'LT265/75R16 is a light-truck-rated OEM size on older half-ton and midsize pickups where the LT prefix signals higher load capacity than passenger-metric equivalents.',
};

function categoryIntro(size: string, category: string): string {
  switch (category) {
    case 'performance':
      return `${size} is a factory performance fitment where automakers favor low sidewalls and wider tread for sharper steering and higher speed ratings.`;
    case 'SUV':
      return `${size} is a common SUV and crossover OEM size chosen to balance passenger comfort, cargo load, and all-season versatility.`;
    case 'light-truck':
      return `${size} is a light-truck OEM fitment sized for towing, payload, and work-truck duty cycles rather than maximum fuel economy.`;
    case 'off-road':
      return `${size} is an off-road OEM application where extra diameter and sidewall height improve trail clearance and obstacle negotiation.`;
    default:
      return `${size} is a passenger-car OEM size focused on daily comfort, rolling efficiency, and predictable replacement availability.`;
  }
}

export function getVehicleFitment(size: string): VehicleFitment[] {
  return VEHICLE_FITMENT_BY_SIZE[size] ?? [];
}

export function getFitmentIntro(size: string, category: string): string {
  return FITMENT_INTRO_BY_SIZE[size] ?? categoryIntro(size, category);
}
