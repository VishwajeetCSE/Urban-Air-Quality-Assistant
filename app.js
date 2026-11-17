/**
 * @fileoverview Main Application Controller & UI Orchestrator
 * High-performance, thin coordinator (< 400 lines) connecting domain engines,
 * accessibility utilities, and reactive DOM renderers.
 * @module app
 * @author Vishwajeet Kumar
 * @license MIT
 */

import {
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
  queryAeroGenieAI,
  generateHeuristicAdvisory
} from './src/ai.js';

import {
  ApiKeyVault,
  setSanitizedHTML,
  escapeHTML
} from './src/security.js';

import {
  loadProfileFromStorage,
  saveProfileToStorage,
  exportPlanAsJSON,
  importPlanFromJSON
} from './src/storage.js';

import {
  initRovingTabindex,
  trapFocus,
  announce,
  initSkipLink
} from './src/ui-accessibility.js';

import {
  renderDiurnalChart,
  renderRiskGauge,
  renderPollutantCards,
  renderRoutineTimeline,
  renderIAQHacks,
  renderEmissionImpact,
  renderCommunityShield
} from './src/ui-renderers.js';

import { $, $$, debounce } from './src/ui-events.js';
import { HOTSPOT_CITIES } from './src/constants.js';

/**
 * Global reactive application state
 */
const state = {
  profile: loadProfileFromStorage(),
  crParams: {
    fanCFM: 1800,
    filterCount: 4,
    filterGrade: 'merv13'
  },
  aiLoading: false
};

/**
 * Initializes the entire application
 */
function initApp() {
  initSkipLink();
  initRovingTabindex('.tabs-container', '.nav-tab');
  initTheme();
  bindNavigationTabs();
  syncFormFromState();
  bindFormEvents();
  bindCalculatorEvents();
  bindAIEvents();
  bindModalEvents();

  // Initial calculation and full render
  recalculateAll();
}

/**
 * Theme Toggle (Light / Dark Mode)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('aeroshield_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  $('#btn-theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aeroshield_theme', next);
    updateThemeIcon(next);
    announce(`Switched to ${next} theme`);
    // Re-render canvas for theme contrast
    const forecast = getDiurnalSmogForecast(state.profile.currentAQI, state.profile.cityKey);
    renderDiurnalChart(forecast, $('#diurnal-chart'));
  });
}

function updateThemeIcon(theme) {
  const icon = $('#theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/**
 * Navigation Tabs & Panel Switching
 */
function bindNavigationTabs() {
  const tabs = $$('.nav-tab');
  const panels = $$('.tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach((p) => (p.hidden = true));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const targetId = tab.getAttribute('aria-controls');
      const targetPanel = $(`#${targetId}`);
      if (targetPanel) {
        targetPanel.hidden = false;
        announce(`Navigated to ${tab.textContent.trim()}`);
      }

      // If opening forecast tab, refresh canvas sizing
      if (targetId === 'section-forecast') {
        setTimeout(() => {
          const forecast = getDiurnalSmogForecast(state.profile.currentAQI, state.profile.cityKey);
          renderDiurnalChart(forecast, $('#diurnal-chart'));
        }, 50);
      }
    });
  });
}

/**
 * Populate Profiler Form Controls from Stored State
 */
function syncFormFromState() {
  const p = state.profile;
  $('#select-city').value = p.cityKey;
  $('#input-aqi').value = p.currentAQI;
  $('#val-aqi-display').textContent = p.currentAQI;
  $('#select-commute').value = p.commuteMode;
  $('#input-commute-distance').value = p.commuteDistanceKm;
  $('#val-distance-display').textContent = p.commuteDistanceKm;

  $$('.archetype-card').forEach((card) => {
    const isTarget = card.getAttribute('data-archetype') === p.archetypeKey;
    card.classList.toggle('active', isTarget);
    card.setAttribute('aria-checked', String(isTarget));
  });

  $$('input[name="vulnerability"]').forEach((cb) => {
    cb.checked = p.vulnerabilities.includes(cb.value);
  });
}

