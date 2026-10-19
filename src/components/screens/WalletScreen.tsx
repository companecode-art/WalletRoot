import { ArrowDownLeft, ArrowUpRight, Plus, ShieldCheck } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { getDisplayName } from '../../telegram/telegram';
import { BalanceCard } from '../wallet/BalanceCard';
import { AccountsRow } from '../wallet/AccountsRow';
import { WalletPromos } from '../wallet/WalletPromos';
import { RecentTransactions } from '../wallet/RecentTransactions';
import { haptic } from '../../telegram/telegram';

export function WalletScreen() {
  const { profile, telegramUser, openDeposit, openSend, openCreateAccount, openSettings } = useApp();

  if (!profile) return null;

  const greeting = telegramUser ? `Привет, ${getDisplayName(telegramUser)}` : 'Добро пожаловать';

  const actions = [
    {
      label: 'Пополнить',
      caption: 'QR · адрес',
      icon: ArrowDownLeft,
      onClick: () => openDeposit(),
      className: 'border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]',
    },
    {
      label: 'Отправить',
      caption: 'PIN · биометрия',
      icon: ArrowUpRight,
      onClick: () => openSend(),
      className: 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)]',
    },
    {
      label: 'Новый счёт',
      caption: 'USDT · TON · BTC',
      icon: Plus,
      onClick: openCreateAccount,
      className: 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]',
    },
  ];

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            personal root node
          </p>
          <h1 className="mt-1 truncate text-[22px] font-semibold tracking-[-0.035em]">
            {greeting}
          </h1>
        </div>
        <button
          type="button"
          onClick={openSettings}
          className="interactive flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[9px] text-[var(--text-muted)]"
          aria-label="Открыть профиль"
        >
          <ShieldCheck size={11} className="text-[var(--accent)]" />
          {profile.login}
        </button>
      </div>

      <BalanceCard />

      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                haptic('tap');
                action.onClick();
              }}
              className="interactive glass rounded-2xl p-3 text-left"
            >
              <div className={`grid h-8 w-8 place-items-center rounded-xl border ${action.className}`}>
                <Icon size={15} />
              </div>
              <p className="mt-3 text-[11px] font-medium">{action.label}</p>
              <p className="mt-0.5 truncate font-mono text-[7px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
                {action.caption}
              </p>
            </button>
          );
        })}
      </div>

      <AccountsRow />

      <WalletPromos />

      <RecentTransactions />
    </div>
  );
}
