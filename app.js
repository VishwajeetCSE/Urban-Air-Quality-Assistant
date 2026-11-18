/**
 * @fileoverview Main Application Controller & UI Orchestrator
 * High-performance coordinator connecting domain calculation engines,
 * accessibility utilities, and reactive DOM view renderers.
 * @module app
 * @author Vishwajeet Kumar (VishwajeetCSE)
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
  queryVayuGenieAI,
  generateHeuristicAdvisory
} from './src/ai.js';

import {
  ApiKeyVault,
  setSanitizedHTML,
  escapeHTML,
  clamp
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
  renderCorsiRosenthalSpecs,
  renderEmissionImpact,
  renderCommunityShield
} from './src/ui-renderers.js';

import { $, $$, debounce, on } from './src/ui-events.js';
import { HOTSPOT_CITIES, COMMUNITY_ACTIONS } from './src/constants.js';

/**
 * Global reactive application state
 */
const state = {
  profile: loadProfileFromStorage(),
  communityActions: ['ban_dg_gensets', 'water_misting_canons', 'zero_waste_burning_patrol'],
  diyParams: {
    roomLengthFt: 15,
    roomWidthFt: 12,
    roomHeightFt: 10,
    fanCFM: 1800,
    filterGrade: 'merv13'
  },
  aiLoading: false
};

/**
 * Initializes the entire application
 */
function initApp() {
  initSkipLink();
  initRovingTabindex('.nav-tabs-wrapper', '.nav-tab');
  initTheme();
  bindNavigationTabs();
  syncFormFromState();
  bindFormEvents();
  bindCalculatorEvents();
  bindCommunityEvents();
  bindAIEvents();
  bindExportAndPrint();
  bindModalEvents();

  // Initial calculation and full UI render
  recalculateAll();
}

/**
 * Recalculates all domain models and re-renders active views
 */
function recalculateAll() {
  const p = state.profile;

  // 1. Air Quality Multi-Pollutant & WHO Benchmark
  const composite = calculateCompositeAQI({
    pm25: p.currentAQI * 0.68,
    pm10: p.currentAQI * 1.15,
    no2: Math.min(180, p.currentAQI * 0.35)
  });

  // 2. Diurnal Smog Inversion Curve (24h)
  const forecast = getDiurnalSmogForecast(p.currentAQI, p.cityKey, p.microZoneKey);

  // 3. Inhaled PM2.5 Deposition & Cigarette Equivalence
  const avoidance = calculateInhaledPM25Avoidance({
    basePM25: p.currentAQI * 0.68,
    indoorHours: 18,
    filterReductionPct: 85
  });

  // 4. Household Biological Risk Score (0 - 100)
  const riskData = calculateHouseholdRiskIndex(p, p.currentAQI);

  // 5. Daily 6-Block Low-Emission Routine
  const routineBlocks = generateDailyRoutine(p, forecast);

  // 6. Commute Carbon & Fuel Savings
  const carbonData = calculateEmissionReductions(p);

  // 7. DIY Corsi-Rosenthal & Room ACH Physics
  const crSpecs = calculateCorsiRosenthalSpecs({
    roomLengthFt: state.diyParams.roomLengthFt,
    roomWidthFt: state.diyParams.roomWidthFt,
    roomHeightFt: state.diyParams.roomHeightFt,
    fanCFM: state.diyParams.fanCFM,
    filterGrade: state.diyParams.filterGrade
  });

  // 8. Indoor Hack Layered Suppression
  const suppression = calculateIndoorSuppression(p.activeHacks, p.currentAQI * 0.68);

  // Persist normalized state
  saveProfileToStorage(p);

  // Render to DOM
  updateHeaderStats(p.currentAQI, composite.category, composite.color);
  renderDiurnalChart(forecast, $('#diurnal-chart'));
  renderRiskGauge(riskData, $('#risk-gauge-container'));
  renderPollutantCards(composite, $('#pollutant-cards-container'));
  renderRoutineTimeline(routineBlocks, $('#routine-timeline-container'));
  renderCorsiRosenthalSpecs(crSpecs, $('#cr-specs-container'));
  renderEmissionImpact(avoidance, carbonData, $('#impact-metrics-container'));
  renderCommunityShield(COMMUNITY_ACTIONS, state.communityActions, $('#community-actions-container'));
  updateSuppressionBar(suppression);
}

/**
 * Updates primary header badges with current AQI
 */
