import type {
  Account,
  Badge,
  CreateWalletInput,
  Currency,
  Profile,
  Transaction,
} from '../types';
import { deriveAddress } from '../lib/address';
import { BADGE_POOL, CURRENCY_META } from '../lib/constants';
import { makeId, makeLogin, sha256Hex } from '../lib/crypto';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function makeDemoTxHash(seedHash: string, index: number): string {
  return sha256Hex(`demo-tx:${seedHash}:${index}`);
}

function createAccounts(seedHash: string, now: number): Account[] {
  const specs: Array<{ currency: Currency; label: string; balance: number }> = [
    { currency: 'USDT', label: 'Основной', balance: 845.2 },
    { currency: 'TON', label: 'TON', balance: 12.4 },
    { currency: 'BTC', label: 'BTC', balance: 0.00215 },
  ];

  return specs.map((spec, index) => ({
    id: makeId('acc_'),
    label: spec.label,
    currency: spec.currency,
    network: CURRENCY_META[spec.currency].network,
    address: deriveAddress(seedHash, CURRENCY_META[spec.currency].network, index),
    balance: spec.balance,
    createdAt: now - (30 - index) * DAY,
  }));
}

function createDemoTransactions(
  seedHash: string,
  accounts: Account[],
  now: number,
): Transaction[] {
  const usdt = accounts.find((account) => account.currency === 'USDT')!;
  const ton = accounts.find((account) => account.currency === 'TON')!;
  const btc = accounts.find((account) => account.currency === 'BTC')!;

  return [
    {
      id: makeId('tx_'),
      accountId: usdt.id,
      type: 'in',
      currency: 'USDT',
      amount: 300,
      fee: 0,
      address: deriveAddress(seedHash, 'TRC20', 101),
      status: 'confirmed',
      createdAt: now - 2 * DAY - 3 * HOUR,
      confirmedAt: now - 2 * DAY - 3 * HOUR + 42_000,
      note: 'Пополнение с карты',
      hash: makeDemoTxHash(seedHash, 1),
    },
    {
      id: makeId('tx_'),
      accountId: btc.id,
      type: 'in',
      currency: 'BTC',
      amount: 0.0012,
      fee: 0,
      address: deriveAddress(seedHash, 'BTC', 102),
      status: 'confirmed',
      createdAt: now - 26 * HOUR,
      confirmedAt: now - 26 * HOUR + 7 * MINUTE,
      note: 'Перевод из внешнего кошелька',
      hash: makeDemoTxHash(seedHash, 2),
    },
    {
      id: makeId('tx_'),
      accountId: ton.id,
      type: 'out',
      currency: 'TON',
      amount: 2.4,
      fee: 0.03,
      address: deriveAddress(seedHash, 'TON', 103),
      status: 'confirmed',
      createdAt: now - 18 * HOUR,
      confirmedAt: now - 18 * HOUR + 55_000,
      note: 'Перевод',
      hash: makeDemoTxHash(seedHash, 3),
    },
    {
      id: makeId('tx_'),
      accountId: usdt.id,
      type: 'out',
      currency: 'USDT',
      amount: 45,
      fee: 0.9,
      address: deriveAddress(seedHash, 'TRC20', 104),
      status: 'failed',
      createdAt: now - 5 * HOUR,
      note: 'Сеть отклонила транзакцию',
      hash: makeDemoTxHash(seedHash, 4),
    },
    {
      id: makeId('tx_'),
      accountId: usdt.id,
      type: 'in',
      currency: 'USDT',
      amount: 1.25,
      fee: 0,
      address: deriveAddress(seedHash, 'TRC20', 105),
      status: 'confirmed',
      createdAt: now - 42 * MINUTE,
      confirmedAt: now - 41 * MINUTE,
      note: 'Secret Box · награда',
      hash: makeDemoTxHash(seedHash, 5),
    },
    {
      id: makeId('tx_'),
      accountId: usdt.id,
      type: 'in',
      currency: 'USDT',
      amount: 25,
      fee: 0,
      address: deriveAddress(seedHash, 'TRC20', 106),
      status: 'confirmed',
      createdAt: now - 3 * HOUR,
      confirmedAt: now - 3 * HOUR + 20_000,
      note: 'Приветственный бонус',
      hash: makeDemoTxHash(seedHash, 6),
    },
  ];
}

function createWelcomeBadge(now: number): Badge {
  const definition = BADGE_POOL.find((badge) => badge.id === 'root-genesis')!;
  return {
    ...definition,
    earnedAt: now,
  };
}

export function buildInitialProfile(input: CreateWalletInput): Profile {
  const now = Date.now();
  const accounts = createAccounts(input.seedHash, now);

  return {
    version: 1,
    createdAt: now,
    seedHash: input.seedHash,
    login: makeLogin(input.seedHash),
    pinHash: input.pinHash,
    pinSalt: input.pinSalt,
    biometricsEnabled: input.biometricsEnabled,
    displayCurrency: 'RUB',
    theme: 'black',
    accounts,
    transactions: createDemoTransactions(input.seedHash, accounts, now),
    badges: [createWelcomeBadge(now)],
    secretBoxLastOpened: null,
  };
}

export function reconcilePendingTransactions(profile: Profile): Profile {
  const now = Date.now();
  let changed = false;
  const transactions = profile.transactions.map((transaction) => {
    if (transaction.status === 'pending' && now - transaction.createdAt > 30_000) {
      changed = true;
      return {
        ...transaction,
        status: 'confirmed' as const,
        confirmedAt: now,
      };
    }
    return transaction;
  });

  return changed ? { ...profile, transactions } : profile;
}

export function resetSecretBoxLastOpened(profile: Profile): Profile {
  return { ...profile, secretBoxLastOpened: null };
}
