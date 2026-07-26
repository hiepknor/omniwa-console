import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';
import { fieldControlClassName } from './Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(fieldControlClassName, 'min-h-20 resize-y px-2.5 py-2 leading-5', className)}
        {...props}
      />
    );
  },
);
