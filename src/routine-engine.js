/**
 * @fileoverview Low-Emission Daily Routine Builder, Lifestyle Switcher, and Carbon Abatement Math
 * @module routine-engine
 * @author Vishwajeet Kumar
 * @license MIT
 */

import { ARCHETYPES, COMMUTE_MODES, HOTSPOT_CITIES } from './constants.js';
import { getDiurnalSmogForecast } from './aqi-calculator.js';
import { clamp } from './security.js';

/**
 * Generates an optimized, health-protective daily routine mapped to diurnal smog curves
 * @param {object} params
 * @param {string} [params.archetypeKey='apartment_family']
 * @param {string} [params.cityKey='delhi']
 * @param {number} [params.baseAQI=null]
 * @param {string} [params.commuteMode='metro']
 * @param {string[]} [params.vulnerabilities=[]]
 * @returns {{
 *   archetype: object,
 *   city: object,
 *   curveSummary: object,
 *   scheduleBlocks: Array<{
 *     timeSlot: string,
 *     title: string,
 *     status: 'CRITICAL_RISK'|'CAUTION'|'SAFE_WINDOW',
 *     badge: string,
 *     badgeClass: string,
 *     actionProtocol: string,
 *     iaqIndoorStep: string,
 *     commuteAlternative: string,
 *     societyCoordination: string
 *   }>,
 *   advisoryPills: string[]
 * }}
 */
export function generateDailyRoutine({
  archetypeKey = 'apartment_family',
  cityKey = 'delhi',
  baseAQI = null,
  commuteMode = 'metro',
  vulnerabilities = []
} = {}) {
  const arch = ARCHETYPES[archetypeKey] || ARCHETYPES.apartment_family;
  const city = HOTSPOT_CITIES[cityKey] || HOTSPOT_CITIES.delhi;
  const aqi = baseAQI !== null ? baseAQI : city.baseAQI;

  const forecast = getDiurnalSmogForecast(aqi, cityKey);

  const scheduleBlocks = [
    {
      timeSlot: '06:00 – 08:30 AM',
      title: 'Morning Smog Trap (Peak Radiation Inversion)',
      status: 'CRITICAL_RISK',
      badge: '🚫 Toxic Outdoor Exposure',
      badgeClass: 'badge-danger',
      actionProtocol: archetypeKey === 'apartment_family'
        ? 'Strict indoor shelter for infants & elders. Reschedule morning jogging or outdoor yoga. School bus waiting must include N95 respirator.'
        : archetypeKey === 'daily_commuter'
        ? 'Avoid open two-wheelers. If commuting by car, switch AC to recirculation immediately. Wear sealed N95/FFP2 mask on footpaths.'
        : 'Security team to enforce ZERO-IDLE zone at society entrance. Stop dry leaf sweeping on perimeter pathways.',
      iaqIndoorStep: 'Corsi-Rosenthal DIY box filter or HEPA unit running at medium/high speed. Windows and balcony sliders sealed tight.',
      commuteAlternative: 'Shift commute departure to Metro rail or electric shuttle bus.',
      societyCoordination: 'Activate perimeter anti-smog misting sprayers to suppress ground particulate resuspension.'
    },
    {
      timeSlot: '08:30 – 11:30 AM',
      title: 'Post-Rush Dissipation & Solar Boundary Expansion',
      status: 'CAUTION',
      badge: '⚠️ Moderate Caution',
      badgeClass: 'badge-warning',
      actionProtocol: 'Sun begins heating surface soil; atmospheric boundary layer gradually lifts. Essential short-distance transit permitted.',
      iaqIndoorStep: 'Mop all hard floors with a damp microfibre cloth. Strictly avoid dry broom sweeping which resuspends fine soot.',
      commuteAlternative: 'Batch non-urgent courier deliveries and errands for the midday solar window.',
      societyCoordination: 'Prohibit diesel generator operation for non-essential utility loads.'
    },
    {
      timeSlot: '12:00 – 03:30 PM',
      title: 'Convective Solar Ventilation Window (Cleanest Hours)',
      status: 'SAFE_WINDOW',
      badge: '✅ Optimal Clean Air Window',
      badgeClass: 'badge-success',
      actionProtocol: archetypeKey === 'apartment_family'
        ? 'Safest window of the day for children recess, balcony sunshine, elderly strolls, and outdoor grocery shopping.'
        : archetypeKey === 'daily_commuter'
        ? 'Ideal window for outdoor walking meetings, lunch breaks, and short-distance cycling.'
        : 'Open common society community hall doors for high-volume cross-ventilation flushing.',
      iaqIndoorStep: 'Open opposite windows for 15-20 minutes with kitchen/exhaust fans running to rapidly flush stale indoor CO2.',
      commuteAlternative: 'Short trips (< 2 km) can be safely conducted on foot or bicycle during this clean air pocket.',
      societyCoordination: 'Schedule garden watering and compost pit aerations during this convective mixing window.'
    },
    {
      timeSlot: '03:30 – 06:00 PM',
      title: 'Late Afternoon Cooling & Sunset Boundary Inversion',
      status: 'CAUTION',
      badge: '⚠️ Twilight Re-sealing',
      badgeClass: 'badge-warning',
      actionProtocol: 'As sunlight wanes, cold surface layer begins trapping evening emissions. Bring school children indoors by 5:15 PM.',
      iaqIndoorStep: 'Seal all windows, balcony doors, and kitchen vents. Deploy door-bottom draft snakes against chilly drafts.',
      commuteAlternative: 'Stagger office departure by 30 minutes to avoid idling in heavy peak-hour bumper-to-bumper traffic.',
      societyCoordination: 'Turn on society pathway solar lights; confirm no dry leaf piles are ignited by sweepers.'
    },
    {
      timeSlot: '06:00 – 09:30 PM',
      title: 'Evening Accumulation Spike & Heavy Traffic Smog',
      status: 'CRITICAL_RISK',
      badge: '🚫 Severe Night Trap',
      badgeClass: 'badge-danger',
      actionProtocol: 'Secondary smog accumulation fueled by evening rush hour, unvented heating fires, and cool air sinking. Avoid outdoor restaurants and parks.',
      iaqIndoorStep: 'Turn on kitchen exhaust 2 minutes before dinner cooking. Cook with covered lids. Absolutely zero incense or mosquito coils.',
      commuteAlternative: 'Use underground Metro rail to completely bypass street-level diesel exhaust corridors.',
      societyCoordination: 'Security patrol to immediately fine any unauthorized biomass, scrap wood, or garbage burning.'
    },
    {
      timeSlot: '09:30 PM – 06:00 AM',
      title: 'Overnight Cold Pool & Bedroom Purification',
      status: 'CAUTION',
      badge: '🌙 Overnight Recovery',
      badgeClass: 'badge-info',
      actionProtocol: 'Rest & alveolar lung healing period. Cool ambient air remains heavily loaded with fine PM2.5.',
      iaqIndoorStep: 'Run Corsi-Rosenthal box on low whisper setting in sleeping chambers. Keep Snake Plants in bedrooms for nocturnal oxygen.',
      commuteAlternative: 'N/A (Rest & Regeneration).',
      societyCoordination: 'Provide security guards with electric infrared radiant heaters to prevent wood/angithi burning at guard posts.'
    }
  ];

  const advisoryPills = [];
  if (forecast.peakAQI > 300) {
    advisoryPills.push(`Peak AQI reaches ${forecast.peakAQI} in ${city.name} — N95 masks non-negotiable.`);
  }
  if (vulnerabilities.includes('asthma') || vulnerabilities.includes('infants')) {
    advisoryPills.push('High vulnerability detected: Enforce strict indoor shelter 6:00–9:30 AM.');
  }
  advisoryPills.push(`Safest outdoor window: 12:00 PM – 3:30 PM (yields ~${Math.round(((forecast.peakAQI - forecast.safeWindow.avgAQI) / forecast.peakAQI) * 100)}% lower exposure).`);

  return {
    archetype: arch,
    city,
    curveSummary: {
      peakHour: forecast.peakHour,
      peakAQI: forecast.peakAQI,
      cleanestHour: forecast.cleanestHour,
      cleanestAQI: forecast.cleanestAQI,
      safeWindow: forecast.safeWindow
    },
    scheduleBlocks,
    advisoryPills
  };
}

