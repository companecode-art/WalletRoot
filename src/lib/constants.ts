import type { BadgeDefinition, Currency, FeeOption, Network } from '../types';

export const APP_VERSION = '0.1.0';

export const STORAGE_KEY = 'rootwallet.profile.v1';

export const DEMO_RATES: Record<Currency, number> = {
  USDT: 92.4,
  TON: 486.5,
  BTC: 9_842_000,
};

export const DEMO_RATES_NOTE = 'Курсы демонстрационные и не являются офертой';

export const DEMO_PORTFOLIO_CHANGE = 2.41;

export const FEE_OPTIONS: Record<Currency, FeeOption[]> = {
  USDT: [
    { key: 'low', label: 'Low', eta: '~12 мин', fee: 0.4, level: 1 },
    { key: 'medium', label: 'Medium', eta: '~3 мин', fee: 0.9, level: 2 },
    { key: 'high', label: 'High', eta: '< 30 сек', fee: 2.2, level: 3 },
  ],
  TON: [
    { key: 'low', label: 'Low', eta: '~12 мин', fee: 0.012, level: 1 },
    { key: 'medium', label: 'Medium', eta: '~3 мин', fee: 0.03, level: 2 },
    { key: 'high', label: 'High', eta: '< 30 сек', fee: 0.065, level: 3 },
  ],
  BTC: [
    { key: 'low', label: 'Low', eta: '~12 мин', fee: 0.000012, level: 1 },
    { key: 'medium', label: 'Medium', eta: '~3 мин', fee: 0.000028, level: 2 },
    { key: 'high', label: 'High', eta: '< 30 сек', fee: 0.00006, level: 3 },
  ],
};

export const CURRENCIES: Currency[] = ['USDT', 'TON', 'BTC'];

export const NETWORK_LABEL: Record<Network, string> = {
  TRC20: 'TRC-20',
  TON: 'TON',
  BTC: 'Bitcoin',
};

export const CURRENCY_META: Record<
  Currency,
  {
    name: string;
    network: Network;
    symbol: string;
    decimals: number;
    minSend: number;
    demoReceive: number;
    tint: string;
    tintSoft: string;
  }
> = {
  USDT: {
    name: 'Tether USD',
    network: 'TRC20',
    symbol: '₮',
    decimals: 2,
    minSend: 1,
    demoReceive: 50,
    tint: '#26a17b',
    tintSoft: 'rgba(38, 161, 123, .16)',
  },
  TON: {
    name: 'Toncoin',
    network: 'TON',
    symbol: '◈',
    decimals: 3,
    minSend: 0.1,
    demoReceive: 2,
    tint: '#0098ea',
    tintSoft: 'rgba(0, 152, 234, .14)',
  },
  BTC: {
    name: 'Bitcoin',
    network: 'BTC',
    symbol: '₿',
    decimals: 6,
    minSend: 0.00001,
    demoReceive: 0.0005,
    tint: '#f7931a',
    tintSoft: 'rgba(247, 147, 26, .12)',
  },
};

export const BADGE_POOL: BadgeDefinition[] = [
  {
    id: 'root-genesis',
    name: 'Root Genesis',
    description: 'Первый кошелёк RootWallet. Начало твоей ветки.',
    rarity: 'common',
  },
  {
    id: 'neon-whale',
    name: 'Neon Whale',
    description: 'Секретная ячейка открыла доступ к глубинам ликвидности.',
    rarity: 'rare',
  },
  {
    id: 'gas-goblin',
    name: 'Gas Goblin',
    description: 'Тот, кто всегда знает, когда сеть спит.',
    rarity: 'common',
  },
  {
    id: 'matrix-runner',
    name: 'Matrix Runner',
    description: 'Скользит между блоками быстрее, чем моргает терминал.',
    rarity: 'epic',
  },
  {
    id: 'block-oracle',
    name: 'Block Oracle',
    description: 'Видел будущее в 12 словах. Больше не расскажет.',
    rarity: 'legendary',
  },
  {
    id: 'degen-pulse',
    name: 'Degen Pulse',
    description: 'Пульс рынка синхронизирован с твоим сердцем.',
    rarity: 'rare',
  },
];

export const SECRET_BOX_COOLDOWN_MS = 30_000;
