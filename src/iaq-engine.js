/**
 * SmogGuard AI — Indoor Air Quality (IAQ) Hack Studio & Corsi-Rosenthal Math Engine
 * Computes DIY CADR, room ACH, particulate clearance half-life, multi-hack suppression,
 * and NASA clean air plant phytoremediation requirements.
 */

import { HOUSING_TYPES, IAQ_HACKS_CATALOG } from './constants.js';

/**
 * Filter efficiencies for PM2.5
 */
export const FILTER_EFFICIENCIES = {
  merv13: 0.85,
  hepa: 0.9997,
  merv11: 0.65
};

/**
 * Airflow pressure drop multipliers based on filter surface geometry
 */
const FILTER_COUNT_FACTORS = {
  1: 0.55, // Single flat filter on face (high resistance)
  2: 0.68,
  4: 0.82, // Standard 4-sided cube (4x surface area, low resistance)
  5: 0.90  // 5-filter cube (maximum surface area, lowest resistance)
};

/**
 * Computes Corsi-Rosenthal Box Performance Metrics
 * @param {object} params
 * @param {number} [params.fanCFM=1800] - Unloaded box fan rating (typically 1200 - 2000 CFM)
 * @param {'merv13'|'hepa'|'merv11'} [params.filterType='merv13']
 * @param {number} [params.filterCount=4] - Number of filters in cube (1 to 5)
 * @param {number} [params.bypassLeakPct=5] - Seal leakage percentage (typically 3-10%)
 * @param {number} [params.roomAreaSqFt=250] - Room floor area
 * @param {number} [params.ceilingHeightFt=10] - Ceiling height
 * @returns {{
 *   cadrCFM: number,
 *   ach: number,
 *   time90ClearMins: number,
 *   time99ClearMins: number,
 *   diyCostINR: number,
 *   commercialCostINR: number,
 *   costSavingsPct: number,
 *   isAdequate: boolean
 * }}
 */
export function calculateCorsiRosenthalCADR({
  fanCFM = 1800,
  filterType = 'merv13',
  filterCount = 4,
  bypassLeakPct = 5,
  roomAreaSqFt = 250,
  ceilingHeightFt = 10
} = {}) {
  const fan = Math.max(500, Number(fanCFM) || 1800);
  const eta = FILTER_EFFICIENCIES[filterType] || FILTER_EFFICIENCIES.merv13;
  const countFactor = FILTER_COUNT_FACTORS[filterCount] || 0.82;
  const bypass = Math.min(30, Math.max(0, Number(bypassLeakPct) || 5)) / 100;

  // Single-pass effective filtration efficiency accounting for tape bypass
  const effectiveEta = eta * (1 - bypass);

  // Loaded fan airflow through filter media
  const loadedFlowCFM = fan * countFactor;

  // CADR = Q_eff * eta_eff
  const cadrCFM = Math.round(loadedFlowCFM * effectiveEta);

  // Room volume in cubic feet
  const roomArea = Math.max(50, Number(roomAreaSqFt) || 250);
  const height = Math.max(7, Number(ceilingHeightFt) || 10);
  const roomVolumeCuFt = roomArea * height;

  // ACH = (CADR * 60) / Volume
  const ach = Math.round(((cadrCFM * 60) / roomVolumeCuFt) * 10) / 10;

  // Time to clear 90% particulates: t90 = -ln(0.10) / ACH * 60 minutes = 2.3026 / ACH * 60
  // Time to clear 99% particulates: t99 = -ln(0.01) / ACH * 60 minutes = 4.6052 / ACH * 60
  const time90ClearMins = ach > 0 ? Math.round((2.3026 / ach) * 60) : 0;
  const time99ClearMins = ach > 0 ? Math.round((4.6052 / ach) * 60) : 0;

  // Cost economics (INR)
  // DIY: 20" Box fan (~₹1,800) + 4 MERV13 filters (~₹600 each = ₹2,400) + duct tape & cardboard (~₹300) = ₹4,500
  const diyCostINR = Math.round(1800 + (filterCount * 650) + 300);
  // Commercial HEPA offering ~500 CFM CADR (e.g., Coway Airmega 400 or Philips 3000i series) = ₹32,000+
  const commercialCostINR = Math.round(cadrCFM * 65);
  const costSavingsPct = Math.round(((commercialCostINR - diyCostINR) / commercialCostINR) * 100);

  // Adequate standard: ACH >= 4.0 for respiratory protection in winter smog
  const isAdequate = ach >= 4.0;

  return {
    cadrCFM,
    ach,
    time90ClearMins,
    time99ClearMins,
    diyCostINR,
    commercialCostINR,
    costSavingsPct,
    isAdequate,
    roomVolumeCuFt
  };
}

/**
 * Calculates Indoor PM2.5 with and without multi-hack mitigations
 * @param {number} outdoorPM25
 * @param {string} [housingTypeKey='apartment']
 * @param {object} [activeHacks={}] - Boolean map of active hacks
 * @returns {{
 *   unmitigatedPM25: number,
 *   mitigatedPM25: number,
 *   reductionPct: number,
 *   absoluteReduction: number,
 *   hackImpacts: Array<{ id: string, name: string, reductionContribution: number }>
 * }}
 */
