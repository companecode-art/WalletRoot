import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Transaction } from '../../types';
import { useApp } from '../../state/AppContext';
import { formatFiatFromCurrency, formatTime, formatToken, shortenAddress } from '../../lib/format';
import { CURRENCY_META, NETWORK_LABEL } from '../../lib/constants';
import { StatusPill } from '../ui/StatusPill';
import { cn } from '../../lib/cn';

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const { openTransaction, profile } = useApp();
  const incoming = transaction.type === 'in';
  const meta = CURRENCY_META[transaction.currency];
  const title = transaction.note ?? (incoming ? 'Получено' : 'Отправлено');
  const displayCurrency = profile?.displayCurrency ?? 'RUB';

  return (
    <button
      type="button"
      onClick={() => openTransaction(transaction.id)}
      className="group flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-white/[0.015]"
    >
      <div
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-2xl border',
          incoming
            ? 'border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
            : 'border-[var(--border)] bg-white/[0.03] text-[var(--text-muted)]',
        )}
      >
        {incoming ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[12.5px] font-medium text-[var(--text)]">{title}</p>
          <StatusPill status={transaction.status} />
        </div>
        <p className="mt-1 truncate font-mono text-[9px] text-[var(--text-faint)]">
          {incoming ? 'от' : 'к'} {shortenAddress(transaction.address)} ·{' '}
          {NETWORK_LABEL[meta.network]} · {formatTime(transaction.createdAt)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'num text-[12.5px] font-semibold',
            incoming ? 'text-[var(--accent)]' : 'text-[var(--text)]',
          )}
        >
          {incoming ? '+' : '−'}
          {formatToken(transaction.amount, transaction.currency)}{' '}
          <span className="text-[9px] font-medium text-[var(--text-muted)]">
            {transaction.currency}
          </span>
        </p>
        <p className="mt-1 font-mono text-[9px] text-[var(--text-faint)]">
          {formatFiatFromCurrency(transaction.amount, transaction.currency, displayCurrency)}
        </p>
      </div>
    </button>
  );
}
