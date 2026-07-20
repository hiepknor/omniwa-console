import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Own keyboard focus and restore it when a modal command surface closes. */
export function useModalDialog<T extends HTMLElement>({
  onClose,
  canClose = true,
  initialFocusRef,
  returnFocusRef,
  active = true,
}: {
  onClose: () => void;
  canClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  active?: boolean;
}) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);
  onCloseRef.current = onClose;
  canCloseRef.current = canClose;

  useEffect(() => {
    if (!active) return;
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const returnFocus = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    const isolated = new Map<HTMLElement, boolean>();
    document.body.style.overflow = 'hidden';

    // Isolate every sibling outside the dialog branch. This keeps shell
    // navigation and page controls out of both pointer and accessibility trees
    // without requiring every dialog to know where it is mounted.
    let branch: HTMLElement = dialog;
    while (true) {
      const parent: HTMLElement | null = branch.parentElement;
      if (parent === null) break;
      for (const sibling of parent.children) {
        if (sibling === branch || !(sibling instanceof HTMLElement)) continue;
        if (!isolated.has(sibling)) isolated.set(sibling, sibling.inert);
        sibling.inert = true;
      }
      if (parent === document.body) break;
      branch = parent;
    }

    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    (initialFocusRef?.current ?? focusable()[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && canCloseRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
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

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      isolated.forEach((wasInert, element) => { element.inert = wasInert; });
      returnFocus?.focus();
    };
  }, [active, initialFocusRef, returnFocusRef]);

  return dialogRef;
}
