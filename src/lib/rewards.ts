import type { Badge, BadgeDefinition, Currency } from '../types';
import { BADGE_POOL, SECRET_BOX_COOLDOWN_MS } from './constants';
import { pickRandom, randomBetween } from './crypto';
import { roundAmount } from './format';

export type RewardRoll =
  | { kind: 'tokens'; currency: Currency; amount: number }
  | { kind: 'badge'; badge: BadgeDefinition };

const TOKEN_REWARDS: Array<{
  currency: Currency;
  weight: number;
  min: number;
  max: number;
}> = [
  { currency: 'USDT', weight: 0.55, min: 0.25, max: 3.5 },
  { currency: 'TON', weight: 0.25, min: 0.01, max: 0.3 },
  { currency: 'BTC', weight: 0.2, min: 0.000002, max: 0.00002 },
];

export function rollSecretReward(ownedBadges: Badge[]): RewardRoll {
  const ownedIds = new Set(ownedBadges.map((badge) => badge.id));
  const availableBadges = BADGE_POOL.filter((badge) => !ownedIds.has(badge.id));

  if (availableBadges.length > 0 && Math.random() < 0.18) {
    return { kind: 'badge', badge: pickRandom(availableBadges) };
  }

  const roll = Math.random();
  let cumulative = 0;
  let selected = TOKEN_REWARDS[0];

  for (const reward of TOKEN_REWARDS) {
    cumulative += reward.weight;
    if (roll <= cumulative) {
      selected = reward;
      break;
    }
  }

  return {
    kind: 'tokens',
    currency: selected.currency,
    amount: roundAmount(randomBetween(selected.min, selected.max), selected.currency),
  };
}

export function getSecretBoxRemaining(lastOpened: number | null, now = Date.now()): number {
  if (!lastOpened) return 0;
  return Math.max(0, lastOpened + SECRET_BOX_COOLDOWN_MS - now);
}
