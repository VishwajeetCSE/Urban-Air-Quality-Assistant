/**
 * @fileoverview Hybrid GenAI Smog Coach ("AeroGenie")
 * Offline-first Heuristic Knowledge Graph + Optional Live Google Gemini API
 * @module ai
 * @author Vishwajeet Kumar
 * @license MIT
 */

import { ApiKeyVault, sanitizeHTML } from './security.js';
import { ARCHETYPES, HOTSPOT_CITIES } from './constants.js';

/**
 * Deterministic Heuristic Smog Knowledge Graph
 * Provides instantaneous, zero-latency, factual advisories 100% offline without API keys
 * @param {object} context
 * @param {string} [context.archetypeKey='apartment_family']
 * @param {string} [context.cityKey='delhi']
 * @param {number} [context.aqi=320]
 * @param {string[]} [context.vulnerabilities=[]]
 * @param {string} [context.mode='family'] - 'family' | 'community'
 * @param {string} [context.userQuery='']
 * @returns {string} Sanitized markdown/HTML response string
 */
export function generateHeuristicAdvisory(context = {}) {
  const arch = ARCHETYPES[context.archetypeKey] || ARCHETYPES.apartment_family;
  const city = HOTSPOT_CITIES[context.cityKey] || HOTSPOT_CITIES.delhi;
  const aqi = Number(context.aqi) || 280;
  const vulns = context.vulnerabilities || [];
  const mode = context.mode || 'family';
  const query = (context.userQuery || '').toLowerCase();

  // Mode B: Community Notice Board / WhatsApp Circular
  if (mode === 'community' || query.includes('rwa') || query.includes('society') || query.includes('notice')) {
    return `
<div class="ai-notice-board">
  <h3>📢 RWA RESIDENT CIRCULAR: SMOG SHIELD ADVISORY</h3>
  <p><strong>Location:</strong> ${city.name} | <strong>Current Air Severity:</strong> AQI ${aqi} (${aqi > 300 ? 'Severe / Emergency' : 'Very Poor'})</p>
  <hr/>
  <p>Dear Residents and Society Leaders,</p>
  <p>As Northern India enters severe winter radiation inversion, the RWA Managing Committee has enacted emergency smog mitigation protocols effective immediately:</p>
  <ul>
    <li>🚫 <strong>Zero-Idling Gate Zone:</strong> All school vans, delivery bikes, and cabs must turn off engines during boarding at Gates 1 & 2.</li>
    <li>⚡ <strong>DG Genset Rationalization:</strong> Diesel generators will run strictly for essential lifts and domestic water pumping. Decorative facade lighting is suspended.</li>
    <li>🍂 <strong>Total Leaf Burning Ban:</strong> Garden staff are provided dedicated composting pits. Open burning will incur a society penalty.</li>
    <li>💧 <strong>STP Perimeter Misting:</strong> Water sprayers will mist boundary fences from 07:00–08:30 AM and 17:30–19:00 PM to capture resuspended dust.</li>
    <li>🕒 <strong>Safe Outdoor Play Window:</strong> Society playgrounds and club gardens are safest between <strong>12:00 PM – 03:30 PM</strong>. Children sports are suspended before 10:00 AM.</li>
  </ul>
  <p><em>— Issued by RWA Clean Air Taskforce | SmogGuard AeroShield AI</em></p>
</div>
`.trim();
  }

  // Targeted answers based on user query
  if (query.includes('purifier') || query.includes('corsi') || query.includes('diy') || query.includes('cadr')) {
    return `
<div class="ai-advice-card">
  <h3>🌀 Corsi-Rosenthal DIY Air Purifier Quick Guide</h3>
  <p>You can build an air purifier that matches or beats commercial ₹30,000 HEPA machines for under ₹4,500:</p>
  <ol>
    <li><strong>Materials:</strong> 1x 20-inch Box Fan (~₹1,800), 4x MERV-13 / HEPA furnace filters (~₹650 each), 1 roll heavy-duty duct tape, cardboard.</li>
    <li><strong>Cube Assembly:</strong> Tape the 4 filters into a square cube with their airflow arrows pointing <em>inward</em>.</li>
    <li><strong>Bottom Floor:</strong> Seal the bottom with a 20x20" cardboard square.</li>
    <li><strong>Fan Placement:</strong> Place the fan on top blowing <em>upward/outward</em> away from the cube.</li>
    <li><strong>Cardboard Shroud:</strong> Cut a 15-inch circular hole in a cardboard sheet and tape it over the fan face. This eliminates tip vortices and boosts airflow 25%!</li>
  </ol>
  <p><strong>Result:</strong> 550+ CFM CADR, 6+ Air Changes per Hour (ACH) for a 300 sq.ft living room!</p>
</div>
`.trim();
  }

  if (query.includes('child') || query.includes('school') || query.includes('baby') || query.includes('infant')) {
    return `
<div class="ai-advice-card">
  <h3>👶 Child & Infant Smog Defense Protocol</h3>
  <p>Children inhale 50% more air per pound of body weight than adults, and their alveolar blood-gas barrier is still permeable.</p>
  <ul>
    <li><strong>School Bus Stop:</strong> The 7:00–8:30 AM window coincides with peak radiation inversion. Children must wear well-fitted child-size N95 masks while waiting.</li>
    <li><strong>Assembly Indoors:</strong> Urge school authorities to shift morning assemblies from open grounds to auditoriums.</li>
    <li><strong>Outdoor Play Hours:</strong> Shift outdoor sports and recess strictly to <strong>12:30 PM – 03:30 PM</strong> when solar convection expands the planetary boundary layer.</li>
    <li><strong>Nursery Sealing:</strong> Keep infants indoors; run Corsi-Rosenthal filter continuously on low in the nursery.</li>
  </ul>
</div>
`.trim();
  }

  if (query.includes('asthma') || query.includes('elderly') || query.includes('copd') || query.includes('breathe')) {
    return `
<div class="ai-advice-card">
  <h3>🧓 Elderly & Respiratory Patient Clinical Protocol</h3>
  <p>Cold morning air mixed with acidic nitrates and PM2.5 causes bronchospasm and elevates cardiac strain.</p>
  <ul>
    <li><strong>Cancel Morning Walks:</strong> Absolutely NO morning walks before 11:00 AM. Shift gentle garden walks to <strong>01:00 PM – 03:00 PM</strong> in bright sunlight.</li>
    <li><strong>Inhaler Readiness:</strong> Keep prescribed bronchodilator / rescue inhaler within arm's reach.</li>
    <li><strong>Saline Nasal Rinse:</strong> Perform gentle isotonic saline nasal washes after returning indoors to flush trapped particulate matter.</li>
    <li><strong>Bedroom Purification:</strong> Position Snake Plants in bedroom; run air filtration during sleep to maintain indoor PM2.5 &lt; 25 µg/m³.</li>
  </ul>
</div>
`.trim();
  }

  // Default Track A: Comprehensive Plain-Language Family Action Guide
  const vulnText = vulns.length > 0
    ? `Specific attention flagged for: <strong>${vulns.join(', ').toUpperCase()}</strong>.`
    : 'Designed for general urban household protection.';

  return `
<div class="ai-family-guide">
  <h3>🛡️ AeroShield Daily Action Plan for ${arch.title}</h3>
  <p><strong>City:</strong> ${city.name} | <strong>Current Air Quality:</strong> AQI ${aqi} | ${vulnText}</p>
  <hr/>
  <h4>1. Diurnal Inversion Timing Strategy</h4>
  <ul>
    <li>🚫 <strong>Danger Window (06:00 – 09:30 AM):</strong> Peak ground-level smog trap. Keep all exterior windows closed, defer non-essential errands, and seal door gaps.</li>
    <li>✅ <strong>Clean Air Safe Window (12:00 – 03:30 PM):</strong> Solar convection thins pollution by up to 50%. Ideal time for quick 15-minute cross-ventilation, child recess, and outdoor grocery runs.</li>
    <li>🚫 <strong>Evening Spike (06:30 – 09:30 PM):</strong> Second accumulation peak. Avoid open markets and outdoor dining.</li>
  </ul>

  <h4>2. High-Impact Indoor Air Quality Hacks</h4>
  <ul>
    <li>🌀 <strong>Filtration:</strong> Run your DIY Corsi-Rosenthal box or HEPA unit in sleeping chambers during night and early morning hours.</li>
    <li>🧹 <strong>Wet-Mopping:</strong> Never dry sweep with a broom. Use a damp microfibre mop twice daily to prevent PM2.5 resuspension.</li>
    <li>🍳 <strong>Kitchen Protocol:</strong> Turn on exhaust fan 2 minutes before cooking; cover frying pans; completely avoid burning agarbatti or mosquito coils.</li>
    <li>🪴 <strong>Botanical Bio-Filters:</strong> Place Snake Plants in bedrooms (releases oxygen at night) and Areca Palms in living spaces.</li>
  </ul>

  <h4>3. Clean Transit & Community Actions</h4>
  <ul>
    <li>🚲 <strong>Commute Swap:</strong> Shift from open two-wheelers to Metro rail or electric transit. In cars, switch HVAC to internal recirculation.</li>
    <li>🏘️ <strong>Community Impact:</strong> Request RWA to enforce zero-idling at school pickup bays and ban garden leaf burning.</li>
  </ul>
</div>
`.trim();
}

