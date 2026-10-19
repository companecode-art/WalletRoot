import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Transaction } from '../../types';
import { formatDayLabel, formatDisplayMoney, plural, rubValue } from '../../lib/format';
import { TransactionRow } from '../wallet/TransactionRow';
import { cn } from '../../lib/cn';
import { haptic } from '../../telegram/telegram';

type Filter = 'all' | 'in' | 'out';

const filters: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'in', label: 'Входящие' },
  { key: 'out', label: 'Исходящие' },
];

export function HistoryScreen() {
  const { profile, openDeposit } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const transactions = useMemo(
    () =>
      [...(profile?.transactions ?? [])].sort(
        (first, second) => second.createdAt - first.createdAt,
      ),
    [profile?.transactions],
  );

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? transactions
        : transactions.filter((transaction) => transaction.type === filter),
    [transactions, filter],
  );

  const groups = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    filtered.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      date.setHours(0, 0, 0, 0);
      const key = date.getTime();
      const list = map.get(key) ?? [];
      list.push(transaction);
      map.set(key, list);
    });
    return Array.from(map.entries())
      .sort(([first], [second]) => second - first)
      .map(([timestamp, items]) => ({ timestamp, items }));
  }, [filtered]);

  if (!profile) return null;

  const successful = transactions.filter((transaction) => transaction.status !== 'failed');
  const totalIn = successful
    .filter((transaction) => transaction.type === 'in')
    .reduce(
      (sum, transaction) => sum + rubValue(transaction.amount, transaction.currency),
      0,
    );
  const totalOut = successful
    .filter((transaction) => transaction.type === 'out')
    .reduce(
      (sum, transaction) =>
        sum + rubValue(transaction.amount + transaction.fee, transaction.currency),
      0,
    );

  const counts = {
    all: transactions.length,
    in: transactions.filter((transaction) => transaction.type === 'in').length,
    out: transactions.filter((transaction) => transaction.type === 'out').length,
  };

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            ledger stream
          </p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em]">История</h1>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[9px] text-[var(--text-muted)]">
          {counts.all.toString().padStart(2, '0')} tx
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass relative overflow-hidden rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5">
            <ArrowDownLeft size={12} className="text-[var(--accent)]" />
            <span className="label-caps text-[8px]">Получено</span>
          </div>
          <p className="num mt-2.5 text-[17px] font-semibold text-[var(--accent)]">
            +{formatDisplayMoney(totalIn, profile.displayCurrency)}
          </p>
          <p className="mt-1 font-mono text-[8px] text-[var(--text-faint)]">
            {counts.in} {plural(counts.in, 'операция', 'операции', 'операций')}
          </p>
        </div>
        <div className="glass relative overflow-hidden rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight size={12} className="text-[var(--danger)]" />
            <span className="label-caps text-[8px]">Отправлено</span>
          </div>
          <p className="num mt-2.5 text-[17px] font-semibold">
            −{formatDisplayMoney(totalOut, profile.displayCurrency)}
          </p>
          <p className="mt-1 font-mono text-[8px] text-[var(--text-faint)]">
            {counts.out} {plural(counts.out, 'операция', 'операции', 'операций')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setFilter(item.key);
              haptic('select');
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-all',
              filter === item.key
                ? 'bg-[var(--accent-dim)] text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--border-accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
          >
            {item.key === 'in' && <ArrowDownLeft size={12} />}
            {item.key === 'out' && <ArrowUpRight size={12} />}
            {item.label}
            <span
              className={cn(
                'rounded font-mono text-[8px]',
                filter === item.key ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]',
              )}
            >
              {counts[item.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-3xl px-5 py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
            {transactions.length === 0 ? <Receipt size={20} /> : <Inbox size={20} />}
          </div>
          <p className="mt-3 text-[13px] font-medium">
            {transactions.length === 0 ? 'Операций пока нет' : 'Ничего не найдено'}
          </p>
          <p className="mt-1 max-w-[240px] text-[10px] leading-relaxed text-[var(--text-muted)]">
            {transactions.length === 0
              ? 'Пополни счёт или открой демо-перевод, чтобы увидеть историю.'
              : 'В этом фильтре нет операций. Попробуй другой вид.'}
          </p>
          {transactions.length === 0 ? (
            <button
              type="button"
              onClick={() => openDeposit()}
              className="mt-4 text-[10px] font-medium text-[var(--accent)]"
            >
              Пополнить счёт
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-4 flex items-center gap-1.5 text-[10px] font-medium text-[var(--accent)]"
            >
              <RotateCcw size={11} />
              Сбросить фильтр
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.timestamp}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  {formatDayLabel(group.timestamp)}
                </p>
                <div className="h-px flex-1 bg-[var(--border-soft)]" />
                <span className="font-mono text-[8px] text-[var(--text-faint)]">
                  {group.items.length.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="glass divide-y divide-white/[0.035] rounded-3xl px-3.5">
                {group.items.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}
