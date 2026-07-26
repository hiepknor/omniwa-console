import type { NavigationIconName } from './Icon';
import { Icon } from './Icon';
import { cn } from './cn';

export function navigationItemClassName(active: boolean, className?: string) {
  return cn(
    'flex min-h-9 items-center gap-2.5 border border-transparent px-2.5 text-[13px]',
    'max-[900px]:justify-center max-[900px]:px-0 max-[640px]:min-h-11 max-[640px]:min-w-[72px] max-[640px]:flex-col max-[640px]:gap-0.5 max-[640px]:px-2',
    active ? 'bg-fg text-bg' : 'text-fg-2 hover:bg-elevated hover:text-fg',
    className,
  );
}

export function NavigationItemContent({ icon, label }: { icon: NavigationIconName; label: string }) {
  return (
    <>
      <Icon name={icon} size="nav" />
      <span className="max-[900px]:hidden max-[640px]:inline max-[640px]:text-[10px]">{label}</span>
    </>
  );
}
