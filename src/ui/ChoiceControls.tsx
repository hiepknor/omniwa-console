import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'role' | 'type'> & {
  label: ReactNode;
  description?: ReactNode;
};

export function Checkbox({ label, description, className, disabled, id: providedId, ...props }: ChoiceProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <label htmlFor={id} className={cn('flex min-h-9 cursor-pointer items-start gap-2 py-2 max-sm:min-h-10', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="relative mt-0.5 size-4 shrink-0">
        <input id={id} type="checkbox" aria-labelledby={labelId} aria-describedby={descriptionId} disabled={disabled} className="peer absolute inset-0 size-full cursor-inherit appearance-none opacity-0" {...props} />
        <span aria-hidden className="pointer-events-none grid size-4 place-items-center border border-line-strong bg-surface after:size-1.5 after:bg-bg after:opacity-0 after:content-[''] peer-checked:bg-fg peer-checked:after:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:border-line peer-disabled:bg-elevated" />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <strong id={labelId} className="text-[13px] font-medium leading-4 text-fg">{label}</strong>
        {description ? <small id={descriptionId} className="text-xs leading-4 text-fg-3">{description}</small> : null}
      </span>
    </label>
  );
}

export function Switch({ label, description, className, disabled, id: providedId, ...props }: ChoiceProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <label htmlFor={id} className={cn('flex min-h-9 cursor-pointer items-start justify-between gap-4 py-2 max-sm:min-h-10', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="grid min-w-0 gap-0.5">
        <strong id={labelId} className="text-[13px] font-medium leading-4 text-fg">{label}</strong>
        {description ? <small id={descriptionId} className="text-xs leading-4 text-fg-3">{description}</small> : null}
      </span>
      <span className="relative mt-0.5 h-5 w-9 shrink-0">
        <input id={id} type="checkbox" role="switch" aria-labelledby={labelId} aria-describedby={descriptionId} disabled={disabled} className="peer absolute inset-0 size-full cursor-inherit appearance-none opacity-0" {...props} />
        <span aria-hidden className="pointer-events-none flex h-5 w-9 items-center border border-line-strong bg-surface p-[3px] after:size-3 after:shrink-0 after:bg-fg after:content-[''] peer-checked:bg-fg peer-checked:after:translate-x-4 peer-checked:after:bg-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:border-line peer-disabled:bg-elevated peer-disabled:after:bg-fg-3 motion-reduce:after:transition-none after:transition-transform" />
      </span>
    </label>
  );
}
