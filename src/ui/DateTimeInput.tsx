import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from './Input';

export const DateTimeInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  function DateTimeInput(props, ref) {
    return <Input ref={ref} type="datetime-local" {...props} />;
  },
);
