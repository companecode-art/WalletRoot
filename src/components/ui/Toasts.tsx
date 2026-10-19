import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { cn } from '../../lib/cn';
import type { ToastItem } from '../../types';

const kindMeta: Record<
  ToastItem['kind'],
  { icon: typeof Info; className: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    className: 'border-[var(--border-accent)]',
    iconClass: 'text-[var(--accent)] bg-[var(--accent-dim)]',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-[rgba(255,77,109,.3)]',
    iconClass: 'text-[var(--danger)] bg-[var(--danger-dim)]',
  },
  info: {
    icon: Info,
    className: 'border-[rgba(103,215,255,.22)]',
    iconClass: 'text-[var(--info)] bg-[var(--info-dim)]',
  },
  reward: {
    icon: Sparkles,
    className: 'border-[rgba(255,200,87,.28)]',
    iconClass: 'text-[var(--warning)] bg-[var(--warning-dim)]',
  },
};

export function ToastViewport() {
  const { toasts, dismissToast, sheet } = useApp();
  const overSheet = sheet.kind !== 'none';

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[110] mx-auto flex w-full max-w-[520px] flex-col gap-2 px-4',
        overSheet
          ? 'top-[calc(10px+env(safe-area-inset-top))]'
          : 'bottom-[calc(88px+env(safe-area-inset-bottom))]',
      )}
    >
      {toasts.map((toast) => {
        const meta = kindMeta[toast.kind];
        const Icon = meta.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[var(--surface-strong)] p-3 shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl',
              meta.className,
              overSheet ? 'animate-fade-in' : 'animate-reveal-up',
            )}
          >
            <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl', meta.iconClass)}>
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] font-semibold leading-tight text-[var(--text)]">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Скрыть"
              onClick={() => dismissToast(toast.id)}
              className="mt-0.5 rounded-lg p-1 text-[var(--text-faint)] transition hover:text-[var(--text)]"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
