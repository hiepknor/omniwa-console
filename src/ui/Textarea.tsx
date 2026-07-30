import { forwardRef, useCallback, useLayoutEffect, useRef, type FormEvent, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';
import { fieldControlClassName } from './Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { autoGrow?: boolean; maxRows?: number }>(
  function Textarea({ autoGrow = false, maxRows = 4, className, rows = autoGrow ? 1 : 4, onInput, value, ...props }, forwardedRef) {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const setRef = useCallback((node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);
    const resize = useCallback(() => {
      const node = internalRef.current;
      if (!autoGrow || !node) return;
      node.style.height = 'auto';
      const style = window.getComputedStyle(node);
      const lineHeight = Number.parseFloat(style.lineHeight) || 20;
      const verticalFrame = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) + Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
      const maximum = lineHeight * Math.max(1, maxRows) + verticalFrame;
      node.style.height = `${Math.min(node.scrollHeight, maximum)}px`;
      node.style.overflowY = node.scrollHeight > maximum ? 'auto' : 'hidden';
    }, [autoGrow, maxRows]);
    useLayoutEffect(resize, [resize, value]);
    const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
      resize();
      onInput?.(event);
    };
    return (
      <textarea
        ref={setRef}
        rows={rows}
        value={value}
        onInput={handleInput}
        className={cn(
          fieldControlClassName,
          'px-2.5 py-2 leading-5',
          autoGrow ? 'min-h-9 resize-none overflow-y-hidden max-sm:min-h-10' : 'min-h-20 resize-y',
          className,
        )}
        {...props}
      />
    );
  },
);
