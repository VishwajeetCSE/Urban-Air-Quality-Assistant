/**
 * @fileoverview CPCB NAQI Calculator, Diurnal Inversion Engine, Exposure Avoidance Math, and Risk Index
 * @module aqi-calculator
 * @author Vishwajeet Kumar
 * @license MIT
 */

import { AQI_BREAKPOINTS, HOTSPOT_CITIES, DIURNAL_SMOG_CURVE, ARCHETYPES, VULNERABILITY_FACTORS } from './constants.js';
import { clamp } from './security.js';

/**
 * Calculates the individual pollutant sub-index based on Indian CPCB breakpoints
 * Formula: I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
 * @param {'pm25'|'pm10'|'no2'|'o3'} pollutantKey
 * @param {number} concentration - in ug/m3
 * @returns {{ subIndex: number, label: string, color: string }}
 */
export function calculatePollutantSubIndex(pollutantKey, concentration) {
  const conc = clamp(concentration, 0, 1000, 0);
  const breakpoints = AQI_BREAKPOINTS[pollutantKey] || AQI_BREAKPOINTS.pm25;

  for (const bp of breakpoints) {
    if (conc >= bp.minC && conc <= bp.maxC) {
      const idx = ((bp.maxI - bp.minI) / (bp.maxC - bp.minC)) * (conc - bp.minC) + bp.minI;
      return {
        subIndex: Math.round(idx),
        label: bp.label,
        color: bp.color
      };
    }
  }

  // Handle beyond maximum range
  return {
    subIndex: 500,
    label: 'Severe',
    color: '#7e0023'
  };
}

/**
 * Computes composite AQI from multiple pollutants using CPCB maximum sub-index standard
 * @param {object} pollutants - { pm25, pm10, no2, o3 }
 * @returns {{
 *   aqi: number,
 *   category: string,
 *   color: string,
 *   prominentPollutant: string,
 *   healthAdvisory: string,
 *   subIndices: object
 * }}
 */
export function calculateCompositeAQI(pollutants = {}) {
  const p = {
    pm25: clamp(pollutants.pm25, 0, 800, 150),
    pm10: clamp(pollutants.pm10, 0, 1000, 220),
    no2: clamp(pollutants.no2, 0, 800, 65),
    o3: clamp(pollutants.o3, 0, 800, 45)
  };

  const subPM25 = calculatePollutantSubIndex('pm25', p.pm25);
  const subPM10 = calculatePollutantSubIndex('pm10', p.pm10);
  const subNO2 = calculatePollutantSubIndex('no2', p.no2);
  const subO3 = calculatePollutantSubIndex('o3', p.o3);

  const subIndices = {
    pm25: subPM25.subIndex,
    pm10: subPM10.subIndex,
    no2: subNO2.subIndex,
    o3: subO3.subIndex
  };

  let maxIdx = subPM25.subIndex;
  let prominent = 'PM2.5';

  if (subPM10.subIndex > maxIdx) {
    maxIdx = subPM10.subIndex;
    prominent = 'PM10';
  }
  if (subNO2.subIndex > maxIdx) {
    maxIdx = subNO2.subIndex;
    prominent = 'NO2';
  }
  if (subO3.subIndex > maxIdx) {
    maxIdx = subO3.subIndex;
    prominent = 'Ozone';
  }

  const overallAQI = clamp(maxIdx, 0, 500);

  let category = 'Good';
  let color = '#00e400';
  let healthAdvisory = 'Minimal respiratory impact. Normal outdoor activity.';

  if (overallAQI <= 50) {
    category = 'Good';
    color = '#00e400';
    healthAdvisory = 'Minimal health impact. Air quality is considered satisfactory.';
  } else if (overallAQI <= 100) {
    category = 'Satisfactory';
    color = '#92d050';
    healthAdvisory = 'Minor breathing discomfort to sensitive people.';
  } else if (overallAQI <= 200) {
    category = 'Moderate';
    color = '#ffd700';
    healthAdvisory = 'Breathing discomfort to people with lungs, asthma, and heart diseases.';
  } else if (overallAQI <= 300) {
    category = 'Poor';
    color = '#ff7e00';
    healthAdvisory = 'Breathing discomfort to most people on prolonged exposure.';
  } else if (overallAQI <= 400) {
    category = 'Very Poor';
    color = '#ff0000';
    healthAdvisory = 'Respiratory illness on prolonged exposure. Significant risk to children and elderly.';
  } else {
    category = 'Severe';
    color = '#7e0023';
    healthAdvisory = 'Emergency health alert: affects healthy people and seriously impacts those with existing diseases.';
  }

  return {
    aqi: overallAQI,
    category,
    color,
    prominentPollutant: prominent,
    healthAdvisory,
    subIndices
  };
}

