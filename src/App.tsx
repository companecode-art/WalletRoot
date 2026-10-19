import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { Splash } from './components/Splash';
import { Onboarding } from './components/onboarding/Onboarding';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { MatrixRain } from './components/MatrixRain';
import { ToastViewport } from './components/ui/Toasts';
import { WalletScreen } from './components/screens/WalletScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { BonusScreen } from './components/screens/BonusScreen';
import { DepositSheet } from './components/flows/DepositSheet';
import { SendSheet } from './components/flows/SendSheet';
import { CreateAccountSheet } from './components/flows/CreateAccountSheet';
import { SettingsSheet } from './components/flows/SettingsSheet';
import { TxDetailSheet } from './components/flows/TxDetailSheet';

const PulseScreen = lazy(() =>
  import('./components/screens/PulseScreen').then((module) => ({
    default: module.PulseScreen,
  })),
);

function ScreenFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin-slow rounded-full border border-[var(--border)] border-t-[var(--accent)]" />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}

function AppRoot() {
  const { status, profile, theme, activeTab } = useApp();

  if (status === 'loading') {
    return (
      <>
        <Splash />
        <ToastViewport />
      </>
    );
  }

  if (status === 'onboarding' || !profile) {
    return (
      <>
        <Onboarding />
        <ToastViewport />
      </>
    );
  }

  return (
    <div className="relative">
      {theme === 'matrix' && <MatrixRain />}
      <div className="app-shell mx-auto flex min-h-dvh w-full max-w-[520px] flex-col">
        <AppHeader />
        <main className="flex-1 px-4 pb-[calc(118px+env(safe-area-inset-bottom))]">
          {activeTab === 'wallet' && <WalletScreen />}
          {activeTab === 'history' && <HistoryScreen />}
          {activeTab === 'pulse' && (
            <Suspense fallback={<ScreenFallback />}>
              <PulseScreen />
            </Suspense>
          )}
          {activeTab === 'bonus' && <BonusScreen />}
        </main>
        <BottomNav />
      </div>
      <SheetRouter />
      <ToastViewport />
    </div>
  );
}

function SheetRouter() {
  const { sheet } = useApp();

  if (sheet.kind === 'deposit') {
    return <DepositSheet accountId={sheet.accountId} />;
  }
  if (sheet.kind === 'send') {
    return <SendSheet accountId={sheet.accountId} />;
  }
  if (sheet.kind === 'create-account') {
    return <CreateAccountSheet />;
  }
  if (sheet.kind === 'settings') {
    return <SettingsSheet />;
  }
  if (sheet.kind === 'tx') {
    return <TxDetailSheet txId={sheet.txId} />;
  }
  return null;
}
