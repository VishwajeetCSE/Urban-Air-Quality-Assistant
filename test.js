/**
 * @fileoverview Standalone Zero-Dependency Test Runner for AeroShield AI
 * Runs 13 comprehensive test suites (50+ assertions) covering calculation engines,
 * diurnal inversion models, Corsi-Rosenthal physics, XSS security, and heuristic AI.
 * Execute with: node test.js
 * @author Vishwajeet Kumar
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

console.log('\x1b[1m\x1b[35m================================================================');
console.log('   🍃 AeroShield AI — Automated Verification Test Suite (50+ Tests)');
console.log('================================================================\x1b[0m');

// -------------------------------------------------------------
// Suite 1: CPCB NAQI & Pollutant Sub-Index Calculation
// -------------------------------------------------------------
suite('Suite 1: CPCB Pollutant Sub-Index & Composite AQI', () => {
  test('PM2.5 sub-index computes accurate Good range (0-30 ug/m3 -> AQI 0-50)', () => {
    const res = calculatePollutantSubIndex('pm25', 15);
    assert.strictEqual(typeof res.subIndex, 'number');
    assert.ok(res.subIndex >= 0 && res.subIndex <= 50);
    assert.strictEqual(res.label, 'Good');
  });

  test('PM10 sub-index computes accurate Moderate range (100-250 ug/m3)', () => {
    const res = calculatePollutantSubIndex('pm10', 180);
    assert.ok(res.subIndex >= 101 && res.subIndex <= 200);
    assert.strictEqual(res.label, 'Moderate');
  });

  test('NO2 and O3 sub-indices calculate correctly across CPCB breakpoints', () => {
    const no2 = calculatePollutantSubIndex('no2', 90);
    assert.strictEqual(no2.label, 'Moderate');
    const o3 = calculatePollutantSubIndex('o3', 180);
    assert.strictEqual(o3.label, 'Poor');
  });

  test('PM2.5 sub-index correctly identifies Severe (> 250 ug/m3 -> AQI > 400)', () => {
    const res = calculatePollutantSubIndex('pm25', 300);
    assert.ok(res.subIndex > 400);
    assert.strictEqual(res.label, 'Severe');
  });

  test('Composite AQI follows CPCB maximum sub-index principle', () => {
    const comp = calculateCompositeAQI({ pm25: 140, pm10: 80, no2: 45, o3: 30 });
    assert.ok(comp.aqi >= 300);
    assert.strictEqual(comp.prominentPollutant, 'PM2.5');
    assert.strictEqual(comp.category, 'Very Poor');
  });

  test('Composite AQI handles missing or negative pollutant inputs safely', () => {
    const comp = calculateCompositeAQI({});
    assert.ok(comp.aqi >= 0 && comp.aqi <= 500);
    assert.ok(typeof comp.healthAdvisory === 'string');
    assert.strictEqual(typeof comp.subIndices.pm25, 'number');
  });
});

// -------------------------------------------------------------
// Suite 2: Diurnal Smog Inversion Curve & Solar Convection Window
// -------------------------------------------------------------
suite('Suite 2: Diurnal Smog Inversion & Planetary Boundary Modeling', () => {
  const forecast = getDiurnalSmogForecast(300, 'delhi');

  test('Generates complete 24-hour hourly profile', () => {
    assert.strictEqual(forecast.hours.length, 24);
    assert.strictEqual(forecast.hours[0].timeLabel, '00:00');
    assert.strictEqual(forecast.hours[23].timeLabel, '23:00');
  });

  test('Peak morning smog trap occurs between 6 AM and 9 AM', () => {
    assert.ok(forecast.peakHour >= 6 && forecast.peakHour <= 9, `Peak was hour ${forecast.peakHour}`);
    assert.ok(forecast.peakAQI > 300);
  });

  test('Cleanest convective window is identified during midday (12-3 PM)', () => {
    assert.ok(forecast.cleanestHour >= 12 && forecast.cleanestHour <= 15, `Cleanest was hour ${forecast.cleanestHour}`);
    assert.ok(forecast.cleanestAQI < forecast.peakAQI);
  });

  test('Convective solar safe window achieves substantial exposure reduction vs peak', () => {
    assert.ok(forecast.safeWindow.avgAQI < forecast.peakAQI);
    const reduction = ((forecast.peakAQI - forecast.safeWindow.avgAQI) / forecast.peakAQI) * 100;
    assert.ok(reduction >= 30, `Expected reduction >= 30%, got ${reduction}%`);
  });

  test('Hour objects include status flags, phase tags, and action recommendations', () => {
    const morningHour = forecast.hours[7];
    assert.strictEqual(morningHour.isCriticalTrap, true);
    assert.strictEqual(morningHour.phase, 'morning_trap');
    const middayHour = forecast.hours[13];
    assert.strictEqual(middayHour.isSafeWindow, true);
    assert.strictEqual(middayHour.phase, 'safe_window');
  });
});

// -------------------------------------------------------------
// Suite 3: Inhaled PM2.5 Avoidance & Berkeley Earth Cigarette Math
// -------------------------------------------------------------
suite('Suite 3: Inhaled Particulate Deposition Avoidance & Cigarettes Equivalence', () => {
  test('Calculates positive micrograms avoided with indoor filtration & schedule shift', () => {
    const res = calculateInhaledPM25Avoidance({
      basePM25: 220,
      minuteVentilation: 0.015,
      filterReductionPct: 75,
      indoorHours: 18,
      rescheduledOutdoor: true
    });

    assert.ok(res.dailyInhaledAvoidedUg > 1000);
    assert.ok(res.annualInhaledAvoidedMg > 300);
  });

  test('Annualized inhaled avoidance correctly scales with 365 days', () => {
    const res = calculateInhaledPM25Avoidance({ basePM25: 150 });
    const expectedMg = Math.round((res.dailyInhaledAvoidedUg * 365) / 1000);
    assert.strictEqual(res.annualInhaledAvoidedMg, expectedMg);
  });

  test('Berkeley Earth cigarette equivalence yields realistic values', () => {
    const res = calculateInhaledPM25Avoidance({
      basePM25: 250,
      minuteVentilation: 0.015,
      filterReductionPct: 75,
      indoorHours: 18
    });

    assert.ok(res.cigarettesAvoidedDaily > 3 && res.cigarettesAvoidedDaily < 30);
    assert.strictEqual(res.cigarettesAvoidedMonthly, Math.round(res.cigarettesAvoidedDaily * 30));
  });

  test('Zero outdoor rescheduling parameter accurately reduces avoided exposure', () => {
    const withReschedule = calculateInhaledPM25Avoidance({ basePM25: 200, rescheduledOutdoor: true });
    const withoutReschedule = calculateInhaledPM25Avoidance({ basePM25: 200, rescheduledOutdoor: false });
    assert.ok(withReschedule.dailyInhaledAvoidedUg > withoutReschedule.dailyInhaledAvoidedUg);
  });
});

// -------------------------------------------------------------
// Suite 4: Household Smog Risk Index & Vulnerability Weighting
// -------------------------------------------------------------
suite('Suite 4: Household Smog Risk Index & Vulnerability Multipliers', () => {
  test('High outdoor AQI without mitigations yields low safety score', () => {
    const unmitigated = calculateHouseholdRiskIndex({
      outdoorAQI: 400,
      archetypeKey: 'apartment_family',
      vulnerabilityKeys: ['asthma', 'infants'],
      activeHackIds: []
    });
    assert.ok(unmitigated.safetyScore <= 40, `Safety score was ${unmitigated.safetyScore}`);
  });

  test('Adopting DIY hacks dramatically elevates the safety score', () => {
    const mitigated = calculateHouseholdRiskIndex({
      outdoorAQI: 400,
      archetypeKey: 'apartment_family',
      vulnerabilityKeys: ['asthma', 'infants'],
      activeHackIds: ['corsi_rosenthal', 'wet_mopping', 'window_sealing', 'incense_ban']
    });
    assert.ok(mitigated.safetyScore >= 60, `Safety score was ${mitigated.safetyScore}`);
    assert.ok(mitigated.mitigationPoints >= 40);
  });

  test('Vulnerability factors increase vulnerability multiplier', () => {
    const lowVuln = calculateHouseholdRiskIndex({ outdoorAQI: 200, vulnerabilityKeys: [] });
    const highVuln = calculateHouseholdRiskIndex({ outdoorAQI: 200, vulnerabilityKeys: ['asthma', 'infants'] });
    assert.ok(highVuln.vulnerabilityMultiplier > lowVuln.vulnerabilityMultiplier);
  });

  test('Safety score correctly clamps between 5 and 100', () => {
    const extremeBad = calculateHouseholdRiskIndex({ outdoorAQI: 500, vulnerabilityKeys: ['asthma', 'infants', 'seniors'], activeHackIds: [] });
    assert.ok(extremeBad.safetyScore >= 5);
    const perfect = calculateHouseholdRiskIndex({ outdoorAQI: 20, activeHackIds: ['corsi_rosenthal', 'wet_mopping', 'window_sealing', 'kitchen_exhaust', 'incense_ban', 'phytoremediation'] });
    assert.ok(perfect.safetyScore <= 100);
  });
});

// -------------------------------------------------------------
// Suite 5: Low-Emission Daily Routine Builder
// -------------------------------------------------------------
suite('Suite 5: Low-Emission Daily Routine Builder', () => {
  const routine = generateDailyRoutine({
    archetypeKey: 'apartment_family',
    cityKey: 'delhi',
    baseAQI: 350,
    commuteMode: 'metro',
    vulnerabilities: ['asthma']
  });

  test('Produces 6 discrete time-block schedules spanning 24 hours', () => {
    assert.strictEqual(routine.scheduleBlocks.length, 6);
  });

  test('Morning block flags critical outdoor danger', () => {
    const morning = routine.scheduleBlocks[0];
    assert.strictEqual(morning.status, 'CRITICAL_RISK');
    assert.ok(morning.actionProtocol.includes('Strict indoor shelter'));
  });

  test('Midday block flags convective solar safe window', () => {
    const midday = routine.scheduleBlocks[2];
    assert.strictEqual(midday.status, 'SAFE_WINDOW');
    assert.ok(midday.actionProtocol.includes('Safest window of the day'));
  });

  test('Generates tailored advisory pills for high AQI and vulnerable members', () => {
    assert.ok(routine.advisoryPills.length >= 2);
    assert.ok(routine.advisoryPills.some(p => p.includes('N95') || p.includes('vulnerability')));
  });
});

// -------------------------------------------------------------
// Suite 6: Carbon Footprint Abatement & Fuel Savings Equations
// -------------------------------------------------------------
suite('Suite 6: Carbon Abatement & Sustainable Lifestyle Swaps', () => {
  test('Commuting by Metro vs Solo Car saves substantial monthly CO2e', () => {
    const res = calculateEmissionReductions({
      commuteCurrent: 'car',
      commuteTarget: 'metro',
      distanceKm: 20,
      workDays: 22,
      inductionCooking: true,
      compostLeavesKg: 30
    });

    assert.ok(res.monthlyCo2eSavedKg > 50, `Expected > 50 kg CO2e, got ${res.monthlyCo2eSavedKg}`);
    assert.ok(res.fuelCostSavedINR > 2000, `Expected > ₹2000 saved, got ${res.fuelCostSavedINR}`);
    assert.ok(res.pm25EmissionsPreventedGrams > 300);
  });

  test('Induction cooking switch contributes 18 kg CO2e monthly savings', () => {
    const res = calculateEmissionReductions({ inductionCooking: true });
    assert.strictEqual(res.breakdown.cookingCo2Kg, 18.0);
  });

  test('Leaf composting eliminates particulate emissions vs open burning', () => {
    const res = calculateEmissionReductions({ compostLeavesKg: 50 });
    assert.strictEqual(res.pm25EmissionsPreventedGrams, 50 * 18);
    assert.ok(res.breakdown.compostCo2Kg > 60);
  });
});

// -------------------------------------------------------------
// Suite 7: Corsi-Rosenthal Box Performance & Physics
// -------------------------------------------------------------
suite('Suite 7: Corsi-Rosenthal Box CADR, ACH & Room Clearance Math', () => {
  const specs = calculateCorsiRosenthalSpecs({
    fanCFM: 1800,
    filterType: 'merv13',
    filterCount: 4,
    roomAreaSqFt: 300,
    ceilingHeightFt: 10
  });

  test('Delivers CADR in the 450-650 CFM range', () => {
    assert.ok(specs.cadrCFM >= 450 && specs.cadrCFM <= 650, `CADR was ${specs.cadrCFM}`);
  });

  test('Provides adequate Air Changes per Hour (ACH >= 4.0)', () => {
    assert.ok(specs.ach >= 4.0, `ACH was ${specs.ach}`);
    assert.strictEqual(specs.isAdequateForSmog, true);
  });

  test('Clears 90% and 99% particulates in under 60 minutes', () => {
    assert.ok(specs.time90Mins > 0 && specs.time90Mins <= 30, `t90 was ${specs.time90Mins}`);
    assert.ok(specs.time99Mins > 0 && specs.time99Mins <= 60, `t99 was ${specs.time99Mins}`);
  });

  test('Calculates > 75% cost savings vs commercial purifiers', () => {
    assert.ok(specs.costSavingsPct >= 75, `Savings was ${specs.costSavingsPct}%`);
  });

  test('Single flat filter creates higher resistance than 4-filter cube', () => {
    const single = calculateCorsiRosenthalSpecs({ filterCount: 1 });
    const cube = calculateCorsiRosenthalSpecs({ filterCount: 4 });
    assert.ok(cube.cadrCFM > single.cadrCFM);
  });
});

// -------------------------------------------------------------
// Suite 8: NASA Botanical Phytoremediation & Plant Allocation
// -------------------------------------------------------------
suite('Suite 8: NASA Botanical Phytoremediation Roster', () => {
  test('Allocates correct plant count for 350 sq.ft living area', () => {
    const plants = calculateBotanicalNeeds(350);
    assert.ok(plants.totalPlants >= 5);
    assert.strictEqual(plants.roster.length, 4);

    const snake = plants.roster.find(p => p.name.includes('Snake'));
    assert.ok(snake && snake.count >= 1);
  });

  test('Larger rooms dynamically scale botanical requirement', () => {
    const small = calculateBotanicalNeeds(150);
    const large = calculateBotanicalNeeds(600);
    assert.ok(large.totalPlants > small.totalPlants);
  });
});

// -------------------------------------------------------------
// Suite 9: Layered Indoor PM2.5 Suppression
// -------------------------------------------------------------
suite('Suite 9: Layered Indoor PM2.5 Suppression', () => {
  test('Applying Corsi-Rosenthal, wet mopping, and incense ban reduces indoor PM2.5 by > 70%', () => {
    const iaq = calculateIndoorSuppression(250, 'apartment_family', [
      'corsi_rosenthal',
      'wet_mopping',
      'window_sealing',
      'incense_ban'
    ]);

    assert.ok(iaq.mitigatedPM25 < iaq.unmitigatedPM25);
    assert.ok(iaq.reductionPct >= 70, `Reduction was ${iaq.reductionPct}%`);
    assert.ok(iaq.hackImpacts.length >= 4);
  });

  test('Unmitigated indoor baseline reflects incense smoke source penalty', () => {
    const withIncense = calculateIndoorSuppression(200, 'apartment_family', []);
    const withoutIncense = calculateIndoorSuppression(200, 'apartment_family', ['incense_ban']);
    assert.ok(withIncense.unmitigatedPM25 > withoutIncense.unmitigatedPM25);
  });
});

// -------------------------------------------------------------
// Suite 10: Security: OWASP XSS & DOM Clobbering Defense
// -------------------------------------------------------------
suite('Suite 10: Security: OWASP XSS & DOM Clobbering Sanitization', () => {
  test('escapeHTML neutralizes all standard HTML special characters', () => {
    const dirty = '<script>alert("xss")</script> & \' `';
    const escaped = escapeHTML(dirty);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
    assert.ok(escaped.includes('&amp;'));
  });

  test('sanitizeHTML strips script, iframe, and inline on* event triggers', () => {
    const malicious = '<div onclick="alert(1)"><script>evil()</script><img src="x" onerror="steal()"/>Safe Content</div>';
    const cleaned = sanitizeHTML(malicious);
    assert.ok(!cleaned.includes('<script>'));
    assert.ok(!cleaned.includes('onclick'));
    assert.ok(!cleaned.includes('onerror'));
    assert.ok(cleaned.includes('Safe Content'));
  });

  test('sanitizeHTML neutralizes DOM Clobbering id and name attributes', () => {
    const clobber = '<form id="document"><input name="cookie"/></form>';
    const cleaned = sanitizeHTML(clobber);
    assert.ok(!cleaned.includes('id="document"'));
    assert.ok(!cleaned.includes('name="cookie"'));
  });

  test('clamp utility strictly bounds numeric ranges and handles invalid inputs', () => {
    assert.strictEqual(clamp(150, 0, 100), 100);
    assert.strictEqual(clamp(-50, 0, 100), 0);
    assert.strictEqual(clamp('invalid', 10, 50, 25), 25);
  });

  test('generateSecureId creates valid prefixed random tokens', () => {
    const id1 = generateSecureId('aero');
    const id2 = generateSecureId('aero');
    assert.ok(id1.startsWith('aero_'));
    assert.notStrictEqual(id1, id2);
  });
});

// -------------------------------------------------------------
// Suite 11: Security: Ephemeral Memory-Only API Key Vault
// -------------------------------------------------------------
suite('Suite 11: Security: Ephemeral Memory-Only API Key Vault', () => {
  test('Stores key in memory and returns masked representation', () => {
    ApiKeyVault.setKey('AIzaSyD-TestKey1234567890');
    assert.strictEqual(ApiKeyVault.hasKey(), true);
    assert.strictEqual(ApiKeyVault.getKey(), 'AIzaSyD-TestKey1234567890');
    const masked = ApiKeyVault.getMasked();
    assert.ok(masked.startsWith('AIzaSy'));
    assert.ok(masked.endsWith('7890'));
  });

  test('Clears key completely from memory', () => {
    ApiKeyVault.clear();
    assert.strictEqual(ApiKeyVault.hasKey(), false);
    assert.strictEqual(ApiKeyVault.getKey(), null);
  });

  test('Rejects empty or whitespace-only keys', () => {
    ApiKeyVault.setKey('   ');
    assert.strictEqual(ApiKeyVault.hasKey(), false);
    ApiKeyVault.setKey(null);
    assert.strictEqual(ApiKeyVault.hasKey(), false);
  });
});

// -------------------------------------------------------------
// Suite 12: Storage: Profile Normalization & Safe Export/Import
// -------------------------------------------------------------
suite('Suite 12: Storage: Schema Normalization & Safe Key-Stripping Export', () => {
  test('Normalizes invalid inputs to safe fallback defaults', () => {
    const norm = normalizeProfile({ currentAQI: 'invalid', commuteDistanceKm: 9999 });
    assert.strictEqual(norm.archetypeKey, 'apartment_family');
    assert.strictEqual(norm.commuteDistanceKm, 100); // clamped to max
    assert.ok(norm.currentAQI >= 20 && norm.currentAQI <= 500);
  });

  test('Export payload strictly strips any API key or credential properties', () => {
    const state = {
      profile: { cityKey: 'bhopal' },
      apiKey: 'SUPER_SECRET_LEAK',
      secretToken: 'DO_NOT_EXPORT'
    };
    const jsonStr = exportPlanAsJSON(state);
    assert.ok(!jsonStr.includes('SUPER_SECRET_LEAK'));
    assert.ok(!jsonStr.includes('DO_NOT_EXPORT'));
    assert.ok(jsonStr.includes('bhopal'));
  });

  test('Import safely validates JSON plan structure', () => {
    const validJson = JSON.stringify({ profile: { cityKey: 'lucknow', currentAQI: 310 } });
    const imp = importPlanFromJSON(validJson);
    assert.strictEqual(imp.success, true);
    assert.strictEqual(imp.profile.cityKey, 'lucknow');
  });

  test('Import rejects malformed or unparseable JSON without crashing', () => {
    const bad = importPlanFromJSON('NOT_A_JSON');
    assert.strictEqual(bad.success, false);
    assert.ok(typeof bad.error === 'string');
  });
});

// -------------------------------------------------------------
// Suite 13: Hybrid GenAI Smog Coach ("AeroGenie")
// -------------------------------------------------------------
suite('Suite 13: Hybrid GenAI Smog Coach: Heuristic Knowledge Graph', () => {
  test('Heuristic engine generates rich family action guide with timing blocks', () => {
    const guide = generateHeuristicAdvisory({
      archetypeKey: 'apartment_family',
      cityKey: 'delhi',
      aqi: 380,
      vulnerabilities: ['asthma'],
      mode: 'family'
    });

    assert.ok(guide.includes('Diurnal Inversion Timing Strategy'));
    assert.ok(guide.includes('Corsi-Rosenthal'));
    assert.ok(guide.includes('Safe Window'));
  });

  test('Heuristic engine generates RWA community circular when requested', () => {
    const circular = generateHeuristicAdvisory({
      archetypeKey: 'society_resident',
      cityKey: 'bhopal',
      aqi: 315,
      mode: 'community'
    });

    assert.ok(circular.includes('RWA RESIDENT CIRCULAR'));
    assert.ok(circular.includes('Zero-Idling Gate Zone'));
    assert.ok(circular.includes('Total Leaf Burning Ban'));
  });

  test('Heuristic engine responds contextually to Corsi-Rosenthal DIY query', () => {
    const answer = generateHeuristicAdvisory({
      userQuery: 'How to build Corsi Rosenthal purifier?'
    });
    assert.ok(answer.includes('Corsi-Rosenthal DIY Air Purifier Quick Guide'));
    assert.ok(answer.includes('20-inch Box Fan'));
  });

  test('Heuristic engine responds with clinical precautions for elderly and asthma', () => {
    const answer = generateHeuristicAdvisory({
      userQuery: 'asthma patient morning walk protocol'
    });
    assert.ok(answer.includes('Cancel Morning Walks'));
    assert.ok(answer.includes('Saline Nasal Rinse'));
  });
});

console.log('\n\x1b[1m\x1b[32m================================================================');
console.log(`   🎉 ALL TEST SUITES PASSED! (${passedTests} / ${totalTests} assertions passed)`);
console.log('================================================================\x1b[0m\n');
