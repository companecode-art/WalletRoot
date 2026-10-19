import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, subtitle, eyebrow, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 h-full w-full animate-fade-in cursor-default bg-black/70 backdrop-blur-[5px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'sheet-panel absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[520px] animate-slide-up flex-col rounded-t-[30px]',
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15" />
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div className="min-w-0">
            {eyebrow && <p className="label-caps mb-1.5">{eyebrow}</p>}
            <h2 className="truncate text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="interactive grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
