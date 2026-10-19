import { ArrowDownLeft, Plus } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { CURRENCY_META, NETWORK_LABEL } from '../../lib/constants';
import { formatFiatFromCurrency, formatToken, shortenAddress } from '../../lib/format';
import { getStaticSparkline } from '../../lib/market';
import { TokenIcon } from '../ui/TokenIcon';
import { Sparkline } from '../ui/Sparkline';
import { haptic } from '../../telegram/telegram';

export function AccountsRow() {
  const { profile, openDeposit, openCreateAccount } = useApp();

  if (!profile) return null;

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Счета</h2>
          <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[8px] text-[var(--text-faint)]">
            {profile.accounts.length.toString().padStart(2, '0')}
          </span>
        </div>
        <button
          type="button"
          onClick={openCreateAccount}
          className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          <Plus size={12} />
          Добавить
        </button>
      </div>

      <div className="no-scrollbar scroll-snap-x -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {profile.accounts.map((account, index) => {
          const meta = CURRENCY_META[account.currency];
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => {
                haptic('tap');
                openDeposit(account.id);
              }}
              className="interactive glass relative w-[236px] shrink-0 scroll-snap-item overflow-hidden rounded-3xl p-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <TokenIcon currency={account.currency} size="sm" />
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--text)]">{account.label}</p>
                    <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                      {account.currency} · {NETWORK_LABEL[meta.network]}
                    </p>
                  </div>
                </div>
                <span className="rounded-md border border-[var(--border)] bg-black/20 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="mt-4">
                <p className="label-caps text-[8px]">Доступно</p>
                <p className="num mt-1 text-[22px] font-semibold leading-none">
                  {formatToken(account.balance, account.currency)}
                  <span className="ml-1.5 font-mono text-[9px] font-medium text-[var(--text-muted)]">
                    {account.currency}
                  </span>
                </p>
                <p className="mt-1.5 font-mono text-[9px] text-[var(--text-faint)]">
                  ≈{' '}
                  {formatFiatFromCurrency(
                    account.balance,
                    account.currency,
                    profile.displayCurrency,
                  )}
                </p>
              </div>

              <div className="relative z-10 mt-4 flex items-center justify-between border-t border-[var(--border-soft)] pt-2.5">
                <span className="font-mono text-[8px] text-[var(--text-faint)]">
                  {shortenAddress(account.address, 5, 4)}
                </span>
                <span className="flex items-center gap-1 text-[9px] font-medium text-[var(--accent)]">
                  <ArrowDownLeft size={10} />
                  Получить
                </span>
              </div>

              <Sparkline
                values={getStaticSparkline(account.currency, 18)}
                filled
                className="pointer-events-none absolute -bottom-1 right-0 h-16 w-32 opacity-[0.12]"
              />
            </button>
          );
        })}

        <button
          type="button"
          onClick={openCreateAccount}
          className="interactive flex min-h-[171px] w-[124px] shrink-0 scroll-snap-item flex-col items-center justify-center gap-2.5 rounded-3xl border border-dashed border-[var(--border-accent)] bg-[var(--accent-faint)] text-[var(--accent)]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-dim)]">
            <Plus size={18} />
          </span>
          <span className="text-[10px] font-medium">Новый счёт</span>
          <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
            usdt · ton · btc
          </span>
        </button>
      </div>
    </section>
  );
}
