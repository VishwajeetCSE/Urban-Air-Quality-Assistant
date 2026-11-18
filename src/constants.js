/**
 * @fileoverview Domain Constants, Environmental Breakpoints, and Community Catalogs
 * @module constants
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

/**
 * CPCB (Central Pollution Control Board - India) National Air Quality Index (NAQI) Breakpoints
 * Formula: I = [ (I_hi - I_lo) / (B_hi - B_lo) ] * (C - B_lo) + I_lo
 */
export const CPCB_BREAKPOINTS = {
  pm25: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50, category: 'Good', color: '#10b981' },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200, category: 'Moderate', color: '#f59e0b' },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50, category: 'Good', color: '#10b981' },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200, category: 'Moderate', color: '#f59e0b' },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ],
  no2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50, category: 'Good', color: '#10b981' },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200, category: 'Moderate', color: '#f59e0b' },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 401, cHigh: 600, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ],
  so2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50, category: 'Good', color: '#10b981' },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200, category: 'Moderate', color: '#f59e0b' },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 1601, cHigh: 2400, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ],
  co: [
    { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50, category: 'Good', color: '#10b981' },
    { cLow: 1.1, cHigh: 2.0, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 2.1, cHigh: 10.0, iLow: 101, iHigh: 200, category: 'Moderate', color: '#f59e0b' },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 34.1, cHigh: 50.0, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ],
  o3: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50, category: 'Good', color: '#10b981' },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#84cc16' },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200, category: 'Moderate', color: '#f59e0b' },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300, category: 'Poor', color: '#f97316' },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#ef4444' },
    { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500, category: 'Severe', color: '#7f1d1d' }
  ]
};

/**
 * WHO 2021 Global Air Quality Guidelines (24-hour mean benchmark limits)
 */
export const WHO_GUIDELINE_24HR = {
  pm25: 15,  // µg/m³
  pm10: 45,  // µg/m³
  no2: 25,   // µg/m³
  so2: 40,   // µg/m³
  co: 4.0,   // mg/m³
  o3: 100    // µg/m³ (8-hour)
};

/**
 * Household & Community Demographic Archetypes
 */
export const ARCHETYPES = {
  residential_family: {
    id: 'residential_family',
    title: 'Urban Multi-Gen Household',
    icon: '👨‍👩‍👧‍👦',
    description: 'Apartment family with school-age kids and senior parents facing peak winter infiltration.',
    defaultMinuteVentilation: 0.014, // m3/min average
    baselineIndoorHours: 19,
    priorityFocus: 'Room-by-room filtration scheduling and morning school commute smog protection.'
  },
  vulnerable_care: {
    id: 'vulnerable_care',
    title: 'Care Facility / School / Daycare',
    icon: '🏫',
    description: 'Educational institution, nursery, or eldercare center managing high occupancy risk.',
    defaultMinuteVentilation: 0.013,
    baselineIndoorHours: 21,
    priorityFocus: 'Continuous high-ACH air cleaning, carbon VOC scrubbers, and zero-exertion smog recesses.'
  },
  urban_commuter: {
    id: 'urban_commuter',
    title: 'Daily City Commuter & Worker',
    icon: '💼',
    description: 'Working professional spending 2+ hours daily navigating congested urban transit canyons.',
    defaultMinuteVentilation: 0.018,
    baselineIndoorHours: 14,
    priorityFocus: 'Commute corridor optimization, N95 seal compliance, and evening re-entry protocols.'
  },
  community_rwa: {
    id: 'community_rwa',
    title: 'Housing Society / RWA Admin',
    icon: '🏢',
    description: 'Residential community leader managing generator bans, dust dampening, and clean shared spaces.',
    defaultMinuteVentilation: 0.015,
    baselineIndoorHours: 18,
    priorityFocus: 'Collective diesel generator restrictions, mist cannon deployment, and shared lobby HEPA zones.'
  }
};

/**
 * Hyperlocal Urban Micro-Zones (influencing localized dispersion and pollutant profiles)
 */
export const MICRO_ZONES = {
  traffic_canyon: {
    id: 'traffic_canyon',
    name: 'Traffic Arterial / Urban Canyon',
    description: 'Enclosed multi-lane corridors with trapped vehicle exhaust and slow cross-ventilation.',
    pm25Multiplier: 1.25,
    no2Multiplier: 1.45,
    peakInversionHour: 8
  },
  dense_residential: {
    id: 'dense_residential',
    name: 'High-Density Residential Cluster',
    description: 'Closely spaced multi-story blocks prone to kitchen exhaust and evening biomass smoke.',
    pm25Multiplier: 1.15,
    no2Multiplier: 1.10,
    peakInversionHour: 7
  },
  industrial_fringe: {
    id: 'industrial_fringe',
    name: 'Industrial Border & Logistics Hub',
    description: 'Zones near manufacturing or freight terminals with elevated SO2 and fugitive dust.',
    pm25Multiplier: 1.35,
    no2Multiplier: 1.20,
    peakInversionHour: 6
  },
  peri_urban: {
    id: 'peri_urban',
    name: 'Peri-Urban & Educational Belt',
    description: 'Open green spaces with lower vehicular density but higher winter surface thermal inversion.',
    pm25Multiplier: 0.90,
    no2Multiplier: 0.75,
    peakInversionHour: 7
  }
};