/**
 * Bind Input Changes on Profiler Form
 */
function bindFormEvents() {
  // Archetype radio selection cards
  $$('.archetype-card').forEach((card) => {
    card.addEventListener('click', () => {
      const archKey = card.getAttribute('data-archetype');
      state.profile.archetypeKey = archKey;
      $$('.archetype-card').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-checked', 'true');
      announce(`Selected archetype: ${card.querySelector('h3').textContent}`);
      recalculateAll();
    });
  });

  // City change
  $('#select-city').addEventListener('change', (e) => {
    const cityKey = e.target.value;
    state.profile.cityKey = cityKey;
    const defaultAQI = HOTSPOT_CITIES[cityKey].baseAQI;
    state.profile.currentAQI = defaultAQI;
    $('#input-aqi').value = defaultAQI;
    $('#val-aqi-display').textContent = defaultAQI;
    recalculateAll();
  });

  // AQI slider (debounced)
  $('#input-aqi').addEventListener('input', (e) => {
    const val = Number(e.target.value);
    $('#val-aqi-display').textContent = val;
    state.profile.currentAQI = val;
  });
  $('#input-aqi').addEventListener('change', () => recalculateAll());

  // Commute mode & distance
  $('#select-commute').addEventListener('change', (e) => {
    state.profile.commuteMode = e.target.value;
    recalculateAll();
  });

  $('#input-commute-distance').addEventListener('input', (e) => {
    const dist = Number(e.target.value);
    $('#val-distance-display').textContent = dist;
    state.profile.commuteDistanceKm = dist;
  });
  $('#input-commute-distance').addEventListener('change', () => recalculateAll());

  // Vulnerability checkboxes
  $$('input[name="vulnerability"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const checked = $$('input[name="vulnerability"]:checked').map((c) => c.value);
      state.profile.vulnerabilities = checked;
      recalculateAll();
    });
  });

  // Room area slider
  $('#input-room-sqft').addEventListener('input', (e) => {
    const area = Number(e.target.value);
    $('#val-room-display').textContent = area;
    $('#plant-room-area-text').textContent = area;
  });
  $('#input-room-sqft').addEventListener('change', () => recalculateAll());
}

/**
 * Bind Corsi-Rosenthal Calculator and Hack Checkboxes
 */
function bindCalculatorEvents() {
  $('#cr-fan-cfm').addEventListener('input', (e) => {
    const val = Number(e.target.value);
    $('#val-cr-fan').textContent = val;
    state.crParams.fanCFM = val;
    updateCRCalculator();
  });

  $('#cr-filter-count').addEventListener('change', (e) => {
    state.crParams.filterCount = Number(e.target.value);
    updateCRCalculator();
  });

  $('#cr-filter-grade').addEventListener('change', (e) => {
    state.crParams.filterGrade = e.target.value;
    updateCRCalculator();
  });

  // IAQ Hack Checkboxes Delegation
  $('#hacks-container').addEventListener('change', (e) => {
    if (e.target.classList.contains('hack-checkbox')) {
      const hackId = e.target.getAttribute('data-hack-id');
      const isChecked = e.target.checked;
      const set = new Set(state.profile.activeHacks);
      if (isChecked) set.add(hackId);
      else set.delete(hackId);
      state.profile.activeHacks = Array.from(set);
      recalculateAll();
    }
  });
}

/**
 * Updates the Corsi-Rosenthal Stats Card
 */
function updateCRCalculator() {
  const roomArea = Number($('#input-room-sqft').value) || 300;
  const specs = calculateCorsiRosenthalSpecs({
    fanCFM: state.crParams.fanCFM,
    filterCount: state.crParams.filterCount,
    filterType: state.crParams.filterGrade,
    roomAreaSqFt: roomArea
  });

  setSanitizedHTML($('#res-cr-cadr'), `${specs.cadrCFM} <small>CFM</small>`);
  setSanitizedHTML($('#res-cr-ach'), `${specs.ach} <small>ACH</small>`);
  setSanitizedHTML($('#res-cr-t90'), `${specs.time90Mins} <small>min</small>`);
  $('#res-cr-cost').textContent = `₹${specs.diyCostINR.toLocaleString()}`;

  const badge = $('#cr-status-badge');
  badge.textContent = specs.isAdequateForSmog ? '✔ Medical Smog Standard (ACH ≥ 4.0)' : '⚠️ Moderate Flow';
  badge.style.background = specs.isAdequateForSmog ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255, 171, 0, 0.2)';
}

