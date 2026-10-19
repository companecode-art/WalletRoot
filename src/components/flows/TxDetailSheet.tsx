import { ArrowDownLeft, ArrowUpRight, CircleAlert, Clock3, Copy } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { Sheet } from '../ui/Sheet';
import { StatusPill } from '../ui/StatusPill';
import { CopyButton } from '../ui/CopyButton';
import { CURRENCY_META, NETWORK_LABEL } from '../../lib/constants';
import {
  formatDateTime,
  formatFiatFromCurrency,
  formatToken,
  shortenHash,
} from '../../lib/format';
import { copyToClipboard } from '../../lib/clipboard';
import { haptic } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

export function TxDetailSheet({ txId }: { txId: string }) {
  const { profile, closeSheet, notify } = useApp();

  if (!profile) return null;
  const transaction = profile.transactions.find((item) => item.id === txId);
  if (!transaction) return null;

  const incoming = transaction.type === 'in';
  const meta = CURRENCY_META[transaction.currency];
  const network = NETWORK_LABEL[meta.network];
  const account = profile.accounts.find((item) => item.id === transaction.accountId);

  const copyHash = async () => {
    const copied = await copyToClipboard(transaction.hash);
    if (copied) {
      haptic('success');
      notify({ kind: 'success', title: 'Хэш скопирован' });
    }
  };

  return (
    <Sheet
      open
      onClose={closeSheet}
      eyebrow="transaction"
      title="Детали операции"
      subtitle={formatDateTime(transaction.createdAt)}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6">
          <div
            className={cn(
              'grid h-14 w-14 place-items-center rounded-2xl border',
              incoming
                ? 'border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-white/[0.03] text-[var(--text-muted)]',
            )}
          >
            {incoming ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
          </div>
          <p
            className={cn(
              'num mt-4 text-[28px] font-semibold leading-none',
              incoming && 'text-[var(--accent)]',
            )}
          >
            {incoming ? '+' : '−'}
            {formatToken(transaction.amount, transaction.currency)}{' '}
            <span className="text-[13px] font-medium text-[var(--text-muted)]">
              {transaction.currency}
            </span>
          </p>
          <p className="mt-2 font-mono text-[10px] text-[var(--text-faint)]">
            {formatFiatFromCurrency(transaction.amount, transaction.currency)}
          </p>
          <StatusPill status={transaction.status} size="md" className="mt-3" />
        </div>

        {transaction.status === 'pending' && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-[rgba(255,200,87,.2)] bg-[var(--warning-dim)] p-3">
            <Clock3 size={14} className="mt-0.5 shrink-0 text-[var(--warning)]" />
            <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
              Демо-сеть подтвердит операцию автоматически через несколько секунд. Статус
              обновится в истории.
            </p>
          </div>
        )}

        {transaction.status === 'failed' && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-[rgba(255,77,109,.22)] bg-[var(--danger-dim)] p-3">
            <CircleAlert size={14} className="mt-0.5 shrink-0 text-[var(--danger)]" />
            <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
              Операция не прошла. Средства не были списаны. Причина: сеть отклонила транзакцию.
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <Row label="Счёт" value={account?.label ?? '—'} sub={`${network} · ${transaction.currency}`} />
          <Row label="Направление" value={incoming ? 'Входящая' : 'Исходящая'} />
          <Row
            label="Контрагент"
            value={transaction.address}
            mono
            copyable={!transaction.address.startsWith('RootWallet')}
            copyText={transaction.address}
          />
          {transaction.note && <Row label="Комментарий" value={transaction.note} />}
          <Row
            label="Комиссия"
            value={
              transaction.fee > 0
                ? `${formatToken(transaction.fee, transaction.currency)} ${transaction.currency}`
                : '0'
            }
            mono
          />
          <Row
            label="Хэш"
            value={shortenHash(transaction.hash)}
            mono
            copyable
            copyText={transaction.hash}
            copyLabel="Скопировать хэш"
          />
          <Row label="Дата" value={formatDateTime(transaction.createdAt)} />
          {transaction.confirmedAt && (
            <Row label="Подтверждено" value={formatDateTime(transaction.confirmedAt)} />
          )}
        </div>

        <button
          type="button"
          onClick={() => void copyHash()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--accent)]"
        >
          <Copy size={12} />
          Скопировать хэш
        </button>

        <p className="text-center font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
          demo transaction · hash is not valid on-chain
        </p>
      </div>
    </Sheet>
  );
}

function Row({
  label,
  value,
  sub,
  mono = false,
  copyable = false,
  copyText,
  copyLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  copyable?: boolean;
  copyText?: string;
  copyLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border-soft)] px-3.5 py-3 last:border-b-0">
      <span className="shrink-0 pt-0.5 text-[10px] text-[var(--text-muted)]">{label}</span>
      <div className="flex min-w-0 items-start gap-2 text-right">
        <div className="min-w-0">
          <p
            className={cn(
              'break-all text-[10px] text-[var(--text)]',
              mono && 'font-mono text-[9px]',
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 font-mono text-[8px] text-[var(--text-faint)]">{sub}</p>}
        </div>
        {copyable && copyText && (
          <CopyButton text={copyText} size="sm" label={copyLabel ?? 'Скопировать'} />
        )}
      </div>
    </div>
  );
}
