import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
const modalStack: symbol[] = [];

export function useModalFocus(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  closeDisabled: boolean,
) {
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const modalIdRef = useRef(Symbol('modal'));
  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const container = containerRef.current;
    const modalId = modalIdRef.current;
    modalStack.push(modalId);
    const focusable = () => Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const initial = focusable().find((element) => element.hasAttribute('autofocus')) ?? focusable()[0] ?? container;
    initial?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (modalStack.at(-1) !== modalId) return;
      if (event.key === 'Escape') {
        if (!closeDisabledRef.current) onCloseRef.current();
        event.preventDefault();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        container?.focus();
        return;
      }
      const index = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? (index <= 0 ? items.length - 1 : index - 1)
        : (index === -1 || index === items.length - 1 ? 0 : index + 1);
      event.preventDefault();
      items[nextIndex]?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const index = modalStack.lastIndexOf(modalId);
      if (index !== -1) modalStack.splice(index, 1);
      previous?.focus();
    };
  }, [containerRef, open]);
}