/**
 * Hybrid GenAI Orchestrator
 * Connects to live Google Gemini Flash REST API when API key is provided;
 * otherwise provides zero-latency deterministic heuristic answers offline.
 * @param {string} prompt
 * @param {object} context - { archetypeKey, cityKey, aqi, vulnerabilities, mode }
 * @returns {Promise<string>}
 */
export async function queryAeroGenieAI(prompt, context = {}) {
  const cleanPrompt = (prompt || '').trim();

  // If no API key is present in memory, use deterministic heuristic engine immediately
  if (!ApiKeyVault.hasKey()) {
    return generateHeuristicAdvisory({ ...context, userQuery: cleanPrompt });
  }

  // Key is present -> Call Google Gemini 1.5 Flash REST endpoint
  const apiKey = ApiKeyVault.getKey();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const arch = ARCHETYPES[context.archetypeKey] || ARCHETYPES.apartment_family;
  const city = HOTSPOT_CITIES[context.cityKey] || HOTSPOT_CITIES.delhi;
  const aqi = context.aqi || 280;

  const systemInstruction = `
You are AeroGenie, an expert environmental health AI architect for the SmogGuard AeroShield application.
Context:
- Location: ${city.name} (Winter Inversion Hotspot)
- Current AQI: ${aqi} (CPCB NAQI Standard)
- Household Archetype: ${arch.title} (${arch.subTitle})
- Vulnerabilities: ${(context.vulnerabilities || []).join(', ') || 'None'}
- Safe Outdoor Window: 12:00 PM – 3:30 PM (Solar Convective Boundary Layer expansion)
- Danger Smog Trap Hours: 06:00 AM – 09:30 AM and 06:30 PM – 09:30 PM
- Budget Hacks: DIY Corsi-Rosenthal Box (500+ CFM CADR at ₹4,200), wet-mopping over dry broom, kitchen pre-exhaust, zero agarbatti.

Instructions:
1. Provide accurate, empathetic, scientifically grounded advice tailored specifically to their location, archetype, and vulnerable members.
2. Structure output cleanly using HTML tags (<p>, <ul>, <li>, <strong>, <h3>, <ol>).
3. Do not include markdown code block backticks. Keep responses actionable and under 400 words.
`.trim();

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemInstruction}\n\nUser Question/Request:\n${cleanPrompt || 'Generate an optimized family action guide and community notice.'}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 800
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}. Falling back to offline heuristic engine.`);
      return generateHeuristicAdvisory({ ...context, userQuery: cleanPrompt });
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return generateHeuristicAdvisory({ ...context, userQuery: cleanPrompt });
    }

    // Sanitize generated response before presenting
    return sanitizeHTML(rawText);
  } catch (err) {
    console.warn('Gemini API fetch error or timeout. Utilizing offline heuristic fallback.', err.message);
    return generateHeuristicAdvisory({ ...context, userQuery: cleanPrompt });
  }
}
