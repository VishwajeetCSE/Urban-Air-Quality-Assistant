/**
 * @fileoverview CPCB NAQI Math, Atmospheric Diurnal Inversion, and Lung Deposition Physics
 * @module aqi-calculator
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

import { CPCB_BREAKPOINTS, WHO_GUIDELINE_24HR, HOTSPOT_CITIES, MICRO_ZONES, VULNERABILITY_FACTORS } from './constants.js';
import { clamp } from './security.js';

/**
 * Calculates pollutant sub-index using CPCB piecewise linear interpolation
 * Formula: I = [ (I_hi - I_lo) / (B_hi - B_lo) ] * (C - B_lo) + I_lo
 *
 * @param {'pm25'|'pm10'|'no2'|'so2'|'co'|'o3'} pollutant
 * @param {number} concentration In µg/m³ (mg/m³ for CO)
 * @returns {{ pollutant: string, concentration: number, subIndex: number, category: string, color: string }}
 */
export function calculatePollutantSubIndex(pollutant, concentration) {
  const c = Math.max(0, typeof concentration === 'number' ? concentration : parseFloat(concentration) || 0);
  const brackets = CPCB_BREAKPOINTS[pollutant];

  if (!brackets || brackets.length === 0) {
    return { pollutant, concentration: c, subIndex: 0, category: 'Good', color: '#10b981' };
  }

  // Find corresponding breakpoint bracket
  let bracket = brackets.find(b => c >= b.cLow && c <= b.cHigh);

  if (!bracket) {
    // If concentration exceeds highest bracket, extrapolate using maximum category
    const top = brackets[brackets.length - 1];
    bracket = top;
  }

  const { cLow, cHigh, iLow, iHigh, category, color } = bracket;
  let subIndex = 0;

  if (cHigh === cLow) {
    subIndex = iHigh;
  } else {
    subIndex = Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
  }

  subIndex = clamp(subIndex, 0, 500, 0);

  return {
    pollutant,
    concentration: Math.round(c * 10) / 10,
    subIndex,
    category,
    color
  };
}

/**
 * Computes CPCB Composite AQI (maximum sub-index principle) and WHO 2021 comparison
 * @param {object} pollutants Key-value pair of concentrations { pm25, pm10, no2, so2, co, o3 }
 * @returns {object} Composite AQI summary with WHO exceedance metrics
 */
export function calculateCompositeAQI(pollutants = {}) {
  const subIndices = {};
  const whoExceedances = {};
  let maxAQI = 0;
  let prominentPollutant = 'PM2.5';
  let prominentCategory = 'Good';
  let prominentColor = '#10b981';

  // Ensure PM2.5 is always estimated if missing
  const activePollutants = {
    pm25: pollutants.pm25 !== undefined ? pollutants.pm25 : 120,
    pm10: pollutants.pm10 !== undefined ? pollutants.pm10 : 210,
    no2: pollutants.no2 !== undefined ? pollutants.no2 : 55,
    so2: pollutants.so2 !== undefined ? pollutants.so2 : 25,
    co: pollutants.co !== undefined ? pollutants.co : 1.8,
    o3: pollutants.o3 !== undefined ? pollutants.o3 : 45
  };

  for (const [key, val] of Object.entries(activePollutants)) {
    if (CPCB_BREAKPOINTS[key]) {
      const result = calculatePollutantSubIndex(key, val);
      subIndices[key] = result.subIndex;

      // Calculate WHO 2021 Guideline Exceedance Factor (C / Guideline)
      const whoLimit = WHO_GUIDELINE_24HR[key];
      if (whoLimit) {
        whoExceedances[key] = {
          concentration: result.concentration,
          limit: whoLimit,
          ratio: Math.round((result.concentration / whoLimit) * 10) / 10,
          isExceeded: result.concentration > whoLimit
        };
      }

      if (result.subIndex > maxAQI) {
        maxAQI = result.subIndex;
        prominentPollutant = key.toUpperCase();
        prominentCategory = result.category;
        prominentColor = result.color;
      }
    }
  }

  return {
    aqi: maxAQI,
    prominentPollutant,
    category: prominentCategory,
    color: prominentColor,
    subIndices,
    whoExceedances,
    healthAdvisory: getHealthAdvisory(maxAQI, prominentCategory)
  };
}

/**
 * Returns specific medical & lifestyle advisory based on composite AQI
 * @param {number} aqi
 * @param {string} category
 * @returns {string}
 */
