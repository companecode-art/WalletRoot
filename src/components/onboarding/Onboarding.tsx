import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  EyeOff,
  Gift,
  Layers3,
  LockKeyhole,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo, Wordmark } from '../ui/Logo';
import { PinPad } from '../ui/PinPad';
import { Switch } from '../ui/Switch';
import { useApp } from '../../state/AppContext';
import { generateSeed, hashPin, makePinSalt, makeLogin, seedFingerprint } from '../../lib/crypto';
import { getDisplayName } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

type Step = 'welcome' | 'seed' | 'confirm' | 'pin';
type PinPhase = 'create' | 'confirm' | 'ready';

const STEP_INDEX: Record<Exclude<Step, 'welcome'>, number> = {
  seed: 1,
  confirm: 2,
  pin: 3,
};

const features: Array<{ icon: typeof Wallet; title: string; caption: string }> = [
  { icon: Wallet, title: '3 сети', caption: 'USDT · TON · BTC' },
  { icon: Layers3, title: 'Мультисчета', caption: 'Баланс в RUB' },
  { icon: Gift, title: 'Secret Box', caption: 'Награды и бейджи' },
];

export function Onboarding() {
  const { createWallet, telegramUser, notify } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [seed] = useState(() => generateSeed());
  const [accepted, setAccepted] = useState(false);
  const [challenge] = useState(() => {
    const first = 1 + Math.floor(Math.random() * 11);
    let second = 1 + Math.floor(Math.random() * 12);
    while (second === first) second = 1 + Math.floor(Math.random() * 12);
    return [first, second] as const;
  });
  const [confirmWords, setConfirmWords] = useState<[string, string]>(['', '']);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinPhase, setPinPhase] = useState<PinPhase>('create');
  const [pinError, setPinError] = useState<string | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const words = seed.split(' ');
  const displayName = getDisplayName(telegramUser);
  const stepNumber = step === 'welcome' ? 0 : STEP_INDEX[step];

  const goToConfirm = () => {
    if (!accepted) return;
    setSeedError(null);
    setStep('confirm');
  };

  const verifyWords = () => {
    const normalized = confirmWords.map((word) => word.trim().toLowerCase());
    const firstCorrect = normalized[0] === words[challenge[0] - 1];
    const secondCorrect = normalized[1] === words[challenge[1] - 1];

    if (!firstCorrect || !secondCorrect) {
      setSeedError('Слова не совпадают. Проверь нумерацию и попробуй снова.');
      return;
    }
    setSeedError(null);
    setStep('pin');
  };

  const handlePinComplete = (entered: string) => {
    if (pinPhase === 'create') {
      setPin(entered);
      setPinConfirm('');
      setPinError(null);
      setPinPhase('confirm');
      return;
    }

    if (pinPhase === 'confirm') {
      if (entered !== pin) {
        setPinError('PIN не совпал. Начни заново.');
        setPin('');
        setPinConfirm('');
        setPinPhase('create');
        return;
      }
      setPinError(null);
      setPinPhase('ready');
    }
  };

  const handleCreate = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setCreateError('Сначала задай PIN из 4 цифр');
      return;
    }
    setBusy(true);
    setCreateError(null);
    try {
      const seedHash = seedFingerprint(seed);
      const pinSalt = makePinSalt();
      await createWallet({
        seedHash,
        pinHash: hashPin(pin, pinSalt),
        pinSalt,
        biometricsEnabled,
      });
    } catch {
      setCreateError('Не удалось создать кошелёк. Попробуй ещё раз.');
      notify({
        kind: 'error',
        title: 'Ошибка создания',
        message: 'Локальное хранилище недоступно',
      });
      setBusy(false);
    }
  };

  const seedHashPreview = makeLogin(seedFingerprint(seed));

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      {step === 'welcome' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} withGlow />
            <Wordmark />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Назад"
            onClick={() => {
              if (step === 'confirm') setStep('seed');
              else if (step === 'pin') setStep('confirm');
              else setStep('welcome');
            }}
            className="interactive grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="label-caps">
                Шаг {stepNumber} из 3
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                RootWallet setup
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={cn(
                    'h-[3px] flex-1 rounded-full transition-colors duration-300',
                    index <= stepNumber ? 'bg-[var(--accent)]' : 'bg-white/[0.08]',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'welcome' && (
        <div key="welcome" className="flex flex-1 animate-reveal-up flex-col">
          <div className="relative mx-auto mb-7 mt-7 grid h-[132px] w-[132px] place-items-center">
            <div className="absolute inset-0 animate-[spin-slow_24s_linear_infinite] rounded-full border border-dashed border-[var(--border-accent)]" />
            <div className="absolute inset-4 rounded-full border border-[var(--border-accent)]" />
            <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-[0.06] blur-2xl" />
            <Logo size={84} withGlow />
            <span className="absolute -right-1 top-2 rounded-full border border-[var(--border-accent)] bg-[var(--surface-strong)] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--accent)]">
              online
            </span>
          </div>

          <div className="text-center">
            <p className="label-caps mb-2">Telegram mini app · demo build</p>
            <h1 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--text)]">
              Крипто-кошелёк
              <br />
              <span className="neon-text">нового уровня.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[320px] text-[13px] leading-relaxed text-[var(--text-muted)]">
              {telegramUser ? `${displayName}, твой` : 'Твой'} защищённый хаб для USDT, TON и BTC —
              с мультисчетами, живым пульсом рынка и наградами.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass rounded-2xl px-2.5 py-3 text-center"
                >
                  <Icon size={17} className="mx-auto text-[var(--accent)]" />
                  <p className="mt-2 text-[11px] font-semibold text-[var(--text)]">{feature.title}</p>
                  <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                    {feature.caption}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6">
            <Button
              fullWidth
              size="lg"
              onClick={() => setStep('seed')}
              icon={<Sparkles size={16} />}
              className="justify-between"
            >
              <span>Создать кошелёк</span>
              <ArrowRight size={16} />
            </Button>
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--warning-dim)] px-3 py-2.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[var(--warning)]" />
              <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
                Демо-прототип. Все балансы и награды тестовые. Не используй реальные средства
                и настоящую seed-фразу.
              </p>
            </div>
            <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
              no real funds · local storage only
            </p>
          </div>
        </div>
      )}

      {step === 'seed' && (
        <div key="seed" className="flex animate-reveal-up flex-col pt-7">
          <p className="label-caps mb-2 text-[var(--accent)]">Seed-фраза · 12 слов</p>
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.04em]">
            Запиши фразу.
            <br />
            Она показывается один раз.
          </h2>
          <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
            Эти 12 слов восстанавливают кошелёк. В демо они не сохраняются на устройстве —
            останется только хеш и логин.
          </p>

          <div className="glass-accent relative mt-5 overflow-hidden rounded-3xl p-4">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--accent)] opacity-[0.08] blur-2xl" />
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                <LockKeyhole size={11} className="text-[var(--accent)]" />
                секретная фраза
              </span>
              <span className="rounded-md border border-[var(--border)] bg-black/30 px-1.5 py-0.5 font-mono text-[8px] text-[var(--text-faint)]">
                {seedHashPreview}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {words.map((word, index) => (
                <div
                  key={`${word}-${index}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-black/25 px-2.5 py-2"
                >
                  <span className="w-4 shrink-0 text-right font-mono text-[8px] text-[var(--text-faint)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[12px] text-[var(--text)]">{word}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[rgba(255,200,87,.2)] bg-[var(--warning-dim)] px-3.5 py-3">
            <EyeOff size={15} className="mt-0.5 shrink-0 text-[var(--warning)]" />
            <p className="text-[10.5px] leading-relaxed text-[var(--text-muted)]">
              Никому не показывай фразу. Любой, кто её увидит, получит доступ к кошельку.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAccepted((previous) => !previous)}
            className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left transition-colors hover:border-[var(--border-accent)]"
          >
            <span
              className={cn(
                'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all',
                accepted
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'border-[var(--border)] bg-black/20',
              )}
            >
              {accepted && <Check size={13} strokeWidth={3} />}
            </span>
            <span className="text-[11.5px] leading-relaxed text-[var(--text-muted)]">
              Я записал(а) фразу в надёжном месте и понимаю, что она больше не будет показана.
            </span>
          </button>

          <div className="mt-5">
            <Button
              fullWidth
              size="lg"
              disabled={!accepted}
              onClick={goToConfirm}
              className="justify-between"
            >
              <span>Я сохранил(а) фразу</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div key="confirm" className="flex animate-reveal-up flex-col pt-7">
          <p className="label-caps mb-2 text-[var(--accent)]">Проверка памяти</p>
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.04em]">
            Восстанови
            <br />
            два слова.
          </h2>
          <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
            Это подтвердит, что фраза действительно сохранена. Регистр не важен.
          </p>

          <div className="mt-6 space-y-3">
            {challenge.map((wordIndex, index) => (
              <label key={wordIndex} className="block">
                <span className="field-label">
                  <span>Слово #{wordIndex}</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                    позиция {String(wordIndex).padStart(2, '0')}
                  </span>
                </span>
                <input
                  value={confirmWords[index]}
                  onChange={(event) => {
                    const next = [...confirmWords] as [string, string];
                    next[index] = event.target.value;
                    setConfirmWords(next);
                    setSeedError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Введи слово"
                  className={cn('field font-mono text-[14px]', seedError && 'field-error')}
                />
              </label>
            ))}
          </div>

          {seedError && (
            <p className="mt-3 animate-fade-in rounded-xl border border-[rgba(255,77,109,.24)] bg-[var(--danger-dim)] px-3 py-2.5 text-[11px] text-[var(--danger)]">
              {seedError}
            </p>
          )}

          <div className="mt-5">
            <Button
              fullWidth
              size="lg"
              onClick={verifyWords}
              disabled={confirmWords.some((word) => !word.trim())}
              className="justify-between"
            >
              <span>Проверить фразу</span>
              <ArrowRight size={16} />
            </Button>
            <button
              type="button"
              onClick={() => setStep('seed')}
              className="mt-3 w-full text-center text-[11px] text-[var(--text-muted)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
            >
              Вернуться к seed-фразе
            </button>
          </div>
        </div>
      )}

      {step === 'pin' && (
        <div key="pin" className="flex flex-1 animate-reveal-up flex-col pt-7">
          <div className="flex flex-1 flex-col justify-center">
            <p className="label-caps mb-2 text-[var(--accent)]">Локальная защита</p>
            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.04em]">
              {pinPhase === 'create' && 'Придумай PIN-код.'}
              {pinPhase === 'confirm' && 'Повтори PIN-код.'}
              {pinPhase === 'ready' && 'Защита готова.'}
            </h2>
            <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
              {pinPhase === 'ready'
                ? 'PIN понадобится для каждого перевода. Биометрия — эмуляция Face ID / Touch ID.'
                : 'Четыре цифры для подтверждения отправки средств. Не используй дату рождения.'}
            </p>

            <div className="mt-6">
              {pinPhase !== 'ready' ? (
                <PinPad
                  value={pinPhase === 'create' ? pin : pinConfirm}
                  onChange={(value) => {
                    if (pinPhase === 'create') setPin(value);
                    else setPinConfirm(value);
                    setPinError(null);
                  }}
                  onComplete={handlePinComplete}
                  error={pinError}
                  hint={pinPhase === 'create' ? 'Введи 4 цифры' : 'Повтори, чтобы подтвердить'}
                  disabled={busy}
                />
              ) : (
                <div className="space-y-3">
                  <div className="glass-accent flex items-center gap-3 rounded-2xl p-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-dim)] text-[var(--accent)]">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold">PIN из 4 цифр установлен</p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                        pbkdf2 · 100k iterations
                      </p>
                    </div>
                    <LockKeyhole size={15} className="text-[var(--accent)]" />
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-black/20 text-[var(--text-muted)]">
                      <ScanFace size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium">Биометрия</p>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        Эмуляция Face ID для подтверждения
                      </p>
                    </div>
                    <Switch
                      checked={biometricsEnabled}
                      onChange={setBiometricsEnabled}
                      label="Биометрия"
                    />
                  </div>

                  <div className="rounded-2xl border border-[var(--border-soft)] bg-black/15 p-3.5">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                      seed fingerprint
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] text-[var(--text-muted)]">
                      {seedHashPreview} · {words.length} words · local only
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {createError && (
            <p className="mt-4 rounded-xl border border-[rgba(255,77,109,.24)] bg-[var(--danger-dim)] px-3 py-2.5 text-[11px] text-[var(--danger)]">
              {createError}
            </p>
          )}

          {pinPhase === 'ready' && (
            <div className="mt-5">
              <Button
                fullWidth
                size="lg"
                loading={busy}
                onClick={() => void handleCreate()}
                icon={<Sparkles size={16} />}
                className="justify-between"
              >
                <span>Создать кошелёк</span>
                <ArrowRight size={16} />
              </Button>
              <button
                type="button"
                onClick={() => {
                  setPinPhase('create');
                  setPin('');
                  setPinError(null);
                }}
                className="mt-3 w-full text-center text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]"
              >
                Изменить PIN
              </button>
            </div>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            <ShieldCheck size={10} />
            demo build · not for real funds
          </p>
        </div>
      )}
    </div>
  );
}
