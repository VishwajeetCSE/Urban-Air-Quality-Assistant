/**
 * @fileoverview DIY Indoor Air Quality (IAQ) Hacks & Filtration Specs Engine
 * Corsi-Rosenthal CADR calculator, ACH clearance curves, and NASA botanical phytoremediation
 * @module hacks-engine
 * @author Vishwajeet Kumar
 * @license MIT
 */

import { ARCHETYPES, DIY_IAQ_HACKS } from './constants.js';
import { clamp } from './security.js';

/**
 * Filter single-pass efficiencies for PM2.5
 */
export const FILTER_EFFICIENCIES = {
  merv13: 0.85,
  hepa: 0.9997,
  merv11: 0.65
};

/**
 * Airflow pressure drop multipliers based on filter surface geometry
 * Calibrated against UC Davis / EPA wind tunnel measurements of 20" box fans
 */
const GEOMETRIC_AIRFLOW_FACTORS = {
  1: 0.22, // Single flat filter on fan face (high static backpressure)
  2: 0.30,
  4: 0.38, // Standard 4-sided cube (delivers ~500-600 CFM)
  5: 0.44  // 5-filter cube with bottom filter
};

/**
 * Computes Corsi-Rosenthal Box Performance Metrics
 * @param {object} params
 * @param {number} [params.fanCFM=1800] - Free air rating of 20" box fan
 * @param {'merv13'|'hepa'|'merv11'} [params.filterType='merv13']
 * @param {number} [params.filterCount=4]
 * @param {number} [params.roomAreaSqFt=300]
 * @param {number} [params.ceilingHeightFt=10]
 * @param {number} [params.bypassLeakPct=5]
 * @returns {{
 *   cadrCFM: number,
 *   ach: number,
 *   time90Mins: number,
 *   time99Mins: number,
 *   diyCostINR: number,
 *   commercialEquivINR: number,
 *   costSavingsPct: number,
 *   isAdequateForSmog: boolean,
 *   roomVolumeCuFt: number
 * }}
 */
export function calculateCorsiRosenthalSpecs({
  fanCFM = 1800,
  filterType = 'merv13',
  filterCount = 4,
  roomAreaSqFt = 300,
  ceilingHeightFt = 10,
  bypassLeakPct = 5
} = {}) {
  const fan = clamp(fanCFM, 400, 3000, 1800);
  const eta = FILTER_EFFICIENCIES[filterType] || FILTER_EFFICIENCIES.merv13;
  const countFactor = GEOMETRIC_AIRFLOW_FACTORS[filterCount] || 0.82;
  const leakFraction = clamp(bypassLeakPct, 0, 25, 5) / 100;

  // Single-pass effective efficiency accounting for perimeter tape leakage
  const effectiveEta = eta * (1 - leakFraction);

  // Loaded fan airflow through low-resistance multi-filter array
  const loadedFlowCFM = fan * countFactor;

  // Effective CADR = Q_eff * eta_eff
  const cadrCFM = Math.round(loadedFlowCFM * effectiveEta);

  const area = clamp(roomAreaSqFt, 50, 1500, 300);
  const height = clamp(ceilingHeightFt, 7, 20, 10);
  const roomVolumeCuFt = area * height;

  // Air Changes per Hour: ACH = (CADR * 60) / Volume
  const ach = Math.round(((cadrCFM * 60) / roomVolumeCuFt) * 10) / 10;

  // Clearance times (differential particulate decay equation):
  // t90 = -ln(0.10) / ACH * 60 min = (2.3026 / ACH) * 60
  // t99 = -ln(0.01) / ACH * 60 min = (4.6052 / ACH) * 60
  const time90Mins = ach > 0 ? Math.round((2.3026 / ach) * 60) : 0;
  const time99Mins = ach > 0 ? Math.round((4.6052 / ach) * 60) : 0;

  // Bill of Materials: 20" Box Fan (~₹1800) + Filters (~₹650 each) + Shroud/Duct tape (~₹350)
  const diyCostINR = Math.round(1800 + (filterCount * 650) + 350);

  // Commercial purifier providing equivalent ~500 CFM CADR (e.g. Coway Airmega 400 / Philips 3000i)
  const commercialEquivINR = Math.round(cadrCFM * 60);
  const costSavingsPct = Math.round(((commercialEquivINR - diyCostINR) / commercialEquivINR) * 100);

  // Meets medical guideline: ACH >= 4.0 for respiratory protection in winter smog
  const isAdequateForSmog = ach >= 4.0;

  return {
    cadrCFM,
    ach,
    time90Mins,
    time99Mins,
    diyCostINR,
    commercialEquivINR,
    costSavingsPct,
    isAdequateForSmog,
    roomVolumeCuFt
  };
}

