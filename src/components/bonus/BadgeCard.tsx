import {
  Eye,
  Flame,
  Gem,
  HeartPulse,
  LockKeyhole,
  Sprout,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { Badge, BadgeRarity } from '../../types';
import { formatShortDate } from '../../lib/format';
import { cn } from '../../lib/cn';

const badgeIcons: Record<string, LucideIcon> = {
  'root-genesis': Sprout,
  'neon-whale': Waves,
  'gas-goblin': Flame,
  'matrix-runner': Zap,
  'block-oracle': Eye,
  'degen-pulse': HeartPulse,
};

const rarityMeta: Record<
  BadgeRarity,
  { label: string; color: string; glow: string; border: string }
> = {
  common: {
    label: 'common',
    color: '#00ff9d',
    glow: 'rgba(0,255,157,.14)',
    border: 'rgba(0,255,157,.22)',
  },
  rare: {
    label: 'rare',
    color: '#67d7ff',
    glow: 'rgba(103,215,255,.14)',
    border: 'rgba(103,215,255,.26)',
  },
  epic: {
    label: 'epic',
    color: '#b28cff',
    glow: 'rgba(178,140,255,.16)',
    border: 'rgba(178,140,255,.28)',
  },
  legendary: {
    label: 'legendary',
    color: '#ffc857',
    glow: 'rgba(255,200,87,.16)',
    border: 'rgba(255,200,87,.3)',
  },
};

export function BadgeMedallion({
  badge,
  size = 48,
  locked = false,
}: {
  badge: Badge;
  size?: number;
  locked?: boolean;
}) {
  const Icon = badgeIcons[badge.id] ?? Gem;
  const rarity = rarityMeta[badge.rarity];

  return (
    <div
      className={cn('relative grid shrink-0 place-items-center', locked && 'opacity-40 grayscale')}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-2xl border"
        style={{
          borderColor: rarity.border,
          background: `radial-gradient(circle at 35% 25%, ${rarity.glow}, rgba(0,0,0,.45))`,
          boxShadow: `0 0 24px ${rarity.glow}`,
        }}
      />
      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z"
          fill="none"
          stroke={rarity.color}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <path
          d="M24 8 37.5 16v16L24 40 10.5 32V16L24 8Z"
          fill="none"
          stroke={rarity.color}
          strokeOpacity="0.14"
          strokeWidth="0.8"
          strokeDasharray="2 3"
        />
      </svg>
      {locked ? (
        <LockKeyhole size={size * 0.3} className="relative" style={{ color: rarity.color }} />
      ) : (
        <Icon size={size * 0.34} className="relative" style={{ color: rarity.color }} />
      )}
    </div>
  );
}

export function BadgeCard({
  badge,
  owned,
  earnedAt,
}: {
  badge: Badge;
  owned: boolean;
  earnedAt?: number;
}) {
  const rarity = rarityMeta[badge.rarity];

  return (
    <div
      className={cn(
        'glass relative overflow-hidden rounded-2xl p-3.5',
        owned ? 'border-[var(--border)]' : 'border-dashed opacity-75',
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: owned ? rarity.glow : 'transparent' }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <BadgeMedallion badge={badge} size={46} locked={!owned} />
        <span
          className="rounded-md border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em]"
          style={{
            color: owned ? rarity.color : 'var(--text-faint)',
            borderColor: owned ? rarity.border : 'var(--border)',
            background: owned ? rarity.glow : 'transparent',
          }}
        >
          {owned ? rarity.label : 'locked'}
        </span>
      </div>
      <p className="mt-3 text-[11.5px] font-semibold text-[var(--text)]">
        {owned ? badge.name : '???'}
      </p>
      <p className="mt-0.5 line-clamp-2 min-h-[26px] text-[9px] leading-relaxed text-[var(--text-muted)]">
        {owned ? badge.description : 'Открой его в Secret Box'}
      </p>
      <div className="mt-2 flex items-center justify-between border-t border-[var(--border-soft)] pt-2">
        <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
          {owned ? 'nft badge · demo' : 'not collected'}
        </span>
        {owned && earnedAt && (
          <span className="font-mono text-[7px] text-[var(--text-faint)]">
            {formatShortDate(earnedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