function updateHeaderStats(aqi, category, color) {
  const badge = $('#header-aqi-badge');
  if (badge) {
    badge.textContent = `AQI ${aqi} • ${category}`;
    badge.style.backgroundColor = color;
  }
}

/**
 * Updates indoor suppression progress indicator
 */
function updateSuppressionBar(suppression) {
  const bar = $('#indoor-suppression-progress');
  const label = $('#indoor-suppression-label');
  const safePill = $('#indoor-safe-pill');

  if (bar) bar.style.width = `${suppression.effectiveReductionPct}%`;
  if (label) label.textContent = `${suppression.effectiveReductionPct}% Indoor Smog Blocked (${suppression.indoorPM25} µg/m³ PM2.5)`;
  if (safePill) {
    safePill.textContent = suppression.isSafeLevel ? 'Safe Breathing Zone' : 'Additional Filtration Needed';
    safePill.className = `badge ${suppression.isSafeLevel ? 'badge-success' : 'badge-warning'}`;
  }
}

/**
 * Theme Toggle Controller (Dark & Light Mode)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('vayuguardian_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  $('#btn-theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vayuguardian_theme', next);
    updateThemeIcon(next);
    announce(`Switched to ${next} theme`);

    // Redraw canvas with updated theme contrast
    const forecast = getDiurnalSmogForecast(state.profile.currentAQI, state.profile.cityKey, state.profile.microZoneKey);
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

      // If switching to forecast tab, re-render chart to ensure correct geometry
      if (targetId === 'tab-forecast') {
        setTimeout(() => {
          const forecast = getDiurnalSmogForecast(state.profile.currentAQI, state.profile.cityKey, state.profile.microZoneKey);
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
  $('#select-microzone').value = p.microZoneKey;
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

  $$('input[name="iaq-hack"]').forEach((cb) => {
    cb.checked = p.activeHacks.includes(cb.value);
  });
}

/**
 * Bind Input Changes on Profiler Form
 */
function bindFormEvents() {
  // Archetype radio card selection
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

  // City Selector
  $('#select-city').addEventListener('change', (e) => {
    const cityKey = e.target.value;
    state.profile.cityKey = cityKey;
    const defaultAQI = HOTSPOT_CITIES[cityKey] ? HOTSPOT_CITIES[cityKey].baseAQI : 260;
    state.profile.currentAQI = defaultAQI;
    $('#input-aqi').value = defaultAQI;
    $('#val-aqi-display').textContent = defaultAQI;
    announce(`City changed to ${e.target.options[e.target.selectedIndex].text}`);
    recalculateAll();
  });

  // Micro-Zone Selector
  $('#select-microzone').addEventListener('change', (e) => {
    state.profile.microZoneKey = e.target.value;
    announce('Micro-zone updated');
    recalculateAll();
  });

  // Debounced AQI Slider
  const debouncedAQIUpdate = debounce((val) => {
    state.profile.currentAQI = parseInt(val, 10);
    announce(`AQI updated to ${val}`);
    recalculateAll();
  }, 100);

  $('#input-aqi').addEventListener('input', (e) => {
    $('#val-aqi-display').textContent = e.target.value;
    debouncedAQIUpdate(e.target.value);
  });

  // Commute Mode & Distance
  $('#select-commute').addEventListener('change', (e) => {
    state.profile.commuteMode = e.target.value;
    announce('Commute mode updated');
    recalculateAll();
  });

  $('#input-commute-distance').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.profile.commuteDistanceKm = val;
    $('#val-distance-display').textContent = val;
    recalculateAll();
  });

  // Vulnerability Checkboxes
  $$('input[name="vulnerability"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const selected = $$('input[name="vulnerability"]:checked').map((c) => c.value);
      state.profile.vulnerabilities = selected;
      announce('Vulnerability factors updated');
      recalculateAll();
    });
  });

  // IAQ Hack Checkboxes
  $$('input[name="iaq-hack"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const selected = $$('input[name="iaq-hack"]:checked').map((c) => c.value);
      state.profile.activeHacks = selected;
      announce('Indoor air defense measures updated');
      recalculateAll();
    });
  });
}

/**
 * Bind Interactive DIY Corsi-Rosenthal Box Room Sliders
 */
