import { useEffect, useId, useRef, useState } from 'react';

export type SelectDropdownOption = {
  value: string;
  label: string;
  description?: string;
  meta?: string;
};

export function SelectDropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: SelectDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex];

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option === undefined) return;
    onChange(option.value);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [activeIndex, open]);

  const move = (offset: number) => {
    const next = (activeIndex + offset + options.length) % options.length;
    setActiveIndex(next);
  };

  return (
    <div ref={rootRef} className={`dropdown${open ? ' is-open' : ''}`} data-modal-escape-priority={open || undefined}>
      <button
        ref={triggerRef}
        className="dropdown-trigger disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        disabled={disabled}
        onClick={() => open ? close() : openAt(selectedIndex)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); openAt(open ? (activeIndex + 1) % options.length : selectedIndex); }
          if (event.key === 'ArrowUp') { event.preventDefault(); openAt(open ? (activeIndex - 1 + options.length) % options.length : selectedIndex); }
          if (event.key === 'Home') { event.preventDefault(); openAt(0); }
          if (event.key === 'End') { event.preventDefault(); openAt(options.length - 1); }
          if (event.key === 'Escape') { event.preventDefault(); close(true); }
        }}
      >
        <span className="dropdown-trigger-copy">
          <span className="dropdown-trigger-label">{label}</span>
          <span className="dropdown-trigger-value">{selected?.label ?? '—'}</span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      <div className="dropdown-menu" id={`${id}-menu`} role="listbox" aria-label={label}>
        <div className="dropdown-menu-head"><span className="eyebrow">{label}</span><span className="mono">{options.length} options</span></div>
        {options.map((option, index) => (
          <button
            ref={(node) => { optionRefs.current[index] = node; }}
            className={`dropdown-option${option.value === value ? ' is-selected' : ''}`}
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === value}
            tabIndex={open && index === activeIndex ? 0 : -1}
            onClick={() => choose(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
              if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
              if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); }
              if (event.key === 'End') { event.preventDefault(); setActiveIndex(options.length - 1); }
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(index); }
              if (event.key === 'Escape' || event.key === 'Tab') close(event.key === 'Escape');
            }}
          >
            <span className="dropdown-check">✓</span>
            <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
            {option.meta && <span className="dropdown-option-meta num">{option.meta}</span>}
          </button>
        ))}
        <div className="dropdown-menu-foot"><span>↑↓ Navigate</span><span>Enter Select</span><span>Esc Close</span></div>
      </div>
    </div>
  );
}