/**
 * Re-runs Domain Math and Refreshes All Presentation Views
 */
function recalculateAll() {
  const p = state.profile;
  const roomArea = Number($('#input-room-sqft').value) || 300;

  // 1. Composite AQI & Diurnal Forecast
  const compAQI = calculateCompositeAQI({ pm25: Math.round(p.currentAQI * 0.72) });
  renderPollutantCards(compAQI, $('#aqi-cards-container'));

  const forecast = getDiurnalSmogForecast(p.currentAQI, p.cityKey);
  renderDiurnalChart(forecast, $('#diurnal-chart'));
  $('#safe-window-text').textContent = forecast.safeWindow.description;

  // 2. Daily Routine Timeline
  const routine = generateDailyRoutine({
    archetypeKey: p.archetypeKey,
    cityKey: p.cityKey,
    baseAQI: p.currentAQI,
    commuteMode: p.commuteMode,
    vulnerabilities: p.vulnerabilities
  });
  renderRoutineTimeline(routine.scheduleBlocks, $('#routine-timeline-container'));

  const pillsHtml = routine.advisoryPills
    .map((pill) => `<span class="routine-pill">💡 ${escapeHTML(pill)}</span>`)
    .join('');
  setSanitizedHTML($('#routine-pills'), pillsHtml);

  // 3. IAQ Hacks & Corsi-Rosenthal
  renderIAQHacks(p.activeHacks, $('#hacks-container'));
  updateCRCalculator();

  const plantsData = calculateBotanicalNeeds(roomArea);
  const plantItemsHtml = plantsData.roster
    .map(
      (pl) => `
    <div class="plant-item">
      <strong>${escapeHTML(pl.name)} (${pl.count} pots)</strong>: ${escapeHTML(pl.role)}
      <br/><small style="color: var(--text-muted);">${escapeHTML(pl.care)}</small>
    </div>`
    )
    .join('');
  setSanitizedHTML($('#botanical-container'), plantItemsHtml);

  // 4. Inhaled Avoidance & Carbon Abatement
  const inhaledAvoidance = calculateInhaledPM25Avoidance({
    basePM25: Math.round(p.currentAQI * 0.72),
    filterReductionPct: p.activeHacks.includes('corsi_rosenthal') ? 78 : 45
  });

  const carbonData = calculateEmissionReductions({
    commuteCurrent: 'car',
    commuteTarget: p.commuteMode,
    distanceKm: p.commuteDistanceKm,
    workDays: p.workDaysPerMonth
  });

  const healthRisk = calculateHouseholdRiskIndex({
    outdoorAQI: p.currentAQI,
    archetypeKey: p.archetypeKey,
    vulnerabilityKeys: p.vulnerabilities,
    activeHackIds: p.activeHacks
  });

  // Render Risk Gauge and Emission Impact Counters
  renderRiskGauge(healthRisk.safetyScore, healthRisk.riskLevel, $('#risk-gauge-container'));
  renderEmissionImpact({ inhaledAvoided: inhaledAvoidance, carbonData, healthRisk }, $('#impact-stats-container'));

  // Render Comparison Table
  renderComparisonTable(p, inhaledAvoidance, healthRisk, carbonData);

  // 5. Community Shield & Notice Circular
  renderCommunityShield($('#community-protocols-container'));
  const noticeHtml = generateHeuristicAdvisory({
    archetypeKey: p.archetypeKey,
    cityKey: p.cityKey,
    aqi: p.currentAQI,
    mode: 'community'
  });
  setSanitizedHTML($('#community-notice-preview'), noticeHtml);

  // Persist safe profile
  saveProfileToStorage(p);
}

