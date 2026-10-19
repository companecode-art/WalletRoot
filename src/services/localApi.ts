import type { Profile } from '../types';
import { STORAGE_KEY } from '../lib/constants';
import type { RootWalletApi } from './api';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Profile>;
  return (
    candidate.version === 1 &&
    typeof candidate.seedHash === 'string' &&
    typeof candidate.pinHash === 'string' &&
    typeof candidate.pinSalt === 'string' &&
    Array.isArray(candidate.accounts) &&
    Array.isArray(candidate.transactions) &&
    Array.isArray(candidate.badges)
  );
}

export class LocalWalletApi implements RootWalletApi {
  async bootstrap(): Promise<Profile | null> {
    await wait(320);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isProfile(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async save(profile: Profile): Promise<void> {
    await wait(60);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      throw new Error('Не удалось сохранить кошелёк на устройстве');
    }
  }

  async reset(): Promise<void> {
    await wait(160);
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
