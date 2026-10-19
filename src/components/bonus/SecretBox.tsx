import { useEffect, useRef, useState } from 'react';
import { Gift, Sparkles, TimerReset, Zap } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { SecretReward } from '../../types';
import {
  formatCooldown,
  formatFiatFromCurrency,
  formatToken,
} from '../../lib/format';
import { getSecretBoxRemaining } from '../../lib/rewards';
import { SECRET_BOX_COOLDOWN_MS } from '../../lib/constants';
import { TokenIcon } from '../ui/TokenIcon';
import { BadgeMedallion } from './BadgeCard';
import { haptic } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

const CELLS = Array.from({ length: 9 }, (_, index) => index);

export function SecretBox() {
  const { profile, openSecretBox, notify } = useApp();
  const [now, setNow] = useState(Date.now());
  const [openingCell, setOpeningCell] = useState<number | null>(null);
  const [lastCell, setLastCell] = useState<number | null>(null);
  const [result, setResult] = useState<SecretReward | null>(null);
  const timeout = useRef<number | null>(null);
  const openingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (timeout.current) window.clearTimeout(timeout.current);
    };
  }, []);

  if (!profile) return null;

  const remaining = getSecretBoxRemaining(profile.secretBoxLastOpened, now);
  const ready = remaining === 0;
  const progress = 100 - Math.min(100, (remaining / SECRET_BOX_COOLDOWN_MS) * 100);

  const handleOpen = (cell: number) => {
    if (openingCell !== null || openingRef.current) return;

    if (!ready) {
      haptic('warning');
      notify({
        kind: 'info',
        title: 'Ячейка перезаряжается',
        message: `Следующая попытка через ${formatCooldown(remaining)}`,
      });
      return;
    }

    setResult(null);
    setOpeningCell(cell);
    openingRef.current = true;
    haptic('tap');
    timeout.current = window.setTimeout(() => {
      const reward = openSecretBox();
      openingRef.current = false;
      setOpeningCell(null);
      setLastCell(cell);

      if (reward.kind === 'cooldown') {
        notify({ kind: 'info', title: 'Ещё не готово', message: 'Подожди немного' });
        return;
      }
      if (reward.kind === 'unavailable') {
        notify({ kind: 'error', title: 'Ячейка недоступна' });
        return;
      }

      setResult(reward);
      if (reward.kind === 'tokens') {
        notify({
          kind: 'reward',
          title: 'Secret Box открыт',
          message: `+${formatToken(reward.amount, reward.currency)} ${reward.currency} зачислено`,
        });
      } else {
        notify({
          kind: 'reward',
          title: 'NFT-бейдж получен',
          message: reward.badge.name,
        });
      }
    }, 950);
  };

  return (
    <section className="glass-accent relative overflow-hidden rounded-3xl p-4">
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--accent)] opacity-[0.06] blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]">
            <Gift size={18} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Secret Box</h2>
            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
              daily loot protocol
            </p>
          </div>
        </div>

        {ready ? (
          <span className="flex items-center gap-1 rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--accent)]">
            <Sparkles size={10} />
            ready
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-black/20 px-2 py-1 font-mono text-[9px] text-[var(--text-muted)]">
            <TimerReset size={11} />
            {formatCooldown(remaining)}
          </span>
        )}
      </div>

      <p className="relative mt-3 text-[10.5px] leading-relaxed text-[var(--text-muted)]">
        Открой одну ячейку из девяти. Внутри — демо-токены или NFT-бейдж для коллекции.
      </p>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {CELLS.map((cell) => {
          const isOpening = openingCell === cell;
          const isLast = lastCell === cell && result !== null;
          const isDisabled = !ready || openingCell !== null;

          return (
            <button
              key={cell}
              type="button"
              onClick={() => handleOpen(cell)}
              disabled={openingCell !== null}
              aria-label={`Ячейка ${cell + 1}`}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-2xl border bg-[var(--surface-soft)] transition-all duration-200',
                isOpening
                  ? 'border-[var(--accent)] shadow-[0_0_24px_rgba(0,255,157,.22)]'
                  : isLast
                    ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                    : 'border-[var(--border)]',
                isDisabled && !isOpening && 'opacity-55',
              )}
            >
              <span className="absolute left-2 top-1.5 font-mono text-[7px] text-[var(--text-faint)]">
                {String(cell + 1).padStart(2, '0')}
              </span>

              <span
                className={cn(
                  'absolute inset-0 grid place-items-center',
                  isOpening && 'animate-pulse',
                )}
              >
                {isOpening ? (
                  <Sparkles size={22} className="animate-[spin-slow_1.8s_linear_infinite] text-[var(--accent)]" />
                ) : isLast ? (
                  <Zap size={22} className="text-[var(--accent)]" />
                ) : (
                  <span className="font-mono text-[20px] font-semibold text-[var(--text-faint)] transition-colors group-hover:text-[var(--accent)]">
                    ?
                  </span>
                )}
              </span>

              <span className="absolute inset-x-2 bottom-1.5 h-px bg-[var(--border-soft)]" />
            </button>
          );
        })}
      </div>

      <div className="relative mt-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-[3px] rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(0,255,157,.6)] transition-all duration-1000"
          style={{ width: `${ready ? 100 : progress}%` }}
        />
      </div>
      <div className="relative mt-1.5 flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
        <span>1 открытие / 30 сек</span>
        <span>{ready ? 'ячейки доступны' : 'recharging'}</span>
      </div>

      {result && (
        <div className="relative mt-3 animate-reveal-up">
          {result.kind === 'tokens' && (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-dim)] p-3">
              <TokenIcon currency={result.currency} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  награда зачислена
                </p>
                <p className="num mt-1 text-[15px] font-semibold text-[var(--accent)]">
                  +{formatToken(result.amount, result.currency)}{' '}
                  <span className="text-[9px]">{result.currency}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[8px] text-[var(--text-faint)]">≈</p>
                <p className="font-mono text-[9px] text-[var(--text-muted)]">
                  {formatFiatFromCurrency(
                    result.amount,
                    result.currency,
                    profile.displayCurrency,
                  )}
                </p>
              </div>
            </div>
          )}

          {result.kind === 'badge' && (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-dim)] p-3">
              <BadgeMedallion badge={result.badge} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  nft badge unlocked
                </p>
                <p className="mt-1 truncate text-[12px] font-semibold text-[var(--text)]">
                  {result.badge.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--accent)]">
                  {result.badge.rarity}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
