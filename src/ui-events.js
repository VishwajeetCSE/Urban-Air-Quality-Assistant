/**
 * @fileoverview DOM Element Caching, Debouncing, Event Delegation, and Listener Helpers
 * @module ui-events
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

/**
 * Fast DOM query selector helper
 * @param {string} selector
 * @param {Element|Document} [scope=document]
 * @returns {HTMLElement|null}
 */
export const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Fast DOM query selector all helper
 * @param {string} selector
 * @param {Element|Document} [scope=document]
 * @returns {HTMLElement[]}
 */
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/**
 * High-performance debounce utility to avoid layout thrashing on fast inputs
 * @param {Function} fn
 * @param {number} [delay=200]
 * @returns {Function}
 */
export function debounce(fn, delay = 200) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

/**
 * Event delegation helper on root container
 * @param {Element|Document} root
 * @param {string} eventType
 * @param {string} selector
 * @param {Function} handler
 */
export function on(root, eventType, selector, handler) {
  if (!root) return;
  root.addEventListener(eventType, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) {
      handler(e, target);
    }
  });
}

/**
 * DOM Element Cache Map for high-frequency access
 */
const _elementCache = new Map();

/**
 * Get or cache a DOM element by selector
 * @param {string} selector
 * @returns {HTMLElement|null}
 */
export function getCachedElement(selector) {
  if (!_elementCache.has(selector)) {
    const el = $(selector);
    if (el) _elementCache.set(selector, el);
    return el;
  }
  return _elementCache.get(selector);
}

/**
 * Clear cached element references
 */
export function clearElementCache() {
  _elementCache.clear();
}
