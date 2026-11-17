/**
 * SmogGuard AI — Diurnal Smog Inversion & CPCB AQI Engine
 * Models planetary boundary layer height collapse, morning radiation traps,
 * and midday convective solar ventilation windows for Indian cities.
 */

import { CPCB_NAQI_BREAKPOINTS, DIURNAL_INVERSION_MULTIPLIERS, CITIES } from './constants.js';

/**
 * Calculates Indian CPCB National Air Quality Index (NAQI) for PM2.5
 * Uses standard piecewise linear interpolation:
 * I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
 * @param {number} pm25 - in ug/m3
 * @returns {{ aqi: number, category: string, color: string, className: string }}
 */
export function calculateAQIFromPM25(pm25) {
  const conc = Math.max(0, Number(pm25) || 0);

  // Severe upper bound (> 500 ug/m3)
  if (conc > 500) {
    return {
      aqi: 500,
      category: 'Severe',
      color: '#7e0023',
      className: 'aqi-severe'
    };
  }

  for (const bp of CPCB_NAQI_BREAKPOINTS) {
    if (conc >= bp.minPM && conc <= bp.maxPM) {
      const aqi = ((bp.maxAQI - bp.minAQI) / (bp.maxPM - bp.minPM)) * (conc - bp.minPM) + bp.minAQI;
      return {
        aqi: Math.round(aqi),
        category: bp.label,
        color: bp.color,
        className: bp.class
      };
    }
  }

  // Fallback for borderline or high values below 500
  return {
    aqi: Math.min(500, Math.round(conc)),
    category: 'Severe',
    color: '#7e0023',
    className: 'aqi-severe'
  };
}

/**
 * Inverts CPCB AQI to estimated PM2.5 concentration (ug/m3)
 * @param {number} aqi
 * @returns {number}
 */
export function calculatePM25FromAQI(aqi) {
  const val = Math.max(0, Math.min(500, Number(aqi) || 0));

  for (const bp of CPCB_NAQI_BREAKPOINTS) {
    if (val >= bp.minAQI && val <= bp.maxAQI) {
      const pm = ((val - bp.minAQI) / (bp.maxAQI - bp.minAQI)) * (bp.maxPM - bp.minPM) + bp.minPM;
      return Math.round(pm * 10) / 10;
    }
  }
  return Math.round(val);
}

/**
 * Generates the full 24-hour diurnal winter smog inversion curve
 * @param {number} basePM25
 * @param {string} [cityKey]
 * @param {number} [customInversionFactor]
 * @returns {{
 *   hours: Array<{
 *     hour: number,
 *     timeLabel: string,
 *     pm25: number,
 *     aqi: number,
 *     category: string,
 *     color: string,
 *     phase: string,
 *     phaseLabel: string,
 *     isSafeWindow: boolean,
 *     isPeakTrap: boolean,
 *     advice: string
 *   }>,
 *   peakHour: number,
 *   peakPM25: number,
 *   cleanestHour: number,
 *   cleanestPM25: number,
 *   avgPM25: number,
 *   ventilationWindow: { startHour: number, endHour: number, avgPM25: number }
 * }}
 */
