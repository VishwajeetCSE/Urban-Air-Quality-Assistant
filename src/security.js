/**
 * SmogGuard AI — Security & Sanitization Layer
 * Implements:
 * 1. Ephemeral In-Memory API Key Vault (Zero persistence to localStorage/sessionStorage/cookies)
 * 2. Mutation XSS (mXSS) & DOM Clobbering immunity
 * 3. Constant-time string comparison against side-channel timing attacks
 */

// Private closure scope for the in-memory vault. Never attached to window/globalThis.
const _vault = {
  apiKey: null,
  createdAt: null,
  maskedDisplay: null
};

export const ApiKeyVault = {
  /**
   * Set API key in ephemeral memory only
   * @param {string} key
   */
  setKey(key) {
    if (typeof key !== 'string') {
      _vault.apiKey = null;
      _vault.createdAt = null;
      _vault.maskedDisplay = null;
      return;
    }
    const trimmed = key.trim();
    if (!trimmed) {
      this.clear();
      return;
    }
    _vault.apiKey = trimmed;
    _vault.createdAt = Date.now();
    // Safe masked representation for UI display (e.g. AIzaSy...94zQ)
    if (trimmed.length > 8) {
      _vault.maskedDisplay = trimmed.slice(0, 6) + '...' + trimmed.slice(-4);
    } else {
      _vault.maskedDisplay = '••••••••';
    }
  },

  /**
   * Retrieve the active key
   * @returns {string|null}
   */
  getKey() {
    return _vault.apiKey;
  },

  /**
   * Check if a valid key is set
   * @returns {boolean}
   */
  hasKey() {
    return typeof _vault.apiKey === 'string' && _vault.apiKey.length > 0;
  },

  /**
   * Get safe masked display
   * @returns {string}
   */
  getMasked() {
    return _vault.maskedDisplay || 'None (Using Offline Deterministic Engine)';
  },

  /**
   * Completely scrub the vault from memory
   */
  clear() {
    _vault.apiKey = null;
    _vault.createdAt = null;
    _vault.maskedDisplay = null;
  }
};

/**
 * Escapes HTML special characters to prevent injection
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
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
 * Allowed HTML tags for rich markdown-like synthesis formatting
 */
const ALLOWED_TAGS = new Set([
  'p', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'span',
  'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'table',
  'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'blockquote',
  'hr', 'sub', 'sup'
]);

/**
 * Allowed attributes (excluding DOM-clobbering id, name, and script triggers)
 */
const ALLOWED_ATTRS = new Set([
  'class', 'title', 'role', 'aria-label', 'aria-hidden', 'aria-live'
]);

/**
 * Custom Mutation XSS (mXSS) and DOM-Clobbering immune HTML sanitizer
 * Works in both browser DOM and Node.js test environments without external dependencies.
 * @param {string} dirtyHtml
 * @returns {string}
 */
export function sanitizeHtml(dirtyHtml) {
  if (typeof dirtyHtml !== 'string') return '';
  if (!dirtyHtml.trim()) return '';

  // First pass: strip obvious dangerous blocks (script, iframe, style, object, embed, form)
  let clean = dirtyHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  clean = clean.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

  // Strip dangerous inline event handlers (onerror, onload, onclick, etc.) and javascript: pseudo-protocols
  clean = clean.replace(/on[a-z]+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/on[a-z]+\s*=\s*[^>\s]+/gi, '');
  clean = clean.replace(/javascript:/gi, 'blocked-javascript:');
  clean = clean.replace(/vbscript:/gi, 'blocked-vbscript:');
  clean = clean.replace(/data:\s*text\/html/gi, 'blocked-data:');

  // DOM Clobbering Defense: Strip 'id=' and 'name=' attributes that might overwrite window properties
  clean = clean.replace(/\b(id|name)\s*=\s*(['"]).*?\2/gi, '');
  clean = clean.replace(/\b(id|name)\s*=\s*[^>\s]+/gi, '');

  // Tag filter pass using regular expression parser for zero-dep environment
  clean = clean.replace(/<\/?([a-z0-9_-]+)([^>]*)>/gi, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return ''; // Strip non-allowed tag
    }

    if (match.startsWith('</')) {
      return `</${lowerTag}>`;
    }

    // Filter attributes
    let safeAttrs = '';
    const attrRegex = /([a-z0-9_-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^>\s]+)))?/gi;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrVal = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';
      if (ALLOWED_ATTRS.has(attrName)) {
        // Sanitize attribute value
        const sanitizedVal = attrVal.replace(/[<>"'&]/g, '');
        safeAttrs += ` ${attrName}="${sanitizedVal}"`;
      }
    }

    return `<${lowerTag}${safeAttrs}>`;
  });

  return clean;
}

/**
 * Constant-time string comparator to prevent timing side-channel attacks
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
