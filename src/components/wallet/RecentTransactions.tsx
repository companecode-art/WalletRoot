import { ArrowUpRight, Receipt } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TransactionRow } from './TransactionRow';

export function RecentTransactions() {
  const { profile, setActiveTab, openDeposit } = useApp();

  if (!profile) return null;

  const transactions = [...profile.transactions]
    .sort((first, second) => second.createdAt - first.createdAt)
    .slice(0, 4);

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Последние операции</h2>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
        >
          Все
          <ArrowUpRight size={11} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-3xl px-4 py-8 text-center">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
            <Receipt size={18} />
          </div>
          <p className="mt-3 text-[12px] font-medium">История пуста</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Первое пополнение запустит статистику
          </p>
          <button
            type="button"
            onClick={() => openDeposit()}
            className="mt-3 text-[10px] font-medium text-[var(--accent)]"
          >
            Пополнить счёт
          </button>
        </div>
      ) : (
        <div className="glass divide-y divide-white/[0.035] rounded-3xl px-3.5">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </section>
  );
}
