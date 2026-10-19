import { cn } from '../../lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({ checked, onChange, disabled = false, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[26px] w-[46px] shrink-0 rounded-full border transition-all duration-200 disabled:opacity-40',
        checked
          ? 'border-[var(--accent)] bg-[var(--accent-dim)] shadow-[0_0_18px_rgba(0,255,157,.18)]'
          : 'border-[var(--border)] bg-white/5',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[18px] w-[18px] rounded-full transition-all duration-200',
          checked
            ? 'left-[23px] bg-[var(--accent)] shadow-[0_0_10px_rgba(0,255,157,.55)]'
            : 'left-[3px] bg-[var(--text-muted)]',
        )}
      />
    </button>
  );
}
