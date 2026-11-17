/**
 * SmogGuard AI — LRU/TTL Cache & EventListenerRegistry
 * High performance, zero detached-DOM memory leaks, lightweight footprint.
 */

export class LRUCache {
  /**
   * @param {number} maxSize
   * @param {number} defaultTTL - in milliseconds (default 5 minutes)
   */
  constructor(maxSize = 100, defaultTTL = 300000) {
    this.maxSize = Math.max(1, maxSize);
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
  }

  /**
   * Get an item from the cache
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    if (!this.cache.has(key)) return null;

    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry.expiresAt && entry.expiresAt <= now) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  /**
   * Store an item in the cache
   * @param {string} key
   * @param {any} value
   * @param {number} [ttl] - Optional TTL override in ms
   */
  set(key, value, ttl) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const duration = typeof ttl === 'number' ? ttl : this.defaultTTL;
    const expiresAt = duration > 0 ? Date.now() + duration : null;

    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Check if a valid, unexpired key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific key
   * @param {string} key
   * @returns {boolean}
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove all expired entries
   * @returns {number} count of pruned entries
   */
  prune() {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Current active entries count
   */
  get size() {
    return this.cache.size;
  }
}

/**
 * Registry to prevent detached-DOM memory leaks in single-page applications
 */
export class EventListenerRegistry {
  constructor() {
    this.listeners = [];
  }

  /**
   * Register a listener
   * @param {EventTarget} target
   * @param {string} type
   * @param {Function} handler
   * @param {boolean|AddEventListenerOptions} [options]
   */
  add(target, type, handler, options = false) {
    if (!target || typeof target.addEventListener !== 'function') return;
    target.addEventListener(type, handler, options);
    this.listeners.push({ target, type, handler, options });
  }

  /**
   * Remove a specific listener
   * @param {EventTarget} target
   * @param {string} type
   * @param {Function} handler
   */
  remove(target, type, handler) {
    if (!target || typeof target.removeEventListener !== 'function') return;
    target.removeEventListener(type, handler);
    this.listeners = this.listeners.filter(
      l => !(l.target === target && l.type === type && l.handler === handler)
    );
  }

  /**
   * Remove all listeners tracked by this registry
   */
  removeAll() {
    for (const { target, type, handler, options } of this.listeners) {
      if (target && typeof target.removeEventListener === 'function') {
        target.removeEventListener(type, handler, options);
      }
    }
    this.listeners = [];
  }

  /**
   * Number of active registered listeners
   */
  get count() {
    return this.listeners.length;
  }
}
