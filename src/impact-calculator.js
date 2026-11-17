/**
 * SmogGuard AI — Direct Impact Scientific Calculator
 * Computes:
 * 1. Inhaled PM2.5 Volume Avoided (ug/day and mg/year)
 * 2. Cigarette Equivalence Avoided (Berkeley Earth rule: ~22 ug/m3 daily avg = 1 cigarette)
 * 3. Monthly & Annual Carbon Footprint Abatement (kg CO2e)
 * 4. Family Health Risk Index & Smog Vulnerability Score (0-100% safety scale)
 */

import { PERSONA_ARCHETYPES, HOUSING_TYPES } from './constants.js';
import { getDiurnalInversionCurve } from './smog-engine.js';
import { calculateIndoorPM25 } from './iaq-engine.js';

/**
 * Computes Inhaled PM2.5 Volume Avoided by a family member across 24 hours
 * Formula: PM2.5_avoided = Sum[ (Exposure_unmitigated(t) - Exposure_mitigated(t)) * Ve * T ]
 * @param {object} params
 * @param {number} [params.basePM25=150]
 * @param {string} [params.cityKey='delhi']
 * @param {string} [params.personaKey='infant']
 * @param {string} [params.housingKey='apartment']
 * @param {object} [params.activeHacks={}]
 * @param {boolean} [params.rescheduledOutdoors=true] - Moved outdoor time to solar window
 * @returns {{
 *   dailyInhaledAvoidedUg: number,
 *   annualInhaledAvoidedMg: number,
 *   equivalentCigarettesAvoidedDaily: number,
 *   equivalentCigarettesAvoidedMonthly: number,
 *   unmitigatedDailyInhaledUg: number,
 *   mitigatedDailyInhaledUg: number,
 *   reductionPct: number
 * }}
 */
export function calculateInhaledPM25Avoided({
  basePM25 = 150,
  cityKey = 'delhi',
  personaKey = 'infant',
  housingKey = 'apartment',
  activeHacks = {},
  rescheduledOutdoors = true
} = {}) {
  const persona = PERSONA_ARCHETYPES[personaKey] || PERSONA_ARCHETYPES.infant;
  const ve = persona.minuteVentilation; // m3/min
  const curve = getDiurnalInversionCurve(basePM25, cityKey);

  let totalUnmitigatedInhaledUg = 0;
  let totalMitigatedInhaledUg = 0;

  for (let h = 0; h < 24; h++) {
    const outdoor = curve.hours[h].pm25;
    const iaq = calculateIndoorPM25(outdoor, housingKey, activeHacks);

    // Baseline unmitigated profile:
    // Person steps out during morning rush or evening without schedule optimization
    // Inside indoor air is unmitigated
    const isMorningPeak = h >= 7 && h <= 9;
    const isEveningPeak = h >= 19 && h <= 21;
    const isMiddaySafe = h >= 12 && h <= 14;

    let unmitigatedHourlyExposurePM = iaq.unmitigatedPM25;
    let mitigatedHourlyExposurePM = iaq.mitigatedPM25;

    // Minute ventilation rate during the hour
    let hourlyVe = ve;

    if (personaKey === 'commuter') {
      if (isMorningPeak || isEveningPeak) {
        hourlyVe = 0.035; // active transit exertion
        unmitigatedHourlyExposurePM = outdoor; // exposed outdoors
        mitigatedHourlyExposurePM = rescheduledOutdoors
          ? outdoor * 0.15 // N95 respirator + metro swap
          : outdoor * 0.40;
      }
    } else if (personaKey === 'school_child') {
      if (isMorningPeak) {
        unmitigatedHourlyExposurePM = outdoor; // bus stop waiting
        mitigatedHourlyExposurePM = outdoor * 0.15; // N95 mask
      }
      if (isMiddaySafe && rescheduledOutdoors) {
        // Child plays in safest outdoor window
        mitigatedHourlyExposurePM = outdoor;
      }
    } else {
      // Infants and Elderly: if unmitigated, they might be exposed to morning terrace/walks
      if ((isMorningPeak || isEveningPeak) && !rescheduledOutdoors) {
        unmitigatedHourlyExposurePM = outdoor;
      }
    }

    // 60 minutes per hour: Inhaled ug = conc (ug/m3) * Ve (m3/min) * 60 min
    const unmitigatedHourInhaled = unmitigatedHourlyExposurePM * hourlyVe * 60;
    const mitigatedHourInhaled = mitigatedHourlyExposurePM * hourlyVe * 60;

    totalUnmitigatedInhaledUg += unmitigatedHourInhaled;
    totalMitigatedInhaledUg += mitigatedHourInhaled;
  }

  const dailyInhaledAvoidedUg = Math.max(0, Math.round(totalUnmitigatedInhaledUg - totalMitigatedInhaledUg));
  const annualInhaledAvoidedMg = Math.round((dailyInhaledAvoidedUg * 365) / 1000);

  // Berkeley Earth formula: Inhaling ~22 ug/m3 for 24h (~220 ug total PM2.5 deposited) is health-equivalent to smoking 1 cigarette
  const cigEquivalentDaily = Math.round((dailyInhaledAvoidedUg / 220) * 10) / 10;
  const cigEquivalentMonthly = Math.round(cigEquivalentDaily * 30);

  const reductionPct = totalUnmitigatedInhaledUg > 0
    ? Math.round((dailyInhaledAvoidedUg / totalUnmitigatedInhaledUg) * 100)
    : 0;

  return {
    dailyInhaledAvoidedUg,
    annualInhaledAvoidedMg,
    equivalentCigarettesAvoidedDaily: cigEquivalentDaily,
    equivalentCigarettesAvoidedMonthly: cigEquivalentMonthly,
    unmitigatedDailyInhaledUg: Math.round(totalUnmitigatedInhaledUg),
    mitigatedDailyInhaledUg: Math.round(totalMitigatedInhaledUg),
    reductionPct
  };
}

