import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  meta?: string;
};

const MENU_MIN_WIDTH = 240;
const MENU_ESTIMATED_HEIGHT = 260;

/**
 * Custom listbox select. Unlike a native `<select>` it can show an option
 * description and trailing meta, and it follows the ARIA listbox keyboard
 * contract (Arrow/Home/End/Enter/Escape with roving focus and click-outside
 * dismissal).
 *
 * The menu is portalled to `document.body` and positioned with fixed
 * coordinates so it is never clipped or painted over when the control sits in a
 * filter row above a table or inside an `overflow` container. Escape is
 * contained so the control can be used inside a v2 dialog without also closing
 * the dialog. Use `ScopeSelector` for the shell scope switcher.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const selected = options[selectedIndex];

  const positionMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, MENU_MIN_WIDTH);
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < MENU_ESTIMATED_HEIGHT && rect.top > spaceBelow;
    setMenuStyle({
      position: 'fixed',
      left,
      ...(openUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  };

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const openAt = (index: number) => {
    setActiveIndex(index);
    positionMenu();
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
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const reposition = () => positionMenu();
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  const move = (offset: number) => {
    setActiveIndex((activeIndex + offset + options.length) % options.length);
  };

  return (
    <div ref={rootRef} className={`ui-v2-select${open ? ' is-open' : ''}`}>
      <button
        ref={triggerRef}
        className="ui-v2-select__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        disabled={disabled}
        onClick={() => (open ? close() : openAt(selectedIndex))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); openAt(open ? (activeIndex + 1) % options.length : selectedIndex); }
          if (event.key === 'ArrowUp') { event.preventDefault(); openAt(open ? (activeIndex - 1 + options.length) % options.length : selectedIndex); }
          if (event.key === 'Home') { event.preventDefault(); openAt(0); }
          if (event.key === 'End') { event.preventDefault(); openAt(options.length - 1); }
          if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(true); }
        }}
      >
        <span className="ui-v2-select__copy">
          <span className="ui-v2-select__label">{label}</span>
          <span className="ui-v2-select__value">{selected?.label ?? '—'}</span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      {open
        ? createPortal(
            <div ref={menuRef} className="ui-v2-select__menu" id={`${id}-menu`} role="listbox" aria-label={label} style={menuStyle}>
              <div className="ui-v2-select__head"><span className="ui-v2-select__eyebrow">{label}</span><span className="ui-v2-mono">{options.length} options</span></div>
              {options.map((option, index) => (
                <button
                  ref={(node) => { optionRefs.current[index] = node; }}
                  className={`ui-v2-select__option${option.value === value ? ' is-selected' : ''}`}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  tabIndex={index === activeIndex ? 0 : -1}
                  onClick={() => choose(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
                    if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
                    if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); }
                    if (event.key === 'End') { event.preventDefault(); setActiveIndex(options.length - 1); }
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(index); }
                    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
                    if (event.key === 'Tab') close();
                  }}
                >
                  <span className="ui-v2-select__check" aria-hidden="true">✓</span>
                  <span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</span>
                  {option.meta ? <span className="ui-v2-select__meta">{option.meta}</span> : null}
                </button>
              ))}
              <div className="ui-v2-select__foot"><span>↑↓ Navigate</span><span>Enter Select</span><span>Esc Close</span></div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
