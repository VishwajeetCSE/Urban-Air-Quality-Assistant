/**
 * SmogGuard AI — Low-Emission Daily Routine & Sustainable Swaps Engine
 * Dynamically reschedules daily life around the atmospheric diurnal smog inversion curve
 * to minimize alveolar lung exposure for vulnerable family archetypes.
 */

import { PERSONA_ARCHETYPES, CITIES, HOUSING_TYPES, SUSTAINABLE_SWAPS } from './constants.js';
import { getDiurnalInversionCurve } from './smog-engine.js';

/**
 * Generates an hour-by-hour and block-by-block daily routine tailored to the family persona
 * @param {string} [cityKey='delhi']
 * @param {string} [personaKey='infant']
 * @param {string} [housingKey='apartment']
 * @param {number} [customPM25=null]
 * @returns {{
 *   persona: object,
 *   city: object,
 *   housing: object,
 *   curveSummary: object,
 *   blocks: Array<{
 *     timeSlot: string,
 *     title: string,
 *     phase: string,
 *     safetyStatus: 'SAFE'|'CAUTION'|'HAZARDOUS',
 *     badgeText: string,
 *     outdoorRecommendation: string,
 *     indoorIAQProtocol: string,
 *     transitSwap: string,
 *     rwaAction: string
 *   }>,
 *   criticalAlerts: string[]
 * }}
 */
