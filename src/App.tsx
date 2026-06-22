import type { ItemType } from './types';
import { ITEM_TYPES } from './types';
import { useRoute } from './lib/router';
import { useStore } from './store/StoreContext';
import { Sidebar } from './components/Sidebar';
import { QuickCapture } from './components/QuickCapture';
import { BackupControls } from './components/BackupControls';
import { Dashboard } from './views/Dashboard';
import { SearchView } from './views/SearchView';
import { CollectionView } from './views/CollectionView';

export function App() {
  const route = useRoute();
  const { conn, connError, reload } = useStore();

  const renderMain = () => {
    if (route.name === 'dashboard') return <Dashboard />;
    if (route.name === 'search') return <SearchView />;
    if (
      route.name === 'collection' &&
      ITEM_TYPES.includes(route.type as ItemType)
    ) {
      return <CollectionView type={route.type as ItemType} />;
    }
    return <Dashboard />;
  };

  return (
    <div className="flex h-full text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white/70 px-5 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
          <div className="min-w-0 flex-1">
            <QuickCapture />
          </div>
          <BackupControls />
        </header>
        {conn === 'error' && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-5 py-2 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <span>
              ⚠️ Can't reach the local server — changes aren't being saved to
              your markdown files.{' '}
              {connError && <span className="opacity-70">({connError})</span>}{' '}
              Start it with <code className="font-mono">npm start</code>.
            </span>
            <button className="btn-subtle h-7 shrink-0" onClick={reload}>
              Retry
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="mx-auto max-w-6xl">{renderMain()}</div>
        </main>
      </div>
    </div>
  );
}