function bindCalculatorEvents() {
  const updateRoomDimensions = debounce(() => {
    state.diyParams.roomLengthFt = parseInt($('#input-room-l').value, 10) || 15;
    state.diyParams.roomWidthFt = parseInt($('#input-room-w').value, 10) || 12;
    state.diyParams.roomHeightFt = parseInt($('#input-room-h').value, 10) || 10;
    state.diyParams.filterGrade = $('#select-filter-grade').value;
    recalculateAll();
  }, 150);

  ['#input-room-l', '#input-room-w', '#input-room-h'].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener('input', updateRoomDimensions);
  });

  $('#select-filter-grade').addEventListener('change', updateRoomDimensions);
}

/**
 * Bind Community Smog Shield Action Checklist Events
 */
function bindCommunityEvents() {
  on($('#community-actions-container'), 'change', '.community-toggle', (e, target) => {
    const actionId = target.getAttribute('data-action-id');
    if (target.checked) {
      if (!state.communityActions.includes(actionId)) {
        state.communityActions.push(actionId);
      }
    } else {
      state.communityActions = state.communityActions.filter((id) => id !== actionId);
    }
    announce('Community mitigation plan updated');
    recalculateAll();
  });
}

/**
 * Bind GenAI Chat & Prompt Chips
 */
function bindAIEvents() {
  const sendBtn = $('#btn-ai-send');
  const inputEl = $('#ai-prompt-input');
  const responseBox = $('#ai-response-container');

  async function handleSend(promptText) {
    const query = (promptText || inputEl.value).trim();
    if (!query) return;

    inputEl.value = '';
    setSanitizedHTML(
      responseBox,
      '<div class="ai-loading-pulse">🍃 Consulting VayuGenie AI knowledge graph...</div>'
    );
    announce('Analyzing air defense query');

    try {
      const result = await queryVayuGenieAI(query, {
        profile: state.profile,
        currentAQI: state.profile.currentAQI
      });

      const formattedHtml = result.displayText
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>')
        .replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>');

      setSanitizedHTML(responseBox, `<div class="ai-bubble">${formattedHtml}</div>`);
      announce('VayuGenie advisory ready');
    } catch (err) {
      setSanitizedHTML(
        responseBox,
        `<div class="ai-bubble error">Error: ${escapeHTML(err.message)}</div>`
      );
    }
  }

  sendBtn.addEventListener('click', () => handleSend());
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // Prompt Preset Chips
  $$('.prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-prompt');
      handleSend(q);
    });
  });
}

/**
 * Bind 1-Click Clean Air Plan Export & Print
 */
function bindExportAndPrint() {
  $('#btn-export-plan').addEventListener('click', () => {
    const jsonStr = exportPlanAsJSON(state);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VayuGuardian-CleanAirPlan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    announce('Clean Air Plan downloaded as JSON');
  });

  $('#btn-print-briefing').addEventListener('click', () => {
    announce('Opening print dialogue for community briefing');
    window.print();
  });
}

/**
 * Bind API Key Modal Dialog (Memory-Only Storage)
 */
function bindModalEvents() {
  const modal = $('#modal-apikey');
  const openBtn = $('#btn-open-apikey');
  const closeBtns = $$('[data-action="close-modal"]');
  const saveBtn = $('#btn-save-key');
  const clearBtn = $('#btn-clear-key');
  const keyInput = $('#input-gemini-key');
  const statusSpan = $('#apikey-status-text');

  let cleanupFocus = null;

  function updateKeyStatusUI() {
    if (ApiKeyVault.hasKey()) {
      statusSpan.textContent = 'Active (Stored in RAM only)';
      statusSpan.className = 'badge badge-success';
    } else {
      statusSpan.textContent = 'Offline Heuristics Active (No API Key)';
      statusSpan.className = 'badge badge-subtle';
    }
  }

  updateKeyStatusUI();

  openBtn.addEventListener('click', () => {
    modal.hidden = false;
    cleanupFocus = trapFocus(modal);
    announce('Opened API Key configuration');
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.hidden = true;
      if (cleanupFocus) cleanupFocus();
      announce('Closed API Key configuration');
    });
  });

  saveBtn.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (key) {
      ApiKeyVault.setKey(key);
      keyInput.value = '';
      updateKeyStatusUI();
      modal.hidden = true;
      if (cleanupFocus) cleanupFocus();
      announce('Google Gemini API key safely stored in memory');
    }
  });

  clearBtn.addEventListener('click', () => {
    ApiKeyVault.clearKey();
    keyInput.value = '';
    updateKeyStatusUI();
    announce('API key wiped from memory');
  });
}

// Kickstart application on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
