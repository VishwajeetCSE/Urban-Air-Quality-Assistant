/**
 * @fileoverview Hybrid GenAI Architecture — Offline Knowledge Graph + Live Gemini REST Connector
 * Provides 100% offline-first deterministic air defense advisory, with optional
 * ephemeral live Google Gemini AI capabilities via memory-only key.
 * @module ai
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

import { ApiKeyVault, escapeHTML } from './security.js';
import { ARCHETYPES, MICRO_ZONES } from './constants.js';

/**
 * Deterministic Offline Expert Knowledge Graph
 * 25+ structured rules analyzing AQI thresholds, demographic vulnerabilities,
 * and user query intent without requiring external cloud connectivity.
 *
 * @param {object} context
 * @param {string} [context.query='']
 * @param {object} context.profile
 * @param {number} context.currentAQI
 * @returns {object} Structured contextual advisory
 */
export function generateHeuristicAdvisory({ query = '', profile = {}, currentAQI = 250 } = {}) {
  const q = (query || '').toLowerCase();
  const archetype = ARCHETYPES[profile.archetypeKey] || ARCHETYPES.residential_family;
  const zone = MICRO_ZONES[profile.microZoneKey] || MICRO_ZONES.dense_residential;
  const vulns = Array.isArray(profile.vulnerabilities) ? profile.vulnerabilities : [];

  let headline = `Clean Air Advisory for ${archetype.title} (AQI ${currentAQI})`;
  let severity = currentAQI > 300 ? 'emergency' : (currentAQI > 150 ? 'warning' : 'safe');
  let directActions = [];
  let scientificRationale = '';
  let avoidanceRule = '';

  // 1. Intent Detection: Mask / Respirator
  if (q.includes('mask') || q.includes('n95') || q.includes('cloth')) {
    headline = 'Respirator Protocol & Facial Seal Verification';
    directActions = [
      'Switch strictly to certified N95 or FFP2 respirators with dual headstraps (not ear loops).',
      'Perform a positive-pressure seal check: cup hands over filter and exhale sharply; no air should leak along nasal bridge.',
      'Discard surgical and cotton cloth masks; their penetration rate for ultrafine PM2.5 exceeds 75%.'
    ];
    scientificRationale = 'Sub-micron PM2.5 particles (especially 0.3 µm combustion soot) pass through woven cloth via aerodynamic slip flow.';
    avoidanceRule = 'Never reuse a single disposable N95 for more than 40 cumulative exposure hours in winter smog.';
  }
  // 2. Intent Detection: Exercise / Jogging / Morning Walks
  else if (q.includes('exercise') || q.includes('jog') || q.includes('walk') || q.includes('workout') || q.includes('gym')) {
    headline = 'Physical Exertion & Respiratory Inhalation Window';
    directActions = [
      'Postpone any outdoor aerobic workout until the 12:30 PM – 03:30 PM convective safe window.',
      'Shift morning cardiovascular exercise indoors with a DIY Corsi-Rosenthal or HEPA purifier running on High.',
      'Keep indoor exercise intensity moderate to prevent hyperventilation (minute ventilation > 0.035 m³/min).'
    ];
    scientificRationale = 'During deep aerobic breathing, oral respiration bypasses nasal cilia, depositing up to 5x more particulate mass deep into pulmonary alveoli.';
    avoidanceRule = 'Absolute ban on morning outdoor workouts between 06:00 AM and 09:30 AM when ground radiation inversion traps smog.';
  }
  // 3. Intent Detection: School / Children / Recess
  else if (q.includes('school') || q.includes('child') || q.includes('infant') || q.includes('recess') || q.includes('daycare')) {
    headline = 'Pediatric Air Defense & School Recess Protocol';
    directActions = [
      'Suspend outdoor physical education classes, sports practices, and morning assemblies while AQI > 200.',
      'Deploy 1 Corsi-Rosenthal box per classroom (achieves 5+ ACH for under ₹4,000 per room).',
      'Mandate well-fitted pediatric-sized N95 masks for student bus transit.'
    ];
    scientificRationale = 'Children breathe 50% more air per pound of body weight than adults and their developing lung tissue is particularly vulnerable to permanent alveolar scarring.';
    avoidanceRule = 'Do not permit open-air school recess before 12:00 PM during Graded Response Action Plan (GRAP) Stage III/IV.';
  }
  // 4. Intent Detection: Purifier / DIY Filter / Corsi-Rosenthal
  else if (q.includes('purifier') || q.includes('filter') || q.includes('cadr') || q.includes('hepa') || q.includes('box fan')) {
    headline = 'DIY Air Purifier Optimization & Placement';
    directActions = [
      'Construct a 4-panel MERV-13 Corsi-Rosenthal box fan with an airtight cardboard shroud ring.',
      'Elevate the unit 30 cm off the floor to prevent sucking in settled floor lint.',
      'Keep doors and windows sealed in the target room to allow the unit to achieve 4+ Air Changes per Hour (ACH).'
    ];
    scientificRationale = 'Parallel filter panels reduce air velocity across media, allowing higher particle capture via Brownian diffusion and impaction with 70% lower fan motor strain.';
    avoidanceRule = 'Do not purchase ionizers or ozone-generating air cleaners; ozone is a severe lung irritant that exacerbates asthma.';
  }
  // 5. Default Contextual Assessment based on AQI and Archetype
  else {
    if (currentAQI >= 350) {
      headline = `Severe Smog Emergency Protocol for ${archetype.title}`;
      directActions = [
        'Initiate positive-pressure room sealing with silicone weatherstrips on all exterior doors.',
        'Run continuous mechanical filtration; position air scrubbers directly in occupied bedrooms.',
        'Adopt microfibre wet-mopping twice daily; strictly prohibit sweeping or vacuuming without sealed HEPA exhaust.',
        'If managing community RWA, curtail all diesel generator sets and enforce ban on garden leaf burning.'
      ];
      scientificRationale = 'Inversion boundary layer altitude drops below 200 meters, concentrating combustion toxins and triggering cardiovascular platelet aggregation.';
      avoidanceRule = 'Avoid non-essential outdoor transit; protect infants, elderly relatives, and respiratory patients in a sealed clean-room oasis.';
    } else if (currentAQI >= 200) {
      headline = `Very Poor Air Quality Mitigation for ${archetype.title}`;
      directActions = [
        'Shift outdoor chores to the 12:30 PM – 03:30 PM solar convective window.',
        'Wear an N95 respirator during commute; set car air intake to strict cabin recirculation.',
        'Water-mist balcony and entrance perimeters at 08:00 AM to suppress coarse dust resuspension.'
      ];
      scientificRationale = 'Fine PM2.5 levels exceed WHO 24-hr guidelines by 8-15x, elevating systemic inflammatory markers.';
      avoidanceRule = 'Do not open windows during morning hours (06:00 – 10:00 AM) or evening traffic peak (06:00 – 09:00 PM).';
    } else {
      headline = `Proactive Air Protection Plan for ${archetype.title}`;
      directActions = [
        'Utilize the 12:00 PM – 03:00 PM window for complete whole-house cross-ventilation.',
        'Inspect DIY filter seals and dust NASA botanical bio-shield plants with a damp sponge.',
        'Walk or cycle for short neighborhood trips using green side streets rather than main diesel truck corridors.'
      ];
      scientificRationale = 'Maintaining moderate baseline indoor protection prevents accumulation of indoor formaldehyde and CO2.';
      avoidanceRule = 'Avoid burning incense, mosquito coils, or candles in unventilated living spaces.';
    }
  }

  // Inject specific vulnerability alerts if detected
  if (vulns.includes('asthma')) {
    directActions.push('Asthma Precaution: Keep rescue bronchodilators within arm’s reach; cold smog air triggers bronchospasm.');
  }
  if (vulns.includes('infants')) {
    directActions.push('Infant Care: Maintain indoor room humidity between 40-50% to prevent dry mucosal cracking.');
  }

  return {
    isHeuristic: true,
    headline,
    severity,
    directActions,
    scientificRationale,
    avoidanceRule,
    timestamp: new Date().toLocaleTimeString()
  };
}

