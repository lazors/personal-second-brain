import { useMemo, useState } from 'react';
import type { Item } from '../types';
import { ITEM_TYPES, TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';
import { Modal } from '../components/Modal';
import { ItemForm } from '../components/ItemForm';
import { Mark, TYPE_SHAPE } from '../components/Mark';
import { navigate } from '../lib/router';
import { timeAgo, dueDaysUntil, dueLabel } from '../lib/util';

const PRIORITY_RANK: Record<string, number> = { high: 0, med: 1, low: 2 };

/** Coloured dot per priority — warm clay/amber, calm grey for low. */
const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-[#b5613f] dark:bg-[#e0936a]',
  med: 'bg-[#b08a45] dark:bg-[#d8b46a]',
  low: 'bg-[#a8a399] dark:bg-[#7c8278]',
};

/** Accent per recent item type. */
const KIND_ACCENT: Record<string, { text: string; border: string }> = {
  thought: {
    text: 'text-[#33514d] dark:text-[#6fc28d]',
    border: 'border-[#33514d] dark:border-[#6fc28d]',
  },
  idea: {
    text: 'text-[#b08a45] dark:text-[#d8b46a]',
    border: 'border-[#b08a45] dark:border-[#d8b46a]',
  },
};

const weekday = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { weekday: 'short' });

/** A single task row used inside the focus + backlog panels. */
function TaskRow({
  t,
  onToggle,
  highlight = false,
  compact = false,
}: {
  t: Item;
  onToggle: (id: string, next: 'todo' | 'done') => void;
  highlight?: boolean;
  compact?: boolean;
}) {
  const open = t.status !== 'done';
  const days = open ? dueDaysUntil(t.due) : null;
  const overdue = days !== null && days <= 0;
  const dueStr =
    days !== null ? (overdue ? dueLabel(days) : weekday(t.due!)) : null;

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 ${
        compact ? 'py-[7px]' : 'py-2'
      } ${
        highlight
          ? 'bg-[#f9efe9] dark:bg-[#26201a]'
          : 'hover:bg-[#faf8f4] dark:hover:bg-[#222820]'
      }`}
    >
      <input
        type="checkbox"
        checked={t.status === 'done'}
        onChange={() => onToggle(t.id, t.status === 'done' ? 'todo' : 'done')}
        className="h-[15px] w-[15px] shrink-0 rounded-[4px] accent-brand-500 dark:accent-[#6fc28d]"
      />
      <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#33312c] dark:text-[#dfe1da]">
        {t.title}
      </span>
      {t.priority && (
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-[#9a948a] dark:text-[#8b9183]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[t.priority]}`}
          />
          {t.priority}
        </span>
      )}
      {dueStr && (
        <span
          className={`w-[58px] shrink-0 text-right text-[12px] ${
            overdue
              ? 'font-semibold text-[#b5613f] dark:text-[#e0936a]'
              : 'text-[#9a948a] dark:text-[#8b9183]'
          }`}
        >
          {dueStr}
        </span>
      )}
    </label>
  );
}

const panel =
  'rounded-[13px] border border-[#e7e4de] bg-white dark:border-[#2a302a] dark:bg-[#1b201a]';
