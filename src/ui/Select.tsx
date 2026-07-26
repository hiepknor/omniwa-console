import {
  Children,
  isValidElement,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type OptionHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

type Option = {
  value: string;
  label: ReactNode;
  text: string;
  disabled: boolean;
};

type MenuPosition = {
  vertical: 'down' | 'up';
  horizontal: 'left' | 'right';
};

export function getMenuPosition({
  root,
  menu,
  viewport,
  inset = 16,
  gap = 4,
}: {
  root: { top: number; right: number; bottom: number; left: number };
  menu: { width: number; height: number };
  viewport: { width: number; height: number };
  inset?: number;
  gap?: number;
}): MenuPosition {
  const spaceBelow = viewport.height - root.bottom - gap - inset;
  const spaceAbove = root.top - gap - inset;
  const spaceRight = viewport.width - root.left - inset;
  const spaceLeft = root.right - inset;
  return {
    vertical: spaceBelow >= menu.height || spaceBelow >= spaceAbove ? 'down' : 'up',
    horizontal: spaceRight >= menu.width || spaceRight >= spaceLeft ? 'left' : 'right',
  };
}

export function selectChevronClassName(open: boolean): string {
  return cn(
    'grid h-full place-items-center border-l transition-colors',
    open
      ? 'border-fg bg-fg text-bg group-hover:border-fg group-hover:text-bg'
      : 'border-line text-fg-3 group-hover:border-line-strong group-hover:text-fg',
  );
}

export function optionMarkerClassName(active: boolean, selected: boolean): string {
  return cn(
    'size-2 border',
    active
      ? selected ? 'border-bg bg-bg' : 'border-bg bg-transparent'
      : selected ? 'border-fg bg-fg' : 'border-fg-3 bg-transparent',
  );
}

export type SelectProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'defaultValue' | 'onChange' | 'value'
> & {
  children: ReactNode;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
};

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((part) => typeof part === 'string' || typeof part === 'number' ? String(part) : '')
    .join('')
    .trim();
}

function optionsFromChildren(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child) || child.type !== 'option') return [];
    const label = child.props.children;
    const text = textOf(label);
    return [{
      value: child.props.value === undefined ? text : String(child.props.value),
      label,
      text,
      disabled: child.props.disabled ?? false,
    }];
  });
}

export function findNextEnabledIndex(
  options: readonly Pick<Option, 'disabled'>[],
  start: number,
  direction: 1 | -1,
): number {
  if (options.length === 0) return -1;
  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (start + direction * offset + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }
  return -1;
}

function firstEnabledIndex(options: readonly Option[]): number {
  return options.findIndex((option) => !option.disabled);
}

