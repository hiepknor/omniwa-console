import type { ReactNode } from 'react';
import { useId, useRef } from 'react';
import { Button, buttonClassName } from './Button';
import { cn } from './cn';

function formatFileSize(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(bytes < 10_000 ? 1 : 0)} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 1 : 0)} MB`;
}

/** Canonical single-file chooser. Upload transport and server state stay feature-owned. */
export function FileUpload({
  label,
  description,
  error,
  required = false,
  accept,
  file,
  disabled = false,
  chooseLabel = 'Choose file',
  replaceLabel = 'Replace',
  emptyLabel = 'No file selected',
  onFileChange,
  className,
}: {
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  accept?: string;
  file?: File;
  disabled?: boolean;
  chooseLabel?: string;
  replaceLabel?: string;
  emptyLabel?: string;
  onFileChange: (file: File | undefined) => void;
  className?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onFileChange(undefined);
  };

  return (
    <div className={cn('grid gap-1.5', className)}>
      <label id={labelId} htmlFor={id} className="text-[11px] font-medium uppercase tracking-wider text-fg-3">
        {label}
        {required ? <span aria-hidden className="ml-1 text-fg-2">/ required</span> : null}
      </label>
      <div
        className={cn(
          'grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border border-line bg-recessed p-3',
          'hover:border-line-strong focus-within:border-line-strong',
          'aria-[invalid=true]:border-line-strong',
          disabled && 'cursor-not-allowed bg-elevated opacity-60',
          'max-sm:min-h-24 max-sm:grid-cols-1',
        )}
        aria-invalid={error ? true : undefined}
        aria-disabled={disabled || undefined}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          required={required}
          disabled={disabled}
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="sr-only"
          onClick={(event) => { event.currentTarget.value = ''; }}
          onChange={(event) => onFileChange(event.currentTarget.files?.[0])}
        />
        <span className="grid min-w-0 gap-1">
          <strong className={cn('truncate text-[13px] font-medium', !file && 'text-fg-2')} title={file?.name}>
            {file?.name ?? emptyLabel}
          </strong>
          <span className="truncate font-mono text-[11px] text-fg-3">
            {file ? `${file.type || 'Unknown type'} · ${formatFileSize(file.size)}` : 'One file from this device'}
          </span>
        </span>
        <span className={cn('flex flex-wrap justify-end gap-2 max-sm:grid', file ? 'max-sm:grid-cols-2' : 'max-sm:grid-cols-1')}>
          <label
            htmlFor={id}
            aria-hidden="true"
            className={buttonClassName('ghost', cn(
              'max-sm:w-full',
              disabled && 'pointer-events-none translate-x-0 translate-y-0 cursor-not-allowed opacity-40 shadow-none',
            ))}
          >
            <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2 px-3">
              {file ? replaceLabel : chooseLabel}
            </span>
          </label>
          {file ? <Button className="max-sm:w-full" disabled={disabled} onClick={clear}>Clear</Button> : null}
        </span>
      </div>
      {description ? <p id={descriptionId} className="text-xs text-fg-3">{description}</p> : null}
      {error ? <p id={errorId} className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
