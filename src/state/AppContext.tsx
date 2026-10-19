import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Account,
  CreateWalletInput,
  Currency,
  DisplayCurrency,
  Profile,
  SecretReward,
  SendInput,
  SendResult,
  SheetState,
  Tab,
  Theme,
  ToastItem,
  Transaction,
} from '../types';
import { deriveAddress, isValidAddress, makeDemoRecipient } from '../lib/address';
import { CURRENCY_META, FEE_OPTIONS } from '../lib/constants';
import { hashPin, makeId, makePinSalt, makeTxHash, sha256Hex } from '../lib/crypto';
import { formatToken, roundAmount } from '../lib/format';
import { getSecretBoxRemaining, rollSecretReward } from '../lib/rewards';
import { buildInitialProfile, reconcilePendingTransactions } from '../services/profile';
import { walletApi } from '../services/api';
import {
  applyTelegramColors,
  getTelegramUser,
  haptic,
  type TelegramUser,
} from '../telegram/telegram';

type AppStatus = 'loading' | 'onboarding' | 'ready';

interface NotifyInput {
  kind: ToastItem['kind'];
  title: string;
  message?: string;
}

interface AppContextValue {
  status: AppStatus;
  profile: Profile | null;
  activeTab: Tab;
  sheet: SheetState;
  toasts: ToastItem[];
  telegramUser: TelegramUser | null;
  theme: Theme;
  setActiveTab: (tab: Tab) => void;
  openDeposit: (accountId?: string) => void;
  openSend: (accountId?: string) => void;
  openCreateAccount: () => void;
  openSettings: () => void;
  openTransaction: (txId: string) => void;
  closeSheet: () => void;
  createWallet: (input: CreateWalletInput) => Promise<void>;
  resetWallet: () => Promise<void>;
  createAccount: (currency: Currency, label?: string) => void;
  simulateIncoming: (accountId: string) => void;
  sendFunds: (input: SendInput) => SendResult;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (currentPin: string, nextPin: string) => Promise<boolean>;
  setBiometrics: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  openSecretBox: () => SecretReward;
  notify: (input: NotifyInput) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppStatus>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTabState] = useState<Tab>('wallet');
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [telegramUser] = useState<TelegramUser | null>(() => getTelegramUser());

  const toastTimers = useRef(new Map<string, number>());
  const confirmTimers = useRef(new Map<string, number>());

  const notify = useCallback((input: NotifyInput) => {
    const item: ToastItem = { id: makeId('toast_'), ...input };
    setToasts((previous) => [...previous.slice(-3), item]);
    const timer = window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== item.id));
      toastTimers.current.delete(item.id);
    }, 4300);
    toastTimers.current.set(item.id, timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
      confirmTimers.current.forEach((timer) => window.clearTimeout(timer));
      confirmTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await walletApi.bootstrap();
        if (cancelled) return;

        if (loaded) {
          const reconciled = reconcilePendingTransactions(loaded);
          setProfile(reconciled);
          setStatus('ready');
          if (reconciled !== loaded) void walletApi.save(reconciled);
        } else {
          setStatus('onboarding');
        }
      } catch {
        if (!cancelled) setStatus('onboarding');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const theme = profile?.theme ?? 'black';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    applyTelegramColors(theme);
  }, [theme]);

  useEffect(() => {
    if (!profile || status !== 'ready') return;
    const timer = window.setTimeout(() => {
      void walletApi.save(profile).catch(() => {
        notify({
          kind: 'error',
          title: 'Ошибка сохранения',
          message: 'Не удалось записать данные на устройство',
        });
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [profile, status, notify]);

  const confirmTransaction = useCallback(
    (txId: string) => {
      const target = profile?.transactions.find(
        (transaction) => transaction.id === txId && transaction.status === 'pending',
      );
      setProfile((previous) => {
        if (!previous) return previous;
        const transactions = previous.transactions.map((transaction) =>
          transaction.id === txId && transaction.status === 'pending'
            ? {
                ...transaction,
                status: 'confirmed' as const,
                confirmedAt: Date.now(),
              }
            : transaction,
        );
        return { ...previous, transactions };
      });
      confirmTimers.current.delete(txId);
      if (!target) return;
      notify({
        kind: 'success',
        title: target.type === 'in' ? 'Зачисление подтверждено' : 'Перевод подтверждён',
        message: `${formatToken(target.amount, target.currency)} ${target.currency}`,
      });
      haptic('success');
    },
    [notify, profile],
  );

  useEffect(() => {
    if (!profile) return;
    profile.transactions
      .filter((transaction) => transaction.status === 'pending')
      .forEach((transaction) => {
        if (confirmTimers.current.has(transaction.id)) return;
        const timer = window.setTimeout(() => confirmTransaction(transaction.id), 6800);
        confirmTimers.current.set(transaction.id, timer);
      });
  }, [profile, confirmTransaction]);

  const setActiveTab = useCallback((tab: Tab) => {
    setActiveTabState(tab);
    haptic('select');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openDeposit = useCallback(
    (accountId?: string) => {
      haptic('tap');
      setSheet({
        kind: 'deposit',
        accountId: accountId ?? profile?.accounts[0]?.id,
      });
    },
    [profile],
  );

  const openSend = useCallback(
    (accountId?: string) => {
      haptic('tap');
      setSheet({
        kind: 'send',
        accountId: accountId ?? profile?.accounts[0]?.id,
      });
    },
    [profile],
  );

  const openCreateAccount = useCallback(() => {
    haptic('tap');
    setSheet({ kind: 'create-account' });
  }, []);

  const openSettings = useCallback(() => {
    haptic('tap');
    setSheet({ kind: 'settings' });
  }, []);

  const openTransaction = useCallback((txId: string) => {
    haptic('tap');
    setSheet({ kind: 'tx', txId });
  }, []);

  const closeSheet = useCallback(() => {
    setSheet({ kind: 'none' });
  }, []);

  const createWallet = useCallback(
    async (input: CreateWalletInput) => {
      const nextProfile = buildInitialProfile(input);
      await walletApi.save(nextProfile);
      setProfile(nextProfile);
      setStatus('ready');
      setActiveTabState('wallet');
      setSheet({ kind: 'none' });
      notify({
        kind: 'success',
        title: 'Кошелёк создан',
        message: 'Добро пожаловать в RootWallet',
      });
      haptic('success');
    },
    [notify],
  );

  const resetWallet = useCallback(async () => {
    await walletApi.reset();
    confirmTimers.current.forEach((timer) => window.clearTimeout(timer));
    confirmTimers.current.clear();
    setProfile(null);
    setStatus('onboarding');
    setSheet({ kind: 'none' });
    setActiveTabState('wallet');
    setToasts([]);
    haptic('warning');
  }, []);

  const createAccount = useCallback(
    (currency: Currency, label?: string) => {
      if (!profile) return;
      const meta = CURRENCY_META[currency];
      const account: Account = {
        id: makeId('acc_'),
        label: label?.trim() || `${currency} счёт`,
        currency,
        network: meta.network,
        address: deriveAddress(profile.seedHash, meta.network, profile.accounts.length),
        balance: 0,
        createdAt: Date.now(),
      };
      setProfile((previous) =>
        previous ? { ...previous, accounts: [...previous.accounts, account] } : previous,
      );
      notify({
        kind: 'success',
        title: 'Счёт создан',
        message: `${account.label} · ${meta.network}`,
      });
      haptic('success');
    },
    [profile, notify],
  );

  const simulateIncoming = useCallback(
    (accountId: string) => {
      if (!profile) return;
      const account = profile.accounts.find((item) => item.id === accountId);
      if (!account) return;
      const amount = CURRENCY_META[account.currency].demoReceive;
      const now = Date.now();
      const transaction: Transaction = {
        id: makeId('tx_'),
        accountId: account.id,
        type: 'in',
        currency: account.currency,
        amount,
        fee: 0,
        address: makeDemoRecipient(profile.seedHash, account.network),
        status: 'pending',
        createdAt: now,
        note: 'Демо-пополнение',
        hash: sha256Hex(`incoming:${profile.seedHash}:${now}`),
      };
      setProfile((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          accounts: previous.accounts.map((item) =>
            item.id === account.id
              ? { ...item, balance: roundAmount(item.balance + amount, account.currency) }
              : item,
          ),
          transactions: [transaction, ...previous.transactions],
        };
      });
      notify({
        kind: 'info',
        title: 'Демо-пополнение',
        message: `${amount} ${account.currency} зачислено в демо-режиме`,
      });
      haptic('tap');
    },
    [profile, notify],
  );

  const sendFunds = useCallback(
    (input: SendInput): SendResult => {
      if (!profile) return { ok: false, error: 'Кошелёк не найден' };

      const account = profile.accounts.find((item) => item.id === input.accountId);
      if (!account) return { ok: false, error: 'Счёт не найден' };

      const recipient = input.to.trim();
      if (!isValidAddress(account.network, recipient)) {
        return { ok: false, error: 'Некорректный адрес для этой сети' };
      }
      if (recipient === account.address) {
        return { ok: false, error: 'Нельзя отправить средства на этот же счёт' };
      }

      const amount = roundAmount(input.amount, account.currency);
      const meta = CURRENCY_META[account.currency];
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: 'Введите сумму перевода' };
      }
      if (amount < meta.minSend) {
        return { ok: false, error: `Минимальная сумма — ${meta.minSend} ${account.currency}` };
      }

      const feeOption = FEE_OPTIONS[account.currency].find((option) => option.key === input.feeKey);
      if (!feeOption) return { ok: false, error: 'Комиссия не найдена' };
      const fee = feeOption.fee;

      if (amount + fee > account.balance + 1e-9) {
        return { ok: false, error: 'Недостаточно средств с учётом комиссии' };
      }

      const now = Date.now();
      const transaction: Transaction = {
        id: makeId('tx_'),
        accountId: account.id,
        type: 'out',
        currency: account.currency,
        amount,
        fee,
        address: recipient,
        status: 'pending',
        createdAt: now,
        note: input.note?.trim() || 'Перевод',
        hash: makeTxHash(`${account.id}:${recipient}:${now}`),
      };

      setProfile((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          accounts: previous.accounts.map((item) =>
            item.id === account.id
              ? {
                  ...item,
                  balance: roundAmount(item.balance - amount - fee, account.currency),
                }
              : item,
          ),
          transactions: [transaction, ...previous.transactions],
        };
      });

      haptic('tap');

      return { ok: true, transaction };
    },
    [profile],
  );

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!profile) return false;
      return hashPin(pin, profile.pinSalt) === profile.pinHash;
    },
    [profile],
  );

  const changePin = useCallback(
    async (currentPin: string, nextPin: string): Promise<boolean> => {
      if (!profile || !/^\d{4}$/.test(nextPin)) return false;
      const valid = hashPin(currentPin, profile.pinSalt) === profile.pinHash;
      if (!valid) return false;
      const pinSalt = makePinSalt();
      const pinHash = hashPin(nextPin, pinSalt);
      setProfile((previous) => (previous ? { ...previous, pinHash, pinSalt } : previous));
      notify({ kind: 'success', title: 'PIN обновлён' });
      haptic('success');
      return true;
    },
    [profile, notify],
  );

  const setBiometrics = useCallback((enabled: boolean) => {
    setProfile((previous) => (previous ? { ...previous, biometricsEnabled: enabled } : previous));
    haptic('select');
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setProfile((previous) => (previous ? { ...previous, theme: nextTheme } : previous));
    haptic('select');
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'black' ? 'matrix' : 'black';
    setTheme(nextTheme);
    notify({
      kind: 'info',
      title: nextTheme === 'matrix' ? 'Matrix mode' : 'Black mode',
      message: nextTheme === 'matrix' ? 'Добро пожаловать в матрицу' : 'Строгий тёмный режим',
    });
  }, [theme, setTheme, notify]);

  const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
    setProfile((previous) =>
      previous ? { ...previous, displayCurrency: currency } : previous,
    );
    haptic('select');
  }, []);

  const openSecretBox = useCallback((): SecretReward => {
    if (!profile) return { kind: 'unavailable' };
    const remaining = getSecretBoxRemaining(profile.secretBoxLastOpened);
    if (remaining > 0) return { kind: 'cooldown', remainingMs: remaining };

    const roll = rollSecretReward(profile.badges);
    const now = Date.now();

    if (roll.kind === 'badge') {
      const badge = { ...roll.badge, earnedAt: now };
      setProfile((previous) =>
        previous
          ? {
              ...previous,
              badges: [...previous.badges, badge],
              secretBoxLastOpened: now,
            }
          : previous,
      );
      haptic('success');
      return { kind: 'badge', badge };
    }

    const account = profile.accounts.find((item) => item.currency === roll.currency);
    if (!account) return { kind: 'unavailable' };

    const transaction: Transaction = {
      id: makeId('tx_'),
      accountId: account.id,
      type: 'in',
      currency: account.currency,
      amount: roll.amount,
      fee: 0,
      address: 'RootWallet Secret Box',
      status: 'confirmed',
      createdAt: now,
      confirmedAt: now,
      note: 'Secret Box · награда',
      hash: sha256Hex(`box:${profile.seedHash}:${now}`),
    };

    setProfile((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        accounts: previous.accounts.map((item) =>
          item.id === account.id
            ? {
                ...item,
                balance: roundAmount(item.balance + roll.amount, account.currency),
              }
            : item,
        ),
        transactions: [transaction, ...previous.transactions],
        secretBoxLastOpened: now,
      };
    });
    haptic('success');
    return { kind: 'tokens', currency: roll.currency, amount: roll.amount };
  }, [profile]);

  const value = useMemo<AppContextValue>(
    () => ({
      status,
      profile,
      activeTab,
      sheet,
      toasts,
      telegramUser,
      theme,
      setActiveTab,
      openDeposit,
      openSend,
      openCreateAccount,
      openSettings,
      openTransaction,
      closeSheet,
      createWallet,
      resetWallet,
      createAccount,
      simulateIncoming,
      sendFunds,
      verifyPin,
      changePin,
      setBiometrics,
      setTheme,
      toggleTheme,
      setDisplayCurrency,
      openSecretBox,
      notify,
      dismissToast,
    }),
    [
      status,
      profile,
      activeTab,
      sheet,
      toasts,
      telegramUser,
      theme,
      setActiveTab,
      openDeposit,
      openSend,
      openCreateAccount,
      openSettings,
      openTransaction,
      closeSheet,
      createWallet,
      resetWallet,
      createAccount,
      simulateIncoming,
      sendFunds,
      verifyPin,
      changePin,
      setBiometrics,
      setTheme,
      toggleTheme,
      setDisplayCurrency,
      openSecretBox,
      notify,
      dismissToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
