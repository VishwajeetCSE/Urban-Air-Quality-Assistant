/**
 * @fileoverview Personalized Low-Emission Daily Routine Builder & Carbon Abatement Engine
 * Maps diurnal smog cycles to household schedules, transit modes, and emission reductions.
 * @module routine-engine
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

import { COMMUTE_MODES, ARCHETYPES } from './constants.js';
import { clamp } from './security.js';

/**
 * Generates personalized 6-block daily schedule mapped to diurnal atmospheric smog inversion
 *
 * @param {object} profile User demographic profile
 * @param {object} forecast Diurnal smog forecast returned by aqi-calculator
 * @returns {Array<object>} 6-block timeline schedule
 */
export function generateDailyRoutine(profile = {}, forecast = {}) {
  const archetype = ARCHETYPES[profile.archetypeKey] || ARCHETYPES.residential_family;
  const peakAQI = forecast.peakAQI || 320;
  const cleanestAQI = forecast.cleanestAQI || 140;

  const blocks = [
    {
      id: 'block_morning_wake',
      timeSpan: '06:00 AM – 08:30 AM',
      phaseName: 'Morning Surface Inversion Trap',
      severity: 'danger',
      icon: '🌫️',
      title: 'Zero-Ventilation & Indoor Microclimate Sealing',
      atmosphericContext: `Surface radiation inversion traps tailpipe PM2.5 and biomass smoke at ground level (AQI ~${peakAQI}).`,
      protocol: 'Keep all exterior balconies and windows locked. Do not perform morning jogs, outdoor yoga, or school assemblies.',
      lifestyleSwitch: 'Shift morning workout to gentle indoor stretches with DIY / HEPA air scrubber running on High.',
      ventilationState: 'Closed / Recirculation'
    },
    {
      id: 'block_morning_commute',
      timeSpan: '08:30 AM – 10:00 AM',
      phaseName: 'Peak Commuter Dispersion Barrier',
      severity: 'warning',
      icon: '🚇',
      title: 'Protected Transit or Staggered Departure',
      atmosphericContext: 'Vehicular NOx and particulate emissions peak in street canyons before solar boundary expansion.',
      protocol: 'Wear a well-fitted N95 / FFP2 respirator. Set vehicle ventilation to strict cabin-air recirculation.',
      lifestyleSwitch: profile.commuteMode === 'petrol_car' || profile.commuteMode === 'diesel_suv'
        ? 'Switch to Metro or pre-arranged AC electric bus carpool. Saves tailpipe congestion and reduces direct driver cabin inhalation.'
        : 'Board electric metro or protected transit. Avoid open three-wheeler autos along heavy truck corridors.',
      ventilationState: 'Cabin Filtered'
    },
    {
      id: 'block_midday_work',
      timeSpan: '10:00 AM – 12:30 PM',
      phaseName: 'Transition & Solar Warming',
      severity: 'info',
      icon: '🏢',
      title: 'Occupied Zone Air Filtration & Hydration',
      atmosphericContext: 'Sunlight warms the ground, gradually raising the planetary boundary mixing layer.',
      protocol: 'Maintain indoor CADR at 4+ Air Changes per Hour (ACH). Ensure constant hydration to keep mucosal barriers moist.',
      lifestyleSwitch: 'Use induction plate rather than gas/biomass cooking for lunch prep to prevent indoor NO2 spikes.',
      ventilationState: 'Continuous Filtration'
    },
    {
      id: 'block_convective_window',
      timeSpan: '12:30 PM – 03:30 PM',
      phaseName: 'Convective Solar Safe Window',
      severity: 'success',
      icon: '☀️',
      title: 'Optimal Convective Safe Window (Cleanest Air)',
      atmosphericContext: `Solar vertical convection disperses particulates aloft. Daily lowest AQI window (AQI ~${cleanestAQI}).`,
      protocol: 'Optimal time for essential outdoor errands, groceries, school pick-ups, and rapid 15-minute cross-ventilation of the home.',
      lifestyleSwitch: 'Run outdoor errands now instead of early morning or late evening. Schedule walk breaks during this midday sun.',
      ventilationState: 'Selective 15-min Airing'
    },
    {
      id: 'block_evening_return',
      timeSpan: '05:30 PM – 08:00 PM',
      phaseName: 'Evening Cooling & Commute Compression',
      severity: 'warning',
      icon: '🚗',
      title: 'Evening Commute Inversion Re-Trap',
      atmosphericContext: 'Sunset brings ground radiation cooling, compressing the mixing height back below 250 meters.',
      protocol: 'Stagger return commute if flexible, or ensure vehicle windows remain sealed with active AC blower on recirculate.',
      lifestyleSwitch: 'Wet-mop floors with warm water and microfibre upon returning home. Never dry-sweep, which resuspends settled toxic PM.',
      ventilationState: 'Closed / Recirculation'
    },
    {
      id: 'block_night_recovery',
      timeSpan: '09:00 PM – 06:00 AM',
      phaseName: 'Nocturnal Stagnation & Cellular Recovery',
      severity: 'info',
      icon: '🛌',
      title: 'Bedroom Bio-Shield & Positive Pressure Sleep',
      atmosphericContext: 'Dense, cold stagnant air pool. Ambient outdoor PM2.5 frequently climbs above 300 µg/m³ overnight.',
      protocol: 'Position DIY Corsi-Rosenthal box or HEPA unit 1.5 meters from bed headboard running on whisper-quiet medium.',
      lifestyleSwitch: 'Add bedroom phytoremediation plants (Snake Plant / Areca) for night-time oxygen release and minor VOC uptake.',
      ventilationState: 'Continuous Filtration'
    }
  ];

  return blocks;
}

