import { useMemo, useState } from 'react';
import type { Item, ItemType } from '../types';
import { ITEM_DRAG_TYPE, ITEM_TYPES, TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';
import { ItemCard } from '../components/ItemCard';
import { Modal } from '../components/Modal';
import { ItemForm } from '../components/ItemForm';

export function SearchView() {
  const { items, updateItem } = useStore();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Item | null>(null);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = items;
    if (typeFilter !== 'all') r = r.filter((i) => i.type === typeFilter);
    if (q) {
      r = r.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.body.toLowerCase().includes(q) ||
          i.tags.some((t) => t.includes(q)),
      );
    }
    return [...r].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [items, query, typeFilter]);

  const grouped = useMemo(() => {
    const g = new Map<ItemType, Item[]>();
    for (const i of results) {
      if (!g.has(i.type)) g.set(i.type, []);
      g.get(i.type)!.push(i);
    }
    return g;
  }, [results]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        🔍 Search
      </h1>

      <input
        autoFocus
        className="input h-12 text-base"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search across everything — titles, notes, tags, links…"
      />

      <div className="flex flex-wrap gap-1.5">
        <button
          className={`chip ${typeFilter === 'all' ? 'bg-brand-600 text-white' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          all
        </button>
        {ITEM_TYPES.map((t) => (
          <button
            key={t}
            className={`chip ${typeFilter === t ? 'bg-brand-600 text-white' : ''}`}
            onClick={() => setTypeFilter(t)}
          >
            {TYPE_META[t].icon} {TYPE_META[t].plural}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      {Array.from(grouped.entries()).map(([type, list]) => (
        <section key={type} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {TYPE_META[type].icon} {TYPE_META[type].plural} ({list.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(ITEM_DRAG_TYPE, item.id)
                }
              >
                <ItemCard item={item} onEdit={setEditing} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {results.length === 0 && (
        <div className="card py-12 text-center text-slate-400">
          {query ? 'No matches found.' : 'Start typing to search.'}
        </div>
      )}

      <Modal open={editing !== null} title="Edit" onClose={() => setEditing(null)}>
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