export function getDiurnalInversionCurve(basePM25, cityKey = 'delhi', customInversionFactor = null) {
  const city = CITIES[cityKey] || CITIES.delhi;
  const base = Math.max(10, Number(basePM25) || city.basePM25 || 150);
  const factor = typeof customInversionFactor === 'number' && customInversionFactor > 0
    ? customInversionFactor
    : city.inversionFactor || 1.5;

  const hours = [];
  let peakPM25 = -Infinity;
  let peakHour = 7;
  let cleanestPM25 = Infinity;
  let cleanestHour = 13;
  let sumPM25 = 0;

  for (let h = 0; h < 24; h++) {
    const mult = DIURNAL_INVERSION_MULTIPLIERS[h];
    // Scale the amplitude of inversion variations by the factor
    const scaledMult = 1.0 + (mult - 1.0) * (factor / 1.5);
    const hourlyPM25 = Math.max(10, Math.round(base * scaledMult));
    sumPM25 += hourlyPM25;

    if (hourlyPM25 > peakPM25) {
      peakPM25 = hourlyPM25;
      peakHour = h;
    }
    if (hourlyPM25 < cleanestPM25) {
      cleanestPM25 = hourlyPM25;
      cleanestHour = h;
    }

    const aqiMeta = calculateAQIFromPM25(hourlyPM25);
    let phase = 'night_inversion';
    let phaseLabel = 'Nocturnal Inversion Trap';
    let isSafeWindow = false;
    let isPeakTrap = false;
    let advice = 'Keep windows shut; air purifiers on low.';

    if (h >= 6 && h <= 9) {
      phase = 'morning_trap';
      phaseLabel = 'Severe Morning Smog Trap';
      isPeakTrap = true;
      advice = 'Ground-level cold inversion layer holds vehicular & biomass toxins. Avoid outdoor exercise; N95 mandatory.';
    } else if (h >= 10 && h <= 11) {
      phase = 'midday_transition';
      phaseLabel = 'Solar Boundary Layer Lifting';
      advice = 'Solar radiation warming ground surface; inversion layer rising.';
    } else if (h >= 12 && h <= 15) {
      phase = 'safe_window';
      phaseLabel = 'Convective Solar Ventilation Window';
      isSafeWindow = true;
      advice = 'Optimal window of the day! Safest time for brief ventilation, essential grocery runs, and child outdoor play.';
    } else if (h >= 16 && h <= 18) {
      phase = 'evening_transition';
      phaseLabel = 'Twilight Cooling & Inversion Reform';
      advice = 'Temperatures dropping; surface inversion begins capturing evening rush emissions.';
    } else if (h >= 19 && h <= 22) {
      phase = 'evening_peak';
      phaseLabel = 'Evening Accumulation Spike';
      isPeakTrap = true;
      advice = 'Secondary smog peak. Seal drafts, close balcony doors, run indoor air filtration.';
    }

    const timeLabel = `${String(h).padStart(2, '0')}:00`;

    hours.push({
      hour: h,
      timeLabel,
      pm25: hourlyPM25,
      aqi: aqiMeta.aqi,
      category: aqiMeta.category,
      color: aqiMeta.color,
      className: aqiMeta.className,
      phase,
      phaseLabel,
      isSafeWindow,
      isPeakTrap,
      advice
    });
  }

  const avgPM25 = Math.round(sumPM25 / 24);

  // Ventilation window spans hours 12 to 15
  const ventHours = hours.slice(12, 16);
  const ventAvg = Math.round(ventHours.reduce((s, x) => s + x.pm25, 0) / ventHours.length);

  return {
    hours,
    peakHour,
    peakPM25,
    cleanestHour,
    cleanestPM25,
    avgPM25,
    ventilationWindow: {
      startHour: 12,
      endHour: 15,
      avgPM25: ventAvg,
      pm25ReductionVsPeak: Math.round(((peakPM25 - ventAvg) / peakPM25) * 100)
    }
  };
}

/**
 * Assesses risk for a given hour and persona archetype
 * @param {number} hourPM25
 * @param {object} persona
 * @returns {{ level: 'SAFE'|'MODERATE'|'HIGH'|'HAZARDOUS', badge: string, action: string }}
 */
export function getHourRiskAssessment(hourPM25, persona) {
  const threshold = (persona && persona.safeThresholdPM25) || 40;
  const ratio = hourPM25 / threshold;

  if (ratio <= 1.2) {
    return {
      level: 'SAFE',
      badge: 'Relatively Safe',
      action: 'Outdoor activities permitted with normal precautions.'
    };
  } else if (ratio <= 2.2) {
    return {
      level: 'MODERATE',
      badge: 'Moderate Caution',
      action: 'Limit prolonged outdoor exertion; wear surgical or cloth mask.'
    };
  } else if (ratio <= 3.8) {
    return {
      level: 'HIGH',
      badge: 'High Health Risk',
      action: 'N95 respirator required; reschedule outdoor workouts indoors.'
    };
  } else {
    return {
      level: 'HAZARDOUS',
      badge: 'Hazardous / Emergency',
      action: 'Strict outdoor avoidance; high risk of acute bronchospasm and cardiovascular stress.'
    };
  }
}
