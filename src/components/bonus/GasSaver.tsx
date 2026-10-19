import { useMemo } from 'react';
import { BellRing, Fuel, Zap } from 'lucide-react';
import { getGasAdvice } from '../../lib/gas';
import { useApp } from '../../state/AppContext';
import { cn } from '../../lib/cn';
import { haptic } from '../../telegram/telegram';

export function GasSaver() {
  const { notify } = useApp();
  const advice = useMemo(() => getGasAdvice(), []);
  const levelLabel =
    advice.level === 'low' ? 'low gas' : advice.level === 'medium' ? 'medium gas' : 'high gas';

  const remind = () => {
    haptic('tap');
    notify({
      kind: 'info',
      title: 'Gas Saver напомнит',
      message: `Оптимальное окно сегодня: ${advice.bestLabel} (демо)`,
    });
  };

  return (
    <section className="glass relative overflow-hidden rounded-3xl p-4">
      <div className="pointer-events-none absolute -left-16 -top-20 h-40 w-40 rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--warning)]">
            <Fuel size={17} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Gas Saver</h2>
            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
              network timing advisor
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="num text-[19px] font-semibold leading-none">{advice.current}</p>
          <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            gwei · {levelLabel}
          </p>
        </div>
      </div>

      <div className="relative mt-4 rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-faint)] p-3">
        <div className="flex items-start gap-2">
          <Zap size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <div>
            <p className="text-[11px] font-medium text-[var(--text)]">{advice.headline}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
              {advice.recommendation}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="flex h-[104px] items-end gap-1.5">
          {advice.hours.map((hour) => (
            <div key={hour.hour} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="relative flex w-full flex-1 items-end">
                <div
                  title={`${hour.label} · ${hour.gas} gwei`}
                  className={cn(
                    'w-full rounded-t-md transition-all duration-500',
                    hour.isCurrent
                      ? 'bg-[var(--accent)] opacity-90'
                      : hour.isBest
                        ? 'bg-[var(--accent)] opacity-40'
                        : 'bg-white/10',
                  )}
                  style={{ height: `${hour.height}%` }}
                />
                {hour.isBest && (
                  <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(0,255,157,.8)]" />
                )}
              </div>
              <span
                className={cn(
                  'font-mono text-[6.5px]',
                  hour.isCurrent
                    ? 'text-[var(--accent)]'
                    : hour.isBest
                      ? 'text-[var(--text-muted)]'
                      : 'text-[var(--text-faint)]',
                )}
              >
                {hour.label.slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              сейчас
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-40" />
              лучшее окно
            </span>
          </div>
          <button
            type="button"
            onClick={remind}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1.5 font-mono text-[8px] text-[var(--text-muted)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--accent)]"
          >
            <BellRing size={10} />
            напомнить
          </button>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border-soft)] pt-3">
        <div>
          <p className="label-caps text-[7px]">Лучшее окно</p>
          <p className="mt-1 font-mono text-[12px] text-[var(--text)]">{advice.bestLabel}</p>
        </div>
        <div className="text-right">
          <p className="label-caps text-[7px]">Экономия</p>
          <p className="mt-1 font-mono text-[12px] text-[var(--accent)]">
            −{advice.savingsPercent}% к комиссии
          </p>
        </div>
      </div>

      <p className="relative mt-2.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
        демо-данные на основе почасовой нагрузки
      </p>
    </section>
  );
}
