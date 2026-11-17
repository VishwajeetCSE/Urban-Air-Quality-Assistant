/**
 * SmogGuard AI — Constants & Domain Reference Data
 * Engineered for Indian Urban Winter Smog (CPCB NAQI Standards & Atmospheric Inversion Models)
 */

export const CITIES = {
  delhi: {
    name: 'Delhi-NCR',
    state: 'Delhi',
    basePM25: 280,
    inversionFactor: 1.85,
    description: 'Severe winter smog zone (Surface radiation inversion & transboundary smoke)',
    lat: 28.6139,
    lon: 77.2090
  },
  bhopal: {
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    basePM25: 145,
    inversionFactor: 1.40,
    description: 'Central plateau valley trap with morning cold fog and vehicular accumulation',
    lat: 23.2599,
    lon: 77.4126
  },
  patna: {
    name: 'Patna',
    state: 'Bihar',
    basePM25: 240,
    inversionFactor: 1.75,
    description: 'Gangetic plains heavy river basin inversion and cold pool trap',
    lat: 25.5941,
    lon: 85.1376
  },
  lucknow: {
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    basePM25: 210,
    inversionFactor: 1.65,
    description: 'Gangetic urban core with heavy nocturnal radiation inversion',
    lat: 26.8467,
    lon: 80.9462
  },
  kolkata: {
    name: 'Kolkata',
    state: 'West Bengal',
    basePM25: 175,
    inversionFactor: 1.50,
    description: 'Coastal-plain boundary layer compression with high humidity smog',
    lat: 22.5726,
    lon: 88.3639
  },
  jaipur: {
    name: 'Jaipur',
    state: 'Rajasthan',
    basePM25: 155,
    inversionFactor: 1.45,
    description: 'Semi-arid basin with mineral dust resuspension and night temperature drops',
    lat: 26.9124,
    lon: 75.7873
  },
  mumbai: {
    name: 'Mumbai',
    state: 'Maharashtra',
    basePM25: 110,
    inversionFactor: 1.25,
    description: 'Coastal breeze transition zone with morning construction and transit haze',
    lat: 19.0760,
    lon: 72.8777
  },
  bengaluru: {
    name: 'Bengaluru',
    state: 'Karnataka',
    basePM25: 55,
    inversionFactor: 1.15,
    description: 'High-altitude plateau with mild winter micro-inversion in valley corridors',
    lat: 12.9716,
    lon: 77.5946
  }
};

export const HOUSING_TYPES = {
  apartment: {
    id: 'apartment',
    name: 'Apartment (Mid/High-Rise)',
    infiltrationRate: 0.45, // 45% of outdoor PM2.5 penetrates unsealed windows/balconies
    description: 'Elevated floors receive less coarse dust, but fine PM2.5 infiltrates through elevator shafts and balcony drafts.',
    icon: '🏢'
  },
  house: {
    id: 'house',
    name: 'Independent House (G+1/G+2)',
    infiltrationRate: 0.65, // 65% penetration from ground-level boundary layer
    description: 'Direct ground-level exposure to street dust, garden leaf smoke, and vehicular cold-starts.',
    icon: '🏡'
  },
  slum: {
    id: 'slum',
    name: 'Informal Settlement / Dense Low-Rise',
    infiltrationRate: 0.88, // 88% penetration due to unsealed tin roofs & shared walls
    description: 'High vulnerability: direct proximity to chulha/biomass fires and limited weather-stripping.',
    icon: '🏘️'
  }
};

export const PERSONA_ARCHETYPES = {
  infant: {
    id: 'infant',
    name: 'Infants & Expectant Mothers',
    badge: '👶 High Lung Permeability',
    minuteVentilation: 0.008, // m3/min
    vulnerabilityWeight: 2.5,
    safeThresholdPM25: 25, // ug/m3
    priorityAdvice: 'Underdeveloped alveolar blood-gas barrier. Strict indoor air filtration; avoid morning outings.',
    focusTimes: ['06:00-10:00', '19:00-22:00']
  },
  school_child: {
    id: 'school_child',
    name: 'School-Age Children',
    badge: '🎒 Morning Commute & Recess',
    minuteVentilation: 0.012, // m3/min
    vulnerabilityWeight: 2.0,
    safeThresholdPM25: 45,
    priorityAdvice: 'Peak exposure at morning school bus stop. Reschedule sports practice to afternoon solar window (12-3 PM).',
    focusTimes: ['07:00-09:00', '14:00-16:00']
  },
  elderly_asthma: {
    id: 'elderly_asthma',
    name: 'Elderly & Chronic Respiratory / Asthma / COPD',
    badge: '🧓 Bronchospasm & Cardiac Risk',
    minuteVentilation: 0.015, // m3/min
    vulnerabilityWeight: 2.8,
    safeThresholdPM25: 30,
    priorityAdvice: 'Cold dry smog triggers acute airway constriction. Zero outdoor morning walks before 11:30 AM.',
    focusTimes: ['05:30-09:30', '18:30-22:00']
  },
  commuter: {
    id: 'commuter',
    name: 'Outdoor Commuters & Gig Workers',
    badge: '🚲 High-Inhalation Transit',
    minuteVentilation: 0.035, // m3/min during exertion
    vulnerabilityWeight: 1.8,
    safeThresholdPM25: 60,
    priorityAdvice: 'Active physical exertion increases minute ventilation 2.5x. Use certified N95/FFP2 masks with tight seal.',
    focusTimes: ['08:00-10:30', '18:00-20:30']
  },
  rwa_community: {
    id: 'rwa_community',
    name: 'Housing Society & RWA Leaders',
    badge: '🏘️ Collective Community Action',
    minuteVentilation: 0.015, // m3/min
    vulnerabilityWeight: 1.5,
    safeThresholdPM25: 50,
    priorityAdvice: 'Coordinate community solutions: zero-idle zones at gates, DG genset curfew, leaf composting.',
    focusTimes: ['07:00-11:00', '18:00-22:00']
  }
};

