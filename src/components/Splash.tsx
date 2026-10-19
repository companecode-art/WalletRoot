import { Logo, Wordmark } from './ui/Logo';

export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <div className="relative">
        <div className="absolute inset-[-40px] animate-pulse rounded-full bg-[var(--accent)] opacity-[0.08] blur-3xl" />
        <Logo size={74} withGlow />
      </div>
      <div className="text-center">
        <Wordmark compact />
        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-faint)]">
          инициализация защищённого канала
        </p>
        <div className="mx-auto mt-4 h-[2px] w-36 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full w-1/2 animate-[shimmer_1.4s_linear_infinite] rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--accent), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
