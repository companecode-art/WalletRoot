import { useState } from 'react';
import {
  ChevronDown,
  Database,
  KeyRound,
  Moon,
  Palette,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { Sheet } from '../ui/Sheet';
import { UserAvatar } from '../ui/UserAvatar';
import { CopyButton } from '../ui/CopyButton';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { APP_VERSION, CURRENCY_META } from '../../lib/constants';
import { getDisplayName, isInsideTelegram } from '../../telegram/telegram';
import { formatToken } from '../../lib/format';
import { cn } from '../../lib/cn';

const themes = [
  {
    id: 'black' as const,
    name: 'Black',
    caption: 'strict dark',
    icon: Moon,
    bg: '#050507',
    accent: '#00ff9d',
    line: 'rgba(242,255,249,.2)',
  },
  {
    id: 'matrix' as const,
    name: 'Matrix',
    caption: 'terminal green',
    icon: Terminal,
    bg: '#010603',
    accent: '#42ff8f',
    line: 'rgba(66,255,143,.35)',
  },
];

export function SettingsSheet() {
  const {
    profile,
    telegramUser,
    closeSheet,
    setTheme,
    setDisplayCurrency,
    setBiometrics,
    changePin,
    simulateIncoming,
    resetWallet,
    notify,
  } = useApp();

  const [pinOpen, setPinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [repeatPin, setRepeatPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  if (!profile) return null;

  const firstAccount = profile.accounts[0];
  const demoAmount = firstAccount ? CURRENCY_META[firstAccount.currency].demoReceive : 0;

  const handlePinUpdate = async () => {
    setPinError(null);
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(nextPin) || !/^\d{4}$/.test(repeatPin)) {
      setPinError('Все поля должны содержать 4 цифры');
      return;
    }
    if (nextPin !== repeatPin) {
      setPinError('Новые PIN-коды не совпадают');
      return;
    }
    if (nextPin === currentPin) {
      setPinError('Новый PIN должен отличаться от текущего');
      return;
    }

    setPinBusy(true);
    const success = await changePin(currentPin, nextPin);
    setPinBusy(false);

    if (!success) {
      setPinError('Текущий PIN указан неверно');
      return;
    }

    setCurrentPin('');
    setNextPin('');
    setRepeatPin('');
    setPinOpen(false);
  };

  const handleReset = async () => {
    setResetBusy(true);
    await resetWallet();
  };

  const digits = (value: string) => value.replace(/\D/g, '').slice(0, 4);

  return (
    <Sheet
      open
      onClose={closeSheet}
      eyebrow="profile & security"
      title="Настройки"
      subtitle="Внешний вид, защита и демо-инструменты"
    >
      <div className="space-y-4">
        <div className="glass-accent rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={telegramUser} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">
                {telegramUser ? getDisplayName(telegramUser) : 'Гостевой режим'}
              </p>
              <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                {telegramUser?.username
                  ? `@${telegramUser.username}`
                  : isInsideTelegram()
                    ? 'telegram account'
                    : 'outside telegram'}
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--accent)]">
              <span className="pulse-dot" />
              active
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-black/20 px-3 py-2.5">
            <div>
              <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                root login
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.05em] text-[var(--text)]">
                {profile.login}
              </p>
            </div>
            <CopyButton
              text={profile.login}
              size="sm"
              label="Скопировать логин"
              onCopied={() => notify({ kind: 'success', title: 'Логин скопирован' })}
            />
          </div>
        </div>

        <section className="glass rounded-3xl p-4">
          <SectionTitle icon={Palette} title="Оформление" caption="тема интерфейса" />

          <div className="mt-3 grid grid-cols-2 gap-2">
            {themes.map((item) => {
              const Icon = item.icon;
              const active = profile.theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-2xl border p-2.5 text-left transition-all',
                    active
                      ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                      : 'border-[var(--border)] bg-black/10',
                  )}
                >
                  <div
                    className="relative h-[54px] overflow-hidden rounded-xl border p-2"
                    style={{ background: item.bg, borderColor: item.line }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="h-1.5 w-6 rounded-full"
                        style={{ background: item.accent }}
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full border"
                        style={{ borderColor: item.accent, background: `${item.accent}22` }}
                      />
                    </div>
                    <div className="mt-2 h-1 w-12 rounded-full" style={{ background: item.line }} />
                    <div className="mt-1 h-1 w-8 rounded-full" style={{ background: item.line }} />
                    <div
                      className="absolute bottom-2 right-2 font-mono text-[7px] uppercase tracking-[0.1em]"
                      style={{ color: item.accent }}
                    >
                      RW-01
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Icon size={11} className={active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                    {item.caption}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-3">
            <div>
              <p className="text-[11px] font-medium">Валюта отображения</p>
              <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">Баланс и итоги</p>
            </div>
            <div className="flex rounded-lg border border-[var(--border)] bg-black/20 p-0.5">
              {(['RUB', 'USDT'] as const).map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => setDisplayCurrency(currency)}
                  aria-pressed={profile.displayCurrency === currency}
                  className={cn(
                    'rounded-[7px] px-2.5 py-1.5 font-mono text-[8px] transition-colors',
                    profile.displayCurrency === currency
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'text-[var(--text-faint)]',
                  )}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="glass rounded-3xl p-4">
          <SectionTitle icon={ShieldCheck} title="Безопасность" caption="локальная защита" />

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-black/15 px-3 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
              <ScanFace size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium">Биометрия</p>
              <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">
                Эмуляция Face ID / Touch ID
              </p>
            </div>
            <Switch
              checked={profile.biometricsEnabled}
              onChange={setBiometrics}
              label="Биометрия"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setPinOpen((previous) => !previous);
              setPinError(null);
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-black/15 px-3 py-3 text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
              <KeyRound size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium">PIN-код</p>
              <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">Изменить код доступа</p>
            </div>
            <ChevronDown
              size={15}
              className={cn(
                'text-[var(--text-faint)] transition-transform',
                pinOpen && 'rotate-180',
              )}
            />
          </button>

          {pinOpen && (
            <div className="mt-2 animate-reveal-up rounded-2xl border border-[var(--border-soft)] bg-black/20 p-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Текущий', value: currentPin, setter: setCurrentPin },
                  { label: 'Новый', value: nextPin, setter: setNextPin },
                  { label: 'Повтор', value: repeatPin, setter: setRepeatPin },
                ].map((field) => (
                  <label key={field.label} className="block">
                    <span className="mb-1 block font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                      {field.label}
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      maxLength={4}
                      value={field.value}
                      onChange={(event) => {
                        field.setter(digits(event.target.value));
                        setPinError(null);
                      }}
                      placeholder="••••"
                      className="field px-2 py-2.5 text-center font-mono text-[14px] tracking-[0.25em]"
                    />
                  </label>
                ))}
              </div>

              {pinError && (
                <p className="mt-2 animate-fade-in text-[9px] text-[var(--danger)]">{pinError}</p>
              )}

              <Button
                fullWidth
                size="sm"
                loading={pinBusy}
                onClick={() => void handlePinUpdate()}
                className="mt-2.5"
              >
                Обновить PIN
              </Button>
              <p className="mt-2 text-center font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                pbkdf2-sha256 · 100k iterations
              </p>
            </div>
          )}
        </section>

        <section className="glass rounded-3xl p-4">
          <SectionTitle icon={Zap} title="Демо-инструменты" caption="для тестирования" />

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-black/15 px-3 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-accent)] bg-[var(--accent-dim)] text-[var(--accent)]">
              <RotateCcw size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium">Входящий перевод</p>
              <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">
                +{formatToken(demoAmount, firstAccount?.currency ?? 'USDT')}{' '}
                {firstAccount?.currency ?? 'USDT'} · эмуляция
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => firstAccount && simulateIncoming(firstAccount.id)}
              disabled={!firstAccount}
            >
              Зачислить
            </Button>
          </div>

          {!resetConfirm ? (
            <button
              type="button"
              onClick={() => setResetConfirm(true)}
              className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-[rgba(255,77,109,.2)] bg-[var(--danger-dim)] px-3 py-3 text-left"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-[rgba(255,77,109,.28)] text-[var(--danger)]">
                <Trash2 size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-[var(--danger)]">Сбросить кошелёк</p>
                <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">
                  Удалить локальные данные и seed-хеш
                </p>
              </div>
            </button>
          ) : (
            <div className="mt-2 animate-reveal-up rounded-2xl border border-[rgba(255,77,109,.24)] bg-[var(--danger-dim)] p-3">
              <p className="text-[11px] font-semibold text-[var(--danger)]">Удалить кошелёк?</p>
              <p className="mt-1 text-[9px] leading-relaxed text-[var(--text-muted)]">
                Все счета, награды и история будут удалены из локального хранилища. Действие
                необратимо. Seed-фраза не сохраняется, восстановить демо-кошелёк нельзя.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResetConfirm(false)}
                  disabled={resetBusy}
                >
                  Отмена
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={resetBusy}
                  onClick={() => void handleReset()}
                >
                  Сбросить
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="glass rounded-3xl p-4">
          <SectionTitle icon={Database} title="О сборке" caption="prototype info" />
          <div className="mt-3 divide-y divide-[var(--border-soft)] overflow-hidden rounded-2xl border border-[var(--border-soft)]">
            <InfoRow label="Версия" value={`v${APP_VERSION}`} />
            <InfoRow label="Хранилище" value="localStorage" />
            <InfoRow label="Seed fingerprint" value={`${profile.seedHash.slice(0, 14)}…`} mono />
            <InfoRow label="Telegram SDK" value={isInsideTelegram() ? 'connected' : 'web fallback'} />
          </div>
          <p className="mt-3 text-[9px] leading-relaxed text-[var(--text-muted)]">
            RootWallet — демо-прототип, не кастодиальный сервис и не финансовый инструмент.
            Seed-фраза генерируется локально, показывается один раз и не сохраняется.
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
            <Smartphone size={9} />
            telegram mini app · build {APP_VERSION}
          </div>
        </section>
      </div>
    </Sheet>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  caption,
}: {
  icon: typeof ShieldCheck;
  title: string;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[var(--accent)]" />
      <h3 className="text-[12px] font-semibold">{title}</h3>
      <span className="ml-auto font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
        {caption}
      </span>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-[9px] text-[var(--text-muted)]">{label}</span>
      <span className={cn('text-[9px] text-[var(--text)]', mono && 'font-mono text-[8px]')}>
        {value}
      </span>
    </div>
  );
}
