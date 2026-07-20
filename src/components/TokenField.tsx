import { useId, type KeyboardEvent } from 'react';

export type TokenFieldValue = {
  tokens: string[];
  draft: string;
};

export function tokenFieldItems(value: TokenFieldValue): string[] {
  return [...value.tokens, value.draft].map((item) => item.trim()).filter(Boolean);
}

export function duplicateTokens(value: TokenFieldValue): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of tokenFieldItems(value)) {
    if (seen.has(item)) duplicates.add(item);
    seen.add(item);
  }
  return [...duplicates];
}

export function TokenField({
  id,
  label,
  value,
  onChange,
  placeholder,
  help,
  optional = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: TokenFieldValue;
  onChange: (value: TokenFieldValue) => void;
  placeholder?: string;
  help: string;
  optional?: boolean;
  disabled?: boolean;
}) {
  const descriptionId = useId();
  const errorId = useId();
  const duplicates = duplicateTokens(value);
  const commitDraft = () => {
    const token = value.draft.trim();
    if (!token) return;
    onChange({ tokens: [...value.tokens, token], draft: '' });
  };
  const updateDraft = (nextDraft: string) => {
    const pieces = nextDraft.split(',');
    if (pieces.length === 1) {
      onChange({ ...value, draft: nextDraft });
      return;
    }
    const committed = pieces.slice(0, -1).map((item) => item.trim()).filter(Boolean);
    onChange({ tokens: [...value.tokens, ...committed], draft: pieces.at(-1) ?? '' });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && value.draft.trim()) {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && !value.draft && value.tokens.length > 0) {
      event.preventDefault();
      const next = [...value.tokens];
      const draft = next.pop() ?? '';
      onChange({ tokens: next, draft });
    }
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}{optional && <> <span className="help">optional</span></>}</label>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--recessed)] px-2 py-1.5 focus-within:border-[var(--border-strong)] focus-within:shadow-[inset_var(--focus-ring)]">
        {value.tokens.map((token, index) => (
          <span className="inline-flex min-w-0 max-w-full items-center rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] text-xs text-[var(--fg-2)]" key={`${token}-${index}`}>
            <span className="min-w-0 max-w-44 overflow-hidden text-ellipsis whitespace-nowrap pl-2.5 pr-1 font-mono" title={token}>{token}</span>
            <button
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--accent-hover)] hover:text-[var(--fg)] disabled:opacity-40 pointer-coarse:h-11 pointer-coarse:w-11"
              type="button"
              aria-label={`Remove ${token}`}
              disabled={disabled}
              onClick={() => onChange({ ...value, tokens: value.tokens.filter((_, itemIndex) => itemIndex !== index) })}
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        ))}
        <input
          className="min-h-7 min-w-28 flex-1 border-0 bg-transparent px-1 font-mono text-xs text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
          id={id}
          value={value.draft}
          onChange={(event) => updateDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
          placeholder={value.tokens.length ? 'Add another…' : placeholder}
          aria-describedby={`${descriptionId}${duplicates.length ? ` ${errorId}` : ''}`}
          aria-invalid={duplicates.length > 0}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
      <p className="help" id={descriptionId}>{help}</p>
      {duplicates.length > 0 && <p className="help text-[var(--failed)]" id={errorId} role="alert">Remove duplicate {duplicates.length === 1 ? 'value' : 'values'}: {duplicates.join(', ')}.</p>}
    </div>
  );
}
