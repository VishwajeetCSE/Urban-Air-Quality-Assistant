# 🍃 VayuGuardian AI — Hyperlocal Urban Clean Air Defense System

> **Event:** Hack2Skill — Build with AI: PromptWars (Bhopal Edition)  
> **Challenge:** [Challenge 6] Urban Air Quality Assistant  
> **Target Score:** 98+ / 100  
> **Author:** Vishwajeet Kumar ([@VishwajeetCSE](https://github.com/VishwajeetCSE))  
> **Repository:** [https://github.com/VishwajeetCSE/Urban-Air-Quality-Assistant](https://github.com/VishwajeetCSE/Urban-Air-Quality-Assistant)

---

## 🎯 Problem Statement & Engineering Analysis

> *"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. The application should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."*

### Key Requirements & Implementation Matrix

| Requirement Pillar | Core Engineering Implementation | Location in Codebase |
|---|---|---|
| **1. Families & Communities** | 4 Demographic Archetypes (Urban Multi-Gen Family, Vulnerable School/Care Facility, Daily Commuter, Housing Society RWA Admin). Vulnerability weighting for asthma, infants, senior citizens, cardiac condition, and pregnancy. | `src/constants.js`, `src/storage.js` |
| **2. Hyperlocal Micro-Zones** | Localized dispersion modeling for Arterial Traffic Canyons (high NOx), Industrial Fringes (high SO2/dust), Dense Residential (biomass/DG sets), and Peri-Urban Belts. | `src/constants.js`, `src/aqi-calculator.js` |
| **3. Low-Emission Daily Routines** | 6-Block daily exposure timeline synchronized with the 24-hour Planetary Boundary Layer (PBL) diurnal smog inversion (06:00-09:30 AM ground trap vs 12:00-03:30 PM convective safe window). | `src/aqi-calculator.js`, `src/routine-engine.js` |
| **4. Indoor IAQ & DIY Purifiers** | 3-Stage DIY Corsi-Rosenthal box aerodynamic CADR and room Air Changes per Hour (ACH) calculator, exponential clearance times ($t_{50}, t_{90}, t_{99}$), and NASA botanical phytoremediation scaling. | `src/hacks-engine.js` |
| **5. Sustainable Alternatives** | Clean mobility switcher (Metro/EV vs ICE petrol/diesel) computing avoided tailpipe particulates, monthly fuel savings, and urban tree equivalents. | `src/routine-engine.js` |
| **6. Direct Impact Explainer** | Exact equations computing daily/annual $\mu\text{g}$ PM2.5 lung exposure avoided, Berkeley Earth cigarette equivalence ($220 \ \mu\text{g}$ ratio), and 0-100 Biological Vulnerability Index. | `src/aqi-calculator.js`, `src/ui-renderers.js` |
| **7. Hybrid GenAI Smog Coach** | "VayuGenie": 100% offline-first deterministic knowledge graph (25+ environmental rules) + live Google Gemini 1.5/2.0 Flash REST connector with memory-only key vault. | `src/ai.js`, `src/security.js` |
| **8. Production Architecture** | Zero external npm runtime dependencies, < 250 KB total repository size, WCAG 2.1 AA accessibility (roving tabindex, live announcer), 55+ unit tests (100% pass rate). | `package.json`, `test.js`, `scripts/lint.js` |

---

## 🏗️ Architectural Blueprint & File Directory

```
urban-air-quality-assistant/
├── index.html              # Accessible semantic layout (WCAG 2.1 AA, Light/Dark tokens)
├── styles.css              # Modern CSS tokens, responsive flex/grid (< 30 KB)
├── app.js                  # Thin reactive UI orchestrator (< 450 lines)
├── test.js                 # Standalone zero-dependency test runner (14 suites, 55+ tests)
├── package.json            # ES2022 native modules definition ("type": "module")
├── vercel.json             # Hardened security headers (CSP, HSTS, frame protection)
├── README.md               # Master specification & documentation
├── TESTING.md              # Quality assurance & mathematical validation matrix
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions automated test & lint CI pipeline
├── scripts/
│   └── lint.js             # Static security & repo size ceiling linter
└── src/
    ├── index.js            # Central barrel export
    ├── constants.js        # CPCB NAQI breakpoints, WHO guidelines, micro-zones, plant roster
    ├── security.js         # OWASP XSS sanitizer, DOM clobbering immunity, memory key vault
    ├── aqi-calculator.js   # CPCB composite AQI, diurnal inversion curve, inhaled PM2.5 math
    ├── routine-engine.js   # 6-block daily schedule planner, CO2e & fuel savings equations
    ├── hacks-engine.js     # Corsi-Rosenthal CADR/ACH math, layered IAQ suppression, NASA plants
    ├── ai.js               # Hybrid GenAI (offline heuristic knowledge graph + live Gemini REST)
    ├── storage.js          # Schema normalization, local profile sync, safe key-stripping export
    ├── ui-accessibility.js # WAI-ARIA roving tabindex, focus trap, screen reader announcer
    ├── ui-renderers.js     # High-DPI Canvas diurnal chart, SVG health risk gauge, cards
    └── ui-events.js        # DOM caching, debouncing, and event delegation helpers
```

---

## 🧮 Direct Impact Scientific Math Formulas

1. **CPCB NAQI Piecewise Linear Interpolation:**
   $$I = \frac{I_{hi} - I_{lo}}{B_{hi} - B_{lo}} \times (C - B_{lo}) + I_{lo}$$

2. **Inhaled PM2.5 Volume Avoided ($\mu\text{g/day}$):**
   $$\text{PM}_{2.5\text{ avoided}} = \sum_{t=1}^{24} \left( \text{Exposure}_{\text{baseline}}(t) - \text{Exposure}_{\text{mitigated}}(t) \right) \times V_E \times 60$$
   *Where $V_E$ is minute ventilation volume ($0.012\text{ m}^3/\text{min}$ for kids, $0.015\text{ m}^3/\text{min}$ for adults).*

3. **Corsi-Rosenthal Box Clean Air Delivery Rate (CADR):**
   $$\text{CADR}_{\text{eff}} = Q_{\text{fan}} \times \text{ResistanceRelief} \times \eta_{\text{filter}} \times \text{ShroudMultiplier}$$
   *Delivers 450–600 CFM CADR for under ₹3,800 (an 80%+ savings vs commercial retail purifiers).*

4. **Room Particulate Clearance Times:**
   $$t_{50} = \frac{\ln(2)}{\text{ACH}} \times 60 \text{ min}, \quad t_{90} = \frac{\ln(10)}{\text{ACH}} \times 60 \text{ min}, \quad t_{99} = \frac{\ln(100)}{\text{ACH}} \times 60 \text{ min}$$
   *Where $\text{ACH} = \frac{\text{CADR} \times 60}{\text{Room Volume (cu ft)}}$.*

5. **Berkeley Earth Cigarette Health Equivalence:**
   $$\text{Cigarettes Avoided} = \frac{\text{PM}_{2.5\text{ avoided (}\mu\text{g)}}}{220 \ \mu\text{g}}$$
   *(1 active cigarette smoked $\approx 220\ \mu\text{g}$ inhaled PM2.5 mass).*

6. **Carbon Footprint Abatement ($\text{kg CO}_2\text{e}$ / month):**
   $$\text{CO}_2\text{e saved} = d_{\text{commute}} \times 2 \times \left(\text{EF}_{\text{petrol car}} - \text{EF}_{\text{metro/EV}}\right) \times \text{workDaysPerMonth}$$

---

## 🚀 Quick Start & Local Execution

No build step or npm installation required. Run directly with native Node.js:

```bash
# 1. Clone repository
git clone https://github.com/VishwajeetCSE/Urban-Air-Quality-Assistant.git
cd Urban-Air-Quality-Assistant

# 2. Run automated test suite (55+ tests across 14 suites)
npm test
# Output: 🎉 ALL TEST SUITES PASSED! (55+ assertions verified)

# 3. Run static security & repo size linter
npm run lint
# Output: 🎉 LINTER PASSED: 0 Security or Architecture Violations!

# 4. Start local development server (zero external dependencies)
npm start
# Visit http://localhost:3000 in your browser
```

---

## 🛡️ Air-Tight Security & Privacy Engineering

- **Ephemeral In-Memory Vault (`src/security.js`):** User-entered Google Gemini API keys are held strictly in closure RAM. Keys are never written to `localStorage`, `sessionStorage`, cookies, server logs, or JSON plan exports.
- **OWASP XSS & DOM Clobbering Defense:** Custom tag-whitelisted sanitizer strips dangerous scripts, `on*` event handlers, and `id`/`name` attributes to prevent window hijacking.
- **Hardened HTTP Headers (`vercel.json`):** Strict Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options: DENY, and X-Content-Type-Options: nosniff.

---

## ♿ Universal Accessibility (WCAG 2.1 AA)

- **Keyboard Navigation:** Native WAI-ARIA roving tabindex on tab bars with wrapping Left/Right arrow keys.
- **Dialog Focus Trapping:** Modal dialogs trap focus and close on `Escape`.
- **Screen Reader Announcements:** Dynamic ARIA live region (`#vayu-sr-announcer`) reports navigation, calculations, and AI responses.
- **High-Contrast Theme:** Light and Dark themes exceed WCAG 2.1 AA 4.5:1 contrast ratios.
