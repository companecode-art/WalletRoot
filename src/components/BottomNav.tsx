import { Activity, Clock3, Gift, Wallet } from 'lucide-react';
import type { Tab } from '../types';
import { useApp } from '../state/AppContext';
import { cn } from '../lib/cn';

const items: Array<{ tab: Tab; label: string; icon: typeof Wallet }> = [
  { tab: 'wallet', label: 'Кошелёк', icon: Wallet },
  { tab: 'history', label: 'История', icon: Clock3 },
  { tab: 'pulse', label: 'Pulse', icon: Activity },
  { tab: 'bonus', label: 'Бонусы', icon: Gift },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[520px] px-3 pb-[calc(8px+env(safe-area-inset-bottom))]">
      <nav
        className="pointer-events-auto grid grid-cols-4 gap-1 rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] p-1.5 shadow-[0_18px_60px_rgba(0,0,0,.6)] backdrop-blur-2xl"
        aria-label="Основная навигация"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-all duration-200',
                active
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]',
              )}
            >
              {active && (
                <span className="absolute -top-[6px] h-[2.5px] w-5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(0,255,157,.8)]" />
              )}
              <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
              <span className="text-[9px] font-medium tracking-[-0.01em]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
