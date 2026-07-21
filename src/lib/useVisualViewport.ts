import { useLayoutEffect, type RefObject } from 'react';

const KEYBOARD_OPEN_DELTA = 96;
const KEYBOARD_CLOSED_DELTA = 32;
const SETTLE_DELAYS = [50, 150, 300, 600, 1_000];

function isEditable(element: Element | null): boolean {
  return element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || (element instanceof HTMLElement && element.isContentEditable);
}

export function dismissVirtualKeyboard() {
  if (isEditable(document.activeElement) && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/**
 * Turns the chat route into one visual-viewport stage.
 *
 * Safari may pan the document while focusing an editable control and may
 * publish its final keyboard geometry after the focus event. Keeping the
 * viewport contract on the outer shell prevents that pan from competing with
 * a transformed workspace. Only the stage height follows VisualViewport;
 * header, timeline, and composer remain in one flex layout.
 */
export function useVisualViewport<T extends HTMLElement>(rootRef: RefObject<T | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return;

    const documentElement = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    let baselineHeight = viewport?.height ?? window.innerHeight;
    let editingSession = isEditable(document.activeElement) && root.contains(document.activeElement);
    let keyboardOpen = false;
    let orientation = window.screen.orientation?.angle ?? 0;
    let releaseTimer = 0;
    const settleTimers = new Set<number>();

    documentElement.classList.add('chat-viewport-lock');
    root.setAttribute('data-visual-viewport-managed', '');

    const readHeight = () => Math.max(1, Math.round(viewport?.height ?? window.innerHeight));

    const applyMeasurement = () => {
      const height = readHeight();
      const focusedEditable = isEditable(document.activeElement) && root.contains(document.activeElement);
      const nextOrientation = window.screen.orientation?.angle ?? 0;

      if (nextOrientation !== orientation) {
        orientation = nextOrientation;
        baselineHeight = height;
        keyboardOpen = false;
        editingSession = focusedEditable;
      } else {
        if (focusedEditable) editingSession = true;

        const occludedHeight = Math.max(0, baselineHeight - height);
        if (editingSession && occludedHeight >= KEYBOARD_OPEN_DELTA) {
          keyboardOpen = true;
        } else if (occludedHeight <= KEYBOARD_CLOSED_DELTA) {
          keyboardOpen = false;
          if (!focusedEditable) editingSession = false;
        }

        if (!editingSession) baselineHeight = Math.max(baselineHeight, height);
      }

      documentElement.style.setProperty('--chat-visual-viewport-height', `${height}px`);
      root.toggleAttribute('data-keyboard-open', keyboardOpen);
    };

    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyMeasurement);
    };

    const settle = () => {
      for (const timer of settleTimers) window.clearTimeout(timer);
      settleTimers.clear();
      measure();
      for (const delay of SETTLE_DELAYS) {
        const timer = window.setTimeout(() => {
          settleTimers.delete(timer);
          measure();
        }, delay);
        settleTimers.add(timer);
      }
    };

    const handleFocusIn = () => {
      window.clearTimeout(releaseTimer);
      if (isEditable(document.activeElement) && root.contains(document.activeElement)) editingSession = true;
      settle();
    };

    const handleFocusOut = () => {
      settle();
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        const focusedEditable = isEditable(document.activeElement) && root.contains(document.activeElement);
        if (focusedEditable) return;
        editingSession = false;
        keyboardOpen = false;
        baselineHeight = readHeight();
        measure();
      }, SETTLE_DELAYS.at(-1));
    };

    const handleOrientationChange = () => {
      orientation = window.screen.orientation?.angle ?? 0;
      baselineHeight = readHeight();
      keyboardOpen = false;
      settle();
    };

    viewport?.addEventListener('resize', measure);
    viewport?.addEventListener('scroll', measure);
    viewport?.addEventListener('scrollend', measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    settle();

    return () => {
      viewport?.removeEventListener('resize', measure);
      viewport?.removeEventListener('scroll', measure);
      viewport?.removeEventListener('scrollend', measure);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(releaseTimer);
      for (const timer of settleTimers) window.clearTimeout(timer);
      documentElement.style.removeProperty('--chat-visual-viewport-height');
      documentElement.classList.remove('chat-viewport-lock');
      root.removeAttribute('data-visual-viewport-managed');
      root.removeAttribute('data-keyboard-open');
    };
  }, [rootRef]);
}
