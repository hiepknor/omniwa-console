import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Non-modal drawer a11y: initial focus on the close control, Escape to close
 *  (suppressed while a nested dialog is open), and focus restore to the
 *  element that had focus when the drawer opened. No focus trap — drawers are
 *  deliberately non-modal (DESIGN.md management template). */
export function useDrawerFocus(options: {
  onClose: () => void;
  closeRef: RefObject<HTMLElement>;
  drawerRef?: RefObject<HTMLElement | null>;
  modal?: boolean;
  suppressEscape?: boolean;
}): void {
  const onCloseRef = useRef(options.onClose);
  const suppressEscapeRef = useRef(options.suppressEscape ?? false);
  onCloseRef.current = options.onClose;
  suppressEscapeRef.current = options.suppressEscape ?? false;

  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = options.drawerRef?.current;
    const previousOverflow = document.body.style.overflow;
    const isolated = new Map<HTMLElement, boolean>();

    if (options.modal && drawer !== undefined && drawer !== null) {
      document.body.style.overflow = 'hidden';
      let branch: HTMLElement | null = drawer;
      while (branch.parentElement !== null && branch.parentElement !== document.body) {
        for (const sibling of branch.parentElement.children) {
          if (sibling === branch || !(sibling instanceof HTMLElement)) continue;
          if (!isolated.has(sibling)) isolated.set(sibling, sibling.inert);
          sibling.inert = true;
        }
        branch = branch.parentElement;
      }
    }

    options.closeRef.current?.focus();

    const focusable = () => drawer === undefined || drawer === null
      ? []
      : Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    const closeOnEscape = (event: KeyboardEvent) => {
      const nestedModalOpen = drawer !== undefined && drawer !== null
        && Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).some((element) => element !== drawer);
      if (nestedModalOpen) return;
      if (event.key === 'Escape' && !suppressEscapeRef.current) {
        event.preventDefault();
        if (options.modal) event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (!options.modal || event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        drawer?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', closeOnEscape, options.modal);
    return () => {
      document.removeEventListener('keydown', closeOnEscape, options.modal);
      document.body.style.overflow = previousOverflow;
      isolated.forEach((wasInert, element) => { element.inert = wasInert; });
      if (returnFocus !== null && document.contains(returnFocus)) returnFocus.focus();
    };
  }, [options.closeRef, options.drawerRef, options.modal]);
}
