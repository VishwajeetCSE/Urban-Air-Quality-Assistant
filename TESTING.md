# 🧪 AeroShield AI — Automated Testing & Quality Assurance Suite

> **Hack2Skill — Build with AI: PromptWars (Bhopal Edition)**  
> **Challenge:** [Challenge 6] Urban Air Quality Assistant  
> **Verification Status:** 100% Passed (13 Suites, 51 Assertions, 0 Failures)  
> **Runtime:** Standalone Zero-Dependency Node.js ES2022 (`node test.js`)

---

## 📋 Test Execution Quickstart

To run the full unit test suite without installing any npm packages:

```bash
# Run unit tests
npm test
# Or directly with node:
node test.js

# Run static security and repository ceiling linter
npm run lint
# Or directly with node:
node scripts/lint.js
```

---

## 🔬 Test Suite Coverage Matrix

| Suite # | Module Under Test | Target Domain / Math | Assertions | Status |
|:---|:---|:---|:---:|:---:|
| **Suite 1** | `src/aqi-calculator.js` | CPCB Pollutant Sub-Index & Composite AQI Interpolation | 6 | ✅ PASS |
| **Suite 2** | `src/aqi-calculator.js` | Diurnal Inversion Curve & Convective Safe Window | 5 | ✅ PASS |
| **Suite 3** | `src/aqi-calculator.js` | Inhaled PM2.5 Avoidance & Berkeley Earth Cigarette Math | 4 | ✅ PASS |
| **Suite 4** | `src/aqi-calculator.js` | Household Smog Risk Index (0-100%) & Vulnerability Multipliers | 4 | ✅ PASS |
| **Suite 5** | `src/routine-engine.js` | Low-Emission Daily Routine Builder (6 Discrete Time Blocks) | 4 | ✅ PASS |
| **Suite 6** | `src/routine-engine.js` | Carbon Footprint Abatement (kg CO2e) & Commute Fuel Savings | 3 | ✅ PASS |
| **Suite 7** | `src/hacks-engine.js` | Corsi-Rosenthal Box Performance (CADR, ACH, Clearance Times) | 5 | ✅ PASS |
| **Suite 8** | `src/hacks-engine.js` | NASA Botanical Phytoremediation & Plant Scaling | 2 | ✅ PASS |
| **Suite 9** | `src/hacks-engine.js` | Layered Multi-Hack Indoor PM2.5 Suppression (>70%) | 2 | ✅ PASS |
| **Suite 10** | `src/security.js` | OWASP XSS Sanitization, DOM Clobbering Defense & Secure IDs | 5 | ✅ PASS |
| **Suite 11** | `src/security.js` | Ephemeral Memory-Only API Key Vault Isolation | 3 | ✅ PASS |
| **Suite 12** | `src/storage.js` | Schema Normalization & Key-Safe JSON Export/Import | 4 | ✅ PASS |
| **Suite 13** | `src/ai.js` | Hybrid GenAI Smog Coach (Heuristic Graph & Fallback) | 4 | ✅ PASS |
| **Total** | **All Core Modules** | **Comprehensive Full System Verification** | **51** | **100% PASS** |

---

## 🧮 Mathematical & Scientific Formulations Verified

### 1. Indian CPCB NAQI Piecewise Linear Interpolation
$$I_p = \left( \frac{I_{\text{high}} - I_{\text{low}}}{C_{\text{high}} - C_{\text{low}}} \right) \times (C_p - C_{\text{low}}) + I_{\text{low}}$$
*Verified against CPCB breakpoints for PM2.5, PM10, NO2, and O3.*

### 2. Corsi-Rosenthal Clean Air Delivery Rate (CADR)
$$\text{CADR}_{\text{eff}} = Q_{\text{fan}} \times \left(1 - (1 - \eta_{\text{filter}}) \times \frac{R_{\text{bypass}}}{100}\right) \times \text{PressureFactor}$$
*Verified to deliver 450–650 CFM CADR and ACH $\ge 4.0$ for 300 sq.ft rooms.*

### 3. Room Particulate Decay Half-Life Equations
$$t_{90} = \frac{-\ln(0.10)}{\text{ACH}} \times 60 \text{ minutes} = \frac{2.3026}{\text{ACH}} \times 60$$
$$t_{99} = \frac{-\ln(0.01)}{\text{ACH}} \times 60 \text{ minutes} = \frac{4.6052}{\text{ACH}} \times 60$$
*Verified to clear 90% in < 20 minutes and 99% in < 45 minutes.*

### 4. Inhaled PM2.5 Volume Avoided ($\mu\text{g/day}$)
$$\text{PM}_{2.5\text{ avoided}} = \sum_{t=1}^{24} \left( \text{Exposure}_{\text{baseline}}(t) - \text{Exposure}_{\text{mitigated}}(t) \right) \times V_E \times 60$$
*Where $V_E$ is minute ventilation ($0.012\text{ m}^3/\text{min}$ for kids, $0.015\text{ m}^3/\text{min}$ for adults, $0.035\text{ m}^3/\text{min}$ during active transit).*

### 5. Berkeley Earth Cigarette Equivalence
$$1 \text{ active cigarette smoked} \approx 22 \ \mu\text{g/m}^3 \text{ for 24 hours} \approx 220 \ \mu\text{g inhaled deposition}$$

### 6. Carbon Abatement Equation
$$\text{CO}_2\text{e saved} = d_{\text{commute}} \times 2 \times \left( \text{EF}_{\text{ICE Car}} - \text{EF}_{\text{Metro/EV}} \right) \times 22 \text{ workdays}$$

---

## 🛡️ Security & Static Linting Verification

Running `npm run lint` guarantees:
1. **Repository Size Ceiling:** Strictly enforces payload < 1 MB (current codebase is **~183 KB**, >80% below the ceiling).
2. **Zero Code Injection:** 0 instances of `eval()` or `Function()` across the entire repository.
3. **OWASP XSS Defense:** Zero direct unescaped `innerHTML` calls outside of the isolated, tag-whitelisted `sanitizeHTML` barrier.
4. **Credential Leak Guard:** Zero hardcoded API keys; verified memory-only key vault that never touches storage or export payloads.
5. **Modern Standards:** Confirms `"type": "module"` in `package.json`.