export function generateDailyRoutine(
  cityKey = 'delhi',
  personaKey = 'infant',
  housingKey = 'apartment',
  customPM25 = null
) {
  const city = CITIES[cityKey] || CITIES.delhi;
  const persona = PERSONA_ARCHETYPES[personaKey] || PERSONA_ARCHETYPES.infant;
  const housing = HOUSING_TYPES[housingKey] || HOUSING_TYPES.apartment;
  const basePM = customPM25 || city.basePM25;

  const curve = getDiurnalInversionCurve(basePM, cityKey);

  const blocks = [
    {
      timeSlot: '06:00 – 08:30 AM',
      title: 'Morning Inversion Smog Trap (Peak Ground-Level Toxins)',
      phase: 'morning_trap',
      safetyStatus: 'HAZARDOUS',
      badgeText: '🚫 Critical Outdoor Risk',
      outdoorRecommendation: personaKey === 'school_child'
        ? 'Board school transport wearing an airtight N95/FFP2 mask. Request school management to hold morning assembly inside air-purified auditorium.'
        : personaKey === 'elderly_asthma'
        ? 'Strictly CANCEL morning outdoor walks. Cold dense smog triggers acute bronchospasm and cardiovascular stress.'
        : personaKey === 'infant'
        ? 'Keep infant strictly indoors. Keep nursery doors closed; avoid balcony or garden strolls.'
        : 'Commuters: If riding two-wheeler, use certified N95 respirator. In cars, switch HVAC to internal recirculation immediately.',
      indoorIAQProtocol: 'Run Corsi-Rosenthal DIY box filter at medium/high. Keep all windows, balcony sliders, and exhaust vents sealed tightly.',
      transitSwap: 'Switch from open auto-rickshaw/bike to Metro rail or closed EV carpool.',
      rwaAction: 'Security guards to enforce strict ZERO-IDLE zone at school bus boarding bays and society main gates.'
    },
    {
      timeSlot: '08:30 – 11:30 AM',
      title: 'Post-Rush Dissipation & Solar Warming Transition',
      phase: 'midday_transition',
      safetyStatus: 'CAUTION',
      badgeText: '⚠️ Caution — Inversion Lifting',
      outdoorRecommendation: 'Solar heating begins breaking down the surface boundary layer. Short essential transit permitted with mask.',
      indoorIAQProtocol: 'Execute wet-mopping with microfibre cloth across all hard floors. Avoid dry broom sweeping which resuspends settled PM2.5.',
      transitSwap: 'Batch errands for midday instead of early morning.',
      rwaAction: 'Prohibit horticulture leaf sweeping using dry leaf blowers. Wet-sweep common pathways.'
    },
    {
      timeSlot: '12:00 – 03:30 PM',
      title: 'Convective Solar Ventilation Window (Safest Outdoor Hours)',
      phase: 'safe_window',
      safetyStatus: 'SAFE',
      badgeText: '✅ Cleanest Window of the Day',
      outdoorRecommendation: personaKey === 'school_child'
        ? 'Optimal window for child outdoor sports, school recess, and outdoor playtime! Planetary boundary layer is at maximum height.'
        : personaKey === 'elderly_asthma'
        ? 'Safest time for mild sunshine exposure, vitamin D synthesis, and gentle walking in society gardens.'
        : 'Safest window for outdoor errands, market visits, grocery pickups, and outdoor sports.',
      indoorIAQProtocol: 'Open opposite windows for 15-20 minutes for high-speed cross-ventilation to flush accumulated indoor CO2 and bio-effluents. Run kitchen exhaust.',
      transitSwap: 'Safe window for active cycling or walking for short-distance trips under 2 km.',
      rwaAction: 'Schedule society maintenance, garden watering, and parcel deliveries during this low-smog window.'
    },
    {
      timeSlot: '03:30 – 06:30 PM',
      title: 'Late Afternoon Cooling & Twilight Boundary Collapse',
      phase: 'evening_transition',
      safetyStatus: 'CAUTION',
      badgeText: '⚠️ Twilight Precautions',
      outdoorRecommendation: 'As the sun sets, surface temperatures plummet and inversion cap re-forms. Return children indoors by 5:30 PM.',
      indoorIAQProtocol: 'Tightly close all windows, balcony doors, and bathroom ventilators. Check that door-bottom draft snakes are deployed.',
      transitSwap: 'Depart early for evening commute to beat peak vehicular idling congestion.',
      rwaAction: 'Verify that society diesel generators are NOT run for non-essential loads. Switch to battery bank.'
    },
    {
      timeSlot: '06:30 – 10:00 PM',
      title: 'Evening Accumulation Spike & Night Rush Trapping',
      phase: 'evening_peak',
      safetyStatus: 'HAZARDOUS',
      badgeText: '🚫 Hazardous Smog Spike',
      outdoorRecommendation: 'Secondary severe smog spike fueled by rush hour exhaust, cool air trapping, and neighborhood cooking/heating fires. Avoid all outdoor dining and parks.',
      indoorIAQProtocol: 'Turn on kitchen exhaust fan 2 minutes prior to cooking dinner. Keep frying pans lidded. Absolutely NO incense, dhoop, or mosquito coils.',
      transitSwap: 'Take Metro or shared electric shuttles. Keep car cabin air filter on Recirculate.',
      rwaAction: 'Deploy security vigil to strictly penalize open burning of dry leaves, garbage, or scrap wood for guard warming.'
    },
    {
      timeSlot: '10:00 PM – 06:00 AM',
      title: 'Overnight Inversion Trap & Chamber Purification',
      phase: 'night_inversion',
      safetyStatus: 'CAUTION',
      badgeText: '🌙 Overnight Indoor Protection',
      outdoorRecommendation: 'Cool ambient air remains saturated with particulate matter. Keep all external doors locked and sealed.',
      indoorIAQProtocol: 'Keep Corsi-Rosenthal DIY box filter running on low in sleeping chambers (whisper quiet). Position Snake Plants in bedrooms for overnight O2 release.',
      transitSwap: 'N/A — Rest & alveolar lung recovery period.',
      rwaAction: 'Provide electric radiant heaters to night security guards to eliminate charcoal/wood angithi burning.'
    }
  ];

  const criticalAlerts = [];
  if (curve.peakPM25 > 250) {
    criticalAlerts.push(`CRITICAL: Peak morning PM2.5 in ${city.name} reaches ${curve.peakPM25} µg/m³ (Severe+). Respiratory masks mandatory outdoors.`);
  }
  if (personaKey === 'infant' || personaKey === 'elderly_asthma') {
    criticalAlerts.push(`VULNERABILITY WARNING: High alveolar susceptibility detected for ${persona.name}. Enforce strict indoor shelter between 06:00-09:30 AM and 19:00-22:00 PM.`);
  }
  if (housingKey === 'slum') {
    criticalAlerts.push(`HOUSING WARNING: Informal construction has high particulate infiltration (~88%). Prioritize draft sealing and budget Corsi-Rosenthal box.`);
  }

  return {
    persona,
    city,
    housing,
    curveSummary: {
      peakHour: curve.peakHour,
      peakPM25: curve.peakPM25,
      cleanestHour: curve.cleanestHour,
      cleanestPM25: curve.cleanestPM25,
      ventilationWindow: curve.ventilationWindow
    },
    blocks,
    criticalAlerts
  };
}