/**
 * Models the 24-hour diurnal winter smog inversion forecast
 * Reflects ground-level cold inversion layer dynamics and planetary boundary expansion
 * @param {number} baseAQI
 * @param {string} [cityKey='delhi']
 * @param {number} [customInversionFactor=null]
 * @returns {{
 *   hours: Array<{
 *     hour: number,
 *     timeLabel: string,
 *     aqi: number,
 *     pm25: number,
 *     category: string,
 *     color: string,
 *     phase: string,
 *     phaseTitle: string,
 *     isSafeWindow: boolean,
 *     isCriticalTrap: boolean,
 *     recommendation: string
 *   }>,
 *   peakHour: number,
 *   peakAQI: number,
 *   cleanestHour: number,
 *   cleanestAQI: number,
 *   safeWindow: {
 *     startHour: number,
 *     endHour: number,
 *     avgAQI: number,
 *     avgPM25: number,
 *     description: string
 *   }
 * }}
 */
export function getDiurnalSmogForecast(baseAQI, cityKey = 'delhi', customInversionFactor = null) {
  const city = HOTSPOT_CITIES[cityKey] || HOTSPOT_CITIES.delhi;
  const aqiBase = clamp(baseAQI || city.baseAQI, 20, 500, 250);
  const factor = customInversionFactor !== null ? customInversionFactor : (city.inversionFactor || 1.5);

  const hours = [];
  let peakMetric = -Infinity;
  let peakAQI = -Infinity;
  let peakHour = 7;
  let cleanestMetric = Infinity;
  let cleanestAQI = Infinity;
  let cleanestHour = 13;

  for (let h = 0; h < 24; h++) {
    const rawMult = DIURNAL_SMOG_CURVE[h];
    // Scale diurnal amplitude by regional inversion factor
    const scaledMult = 1.0 + (rawMult - 1.0) * (factor / 1.5);
    const rawAQI = Math.round(aqiBase * scaledMult);
    const hourlyAQI = clamp(rawAQI, 20, 500);

    // Approximate PM2.5 in ug/m3 based on CPCB slope (approx PM2.5 = AQI * 0.72)
    const hourlyPM25 = Math.round(hourlyAQI * 0.72);

    if (rawAQI > peakMetric) {
      peakMetric = rawAQI;
      peakAQI = hourlyAQI;
      peakHour = h;
    }
    if (rawAQI < cleanestMetric) {
      cleanestMetric = rawAQI;
      cleanestAQI = hourlyAQI;
      cleanestHour = h;
    }

    let phase = 'night_inversion';
    let phaseTitle = 'Nocturnal Boundary Inversion';
    let isSafeWindow = false;
    let isCriticalTrap = false;
    let recommendation = 'Windows closed; air purification active on low speed.';

    if (h >= 6 && h <= 9) {
      phase = 'morning_trap';
      phaseTitle = 'Critical Morning Smog Trap';
      isCriticalTrap = true;
      recommendation = 'Cold radiation inversion traps vehicular exhaust. Zero outdoor exercise; N95 mandatory.';
    } else if (h >= 10 && h <= 11) {
      phase = 'midday_transition';
      phaseTitle = 'Solar Warming Transition';
      recommendation = 'Solar heating expands planetary boundary layer; smog gradually lifting.';
    } else if (h >= 12 && h <= 15) {
      phase = 'safe_window';
      phaseTitle = 'Convective Solar Ventilation Window';
      isSafeWindow = true;
      recommendation = 'Cleanest window of the day. Safe for quick ventilation, outdoor play, and errands.';
    } else if (h >= 16 && h <= 17) {
      phase = 'evening_transition';
      phaseTitle = 'Twilight Boundary Collapse';
      recommendation = 'Temperatures dropping; nocturnal inversion layer begins to re-trap emissions.';
    } else if (h >= 18 && h <= 21) {
      phase = 'evening_peak';
      phaseTitle = 'Secondary Evening Smog Accumulation';
      isCriticalTrap = true;
      recommendation = 'High pollution spike from evening commute and cooking smoke. Stay indoors.';
    }

    const timeLabel = `${String(h).padStart(2, '0')}:00`;
    const meta = calculatePollutantSubIndex('pm25', hourlyPM25);

    hours.push({
      hour: h,
      timeLabel,
      aqi: hourlyAQI,
      pm25: hourlyPM25,
      category: meta.label,
      color: meta.color,
      phase,
      phaseTitle,
      isSafeWindow,
      isCriticalTrap,
      recommendation
    });
  }

  // Safe window slice (12:00 to 15:00)
  const safeSlice = hours.slice(12, 16);
  const avgAQI = Math.round(safeSlice.reduce((sum, item) => sum + item.aqi, 0) / safeSlice.length);
  const avgPM25 = Math.round(safeSlice.reduce((sum, item) => sum + item.pm25, 0) / safeSlice.length);

  return {
    hours,
    peakHour,
    peakAQI,
    cleanestHour,
    cleanestAQI,
    safeWindow: {
      startHour: 12,
      endHour: 15,
      avgAQI,
      avgPM25,
      description: `Optimal 12:00 PM – 3:30 PM solar window yields ~${Math.round(((peakAQI - avgAQI) / peakAQI) * 100)}% lower exposure than morning peak.`
    }
  };
}