/**
 * Atmospheric Diurnal Smog Inversion Curve (Hour 0 to 23)
 * Derived from CPCB and meteorological boundary layer studies in Northern India.
 * Reflects nocturnal surface cooling, radiation inversion traps, and solar convective mixing.
 */
export const DIURNAL_INVERSION_MULTIPLIERS = [
  1.30, // 00:00 - Night inversion deepening
  1.35, // 01:00
  1.40, // 02:00
  1.45, // 03:00 - Maximum radiative cooling
  1.52, // 04:00
  1.65, // 05:00 - Cold air pool at ground level
  1.82, // 06:00 - Sunrise inversion trap + morning cold start emissions
  1.95, // 07:00 - PEAK MORNING SMOG TRAP
  1.90, // 08:00 - Heavy morning commute rush trapped under low boundary layer
  1.60, // 09:00 - Sun begins warming ground
  1.25, // 10:00 - Inversion layer begins breaking up
  0.95, // 11:00 - Convective mixing starts
  0.72, // 12:00 - SOLAR VENTILATION WINDOW OPENS
  0.65, // 13:00 - LOWEST DIURNAL PM2.5 (Maximum planetary boundary layer height)
  0.68, // 14:00 - Optimal window for ventilation, sports, errands
  0.78, // 15:00 - Solar ventilation window closing
  0.98, // 16:00 - Late afternoon cooling
  1.25, // 17:00 - Sunset, boundary layer rapidly compresses
  1.55, // 18:00 - Evening commute emissions trapped
  1.78, // 19:00 - PEAK EVENING SMOG ACCUMULATION
  1.85, // 20:00 - Cooking smoke, heating fires, commercial traffic
  1.75, // 21:00 - Continued night trapping
  1.55, // 22:00 - Traffic diminishes, stable inversion holds
  1.40  // 23:00
];

/**
 * CPCB Indian National Air Quality Index (NAQI) Breakpoints for PM2.5 (24-hr average in ug/m3)
 */
export const CPCB_NAQI_BREAKPOINTS = [
  { minPM: 0, maxPM: 30, minAQI: 0, maxAQI: 50, label: 'Good', color: '#00e400', class: 'aqi-good' },
  { minPM: 30.1, maxPM: 60, minAQI: 51, maxAQI: 100, label: 'Satisfactory', color: '#92d050', class: 'aqi-satisfactory' },
  { minPM: 60.1, maxPM: 90, minAQI: 101, maxAQI: 200, label: 'Moderate', color: '#ffff00', class: 'aqi-moderate' },
  { minPM: 90.1, maxPM: 120, minAQI: 201, maxAQI: 300, label: 'Poor', color: '#ff7e00', class: 'aqi-poor' },
  { minPM: 120.1, maxPM: 250, minAQI: 301, maxAQI: 400, label: 'Very Poor', color: '#ff0000', class: 'aqi-very-poor' },
  { minPM: 250.1, maxPM: 500, minAQI: 401, maxAQI: 500, label: 'Severe', color: '#7e0023', class: 'aqi-severe' }
];

