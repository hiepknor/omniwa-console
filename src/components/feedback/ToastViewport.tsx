import { useEffect, useRef, useState } from 'react';
import { FeedbackContent } from './FeedbackContent';
import type { FeedbackToast } from './feedback-types';

function ToastItem({ toast, onDismiss }: { toast: FeedbackToast; onDismiss: (id: string) => void }) {
  const remaining = useRef(toast.durationMs);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(document.hidden);
  const paused = hovered || focused || documentHidden;

  useEffect(() => {
    remaining.current = toast.durationMs;
  }, [toast.createdAt, toast.durationMs]);

  useEffect(() => {
    const handleVisibility = () => setDocumentHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (paused || remaining.current === undefined) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      if (remaining.current !== undefined) {
        remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
      }
    };
  }, [onDismiss, paused, toast.createdAt, toast.id]);

  return (
    <div
      className={`feedback-toast feedback-tone-${toast.kind}`}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <FeedbackContent {...toast} onDismiss={() => onDismiss(toast.id)} />
    </div>
  );
}

export function ToastViewport({ toasts, onDismiss }: { toasts: FeedbackToast[]; onDismiss: (id: string) => void }) {
  return (
    <section className="feedback-toast-viewport" aria-label="Notifications">
      {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />)}
    </section>
  );
}
