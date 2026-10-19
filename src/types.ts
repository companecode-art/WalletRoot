export type Currency = 'USDT' | 'TON' | 'BTC';

export type Network = 'TRC20' | 'TON' | 'BTC';

export type DisplayCurrency = 'RUB' | 'USDT';

export type Theme = 'black' | 'matrix';

export type Tab = 'wallet' | 'history' | 'pulse' | 'bonus';

export type TxType = 'in' | 'out';

export type TxStatus = 'pending' | 'confirmed' | 'failed';

export type FeeKey = 'low' | 'medium' | 'high';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Account {
  id: string;
  label: string;
  currency: Currency;
  network: Network;
  address: string;
  balance: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TxType;
  currency: Currency;
  amount: number;
  fee: number;
  address: string;
  status: TxStatus;
  createdAt: number;
  confirmedAt?: number;
  note?: string;
  hash: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  earnedAt: number;
}

export interface Profile {
  version: 1;
  createdAt: number;
  seedHash: string;
  login: string;
  pinHash: string;
  pinSalt: string;
  biometricsEnabled: boolean;
  displayCurrency: DisplayCurrency;
  theme: Theme;
  accounts: Account[];
  transactions: Transaction[];
  badges: Badge[];
  secretBoxLastOpened: number | null;
}

export interface FeeOption {
  key: FeeKey;
  label: string;
  eta: string;
  fee: number;
  level: number;
}

export interface SendInput {
  accountId: string;
  to: string;
  amount: number;
  feeKey: FeeKey;
  note?: string;
}

export type SendResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: string };

export type SecretReward =
  | { kind: 'tokens'; currency: Currency; amount: number }
  | { kind: 'badge'; badge: Badge }
  | { kind: 'cooldown'; remainingMs: number }
  | { kind: 'unavailable' };

export interface ToastItem {
  id: string;
  kind: 'success' | 'error' | 'info' | 'reward';
  title: string;
  message?: string;
}

export type SheetState =
  | { kind: 'none' }
  | { kind: 'deposit'; accountId?: string }
  | { kind: 'send'; accountId?: string }
  | { kind: 'create-account' }
  | { kind: 'settings' }
  | { kind: 'tx'; txId: string };

export interface CreateWalletInput {
  seedHash: string;
  pinHash: string;
  pinSalt: string;
  biometricsEnabled: boolean;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
}

export interface MarketPoint {
  t: number;
  price: number;
}

export interface AssetMarket {
  points: MarketPoint[];
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export type MarketSnapshot = Record<Currency, AssetMarket>;
