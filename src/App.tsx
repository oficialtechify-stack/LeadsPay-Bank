import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from './firebase/config';
import type { User } from './firebase/config';
import {
  ensureProfile,
  logOut,
  requestLeadsPayMigration,
  signInWithGoogle,
  subscribeLedger,
  subscribeMigration,
  subscribeProfile,
  sumBalanceCents,
} from './lib/leadstap';
import type {
  LeadsTapProfile,
  LedgerEntry,
  MigrationRequest,
} from './types';
import { BrandLogo } from './components/BrandLogo';
import { LoginEntryView } from './components/LoginEntryView';
import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar } from './components/BottomNavBar';
import type { MainTab } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { ExtratoView } from './components/ExtratoView';
import { TapView } from './components/TapView';
import { PixView } from './components/PixView';
import { AjustesView } from './components/AjustesView';
import { NotificationToast } from './components/NotificationToast';
import type { Toast } from './components/NotificationToast';

export default function App() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<LeadsTapProfile | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [migration, setMigration] = useState<MigrationRequest | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('inicio');
  const [toast, setToast] = useState<Toast | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [migrationBusy, setMigrationBusy] = useState(false);

  const showToast = (message: string, kind: 'success' | 'error') => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setProfile(null);
      setEntries([]);
      setMigration(null);
      setFatalError(null);
      if (!user) return;
      try {
        await ensureProfile({
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL,
        });
      } catch (err) {
        setFatalError(
          err instanceof Error ? err.message : 'Não foi possível carregar sua conta.',
        );
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const unsubs = [
      subscribeProfile(authUser.uid, setProfile),
      subscribeLedger(authUser.uid, setEntries),
      subscribeMigration(authUser.uid, setMigration),
    ];
    return () => unsubs.forEach((u) => u());
  }, [authUser]);

  if (authUser === undefined) {
    return (
      <div className="min-h-screen bg-[#050607] text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Carregando…</p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#050607] text-slate-100">
        <LoginEntryView
          onLogin={async () => {
            try {
              await signInWithGoogle();
            } catch (err) {
              showToast(
                err instanceof Error ? err.message : 'Falha no login.',
                'error',
              );
            }
          }}
        />
        <NotificationToast toast={toast} />
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="min-h-screen bg-[#050607] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="font-display text-xl mb-2">Não foi possível abrir sua conta</h1>
          <p className="text-sm text-slate-300 break-words">{fatalError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-full bg-[#00e676] text-black font-semibold py-3"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const balanceCents = sumBalanceCents(entries);

  return (
    <div className="min-h-screen bg-[#050607] text-slate-100 pb-28">
      <HeaderBar
        profile={profile}
        balanceCents={balanceCents}
        displayName={authUser.displayName || authUser.email || ''}
      />
      <main className="max-w-2xl mx-auto px-4 pt-4">
        {activeTab === 'inicio' && (
          <DashboardView
            profile={profile}
            entries={entries}
            balanceCents={balanceCents}
            migration={migration}
            migrationBusy={migrationBusy}
            onRequestMigration={async () => {
              setMigrationBusy(true);
              try {
                await requestLeadsPayMigration(authUser.uid);
                showToast('Solicitação de migração registrada.', 'success');
              } catch (err) {
                showToast(
                  err instanceof Error ? err.message : 'Falha ao registrar a migração.',
                  'error',
                );
              } finally {
                setMigrationBusy(false);
              }
            }}
            onGoTab={setActiveTab}
          />
        )}
        {activeTab === 'extrato' && <ExtratoView entries={entries} />}
        {activeTab === 'cobrar' && (
          <TapView
            uid={authUser.uid}
            displayName={profile?.displayName || authUser.displayName || authUser.email || ''}
            onDone={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}
        {activeTab === 'pix' && (
          <PixView
            uid={authUser.uid}
            displayName={profile?.displayName || authUser.displayName || authUser.email || ''}
            profile={profile}
            onDone={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}
        {activeTab === 'ajustes' && (
          <AjustesView
            profile={profile}
            migration={migration}
            onLogout={async () => {
              try {
                await logOut();
              } catch (err) {
                showToast(
                  err instanceof Error ? err.message : 'Falha ao sair.',
                  'error',
                );
              }
            }}
          />
        )}
      </main>
      <BottomNavBar currentTab={activeTab} onSelectTab={setActiveTab} />
      <NotificationToast toast={toast} />
      <div className="max-w-2xl mx-auto px-4 pt-6 flex justify-center opacity-60">
        <BrandLogo size="sm" />
      </div>
    </div>
  );
}
