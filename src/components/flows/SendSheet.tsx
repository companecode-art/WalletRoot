import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ClipboardPaste,
  Clock3,
  Loader2,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { PinPad } from '../ui/PinPad';
import { TokenIcon } from '../ui/TokenIcon';
import { StatusPill } from '../ui/StatusPill';
import { CopyButton } from '../ui/CopyButton';
import type { FeeKey, Transaction } from '../../types';
import { CURRENCY_META, FEE_OPTIONS, NETWORK_LABEL } from '../../lib/constants';
import { isValidAddress, makeDemoRecipient } from '../../lib/address';
import {
  formatFiatFromCurrency,
  formatToken,
  roundAmount,
  sanitizeAmountInput,
  shortenHash,
} from '../../lib/format';
import { readFromClipboard } from '../../lib/clipboard';
import { haptic } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

type Step = 'form' | 'confirm' | 'processing' | 'success';

function sanitizeForCurrency(value: string, decimals: number): string {
  const clean = sanitizeAmountInput(value);
  const [whole, fraction] = clean.split('.');
  if (fraction === undefined) return whole;
  return `${whole}.${fraction.slice(0, decimals)}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function SendSheet({ accountId }: { accountId?: string }) {
  const {
    profile,
    closeSheet,
    sendFunds,
    verifyPin,
    notify,
    setActiveTab,
  } = useApp();

  const [step, setStep] = useState<Step>('form');
  const [selectedId, setSelectedId] = useState(accountId ?? profile?.accounts[0]?.id ?? '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [feeKey, setFeeKey] = useState<FeeKey>('medium');
  const [attempted, setAttempted] = useState(false);
  const [authMode, setAuthMode] = useState<'bio' | 'pin'>(
    profile?.biometricsEnabled ? 'bio' : 'pin',
  );
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [bioScanning, setBioScanning] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const bioTimer = useRef<number | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    return () => {
      alive.current = false;
      if (bioTimer.current) window.clearTimeout(bioTimer.current);
    };
  }, []);

  const account =
    profile?.accounts.find((item) => item.id === selectedId) ?? profile?.accounts[0];

  const feeOption = account
    ? FEE_OPTIONS[account.currency].find((option) => option.key === feeKey) ??
      FEE_OPTIONS[account.currency][1]
    : null;

  const numericAmount = Number(amount.replace(',', '.')) || 0;
  const fee = feeOption?.fee ?? 0;
  const total = roundAmount(numericAmount + fee, account?.currency ?? 'USDT');
  const meta = account ? CURRENCY_META[account.currency] : null;
  const network = account ? NETWORK_LABEL[account.network] : '';

  const recipientError = useMemo(() => {
    if (!account) return 'Счёт не найден';
    if (!to.trim()) return 'Введите адрес получателя';
    if (!isValidAddress(account.network, to)) return `Адрес не похож на ${network}`;
    if (to.trim() === account.address) return 'Это адрес вашего же счёта';
    return null;
  }, [account, to, network]);

  const amountError = useMemo(() => {
    if (!account) return 'Счёт не найден';
    if (!numericAmount || numericAmount <= 0) return 'Введите сумму';
    if (numericAmount < CURRENCY_META[account.currency].minSend) {
      return `Минимум ${CURRENCY_META[account.currency].minSend} ${account.currency}`;
    }
    if (numericAmount + fee > account.balance + 1e-9) {
      return 'Недостаточно средств с учётом комиссии';
    }
    return null;
  }, [account, numericAmount, fee]);

  if (!profile || !account || !meta || !feeOption) return null;

  const networkLabel = NETWORK_LABEL[account.network];
  const displayCurrency = profile.displayCurrency;
  const liveTransaction = transaction
    ? profile.transactions.find((item) => item.id === transaction.id) ?? transaction
    : null;

  const handleAccountChange = (nextId: string) => {
    setSelectedId(nextId);
    setTo('');
    setAmount('');
    setAttempted(false);
    haptic('select');
  };

  const handlePaste = async () => {
    const text = await readFromClipboard();
    if (!text) {
      notify({
        kind: 'info',
        title: 'Буфер пуст',
        message: 'Вставь адрес вручную или используй демо-адрес',
      });
      return;
    }
    setTo(text.trim());
    haptic('success');
  };

  const fillDemoAddress = () => {
    setTo(makeDemoRecipient(profile.seedHash, account.network));
    setAttempted(false);
    haptic('tap');
  };

  const setMax = () => {
    const max = roundAmount(Math.max(0, account.balance - fee), account.currency);
    setAmount(String(max));
    haptic('tap');
  };

  const handleContinue = () => {
    setAttempted(true);
    if (recipientError || amountError) {
      haptic('error');
      return;
    }
    setPin('');
    setPinError(null);
    setStep('confirm');
    haptic('tap');
  };

  const authorize = async () => {
    if (authBusy) return;
    setAuthBusy(true);

    if (alive.current) setStep('processing');
    await wait(1400);
    if (!alive.current) return;

    const result = sendFunds({
      accountId: account.id,
      to: to.trim(),
      amount: numericAmount,
      feeKey,
    });

    if (!result.ok) {
      setAuthBusy(false);
      setPinError(null);
      setStep('confirm');
      notify({ kind: 'error', title: 'Не удалось отправить', message: result.error });
      haptic('error');
      return;
    }

    setTransaction(result.transaction);
    setStep('success');
    setAuthBusy(false);
    haptic('success');
  };

  const handlePinComplete = async (entered: string) => {
    if (authBusy) return;
    const valid = await verifyPin(entered);
    if (!valid) {
      setPin('');
      setPinError('Неверный PIN');
      haptic('error');
      return;
    }
    setPinError(null);
    await authorize();
  };

  const startBiometrics = () => {
    if (bioScanning || authBusy) return;
    setBioScanning(true);
    haptic('tap');
    bioTimer.current = window.setTimeout(() => {
      setBioScanning(false);
      void authorize();
    }, 1500);
  };

  const requestClose = () => {
    if (step === 'processing') return;
    closeSheet();
  };

  const titles: Record<Step, { title: string; subtitle: string; eyebrow: string }> = {
    form: {
      title: 'Отправка',
      subtitle: `${networkLabel} · комиссия на выбор`,
      eyebrow: 'send funds',
    },
    confirm: {
      title: 'Подтверждение',
      subtitle: 'Проверь детали перед отправкой',
      eyebrow: 'verify transfer',
    },
    processing: {
      title: 'Подписание',
      subtitle: 'Демо-сеть обрабатывает перевод',
      eyebrow: 'broadcasting',
    },
    success: {
      title: 'Готово',
      subtitle: 'Статус обновится автоматически',
      eyebrow: 'transaction sent',
    },
  };

  return (
    <Sheet
      open
      onClose={requestClose}
      title={titles[step].title}
      subtitle={titles[step].subtitle}
      eyebrow={titles[step].eyebrow}
    >
      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <p className="field-label">
              <span>Счёт списания</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {account.balance.toFixed(meta.decimals)} {account.currency}
              </span>
            </p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
              {profile.accounts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAccountChange(item.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors',
                    item.id === account.id
                      ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                      : 'border-[var(--border)] bg-[var(--surface)]',
                  )}
                >
                  <TokenIcon currency={item.currency} size="xs" />
                  <div className="text-left">
                    <p
                      className={cn(
                        'font-mono text-[9px]',
                        item.id === account.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                      )}
                    >
                      {item.currency}
                    </p>
                    <p className="font-mono text-[7px] text-[var(--text-faint)]">
                      {formatToken(item.balance, item.currency)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="field-label">
              <span>Адрес получателя</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--accent)]">
                {networkLabel}
              </span>
            </span>
            <input
              value={to}
              onChange={(event) => {
                setTo(event.target.value.trim());
                setAttempted(false);
              }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={`Адрес ${account.currency} (${networkLabel})`}
              className={cn(
                'field font-mono text-[11px]',
                attempted && recipientError && 'field-error',
              )}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[9px] text-[var(--danger)]">
                {attempted && recipientError ? recipientError : ''}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => void handlePaste()}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.06em] text-[var(--text-faint)] transition-colors hover:text-[var(--accent)]"
                >
                  <ClipboardPaste size={10} />
                  вставить
                </button>
                <span className="h-2.5 w-px bg-[var(--border)]" />
                <button
                  type="button"
                  onClick={fillDemoAddress}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.06em] text-[var(--text-faint)] transition-colors hover:text-[var(--accent)]"
                >
                  <Wand2 size={10} />
                  демо
                </button>
              </div>
            </div>
          </label>

          <div className="surface-inset p-3.5">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[8px]">Сумма</span>
              <span className="font-mono text-[8px] text-[var(--text-faint)]">
                доступно {formatToken(account.balance, account.currency)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <input
                value={amount.replace('.', ',')}
                onChange={(event) => {
                  setAmount(sanitizeForCurrency(event.target.value, meta.decimals));
                  setAttempted(false);
                }}
                inputMode="decimal"
                placeholder="0,00"
                aria-label="Сумма перевода"
                className="w-full min-w-0 bg-transparent font-mono text-[30px] font-semibold tracking-[-0.04em] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
              />
              <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)]">
                {account.currency}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-[9px] text-[var(--text-faint)]">
                ≈ {formatFiatFromCurrency(numericAmount, account.currency, displayCurrency)}
              </span>
              <button
                type="button"
                onClick={setMax}
                className="rounded-md border border-[var(--border-accent)] bg-[var(--accent-dim)] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--accent)]"
              >
                max
              </button>
            </div>
            {attempted && amountError && (
              <p className="mt-1.5 text-[9px] text-[var(--danger)]">{amountError}</p>
            )}
          </div>

          <div>
            <div className="field-label">
              <span>Комиссия сети</span>
              <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                <Zap size={9} />
                gas saver
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {FEE_OPTIONS[account.currency].map((option) => {
                const active = feeKey === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setFeeKey(option.key);
                      setAttempted(false);
                      haptic('select');
                    }}
                    aria-pressed={active}
                    className={cn(
                      'rounded-2xl border p-2.5 text-left transition-all',
                      active
                        ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                        : 'border-[var(--border)] bg-[var(--surface)]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'font-mono text-[8px] uppercase tracking-[0.08em]',
                          active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                        )}
                      >
                        {option.label}
                      </span>
                      <div className="flex gap-[2px]">
                        {[1, 2, 3].map((bar) => (
                          <span
                            key={bar}
                            className={cn(
                              'h-2 w-[2px] rounded-full',
                              bar <= option.level
                                ? active
                                  ? 'bg-[var(--accent)]'
                                  : 'bg-[var(--text-muted)]'
                                : 'bg-white/10',
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="num mt-2 text-[11px] font-medium">
                      {formatToken(option.fee, account.currency)}
                    </p>
                    <p className="mt-0.5 font-mono text-[7px] text-[var(--text-faint)]">
                      {option.eta}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface-inset flex items-center justify-between px-3.5 py-3">
            <div>
              <p className="text-[10px] text-[var(--text-muted)]">Итого к списанию</p>
              <p className="mt-0.5 font-mono text-[9px] text-[var(--text-faint)]">
                сумма + комиссия
              </p>
            </div>
            <div className="text-right">
              <p className="num text-[15px] font-semibold">
                {formatToken(numericAmount, account.currency)}{' '}
                <span className="text-[9px] text-[var(--text-muted)]">{account.currency}</span>
              </p>
              <p className="mt-0.5 font-mono text-[8px] text-[var(--text-faint)]">
                + {formatToken(fee, account.currency)} комиссия
              </p>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleContinue}
            className="justify-between"
            icon={<Sparkles size={15} />}
          >
            <span>Продолжить</span>
            <span className="font-mono text-[9px] opacity-60">PIN</span>
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-center font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
            <ShieldCheck size={9} />
            проверка адреса · {networkLabel} · demo network
          </p>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setPin('');
              setPinError(null);
              haptic('tap');
            }}
            className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft size={12} />
            Изменить данные
          </button>

          <div className="glass-accent rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps text-[8px]">К отправке</p>
              <div className="flex items-center gap-1.5">
                <TokenIcon currency={account.currency} size="xs" />
                <span className="font-mono text-[9px] text-[var(--text-muted)]">
                  {account.currency} · {networkLabel}
                </span>
              </div>
            </div>
            <p className="num mt-3 text-[32px] font-semibold leading-none tracking-[-0.04em]">
              {formatToken(numericAmount, account.currency)}{' '}
              <span className="text-[13px] font-medium text-[var(--text-muted)]">
                {account.currency}
              </span>
            </p>
            <p className="mt-2 font-mono text-[9px] text-[var(--text-faint)]">
              ≈ {formatFiatFromCurrency(numericAmount, account.currency, displayCurrency)}
            </p>

            <div className="mt-4 space-y-2 border-t border-[var(--border-soft)] pt-3">
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-[var(--text-muted)]">Получатель</span>
                <span className="truncate font-mono text-[9px] text-[var(--text)]">
                  {to.slice(0, 8)}…{to.slice(-6)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-[var(--text-muted)]">Комиссия</span>
                <span className="font-mono text-[9px] text-[var(--text)]">
                  {formatToken(fee, account.currency)} {account.currency} · {feeOption.eta}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-[var(--text-muted)]">Итого</span>
                <span className="num text-[11px] font-semibold">
                  {formatToken(total, account.currency)} {account.currency}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-[var(--text-muted)]">Счёт</span>
                <span className="font-mono text-[9px] text-[var(--text)]">
                  {account.label} · {formatToken(account.balance, account.currency)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[var(--border-soft)] bg-black/20 px-2.5 py-2">
              <span className="min-w-0 break-all font-mono text-[8px] text-[var(--text-faint)]">
                {to}
              </span>
              <CopyButton text={to} size="sm" label="Скопировать адрес" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="field-label mb-0">
                <span>Подтверждение</span>
              </span>
              {profile.biometricsEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (bioTimer.current) window.clearTimeout(bioTimer.current);
                    setBioScanning(false);
                    setAuthMode(authMode === 'bio' ? 'pin' : 'bio');
                    setPin('');
                    setPinError(null);
                    haptic('select');
                  }}
                  className="font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--text-faint)] transition-colors hover:text-[var(--accent)]"
                >
                  {authMode === 'bio' ? 'использовать PIN' : 'использовать Face ID'}
                </button>
              )}
            </div>

            {authMode === 'bio' && profile.biometricsEnabled ? (
              <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
                <div className="flex flex-col items-center">
                  <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border border-[var(--border-accent)] bg-[var(--accent-faint)] text-[var(--accent)]">
                    {bioScanning ? (
                      <>
                        <ScanFace size={34} />
                        <span className="absolute inset-x-3 h-px animate-scan bg-[var(--accent)] shadow-[0_0_10px_rgba(0,255,157,.8)]" />
                      </>
                    ) : (
                      <ScanFace size={34} />
                    )}
                  </div>
                  <p className="mt-3 text-[12px] font-medium">
                    {bioScanning ? 'Сканируем Face ID…' : 'Биометрия'}
                  </p>
                  <p className="mt-1 max-w-[240px] text-center font-mono text-[8px] uppercase leading-relaxed tracking-[0.08em] text-[var(--text-faint)]">
                    эмуляция · данные не отправляются
                  </p>
                  <Button
                    variant="secondary"
                    fullWidth
                    className="mt-4"
                    loading={bioScanning || authBusy}
                    onClick={startBiometrics}
                    icon={!bioScanning ? <ScanFace size={15} /> : undefined}
                  >
                    {bioScanning ? 'Подтверждаем…' : 'Подтвердить Face ID'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-3 pb-3 pt-4">
                <PinPad
                  value={pin}
                  onChange={(value) => {
                    setPin(value);
                    setPinError(null);
                  }}
                  onComplete={(entered) => void handlePinComplete(entered)}
                  disabled={authBusy}
                  error={pinError}
                  hint="Введи PIN из 4 цифр"
                  onBiometrics={
                    profile.biometricsEnabled
                      ? () => {
                          if (bioTimer.current) window.clearTimeout(bioTimer.current);
                          setBioScanning(false);
                          setAuthMode('bio');
                          setPin('');
                          setPinError(null);
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
            <Clock3 size={9} />
            операция будет отправлена в demo network
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center py-14">
          <div className="relative grid h-28 w-28 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full border border-[var(--border-accent)]" />
            <span className="absolute inset-3 animate-[spin-slow_4s_linear_infinite] rounded-full border border-dashed border-[var(--border-accent)]" />
            <span className="absolute inset-7 rounded-full border border-[var(--border-soft)] bg-[var(--surface)]" />
            <Loader2 size={26} className="relative animate-spin text-[var(--accent)]" />
          </div>
          <p className="mt-7 text-[15px] font-semibold">Подписываем транзакцию</p>
          <p className="mt-1.5 max-w-[260px] text-center text-[10px] leading-relaxed text-[var(--text-muted)]">
            Проверяем подпись и отправляем в демо-сеть. Обычно это занимает несколько секунд.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
            <span className="pulse-dot" />
            network handshake
          </div>
        </div>
      )}

      {step === 'success' && liveTransaction && (
        <div className="flex flex-col items-center py-6">
          <div className="relative grid h-24 w-24 place-items-center">
            <span className="absolute inset-0 rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] shadow-[0_0_50px_rgba(0,255,157,.16)]" />
            <span className="absolute inset-3 rounded-full border border-dashed border-[var(--border-accent)] opacity-60" />
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_30px_rgba(0,255,157,.4)]">
              <Check size={24} strokeWidth={3} />
            </span>
          </div>

          <p className="mt-5 text-[20px] font-semibold tracking-[-0.03em]">Транзакция отправлена</p>
          <p className="mt-1.5 max-w-[280px] text-center text-[10px] leading-relaxed text-[var(--text-muted)]">
            {formatToken(liveTransaction.amount, liveTransaction.currency)}{' '}
            {liveTransaction.currency} уходят на адрес {to.slice(0, 7)}…{to.slice(-5)}
          </p>

          <div className="mt-3">
            <StatusPill status={liveTransaction.status} size="md" />
          </div>

          <div className="mt-5 w-full divide-y divide-[var(--border-soft)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5">
            <div className="flex items-center justify-between py-2.5 text-[10px]">
              <span className="text-[var(--text-muted)]">Сеть</span>
              <span className="font-mono text-[9px]">{networkLabel}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[10px]">
              <span className="text-[var(--text-muted)]">Хэш</span>
              <span className="font-mono text-[9px]">{shortenHash(liveTransaction.hash)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[10px]">
              <span className="text-[var(--text-muted)]">Комиссия</span>
              <span className="font-mono text-[9px]">
                {formatToken(liveTransaction.fee, liveTransaction.currency)}{' '}
                {liveTransaction.currency}
              </span>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-center font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            <Clock3 size={10} />
            {liveTransaction.status === 'pending'
              ? 'подтверждение обычно до 30 секунд'
              : 'перевод подтверждён сетью'}
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-2">
            <Button variant="secondary" onClick={requestClose}>
              Понятно
            </Button>
            <Button
              onClick={() => {
                closeSheet();
                setActiveTab('history');
              }}
            >
              В историю
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