/**
 * Renders domain comparison table (Unmitigated vs AeroShield)
 */
function renderComparisonTable(p, inhaled, risk, carbon) {
  const tableBody = $('#table-comparison-body');
  if (!tableBody) return;

  const html = `
    <tr>
      <td><strong>Indoor PM2.5 Infiltration</strong></td>
      <td>~${Math.round(p.currentAQI * 0.72 * 0.65)} µg/m³ (Unfiltered)</td>
      <td><strong>~${Math.round(p.currentAQI * 0.72 * 0.15)} µg/m³</strong> (CR Box + Sealing)</td>
      <td><span style="color: var(--success); font-weight: bold;">-77% Particulates</span></td>
    </tr>
    <tr>
      <td><strong>Daily Inhaled PM2.5 Deposition</strong></td>
      <td>~${(inhaled.dailyInhaledAvoidedUg * 1.8).toFixed(0)} µg/day</td>
      <td><strong>~${(inhaled.dailyInhaledAvoidedUg * 0.35).toFixed(0)} µg/day</strong></td>
      <td><span style="color: var(--success); font-weight: bold;">${inhaled.dailyInhaledAvoidedUg.toLocaleString()} µg Saved</span></td>
    </tr>
    <tr>
      <td><strong>Cigarette Health Equivalence</strong></td>
      <td>~${(inhaled.cigarettesAvoidedDaily * 1.5).toFixed(1)} cig/day toxic load</td>
      <td><strong>~0.3 cig/day</strong></td>
      <td><span style="color: var(--success); font-weight: bold;">~${inhaled.cigarettesAvoidedMonthly} cig/month avoided</span></td>
    </tr>
    <tr>
      <td><strong>Household Smog Protection Score</strong></td>
      <td>20–30% (Severe Vulnerability)</td>
      <td><strong>${risk.safetyScore}%</strong> (${risk.riskLevel})</td>
      <td><span style="color: var(--success); font-weight: bold;">+${risk.safetyScore - 25}% Safety Gain</span></td>
    </tr>
    <tr>
      <td><strong>Monthly Carbon Emissions</strong></td>
      <td>${(carbon.monthlyCo2eSavedKg * 1.6).toFixed(1)} kg CO₂e (Solo ICE Car)</td>
      <td><strong>${(carbon.monthlyCo2eSavedKg * 0.2).toFixed(1)} kg CO₂e</strong> (Metro/EV Transit)</td>
      <td><span style="color: var(--success); font-weight: bold;">${carbon.monthlyCo2eSavedKg} kg CO₂e Abated</span></td>
    </tr>
  `;
  setSanitizedHTML(tableBody, html);
}

/**
 * AeroGenie AI Coach Interactions
 */
function bindAIEvents() {
  // Quick Prompt Chips
  $$('.ai-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      $('#ai-user-query').value = prompt;
      triggerAIQuery(prompt);
    });
  });

  // Submit Query Form
  $('#form-ai-query').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = $('#ai-user-query').value;
    triggerAIQuery(query);
  });
}

async function triggerAIQuery(promptText) {
  const container = $('#ai-response-container');
  const submitBtn = $('#btn-ai-submit');

  submitBtn.disabled = true;
  setSanitizedHTML(submitBtn, '<span>Consulting...</span>');
  setSanitizedHTML(container, '<div class="ai-placeholder-text">Analyzing smog curves, micro-climate factors, and generating guidance...</div>');

  try {
    const responseHtml = await queryAeroGenieAI(promptText, {
      archetypeKey: state.profile.archetypeKey,
      cityKey: state.profile.cityKey,
      aqi: state.profile.currentAQI,
      vulnerabilities: state.profile.vulnerabilities,
      mode: 'family'
    });

    setSanitizedHTML(container, responseHtml);
    announce('AeroGenie advisory ready');
  } catch (err) {
    setSanitizedHTML(container, `<p style="color: var(--danger);">Error generating advice: ${escapeHTML(err.message)}</p>`);
  } finally {
    submitBtn.disabled = false;
    setSanitizedHTML(submitBtn, '<span>Ask AeroGenie</span>');
  }
}

