import { Delete, ScanFace } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptic } from '../../telegram/telegram';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (pin: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string | null;
  hint?: string;
  onBiometrics?: () => void;
  biometricsLabel?: string;
  className?: string;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinPad({
  value,
  onChange,
  onComplete,
  length = 4,
  disabled = false,
  error,
  hint,
  onBiometrics,
  biometricsLabel = 'Face ID',
  className,
}: PinPadProps) {
  const press = (digit: string) => {
    if (disabled || value.length >= length) return;
    const next = `${value}${digit}`;
    onChange(next);
    haptic('tap');
    if (next.length === length) {
      window.setTimeout(() => onComplete?.(next), 120);
    }
  };

  const remove = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
    haptic('tap');
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        key={error ? 'error' : 'idle'}
        className={cn('flex items-center gap-3.5', error && 'animate-shake')}
        aria-label={`Введено ${value.length} из ${length} цифр`}
      >
        {Array.from({ length }).map((_, index) => {
          const filled = index < value.length;
          return (
            <span
              key={index}
              className={cn(
                'h-3 w-3 rounded-full border transition-all duration-150',
                filled
                  ? 'border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_12px_rgba(0,255,157,.55)]'
                  : 'border-[var(--border)] bg-white/5',
                error && 'border-[var(--danger)]',
              )}
            />
          );
        })}
      </div>

      <div className="mt-2 h-8 text-center">
        {error ? (
          <p className="animate-fade-in text-[11px] font-medium text-[var(--danger)]">{error}</p>
        ) : hint ? (
          <p className="text-[11px] text-[var(--text-faint)]">{hint}</p>
        ) : null}
      </div>

      <div className="grid w-full max-w-[300px] grid-cols-3 gap-2.5">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            className="interactive flex h-[52px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] font-mono text-xl text-[var(--text)] disabled:opacity-40"
            aria-label={key}
          >
            {key}
          </button>
        ))}

        {onBiometrics ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onBiometrics}
            className="interactive flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-faint)] text-[var(--accent)] disabled:opacity-40"
            aria-label={biometricsLabel}
          >
            <ScanFace size={20} />
            <span className="font-mono text-[7px] uppercase tracking-[0.12em]">{biometricsLabel}</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => press('0')}
          className="interactive flex h-[52px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] font-mono text-xl text-[var(--text)] disabled:opacity-40"
          aria-label="0"
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={remove}
          className="interactive flex h-[52px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)] disabled:opacity-30"
          aria-label="Удалить цифру"
        >
          <Delete size={19} />
        </button>
      </div>
    </div>
  );
}