export function Select({
  children,
  className,
  defaultValue,
  disabled = false,
  name,
  onValueChange,
  placeholder = 'Select option',
  value,
  ...buttonProps
}: SelectProps) {
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    () => defaultValue ?? options.find((option) => !option.disabled)?.value ?? '',
  );
  const selectedValue = controlled ? value : internalValue;
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selected = options[selectedIndex];
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(options));
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ vertical: 'down', horizontal: 'left' });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<number, HTMLDivElement>());
  const typeahead = useRef({ text: '', at: 0 });
  const generatedId = useId();
  const triggerId = buttonProps.id ?? `${generatedId}-trigger`;
  const listboxId = `${generatedId}-listbox`;
  const activeId = activeIndex >= 0 ? `${generatedId}-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const positionMenu = () => {
      const root = rootRef.current;
      const listbox = listboxRef.current;
      if (!root || !listbox) return;

      const rootRect = root.getBoundingClientRect();
      const listboxRect = listbox.getBoundingClientRect();
      const next = getMenuPosition({
        root: rootRect,
        menu: listboxRect,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });

      setMenuPosition((current) => current.vertical === next.vertical && current.horizontal === next.horizontal
        ? current
        : next);
    };

    positionMenu();
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    return () => {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (open && activeIndex >= 0) optionRefs.current.get(activeIndex)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const openMenu = () => {
    const nextActive = selectedIndex >= 0 && !options[selectedIndex]?.disabled
      ? selectedIndex
      : firstEnabledIndex(options);
    setActiveIndex(nextActive);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    if (!controlled) setInternalValue(option.value);
    onValueChange?.(option.value);
    setActiveIndex(index);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const move = (direction: 1 | -1) => {
    const origin = activeIndex >= 0
      ? activeIndex
      : direction === 1 ? options.length - 1 : 0;
    const next = findNextEnabledIndex(options, origin, direction);
    if (next >= 0) setActiveIndex(next);
  };

  const moveToEdge = (edge: 'first' | 'last') => {
    const indexes = options.map((_, index) => index);
    if (edge === 'last') indexes.reverse();
    const next = indexes.find((index) => !options[index]?.disabled);
    if (next !== undefined) setActiveIndex(next);
  };

  const matchTypeahead = (key: string) => {
    const now = Date.now();
    const previous = now - typeahead.current.at < 700 ? typeahead.current.text : '';
    const repeated = previous.length > 0 && [...previous].every((character) => character === key.toLocaleLowerCase());
    const query = repeated ? key.toLocaleLowerCase() : `${previous}${key}`.toLocaleLowerCase();
    typeahead.current = { text: query, at: now };
    const origin = activeIndex >= 0 ? activeIndex : selectedIndex;
    for (let offset = 1; offset <= options.length; offset += 1) {
      const index = (origin + offset + options.length) % options.length;
      const option = options[index];
      if (!option?.disabled && option.text.toLocaleLowerCase().startsWith(query)) {
        if (open) setActiveIndex(index);
        else choose(index);
        return;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu();
      else move(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!open) openMenu();
      moveToEdge(event.key === 'Home' ? 'first' : 'last');
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && activeIndex >= 0) choose(activeIndex);
      else openMenu();
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      matchTypeahead(event.key);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative inline-grid min-w-32 self-start text-left', className)} data-disabled={disabled || undefined}>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <button
        ref={triggerRef}
        {...buttonProps}
        id={triggerId}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? activeId : undefined}
        disabled={disabled}
        className={cn(
          'group grid h-9 w-full grid-cols-[minmax(0,1fr)_2.25rem] border border-line bg-surface text-left max-sm:h-10',
          'cursor-pointer text-[13px] font-medium leading-none text-fg transition-colors',
          'hover:border-line-strong hover:bg-recessed',
          'focus-visible:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:bg-elevated disabled:text-fg-3 disabled:opacity-60',
          'aria-[invalid=true]:border-line-strong aria-[invalid=true]:outline aria-[invalid=true]:outline-1 aria-[invalid=true]:outline-line-strong',
        )}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleKeyDown}
      >
        <span className={cn('min-w-0 truncate px-3 self-center', !selected && 'text-fg-3')}>
          {selected?.label ?? placeholder}
        </span>
        <span
          aria-hidden
          className={selectChevronClassName(open)}
        >
          <Icon name="chevron-down" className={cn('transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      <div
        ref={listboxRef}
        id={listboxId}
        role="listbox"
        aria-label={typeof buttonProps['aria-label'] === 'string' ? buttonProps['aria-label'] : undefined}
        aria-labelledby={buttonProps['aria-label'] ? undefined : buttonProps['aria-labelledby']}
        hidden={!open}
        className={cn(
          'absolute z-50 max-h-60 min-w-full w-max max-w-[min(24rem,calc(100vw-2rem))] overflow-y-auto border border-line-strong bg-surface p-1 shadow-[4px_4px_0_var(--color-fg)]',
          menuPosition.vertical === 'down' ? 'top-[calc(100%+4px)]' : 'bottom-[calc(100%+4px)]',
          menuPosition.horizontal === 'left' ? 'left-0' : 'right-0',
        )}
      >
        {options.map((option, index) => {
          const active = index === activeIndex;
          const optionSelected = index === selectedIndex;
          return (
            <div
              key={`${option.value}-${index}`}
              ref={(node) => {
                if (node) optionRefs.current.set(index, node);
                else optionRefs.current.delete(index);
              }}
              id={`${generatedId}-option-${index}`}
              role="option"
              aria-disabled={option.disabled || undefined}
              aria-selected={optionSelected}
              className={cn(
                'grid min-h-8 grid-cols-[1rem_minmax(0,1fr)] items-center gap-2 px-2 py-1.5 text-[13px] max-sm:min-h-10',
                'cursor-pointer select-none',
                active ? 'bg-fg text-bg' : 'text-fg',
                optionSelected && 'font-semibold',
                option.disabled && 'pointer-events-none cursor-not-allowed text-fg-3 opacity-50',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => !option.disabled && setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span
                aria-hidden
                className={optionMarkerClassName(active, optionSelected)}
              />
              <span className="min-w-0 truncate">{option.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
