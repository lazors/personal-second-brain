import { useState } from 'react';
import type { ItemType } from '../types';
import { ITEM_TYPES, TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';
import { Mark } from './Mark';

/**
 * Always-visible capture bar: pick a type, type a title, Enter to save.
 * Segmented type control instead of a select — faster to scan, no emoji.
 */
export function QuickCapture() {
  const { addItem } = useStore();
  const [type, setType] = useState<ItemType>('thought');
  const [title, setTitle] = useState('');
  const [flash, setFlash] = useState(false);

  const save = () => {
    if (!title.trim()) return;
    addItem({ type, title });
    setTitle('');
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white py-1.5 pl-4 pr-2 transition-shadow dark:bg-[#1d2218] ${
        flash
          ? 'border-brand-400 ring-2 ring-brand-400/30'
          : 'border-[#e2dfd8] dark:border-[#2c322a]'
      }`}
    >
      <span className="shrink-0 text-brand-600 dark:text-[#6fc28d]">
        <Mark shape="plus" size={14} />
      </span>

      <input
        className="h-7 min-w-0 flex-1 border-none bg-transparent text-sm text-slate-900 placeholder:text-[#a8a298] focus:outline-none dark:text-[#dfe1da] dark:placeholder:text-[#6b7163]"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
        }}
        placeholder="Capture a thought, idea, or task…"
      />

      <div className="flex shrink-0 gap-0.5 rounded-lg bg-[#f1efe9] p-0.5 dark:bg-[#12150f]">
        {ITEM_TYPES.map((t) => {
          const active = t === type;
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-md px-3 py-1 text-[12.5px] transition-colors ${
                active
                  ? 'bg-[#33514d] font-semibold text-[#cdeed9] dark:bg-[#2c4d3a]'
                  : 'text-[#8a857c] hover:text-[#5c574e] dark:text-[#8b9183] dark:hover:text-[#b6bbb0]'
              }`}
            >
              {TYPE_META[t].label}
            </button>
          );
        })}
      </div>

      <button
        onClick={save}
        className="hidden shrink-0 rounded-md border border-[#e2dfd8] px-2 py-1 text-[11px] text-[#b3aea4] dark:border-[#2c322a] dark:text-[#6b7163] sm:inline-flex"
        title="Press Enter to capture"
      >
        ↵ enter
      </button>
    </div>
  );
}