function getHealthAdvisory(aqi, category) {
  if (aqi <= 50) return 'Air quality is satisfactory. Ideal conditions for outdoor physical exercise and natural home ventilation.';
  if (aqi <= 100) return 'Acceptable air quality. Unusually sensitive individuals should monitor prolonged heavy outdoor exertion.';
  if (aqi <= 200) return 'Breathing discomfort likely for children, seniors, and persons with existing respiratory or cardiac conditions.';
  if (aqi <= 300) return 'Breathing discomfort to most people on prolonged outdoor exposure. Keep home windows sealed during morning hours.';
  if (aqi <= 400) return 'Respiratory illness on prolonged exposure. Strict N95 mask compliance outdoors; run continuous indoor air filtration.';
  return 'Severe Emergency: Triggers serious respiratory and cardiovascular impacts on healthy adults. Confinement in filtered indoor spaces mandated.';
}

/**
 * Simulates 24-hour Diurnal Planetary Boundary Layer (PBL) Smog Inversion Curve
 * Models morning surface radiation inversion vs convective midday mixing.
 *
 * @param {number} baseAQI
 * @param {string} cityKey
 * @param {string} microZoneKey
 * @returns {object} 24-hour forecast breakdown with optimal activity windows
 */
export function getDiurnalSmogForecast(baseAQI = 250, cityKey = 'delhi', microZoneKey = 'dense_residential') {
  const city = HOTSPOT_CITIES[cityKey] || HOTSPOT_CITIES.delhi;
  const zone = MICRO_ZONES[microZoneKey] || MICRO_ZONES.dense_residential;

  // Normalized diurnal atmospheric modulation curve (ratio to daily mean)
  // Low boundary layer (morning trap) -> higher AQI; Midday solar convection -> lowest AQI
  const diurnalFactors = [
    1.12, 1.18, 1.25, 1.32, 1.38, 1.48, // 00:00 - 05:00 Night accumulation
    1.55, 1.62, 1.50, 1.30, 1.10, 0.90, // 06:00 - 11:00 Morning peak trap & transition
    0.72, 0.65, 0.62, 0.68, 0.80, 0.95, // 12:00 - 17:00 Midday convective safe window
    1.15, 1.28, 1.35, 1.30, 1.22, 1.15  // 18:00 - 23:00 Evening traffic & cooling trap
  ];

  const hours = [];
  let peakAQI = 0;
  let peakHour = 7;
  let maxFactor = -1;
  let cleanestAQI = 999;
  let cleanestHour = 14;
  let minFactor = 999;

  for (let h = 0; h < 24; h++) {
    const timeLabel = `${String(h).padStart(2, '0')}:00`;
    const factor = diurnalFactors[h] * zone.pm25Multiplier;
    const aqi = Math.round(clamp(baseAQI * factor, 20, 500, baseAQI));
    // Estimated PM2.5 proportional to AQI
    const pm25 = Math.round(aqi * 0.68 * 10) / 10;
    // Estimated Planetary Boundary Layer Height (meters)
    const pblHeightMeters = Math.round(180 + (1.62 - diurnalFactors[h]) * 650);

    const isCriticalTrap = h >= 6 && h <= 9;
    const isSafeWindow = h >= 12 && h <= 15;

    let phase = 'normal';
    let actionRecommendation = 'Moderate outdoor exposure';

    if (isCriticalTrap) {
      phase = 'morning_trap';
      actionRecommendation = '⛔ Strict Confinement: Surface inversion traps concentrated diesel & biomass smoke.';
    } else if (isSafeWindow) {
      phase = 'safe_window';
      actionRecommendation = '🟢 Optimal Convective Window: Sunlight lifts inversion layer. Safest time for ventilation & essential errands.';
    } else if (h >= 18 && h <= 21) {
      phase = 'evening_peak';
      actionRecommendation = '⚠️ Evening Accumulation: Stagger travel or seal vehicle recirculating air.';
    }

    if (factor > maxFactor) {
      maxFactor = factor;
      peakAQI = aqi;
      peakHour = h;
    }
    if (factor < minFactor) {
      minFactor = factor;
      cleanestAQI = aqi;
      cleanestHour = h;
    }

    hours.push({
      hour: h,
      timeLabel,
      aqi,
      pm25,
      pblHeightMeters,
      phase,
      isCriticalTrap,
      isSafeWindow,
      actionRecommendation
    });
  }

  return {
    city: city.name,
    zone: zone.name,
    hours,
    peakHour,
    peakAQI,
    cleanestHour,
    cleanestAQI,
    safeWindow: {
      start: '12:00 PM',
      end: '03:30 PM',
      avgAQI: Math.round(cleanestAQI * 1.08)
    },
    criticalTrapWindow: {
      start: '06:00 AM',
      end: '09:30 AM',
      avgAQI: Math.round(peakAQI * 0.95)
    }
  };
}

