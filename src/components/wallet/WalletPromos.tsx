import { ArrowUpRight, Gift, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useMarketSnapshot } from '../../hooks/useMarket';
import { getGasAdvice } from '../../lib/gas';
import { getSecretBoxRemaining } from '../../lib/rewards';
import { FEE_OPTIONS } from '../../lib/constants';
import { formatMarketUsd, formatPercent, formatCooldown } from '../../lib/format';
import { Sparkline } from '../ui/Sparkline';
import { haptic } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

export function WalletPromos() {
  const { setActiveTab, profile } = useApp();
  const market = useMarketSnapshot();
  const ton = market.TON;
  const gas = getGasAdvice();
  const remaining = getSecretBoxRemaining(profile?.secretBoxLastOpened ?? null);
  const averageFee = FEE_OPTIONS.USDT[1].fee;

  const tonSpark = ton.points.slice(-28).map((point) => point.price);
  const min = Math.min(...tonSpark);
  const max = Math.max(...tonSpark);
  const span = max - min || 1;
  const normalized = tonSpark.map((price) => 8 + ((price - min) / span) * 92);

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => {
          haptic('tap');
          setActiveTab('pulse');
        }}
        className="interactive glass relative w-full overflow-hidden rounded-3xl p-4 text-left"
      >
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--accent)]">
                <span className="pulse-dot" />
                live
              </span>
              <span className="label-caps">Crypto Pulse</span>
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              TON / USDT
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-[24px] font-semibold leading-none">
                {formatMarketUsd(ton.price)}
              </span>
              <span
                className={cn(
                  'font-mono text-[10px]',
                  ton.change24h >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]',
                )}
              >
                {formatPercent(ton.change24h)}
              </span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
            <ArrowUpRight size={15} />
          </div>
        </div>
        <Sparkline
          values={normalized}
          className="mt-2 h-12 w-full opacity-80"
          strokeWidth={1.6}
        />
        <div className="relative z-10 mt-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          <span>поток цен · demo websocket</span>
          <span>24ч {formatPercent(ton.change24h)}</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            setActiveTab('bonus');
          }}
          className="interactive glass relative overflow-hidden rounded-2xl p-3.5 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]">
              <Gift size={15} />
            </div>
            {remaining > 0 ? (
              <span className="font-mono text-[8px] text-[var(--text-faint)]">
                {formatCooldown(remaining)}
              </span>
            ) : (
              <span className="rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--accent)]">
                ready
              </span>
            )}
          </div>
          <p className="mt-3 text-[12px] font-semibold">Secret Box</p>
          <p className="mt-0.5 font-mono text-[8px] text-[var(--text-faint)]">
            {remaining > 0 ? 'перезарядка ячейки' : 'открой ячейку'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('tap');
            setActiveTab('bonus');
          }}
          className="interactive glass relative overflow-hidden rounded-2xl p-3.5 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--border-soft)] bg-white/[0.03] text-[var(--warning)]">
              <Zap size={15} />
            </div>
            <span className="font-mono text-[8px] text-[var(--accent)]">
              −{gas.savingsPercent}%
            </span>
          </div>
          <p className="mt-3 text-[12px] font-semibold">Gas Saver</p>
          <p className="mt-0.5 font-mono text-[8px] text-[var(--text-faint)]">
            окно {gas.bestLabel}
          </p>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          <Sparkles size={11} className="text-[var(--accent)]" />
          средняя комиссия
        </span>
        <span className="font-mono text-[9px] text-[var(--text-muted)]">
          {averageFee} USDT · {gas.headline.toLowerCase()}
        </span>
      </div>
    </div>
  );
}
