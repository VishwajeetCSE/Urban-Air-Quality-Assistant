/**
 * @fileoverview Pure DOM & Canvas UI Renderers (Zero Dependency, High Performance)
 * Diurnal Smog Inversion Chart, Health Risk Gauge, Routine Cards, IAQ Studio, and Carbon Counters
 * @module ui-renderers
 * @author Vishwajeet Kumar
 * @license MIT
 */

import { escapeHTML, setSanitizedHTML } from './security.js';
import { DIY_IAQ_HACKS, COMMUNITY_SHIELD_PROTOCOLS } from './constants.js';

/**
 * Renders the 24-hour Diurnal Winter Smog Curve on an HTML5 Canvas
 * Handles High-DPI screens cleanly and highlights morning trap & solar windows
 * @param {object} forecastData - from getDiurnalSmogForecast()
 * @param {HTMLCanvasElement} canvas
 */
export function renderDiurnalChart(forecastData, canvas) {
  if (!canvas || !forecastData || !forecastData.hours) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width > 0 ? rect.width : 720;
  const height = 260;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotW = width - paddingLeft - paddingRight;
  const plotH = height - paddingTop - paddingBottom;

  ctx.clearRect(0, 0, width, height);

  const hours = forecastData.hours;
  const maxAQI = 500;
  const minAQI = 0;

  // 1. Shaded Region: Morning Smog Trap (Hours 6 to 9)
  const xTrapStart = paddingLeft + (6 / 23) * plotW;
  const xTrapEnd = paddingLeft + (9.5 / 23) * plotW;
  ctx.fillStyle = 'rgba(230, 0, 35, 0.12)';
  ctx.fillRect(xTrapStart, paddingTop, xTrapEnd - xTrapStart, plotH);

  // 2. Shaded Region: Convective Solar Safe Window (Hours 12 to 15.5)
  const xSafeStart = paddingLeft + (12 / 23) * plotW;
  const xSafeEnd = paddingLeft + (15.5 / 23) * plotW;
  ctx.fillStyle = 'rgba(0, 200, 83, 0.15)';
  ctx.fillRect(xSafeStart, paddingTop, xSafeEnd - xSafeStart, plotH);

  // 3. Grid Lines & Y-Axis Labels
  ctx.strokeStyle = 'rgba(150, 150, 150, 0.2)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(120, 120, 120, 0.85)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';

  const ySteps = [0, 100, 200, 300, 400, 500];
  ySteps.forEach(val => {
    const y = paddingTop + plotH - (val / maxAQI) * plotH;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    ctx.fillText(String(val), paddingLeft - 8, y + 4);
  });

  // 4. Diurnal Curve Line & Gradient Fill
  const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotH);
  gradient.addColorStop(0, 'rgba(180, 0, 30, 0.35)');
  gradient.addColorStop(0.5, 'rgba(255, 126, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 200, 83, 0.05)');

  ctx.beginPath();
  hours.forEach((pt, idx) => {
    const x = paddingLeft + (idx / 23) * plotW;
    const y = paddingTop + plotH - ((pt.aqi - minAQI) / (maxAQI - minAQI)) * plotH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  // Fill below curve
  ctx.lineTo(width - paddingRight, paddingTop + plotH);
  ctx.lineTo(paddingLeft, paddingTop + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Stroke curve line
  ctx.beginPath();
  ctx.strokeStyle = '#0288d1';
  ctx.lineWidth = 2.5;
  hours.forEach((pt, idx) => {
    const x = paddingLeft + (idx / 23) * plotW;
    const y = paddingTop + plotH - ((pt.aqi - minAQI) / (maxAQI - minAQI)) * plotH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 5. Plot Points & X-Axis Time Labels
  ctx.textAlign = 'center';
  hours.forEach((pt, idx) => {
    const x = paddingLeft + (idx / 23) * plotW;
    const y = paddingTop + plotH - ((pt.aqi - minAQI) / (maxAQI - minAQI)) * plotH;

    // Draw circle for peak and cleanest hours
    if (idx === forecastData.peakHour || idx === forecastData.cleanestHour || idx % 4 === 0) {
      ctx.beginPath();
      ctx.arc(x, y, idx === forecastData.peakHour ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = pt.color || '#0288d1';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // X-Axis labels every 3 hours
    if (idx % 3 === 0 || idx === 23) {
      ctx.fillStyle = 'rgba(120, 120, 120, 0.9)';
      ctx.fillText(`${pt.hour}h`, x, paddingTop + plotH + 18);
    }
  });

  // 6. Section Zone Annotations
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#d50000';
  ctx.fillText('Morning Trap (6-9 AM)', (xTrapStart + xTrapEnd) / 2, paddingTop - 10);

  ctx.fillStyle = '#00c853';
  ctx.fillText('Safest Window (12-3 PM)', (xSafeStart + xSafeEnd) / 2, paddingTop - 10);
}

/**
 * Renders SVG circular Health Risk Gauge (0 - 100% Safety Scale)
 * @param {number} score
 * @param {string} riskLabel
 * @param {HTMLElement} container
 */
export function renderRiskGauge(score, riskLabel, container) {
  if (!container) return;

  const s = Math.min(100, Math.max(0, Number(score) || 0));
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (s / 100) * circumference;

  const color = s >= 80 ? '#00c853' : s >= 60 ? '#92d050' : s >= 40 ? '#ffd700' : s >= 25 ? '#ff7e00' : '#d50000';

  const html = `
<div class="risk-gauge-wrapper">
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Household safety score: ${s}%">
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="rgba(150, 150, 150, 0.2)" stroke-width="${strokeWidth}" />
    <circle
      cx="${size / 2}"
      cy="${size / 2}"
      r="${radius}"
      fill="none"
      stroke="${color}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-dasharray="${circumference}"
      stroke-dashoffset="${strokeDashoffset}"
      transform="rotate(-90 ${size / 2} ${size / 2})"
      style="transition: stroke-dashoffset 0.8s ease;"
    />
    <text x="50%" y="46%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-weight="bold" fill="currentColor">${s}%</text>
    <text x="50%" y="64%" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="rgba(120, 120, 120, 0.9)">Safety Score</text>
  </svg>
  <div class="gauge-badge" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40;">
    <strong>${escapeHTML(riskLabel)}</strong>
  </div>
</div>
`.trim();

  setSanitizedHTML(container, html);
}

/**
 * Renders CPCB composite AQI and individual pollutant cards
 * @param {object} compositeAQI - from calculateCompositeAQI()
 * @param {HTMLElement} container
 */
export function renderPollutantCards(compositeAQI, container) {
  if (!container || !compositeAQI) return;

  const { aqi, category, color, prominentPollutant, healthAdvisory, subIndices } = compositeAQI;

  const cardsHtml = `
<div class="aqi-hero-card" style="border-left: 6px solid ${color};">
  <div class="aqi-hero-header">
    <div>
      <span class="aqi-hero-label">Indian CPCB Air Quality Index</span>
      <h2 class="aqi-hero-number" style="color: ${color};">${aqi}</h2>
    </div>
    <div class="aqi-hero-badge" style="background: ${color}22; color: ${color}; border: 1px solid ${color};">
      ${escapeHTML(category)}
    </div>
  </div>
  <p class="aqi-prominent">Prominent Pollutant: <strong>${escapeHTML(prominentPollutant)}</strong></p>
  <p class="aqi-health-advisory">${escapeHTML(healthAdvisory)}</p>
</div>

<div class="pollutants-grid">
  <div class="pollutant-pill">
    <span class="pollutant-name">PM2.5</span>
    <span class="pollutant-val">${subIndices.pm25} <small>AQI</small></span>
  </div>
  <div class="pollutant-pill">
    <span class="pollutant-name">PM10</span>
    <span class="pollutant-val">${subIndices.pm10} <small>AQI</small></span>
  </div>
  <div class="pollutant-pill">
    <span class="pollutant-name">NO₂</span>
    <span class="pollutant-val">${subIndices.no2} <small>AQI</small></span>
  </div>
  <div class="pollutant-pill">
    <span class="pollutant-name">Ozone (O₃)</span>
    <span class="pollutant-val">${subIndices.o3} <small>AQI</small></span>
  </div>
</div>
`.trim();

  setSanitizedHTML(container, cardsHtml);
}

/**
 * Renders daily routine schedule blocks with interactive badges
 * @param {Array<object>} scheduleBlocks
 * @param {HTMLElement} container
 */
export function renderRoutineTimeline(scheduleBlocks, container) {
  if (!container || !Array.isArray(scheduleBlocks)) return;

  const blocksHtml = scheduleBlocks.map(b => `
<div class="timeline-card ${b.status.toLowerCase()}">
  <div class="timeline-header">
    <span class="timeline-time">${escapeHTML(b.timeSlot)}</span>
    <span class="timeline-badge ${b.badgeClass}">${escapeHTML(b.badge)}</span>
  </div>
  <h4 class="timeline-title">${escapeHTML(b.title)}</h4>
  <p class="timeline-action"><strong>Action:</strong> ${escapeHTML(b.actionProtocol)}</p>
  <div class="timeline-details">
    <p>🏠 <strong>Indoor IAQ:</strong> ${escapeHTML(b.iaqIndoorStep)}</p>
    <p>🚲 <strong>Clean Commute:</strong> ${escapeHTML(b.commuteAlternative)}</p>
    <p>🏘️ <strong>Community Action:</strong> ${escapeHTML(b.societyCoordination)}</p>
  </div>
</div>
`).join('');

  setSanitizedHTML(container, `<div class="timeline-container">${blocksHtml}</div>`);
}

/**
 * Renders DIY IAQ Hacks cards with checkboxes and CADR calculator
 * @param {string[]} activeHackIds
 * @param {HTMLElement} container
 */
export function renderIAQHacks(activeHackIds = [], container) {
  if (!container) return;

  const hacksHtml = DIY_IAQ_HACKS.map(hack => {
    const isChecked = activeHackIds.includes(hack.id);
    const stepsHtml = hack.steps
      ? `<ul class="hack-steps">${hack.steps.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>`
      : '';
    const plantsHtml = hack.plants
      ? `<div class="plants-list">${hack.plants.map(p => `
          <div class="plant-item">
            <strong>${escapeHTML(p.name)}</strong>: ${escapeHTML(p.role)} <em>(${escapeHTML(p.care)})</em>
          </div>`).join('')}</div>`
      : '';

    return `
<div class="hack-card ${isChecked ? 'active' : ''}" data-hack-id="${hack.id}">
  <div class="hack-header">
    <label class="hack-checkbox-label">
      <input type="checkbox" class="hack-checkbox" data-hack-id="${hack.id}" ${isChecked ? 'checked' : ''} />
      <span class="hack-title">${escapeHTML(hack.name)}</span>
    </label>
    <span class="hack-tag">${escapeHTML(hack.tag)}</span>
  </div>
  <p class="hack-desc">${escapeHTML(hack.description)}</p>
  <div class="hack-meta">
    <span>Est. Cost: <strong>₹${hack.costINR}</strong> (vs ₹${hack.commercialEquivINR} commercial)</span>
    <span>PM2.5 Drop: <strong>-${Math.round(hack.reduction * 100)}%</strong></span>
  </div>
  ${stepsHtml}
  ${plantsHtml}
</div>
`;
  }).join('');

  setSanitizedHTML(container, `<div class="hacks-list">${hacksHtml}</div>`);
}

/**
 * Renders quantified direct impact metrics (Avoided PM2.5, Cigarettes, Carbon CO2e, Fuel Savings)
 * @param {object} impactData - { inhaledAvoided, carbonData, healthRisk }
 * @param {HTMLElement} container
 */
export function renderEmissionImpact(impactData, container) {
  if (!container || !impactData) return;

  const { inhaledAvoided, carbonData, healthRisk } = impactData;

  const html = `
<div class="impact-stats-grid">
  <div class="impact-stat-card highlight">
    <span class="impact-stat-number">${inhaledAvoided.dailyInhaledAvoidedUg.toLocaleString()} <small>µg/day</small></span>
    <span class="impact-stat-title">PM2.5 Inhaled Lung Deposition Avoided</span>
    <span class="impact-stat-sub">~${inhaledAvoided.annualInhaledAvoidedMg.toLocaleString()} mg annually saved from deep alveolar tissue</span>
  </div>

  <div class="impact-stat-card">
    <span class="impact-stat-number">${inhaledAvoided.cigarettesAvoidedDaily} <small>cig/day</small></span>
    <span class="impact-stat-title">Cigarette Equivalence Avoided</span>
    <span class="impact-stat-sub">Equal to ~${inhaledAvoided.cigarettesAvoidedMonthly} toxic cigarettes avoided per month (Berkeley Earth model)</span>
  </div>

  <div class="impact-stat-card highlight-green">
    <span class="impact-stat-number">${carbonData.monthlyCo2eSavedKg} <small>kg CO₂e</small></span>
    <span class="impact-stat-title">Monthly Carbon Abated</span>
    <span class="impact-stat-sub">~${carbonData.annualCo2eSavedKg} kg CO₂e/yr via clean commute, induction, & composting</span>
  </div>

  <div class="impact-stat-card">
    <span class="impact-stat-number">₹${carbonData.fuelCostSavedINR.toLocaleString()}</span>
    <span class="impact-stat-title">Monthly Fuel & Commute Savings</span>
    <span class="impact-stat-sub">Estimated wallet savings from Metro/EV transit switch</span>
  </div>
</div>
`.trim();

  setSanitizedHTML(container, html);
}

/**
 * Renders Community Shield protocols and exportable RWA circular
 * @param {HTMLElement} container
 */
export function renderCommunityShield(container) {
  if (!container) return;

  const itemsHtml = COMMUNITY_SHIELD_PROTOCOLS.map(proto => `
<div class="community-protocol-card">
  <h4>${escapeHTML(proto.title)}</h4>
  <p class="community-scope"><strong>Scope:</strong> ${escapeHTML(proto.scope)}</p>
  <p class="community-impact"><strong>Impact:</strong> ${escapeHTML(proto.impact)}</p>
  <p class="community-action"><strong>Mandate:</strong> ${escapeHTML(proto.action)}</p>
</div>
`).join('');

  setSanitizedHTML(container, `<div class="community-protocols-grid">${itemsHtml}</div>`);
}
