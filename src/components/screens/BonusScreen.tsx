import { useApp } from '../../state/AppContext';
import { BADGE_POOL } from '../../lib/constants';
import { SecretBox } from '../bonus/SecretBox';
import { GasSaver } from '../bonus/GasSaver';
import { BadgeCard } from '../bonus/BadgeCard';
import { Sparkles } from 'lucide-react';

export function BonusScreen() {
  const { profile } = useApp();

  if (!profile) return null;

  const owned = profile.badges;
  const ownedIds = new Set(owned.map((badge) => badge.id));

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            gamified utilities
          </p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em]">Бонусы</h1>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Награды, бейджи и умные советы
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[var(--border-accent)] bg-[var(--accent-dim)] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--accent)]">
          <Sparkles size={10} />
          {owned.length}/{BADGE_POOL.length}
        </span>
      </div>

      <SecretBox />

      <GasSaver />

      <section>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Коллекция</h2>
            <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[8px] text-[var(--text-faint)]">
              nft
            </span>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
            {owned.length} получено
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {BADGE_POOL.map((definition) => {
            const badge = owned.find((item) => item.id === definition.id);
            return (
              <BadgeCard
                key={definition.id}
                badge={
                  badge ?? {
                    ...definition,
                    earnedAt: 0,
                  }
                }
                owned={ownedIds.has(definition.id)}
                earnedAt={badge?.earnedAt}
              />
            );
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-3">
        <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
          Все токены, ячейки и NFT-бейджи существуют только в демо-режиме. Они не имеют
          реальной стоимости и не могут быть выведены.
        </p>
      </div>
    </div>
  );
}
