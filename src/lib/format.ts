import type { Currency, DisplayCurrency } from '../types';
import { CURRENCY_META, DEMO_RATES } from './constants';

const tokenFormatterCache = new Map<Currency, Intl.NumberFormat>();

function tokenFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = tokenFormatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: CURRENCY_META[currency].decimals,
    });
    tokenFormatterCache.set(currency, formatter);
  }
  return formatter;
}

export function formatToken(amount: number, currency: Currency): string {
  return tokenFormatter(currency).format(amount);
}

export function formatTokenWithSymbol(amount: number, currency: Currency): string {
  return `${formatToken(amount, currency)} ${currency}`;
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMarketUsd(amount: number): string {
  const digits = amount >= 1000 ? 0 : amount >= 100 ? 2 : amount >= 1 ? 3 : 4;
  return `$${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)}`;
}

export function formatFiatFromCurrency(
  amount: number,
  currency: Currency,
  target: DisplayCurrency = 'RUB',
): string {
  const rub = amount * DEMO_RATES[currency];
  if (target === 'USDT') {
    return `${formatToken(rub / DEMO_RATES.USDT, 'USDT')} USDT`;
  }
  return formatRub(rub);
}

export function rubValue(amount: number, currency: Currency): number {
  return amount * DEMO_RATES[currency];
}

export function toDisplayCurrency(rub: number, target: DisplayCurrency): number {
  return target === 'RUB' ? rub : rub / DEMO_RATES.USDT;
}

export function formatDisplayMoney(
  rub: number,
  target: DisplayCurrency,
  options: { compact?: boolean } = {},
): string {
  if (target === 'USDT') {
    const amount = rub / DEMO_RATES.USDT;
    if (options.compact) return `${formatToken(amount, 'USDT')} USDT`;
    return `${new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)} USDT`;
  }
  return formatRub(rub);
}

export function formatDisplaySuffix(target: DisplayCurrency): string {
  return target === 'RUB' ? '₽' : 'USDT';
}

export function shortenAddress(address: string, lead = 6, tail = 5): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function shortenHash(hash: string): string {
  return shortenAddress(hash, 8, 8);
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function formatDayLabel(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Сегодня';
  if (sameDay(date, yesterday)) return 'Вчера';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(timestamp);
}

export function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(timestamp);
}

export function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function sanitizeAmountInput(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = normalized.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, 6)}`;
}

export function roundAmount(value: number, currency: Currency): number {
  const factor = 10 ** CURRENCY_META[currency].decimals;
  return Math.round(value * factor) / factor;
}

export function percentChange(current: number, base: number): number {
  if (!base) return 0;
  return ((current - base) / base) * 100;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