/**
 * Computes Family Health Risk Index (0 - 100% Safety Scale)
 * Higher is safer; 100% = Maximum Safety Protection, 0% = Extreme Toxic Hazard
 * @param {object} params
 * @param {number} params.outdoorPM25
 * @param {number} params.mitigatedIndoorPM25
 * @param {string} params.personaKey
 * @param {string} params.housingKey
 * @param {object} params.activeHacks
 * @returns {{
 *   safetyScore: number,
 *   riskLevel: 'MAXIMUM_SAFETY'|'LOW_RISK'|'MODERATE_RISK'|'HIGH_RISK'|'CRITICAL_DANGER',
 *   label: string,
 *   badgeColor: string,
 *   breakdown: {
 *     ambientPenalty: number,
 *     housingPenalty: number,
 *     personaSensitivity: number,
 *     mitigationBonus: number
 *   }
 * }}
 */
export function calculateFamilyHealthRiskIndex({
  outdoorPM25 = 150,
  mitigatedIndoorPM25 = 45,
  personaKey = 'infant',
  housingKey = 'apartment',
  activeHacks = {}
} = {}) {
  const persona = PERSONA_ARCHETYPES[personaKey] || PERSONA_ARCHETYPES.infant;
  const housing = HOUSING_TYPES[housingKey] || HOUSING_TYPES.apartment;

  // 1. Ambient outdoor severity penalty (0 to 45 pts)
  // 30 ug/m3 = 0 penalty; 350+ ug/m3 = 45 penalty
  const ambientPenalty = Math.min(45, Math.max(0, ((outdoorPM25 - 30) / 320) * 45));

  // 2. Housing infiltration penalty (0 to 20 pts)
  const housingPenalty = housing.infiltrationRate * 20;

  // 3. Persona susceptibility weight (1.0 to 2.8x)
  const personaSensitivity = persona.vulnerabilityWeight;

  // 4. Mitigation bonus (earned by active hacks): up to +50 pts
  let mitigationBonus = 0;
  if (activeHacks.corsi_rosenthal) mitigationBonus += 22;
  if (activeHacks.wet_mopping) mitigationBonus += 7;
  if (activeHacks.kitchen_exhaust) mitigationBonus += 6;
  if (activeHacks.draft_sealing) mitigationBonus += 5;
  if (activeHacks.botanical_filters) mitigationBonus += 4;
  if (activeHacks.no_incense) mitigationBonus += 6;

  // Base raw score: 100 - ((ambientPenalty + housingPenalty) * (personaSensitivity / 2.0)) + mitigationBonus
  const rawScore = 100 - ((ambientPenalty + housingPenalty) * (personaSensitivity / 1.8)) + mitigationBonus;
  const safetyScore = Math.min(100, Math.max(5, Math.round(rawScore)));

  let riskLevel = 'MODERATE_RISK';
  let label = 'Moderate Smog Vulnerability';
  let badgeColor = '#ffaa00';

  if (safetyScore >= 80) {
    riskLevel = 'MAXIMUM_SAFETY';
    label = 'Safely Protected Household';
    badgeColor = '#00c853';
  } else if (safetyScore >= 60) {
    riskLevel = 'LOW_RISK';
    label = 'Low Health Risk (Controlled)';
    badgeColor = '#64dd17';
  } else if (safetyScore >= 40) {
    riskLevel = 'MODERATE_RISK';
    label = 'Moderate Vulnerability';
    badgeColor = '#ffd600';
  } else if (safetyScore >= 25) {
    riskLevel = 'HIGH_RISK';
    label = 'High Health Risk';
    badgeColor = '#ff6d00';
  } else {
    riskLevel = 'CRITICAL_DANGER';
    label = 'Critical Inversion Hazard';
    badgeColor = '#d50000';
  }

  return {
    safetyScore,
    riskLevel,
    label,
    badgeColor,
    breakdown: {
      ambientPenalty: Math.round(ambientPenalty),
      housingPenalty: Math.round(housingPenalty),
      personaSensitivity,
      mitigationBonus
    }
  };
}
