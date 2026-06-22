import { useState } from 'react';
import type { ItemType } from '../types';
import { ITEM_TYPES, TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';

/**
 * Always-visible capture bar: pick a type, type a title, Enter to save.
 * The fastest path to getting something out of your head and into the brain.
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
    <div className="flex items-center gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ItemType)}
        className="input h-10 w-auto shrink-0"
        title="Capture type"
      >
        {ITEM_TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_META[t].icon} {TYPE_META[t].label}
          </option>
        ))}
      </select>
      <input
        className={`input h-10 transition-shadow ${
          flash ? 'ring-2 ring-emerald-400' : ''
        }`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
        }}
        placeholder="Quick capture — type and press Enter…"
      />
      <button className="btn-primary h-10 shrink-0" onClick={save}>
        Capture
      </button>
    </div>
  );
}
