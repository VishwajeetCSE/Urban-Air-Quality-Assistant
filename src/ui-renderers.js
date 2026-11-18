/**
 * @fileoverview High-Performance UI View Presentation, DPI Canvas, and Accessible Renderers
 * @module ui-renderers
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

import { setSanitizedHTML, escapeHTML } from './security.js';
import { NASA_PLANT_ROSTER } from './constants.js';

/**
 * Renders high-DPI responsive 24-Hour Diurnal Smog & Planetary Boundary Layer (PBL) Canvas Curve
 *
 * @param {object} forecast Diurnal forecast object
 * @param {HTMLCanvasElement} canvas
 */
export function renderDiurnalChart(forecast, canvas) {
  if (!canvas || !forecast || !forecast.hours) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Handle High-DPI screens (Retina)
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 800;
  const height = rect.height || 320;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const padding = { top: 35, right: 30, bottom: 45, left: 50 };
  const graphW = width - padding.left - padding.right;
  const graphH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const hours = forecast.hours;
  const maxAQI = Math.max(450, Math.max(...hours.map(h => h.aqi)) * 1.15);

  // Background grid & AQI threshold zones
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#a7f3d0' : '#065f46';

  // Highlight Critical Morning Trap window (06:00 - 09:30)
  const trapX1 = padding.left + (6 / 23) * graphW;
  const trapX2 = padding.left + (9.5 / 23) * graphW;
  ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.10)';
  ctx.fillRect(trapX1, padding.top, trapX2 - trapX1, graphH);

  // Highlight Convective Safe Window (12:00 - 15:30)
  const safeX1 = padding.left + (12 / 23) * graphW;
  const safeX2 = padding.left + (15.5 / 23) * graphW;
  ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)';
  ctx.fillRect(safeX1, padding.top, safeX2 - safeX1, graphH);

  // Labels for highlighted zones
  ctx.font = '600 11px sans-serif';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('⛔ Smog Trap', trapX1 + 4, padding.top + 16);

  ctx.fillStyle = '#10b981';
  ctx.fillText('🟢 Safe Window', safeX1 + 4, padding.top + 16);

  // Draw Horizontal Gridlines
  const yTicks = [0, 100, 200, 300, 400];
  ctx.font = '10px monospace';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.textAlign = 'right';

  yTicks.forEach(tick => {
    const y = padding.top + graphH - (tick / maxAQI) * graphH;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillText(String(tick), padding.left - 8, y + 3);
  });

  // Plot AQI Inversion Curve
  const points = hours.map((h, i) => {
    const x = padding.left + (i / 23) * graphW;
    const y = padding.top + graphH - (h.aqi / maxAQI) * graphH;
    return { x, y, aqi: h.aqi, hour: h.hour, isTrap: h.isCriticalTrap, isSafe: h.isSafeWindow };
  });

  // Fill gradient under curve
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw Stroke Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw Hour Points & Labels
  ctx.textAlign = 'center';
  points.forEach((pt, i) => {
    // Show label every 3 hours
    if (i % 3 === 0) {
      const timeStr = `${String(pt.hour).padStart(2, '0')}:00`;
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.fillText(timeStr, pt.x, height - padding.bottom + 18);
    }

    // Point circles
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.isTrap || pt.isSafe ? 4.5 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = pt.isTrap ? '#ef4444' : (pt.isSafe ? '#10b981' : (isDark ? '#38bdf8' : '#0284c7'));
    ctx.fill();
    ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

/**
 * Renders SVG Biological Health Risk Meter (0 - 100)
 *
 * @param {object} riskData Output of calculateHouseholdRiskIndex
 * @param {HTMLElement} container
 */
export function renderRiskGauge(riskData, container) {
  if (!container || !riskData) return;

  const score = riskData.score || 50;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = '#10b981';
  if (score >= 80) strokeColor = '#dc2626';
  else if (score >= 60) strokeColor = '#ea580c';
  else if (score >= 40) strokeColor = '#f59e0b';

  const factorsHtml = (riskData.contributingFactors || [])
    .map(f => `<span class="badge badge-risk">${escapeHTML(f)}</span>`)
    .join(' ');

  const html = `
    <div class="risk-gauge-card">
      <div class="gauge-visual">
        <svg viewBox="0 0 130 130" class="gauge-svg" aria-hidden="true">
          <circle cx="65" cy="65" r="${radius}" class="gauge-bg" />
          <circle cx="65" cy="65" r="${radius}" class="gauge-val"
            stroke="${strokeColor}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}" />
        </svg>
        <div class="gauge-center-text">
          <span class="gauge-number">${score}</span>
          <span class="gauge-unit">/100</span>
        </div>
      </div>
      <div class="gauge-details">
        <h4 class="gauge-title" style="color: ${strokeColor};">${escapeHTML(riskData.riskLevel)}</h4>
        <p class="gauge-desc">Integrated biological vulnerability score based on archetype exposure & demographic modifiers.</p>
        <div class="risk-factors-pills">
          ${factorsHtml || '<span class="badge badge-subtle">Standard Vulnerability</span>'}
        </div>
      </div>
    </div>
  `;

  setSanitizedHTML(container, html);
}

/**
 * Renders CPCB Multi-Pollutant & WHO 2021 Comparison Cards
 *
 * @param {object} compositeAQI
 * @param {HTMLElement} container
 */
export function renderPollutantCards(compositeAQI, container) {
  if (!container || !compositeAQI) return;

  const cards = [
    { key: 'pm25', name: 'PM2.5 (Fine Soot)', unit: 'µg/m³', desc: 'Penetrates deep into alveolar air sacs' },
    { key: 'pm10', name: 'PM10 (Coarse Dust)', unit: 'µg/m³', desc: 'Resuspended road dust and construction' },
    { key: 'no2', name: 'NO2 (Nitrogen Dioxide)', unit: 'µg/m³', desc: 'Diesel combustion and thermal power' },
    { key: 'so2', name: 'SO2 (Sulfur Dioxide)', unit: 'µg/m³', desc: 'Industrial coal & diesel fuel sulfur' },
    { key: 'co', name: 'CO (Carbon Monoxide)', unit: 'mg/m³', desc: 'Incomplete combustion tailpipe gas' },
    { key: 'o3', name: 'Ozone (Ground-Level O3)', unit: 'µg/m³', desc: 'Secondary smog oxidizer formed in sun' }
  ];

  let html = '<div class="pollutant-grid">';
  cards.forEach(c => {
    const sub = compositeAQI.subIndices?.[c.key] || 0;
    const who = compositeAQI.whoExceedances?.[c.key];
    const conc = who ? who.concentration : '--';
    const exceedanceRatio = who ? who.ratio : 1;

    let pillClass = 'badge-success';
    if (sub > 300) pillClass = 'badge-danger';
    else if (sub > 100) pillClass = 'badge-warning';

    html += `
      <div class="pollutant-card" data-pollutant="${escapeHTML(c.key)}">
        <div class="pollutant-header">
          <span class="pollutant-name">${escapeHTML(c.name)}</span>
          <span class="badge ${pillClass}">AQI ${sub}</span>
        </div>
        <div class="pollutant-body">
          <div class="pollutant-val">${conc} <small>${c.unit}</small></div>
          <div class="who-ratio ${who?.isExceeded ? 'who-warning' : 'who-safe'}">
            ${who ? `${exceedanceRatio}x WHO 24h limit` : 'Within limits'}
          </div>
          <p class="pollutant-desc">${escapeHTML(c.desc)}</p>
        </div>
      </div>
    `;
  });
  html += '</div>';

  setSanitizedHTML(container, html);
}

/**
 * Renders 6-Block Daily Schedule Timeline
 *
 * @param {Array<object>} blocks
 * @param {HTMLElement} container
 */
export function renderRoutineTimeline(blocks, container) {
  if (!container || !Array.isArray(blocks)) return;

  let html = '<div class="timeline-container">';
  blocks.forEach((b, idx) => {
    html += `
      <div class="timeline-item timeline-${escapeHTML(b.severity)}">
        <div class="timeline-marker">${escapeHTML(b.icon)}</div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-time">${escapeHTML(b.timeSpan)}</span>
            <span class="badge badge-${escapeHTML(b.severity)}">${escapeHTML(b.phaseName)}</span>
          </div>
          <h4 class="timeline-title">${escapeHTML(b.title)}</h4>
          <p class="timeline-atmos">${escapeHTML(b.atmosphericContext)}</p>
          <div class="timeline-rule">
            <strong>🛡️ Protocol:</strong> ${escapeHTML(b.protocol)}
          </div>
          <div class="timeline-switch">
            <strong>🌱 Lifestyle Switch:</strong> ${escapeHTML(b.lifestyleSwitch)}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  setSanitizedHTML(container, html);
}

/**
 * Renders Interactive DIY Corsi-Rosenthal Purifier & ACH Metrics
 *
 * @param {object} crSpecs
 * @param {HTMLElement} container
 */
export function renderCorsiRosenthalSpecs(crSpecs, container) {
  if (!container || !crSpecs) return;

  const html = `
    <div class="cr-specs-dashboard">
      <div class="metric-row">
        <div class="spec-card">
          <span class="spec-label">Clean Air Delivery (CADR)</span>
          <span class="spec-val">${crSpecs.effectiveCadrCFM} <small>CFM</small></span>
          <span class="spec-sub">${crSpecs.effectiveCadrM3Hr} m³/hr clean airflow</span>
        </div>
        <div class="spec-card">
          <span class="spec-label">Air Changes Per Hour (ACH)</span>
          <span class="spec-val">${crSpecs.ach} <small>ACH</small></span>
          <span class="spec-sub">${escapeHTML(crSpecs.achRating)}</span>
        </div>
        <div class="spec-card">
          <span class="spec-label">90% Room Clearance Time</span>
          <span class="spec-val">${crSpecs.clearanceTimes?.t90Min} <small>minutes</small></span>
          <span class="spec-sub">99% clearance: ${crSpecs.clearanceTimes?.t99Min} mins</span>
        </div>
        <div class="spec-card spec-savings">
          <span class="spec-label">Cost Savings vs Commercial HEPA</span>
          <span class="spec-val">₹${crSpecs.costComparison?.savingsINR.toLocaleString()}</span>
          <span class="spec-sub">${crSpecs.costComparison?.savingsPct}% cost reduction</span>
        </div>
      </div>
    </div>
  `;

  setSanitizedHTML(container, html);
}

/**
 * Renders Direct Impact Explainer Metrics (Lung mass avoided, cigarettes, CO2e)
 *
 * @param {object} avoidanceData
 * @param {object} carbonData
 * @param {HTMLElement} container
 */
export function renderEmissionImpact(avoidanceData, carbonData, container) {
  if (!container || !avoidanceData || !carbonData) return;

  const html = `
    <div class="impact-cards-grid">
      <div class="impact-card highlight-pm">
        <div class="impact-icon">🫁</div>
        <div class="impact-body">
          <span class="impact-title">Inhaled PM2.5 Avoided</span>
          <div class="impact-number">${avoidanceData.dailyInhaledAvoidedUg.toLocaleString()} <small>µg / day</small></div>
          <span class="impact-sub">${avoidanceData.annualInhaledAvoidedMg} mg particulate avoided per year</span>
        </div>
      </div>
      <div class="impact-card highlight-cigs">
        <div class="impact-icon">🚭</div>
        <div class="impact-body">
          <span class="impact-title">Cigarette Equivalence</span>
          <div class="impact-number">${avoidanceData.cigarettesAvoidedDaily} <small>cigs / day</small></div>
          <span class="impact-sub">Avoids ${avoidanceData.cigarettesAvoidedMonthly} passive cigarettes monthly (Berkeley Earth Model)</span>
        </div>
      </div>
      <div class="impact-card highlight-co2">
        <div class="impact-icon">🌿</div>
        <div class="impact-body">
          <span class="impact-title">Carbon Footprint Abated</span>
          <div class="impact-number">${carbonData.savedCO2eKg} <small>kg CO₂e / mo</small></div>
          <span class="impact-sub">Equivalent to planting ${carbonData.treeEquivalents} urban trees</span>
        </div>
      </div>
      <div class="impact-card highlight-cost">
        <div class="impact-icon">💰</div>
        <div class="impact-body">
          <span class="impact-title">Monthly Transit Savings</span>
          <div class="impact-number">₹${carbonData.savedCostINR.toLocaleString()}</div>
          <span class="impact-sub">Fuel and parking cost abated by clean transit shift</span>
        </div>
      </div>
    </div>
  `;

  setSanitizedHTML(container, html);
}

/**
 * Renders Community Collective Smog Shield Actions & Impact
 *
 * @param {Array<object>} actions
 * @param {string[]} selectedActionIds
 * @param {HTMLElement} container
 */
export function renderCommunityShield(actions, selectedActionIds = [], container) {
  if (!container || !Array.isArray(actions)) return;

  let totalAvoidedPM = 0;
  let totalAvoidedCO2 = 0;

  actions.forEach(a => {
    if (selectedActionIds.includes(a.id)) {
      totalAvoidedPM += a.impactPM25AvoidedKgPerDay;
      totalAvoidedCO2 += a.co2eAvoidedKgPerDay;
    }
  });

  let html = `
    <div class="community-summary-bar">
      <div class="summary-item">
        <span class="summary-label">Selected Interventions</span>
        <span class="summary-value">${selectedActionIds.length} of ${actions.length} Active</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Collective PM2.5 Abatement</span>
        <span class="summary-value">${Math.round(totalAvoidedPM * 10) / 10} kg / day</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Society CO₂e Avoidance</span>
        <span class="summary-value">${Math.round(totalAvoidedCO2 * 10) / 10} kg / day</span>
      </div>
    </div>
    <div class="community-actions-list">
  `;

  actions.forEach(a => {
    const isChecked = selectedActionIds.includes(a.id);
    html += `
      <div class="community-action-card ${isChecked ? 'action-selected' : ''}">
        <label class="action-checkbox-wrapper">
          <input type="checkbox" class="community-toggle" data-action-id="${escapeHTML(a.id)}" ${isChecked ? 'checked' : ''} />
          <span class="custom-checkbox" aria-hidden="true"></span>
        </label>
        <div class="action-details">
          <div class="action-top">
            <h4 class="action-title">${escapeHTML(a.title)}</h4>
            <span class="badge badge-subtle">${escapeHTML(a.category)}</span>
            <span class="badge badge-cost">${escapeHTML(a.costLevel)}</span>
          </div>
          <p class="action-desc">${escapeHTML(a.description)}</p>
          <div class="action-impact-stats">
            <span>🛡️ Averts <strong>${a.impactPM25AvoidedKgPerDay} kg PM2.5</strong>/day</span>
            <span>🌿 Saves <strong>${a.co2eAvoidedKgPerDay} kg CO₂e</strong>/day</span>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  setSanitizedHTML(container, html);
}