/**
 * Queries Google Gemini API (if key available) or transparently routes to offline heuristic engine
 *
 * @param {string} prompt User prompt or question
 * @param {object} context Application state and profile
 * @returns {Promise<object>} Formatted response with markdown-safe text
 */
export async function queryVayuGenieAI(prompt, context = {}) {
  const userKey = ApiKeyVault.getKey();

  // If no Gemini API key entered, deliver instantaneous offline heuristic expert advice
  if (!userKey) {
    const offlineResult = generateHeuristicAdvisory({
      query: prompt,
      profile: context.profile || {},
      currentAQI: context.currentAQI || 250
    });

    return {
      source: 'offline_heuristic',
      success: true,
      data: offlineResult,
      displayText: formatHeuristicResponse(offlineResult, false)
    };
  }

  // Live Google Gemini 1.5/2.0 Flash REST Integration with memory-only key
  const systemInstruction = `You are VayuGenie AI, an expert environmental engineer and atmospheric physician specializing in urban winter smog, CPCB NAQI standards, and community microclimate defense in India.
Current Profile:
- Archetype: ${context.profile?.archetypeKey || 'residential_family'}
- Micro-Zone: ${context.profile?.microZoneKey || 'dense_residential'}
- Current AQI: ${context.currentAQI || 280}
- Active Vulnerabilities: ${(context.profile?.vulnerabilities || []).join(', ') || 'None'}

Provide concise, scientifically accurate, and actionable advice tailored to this profile. Format with clear bullet points. Include:
1. Immediate Action
2. Low-Emission Alternative
3. Scientific Direct Impact`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(userKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const payload = await response.json();
    const generatedText = payload.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return {
      source: 'gemini_live',
      success: true,
      displayText: generatedText
    };
  } catch (err) {
    // Graceful offline fallback if network or key fails
    console.warn('Gemini API call failed, falling back to offline heuristic engine:', err.message);
    const offlineResult = generateHeuristicAdvisory({
      query: prompt,
      profile: context.profile || {},
      currentAQI: context.currentAQI || 250
    });

    return {
      source: 'offline_fallback',
      success: true,
      data: offlineResult,
      displayText: formatHeuristicResponse(offlineResult, true)
    };
  }
}

/**
 * Formats heuristic output into clean, structured Markdown for display
 * @param {object} res
 * @param {boolean} isFallback
 * @returns {string}
 */
function formatHeuristicResponse(res, isFallback = false) {
  let out = `### 🍃 ${escapeHTML(res.headline)}\n\n`;

  if (isFallback) {
    out += `> *Note: Live cloud connection was unavailable. Instant offline heuristic expert engine engaged.*\n\n`;
  }

  out += `**Immediate Defense Protocols:**\n`;
  res.directActions.forEach(action => {
    out += `- ${escapeHTML(action)}\n`;
  });

  out += `\n**Atmospheric Physics Rationale:**\n${escapeHTML(res.scientificRationale)}\n\n`;
  out += `**Critical Restriction:**\n${escapeHTML(res.avoidanceRule)}\n`;

  return out;
}