/**
 * Key Indian Urban Hotspot Cities
 */
export const HOTSPOT_CITIES = {
  delhi: { name: 'Delhi NCR', baseAQI: 360, inversionSeverity: 'Extreme', baselinePM25: 245 },
  mumbai: { name: 'Mumbai Coast', baseAQI: 165, inversionSeverity: 'Moderate', baselinePM25: 75 },
  kolkata: { name: 'Kolkata Metro', baseAQI: 235, inversionSeverity: 'High', baselinePM25: 140 },
  patna: { name: 'Patna Plains', baseAQI: 330, inversionSeverity: 'Severe', baselinePM25: 220 },
  lucknow: { name: 'Lucknow Belt', baseAQI: 290, inversionSeverity: 'Severe', baselinePM25: 185 },
  bhopal: { name: 'Bhopal Central', baseAQI: 180, inversionSeverity: 'Moderate', baselinePM25: 95 },
  bengaluru: { name: 'Bengaluru Plateau', baseAQI: 95, inversionSeverity: 'Low', baselinePM25: 38 },
  hyderabad: { name: 'Hyderabad Ring', baseAQI: 145, inversionSeverity: 'Moderate', baselinePM25: 65 }
};

/**
 * Vulnerability Modifiers for Physiological Risk Assessment
 */
export const VULNERABILITY_FACTORS = {
  asthma: { label: 'Asthma / Chronic Respiratory Illness', weight: 1.40, riskNote: 'Airway hyper-responsiveness triggered at AQI > 100' },
  infants: { label: 'Infants & Toddlers (< 5 years)', weight: 1.35, riskNote: 'Higher minute ventilation per kg body mass; immature alveolar defense' },
  seniors: { label: 'Senior Citizens (65+ years)', weight: 1.30, riskNote: 'Elevated cardiac ischemia and stroke risk from ultrafine PM2.5 translocation' },
  cardiac: { label: 'Hypertension or Cardiovascular Disease', weight: 1.30, riskNote: 'Autonomic nervous dysfunction during acute PM2.5 spikes' },
  pregnant: { label: 'Expectant Mothers', weight: 1.25, riskNote: 'Transplacental particulate transfer risks fetal development' }
};

/**
 * Commute Mobility Modes & Direct Environmental Emission Factors
 * Emission factor: kg CO2e per passenger-kilometer (pkm)
 */
export const COMMUTE_MODES = {
  metro: { label: 'Metro Rail / Suburban Train', co2ePerKm: 0.025, pm25ExposureFactor: 0.35, costPerKm: 1.8 },
  electric_bus: { label: 'Electric / AC Transit Bus', co2ePerKm: 0.040, pm25ExposureFactor: 0.50, costPerKm: 2.2 },
  ev_twowheeler: { label: 'Electric Scooter (EV)', co2ePerKm: 0.030, pm25ExposureFactor: 0.85, costPerKm: 0.8 },
  shared_auto: { label: 'CNG Shared Auto / Rickshaw', co2ePerKm: 0.075, pm25ExposureFactor: 0.90, costPerKm: 3.5 },
  petrol_car: { label: 'Solo Petrol Compact Car', co2ePerKm: 0.170, pm25ExposureFactor: 0.55, costPerKm: 8.5 },
  diesel_suv: { label: 'Solo Diesel SUV', co2ePerKm: 0.240, pm25ExposureFactor: 0.60, costPerKm: 12.0 }
};

/**
 * Engineered 3-Stage DIY Air Scrubber Specifications
 */