/**
 * Computes quantifiable carbon footprint & particulate emission abatement from lifestyle switches
 * @param {object} params
 * @param {string} [params.commuteCurrent='car']
 * @param {string} [params.commuteTarget='metro']
 * @param {number} [params.distanceKm=15] - one way
 * @param {number} [params.workDays=22]
 * @param {boolean} [params.inductionCooking=true] - switch from LPG/biomass
 * @param {number} [params.compostLeavesKg=25] - kg dry leaves composted vs burned
 * @returns {{
 *   monthlyCo2eSavedKg: number,
 *   annualCo2eSavedKg: number,
 *   pm25EmissionsPreventedGrams: number,
 *   fuelCostSavedINR: number,
 *   breakdown: {
 *     commuteCo2Kg: number,
 *     cookingCo2Kg: number,
 *     compostCo2Kg: number
 *   }
 * }}
 */
export function calculateEmissionReductions({
  commuteCurrent = 'car',
  commuteTarget = 'metro',
  distanceKm = 15,
  workDays = 22,
  inductionCooking = true,
  compostLeavesKg = 25
} = {}) {
  const dist = clamp(distanceKm, 1, 100, 15);
  const days = clamp(workDays, 1, 31, 22);
  const leaves = clamp(compostLeavesKg, 0, 500, 25);

  const curEF = (COMMUTE_MODES[commuteCurrent] || COMMUTE_MODES.car).ef;
  const tgtEF = (COMMUTE_MODES[commuteTarget] || COMMUTE_MODES.metro).ef;

  // Round trip distance per day = dist * 2
  const roundTripKm = dist * 2;
  const monthlyKm = roundTripKm * days;

  // Monthly commute CO2e saved (kg) = km * (curEF - tgtEF)
  const commuteCo2Kg = Math.max(0, Math.round(monthlyKm * (curEF - tgtEF) * 10) / 10);

  // Cooking switch: Induction vs unvented LPG saves ~18 kg CO2e/month and eliminates indoor combustion
  const cookingCo2Kg = inductionCooking ? 18.0 : 0.0;

  // Leaf composting: Open burning emits 1.4 kg CO2e and 18g of toxic PM2.5 per kg leaves
  const compostCo2Kg = Math.round(leaves * 1.35 * 10) / 10;
  const pm25PreventedGrams = Math.round(leaves * 18.0);

  const totalMonthlyCo2e = Math.round((commuteCo2Kg + cookingCo2Kg + compostCo2Kg) * 10) / 10;
  const annualCo2e = Math.round(totalMonthlyCo2e * 12);

  // Fuel cost savings (assuming ₹7.5/km average ICE running cost minus ₹1.5/km metro fare)
  const fuelCostSavedINR = Math.max(0, Math.round(monthlyKm * (curEF > 0.05 ? 6.0 : 0)));

  return {
    monthlyCo2eSavedKg: totalMonthlyCo2e,
    annualCo2eSavedKg: annualCo2e,
    pm25EmissionsPreventedGrams: pm25PreventedGrams,
    fuelCostSavedINR,
    breakdown: {
      commuteCo2Kg,
      cookingCo2Kg,
      compostCo2Kg
    }
  };
}
