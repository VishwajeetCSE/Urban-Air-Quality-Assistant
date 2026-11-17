/**
 * @fileoverview Domain Constants, AQI Breakpoints, Archetypes, and DIY IAQ Catalogs
 * @module constants
 * @author Vishwajeet Kumar
 * @license MIT
 */

/**
 * CPCB Indian National Air Quality Index (NAQI) Breakpoints for Major Pollutants
 * Values in ug/m3 (24-hour average for PM2.5, PM10, NO2; 8-hour average for O3)
 */
export const AQI_BREAKPOINTS = {
  pm25: [
    { minC: 0, maxC: 30, minI: 0, maxI: 50, label: 'Good', color: '#00e400', class: 'aqi-good' },
    { minC: 30.1, maxC: 60, minI: 51, maxI: 100, label: 'Satisfactory', color: '#92d050', class: 'aqi-satisfactory' },
    { minC: 60.1, maxC: 90, minI: 101, maxI: 200, label: 'Moderate', color: '#ffd700', class: 'aqi-moderate' },
    { minC: 90.1, maxC: 120, minI: 201, maxI: 300, label: 'Poor', color: '#ff7e00', class: 'aqi-poor' },
    { minC: 120.1, maxC: 250, minI: 301, maxI: 400, label: 'Very Poor', color: '#ff0000', class: 'aqi-very-poor' },
    { minC: 250.1, maxC: 500, minI: 401, maxI: 500, label: 'Severe', color: '#7e0023', class: 'aqi-severe' }
  ],
  pm10: [
    { minC: 0, maxC: 50, minI: 0, maxI: 50, label: 'Good', color: '#00e400' },
    { minC: 50.1, maxC: 100, minI: 51, maxI: 100, label: 'Satisfactory', color: '#92d050' },
    { minC: 100.1, maxC: 250, minI: 101, maxI: 200, label: 'Moderate', color: '#ffd700' },
    { minC: 250.1, maxC: 350, minI: 201, maxI: 300, label: 'Poor', color: '#ff7e00' },
    { minC: 350.1, maxC: 430, minI: 301, maxI: 400, label: 'Very Poor', color: '#ff0000' },
    { minC: 430.1, maxC: 600, minI: 401, maxI: 500, label: 'Severe', color: '#7e0023' }
  ],
  no2: [
    { minC: 0, maxC: 40, minI: 0, maxI: 50, label: 'Good', color: '#00e400' },
    { minC: 40.1, maxC: 80, minI: 51, maxI: 100, label: 'Satisfactory', color: '#92d050' },
    { minC: 80.1, maxC: 180, minI: 101, maxI: 200, label: 'Moderate', color: '#ffd700' },
    { minC: 180.1, maxC: 280, minI: 201, maxI: 300, label: 'Poor', color: '#ff7e00' },
    { minC: 280.1, maxC: 400, minI: 301, maxI: 400, label: 'Very Poor', color: '#ff0000' },
    { minC: 400.1, maxC: 800, minI: 401, maxI: 500, label: 'Severe', color: '#7e0023' }
  ],
  o3: [
    { minC: 0, maxC: 50, minI: 0, maxI: 50, label: 'Good', color: '#00e400' },
    { minC: 50.1, maxC: 100, minI: 51, maxI: 100, label: 'Satisfactory', color: '#92d050' },
    { minC: 100.1, maxC: 168, minI: 101, maxI: 200, label: 'Moderate', color: '#ffd700' },
    { minC: 168.1, maxC: 208, minI: 201, maxI: 300, label: 'Poor', color: '#ff7e00' },
    { minC: 208.1, maxC: 748, minI: 301, maxI: 400, label: 'Very Poor', color: '#ff0000' },
    { minC: 748.1, maxC: 1000, minI: 401, maxI: 500, label: 'Severe', color: '#7e0023' }
  ]
};

/**
 * 3 Primary Household & Community Archetypes
 */
