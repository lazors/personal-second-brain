import { ITEM_TYPES, TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';
import { navigate, useRoute } from '../lib/router';
import { Mark, TYPE_SHAPE } from './Mark';

export function Sidebar() {
  const route = useRoute();
  const { items } = useStore();

  const countByType = (type: string) =>
    items.filter((i) => i.type === type).length;
  const openTasks = items.filter(
    (i) => i.type === 'task' && i.status !== 'done',
  ).length;

  const linkBase =
    'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors';
  const linkClass = (active: boolean) =>
    active
      ? `${linkBase} bg-[#33514d] text-[#fbfaf7] dark:bg-[#2c4d3a] dark:text-[#cdeed9] font-semibold`
      : `${linkBase} text-[#6b665c] hover:bg-[#f0ede6] dark:text-[#9aa094] dark:hover:bg-[#1e2419]`;

  return (
    <aside className="flex w-[218px] shrink-0 flex-col gap-0.5 border-r border-[#e7e4de] bg-[#fbfaf7] p-3.5 dark:border-[#262b22] dark:bg-[#171b14]">
      <div className="mb-4 flex items-center gap-2.5 px-1.5 py-1">
        <span className="inline-flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-[#33514d] text-[#cdeed9] dark:bg-[#2f5d43]">
          <Mark shape="diamond" size={13} />
        </span>
        <span className="font-serif text-[18px] font-medium text-[#2c2a26] dark:text-[#ebece6]">
          Second Brain
        </span>
      </div>

      <button
        className={linkClass(route.name === 'overview')}
        onClick={() => navigate('/')}
      >
        <span className="flex items-center gap-2.5">
          <Mark shape="diamond" /> Overview
        </span>
      </button>

      <button
        className={linkClass(route.name === 'search')}
        onClick={() => navigate('/search')}
      >
        <span className="flex items-center gap-2.5">
          <Mark shape="search" /> Search
        </span>
      </button>

      <div className="px-2 pb-2 pt-5 font-serif text-[12px] italic text-[#a39d92] dark:text-[#6b7163]">
        Collections
      </div>

      {ITEM_TYPES.map((type) => {
        const meta = TYPE_META[type];
        const path = `/${meta.plural.toLowerCase()}`;
        const active = route.name === 'collection' && route.type === type;
        const count = type === 'task' ? openTasks : countByType(type);
        const isTask = type === 'task';
        return (
          <button
            key={type}
            className={linkClass(active)}
            onClick={() => navigate(path)}
          >
            <span className="flex items-center gap-2.5">
              <Mark shape={TYPE_SHAPE[type]} /> {meta.plural}
            </span>
            {count > 0 &&
              (isTask ? (
                <span
                  className={
                    active
                      ? 'rounded-full bg-white/20 px-2 text-[11px] text-white'
                      : 'rounded-full bg-[#e8efed] px-2 text-[11px] text-[#7c8e88] dark:bg-[#234032] dark:text-[#8fd6a8]'
                  }
                >
                  {count} open
                </span>
              ) : (
                <span
                  className={
                    active
                      ? 'text-[11.5px] text-white/70'
                      : 'text-[11.5px] text-[#a8a298] dark:text-[#6b7163]'
                  }
                >
                  {count}
                </span>
              ))}
          </button>
        );
      })}
    </aside>
  );
}
