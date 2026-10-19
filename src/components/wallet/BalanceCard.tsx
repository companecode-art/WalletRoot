import { useState } from 'react';
import { Eye, EyeOff, Layers3, LockKeyhole, TrendingUp } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { DEMO_PORTFOLIO_CHANGE, DEMO_RATES } from '../../lib/constants';
import {
  formatDisplayMoney,
  formatPercent,
  formatRub,
  formatToken,
  rubValue,
} from '../../lib/format';
import { getStaticSparkline } from '../../lib/market';
import { Sparkline } from '../ui/Sparkline';
import { haptic } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

export function BalanceCard() {
  const { profile, setDisplayCurrency } = useApp();
  const [hidden, setHidden] = useState(false);

  if (!profile) return null;

  const totalRub = profile.accounts.reduce(
    (sum, account) => sum + rubValue(account.balance, account.currency),
    0,
  );
  const displayCurrency = profile.displayCurrency;
  const primary = formatDisplayMoney(totalRub, displayCurrency);
  const secondary =
    displayCurrency === 'RUB'
      ? `${formatToken(totalRub / DEMO_RATES.USDT, 'USDT')} USDT`
      : formatRub(totalRub);

  return (
    <section className="glass-accent hero-glow relative overflow-hidden rounded-[30px] p-5">
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-[var(--border-accent)] opacity-40" />
      <div className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full border border-[var(--border-accent)] opacity-25" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="label-caps">Общий баланс</span>
          <button
            type="button"
            aria-label={hidden ? 'Показать баланс' : 'Скрыть баланс'}
            onClick={() => setHidden((previous) => !previous)}
            className="rounded-md p-0.5 text-[var(--text-faint)] transition-colors hover:text-[var(--accent)]"
          >
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>

        <div className="flex rounded-lg border border-[var(--border)] bg-black/20 p-0.5">
          {(['RUB', 'USDT'] as const).map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => {
                setDisplayCurrency(currency);
                haptic('select');
              }}
              aria-pressed={displayCurrency === currency}
              className={cn(
                'rounded-[7px] px-2 py-1 font-mono text-[8px] font-semibold tracking-[0.08em] transition-all',
                displayCurrency === currency
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : 'text-[var(--text-faint)]',
              )}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-4">
        <p
          className={cn(
            'num text-[clamp(30px,9vw,40px)] font-semibold leading-none tracking-[-0.05em] text-[var(--text)]',
            hidden && 'tracking-[0.12em]',
          )}
        >
          {hidden ? '••••••' : primary}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {hidden ? '••••' : `≈ ${secondary}`}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] px-2 py-0.5 font-mono text-[9px] font-medium text-[var(--accent)]">
            <TrendingUp size={10} />
            {formatPercent(DEMO_PORTFOLIO_CHANGE)}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
            за 24ч
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[var(--border-soft)] pt-3">
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          <Layers3 size={11} />
          {profile.accounts.length}{' '}
          {profile.accounts.length === 1 ? 'счёт' : profile.accounts.length < 5 ? 'счёта' : 'счетов'}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          <LockKeyhole size={10} className="text-[var(--accent)]" />
          PIN защита
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          <span className="pulse-dot" />
          demo network
        </span>
      </div>

      <Sparkline
        values={getStaticSparkline('BTC', 28)}
        filled
        className="pointer-events-none absolute -bottom-1 right-0 h-24 w-52 opacity-[0.13]"
      />
    </section>
  );
}