export const ARCHETYPES = {
  apartment_family: {
    id: 'apartment_family',
    title: 'Urban Apartment Family',
    subTitle: 'Kids + Elderly at Home',
    icon: '🏢',
    description: 'High-density residential flat with shared ventilation, vulnerable dependents, and elevator shaft drafts.',
    baseInfiltration: 0.45,
    minuteVentilation: 0.012, // m3/min average
    vulnerabilityWeight: 2.2,
    defaultRoomSqFt: 350,
    primaryFocal: 'Indoor HEPA/Corsi-Rosenthal filtration, safe playground hours, child school commute safety.'
  },
  daily_commuter: {
    id: 'daily_commuter',
    title: 'Daily Commuter & Professional',
    subTitle: 'High Outdoor Transit Exposure',
    icon: '🚲',
    description: 'Spends 2-4 hours daily in active transit across congested road corridors with heavy diesel exhaust.',
    baseInfiltration: 0.60,
    minuteVentilation: 0.035, // m3/min during exertion/walking
    vulnerabilityWeight: 1.8,
    defaultRoomSqFt: 250,
    primaryFocal: 'Transit route optimization, N95 respirators, in-cabin AC recirculation, carpool swaps.'
  },
  society_resident: {
    id: 'society_resident',
    title: 'Housing Society / Community Resident',
    subTitle: 'Collective RWA Action & Neighborhood Impact',
    icon: '🏘️',
    description: 'Focuses on multi-family collective mitigation, shared diesel generator policies, anti-smog water misting, and leaf composting.',
    baseInfiltration: 0.50,
    minuteVentilation: 0.015,
    vulnerabilityWeight: 1.6,
    defaultRoomSqFt: 500,
    primaryFocal: 'Zero-idle gates, DG genset curfew, leaf composting pits, community clean air advisory.'
  }
};

/**
 * Vulnerability Factors
 */
export const VULNERABILITY_FACTORS = {
  asthma: { id: 'asthma', label: 'Asthma / COPD / Respiratory', weight: 2.5, criticalThreshold: 30 },
  infants: { id: 'infants', label: 'Infants & Toddlers (< 5 yrs)', weight: 2.3, criticalThreshold: 25 },
  seniors: { id: 'seniors', label: 'Senior Citizens (65+ yrs)', weight: 2.0, criticalThreshold: 35 },
  pregnant: { id: 'pregnant', label: 'Expectant Mothers', weight: 2.1, criticalThreshold: 30 }
};

/**
 * Commute Modes and Carbon Emission Factors (kg CO2e per passenger km)
 */
export const COMMUTE_MODES = {
  metro: { id: 'metro', name: 'Metro / Rapid Rail', ef: 0.020, pmRisk: 'Low (Filtered Cabin)' },
  bus: { id: 'bus', name: 'Electric / CNG Bus', ef: 0.035, pmRisk: 'Moderate' },
  two_wheeler: { id: 'two_wheeler', name: 'Petrol Motorcycle / Scooter', ef: 0.062, pmRisk: 'Very High (Direct Inhalation)' },
  car: { id: 'car', name: 'Solo Petrol / Diesel Car', ef: 0.175, pmRisk: 'Moderate (If Recirculate ON)' },
  carpool: { id: 'carpool', name: 'Shared Carpool (3+ Persons)', ef: 0.058, pmRisk: 'Moderate' },
  cycle_walk: { id: 'cycle_walk', name: 'Walking / Bicycling', ef: 0.000, pmRisk: 'High during smog; Great in safe window' }
};

/**
 * Benchmark Indian Urban Smog Hotspots
 */