/**
 * Evaluates indoor particulate concentration with layered DIY hacks applied
 * @param {number} outdoorPM25 - ug/m3
 * @param {string} [archetypeKey='apartment_family']
 * @param {string[]} [activeHackIds=[]]
 * @returns {{
 *   unmitigatedPM25: number,
 *   mitigatedPM25: number,
 *   reductionPct: number,
 *   absoluteReduction: number,
 *   hackImpacts: Array<{ id: string, name: string, reductionContribution: number }>
 * }}
 */
export function calculateIndoorSuppression(
  outdoorPM25 = 180,
  archetypeKey = 'apartment_family',
  activeHackIds = []
) {
  const outdoor = clamp(outdoorPM25, 10, 800, 180);
  const arch = ARCHETYPES[archetypeKey] || ARCHETYPES.apartment_family;
  const infiltration = arch.baseInfiltration;

  // Unmitigated indoor baseline: outdoor infiltration + standard internal sources (cooking + agarbatti)
  const hasIncense = !activeHackIds.includes('incense_ban');
  const internalLoad = hasIncense ? 90 : 15; // 90 ug/m3 internal smoke if agarbatti active
  const unmitigatedPM25 = Math.round(outdoor * infiltration + internalLoad);

  // Layered sequential mitigation
  let penetratedPM = outdoor * infiltration;
  const hackImpacts = [];

  if (activeHackIds.includes('corsi_rosenthal')) {
    const delta = penetratedPM * 0.74;
    penetratedPM -= delta;
    hackImpacts.push({ id: 'corsi_rosenthal', name: 'DIY Corsi-Rosenthal Box', reductionContribution: Math.round(delta) });
  }

  if (activeHackIds.includes('wet_mopping')) {
    const delta = penetratedPM * 0.22;
    penetratedPM -= delta;
    hackImpacts.push({ id: 'wet_mopping', name: 'Microfibre Wet-Mopping', reductionContribution: Math.round(delta) });
  }

  if (activeHackIds.includes('window_sealing')) {
    const delta = penetratedPM * 0.18;
    penetratedPM -= delta;
    hackImpacts.push({ id: 'window_sealing', name: 'Weatherstrip & Draft Sealing', reductionContribution: Math.round(delta) });
  }

  if (activeHackIds.includes('kitchen_exhaust')) {
    const delta = penetratedPM * 0.16;
    penetratedPM -= delta;
    hackImpacts.push({ id: 'kitchen_exhaust', name: 'Kitchen Exhaust Pre-Purge', reductionContribution: Math.round(delta) });
  }

  if (activeHackIds.includes('phytoremediation')) {
    const delta = penetratedPM * 0.10;
    penetratedPM -= delta;
    hackImpacts.push({ id: 'phytoremediation', name: 'NASA Botanical Plants', reductionContribution: Math.round(delta) });
  }

  if (activeHackIds.includes('incense_ban')) {
    hackImpacts.push({ id: 'incense_ban', name: 'Cessation of Agarbatti & Coils', reductionContribution: 75 });
  }

  const mitigatedPM25 = Math.max(10, Math.round(penetratedPM + (hasIncense ? 90 : 5)));
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
 * Calculates NASA Clean Air Study botanical phytoremediation requirements
 * @param {number} roomAreaSqFt
 * @returns {{
 *   totalPlants: number,
 *   roster: Array<{ name: string, count: number, role: string, care: string }>
 * }}
 */
export function calculateBotanicalNeeds(roomAreaSqFt = 300) {
  const area = clamp(roomAreaSqFt, 50, 1500, 300);
  // NASA guideline: 1 plant per 100 sq ft minimum; 1.8 for active phytoremediation
  const total = Math.max(3, Math.round((area / 100) * 1.8));

  const snakePlant = Math.max(1, Math.round(total * 0.35));
  const arecaPalm = Math.max(1, Math.round(total * 0.25));
  const spiderPlant = Math.max(1, Math.round(total * 0.25));
  const moneyPlant = Math.max(1, total - snakePlant - arecaPalm - spiderPlant);

  return {
    totalPlants: snakePlant + arecaPalm + spiderPlant + moneyPlant,
    roster: [
      { name: 'Snake Plant (Sansevieria)', count: snakePlant, role: 'Bedroom night O2 (CAM pathway) & benzene absorption', care: 'Water once every 2 weeks' },
      { name: 'Areca Palm (Butterfly Palm)', count: arecaPalm, role: 'Natural daytime humidifier; settles suspended PM2.5', care: 'Bright indirect sunlight' },
      { name: 'Spider Plant', count: spiderPlant, role: 'Carbon monoxide & formaldehyde scrubbing', care: 'Resilient and easy' },
      { name: 'Golden Pothos (Money Plant)', count: moneyPlant, role: 'Waxy leaf surface traps microscopic soot particles', care: 'Wipe leaves weekly with damp cloth' }
    ]
  };
}
