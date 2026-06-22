import { useState } from 'react';
import type { Item, TaskStatus } from '../types';
import { TYPE_META } from '../types';
import { formatDate, timeAgo, dueDaysUntil, isUrgent, dueLabel } from '../lib/util';
import { useStore } from '../store/StoreContext';

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  doing: 'Doing',
  done: 'Done',
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  doing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const PRIORITY_STYLE: Record<string, string> = {
  high: 'text-rose-600 dark:text-rose-400',
  med: 'text-amber-600 dark:text-amber-400',
  low: 'text-slate-500 dark:text-slate-400',
};

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onTagClick?: (tag: string) => void;
}

export function ItemCard({ item, onEdit, onTagClick }: ItemCardProps) {
  const { updateItem, deleteItem, addTrackerEntry } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [logValue, setLogValue] = useState('');
  const meta = TYPE_META[item.type];

  const cycleStatus = () => {
    const order: TaskStatus[] = ['todo', 'doing', 'done'];
    const next = order[(order.indexOf(item.status ?? 'todo') + 1) % order.length];
    updateItem(item.id, { status: next });
  };

  const latest =
    item.type === 'tracker' && item.entries && item.entries.length
      ? item.entries[item.entries.length - 1]
      : undefined;

  const submitLog = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(logValue);
    if (!isNaN(num)) {
      addTrackerEntry(item.id, num);
      setLogValue('');
    }
  };

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden>
              {meta.icon}
            </span>
            <h3
              className={`truncate font-semibold text-slate-800 dark:text-slate-100 ${
                item.status === 'done' ? 'line-through opacity-60' : ''
              }`}
            >
              {item.title}
            </h3>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            className="btn-ghost h-7 w-7 !px-0 text-xs"
            onClick={() => onEdit(item)}
            aria-label="Edit"
            title="Edit"
          >
            ✎
          </button>
          {confirming ? (
            <button
              className="btn h-7 bg-rose-600 px-2 text-xs text-white hover:bg-rose-700"
              onClick={() => deleteItem(item.id)}
            >
              Delete?
            </button>
          ) : (
            <button
              className="btn-ghost h-7 w-7 !px-0 text-xs"
              onClick={() => {
                setConfirming(true);
                setTimeout(() => setConfirming(false), 3000);
              }}
              aria-label="Delete"
              title="Delete"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {item.body && (
        <p className="whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-300">
          {item.body}
        </p>
      )}

      {/* Type-specific row */}
      {item.type === 'task' &&
        (() => {
          const open = item.status !== 'done';
          const days = open ? dueDaysUntil(item.due) : null;
          const urgent = isUrgent(days);
          return (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={cycleStatus}
                className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[item.status ?? 'todo']}`}
                title="Click to advance status"
              >
                {STATUS_LABEL[item.status ?? 'todo']}
              </button>
              {urgent && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  🔥 Urgent
                </span>
              )}
              {item.priority && (
                <span className={`font-medium ${PRIORITY_STYLE[item.priority]}`}>
                  ● {item.priority}
                </span>
              )}
              {item.due && (
                <span
                  className={
                    days !== null && days < 0
                      ? 'font-semibold text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                >
                  {days !== null ? `${dueLabel(days)} · ` : 'due '}
                  {formatDate(item.due)}
                </span>
              )}
            </div>
          );
        })()}

      {item.type === 'reference' && item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          {item.url} ↗
        </a>
      )}

      {item.type === 'tracker' && (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {latest ? latest.value : '—'}
            </span>
            {item.unit && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.unit}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {item.entries?.length ?? 0} entries
            </span>
          </div>
          <form onSubmit={submitLog} className="flex gap-2">
            <input
              className="input h-8 py-1 text-sm"
              type="number"
              step="any"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              placeholder="Log a value…"
            />
            <button type="submit" className="btn-subtle h-8 shrink-0">
              + Log
            </button>
          </form>
        </div>
      )}

      {/* Tags + footer */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <button
              key={tag}
              className="chip hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-900/40 dark:hover:text-brand-300"
              onClick={() => onTagClick?.(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[11px] text-slate-400">
          {timeAgo(item.updatedAt)}
        </span>
      </div>
    </div>
  );
}