export const HOTSPOT_CITIES = {
  delhi: {
    id: 'delhi',
    name: 'Delhi-NCR',
    state: 'Delhi',
    baseAQI: 385,
    basePM25: 280,
    inversionFactor: 1.85,
    description: 'Gangetic cold pool trap with severe agricultural smoke and vehicular boundary inversion.'
  },
  bhopal: {
    id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    baseAQI: 315,
    basePM25: 145,
    inversionFactor: 1.40,
    description: 'Central plateau valley trap with morning radiational fog and vehicular accumulation.'
  },
  patna: {
    id: 'patna',
    name: 'Patna',
    state: 'Bihar',
    baseAQI: 395,
    basePM25: 245,
    inversionFactor: 1.75,
    description: 'Dense river basin thermal inversion with low wind dispersal speeds.'
  },
  lucknow: {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    baseAQI: 365,
    basePM25: 215,
    inversionFactor: 1.65,
    description: 'Dense urban core with morning ground-level haze and nocturnal radiation inversions.'
  },
  kolkata: {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    baseAQI: 340,
    basePM25: 180,
    inversionFactor: 1.50,
    description: 'Coastal-plain boundary layer compression with high humidity and soot.'
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    baseAQI: 265,
    basePM25: 115,
    inversionFactor: 1.25,
    description: 'Coastal breeze transition zone with morning construction dust and diesel haze.'
  },
  jaipur: {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    baseAQI: 325,
    basePM25: 160,
    inversionFactor: 1.45,
    description: 'Semi-arid basin with mineral dust resuspension and sharp winter temperature drops.'
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    baseAQI: 95,
    basePM25: 58,
    inversionFactor: 1.15,
    description: 'High-altitude plateau with moderate micro-inversion in traffic corridors.'
  }
};

/**
 * Diurnal Hourly Winter Inversion Curve Multipliers (Hour 0 to 23)
 * Calibrated against atmospheric boundary layer data in northern India.
 */
export const DIURNAL_SMOG_CURVE = [
  1.32, 1.36, 1.42, 1.48, 1.55, 1.68, // 00:00 - 05:00: Deepening nocturnal radiation inversion
  1.84, 1.96, 1.88, 1.58, // 06:00 - 09:00: CRITICAL MORNING SMOG TRAP (Rush hour + lowest boundary layer)
  1.22, 0.96, // 10:00 - 11:00: Solar warming lifts inversion lid
  0.70, 0.64, 0.68, 0.76, // 12:00 - 15:00: CONVECTIVE SOLAR VENTILATION WINDOW (Safest outdoor hours)
  0.98, 1.24, // 16:00 - 17:00: Late afternoon cooling & sunset collapse
  1.56, 1.80, 1.86, 1.74, // 18:00 - 21:00: SECONDARY EVENING ACCUMULATION (Cooking smoke + rush hour)
  1.52, 1.38 // 22:00 - 23:00: Stable nocturnal inversion holds
];

/**
 * Practical DIY Indoor Air Quality (IAQ) Hacks
 */
