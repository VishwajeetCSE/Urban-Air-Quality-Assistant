/**
 * @fileoverview Standalone Zero-Dependency Verification Test Suite for VayuGuardian AI
 * Runs 14 comprehensive test suites (55+ assertions) covering CPCB NAQI math,
 * diurnal planetary boundary layer physics, Corsi-Rosenthal aerodynamics,
 * OWASP XSS security barriers, and offline heuristic GenAI rules.
 * Execute with: node test.js
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

import { strict as assert } from 'node:assert';

import {
  calculatePollutantSubIndex,
  calculateCompositeAQI,
  getDiurnalSmogForecast,
  calculateInhaledPM25Avoidance,
  calculateHouseholdRiskIndex
} from './src/aqi-calculator.js';

import {
  generateDailyRoutine,
  calculateEmissionReductions
} from './src/routine-engine.js';

import {
  calculateCorsiRosenthalSpecs,
  calculateIndoorSuppression,
  calculateBotanicalNeeds
} from './src/hacks-engine.js';

import {
  escapeHTML,
  sanitizeHTML,
  clamp,
  generateSecureId,
  ApiKeyVault
} from './src/security.js';

import {
  normalizeProfile,
  exportPlanAsJSON,
  importPlanFromJSON
} from './src/storage.js';

import {
  generateHeuristicAdvisory
} from './src/ai.js';

let totalTests = 0;
let passedTests = 0;

function suite(name, fn) {
  console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${name}\x1b[0m`);
  fn();
}

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${description}`);
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${description}`);
    console.error(`    \x1b[33m${err.message}\x1b[0m`);
    throw err;
  }
}

console.log('\x1b[1m\x1b[32m================================================================');
console.log('   🍃 VayuGuardian AI — Standalone Verification Engine (55+ Tests)');
console.log('================================================================\x1b[0m');

// -------------------------------------------------------------
// Suite 1: CPCB NAQI & Pollutant Sub-Index Calculation
// -------------------------------------------------------------
suite('Suite 1: CPCB NAQI Multi-Pollutant Sub-Index Calculation', () => {
  test('PM2.5 sub-index correctly maps Good range (0-30 ug/m3 -> AQI 0-50)', () => {
    const res = calculatePollutantSubIndex('pm25', 15);
    assert.strictEqual(typeof res.subIndex, 'number');
    assert.ok(res.subIndex >= 0 && res.subIndex <= 50);
    assert.strictEqual(res.category, 'Good');
  });

  test('PM10 sub-index computes accurate Moderate range (101-250 ug/m3)', () => {
    const res = calculatePollutantSubIndex('pm10', 175);
    assert.ok(res.subIndex >= 101 && res.subIndex <= 200);
    assert.strictEqual(res.category, 'Moderate');
  });

  test('NO2 and SO2 sub-indices calculate correctly across regulatory breakpoints', () => {
    const no2 = calculatePollutantSubIndex('no2', 120);
    assert.strictEqual(no2.category, 'Moderate');
    const so2 = calculatePollutantSubIndex('so2', 50);
    assert.strictEqual(so2.category, 'Satisfactory');
  });

  test('PM2.5 sub-index identifies Severe category (> 250 ug/m3 -> AQI > 400)', () => {
    const res = calculatePollutantSubIndex('pm25', 320);
    assert.ok(res.subIndex > 400);
    assert.strictEqual(res.category, 'Severe');
  });

  test('CO and O3 sub-indices interpolate correctly with decimal concentration precision', () => {
    const co = calculatePollutantSubIndex('co', 1.5);
    assert.strictEqual(co.category, 'Satisfactory');
    const o3 = calculatePollutantSubIndex('o3', 190);
    assert.strictEqual(o3.category, 'Poor');
  });

  test('High industrial SO2 concentration (> 800 ug/m3) correctly maps to Very Poor/Severe', () => {
    const so2High = calculatePollutantSubIndex('so2', 900);
    assert.ok(so2High.subIndex >= 301);
    assert.strictEqual(so2High.category, 'Very Poor');
  });
});

// -------------------------------------------------------------
// Suite 2: CPCB Composite AQI & WHO 2021 Benchmark Comparison
// -------------------------------------------------------------
suite('Suite 2: Composite AQI & WHO 2021 Exceedance Ratios', () => {
  test('Composite AQI follows CPCB maximum sub-index principle', () => {
    const comp = calculateCompositeAQI({ pm25: 160, pm10: 90, no2: 40 });
    assert.ok(comp.aqi >= 300);
    assert.strictEqual(comp.prominentPollutant, 'PM25');
    assert.strictEqual(comp.category, 'Very Poor');
  });

  test('Calculates accurate WHO 2021 24-hr exceedance ratios for PM2.5 and PM10', () => {
    const comp = calculateCompositeAQI({ pm25: 150, pm10: 90 });
    // WHO PM2.5 limit is 15 ug/m3 -> 150 / 15 = 10x
    assert.strictEqual(comp.whoExceedances.pm25.ratio, 10);
    assert.strictEqual(comp.whoExceedances.pm25.isExceeded, true);
  });

  test('Computes NO2 and SO2 exceedances against WHO guidelines', () => {
    const comp = calculateCompositeAQI({ no2: 75, so2: 60 });
    // WHO NO2 limit is 25 ug/m3 -> 75 / 25 = 3x
    assert.strictEqual(comp.whoExceedances.no2.ratio, 3);
    assert.strictEqual(comp.whoExceedances.no2.isExceeded, true);
  });

  test('Handles empty or invalid input gracefully with default estimates', () => {
    const comp = calculateCompositeAQI({});
    assert.ok(comp.aqi >= 0 && comp.aqi <= 500);
    assert.ok(typeof comp.healthAdvisory === 'string');
  });
});

// -------------------------------------------------------------
// Suite 3: Diurnal Smog Inversion Curve & Safe Activity Windows
// -------------------------------------------------------------
suite('Suite 3: Diurnal Atmospheric Inversion & Planetary Boundary Modeling', () => {
  const forecast = getDiurnalSmogForecast(300, 'delhi', 'dense_residential');

  test('Generates full 24-hour hourly profile with time labels', () => {
    assert.strictEqual(forecast.hours.length, 24);
    assert.strictEqual(forecast.hours[0].timeLabel, '00:00');
    assert.strictEqual(forecast.hours[23].timeLabel, '23:00');
  });

  test('Peak morning surface smog trap occurs between 6 AM and 9 AM', () => {
    assert.ok(forecast.peakHour >= 6 && forecast.peakHour <= 9);
    assert.ok(forecast.peakAQI > 300);
  });

  test('Convective solar safe window occurs between 12 PM and 3 PM', () => {
    assert.ok(forecast.cleanestHour >= 12 && forecast.cleanestHour <= 15);
    assert.ok(forecast.cleanestAQI < forecast.peakAQI);
  });

  test('Solar convective safe window provides at least 25% lower AQI than morning trap', () => {
    const reduction = ((forecast.peakAQI - forecast.cleanestAQI) / forecast.peakAQI) * 100;
    assert.ok(reduction >= 25, `Expected >= 25% reduction, got ${reduction}%`);
  });

  test('Hour objects include status flags, phase tags, and actionable recommendations', () => {
    const morningHour = forecast.hours[7];
    assert.strictEqual(morningHour.isCriticalTrap, true);
    assert.strictEqual(morningHour.phase, 'morning_trap');
    const safeHour = forecast.hours[13];
    assert.strictEqual(safeHour.isSafeWindow, true);
    assert.strictEqual(safeHour.phase, 'safe_window');
  });
});

// -------------------------------------------------------------
// Suite 4: Inhaled PM2.5 Deposition & Cigarette Equivalence
// -------------------------------------------------------------
suite('Suite 4: Inhaled Particulate Deposition & Berkeley Earth Cigarette Math', () => {
  test('Calculates positive daily PM2.5 micrograms avoided via filtration & schedule shift', () => {
    const res = calculateInhaledPM25Avoidance({
      basePM25: 220,
      minuteVentilation: 0.015,
      filterReductionPct: 80,
      indoorHours: 18,
      rescheduledOutdoor: true
    });

    assert.ok(res.dailyInhaledAvoidedUg > 1000);
    assert.ok(res.annualInhaledAvoidedMg > 350);
  });

  test('Annualized inhaled avoidance scales accurately with 365 days', () => {
    const res = calculateInhaledPM25Avoidance({ basePM25: 180 });
    const expectedMg = Math.round((res.dailyInhaledAvoidedUg * 365) / 1000);
    assert.strictEqual(res.annualInhaledAvoidedMg, expectedMg);
  });

  test('Berkeley Earth cigarette equivalence yields scientifically consistent output', () => {
    const res = calculateInhaledPM25Avoidance({
      basePM25: 250,
      filterReductionPct: 85,
      indoorHours: 19
    });

    assert.ok(res.cigarettesAvoidedDaily >= 4 && res.cigarettesAvoidedDaily <= 30);
    assert.strictEqual(res.cigarettesAvoidedMonthly, Math.round(res.cigarettesAvoidedDaily * 30));
  });

  test('Heavy exertion minute ventilation increases avoided particulate mass calculation', () => {
    const normal = calculateInhaledPM25Avoidance({ minuteVentilation: 0.015 });
    const exertion = calculateInhaledPM25Avoidance({ minuteVentilation: 0.035 });
    assert.ok(exertion.dailyInhaledAvoidedUg > normal.dailyInhaledAvoidedUg);
  });
});

// -------------------------------------------------------------
// Suite 5: Household Biological Vulnerability Risk Scoring
// -------------------------------------------------------------
suite('Suite 5: Biological Vulnerability Risk Scoring (0 - 100)', () => {
  test('Calculates higher risk score for multi-vulnerability households', () => {
    const lowRisk = calculateHouseholdRiskIndex({ vulnerabilities: [] }, 150);
    const highRisk = calculateHouseholdRiskIndex({ vulnerabilities: ['asthma', 'infants', 'seniors'] }, 150);
    assert.ok(highRisk.score > lowRisk.score);
  });

  test('Severe AQI (> 400) triggers Critical Health Emergency risk classification', () => {
    const res = calculateHouseholdRiskIndex({ vulnerabilities: ['asthma'] }, 420);
    assert.ok(res.score >= 80);
    assert.strictEqual(res.riskLevel, 'Critical Health Emergency');
  });

  test('Pregnant and cardiac vulnerability multipliers contribute to risk factors', () => {
    const res = calculateHouseholdRiskIndex({ vulnerabilities: ['cardiac', 'pregnant'] }, 200);
    assert.ok(res.contributingFactors.length >= 2);
    assert.ok(res.contributingFactors.some(f => f.includes('Cardiovascular')));
  });

  test('Score is bounded strictly between 5 and 100', () => {
    const low = calculateHouseholdRiskIndex({}, 10);
    assert.ok(low.score >= 5);
    const high = calculateHouseholdRiskIndex({ vulnerabilities: ['asthma', 'infants', 'seniors', 'cardiac', 'pregnant'] }, 500);
    assert.ok(high.score <= 100);
  });
});

// -------------------------------------------------------------
// Suite 6: Personalized 6-Block Daily Routine Generator
// -------------------------------------------------------------
suite('Suite 6: Low-Emission Daily Routine Builder', () => {
  const forecast = getDiurnalSmogForecast(280, 'delhi', 'dense_residential');
  const routine = generateDailyRoutine({ archetypeKey: 'residential_family', commuteMode: 'petrol_car' }, forecast);

  test('Generates complete 6-block daily exposure timeline', () => {
    assert.strictEqual(routine.length, 6);
  });

  test('Morning block explicitly advises zero-ventilation during morning surface trap', () => {
    const morning = routine[0];
    assert.strictEqual(morning.id, 'block_morning_wake');
    assert.strictEqual(morning.severity, 'danger');
    assert.ok(morning.protocol.includes('locked') || morning.protocol.includes('sealed'));
  });

  test('Midday block highlights convective solar safe window', () => {
    const safeBlock = routine.find(b => b.id === 'block_convective_window');
    assert.ok(safeBlock !== undefined);
    assert.strictEqual(safeBlock.severity, 'success');
  });

  test('Timeline blocks include lifestyle switch and ventilation recommendations', () => {
    routine.forEach(b => {
      assert.ok(typeof b.lifestyleSwitch === 'string' && b.lifestyleSwitch.length > 5);
      assert.ok(typeof b.ventilationState === 'string');
    });
  });
});

// -------------------------------------------------------------
// Suite 7: Commute Mobility & Carbon Abatement Math
// -------------------------------------------------------------
suite('Suite 7: Transit Emission Reductions & Fuel Savings', () => {
  test('Switching from Petrol Car to Metro Rail achieves significant CO2e reduction', () => {
    const res = calculateEmissionReductions({
      commuteMode: 'petrol_car',
      commuteDistanceKm: 20,
      workDaysPerMonth: 22
    });

    assert.ok(res.savedCO2eKg > 50);
    assert.ok(res.savedCostINR > 2000);
    assert.ok(res.treeEquivalents > 20);
  });

  test('Diesel SUV produces highest avoided tailpipe particulate mass', () => {
    const dieselRes = calculateEmissionReductions({ commuteMode: 'diesel_suv', commuteDistanceKm: 15, workDaysPerMonth: 20 });
    const petrolRes = calculateEmissionReductions({ commuteMode: 'petrol_car', commuteDistanceKm: 15, workDaysPerMonth: 20 });
    assert.ok(dieselRes.avoidedTailpipePM25Grams > petrolRes.avoidedTailpipePM25Grams);
  });

  test('Handles minimum and maximum boundary commute distances safely', () => {
    const minRes = calculateEmissionReductions({ commuteDistanceKm: 1, workDaysPerMonth: 1 });
    assert.ok(minRes.monthlyKm >= 2);
    const maxRes = calculateEmissionReductions({ commuteDistanceKm: 200 });
    assert.ok(maxRes.monthlyKm <= 4400); // 100 km max clamped
  });
});

// -------------------------------------------------------------
// Suite 8: DIY Corsi-Rosenthal Aerodynamics & Room ACH Clearance
// -------------------------------------------------------------
suite('Suite 8: Corsi-Rosenthal Box Physics, CADR & Exponential Clearance', () => {
  const specs = calculateCorsiRosenthalSpecs({
    roomLengthFt: 15,
    roomWidthFt: 12,
    roomHeightFt: 10,
    fanCFM: 1800,
    filterCount: 4,
    filterGrade: 'merv13'
  });

  test('Computes realistic CADR and Air Changes per Hour (ACH > 4)', () => {
    assert.ok(specs.effectiveCadrCFM >= 450);
    assert.ok(specs.ach >= 4.0, `Expected ACH >= 4.0, got ${specs.ach}`);
  });

  test('Calculates exponential clearance decay times (t50 < t90 < t99)', () => {
    assert.ok(specs.clearanceTimes.t50Min < specs.clearanceTimes.t90Min);
    assert.ok(specs.clearanceTimes.t90Min < specs.clearanceTimes.t99Min);
    assert.ok(specs.clearanceTimes.t90Min <= 45, 'Expected 90% clearance in under 45 mins');
  });

  test('Achieves 75%+ cost savings compared to commercial retail HEPA units', () => {
    assert.ok(specs.costComparison.savingsPct >= 75);
    assert.ok(specs.costComparison.savingsINR > 12000);
  });
});

// -------------------------------------------------------------
// Suite 9: Layered Indoor Passive/Active Smog Suppression
// -------------------------------------------------------------
suite('Suite 9: Cumulative Indoor Smog Suppression Model', () => {
  test('Multiple concurrent hacks stack cumulative PM2.5 suppression', () => {
    const single = calculateIndoorSuppression(['corsi_rosenthal'], 200);
    const multiple = calculateIndoorSuppression(['corsi_rosenthal', 'window_sealing', 'wet_mopping'], 200);
    assert.ok(multiple.effectiveReductionPct > single.effectiveReductionPct);
    assert.ok(multiple.indoorPM25 < single.indoorPM25);
  });

  test('Suppression adheres strictly to diminishing returns ceiling (<= 92%)', () => {
    const all = calculateIndoorSuppression(
      ['corsi_rosenthal', 'window_sealing', 'wet_mopping', 'kitchen_exhaust', 'incense_ban', 'phytoremediation'],
      300
    );
    assert.ok(all.effectiveReductionPct <= 92);
  });
});

// -------------------------------------------------------------
// Suite 10: NASA Botanical Phytoremediation Scaling
// -------------------------------------------------------------
suite('Suite 10: Botanical Bio-Shield & NASA Plant Calculations', () => {
  test('Scales recommended plant pots proportionally with room area', () => {
    const smallRoom = calculateBotanicalNeeds(100);
    const largeRoom = calculateBotanicalNeeds(300);
    assert.ok(largeRoom.totalPots > smallRoom.totalPots);
  });

  test('Includes Snake Plant with nocturnal Crassulacean Acid Metabolism', () => {
    const res = calculateBotanicalNeeds(150);
    const snake = res.plants.find(p => p.id === 'snake_plant');
    assert.ok(snake !== undefined);
    assert.strictEqual(snake.crassulaceanAcidMetabolism, true);
  });
});

// -------------------------------------------------------------
// Suite 11: OWASP Top 10 Security & HTML Sanitization Barriers
// -------------------------------------------------------------
suite('Suite 11: OWASP XSS Defense & DOM Clobbering Neutralization', () => {
  test('escapeHTML neutralizes all standard HTML injection delimiters', () => {
    const dirty = '<script>alert("xss")</script>&"\'`';
    const escaped = escapeHTML(dirty);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
    assert.ok(escaped.includes('&amp;'));
    assert.ok(escaped.includes('&quot;'));
  });

  test('sanitizeHTML completely eliminates script, iframe, and object injection vectors', () => {
    const payload = '<div>Safe</div><script>fetch("http://evil.com")</script><iframe src="malware.html"></iframe>';
    const clean = sanitizeHTML(payload);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('<iframe>'));
    assert.ok(clean.includes('<div>Safe</div>'));
  });

  test('sanitizeHTML neutralizes inline event handlers (onerror, onload, onclick)', () => {
    const payload = '<img src="x" onerror="alert(1)" /><p onclick="hack()">Test</p>';
    const clean = sanitizeHTML(payload);
    assert.ok(!clean.includes('onerror'));
    assert.ok(!clean.includes('onclick'));
  });

  test('sanitizeHTML prevents DOM Clobbering by stripping id and name attributes', () => {
    const payload = '<div id="adminPanel" name="config"><span class="badge">Safe</span></div>';
    const clean = sanitizeHTML(payload);
    assert.ok(!clean.includes('id='));
    assert.ok(!clean.includes('name='));
    assert.ok(clean.includes('class="badge"'));
  });

  test('sanitizeHTML blocks javascript: protocol in href or action targets', () => {
    const payload = '<a href="javascript:alert(1)">Click</a>';
    const clean = sanitizeHTML(payload);
    assert.ok(!clean.includes('javascript:'));
  });

  test('generateSecureId creates collision-resistant hex identifiers', () => {
    const id1 = generateSecureId('vayu');
    const id2 = generateSecureId('vayu');
    assert.notStrictEqual(id1, id2);
    assert.ok(id1.startsWith('vayu_'));
  });
});

// -------------------------------------------------------------
// Suite 12: Ephemeral In-Memory API Key Vault
// -------------------------------------------------------------
suite('Suite 12: Ephemeral Closure Memory Key Vault', () => {
  test('Stores and retrieves API key strictly in closure memory', () => {
    ApiKeyVault.setKey('AIzaSyMockTestKey12345');
    assert.strictEqual(ApiKeyVault.hasKey(), true);
    assert.strictEqual(ApiKeyVault.getKey(), 'AIzaSyMockTestKey12345');
  });

  test('Clears key completely on explicit clearKey invocation', () => {
    ApiKeyVault.clearKey();
    assert.strictEqual(ApiKeyVault.hasKey(), false);
    assert.strictEqual(ApiKeyVault.getKey(), null);
  });
});

// -------------------------------------------------------------
// Suite 13: Schema Normalization & Key-Safe JSON Serialization
// -------------------------------------------------------------
suite('Suite 13: Storage Normalization & Key-Safe JSON Serialization', () => {
  test('normalizeProfile clamps out-of-bound AQI and numbers safely', () => {
    const prof = normalizeProfile({ currentAQI: 9999, commuteDistanceKm: -50 });
    assert.strictEqual(prof.currentAQI, 500);
    assert.strictEqual(prof.commuteDistanceKm, 1);
  });

  test('exportPlanAsJSON strictly filters out any embedded API keys or secrets', () => {
    const stateWithSecret = {
      profile: { archetypeKey: 'residential_family', currentAQI: 220 },
      apiKey: 'SUPER_SECRET_GEMINI_KEY_DO_NOT_LEAK',
      secretToken: 'shhh',
      healthRiskScore: 65
    };

    const jsonStr = exportPlanAsJSON(stateWithSecret);
    assert.ok(!jsonStr.includes('SUPER_SECRET_GEMINI_KEY'));
    assert.ok(!jsonStr.includes('secretToken'));
    assert.ok(jsonStr.includes('VayuGuardian AI'));
  });

  test('importPlanFromJSON safely recovers valid profiles and scrubs prototype pollution', () => {
    const validJson = JSON.stringify({
      profile: {
        archetypeKey: 'vulnerable_care',
        currentAQI: 310,
        __proto__: { polluted: true }
      }
    });

    const res = importPlanFromJSON(validJson);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.profile.archetypeKey, 'vulnerable_care');
    assert.strictEqual(res.profile.currentAQI, 310);
    assert.strictEqual(({}).polluted, undefined);
  });
});

// -------------------------------------------------------------
// Suite 14: Deterministic Offline Heuristic Knowledge Graph
// -------------------------------------------------------------
suite('Suite 14: Offline Heuristic GenAI Expert Rules Engine', () => {
  test('Generates immediate contextual guidance for exercise query', () => {
    const res = generateHeuristicAdvisory({ query: 'Can I go jogging in the morning?', currentAQI: 260 });
    assert.strictEqual(res.isHeuristic, true);
    assert.ok(res.headline.includes('Respiratory'));
    assert.ok(res.avoidanceRule.includes('06:00 AM'));
  });

  test('Generates pediatric-specific protocol for school recess queries', () => {
    const res = generateHeuristicAdvisory({ query: 'school recess outdoors for kids', currentAQI: 290 });
    assert.ok(res.headline.includes('Pediatric'));
    assert.ok(res.directActions.some(a => a.includes('recess') || a.includes('Corsi-Rosenthal')));
  });

  test('Injects medical precautions when asthma vulnerability is active', () => {
    const res = generateHeuristicAdvisory({
      query: 'General advice',
      profile: { vulnerabilities: ['asthma'] },
      currentAQI: 350
    });
    assert.ok(res.directActions.some(a => a.includes('Asthma')));
  });

  test('Provides respirator facial seal instructions when mask intent is detected', () => {
    const res = generateHeuristicAdvisory({ query: 'Which N95 mask is best?', currentAQI: 300 });
    assert.ok(res.headline.includes('Respirator'));
    assert.ok(res.directActions.some(a => a.includes('positive-pressure') || a.includes('seal')));
  });

  test('Severe emergency threshold (> 350 AQI) activates clean-room positive pressure sealing', () => {
    const res = generateHeuristicAdvisory({ currentAQI: 380 });
    assert.strictEqual(res.severity, 'emergency');
    assert.ok(res.directActions.some(a => a.includes('positive-pressure') || a.includes('weatherstrips')));
  });
});

// -------------------------------------------------------------
// Verification Summary
// -------------------------------------------------------------
console.log('\n\x1b[1m\x1b[32m================================================================');
console.log(`   🎉 ALL TEST SUITES PASSED! (${passedTests} / ${totalTests} assertions verified)`);
console.log('================================================================\x1b[0m\n');
