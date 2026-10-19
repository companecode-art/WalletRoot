import { useState } from 'react';
import { Check, Layers3, Plus } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { TokenIcon } from '../ui/TokenIcon';
import type { Currency } from '../../types';
import { CURRENCIES, CURRENCY_META, NETWORK_LABEL } from '../../lib/constants';
import { cn } from '../../lib/cn';
import { haptic } from '../../telegram/telegram';

export function CreateAccountSheet() {
  const { profile, createAccount, closeSheet } = useApp();
  const [selected, setSelected] = useState<Currency>('USDT');
  const [label, setLabel] = useState('');

  if (!profile) return null;

  const handleCreate = () => {
    createAccount(selected, label);
    closeSheet();
  };

  return (
    <Sheet
      open
      onClose={closeSheet}
      eyebrow="new account"
      title="Новый счёт"
      subtitle="Мультивалютный счёт с адресом в демо-сети"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {CURRENCIES.map((currency) => {
            const meta = CURRENCY_META[currency];
            const existing = profile.accounts.filter((account) => account.currency === currency).length;
            const active = selected === currency;

            return (
              <button
                key={currency}
                type="button"
                onClick={() => {
                  setSelected(currency);
                  setLabel('');
                  haptic('select');
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all',
                  active
                    ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-accent)]',
                )}
              >
                <TokenIcon currency={currency} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold">
                    {currency}{' '}
                    <span className="font-normal text-[var(--text-muted)]">· {meta.name}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                    {NETWORK_LABEL[meta.network]} · уже {existing}
                  </p>
                </div>
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full border',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border-[var(--border)] text-transparent',
                  )}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>

        <label className="block">
          <span className="field-label">
            <span>Название счёта</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
              необязательно
            </span>
          </span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value.slice(0, 24))}
            placeholder={`${selected} счёт`}
            className="field text-[13px]"
          />
        </label>

        <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-3.5">
          <Layers3 size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <div>
            <p className="text-[10.5px] font-medium text-[var(--text)]">Адрес создаётся автоматически</p>
            <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--text-muted)]">
              В демо-версии новый адрес выводится детерминированно из seed-хеша. В продакшене —
              из HD-кошелька на бэкенде.
            </p>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleCreate}
          icon={<Plus size={16} />}
          className="justify-between"
        >
          <span>Создать счёт</span>
          <span className="font-mono text-[9px] opacity-60">{selected}</span>
        </Button>
      </div>
    </Sheet>
  );
}
