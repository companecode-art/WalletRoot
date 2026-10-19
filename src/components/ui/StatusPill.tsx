import type { TxStatus } from '../../types';
import { cn } from '../../lib/cn';

const statusMeta: Record<TxStatus, { label: string; className: string; pulse?: boolean }> = {
  pending: { label: 'pending', className: 'status-pending', pulse: true },
  confirmed: { label: 'confirmed', className: 'status-confirmed' },
  failed: { label: 'failed', className: 'status-failed' },
};

export function StatusPill({
  status,
  size = 'sm',
  className,
}: {
  status: TxStatus;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const meta = statusMeta[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-[0.1em]',
        size === 'sm' ? 'px-2 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[9px]',
        meta.className,
        className,
      )}
    >
      <span
        className={cn(
          'h-1 w-1 rounded-full bg-current',
          meta.pulse && 'animate-pulse',
        )}
      />
      {meta.label}
    </span>
  );
}
