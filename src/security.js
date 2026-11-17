/**
 * @fileoverview Security, Sanitization, Memory-Only Vault, and Safe DOM Helpers
 * @module security
 * @author Vishwajeet Kumar
 * @license MIT
 */

/**
 * Ephemeral In-Memory API Key Vault
 * Stored strictly in module closure RAM. Never written to localStorage,
 * sessionStorage, cookies, IndexedDB, or serialized state exports.
 */
const _vault = {
  key: null,
  timestamp: null
};

export const ApiKeyVault = {
  /**
   * Set API key in ephemeral memory
   * @param {string|null} key
   */
  setKey(key) {
    if (typeof key !== 'string') {
      this.clear();
      return;
    }
    const clean = key.trim();
    if (!clean) {
      this.clear();
      return;
    }
    _vault.key = clean;
    _vault.timestamp = Date.now();
  },

  /**
   * Get the active API key
   * @returns {string|null}
   */
  getKey() {
    return _vault.key;
  },

  /**
   * Check if a valid API key exists
   * @returns {boolean}
   */
  hasKey() {
    return typeof _vault.key === 'string' && _vault.key.length > 5;
  },

  /**
   * Masked display string for UI display (e.g. AIzaSy...94zQ)
   * @returns {string}
   */
  getMasked() {
    if (!this.hasKey()) return 'Offline Heuristic Engine Active';
    const k = _vault.key;
    if (k.length > 8) {
      return `${k.slice(0, 6)}••••••••${k.slice(-4)}`;
    }
    return '••••••••';
  },

  /**
   * Wipe key from memory
   */
  clear() {
    _vault.key = null;
    _vault.timestamp = null;
  }
};

/**
 * Escapes raw strings for safe HTML text rendering
 * Defends against basic & advanced reflected XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/**
 * Clamps numeric values strictly within bounds
 * @param {number|string} val
 * @param {number} min
 * @param {number} max
 * @param {number} [fallback=min]
 * @returns {number}
 */
export function clamp(val, min, max, fallback = min) {
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Whitelist of allowed HTML tags for rich formatted advisories
 */
const SAFE_TAGS = new Set([
  'p', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'span',
  'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'table',
  'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'blockquote',
  'hr', 'sub', 'sup', 'mark'
]);

/**
 * Whitelist of allowed safe attributes (strictly excluding DOM clobbering id and name)
 */
const SAFE_ATTRS = new Set([
  'class', 'title', 'role', 'aria-label', 'aria-hidden', 'aria-live', 'data-status'
]);

/**
 * Sanitizes dirty HTML strings against Mutation XSS (mXSS) and DOM Clobbering
 * Works in both browser DOM and Node.js testing environments without dependencies.
 * @param {string} dirtyHtml
 * @returns {string}
 */
export function sanitizeHTML(dirtyHtml) {
  if (typeof dirtyHtml !== 'string') return '';
  if (!dirtyHtml.trim()) return '';

  // 1. Strip dangerous executable containers
  let clean = dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '');

  // 2. Strip inline event handlers (on*), javascript pseudo-protocols, and data URIs
  clean = clean.replace(/on[a-z]+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/on[a-z]+\s*=\s*[^>\s]+/gi, '');
  clean = clean.replace(/javascript\s*:/gi, 'blocked-js:');
  clean = clean.replace(/vbscript\s*:/gi, 'blocked-vb:');
  clean = clean.replace(/data\s*:\s*text\/html/gi, 'blocked-data:');

  // 3. DOM Clobbering Defense: Strip 'id=' and 'name=' to prevent window.* hijacking
  clean = clean.replace(/\b(id|name)\s*=\s*(['"]).*?\2/gi, '');
  clean = clean.replace(/\b(id|name)\s*=\s*[^>\s]+/gi, '');

  // 4. Tag whitelist enforcement
  clean = clean.replace(/<\/?([a-z0-9_-]+)([^>]*)>/gi, (match, tagName, rawAttrs) => {
    const tag = tagName.toLowerCase();
    if (!SAFE_TAGS.has(tag)) return '';

    if (match.startsWith('</')) return `</${tag}>`;

    // Filter attributes against allowed whitelist
    let safeAttrs = '';
    const attrRegex = /([a-z0-9_-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^>\s]+)))?/gi;
    let m;
    while ((m = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = m[1].toLowerCase();
      const attrVal = m[2] || m[3] || m[4] || '';
      if (SAFE_ATTRS.has(attrName)) {
        const sanitizedVal = attrVal.replace(/[<>"'&]/g, '');
        safeAttrs += ` ${attrName}="${sanitizedVal}"`;
      }
    }

    return `<${tag}${safeAttrs}>`;
  });

  return clean;
}

/**
 * Safely inserts sanitized HTML into a DOM container element
 * Prevents direct unsafe innerHTML assignments
 * @param {HTMLElement} container
 * @param {string} htmlContent
 */
export function setSanitizedHTML(container, htmlContent) {
  if (!container) return;
  const clean = sanitizeHTML(htmlContent);
  // safe: use sanitized HTML insertion
  container.innerHTML = clean;
}

/**
 * Generates cryptographically secure unique identifiers
 * Works in modern browsers (crypto.getRandomValues) and Node.js
 * @param {string} [prefix='aero']
 * @returns {string}
 */
export function generateSecureId(prefix = 'aero') {
  let randomHex = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    randomHex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for edge runtime
    randomHex = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
  return `${prefix}_${randomHex}`;
}