export const DIY_PURIFIER_CONFIGS = {
  merv13_box: {
    id: 'merv13_box',
    name: '3-Stage Corsi-Rosenthal Hybrid Box',
    description: '4x MERV-13 pleated panels + activated carbon mesh tray + 20-inch box fan.',
    estimatedCostINR: 3800,
    cadrCFM: 520,
    pm25Efficiency: 0.88,
    vocRemoval: 'High',
    filterLifeMonths: 4
  },
  comp_hepa: {
    id: 'comp_hepa',
    name: 'Commercial True HEPA Purifier (H13)',
    description: 'Standard retail consumer purifier with proprietary replacement filters.',
    estimatedCostINR: 19500,
    cadrCFM: 260,
    pm25Efficiency: 0.99,
    vocRemoval: 'Moderate',
    filterLifeMonths: 6
  },
  dual_fan_cr: {
    id: 'dual_fan_cr',
    name: 'High-Volume Dual-Fan Community Purifier',
    description: 'Designed for classrooms, elder centers, or residential society clubhouses.',
    estimatedCostINR: 7200,
    cadrCFM: 950,
    pm25Efficiency: 0.87,
    vocRemoval: 'Very High',
    filterLifeMonths: 3
  }
};

/**
 * Validated Botanical Phytoremediation Roster (NASA Clean Air Study validated)
 */
export const NASA_PLANT_ROSTER = [
  {
    id: 'snake_plant',
    name: 'Snake Plant (Sansevieria Trifasciata)',
    localName: 'Mother-in-law’s Tongue',
    primaryPollutants: ['Formaldehyde', 'Benzene', 'CO2 at Night'],
    crassulaceanAcidMetabolism: true,
    lightRequirement: 'Low to Indirect',
    unitsPer100SqFt: 2
  },
  {
    id: 'areca_palm',
    name: 'Areca Palm (Chrysalidocarpus Lutescens)',
    localName: 'Golden Cane Palm',
    primaryPollutants: ['Toluene', 'Xylene', 'Moisture balance'],
    crassulaceanAcidMetabolism: false,
    lightRequirement: 'Filtered Bright',
    unitsPer100SqFt: 3
  },
  {
    id: 'money_plant',
    name: 'Money Plant (Epipremnum Aureum)',
    localName: 'Devil’s Ivy',
    primaryPollutants: ['Benzene', 'Formaldehyde', 'Trichloroethylene'],
    crassulaceanAcidMetabolism: false,
    lightRequirement: 'Low / Shade Tolerant',
    unitsPer100SqFt: 2
  },
  {
    id: 'spider_plant',
    name: 'Spider Plant (Chlorophytum Comosum)',
    localName: 'Airplane Plant',
    primaryPollutants: ['Carbon Monoxide', 'Ethylbenzene'],
    crassulaceanAcidMetabolism: false,
    lightRequirement: 'Indirect Sun',
    unitsPer100SqFt: 2
  }
];

/**
 * Community Collective Smog Defense Catalog
 */
export const COMMUNITY_ACTIONS = [
  {
    id: 'ban_dg_gensets',
    title: 'Diesel Generator (DG) Curtailment Protocol',
    category: 'Emission Abatement',
    impactPM25AvoidedKgPerDay: 4.8,
    co2eAvoidedKgPerDay: 42.0,
    costLevel: 'Zero Cost',
    description: 'Transition non-emergency backup to battery ESS or grid priority during Severe AQI triggers.'
  },
  {
    id: 'water_misting_canons',
    title: 'Boundary Dust Anti-Smog Water Misting',
    category: 'Particulate Suppression',
    impactPM25AvoidedKgPerDay: 3.2,
    co2eAvoidedKgPerDay: 6.0,
    costLevel: 'Low',
    description: 'Targeted fine-droplet atomized water spray at perimeter walls between 7-10 AM to settle coarse PM.'
  },
  {
    id: 'zero_waste_burning_patrol',
    title: 'Night Vigil Against Biomass / Leaf Incineration',
    category: 'Strict Enforcement',
    impactPM25AvoidedKgPerDay: 6.5,
    co2eAvoidedKgPerDay: 58.0,
    costLevel: 'Zero Cost',
    description: 'Equip society security guards with direct reporting protocols and mulch bins for winter leaves.'
  },
  {
    id: 'staggered_work_transit',
    title: 'Society-Wide Staggered Commute & Carpool Pool',
    category: 'Traffic Reduction',
    impactPM25AvoidedKgPerDay: 2.1,
    co2eAvoidedKgPerDay: 85.0,
    costLevel: 'Savings',
    description: 'Coordinate shared EV/CNG carpooling clusters leaving after 10 AM to miss the peak smog inversion trap.'
  },
  {
    id: 'hepa_clean_room_oasis',
    title: 'Shared Clubhouse Clean Air Emergency Shelter',
    category: 'Vulnerable Care',
    impactPM25AvoidedKgPerDay: 1.8,
    co2eAvoidedKgPerDay: 12.0,
    costLevel: 'Medium',
    description: 'Convert community hall into a positive-pressure, multi-filter refuge for seniors and infants during AQI > 400.'
  }
];
