/**
 * @fileoverview Universal Accessibility (WCAG 2.1 AA) Controllers & ARIA Roving Tabindex
 * @module ui-accessibility
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

/**
 * Implements WAI-ARIA Roving Tabindex pattern for keyboard tab navigation
 * Supports Left/Right/Home/End keyboard arrows with infinite wrapping.
 *
 * @param {string} containerSelector
 * @param {string} itemSelector
 */
export function initRovingTabindex(containerSelector, itemSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const items = Array.from(container.querySelectorAll(itemSelector));
  if (items.length === 0) return;

  // Ensure only active tab has tabindex=0; all others have -1
  let currentIndex = items.findIndex(el => el.classList.contains('active') || el.getAttribute('aria-selected') === 'true');
  if (currentIndex === -1) currentIndex = 0;

  items.forEach((item, idx) => {
    item.setAttribute('tabindex', idx === currentIndex ? '0' : '-1');
  });

  container.addEventListener('keydown', (e) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      items[currentIndex].setAttribute('tabindex', '-1');
      items[newIndex].setAttribute('tabindex', '0');
      items[newIndex].focus();
      items[newIndex].click();
      currentIndex = newIndex;
    }
  });
}

/**
 * Traps keyboard focus within an active dialog modal
 * @param {HTMLElement} modalEl
 * @returns {() => void} Cleanup function to restore focus and remove listener
 */
export function trapFocus(modalEl) {
  if (!modalEl) return () => {};

  const focusableElements = Array.from(
    modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  );

  const firstEl = focusableElements[0];
  const lastEl = focusableElements[focusableElements.length - 1];

  const prevActive = document.activeElement;
  if (firstEl) firstEl.focus();

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    } else if (e.key === 'Escape') {
      const closeBtn = modalEl.querySelector('[data-action="close-modal"]');
      if (closeBtn) closeBtn.click();
    }
  }

  modalEl.addEventListener('keydown', handleKeyDown);

  return function cleanup() {
    modalEl.removeEventListener('keydown', handleKeyDown);
    if (prevActive && typeof prevActive.focus === 'function') {
      prevActive.focus();
    }
  };
}

/**
 * Announces dynamic status messages to assistive screen readers via ARIA live region
 * @param {string} message
 * @param {'polite'|'assertive'} [priority='polite']
 */
export function announce(message, priority = 'polite') {
  if (!message || typeof document === 'undefined') return;

  let announcer = document.getElementById('vayu-sr-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'vayu-sr-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  } else {
    announcer.setAttribute('aria-live', priority);
  }

  // Clear and update with micro-tick to guarantee screen reader re-triggering
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 50);
}

/**
 * Initializes Skip to Content keyboard navigation
 */
export function initSkipLink() {
  const skipLink = document.querySelector('.skip-to-content');
  const main = document.getElementById('main-content');
  if (skipLink && main) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      main.setAttribute('tabindex', '-1');
      main.focus();
    });
  }
}
