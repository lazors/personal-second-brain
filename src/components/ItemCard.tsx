import type { Item, TaskStatus } from '../types';
import { TYPE_META, patchForTypeChange } from '../types';
import { formatDate, timeAgo, dueDaysUntil, isUrgent, dueLabel } from '../lib/util';
import { useStore } from '../store/StoreContext';
import { Mark, TYPE_SHAPE } from './Mark';
import { Icon } from './Icon';

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

/** Coloured dot per priority — same palette as the dashboard rows. */
const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-[#b5613f] dark:bg-[#e0936a]',
  med: 'bg-[#b08a45] dark:bg-[#d8b46a]',
  low: 'bg-[#a8a399] dark:bg-[#7c8278]',
};

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onTagClick?: (tag: string) => void;
}

export function ItemCard({ item, onEdit, onTagClick }: ItemCardProps) {
  const { updateItem, deleteItem } = useStore();
  const meta = TYPE_META[item.type];
  const isTask = item.type === 'task';

  const cycleStatus = () => {
    const order: TaskStatus[] = ['todo', 'doing', 'done'];
    const next = order[(order.indexOf(item.status ?? 'todo') + 1) % order.length];
    updateItem(item.id, { status: next });
  };

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className={`shrink-0 ${meta.accent}`} aria-hidden>
          <Mark shape={TYPE_SHAPE[item.type]} size={15} />
        </span>
        <h3
          className={`min-w-0 flex-1 truncate font-semibold text-slate-800 dark:text-slate-100 ${
            item.status === 'done' ? 'line-through opacity-60' : ''
          }`}
        >
          {item.title}
        </h3>
        <span className="shrink-0 text-[11px] text-slate-400">
          {timeAgo(item.updatedAt)}
        </span>
      </div>

      {item.body && (
        <p className="whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-300">
          {item.body}
        </p>
      )}

      {/* Type-specific row */}
      {isTask &&
        (() => {
          const open = item.status !== 'done';
          const days = open ? dueDaysUntil(item.due) : null;
          const urgent = isUrgent(days);
          return (
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <button
                onClick={cycleStatus}
                className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[item.status ?? 'todo']}`}
                title="Click to advance status"
              >
                {STATUS_LABEL[item.status ?? 'todo']}
              </button>
              {urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  <Icon name="alert" size={12} strokeWidth={2.2} /> Urgent
                </span>
              )}
              {item.priority && (
                <span className="inline-flex items-center gap-1.5 text-[#9a948a] dark:text-[#8b9183]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[item.priority]}`}
                  />
                  {item.priority}
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

      {/* Tags */}
      {item.tags.length > 0 && (
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
      )}

      {/* Action bar */}
      <div className="mt-auto flex items-center gap-2 border-t border-[#f0ede6] pt-3 dark:border-[#262c25]">
        {isTask ? (
          item.status !== 'done' ? (
            <button
              className="btn-primary h-9 flex-1 text-[13px] font-semibold"
              onClick={() => updateItem(item.id, { status: 'done' })}
              title="Mark as done"
            >
              <Icon name="check" size={15} strokeWidth={2.2} /> Done
            </button>
          ) : (
            <span className="flex-1" />
          )
        ) : (
          <>
            {item.type === 'thought' && (
              <button
                className="btn-ghost h-8 px-2.5 text-xs"
                onClick={() => updateItem(item.id, patchForTypeChange('idea'))}
                title="Move this thought to Ideas"
              >
                <Mark shape="triangle" size={12} /> To idea
              </button>
            )}
            <button
              className="btn-ghost h-8 px-2.5 text-xs"
              onClick={() => updateItem(item.id, patchForTypeChange('task'))}
              title={`Move this ${item.type} to Tasks`}
            >
              <Mark shape="square" size={12} /> To task
            </button>
            <span className="flex-1" />
          </>
        )}
        <button
          className="btn-ghost h-8 w-8 shrink-0 !px-0"
          onClick={() => onEdit(item)}
          aria-label="Edit"
          title="Edit"
        >
          <Icon name="pencil" />
        </button>
        <button
          className="btn h-8 w-8 shrink-0 !px-0 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-[#9aa094] dark:hover:bg-[#3a1e22] dark:hover:text-rose-400"
          onClick={() => deleteItem(item.id)}
          aria-label="Delete"
          title="Delete"
        >
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}