export function calculateIndoorPM25(outdoorPM25, housingTypeKey = 'apartment', activeHacks = {}) {
  const outdoor = Math.max(10, Number(outdoorPM25) || 150);
  const housing = HOUSING_TYPES[housingTypeKey] || HOUSING_TYPES.apartment;
  const infiltration = housing.infiltrationRate;

  // Unmitigated indoor baseline: outdoor infiltration + standard internal sources (cooking + agarbatti)
  // Internal source if incense/agarbatti is NOT checked as avoided = +95 ug/m3
  const hasIncense = !activeHacks.no_incense;
  const internalLoad = hasIncense ? 95 : 15; // 15 ug/m3 baseline cooking/resuspension
  const unmitigatedPM25 = Math.round(outdoor * infiltration + internalLoad);

  // Mitigated calculation:
  // Sequential fractional suppression
  let indoorInfiltrated = outdoor * infiltration;
  const hackImpacts = [];

  // Corsi-Rosenthal Box active
  if (activeHacks.corsi_rosenthal) {
    const delta = indoorInfiltrated * 0.72;
    indoorInfiltrated -= delta;
    hackImpacts.push({ id: 'corsi_rosenthal', name: 'Corsi-Rosenthal Box', reductionContribution: Math.round(delta) });
  }

  // Wet Mopping active
  if (activeHacks.wet_mopping) {
    const delta = indoorInfiltrated * 0.22;
    indoorInfiltrated -= delta;
    hackImpacts.push({ id: 'wet_mopping', name: 'Wet-Mopping Protocol', reductionContribution: Math.round(delta) });
  }

  // Kitchen exhaust & lid active
  if (activeHacks.kitchen_exhaust) {
    const delta = indoorInfiltrated * 0.18;
    indoorInfiltrated -= delta;
    hackImpacts.push({ id: 'kitchen_exhaust', name: 'Kitchen Exhaust & Lid Cooking', reductionContribution: Math.round(delta) });
  }

  // Draft Sealing active
  if (activeHacks.draft_sealing) {
    const delta = indoorInfiltrated * 0.15;
    indoorInfiltrated -= delta;
    hackImpacts.push({ id: 'draft_sealing', name: 'Door & Window Draft Sealing', reductionContribution: Math.round(delta) });
  }

  // Botanical Flora active
  if (activeHacks.botanical_filters) {
    const delta = indoorInfiltrated * 0.08;
    indoorInfiltrated -= delta;
    hackImpacts.push({ id: 'botanical_filters', name: 'NASA Botanical Flora', reductionContribution: Math.round(delta) });
  }

  // Agarbatti avoided
  if (activeHacks.no_incense) {
    hackImpacts.push({ id: 'no_incense', name: 'Cessation of Agarbatti / Coils', reductionContribution: 80 });
  }

  const mitigatedPM25 = Math.max(10, Math.round(indoorInfiltrated + (hasIncense ? 95 : 5)));
  const absoluteReduction = Math.max(0, unmitigatedPM25 - mitigatedPM25);
  const reductionPct = Math.round((absoluteReduction / unmitigatedPM25) * 100);

  return {
    unmitigatedPM25,
    mitigatedPM25,
    reductionPct,
    absoluteReduction,
    hackImpacts
  };
}

/**
 * Calculates NASA Clean Air Plant recommendations based on room size
 * @param {number} roomAreaSqFt
 * @returns {{
 *   totalPlantsRecommended: number,
 *   breakdown: Array<{ name: string, count: number, purpose: string }>
 * }}
 */
export function calculatePlantRequirements(roomAreaSqFt = 250) {
  const area = Math.max(50, Number(roomAreaSqFt) || 250);
  // NASA guideline: 1 plant per 100 sq ft minimum, 2 per 100 sq ft for active bio-filtration
  const total = Math.max(3, Math.round((area / 100) * 1.8));

  const snakePlant = Math.max(1, Math.round(total * 0.35));
  const arecaPalm = Math.max(1, Math.round(total * 0.25));
  const spiderPlant = Math.max(1, Math.round(total * 0.25));
  const moneyPlant = Math.max(1, total - snakePlant - arecaPalm - spiderPlant);

  return {
    totalPlantsRecommended: snakePlant + arecaPalm + spiderPlant + moneyPlant,
    breakdown: [
      { name: 'Snake Plant (Sansevieria)', count: snakePlant, purpose: 'Bedroom night O2 & benzene absorption' },
      { name: 'Areca Palm', count: arecaPalm, purpose: 'Natural room humidifier & micro-dust settling' },
      { name: 'Spider Plant', count: spiderPlant, purpose: 'Carbon monoxide & formaldehyde scrubbing' },
      { name: 'Money Plant (Pothos)', count: moneyPlant, purpose: 'Waxy leaf surface PM2.5 interception' }
    ]
  };
}
