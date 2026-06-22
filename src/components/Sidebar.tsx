import { ITEM_TYPES, TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';
import { navigate, useRoute } from '../lib/router';

export function Sidebar() {
  const route = useRoute();
  const { items } = useStore();

  const countByType = (type: string) =>
    items.filter((i) => i.type === type).length;
  const openTasks = items.filter(
    (i) => i.type === 'task' && i.status !== 'done',
  ).length;

  const linkClass = (active: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-brand-600 text-white'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-3 flex items-center gap-2 px-2 py-1">
        <span className="text-xl">🧠</span>
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Second Brain
        </span>
      </div>

      <button
        className={linkClass(route.name === 'dashboard')}
        onClick={() => navigate('/')}
      >
        <span className="flex items-center gap-2">
          <span>🏠</span> Dashboard
        </span>
      </button>

      <button
        className={linkClass(route.name === 'search')}
        onClick={() => navigate('/search')}
      >
        <span className="flex items-center gap-2">
          <span>🔍</span> Search
        </span>
      </button>

      <div className="my-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Collections
      </div>

      {ITEM_TYPES.map((type) => {
        const meta = TYPE_META[type];
        const path = `/${meta.plural.toLowerCase()}`;
        const active =
          route.name === 'collection' && route.type === type;
        const count = type === 'task' ? openTasks : countByType(type);
        return (
          <button
            key={type}
            className={linkClass(active)}
            onClick={() => navigate(path)}
          >
            <span className="flex items-center gap-2">
              <span>{meta.icon}</span> {meta.plural}
            </span>
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {count}
                {type === 'task' ? ' open' : ''}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}