export const DIY_IAQ_HACKS = [
  {
    id: 'corsi_rosenthal',
    name: 'DIY Corsi-Rosenthal Box Purifier',
    tag: 'Highest CADR',
    reduction: 0.75, // 75% indoor PM2.5 reduction
    costINR: 4200,
    commercialEquivINR: 28000,
    description: 'A 20-inch box fan paired with 4 MERV-13 filters and a cardboard shroud creates 550+ CFM CADR at 1/6th the cost of commercial purifiers.',
    steps: [
      'Tape 4 MERV-13 / HEPA filters into a square cube with airflow pointing inwards.',
      'Place the 20" box fan on top, blowing upwards away from the box.',
      'Cut a cardboard circular shroud on top of the fan to eliminate blade-tip vortex backflow.',
      'Seal all seams and bottom cardboard floor with duct tape.'
    ]
  },
  {
    id: 'window_sealing',
    name: 'Acoustic & Weatherstrip Draft Sealing',
    tag: 'Budget Shield',
    reduction: 0.20,
    costINR: 350,
    commercialEquivINR: 2500,
    description: 'Apply silicone foam weatherstripping tapes to exterior sliding door gaps and deploy door snakes along exterior thresholds.',
    steps: [
      'Clean window and door sills with rubbing alcohol.',
      'Apply self-adhesive EPDM rubber foam tape along window frames.',
      'Roll a damp towel or weighted fabric door-snake at the bottom of main entrance doors.'
    ]
  },
  {
    id: 'wet_mopping',
    name: 'Microfibre Wet-Mopping Protocol',
    tag: 'Zero Cost Habit',
    reduction: 0.25,
    costINR: 150,
    commercialEquivINR: 4000,
    description: 'Dry broom sweeping resuspends 70% of settled fine particles (PM2.5/PM10) straight into alveolar breathing zones. Wet-mopping traps them instantly.',
    steps: [
      'Never dry sweep during winter smog season.',
      'Mop hard floors with a damp microfibre mop once in the morning and once before bedtime.',
      'Wipe electronics and tabletops with damp electrostatic cloths.'
    ]
  },
  {
    id: 'kitchen_exhaust',
    name: 'Kitchen Exhaust Pre-Purge & Lidded Cooking',
    tag: 'Cooking Protocol',
    reduction: 0.22,
    costINR: 0,
    commercialEquivINR: 0,
    description: 'Frying spices and unvented gas burners release volatile organic compounds and PM2.5 up to 800 µg/m³. Pre-exhaust clears it before accumulation.',
    steps: [
      'Turn on kitchen exhaust fan 2 minutes BEFORE lighting the gas stove or induction.',
      'Keep cookware lidded to prevent aerosolized oil droplets.',
      'Keep kitchen doors closed to prevent smoke migration into living and sleeping chambers.'
    ]
  },
  {
    id: 'phytoremediation',
    name: 'NASA Botanical Phytoremediation Roster',
    tag: 'Bio-Filter',
    reduction: 0.12,
    costINR: 1200,
    commercialEquivINR: 6000,
    description: 'Living bio-filters absorb VOCs (benzene, formaldehyde) and transpire clean humidity that settles suspended micro-dust.',
    plants: [
      { name: 'Snake Plant (Sansevieria)', role: 'Nighttime CAM O2 release (ideal for bedrooms)', care: 'Low water' },
      { name: 'Areca Palm', role: 'Daytime humidity transpiring (settles particulate dust)', care: 'Bright indirect light' },
      { name: 'Spider Plant', role: 'Carbon monoxide and formaldehyde removal', care: 'Resilient' },
      { name: 'Golden Pothos (Money Plant)', role: 'Xylene absorption and leaf particulate interception', care: 'Easy' }
    ]
  },
  {
    id: 'incense_ban',
    name: 'Cessation of Incense (Agarbatti) & Coils',
    tag: 'Critical Cessation',
    reduction: 0.35,
    costINR: 0,
    commercialEquivINR: 0,
    description: 'A single burning agarbatti emits 250-450 µg/m³ of particulate matter and polycyclic aromatic hydrocarbons in closed rooms.',
    steps: [
      'Replace burning agarbatti / dhoop with non-thermal electric reed diffusers or LED pooja lamps.',
      'Replace mosquito coils (which equal ~100 cigarettes in PM2.5 load) with window mesh screens and plug-in electric liquid vaporizers.'
    ]
  }
];

/**
 * Community Smog Shield & Citizen Action Plan
 */
export const COMMUNITY_SHIELD_PROTOCOLS = [
  {
    id: 'zero_idle',
    title: 'Zero-Idling Gate Zone Enforcement',
    scope: 'Society Gates & School Drop-offs',
    impact: 'Prevents localized 500+ µg/m³ diesel soot spikes where children assemble.',
    action: 'Security guards to instruct school vans, delivery vehicles, and cabs to kill engines if stopped for > 30 seconds.'
  },
  {
    id: 'dg_curfew',
    title: 'Diesel Generator (DG) Rationalization & Battery Banking',
    scope: 'Society Infrastructure',
    impact: 'Reduces up to 80 kg CO2e and high sulfur particulates per power-cut hour.',
    action: 'Restrict DG usage strictly to emergency lifts and water pumps; prohibit aesthetic garden lighting on DG power.'
  },
  {
    id: 'leaf_compost',
    title: 'Ban on Waste & Garden Leaf Burning',
    scope: 'Horticulture & Common Grounds',
    impact: 'Avoids 1.4 kg CO2e and 18g of toxic PM2.5 per kg of dry leaves.',
    action: 'Construct on-site compost pits for sweepings and dry foliage; incentivize gardening staff with composting bonuses.'
  },
  {
    id: 'water_misting',
    title: 'Anti-Smog Boundary Water Misting',
    scope: 'Internal Society Roads & Perimeters',
    impact: 'Suppresses 30-40% of resuspended road dust and particulate matter.',
    action: 'Use recycled STP water via spray hoses along boundary fences between 7 AM - 9 AM and 5 PM - 7 PM.'
  }
];
