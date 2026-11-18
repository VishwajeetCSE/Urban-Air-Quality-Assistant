/**
 * @fileoverview DIY Air Purifier Aerodynamics, ACH Physics, and Botanical Bio-Shield Engine
 * @module hacks-engine
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

import { DIY_PURIFIER_CONFIGS, NASA_PLANT_ROSTER } from './constants.js';
import { clamp } from './security.js';

/**
 * Computes fluid-dynamic airflow, CADR, Air Changes per Hour (ACH), and particle clearance decay
 *
 * @param {object} params
 * @param {number} [params.roomLengthFt=15]
 * @param {number} [params.roomWidthFt=12]
 * @param {number} [params.roomHeightFt=10]
 * @param {number} [params.fanCFM=1800] Typical 20-inch box fan rating
 * @param {number} [params.filterCount=4] Standard 4-panel cube
 * @param {'merv13'|'merv11'|'hepa'} [params.filterGrade='merv13']
 * @returns {object} Physical metrics and clearance duration
 */
export function calculateCorsiRosenthalSpecs({
  roomLengthFt = 15,
  roomWidthFt = 12,
  roomHeightFt = 10,
  fanCFM = 1800,
  filterCount = 4,
  filterGrade = 'merv13'
} = {}) {
  const l = clamp(roomLengthFt, 6, 60, 15);
  const w = clamp(roomWidthFt, 6, 60, 12);
  const h = clamp(roomHeightFt, 7, 20, 10);
  const volumeCuFt = l * w * h;
  const areaSqFt = l * w;

  // Filter single-pass efficiency on PM2.5
  const efficiency = filterGrade === 'hepa' ? 0.99 : (filterGrade === 'merv13' ? 0.85 : 0.65);

  // Cardboard shroud pressure multiplier (+35% fan efficiency by preventing vortex backflow)
  const shroudMultiplier = 1.35;

  // Surface area reduction factor: 4 or 5 filters in parallel drop static resistance by 70%
  const resistanceRelief = Math.min(1.0, 0.45 + (filterCount * 0.12));

  // Effective Clean Air Delivery Rate (CADR in CFM)
  const effectiveCadrCFM = Math.round(fanCFM * resistanceRelief * efficiency * (shroudMultiplier / 1.5));

  // Air Changes Per Hour (ACH): (CADR * 60) / Room Volume
  const ach = Math.round(((effectiveCadrCFM * 60) / volumeCuFt) * 10) / 10;

  // Exponential particle clearance times: t = ln(1 / (1 - Fraction)) / ACH
  // 50% clearance: ln(2) / ACH * 60 min
  const t50Min = ach > 0 ? Math.round((0.693 / ach) * 60) : 999;
  // 90% clearance: ln(10) / ACH * 60 min
  const t90Min = ach > 0 ? Math.round((2.303 / ach) * 60) : 999;
  // 99% clearance: ln(100) / ACH * 60 min
  const t99Min = ach > 0 ? Math.round((4.605 / ach) * 60) : 999;

  // ACH Rating according to CDC / Harvard Healthy Buildings guidelines:
  // < 3: Deficient; 3-5: Moderate; 5-6: Good; > 6: Ideal for Vulnerable Care
  let achRating = 'Adequate';
  if (ach >= 6.0) achRating = 'Excellent (Hospital / Vulnerable Care Grade)';
  else if (ach >= 4.0) achRating = 'Good (Safe for Residential Living)';
  else if (ach >= 2.5) achRating = 'Moderate (Minimum Acceptable)';
  else achRating = 'Underpowered (Increase Fan CFM or Add Units)';

  const diyCostINR = 3800;
  const compHepaCostINR = 19500;
  const savingsINR = compHepaCostINR - diyCostINR;
  const savingsPct = Math.round((savingsINR / compHepaCostINR) * 100);

  return {
    dimensions: { length: l, width: w, height: h, volumeCuFt, areaSqFt },
    effectiveCadrCFM,
    effectiveCadrM3Hr: Math.round(effectiveCadrCFM * 1.699),
    ach,
    achRating,
    clearanceTimes: {
      t50Min,
      t90Min,
      t99Min
    },
    costComparison: {
      diyCostINR,
      compHepaCostINR,
      savingsINR,
      savingsPct
    }
  };
}

/**
 * Calculates cumulative indoor PM2.5 suppression achieved across adopted DIY hacks
 *
 * @param {string[]} activeHackKeys
 * @param {number} outdoorPM25
 * @returns {object} Final expected indoor PM2.5 and suppression percentage
 */
export function calculateIndoorSuppression(activeHackKeys = [], outdoorPM25 = 200) {
  const hackCatalog = {
    corsi_rosenthal: { name: 'DIY Corsi-Rosenthal Multi-Stage Purifier', reductionPct: 65 },
    window_sealing: { name: 'Silicone Weatherstrip Gap Sealing', reductionPct: 12 },
    wet_mopping: { name: 'Microfibre Wet-Mopping Protocol', reductionPct: 8 },
    kitchen_exhaust: { name: 'Cooktop Range Hood with Backdraft Damper', reductionPct: 5 },
    incense_ban: { name: 'Zero Incense / Mosquito Coil Combustion', reductionPct: 8 },
    phytoremediation: { name: 'Botanical VOC Bio-Shield Matrix', reductionPct: 4 }
  };

  let totalSuppressionPct = 0;
  const activeItems = [];

  activeHackKeys.forEach(key => {
    if (hackCatalog[key]) {
      totalSuppressionPct += hackCatalog[key].reductionPct;
      activeItems.push(hackCatalog[key].name);
    }
  });

  // Diminishing returns ceiling (maximum 92% passive/active suppression)
  const effectiveReductionPct = Math.min(92, totalSuppressionPct);
  const indoorPM25 = Math.max(12, Math.round(outdoorPM25 * (1 - effectiveReductionPct / 100)));

  return {
    outdoorPM25,
    indoorPM25,
    effectiveReductionPct,
    activeItems,
    isSafeLevel: indoorPM25 <= 25
  };
}

/**
 * Calculates NASA Clean-Air botanical phytoremediation requirement for room volume
 *
 * @param {number} areaSqFt
 * @returns {object} Recommended plant inventory and volatile organic compound removal targets
 */
export function calculateBotanicalNeeds(areaSqFt = 180) {
  const area = clamp(areaSqFt, 50, 1000, 180);
  const scaling = area / 100;

  const plants = NASA_PLANT_ROSTER.map(p => {
    const recommendedPots = Math.max(1, Math.round(p.unitsPer100SqFt * scaling));
    return {
      ...p,
      recommendedPots
    };
  });

  const totalPots = plants.reduce((sum, p) => sum + p.recommendedPots, 0);

  return {
    areaSqFt: area,
    totalPots,
    plants,
    primaryBenefits: [
      'Removes toxic indoor VOCs (Formaldehyde, Benzene, Toluene) from plywood & paint',
      'Snake plants conduct Crassulacean Acid Metabolism (releases Oxygen at night during sleep)',
      'Natural humidity balance suppresses dust resuspension in dry winter conditions'
    ]
  };
}