/**
 * Calculates inhaled PM2.5 volume avoided and equivalent cigarettes avoided
 * Formula: Inhaled Avoided (ug) = Baseline Exposure PM2.5 * ReductionFraction * Ve * DurationMinutes
 * @param {object} params
 * @param {number} params.basePM25 - ug/m3
 * @param {number} [params.minuteVentilation=0.015] - m3/min
 * @param {number} [params.filterReductionPct=75] - %
 * @param {number} [params.indoorHours=18] - hours per day inside
 * @param {boolean} [params.rescheduledOutdoor=true] - moved outdoor errands to safe window
 * @returns {{
 *   dailyInhaledAvoidedUg: number,
 *   annualInhaledAvoidedMg: number,
 *   cigarettesAvoidedDaily: number,
 *   cigarettesAvoidedMonthly: number
 * }}
 */
export function calculateInhaledPM25Avoidance({
  basePM25 = 180,
  minuteVentilation = 0.015,
  filterReductionPct = 75,
  indoorHours = 18,
  rescheduledOutdoor = true
} = {}) {
  const pm = clamp(basePM25, 10, 800, 180);
  const ve = clamp(minuteVentilation, 0.005, 0.050, 0.015);
  const frac = clamp(filterReductionPct, 0, 95, 75) / 100;
  const hours = clamp(indoorHours, 1, 24, 18);

  // Indoor filtration avoidance:
  // Inhaled avoided = basePM * frac * Ve * (hours * 60)
  const indoorAvoidedUg = pm * frac * ve * (hours * 60);

  // Outdoor rescheduling avoidance:
  // If user avoids morning 6-9 AM (multiplier ~1.9) and shifts to 1-3 PM (multiplier ~0.65)
  // Delta = 1.25 * basePM * Ve * (2 hours * 60)
  const outdoorAvoidedUg = rescheduledOutdoor ? (1.25 * pm * ve * 120) : 0;

  const dailyAvoidedUg = Math.round(indoorAvoidedUg + outdoorAvoidedUg);
  const annualAvoidedMg = Math.round((dailyAvoidedUg * 365) / 1000);

  // Berkeley Earth: 22 ug/m3 for 24 hours (~220 ug inhaled deposition) equals 1 cigarette
  const cigarettesDaily = Math.round((dailyAvoidedUg / 220) * 10) / 10;
  const cigarettesMonthly = Math.round(cigarettesDaily * 30);

  return {
    dailyInhaledAvoidedUg: dailyAvoidedUg,
    annualInhaledAvoidedMg: annualAvoidedMg,
    cigarettesAvoidedDaily: cigarettesDaily,
    cigarettesAvoidedMonthly: cigarettesMonthly
  };
}

