/**
 * @fileoverview Storage Management, Schema Normalization, Sanitization, and Key-Safe Import/Export
 * @module storage
 * @author Vishwajeet Kumar
 * @license MIT
 */

import { clamp, escapeHTML } from './security.js';
import { ARCHETYPES, HOTSPOT_CITIES, COMMUTE_MODES } from './constants.js';

const STORAGE_KEY = 'aeroshield_user_profile_v1';

/**
 * Validates and normalizes user profile inputs to prevent prototype pollution or invalid states
 * @param {object} raw
 * @returns {object} Clean normalized profile
 */
export function normalizeProfile(raw = {}) {
  if (typeof raw !== 'object' || raw === null) {
    raw = {};
  }

  const archetypeKey = ARCHETYPES[raw.archetypeKey] ? raw.archetypeKey : 'apartment_family';
  const cityKey = HOTSPOT_CITIES[raw.cityKey] ? raw.cityKey : 'delhi';
  const commuteMode = COMMUTE_MODES[raw.commuteMode] ? raw.commuteMode : 'metro';
  const currentAQI = clamp(raw.currentAQI, 20, 500, HOTSPOT_CITIES[cityKey].baseAQI);

  // Validate vulnerabilities array against known factors
  const validVulns = new Set(['asthma', 'infants', 'seniors', 'pregnant']);
  const vulnerabilities = Array.isArray(raw.vulnerabilities)
    ? raw.vulnerabilities.filter(v => typeof v === 'string' && validVulns.has(v))
    : [];

  // Validate active hacks array
  const validHacks = new Set(['corsi_rosenthal', 'window_sealing', 'wet_mopping', 'kitchen_exhaust', 'phytoremediation', 'incense_ban']);
  const activeHacks = Array.isArray(raw.activeHacks)
    ? raw.activeHacks.filter(h => typeof h === 'string' && validHacks.has(h))
    : ['corsi_rosenthal', 'wet_mopping', 'incense_ban'];

  const commuteDistanceKm = clamp(raw.commuteDistanceKm, 1, 100, 15);
  const workDaysPerMonth = clamp(raw.workDaysPerMonth, 1, 31, 22);

  return {
    archetypeKey,
    cityKey,
    commuteMode,
    currentAQI,
    vulnerabilities,
    activeHacks,
    commuteDistanceKm,
    workDaysPerMonth,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Exports user plan and calculation state as clean, formatted JSON.
 * Strictly strips any API keys, credentials, or transient session IDs.
 * @param {object} appState
 * @returns {string} Clean JSON string
 */
export function exportPlanAsJSON(appState = {}) {
  const normalized = normalizeProfile(appState.profile || {});

  const exportPayload = {
    app: 'AeroShield AI — Urban Air Quality Assistant',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profile: normalized,
    calculations: {
      healthRiskScore: appState.healthRiskScore || null,
      dailyInhaledAvoidedUg: appState.dailyInhaledAvoidedUg || null,
      monthlyCo2eSavedKg: appState.monthlyCo2eSavedKg || null
    },
    communityActionsSelected: Array.isArray(appState.communityActions) ? appState.communityActions : []
  };

  // Explicit safety assertion: ensure no API key property exists in JSON payload
  const jsonStr = JSON.stringify(exportPayload, (k, value) => {
    if (/(api[_-]?key|secret|token|credential|password|auth[_-]?header)/i.test(k)) {
      return undefined; // Filter out sensitive fields
    }
    return value;
  }, 2);

  return jsonStr;
}

/**
 * Safely parses and imports an AeroShield plan from JSON string
 * Defends against prototype pollution and malformed payloads
 * @param {string} jsonString
 * @returns {{ success: boolean, profile?: object, error?: string }}
 */
export function importPlanFromJSON(jsonString) {
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    return { success: false, error: 'Empty JSON input.' };
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid plan object.' };
    }

    // Scrub prototype injection attempts
    const sanitizedObj = JSON.parse(JSON.stringify(parsed, (k, v) => (k === '__proto__' || k === 'constructor' ? undefined : v)));

    const rawProfile = sanitizedObj.profile || sanitizedObj;
    const cleanProfile = normalizeProfile(rawProfile);

    return {
      success: true,
      profile: cleanProfile
    };
  } catch (err) {
    return {
      success: false,
      error: `JSON parse error: ${escapeHTML(err.message)}`
    };
  }
}

/**
 * Persists profile to localStorage (never storing API keys)
 * @param {object} profile
 * @returns {boolean}
 */
export function saveProfileToStorage(profile) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const clean = normalizeProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch (e) {
    console.warn('Failed to save profile to localStorage:', e);
    return false;
  }
}

/**
 * Loads saved profile from localStorage
 * @returns {object} Normalized profile with defaults
 */
export function loadProfileFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return normalizeProfile({});
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeProfile({});
    const parsed = JSON.parse(raw);
    return normalizeProfile(parsed);
  } catch (e) {
    return normalizeProfile({});
  }
}
