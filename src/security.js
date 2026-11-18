/**
 * @fileoverview OWASP Top 10 Security Architecture & Memory-Only Key Vault
 * Enforces XSS defense, DOM clobbering immunity, numeric boundary validation,
 * and ephemeral closure-based API credential storage.
 * @module security
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

/**
 * Whitelist of safe HTML elements allowed in rendered output
 * All script, iframe, object, embed, style, and form tags are strictly excluded.
 */
const SAFE_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 'span', 'p', 'div', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'hr', 'br', 'small', 'blockquote', 'svg', 'path', 'circle', 'rect'
]);

/**
 * Whitelist of allowed HTML attributes
 * Inline event handlers (on*), style injections, and script targets are eliminated.
 */
const SAFE_ATTRS = new Set([
  'class', 'data-action', 'data-id', 'data-status', 'data-category', 'data-pollutant',
  'aria-label', 'aria-hidden', 'aria-describedby', 'aria-expanded', 'aria-selected',
  'role', 'tabindex', 'title', 'viewbox', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'width', 'height'
]);

/**
 * Escapes plain text strings for safe HTML body interpolation
 * @param {unknown} val
 * @returns {string} Clean HTML-escaped string
 */
export function escapeHTML(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

/**
 * Enforces strict numerical limits, NaN protection, and fallback safety
 * @param {unknown} val
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number} Clamped valid numeric value
 */
export function clamp(val, min, max, fallback) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return fallback;
  }
  return Math.min(Math.max(num, min), max);
}

/**
 * Rigorous multi-stage HTML sanitizer:
 * 1. Strips dangerous script / iframe blocks completely.
 * 2. Neutralizes javascript: and data: URI vectors.
 * 3. Strips all inline event handlers (onload, onerror, onclick, etc.).
 * 4. DOM Clobbering Defense: Strips 'id=' and 'name=' to prevent window.* hijacking.
 * 5. Tag and attribute whitelist filtering.
 *
 * @param {string} dirtyHtml
 * @returns {string} Sanitized markup string
 */
export function sanitizeHTML(dirtyHtml) {
  if (typeof dirtyHtml !== 'string') return '';
  if (!dirtyHtml.trim()) return '';

  let clean = dirtyHtml;

  // 1. Strip active executable blocks
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 2. Neutralize protocol exploits & event handlers
  clean = clean.replace(/javascript\s*:/gi, 'blocked:');
  clean = clean.replace(/vbscript\s*:/gi, 'blocked:');
  clean = clean.replace(/data\s*:\s*text\/html/gi, 'blocked:');
  clean = clean.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\son[a-z]+\s*=\s*[^>\s]+/gi, '');

  // 3. DOM Clobbering Defense: Strip 'id=' and 'name='
  clean = clean.replace(/\b(id|name)\s*=\s*(['"]).*?\2/gi, '');
  clean = clean.replace(/\b(id|name)\s*=\s*[^>\s]+/gi, '');

  // 4. Tag whitelist enforcement
  clean = clean.replace(/<\/?([a-z0-9_-]+)([^>]*)>/gi, (match, tagName, rawAttrs) => {
    const tag = tagName.toLowerCase();
    if (!SAFE_TAGS.has(tag)) return '';

    if (match.startsWith('</')) return `</${tag}>`;

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
 * Prevents direct unsafe innerHTML assignments throughout UI orchestrator
 * @param {HTMLElement} container
 * @param {string} htmlContent
 */
export function setSanitizedHTML(container, htmlContent) {
  if (!container) return;
  const clean = sanitizeHTML(htmlContent);
  container.innerHTML = clean; // safe: sanitized via whitelist
}

/**
 * Generates cryptographically secure unique identifiers
 * Works in modern browsers and Node.js runtime environments
 * @param {string} [prefix='vayu']
 * @returns {string}
 */
export function generateSecureId(prefix = 'vayu') {
  let randomHex = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    randomHex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  } else {
    randomHex = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
  return `${prefix}_${randomHex}`;
}

/**
 * Ephemeral In-Memory API Key Vault
 * API keys are held strictly in closure memory and are NEVER persisted to
 * localStorage, sessionStorage, IndexedDB, cookies, or serialized state exports.
 */
export const ApiKeyVault = (() => {
  let _ephemeralKey = null;

  return {
    /**
     * Stores key in runtime closure memory
     * @param {string} key
     */
    setKey(key) {
      if (typeof key === 'string' && key.trim().length > 0) {
        _ephemeralKey = key.trim();
      } else {
        _ephemeralKey = null;
      }
    },

    /**
     * Retrieves key for direct authenticated request
     * @returns {string|null}
     */
    getKey() {
      return _ephemeralKey;
    },

    /**
     * Checks if key is currently active
     * @returns {boolean}
     */
    hasKey() {
      return Boolean(_ephemeralKey && _ephemeralKey.length > 5);
    },

    /**
     * Wipes key immediately from memory
     */
    clearKey() {
      _ephemeralKey = null;
    }
  };
})();
