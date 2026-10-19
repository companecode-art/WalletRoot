import type { Profile } from '../types';
import { LocalWalletApi } from './localApi';

export interface RootWalletApi {
  bootstrap(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
  reset(): Promise<void>;
}

export const walletApi: RootWalletApi = new LocalWalletApi();
