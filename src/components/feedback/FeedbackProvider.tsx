import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FeedbackInput, FeedbackToast, TransportCondition } from './feedback-types';
import { isTransportError } from './feedback-policy';
import { ToastViewport } from './ToastViewport';

const MAX_VISIBLE_TOASTS = 3;
const ACCEPTED_DURATION_MS = 6_000;
const COMPLETED_DURATION_MS = 4_000;
const INFO_DURATION_MS = 6_000;

type FeedbackContextValue = {
  toasts: FeedbackToast[];
  transport: TransportCondition;
  notify: (input: FeedbackInput) => string;
  accepted: (input: Omit<FeedbackInput, 'kind' | 'durationMs'>) => string;
  dismiss: (id: string) => void;
  reportTransportFailure: (error: unknown) => void;
  reportTransportSuccess: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function capToasts(toasts: FeedbackToast[]): FeedbackToast[] {
  const next = [...toasts];
  while (next.length > MAX_VISIBLE_TOASTS) {
    const removable = next.findIndex((toast) => toast.kind !== 'error');
    next.splice(removable === -1 ? 0 : removable, 1);
  }
  return next;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const sequence = useRef(0);
  const [toasts, setToasts] = useState<FeedbackToast[]>([]);
  const [transport, setTransport] = useState<TransportCondition>({ status: 'online' });

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((input: FeedbackInput) => {
    const id = `feedback-${++sequence.current}`;
    const toast: FeedbackToast = {
      ...input,
      id,
      createdAt: Date.now(),
      durationMs: input.durationMs ?? (
        input.kind === 'accepted'
          ? ACCEPTED_DURATION_MS
          : input.kind === 'completed'
            ? COMPLETED_DURATION_MS
            : input.kind === 'info'
              ? INFO_DURATION_MS
              : undefined
      ),
    };

    setToasts((current) => {
      const duplicateIndex = toast.dedupeKey
        ? current.findIndex((item) => item.dedupeKey === toast.dedupeKey)
        : -1;
      if (duplicateIndex === -1) return capToasts([...current, toast]);
      const next = [...current];
      next[duplicateIndex] = toast;
      return capToasts(next);
    });
    return id;
  }, []);

  const accepted = useCallback((input: Omit<FeedbackInput, 'kind' | 'durationMs'>) => (
    notify({ ...input, kind: 'accepted' })
  ), [notify]);

  const reportTransportFailure = useCallback((error: unknown) => {
    if (!isTransportError(error)) return;
    setTransport({
      status: 'offline',
      message: 'The console cannot reach the OmniWA API. Existing data remains visible while the connection recovers.',
    });
  }, []);

  const reportTransportSuccess = useCallback(() => {
    setTransport((current) => current.status === 'online' ? current : { status: 'online' });
  }, []);

  const value = useMemo<FeedbackContextValue>(() => ({
    toasts,
    transport,
    notify,
    accepted,
    dismiss,
    reportTransportFailure,
    reportTransportSuccess,
  }), [accepted, dismiss, notify, reportTransportFailure, reportTransportSuccess, toasts, transport]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider');
  return context;
}
