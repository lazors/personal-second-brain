import { useMemo, useState } from 'react';
import type { Item } from '../types';
import { ITEM_TYPES, TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';
import { ItemCard } from '../components/ItemCard';
import { Modal } from '../components/Modal';
import { ItemForm } from '../components/ItemForm';
import { navigate } from '../lib/router';
import {
  formatDate,
  timeAgo,
  dueDaysUntil,
  isUrgent,
  dueLabel,
} from '../lib/util';

const PRIORITY_RANK: Record<string, number> = { high: 0, med: 1, low: 2 };

/** Compact one-line task row used by the dashboard widgets. */
function TaskLine({
  t,
  onToggle,
}: {
  t: Item;
  onToggle: (id: string, next: 'todo' | 'done') => void;
}) {
  const open = t.status !== 'done';
  const days = open ? dueDaysUntil(t.due) : null;
  const urgent = isUrgent(days);
  return (
    <div className="card flex items-center justify-between gap-3 py-2.5">
      <label className="flex min-w-0 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={t.status === 'done'}
          onChange={() => onToggle(t.id, t.status === 'done' ? 'todo' : 'done')}
          className="h-4 w-4 shrink-0 accent-brand-600"
        />
        <span className="truncate font-medium text-slate-700 dark:text-slate-200">
          {t.title}
        </span>
      </label>
      <div className="flex shrink-0 items-center gap-2 text-xs">
        {urgent && (
          <span
            className="rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
            title="Urgent — due soon or overdue"
          >
            🔥
          </span>
        )}
        {t.priority && (
          <span
            className={
              t.priority === 'high'
                ? 'text-rose-500'
                : t.priority === 'med'
                  ? 'text-amber-500'
                  : 'text-slate-400'
            }
          >
            ● {t.priority}
          </span>
        )}
        {t.due && (
          <span
            className={
              days !== null && days < 0
                ? 'font-semibold text-rose-500'
                : 'text-slate-400'
            }
          >
            {days !== null ? dueLabel(days) : formatDate(t.due)}
          </span>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { items, updateItem } = useStore();
  const [editing, setEditing] = useState<Item | null>(null);

  const toggleTask = (id: string, next: 'todo' | 'done') =>
    updateItem(id, { status: next });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of ITEM_TYPES) c[t] = 0;
    for (const i of items) c[i.type]++;
    return c;
  }, [items]);

  const openTasks = useMemo(
    () => items.filter((i) => i.type === 'task' && i.status !== 'done'),
    [items],
  );

  const byDueAsc = (a: Item, b: Item) =>
    (dueDaysUntil(a.due) ?? Infinity) - (dueDaysUntil(b.due) ?? Infinity);

  // Overdue + due today.
  const today = useMemo(
    () =>
      openTasks
        .filter((t) => {
          const d = dueDaysUntil(t.due);
          return d !== null && d <= 0;
        })
        .sort(byDueAsc),
    [openTasks],
  );

  // Due in the next 7 days (after today).
  const thisWeek = useMemo(
    () =>
      openTasks
        .filter((t) => {
          const d = dueDaysUntil(t.due);
          return d !== null && d >= 1 && d <= 7;
        })
        .sort(byDueAsc),
    [openTasks],
  );

  // Everything else open: no due date, or further out.
  const backlog = useMemo(
    () =>
      openTasks
        .filter((t) => {
          const d = dueDaysUntil(t.due);
          return d === null || d > 7;
        })
        .sort((a, b) => {
          const p =
            (PRIORITY_RANK[a.priority ?? 'med'] ?? 1) -
            (PRIORITY_RANK[b.priority ?? 'med'] ?? 1);
          return p !== 0 ? p : byDueAsc(a, b);
        })
        .slice(0, 6),
    [openTasks],
  );

  const recent = useMemo(
    () =>
      [...items]
        .filter((i) => i.type === 'thought' || i.type === 'idea')
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 4),
    [items],
  );

  const trackers = useMemo(
    () => items.filter((i) => i.type === 'tracker').slice(0, 4),
    [items],
  );

  const topTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const i of items)
      for (const t of i.tags) freq.set(t, (freq.get(t) ?? 0) + 1);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [items]);

  const empty = items.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your work, captured in one place.
        </p>
      </div>

      {/* Count tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ITEM_TYPES.map((type) => {
          const meta = TYPE_META[type];
          return (
            <button
              key={type}
              onClick={() => navigate(`/${meta.plural.toLowerCase()}`)}
              className="card flex items-center gap-3 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="text-2xl">{meta.icon}</span>
              <span>
                <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {counts[type]}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {meta.plural}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {empty && (
        <div className="card py-12 text-center text-slate-500 dark:text-slate-400">
          Nothing captured yet — use the bar at the top to add your first
          thought, idea, or task.
        </div>
      )}

      {/* Today + This week */}
      {!empty && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
                🔥 Today
                {today.length > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                    {today.length}
                  </span>
                )}
              </h2>
              <button
                className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                onClick={() => navigate('/tasks')}
              >
                All tasks →
              </button>
            </div>
            {today.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nothing due today or overdue. 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {today.map((t) => (
                  <TaskLine key={t.id} t={t} onToggle={toggleTask} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
              📅 This week
              {thisWeek.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {thisWeek.length}
                </span>
              )}
            </h2>
            {thisWeek.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing due in the next 7 days.</p>
            ) : (
              <div className="space-y-2">
                {thisWeek.map((t) => (
                  <TaskLine key={t.id} t={t} onToggle={toggleTask} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Backlog: open tasks with no due date or further out */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              📋 Backlog
              <span className="ml-2 text-sm font-normal text-slate-400">
                no due date / later
              </span>
            </h2>
            <button
              className="text-sm text-brand-600 hover:underline dark:text-brand-400"
              onClick={() => navigate('/tasks')}
            >
              View all →
            </button>
          </div>
          {backlog.length === 0 ? (
            <p className="text-sm text-slate-400">
              {openTasks.length === 0
                ? 'No open tasks. 🎉'
                : 'Everything open has a due date — see Today and This week above.'}
            </p>
          ) : (
            <div className="space-y-2">
              {backlog.map((t) => (
                <TaskLine key={t.id} t={t} onToggle={toggleTask} />
              ))}
            </div>
          )}
        </section>

        {/* Top tags */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            🏷 Top tags
          </h2>
          {topTags.length === 0 ? (
            <p className="text-sm text-slate-400">No tags yet.</p>
          ) : (
            <div className="card flex flex-wrap gap-1.5">
              {topTags.map(([tag, n]) => (
                <span key={tag} className="chip">
                  #{tag} <span className="ml-1 text-slate-400">{n}</span>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent thoughts/ideas */}
      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            💭 Recent thoughts & ideas
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} onEdit={setEditing} />
            ))}
          </div>
        </section>
      )}

      {/* Trackers */}
      {trackers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              📈 Trackers
            </h2>
            <button
              className="text-sm text-brand-600 hover:underline dark:text-brand-400"
              onClick={() => navigate('/trackers')}
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {trackers.map((item) => (
              <ItemCard key={item.id} item={item} onEdit={setEditing} />
            ))}
          </div>
        </section>
      )}

      {!empty && (
        <p className="text-center text-xs text-slate-400">
          Last activity {items.length ? timeAgo(
            Math.max(...items.map((i) => i.updatedAt)),
          ) : ''}
        </p>
      )}

      <Modal
        open={editing !== null}
        title="Edit"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ItemForm
            fixedType={editing.type}
            initial={editing}
            onSubmit={(values) => {
              updateItem(editing.id, values);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