const heading =
  'font-serif text-[16px] font-medium text-[#2c2a26] dark:text-[#ebece6]';

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

  // Overdue + due today (needs attention).
  const attention = useMemo(
    () =>
      openTasks
        .filter((t) => {
          const d = dueDaysUntil(t.due);
          return d !== null && d <= 0;
        })
        .sort(byDueAsc),
    [openTasks],
  );

  // Due in the next 7 days.
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

  // No due date or further out.
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
        .slice(0, 8),
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

  const topTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const i of items)
      for (const t of i.tags) freq.set(t, (freq.get(t) ?? 0) + 1);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [items]);

  const empty = items.length === 0;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const lastActivity = items.length
    ? timeAgo(Math.max(...items.map((i) => i.updatedAt)))
    : '';

  return (
    <div>
      <h1 className="mb-[18px] font-serif text-[26px] font-medium text-[#2c2a26] dark:text-[#ebece6]">
        Overview{' '}
        <span className="font-sans text-[13px] font-normal text-[#9a948a] dark:text-[#7c8278]">
          · {today}
        </span>
      </h1>

      {empty ? (
        <div className={`${panel} px-6 py-12 text-center text-[#9a948a] dark:text-[#8b9183]`}>
          Nothing captured yet — use the bar above to add your first thought,
          idea, or task.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.7fr_1fr]">
          {/* Focus: This week */}
          <section className={`${panel} px-[18px] pb-2.5 pt-4`}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className={heading}>This week</h2>
              <span className="text-[12px] text-[#a39d92] dark:text-[#7c8278]">
                {openTasks.length} open
                {attention.length > 0 && ` · ${attention.length} need attention`}
              </span>
            </div>
            {attention.length === 0 && thisWeek.length === 0 ? (
              <p className="px-2.5 py-3 text-[13px] text-[#a39d92] dark:text-[#7c8278]">
                Nothing due in the next 7 days.
              </p>
            ) : (
              <>
                {attention.map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={toggleTask} highlight />
                ))}
                {thisWeek.map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={toggleTask} />
                ))}
              </>
            )}
          </section>

          {/* At a glance — spans two rows on the right */}
          <section
            className={`${panel} flex flex-col px-[18px] py-4 lg:row-span-2`}
          >
            <h2 className={`${heading} mb-3`}>At a glance</h2>
            <div className="flex flex-col">
              {ITEM_TYPES.map((type, idx) => {
                const meta = TYPE_META[type];
                const accent =
                  type === 'idea'
                    ? 'text-[#b08a45] dark:text-[#d8b46a]'
                    : 'text-[#33514d] dark:text-[#6fc28d]';
                return (
                  <button
                    key={type}
                    onClick={() => navigate(`/${meta.plural.toLowerCase()}`)}
                    className={`flex items-center justify-between py-2.5 text-left ${
                      idx < ITEM_TYPES.length - 1
                        ? 'border-b border-[#f0ede6] dark:border-[#262b22]'
                        : ''
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-[13.5px] text-[#5c574e] dark:text-[#b6bbb0]">
                      <span className={accent}>
                        <Mark shape={TYPE_SHAPE[type]} size={12} />
                      </span>
                      {meta.plural}
                    </span>
                    <span className="font-serif text-[19px] text-[#2c2a26] dark:text-[#ebece6]">
                      {counts[type]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-[15px] border-t border-[#f0ede6] pt-[15px] dark:border-[#262b22]">
              <div className="mb-2.5 font-serif text-[12.5px] italic text-[#a39d92] dark:text-[#6b7163]">
                Top tags
              </div>
              {topTags.length === 0 ? (
                <p className="text-[12.5px] text-[#a39d92] dark:text-[#7c8278]">
                  No tags yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map(([tag, n]) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#ebe8e1] bg-[#f4f2ec] px-2.5 py-1 text-[12px] text-[#5c574e] dark:border-[#2c322a] dark:bg-[#1f241c] dark:text-[#b6bbb0]"
                    >
                      {tag}
                      <span className="text-[10.5px] text-[#b3aea4] dark:text-[#6b7163]">
                        {n}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto pt-[15px] text-[11.5px] text-[#b3aea4] dark:text-[#5f655c]">
              {lastActivity && `Last activity ${lastActivity}`}
            </div>
          </section>

          {/* Backlog */}
          <section className={`${panel} px-[18px] pb-2.5 pt-4`}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className={heading}>Backlog</h2>
              <button
                className="text-[12.5px] text-[#33514d] hover:underline dark:text-[#6fc28d]"
                onClick={() => navigate('/tasks')}
              >
                View all →
              </button>
            </div>
            {backlog.length === 0 ? (
              <p className="px-2.5 py-3 text-[13px] text-[#a39d92] dark:text-[#7c8278]">
                {openTasks.length === 0
                  ? 'No open tasks.'
                  : 'Everything open has a due date — see This week above.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {backlog.map((t) => (
                  <div
                    key={t.id}
                    className="border-b border-[#f3f1ec] dark:border-[#232820]"
                  >
                    <TaskRow t={t} onToggle={toggleTask} compact />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent thoughts & ideas — full width */}
          {recent.length > 0 && (
            <section className={`${panel} px-[18px] py-4 lg:col-span-2`}>
              <h2 className={`${heading} mb-3`}>Recent thoughts &amp; ideas</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recent.map((item) => {
                  const accent = KIND_ACCENT[item.type] ?? KIND_ACCENT.thought;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setEditing(item)}
                      className={`border-l-2 pl-3 text-left ${accent.border}`}
                    >
                      <span
                        className={`text-[10.5px] font-semibold uppercase tracking-[0.04em] ${accent.text}`}
                      >
                        {TYPE_META[item.type].label}
                      </span>
                      <div className="my-[3px] line-clamp-2 text-[13px] font-medium leading-snug text-[#33312c] dark:text-[#dfe1da]">
                        {item.title}
                      </div>
                      {item.body && (
                        <div className="line-clamp-2 text-[12px] leading-relaxed text-[#9a948a] dark:text-[#8b9183]">
                          {item.body}
                        </div>
                      )}
                      {item.tags.length > 0 && (
                        <div className="mt-1.5 truncate text-[11px] text-[#b08a45] dark:text-[#cd9f5f]">
                          {item.tags.join(' · ')}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
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