export const IAQ_HACKS_CATALOG = [
  {
    id: 'corsi_rosenthal',
    name: 'Corsi-Rosenthal Box (DIY HEPA/MERV13 Purifier)',
    reduction: 0.75, // 75% reduction in indoor PM2.5
    costRatio: 0.18, // 18% of commercial purifier cost
    description: 'Box fan + 4-5 MERV13 / HEPA filters taped into a cube with a cardboard shroud. Delivers 500+ CFM CADR at ₹4,000.',
    tag: 'Highest Impact',
    icon: '🌀'
  },
  {
    id: 'wet_mopping',
    name: 'Wet-Mopping Over Dry Broom Sweeping',
    reduction: 0.25, // 25% reduction
    costRatio: 0.02,
    description: 'Dry brooms resuspend 60-80% of settled fine PM2.5 into breathing height. Wet microfibre mopping locks particulates.',
    tag: 'Zero Cost',
    icon: '🧹'
  },
  {
    id: 'kitchen_exhaust',
    name: 'Exhaust Fan & Covered Lid Protocol',
    reduction: 0.20,
    costRatio: 0.05,
    description: 'Turn on exhaust 2 min before gas ignition; keep pots covered to prevent oil vaporization that spikes indoor PM2.5 to 800+ ug/m3.',
    tag: 'Daily Habit',
    icon: '🍳'
  },
  {
    id: 'draft_sealing',
    name: 'Door Snake & Window Weatherstripping',
    reduction: 0.15,
    costRatio: 0.08,
    description: 'Seal the 1-2 cm gap below exterior doors and window joints using foam strips or rolled towels during inversion hours.',
    tag: 'Quick Fix',
    icon: '🚪'
  },
  {
    id: 'botanical_filters',
    name: 'Botanical Phytoremediation (NASA Clean Air Plants)',
    reduction: 0.10,
    costRatio: 0.12,
    description: 'Snake Plants (night O2), Areca Palm, and Spider Plants actively absorb VOCs and transpire clean humidity.',
    tag: 'Bio-Filter',
    icon: '🪴'
  },
  {
    id: 'no_incense',
    name: 'Cessation of Agarbatti & Mosquito Coils',
    reduction: 0.35, // Removes massive internal spike
    costRatio: 0.0,
    description: 'A single burning agarbatti emits 200-400 ug/m3 of PM2.5 and benzene inside closed rooms. Switch to electric diffusers or LED lamps.',
    tag: 'Crucial',
    icon: '🕯️'
  }
];

export const NASA_PLANTS = [
  {
    name: 'Snake Plant (Sansevieria)',
    nickname: "Mother-in-Law's Tongue",
    role: 'Night Oxygen & Benzene Removal',
    pathway: 'CAM Photosynthesis (Emits O2 at night, perfect for bedrooms)',
    careLevel: 'Very Low (Needs water once every 2 weeks)'
  },
  {
    name: 'Areca Palm (Dypsis lutescens)',
    nickname: 'Butterfly Palm',
    role: 'Natural Humidifier & Toluene Filter',
    pathway: 'Transpires 1 liter of moisture per 24 hours, settling airborne dust',
    careLevel: 'Medium (Bright indirect light)'
  },
  {
    name: 'Spider Plant (Chlorophytum comosum)',
    nickname: 'Air Ribbon',
    role: 'Formaldehyde & Carbon Monoxide Absorber',
    pathway: 'High stomatal conductance; resilient to high winter smog',
    careLevel: 'Low (Forgiving, thrives indoors)'
  },
  {
    name: 'Money Plant (Golden Pothos)',
    nickname: "Devil's Ivy",
    role: 'Xylene & Particulate Interception',
    pathway: 'Large waxy leaf surface collects micro-dust; wipe weekly',
    careLevel: 'Very Low (Grows in water or soil)'
  }
];

export const SUSTAINABLE_SWAPS = {
  transit: {
    ice_petrol_car: { name: 'Solo Petrol Car/SUV', ef: 0.17 }, // kg CO2e / passenger km
    ice_diesel_car: { name: 'Solo Diesel Car/SUV', ef: 0.19 },
    two_wheeler_petrol: { name: 'Petrol Motorcycle/Scooter', ef: 0.06 },
    metro_train: { name: 'Metro Rail / Rapid Rail', ef: 0.02 },
    electric_bus: { name: 'Electric Bus / EV Carpool', ef: 0.028 },
    cycle_walk: { name: 'Bicycle / Walking (Afternoon Window)', ef: 0.00 }
  },
  heating: {
    biomass_angithi: { name: 'Wood / Charcoal Angithi / Coal Fire', co2PerMonth: 65, pmRisk: 'Extreme (800+ ug/m3)' },
    unvented_gas_heater: { name: 'LPG / Gas Space Heater', co2PerMonth: 38, pmRisk: 'High NO2/CO' },
    oil_radiator: { name: 'Electric Oil-Filled Radiator / BLDC Heat Pump', co2PerMonth: 18, pmRisk: 'Zero Indoor PM' }
  },
  waste: {
    leaf_burning: { name: 'Open Leaf / Trash Burning', co2PerKg: 1.4, pm25EmittedPerKg: 18.0 },
    leaf_composting: { name: 'Community Composting Pit / Mulching', co2PerKg: 0.1, pm25EmittedPerKg: 0.0 }
  }
};
