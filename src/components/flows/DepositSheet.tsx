import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownToLine, Copy, Info, Network, TriangleAlert, Zap } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { Sheet } from '../ui/Sheet';
import { TokenIcon } from '../ui/TokenIcon';
import { CopyButton } from '../ui/CopyButton';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { CURRENCY_META, NETWORK_LABEL } from '../../lib/constants';
import { paymentUri } from '../../lib/address';
import { formatToken } from '../../lib/format';
import { copyToClipboard } from '../../lib/clipboard';
import { haptic } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

export function DepositSheet({ accountId }: { accountId?: string }) {
  const { profile, closeSheet, simulateIncoming, notify } = useApp();
  const [selectedId, setSelectedId] = useState(accountId ?? profile?.accounts[0]?.id ?? '');
  const [simulated, setSimulated] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!profile) return null;

  const account = profile.accounts.find((item) => item.id === selectedId) ?? profile.accounts[0];
  if (!account) return null;
  const meta = CURRENCY_META[account.currency];
  const network = NETWORK_LABEL[meta.network];

  const handleSimulate = () => {
    if (simulated) return;
    simulateIncoming(account.id);
    setSimulated(true);
    timer.current = window.setTimeout(() => setSimulated(false), 1800);
  };

  const copyAddress = async () => {
    const copied = await copyToClipboard(account.address);
    if (copied) {
      haptic('success');
      notify({ kind: 'success', title: 'Адрес скопирован', message: `${account.currency} · ${network}` });
    }
  };

  return (
    <Sheet
      open
      onClose={closeSheet}
      eyebrow="deposit"
      title="Пополнение"
      subtitle="Отсканируй QR или скопируй адрес кошелька"
    >
      <div className="space-y-4">
        {profile.accounts.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {profile.accounts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  setSimulated(false);
                  haptic('select');
                }}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors',
                  item.id === account.id
                    ? 'border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
                )}
              >
                <TokenIcon currency={item.currency} size="xs" />
                <span className="font-mono text-[9px]">{item.currency}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center">
          <div className="qr-frame">
            <QRCodeSVG
              value={paymentUri(account)}
              size={188}
              level="H"
              marginSize={2}
              bgColor="#f2fff9"
              fgColor="#06140c"
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#06140c]/10 bg-[#f2fff9]">
                <Logo size={27} />
              </div>
            </div>
            <span className="qr-corner -left-1 -top-1 rounded-tl border-l-2 border-t-2" />
            <span className="qr-corner -right-1 -top-1 rounded-tr border-r-2 border-t-2" />
            <span className="qr-corner -bottom-1 -left-1 rounded-bl border-b-2 border-l-2" />
            <span className="qr-corner -bottom-1 -right-1 rounded-br border-b-2 border-r-2" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <TokenIcon currency={account.currency} size="sm" />
            <div>
              <p className="text-[12px] font-semibold">
                {account.currency} <span className="text-[var(--text-faint)]">·</span>{' '}
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{network}</span>
              </p>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {account.label}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-inset flex items-center gap-2 p-2 pl-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
              адрес кошелька
            </p>
            <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-[var(--text)]">
              {account.address}
            </p>
          </div>
          <CopyButton text={account.address} label="Скопировать адрес" />
        </div>

        <button
          type="button"
          onClick={() => void copyAddress()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--accent)]"
        >
          <Copy size={12} />
          Скопировать адрес
        </button>

        <div className="grid grid-cols-2 gap-2">
          <div className="surface-inset px-3 py-2.5">
            <p className="label-caps text-[7px]">Сеть</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px]">
              <Network size={11} className="text-[var(--accent)]" />
              {network}
            </p>
          </div>
          <div className="surface-inset px-3 py-2.5">
            <p className="label-caps text-[7px]">Зачисление</p>
            <p className="mt-1 font-mono text-[10px] text-[var(--accent)]">без комиссии</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-[rgba(255,200,87,.2)] bg-[var(--warning-dim)] px-3.5 py-3">
          <TriangleAlert size={14} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
            Отправляй только <span className="text-[var(--text)]">{account.currency}</span> по сети{' '}
            <span className="text-[var(--text)]">{network}</span>. Другая сеть или токен могут
            привести к потере средств.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--accent-dim)] text-[var(--accent)]">
              <Zap size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium">Демо-пополнение</p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--text-muted)]">
                Зачислим {formatToken(meta.demoReceive, account.currency)} {account.currency} без
                реальной транзакции.
              </p>
            </div>
          </div>
          <Button
            fullWidth
            variant="secondary"
            size="sm"
            loading={simulated}
            onClick={handleSimulate}
            className="mt-3"
            icon={!simulated ? <ArrowDownToLine size={13} /> : undefined}
          >
            {simulated ? 'Зачислено' : `Симулировать +${formatToken(meta.demoReceive, account.currency)} ${account.currency}`}
          </Button>
        </div>

        <p className="flex items-center justify-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          <Info size={9} />
          демо-адрес · не отправляй реальные активы
        </p>
      </div>
    </Sheet>
  );
}
