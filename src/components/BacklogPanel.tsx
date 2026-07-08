import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { timeAgo } from '../lib/util';
import { Icon } from './Icon';

/**
 * Floating backlog of finished tasks, anchored to the bottom-left corner.
 *
 * Marking a task done removes it from the board but keeps its markdown file;
 * this drawer is where those tasks live afterwards. From here a task can be
 * restored to the board ("To do") or deleted for real (file removed).
 */
export function BacklogPanel() {
  const { items, updateItem, deleteItem } = useStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const done = useMemo(
    () =>
      items
        .filter((i) => i.type === 'task' && i.status === 'done')
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [items],
  );

  // Dismiss on click outside or Escape while open.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="fixed bottom-4 left-4 z-40">
      {open && (
        <div className="backlog-panel absolute bottom-full left-0 mb-2.5 flex max-h-[min(60vh,26rem)] w-80 flex-col overflow-hidden rounded-xl border border-[#e7e4de] bg-[#fbfaf7] shadow-xl dark:border-[#2a302a] dark:bg-[#1b201a]">
          <div className="flex items-center gap-2 border-b border-[#f0ede6] px-4 py-2.5 dark:border-[#262c25]">
            <span className="font-serif text-[15px] italic text-[#2c2a26] dark:text-[#ebece6]">
              Backlog
            </span>
            {done.length > 0 && (
              <span className="rounded-full bg-[#e8efed] px-2 text-[11px] text-[#7c8e88] dark:bg-[#234032] dark:text-[#8fd6a8]">
                {done.length}
              </span>
            )}
            <span className="flex-1" />
            <button
              className="btn-ghost h-7 w-7 !px-0"
              onClick={() => setOpen(false)}
              aria-label="Close backlog"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {done.length === 0 ? (
            <p className="px-4 py-8 text-center font-serif text-[13px] italic text-[#a39d92] dark:text-[#6b7163]">
              Nothing here yet — tasks you mark done land in the backlog.
            </p>
          ) : (
            <ul className="divide-y divide-[#f0ede6] overflow-y-auto dark:divide-[#262c25]">
              {done.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span
                    className="shrink-0 text-[#2c6f49] dark:text-[#6fc28d]"
                    aria-hidden
                  >
                    <Icon name="check" size={14} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-[#5c574e] dark:text-[#b6bbb0]">
                      {item.title}
                    </span>
                    <span className="block text-[11px] text-[#a8a298] dark:text-[#6b7163]">
                      done {timeAgo(item.updatedAt)}
                    </span>
                  </span>
                  <button
                    className="btn-ghost h-7 w-7 shrink-0 !px-0"
                    onClick={() => updateItem(item.id, { status: 'todo' })}
                    aria-label={`Restore "${item.title}" to the board`}
                    title="Restore to To do"
                  >
                    <Icon name="undo" size={14} />
                  </button>
                  <button
                    className="btn h-7 w-7 shrink-0 !px-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-[#9aa094] dark:hover:bg-[#3a1e22] dark:hover:text-rose-400"
                    onClick={() => deleteItem(item.id)}
                    aria-label={`Delete "${item.title}" permanently`}
                    title="Delete permanently"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        className={`flex items-center gap-2 rounded-full bg-[#33514d] px-4 py-2 text-[13px] font-medium text-[#fbfaf7] shadow-md transition-opacity duration-200 dark:bg-[#2c4d3a] dark:text-[#cdeed9] ${
          open ? 'opacity-100' : 'opacity-50 hover:opacity-100 focus-visible:opacity-100'
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Toggle backlog of done tasks"
      >
        <Icon name="check" size={14} strokeWidth={2.2} /> Backlog
        {done.length > 0 && (
          <span className="rounded-full bg-white/20 px-1.5 text-[11px]">
            {done.length}
          </span>
        )}
      </button>
    </div>
  );
}
