/**
 * @fileoverview WAI-ARIA Universal Accessibility Utilities (WCAG 2.1 AA Compliant)
 * Roving tabindex, focus trapping, live screen reader announcements, and disclosure controllers
 * @module ui-accessibility
 * @author Vishwajeet Kumar
 * @license MIT
 */

/**
 * Initializes WAI-ARIA roving tabindex for a collection of interactive elements
 * Supports Left/Right and Up/Down arrow key navigation with wrapping
 * @param {HTMLElement|string} container - Element or CSS selector
 * @param {string} itemSelector - CSS selector for focusable items
 */
export function initRovingTabindex(container, itemSelector) {
  const root = typeof container === 'string' ? document.querySelector(container) : container;
  if (!root) return;

  const getItems = () => Array.from(root.querySelectorAll(itemSelector));
  const items = getItems();
  if (items.length === 0) return;

  // Initialize: first item is 0, rest are -1
  items.forEach((item, idx) => {
    item.setAttribute('tabindex', idx === 0 ? '0' : '-1');
    if (!item.hasAttribute('role')) {
      item.setAttribute('role', 'tab');
    }
  });

  root.addEventListener('keydown', (e) => {
    const currentItems = getItems();
    const currentIndex = currentItems.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % currentItems.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = currentItems.length - 1;
    } else {
      return;
    }

    currentItems[currentIndex].setAttribute('tabindex', '-1');
    const targetItem = currentItems[targetIndex];
    targetItem.setAttribute('tabindex', '0');
    targetItem.focus();
  });
}

/**
 * Traps keyboard focus inside a modal dialog element
 * @param {HTMLElement} modalEl
 * @returns {() => void} Cleanup function to release focus trap
 */
export function trapFocus(modalEl) {
  if (!modalEl) return () => {};

  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    const focusables = Array.from(modalEl.querySelectorAll(focusableSelector));
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || !modalEl.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !modalEl.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  modalEl.addEventListener('keydown', handleKeyDown);

  // Focus the first focusable element inside the modal
  const initialFocus = modalEl.querySelector(focusableSelector);
  if (initialFocus) {
    setTimeout(() => initialFocus.focus(), 50);
  }

  return () => {
    modalEl.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announces dynamic status changes to assistive screen reader software
 * @param {string} message
 * @param {'polite'|'assertive'} [priority='polite']
 */
export function announce(message, priority = 'polite') {
  if (typeof document === 'undefined') return;

  let liveRegion = document.getElementById('aero-sr-announcer');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aero-sr-announcer';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  } else {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Clear and update with short timeout to trigger announcement
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

/**
 * Connects an accessible ARIA disclosure button to an expandable container
 * @param {HTMLButtonElement} triggerBtn
 * @param {HTMLElement} contentEl
 */
export function initDisclosureController(triggerBtn, contentEl) {
  if (!triggerBtn || !contentEl) return;

  const contentId = contentEl.id || `disclosure_${Math.random().toString(36).substr(2, 8)}`;
  contentEl.id = contentId;
  triggerBtn.setAttribute('aria-controls', contentId);
  triggerBtn.setAttribute('aria-expanded', String(!contentEl.hidden));

  triggerBtn.addEventListener('click', () => {
    const isExpanded = triggerBtn.getAttribute('aria-expanded') === 'true';
    triggerBtn.setAttribute('aria-expanded', String(!isExpanded));
    contentEl.hidden = isExpanded;
    announce(`${triggerBtn.textContent} ${!isExpanded ? 'expanded' : 'collapsed'}`);
  });
}

/**
 * Initializes skip-link functionality for keyboard-only users
 */
export function initSkipLink() {
  const skipLink = document.querySelector('.skip-to-content');
  if (!skipLink) return;

  skipLink.addEventListener('click', (e) => {
    const targetId = skipLink.getAttribute('href');
    if (!targetId || !targetId.startsWith('#')) return;

    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.setAttribute('tabindex', '-1');
      targetEl.focus();
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  });
}