/**
 * Calculates Household Smog Risk Index (0 - 100% Safety Scale)
 * 100% = Maximum Safety Protection; 0% = Severe Emergency Hazard
 * @param {object} params
 * @param {number} params.outdoorAQI
 * @param {string} params.archetypeKey
 * @param {string[]} [params.vulnerabilityKeys=[]]
 * @param {string[]} [params.activeHackIds=[]]
 * @returns {{
 *   safetyScore: number,
 *   riskLevel: string,
 *   badgeColor: string,
 *   vulnerabilityMultiplier: number,
 *   mitigationPoints: number
 * }}
 */
export function calculateHouseholdRiskIndex({
  outdoorAQI = 280,
  archetypeKey = 'apartment_family',
  vulnerabilityKeys = [],
  activeHackIds = []
} = {}) {
  const aqi = clamp(outdoorAQI, 20, 500, 280);
  const arch = ARCHETYPES[archetypeKey] || ARCHETYPES.apartment_family;

  // 1. Ambient outdoor severity penalty: 0 at AQI 50, 48 at AQI 500
  const ambientPenalty = Math.min(48, Math.max(0, ((aqi - 50) / 450) * 48));

  // 2. Structural infiltration penalty (based on housing archetype)
  const infiltrationPenalty = arch.baseInfiltration * 22; // 10 to 14 points

  // 3. Vulnerability weighting
  let vulnMisc = 1.0;
  vulnerabilityKeys.forEach(key => {
    if (VULNERABILITY_FACTORS[key]) {
      vulnMisc += (VULNERABILITY_FACTORS[key].weight - 1.0) * 0.4;
    }
  });
  const effectiveVulnerability = Math.min(2.8, arch.vulnerabilityWeight * vulnMisc);

  // 4. Mitigation bonus points earned by DIY hacks
  let mitigationPoints = 0;
  const hackBonuses = {
    corsi_rosenthal: 24,
    wet_mopping: 8,
    window_sealing: 6,
    kitchen_exhaust: 6,
    incense_ban: 8,
    phytoremediation: 4
  };
  activeHackIds.forEach(id => {
    if (hackBonuses[id]) {
      mitigationPoints += hackBonuses[id];
    }
  });

  // Composite calculation: Base 100 - (Penalties * (Vulnerability / 1.8)) + Mitigations
  const totalPenalty = (ambientPenalty + infiltrationPenalty) * (effectiveVulnerability / 1.8);
  const rawScore = 100 - totalPenalty + mitigationPoints;
  const safetyScore = clamp(Math.round(rawScore), 5, 100);

  let riskLevel = 'Moderate Risk';
  let badgeColor = '#ffd700';

  if (safetyScore >= 80) {
    riskLevel = 'Optimal Safety (Well Protected)';
    badgeColor = '#00c853';
  } else if (safetyScore >= 60) {
    riskLevel = 'Low Risk (Controlled)';
    badgeColor = '#92d050';
  } else if (safetyScore >= 40) {
    riskLevel = 'Moderate Smog Vulnerability';
    badgeColor = '#ffd700';
  } else if (safetyScore >= 25) {
    riskLevel = 'High Health Risk';
    badgeColor = '#ff7e00';
  } else {
    riskLevel = 'Critical Hazardous Exposure';
    badgeColor = '#d50000';
  }

  return {
    safetyScore,
    riskLevel,
    badgeColor,
    vulnerabilityMultiplier: Math.round(effectiveVulnerability * 10) / 10,
    mitigationPoints
  };
}