/**
 * Calculates quantified sustainable swaps across commute, heating, and waste
 * @param {object} params
 * @param {number} [params.commuteDistanceKm=15]
 * @param {string} [params.currentCommute='ice_petrol_car']
 * @param {string} [params.targetCommute='metro_train']
 * @param {number} [params.workDays=22]
 * @param {string} [params.heatingChoice='oil_radiator']
 * @param {number} [params.dryLeavesKg=20]
 * @returns {object}
 */
export function generateSustainableSwaps({
  commuteDistanceKm = 15,
  currentCommute = 'ice_petrol_car',
  targetCommute = 'metro_train',
  workDays = 22,
  heatingChoice = 'oil_radiator',
  dryLeavesKg = 20
} = {}) {
  const curEF = (SUSTAINABLE_SWAPS.transit[currentCommute] || SUSTAINABLE_SWAPS.transit.ice_petrol_car).ef;
  const tgtEF = (SUSTAINABLE_SWAPS.transit[targetCommute] || SUSTAINABLE_SWAPS.transit.metro_train).ef;

  // Monthly commute CO2e saved = dist * 2 (round-trip) * (curEF - tgtEF) * workDays
  const dailyCommuteKm = commuteDistanceKm * 2;
  const monthlyCo2SavedTransit = Math.max(0, Math.round(dailyCommuteKm * (curEF - tgtEF) * workDays * 10) / 10);
  const annualCo2SavedTransit = Math.round(monthlyCo2SavedTransit * 12);

  // Heating choice savings vs biomass/wood angithi
  const angithiCo2 = SUSTAINABLE_SWAPS.heating.biomass_angithi.co2PerMonth;
  const chosenHeatingCo2 = (SUSTAINABLE_SWAPS.heating[heatingChoice] || SUSTAINABLE_SWAPS.heating.oil_radiator).co2PerMonth;
  const monthlyCo2SavedHeating = Math.max(0, angithiCo2 - chosenHeatingCo2);

  // Waste composting savings vs open leaf burning
  // 1.4 kg CO2e per kg dry leaves + 18g of toxic PM2.5 emitted avoided per kg
  const leavesCo2Saved = Math.round(dryLeavesKg * 1.3 * 10) / 10;
  const pm25EmissionsAvoidedGrams = Math.round(dryLeavesKg * 18);

  const totalMonthlyCo2eSaved = Math.round((monthlyCo2SavedTransit + monthlyCo2SavedHeating + leavesCo2Saved) * 10) / 10;

  return {
    transit: {
      fromName: SUSTAINABLE_SWAPS.transit[currentCommute].name,
      toName: SUSTAINABLE_SWAPS.transit[targetCommute].name,
      monthlyCo2SavedKg: monthlyCo2SavedTransit,
      annualCo2SavedKg: annualCo2SavedTransit,
      fuelCostSavedINR: Math.round(dailyCommuteKm * workDays * 6.5) // approx ₹6.5/km fuel saving vs metro
    },
    heating: {
      name: SUSTAINABLE_SWAPS.heating[heatingChoice].name,
      monthlyCo2SavedKg: monthlyCo2SavedHeating,
      indoorPmAdvantage: 'Zero indoor combustion emissions'
    },
    waste: {
      dryLeavesKg,
      co2SavedKg: leavesCo2Saved,
      pm25EmissionsAvoidedGrams
    },
    totalMonthlyCo2eSaved
  };
}
