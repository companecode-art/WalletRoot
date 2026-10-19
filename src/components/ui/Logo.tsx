import { cn } from '../../lib/cn';

export function Logo({
  size = 34,
  className,
  withGlow = false,
}: {
  size?: number;
  className?: string;
  withGlow?: boolean;
}) {
  return (
    <div
      className={cn('relative grid place-items-center text-[var(--accent)]', className)}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute inset-[-30%] rounded-full opacity-50 blur-xl"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="relative h-full w-full drop-shadow-[0_0_8px_rgba(0,255,157,0.35)]"
        aria-hidden="true"
      >
        <path
          d="M20 2.8 35.4 11.6v16.8L20 37.2 4.6 28.4V11.6L20 2.8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="rgba(0,255,157,0.05)"
        />
        <path
          d="M12.4 26.6V13.9l7.6 4.6 7.6-4.6v12.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="2.4" fill="currentColor" />
      </svg>
    </div>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="leading-none">
      <div className="flex items-center gap-1.5">
        <span className="text-[15px] font-semibold tracking-[-0.04em] text-[var(--text)]">
          Root<span className="text-[var(--accent)]">Wallet</span>
        </span>
        {!compact && (
          <span className="rounded-[5px] border border-[var(--border-accent)] bg-[var(--accent-dim)] px-1.5 py-0.5 font-mono text-[7px] font-semibold tracking-[0.16em] text-[var(--accent)]">
            DEMO
          </span>
        )}
      </div>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--text-faint)]">
        crypto wallet
      </div>
    </div>
  );
}