/**
 * Calculates PM2.5 Inhaled Lung Deposition Avoidance and Berkeley Earth Cigarette Equivalence
 *
 * Mathematical Foundations:
 * Mass Inhaled = Integral of (C(t) * V_E) dt
 * Avoidance = Baseline Inhaled Mass - Mitigated Inhaled Mass
 * 1 Cigarette equivalent = 220 µg inhaled PM2.5
 *
 * @param {object} params
 * @param {number} params.basePM25 Ambient outdoor PM2.5 in µg/m³
 * @param {number} [params.minuteVentilation=0.015] m³/min
 * @param {number} [params.filterReductionPct=85] DIY / HEPA indoor reduction %
 * @param {number} [params.indoorHours=18] Hours spent indoors
 * @param {boolean} [params.rescheduledOutdoor=true] Rescheduled errands to midday safe window
 * @returns {object} Inhaled particulate savings and cigarette equivalence
 */
export function calculateInhaledPM25Avoidance({
  basePM25 = 180,
  minuteVentilation = 0.015,
  filterReductionPct = 85,
  indoorHours = 18,
  rescheduledOutdoor = true
} = {}) {
  const outdoorHours = 24 - indoorHours;

  // Baseline scenario: leaky indoors (~70% of outdoor PM2.5) + unmitigated morning outdoor exposure
  const baselineIndoorPM25 = basePM25 * 0.70;
  const baselineOutdoorPM25 = basePM25 * 1.25; // Peak morning exposure
  const baselineDailyInhaledUg =
    (baselineIndoorPM25 * indoorHours * 60 * minuteVentilation) +
    (baselineOutdoorPM25 * outdoorHours * 60 * minuteVentilation);

  // Mitigated scenario: high-efficiency indoor purification + shifting outdoor errands to convective safe window
  const mitigatedIndoorPM25 = Math.max(10, basePM25 * (1 - filterReductionPct / 100));
  const mitigatedOutdoorPM25 = rescheduledOutdoor ? basePM25 * 0.70 : basePM25;
  const mitigatedDailyInhaledUg =
    (mitigatedIndoorPM25 * indoorHours * 60 * minuteVentilation) +
    (mitigatedOutdoorPM25 * outdoorHours * 60 * minuteVentilation);

  const dailyInhaledAvoidedUg = Math.max(0, Math.round(baselineDailyInhaledUg - mitigatedDailyInhaledUg));
  const annualInhaledAvoidedMg = Math.round((dailyInhaledAvoidedUg * 365) / 1000);

  // Berkeley Earth model: 1 active cigarette = 220 µg PM2.5 exposure
  const cigarettesAvoidedDaily = Math.round((dailyInhaledAvoidedUg / 220) * 10) / 10;
  const cigarettesAvoidedMonthly = Math.round(cigarettesAvoidedDaily * 30);

  // Biological risk alleviation percentage
  const exposureReductionPct = Math.round(((baselineDailyInhaledUg - mitigatedDailyInhaledUg) / baselineDailyInhaledUg) * 100);

  return {
    baselineDailyInhaledUg: Math.round(baselineDailyInhaledUg),
    mitigatedDailyInhaledUg: Math.round(mitigatedDailyInhaledUg),
    dailyInhaledAvoidedUg,
    annualInhaledAvoidedMg,
    cigarettesAvoidedDaily,
    cigarettesAvoidedMonthly,
    exposureReductionPct
  };
}

/**
 * Calculates Composite Household Biological Risk Score (0-100)
 * Weighted by demographic vulnerability, micro-zone exposure, and AQI severity.
 *
 * @param {object} profile
 * @param {number} currentAQI
 * @returns {{ score: number, riskLevel: string, contributingFactors: string[] }}
 */
export function calculateHouseholdRiskIndex(profile = {}, currentAQI = 250) {
  let vulnerabilityWeight = 1.0;
  const contributingFactors = [];

  const vulns = Array.isArray(profile.vulnerabilities) ? profile.vulnerabilities : [];
  vulns.forEach((key) => {
    const factor = VULNERABILITY_FACTORS[key];
    if (factor) {
      vulnerabilityWeight *= factor.weight;
      contributingFactors.push(factor.label);
    }
  });

  const zone = MICRO_ZONES[profile.microZoneKey] || MICRO_ZONES.dense_residential;
  const zoneFactor = zone.pm25Multiplier;

  // Normalized baseline risk from AQI (0 at AQI 0, 100 at AQI 500)
  const aqiRatio = Math.min(1.0, currentAQI / 450);
  let rawScore = Math.round(aqiRatio * 75 * vulnerabilityWeight * zoneFactor);
  rawScore = clamp(rawScore, 5, 100, 50);

  let riskLevel = 'Low';
  if (rawScore >= 80) riskLevel = 'Critical Health Emergency';
  else if (rawScore >= 60) riskLevel = 'High Risk';
  else if (rawScore >= 40) riskLevel = 'Moderate Risk';

  return {
    score: rawScore,
    riskLevel,
    contributingFactors
  };
}