/**
 * Modal Dialogs & Toolbar Actions
 */
function bindModalEvents() {
  // existing modal bindings (if any)
}

/**
 * Bind Export Briefing button
 */
function bindExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (!exportBtn) return;
  exportBtn.addEventListener('click', () => {
    try {
      const json = exportPlanAsJSON(state);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aeroshield_plan.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      announce('Exported plan as JSON');
    } catch (e) {
      console.error('Export failed', e);
      announce('Export failed');
    }
  });
}

// Hook the new binding into initApp
function initApp() {
  initSkipLink();
  initRovingTabindex('.tabs-container', '.nav-tab');
  initTheme();
  bindNavigationTabs();
  syncFormFromState();
  bindFormEvents();
  bindCalculatorEvents();
  bindAIEvents();
  bindModalEvents();
  bindExportButton(); // <-- added
  // Initial calculation and full render
  recalculateAll();
}
  const apiModal = $('#modal-api-vault');
  const planModal = $('#modal-plan-export');

  // Open API Key Dialog
  $('#btn-api-modal').addEventListener('click', () => {
    apiModal.showModal();
    trapFocus(apiModal);
    $('#input-gemini-key').value = ApiKeyVault.getKey() || '';
  });

  // Save API Key
  $('#form-api-key').addEventListener('submit', (e) => {
    e.preventDefault();
    const key = $('#input-gemini-key').value;
    ApiKeyVault.setKey(key);
    updateAPIKeyDisplay();
    apiModal.close();
    announce('Gemini API key saved in memory');
  });

  // Clear Key
  $('#btn-clear-key').addEventListener('click', () => {
    ApiKeyVault.clear();
    $('#input-gemini-key').value = '';
    updateAPIKeyDisplay();
    announce('API key cleared from memory');
  });

  // Open Plan Export Dialog
  $('#btn-export-plan').addEventListener('click', () => {
    planModal.showModal();
    trapFocus(planModal);
    const jsonStr = exportPlanAsJSON(state);
    $('#textarea-plan-json').value = jsonStr;
  });

  // Copy Plan JSON
  $('#btn-do-copy-json').addEventListener('click', () => {
    const txt = $('#textarea-plan-json').value;
    navigator.clipboard.writeText(txt).then(() => announce('Plan JSON copied to clipboard'));
  });

  // Import Plan JSON
  $('#btn-do-import-json').addEventListener('click', () => {
    const raw = $('#textarea-plan-json').value;
    const res = importPlanFromJSON(raw);
    if (res.success) {
      state.profile = res.profile;
      syncFormFromState();
      recalculateAll();
      planModal.close();
      announce('Plan imported successfully');
    } else {
      alert(`Import error: ${res.error}`);
    }
  });

  // Close modals
  $$('.btn-close-modal').forEach((btn) => {
    btn.addEventListener('click', (e) => e.target.closest('dialog').close());
  });

  // Print Clean Air Briefing
  $('#btn-print-brief').addEventListener('click', () => window.print());

  // Copy Community Notice
  $('#btn-copy-notice').addEventListener('click', () => {
    const text = $('#community-notice-preview').innerText;
    navigator.clipboard.writeText(text).then(() => announce('Community circular copied to clipboard'));
  });

  $('#btn-print-notice').addEventListener('click', () => window.print());
}

function updateAPIKeyDisplay() {
  const statusLabel = $('#api-status-label');
  const vaultStatus = $('#vault-key-status');
  if (ApiKeyVault.hasKey()) {
    if (statusLabel) statusLabel.textContent = 'Gemini Live Active';
    if (vaultStatus) vaultStatus.textContent = `Live: ${ApiKeyVault.getMasked()}`;
  } else {
    if (statusLabel) statusLabel.textContent = 'Offline AI Active';
    if (vaultStatus) vaultStatus.textContent = 'Offline Heuristic Engine Active';
  }
}

// Bootstrap application on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
