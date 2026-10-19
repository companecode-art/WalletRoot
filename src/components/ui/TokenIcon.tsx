import type { Currency } from '../../types';
import { CURRENCY_META } from '../../lib/constants';
import { cn } from '../../lib/cn';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const boxSize: Record<Size, string> = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-14 w-14 text-xl',
};

export function TokenIcon({
  currency,
  size = 'md',
  className,
}: {
  currency: Currency;
  size?: Size;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-full border border-[var(--border-accent)] bg-[var(--accent-faint)] font-mono font-semibold text-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]',
        boxSize[size],
        className,
      )}
      aria-hidden="true"
    >
      {CURRENCY_META[currency].symbol}
    </div>
  );
}
