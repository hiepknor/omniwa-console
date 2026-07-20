import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';

export function ConfirmationDialog({
  eyebrow = 'Confirmation required',
  title,
  context,
  description,
  confirmLabel,
  pendingLabel = 'Submitting…',
  intent = 'primary',
  isPending = false,
  error,
  initialFocusRef,
  onCancel,
  onConfirm,
}: {
  eyebrow?: string;
  title: string;
  context?: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  intent?: 'primary' | 'danger';
  isPending?: boolean;
  error?: unknown;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <ModalDialog
      titleId={titleId}
      eyebrow={eyebrow}
      title={title}
      context={context}
      describedBy={descriptionId}
      onClose={onCancel}
      canClose={!isPending}
      busy={isPending}
      initialFocusRef={initialFocusRef ?? cancelRef}
      closeLabel={`Close ${title.toLowerCase()} dialog`}
      secondaryAction={<button ref={cancelRef} className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>}
      primaryAction={<button className={`btn ${intent === 'danger' ? 'danger solid' : 'primary'}`} type="button" onClick={onConfirm} disabled={isPending}>{isPending ? pendingLabel : confirmLabel}</button>}
    >
      <div className="dialog-sheet-copy" id={descriptionId}>{description}</div>
      {error !== undefined && error !== null && <InlineError error={error} onRetry={onConfirm} announce />}
    </ModalDialog>
  );
}
