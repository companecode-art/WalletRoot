import type { Theme } from '../types';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface HapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  viewportStableHeight: number;
  ready(): void;
  expand(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  disableVerticalSwipes?(): void;
  HapticFeedback?: HapticFeedback;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const telegram = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export function initTelegram(): void {
  if (!telegram) return;
  try {
    telegram.ready();
    telegram.expand();
    telegram.disableVerticalSwipes?.();
    applyTelegramColors('black');
  } catch {
    return;
  }
}

export function applyTelegramColors(theme: Theme): void {
  if (!telegram) return;
  const background = theme === 'matrix' ? '#010603' : '#050507';
  try {
    telegram.setHeaderColor(background);
    telegram.setBackgroundColor(background);
    telegram.setBottomBarColor?.(background);
  } catch {
    return;
  }
}

export function getTelegramUser(): TelegramUser | null {
  return telegram?.initDataUnsafe?.user ?? null;
}

export function isInsideTelegram(): boolean {
  return Boolean(telegram?.initData);
}

export function haptic(kind: 'tap' | 'success' | 'error' | 'warning' | 'select' = 'tap'): void {
  if (!telegram?.HapticFeedback) return;
  try {
    if (kind === 'tap') telegram.HapticFeedback.impactOccurred('light');
    if (kind === 'select') telegram.HapticFeedback.selectionChanged();
    if (kind === 'success') telegram.HapticFeedback.notificationOccurred('success');
    if (kind === 'error') telegram.HapticFeedback.notificationOccurred('error');
    if (kind === 'warning') telegram.HapticFeedback.notificationOccurred('warning');
  } catch {
    return;
  }
}

export function getDisplayName(user: TelegramUser | null): string {
  if (!user) return 'Гость';
  return user.first_name || user.username || 'Гость';
}

export function getInitials(user: TelegramUser | null): string {
  if (!user) return 'RW';
  const first = user.first_name?.trim()?.[0] ?? '';
  const last = user.last_name?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'RW';
}