/**
 * Calculates environmental and financial dividends from switching to clean commute options
 *
 * @param {object} profile
 * @returns {object} Carbon savings, fuel savings, and avoided tailpipe emissions
 */
export function calculateEmissionReductions(profile = {}) {
  const currentModeKey = profile.commuteMode || 'petrol_car';
  const currentMode = COMMUTE_MODES[currentModeKey] || COMMUTE_MODES.petrol_car;

  const distanceOneWay = clamp(profile.commuteDistanceKm, 1, 100, 15);
  const workDays = clamp(profile.workDaysPerMonth, 1, 31, 22);
  const monthlyKm = distanceOneWay * 2 * workDays;

  // Compare against clean public rail transit (Metro)
  const cleanMode = COMMUTE_MODES.metro;

  const currentCO2eKg = monthlyKm * currentMode.co2ePerKm;
  const cleanCO2eKg = monthlyKm * cleanMode.co2ePerKm;
  const savedCO2eKg = Math.max(0, Math.round((currentCO2eKg - cleanCO2eKg) * 10) / 10);

  const currentCostINR = monthlyKm * currentMode.costPerKm;
  const cleanCostINR = monthlyKm * cleanMode.costPerKm;
  const savedCostINR = Math.max(0, Math.round(currentCostINR - cleanCostINR));

  // Estimated tailpipe PM2.5 particulate emission avoided (grams/month)
  // ICE vehicles emit roughly 0.04 - 0.08g PM2.5 per vehicle-km
  const icePmFactorGramsPerKm = currentModeKey === 'diesel_suv' ? 0.075 : (currentModeKey === 'petrol_car' ? 0.035 : 0.015);
  const avoidedTailpipePM25Grams = Math.round(monthlyKm * icePmFactorGramsPerKm * 10) / 10;

  // Tree planting equivalent: 1 mature tree absorbs ~21 kg CO2e / year (~1.75 kg / month)
  const treeEquivalents = Math.round((savedCO2eKg / 1.75) * 10) / 10;

  return {
    monthlyKm,
    currentModeLabel: currentMode.label,
    cleanModeLabel: cleanMode.label,
    savedCO2eKg,
    savedCostINR,
    avoidedTailpipePM25Grams,
    treeEquivalents
  };
}
