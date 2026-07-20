import { useId, useRef, useState, type ReactNode } from 'react';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';

export function TypedConfirmationDialog({
  title,
  description,
  resourceId,
  confirmValue,
  confirmLabel,
  pendingLabel,
  error,
  isPending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  resourceId: string;
  confirmValue: string;
  confirmLabel: string;
  pendingLabel: string;
  error?: unknown;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();

  return (
    <ModalDialog
      titleId={titleId}
      eyebrow="Confirmation required"
      title={title}
      context={resourceId}
      onClose={onCancel}
      canClose={!isPending}
      initialFocusRef={inputRef}
      closeLabel={`Close ${title.toLowerCase()} dialog`}
      footer={<>
        <button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>
        <button
          className="btn danger solid"
          type="button"
          onClick={onConfirm}
          disabled={confirmation !== confirmValue || isPending}
        >
          {isPending ? pendingLabel : confirmLabel}
        </button>
      </>}
    >
      <div className="dialog-sheet-copy">{description}</div>
      <div className="field">
        <label htmlFor={inputId}>
          Type <span className="mono dialog-sheet-confirm-name">{confirmValue}</span> to confirm
        </label>
        <input
          ref={inputRef}
          className="input"
          id={inputId}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={isPending}
          autoComplete="off"
        />
      </div>
      {error !== undefined && error !== null && (
        <InlineError error={error} onRetry={onConfirm} announce />
      )}
    </ModalDialog>
  );
}
