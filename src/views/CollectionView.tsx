import { useMemo, useRef, useState } from 'react';
import type { Item, ItemType, TaskStatus } from '../types';
import { TYPE_META } from '../types';
import { useStore } from '../store/StoreContext';
import { ItemCard } from '../components/ItemCard';
import { Modal } from '../components/Modal';
import { ItemForm } from '../components/ItemForm';
import type { ItemFormValues } from '../components/ItemForm';

interface CollectionViewProps {
  type: ItemType;
}

const TASK_ORDER: Record<TaskStatus, number> = { todo: 0, doing: 1, done: 2 };
const PRIORITY_ORDER: Record<string, number> = { high: 0, med: 1, low: 2 };

const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To do' },
  { status: 'doing', label: 'Doing' },
  { status: 'done', label: 'Done' },
];

export function CollectionView({ type }: CollectionViewProps) {
  const { items, addItem, updateItem } = useStore();
  const meta = TYPE_META[type];

  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  // True for the click that immediately follows a drag, so we can suppress it.
  const draggedRef = useRef(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items
      .filter((i) => i.type === type)
      .forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items, type]);

  const list = useMemo(() => {
    let result = items.filter((i) => i.type === type);
    if (activeTag) result = result.filter((i) => i.tags.includes(activeTag));
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.body.toLowerCase().includes(q) ||
          i.tags.some((t) => t.includes(q)),
      );
    }
    if (type === 'task') {
      result = [...result].sort((a, b) => {
        const s = TASK_ORDER[a.status ?? 'todo'] - TASK_ORDER[b.status ?? 'todo'];
        if (s !== 0) return s;
        const p =
          PRIORITY_ORDER[a.priority ?? 'med'] -
          PRIORITY_ORDER[b.priority ?? 'med'];
        if (p !== 0) return p;
        return (a.due ?? Infinity) - (b.due ?? Infinity);
      });
    } else {
      result = [...result].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return result;
  }, [items, type, activeTag, query]);

  const onSubmit = (values: ItemFormValues) => {
    if (editing) {
      updateItem(editing.id, values);
      setEditing(null);
    } else {
      addItem(values);
      setCreating(false);
    }
  };

  // Open a card's editor on click, unless the click landed on one of the
  // card's own controls (edit, delete, convert, tags).
  const openOnClick = (item: Item) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, label')) return;
    setEditing(item);
  };

  const dropTo = (status: TaskStatus) => {
    if (dragId) {
      const dragged = items.find((i) => i.id === dragId);
      if (dragged && dragged.status !== status) {
        updateItem(dragId, { status });
      }
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
            <span>{meta.icon}</span> {meta.plural}
          </h1>
          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>
              {list.length} {list.length === 1 ? 'item' : 'items'}
              {activeTag && ` · filtered by #${activeTag}`}
              {query.trim() && ` · matching "${query.trim()}"`}
            </span>
            {(activeTag || query.trim()) && (
              <button
                className="text-brand-600 hover:underline dark:text-brand-400"
                onClick={() => {
                  setActiveTag(null);
                  setQuery('');
                }}
              >
                Clear filters
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input h-9 w-48"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${meta.plural.toLowerCase()}…`}
          />
          <button className="btn-primary h-9" onClick={() => setCreating(true)}>
            + New {meta.label}
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`chip ${!activeTag ? 'bg-brand-600 text-white' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`chip ${
                activeTag === tag ? 'bg-brand-600 text-white' : ''
              }`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {type === 'task' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {TASK_COLUMNS.map((col) => {
            const cards = list.filter(
              (i) => (i.status ?? 'todo') === col.status,
            );
            const isOver = dragOver === col.status;
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.status);
                }}
                onDragLeave={() => setDragOver((s) => (s === col.status ? null : s))}
                onDrop={() => dropTo(col.status)}
                className={`flex flex-col gap-3 rounded-xl border p-3 transition-colors ${
                  isOver
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30'
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-slate-200 px-1.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {cards.length}
                  </span>
                </div>
                {cards.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-slate-400">
                    Drop tasks here
                  </p>
                ) : (
                  cards.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => {
                        setDragId(item.id);
                        draggedRef.current = true;
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOver(null);
                        // Clear after any trailing click has had a chance to fire.
                        setTimeout(() => {
                          draggedRef.current = false;
                        }, 0);
                      }}
                      onClick={(e) => {
                        // Suppress the click that immediately follows a drag.
                        if (draggedRef.current) {
                          draggedRef.current = false;
                          return;
                        }
                        openOnClick(item)(e);
                      }}
                      className={`cursor-grab active:cursor-grabbing ${
                        dragId === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      <ItemCard
                        item={item}
                        onEdit={setEditing}
                        onTagClick={(t) => setActiveTag(t)}
                      />
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-3xl">{meta.icon}</span>
          <p className="text-slate-500 dark:text-slate-400">
            No {meta.plural.toLowerCase()} yet.
          </p>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            + Add your first {meta.label.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((item) => (
            <div
              key={item.id}
              onClick={openOnClick(item)}
              className="cursor-pointer"
            >
              <ItemCard
                item={item}
                onEdit={setEditing}
                onTagClick={(t) => setActiveTag(t)}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        title={editing ? `Edit ${meta.label}` : `New ${meta.label}`}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      >
        <ItemForm
          fixedType={type}
          initial={editing ?? undefined}
          onSubmit={onSubmit}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}
