import { Moon, Settings2, Terminal } from 'lucide-react';
import { Logo, Wordmark } from './ui/Logo';
import { useApp } from '../state/AppContext';
import { haptic } from '../telegram/telegram';

export function AppHeader() {
  const { theme, toggleTheme, openSettings } = useApp();

  const handleTheme = () => {
    haptic('tap');
    toggleTheme();
  };

  return (
    <header
      className="sticky top-0 z-40 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))]"
      style={{ background: 'linear-gradient(to bottom, var(--bg) 58%, transparent)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Logo size={34} withGlow />
          <Wordmark />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTheme}
            aria-label={theme === 'matrix' ? 'Включить Black тему' : 'Включить Matrix тему'}
            title={theme === 'matrix' ? 'Black mode' : 'Matrix mode'}
            className="interactive grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] backdrop-blur-xl hover:text-[var(--accent)]"
          >
            {theme === 'matrix' ? <Moon size={16} /> : <Terminal size={16} />}
          </button>
          <button
            type="button"
            onClick={openSettings}
            aria-label="Настройки"
            className="interactive grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] backdrop-blur-xl hover:text-[var(--accent)]"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
