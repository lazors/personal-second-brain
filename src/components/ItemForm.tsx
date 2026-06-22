import { useState } from 'react';
import type { Item, ItemType, Priority, TaskStatus } from '../types';
import { TYPE_META } from '../types';
import { parseTags, tsToDateInput, dateInputToTs } from '../lib/util';

export interface ItemFormValues {
  type: ItemType;
  title: string;
  body: string;
  tags: string[];
  status?: TaskStatus;
  priority?: Priority;
  due?: number;
  url?: string;
  unit?: string;
}

interface ItemFormProps {
  initial?: Partial<Item>;
  fixedType?: ItemType;
  onSubmit: (values: ItemFormValues) => void;
  onCancel: () => void;
}

export function ItemForm({
  initial,
  fixedType,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const [type, setType] = useState<ItemType>(
    initial?.type ?? fixedType ?? 'thought',
  );
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'todo');
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? 'med',
  );
  const [due, setDue] = useState(tsToDateInput(initial?.due));
  const [url, setUrl] = useState(initial?.url ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      title,
      body,
      tags: parseTags(tags),
      ...(type === 'task' ? { status, priority, due: dateInputToTs(due) } : {}),
      ...(type === 'reference' ? { url: url.trim() } : {}),
      ...(type === 'tracker' ? { unit: unit.trim() } : {}),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {!fixedType && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_META) as ItemType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`btn ${
                  type === t ? 'btn-primary' : 'btn-subtle'
                }`}
              >
                <span>{TYPE_META[t].icon}</span>
                {TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Title
        </label>
        <input
          autoFocus
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`${TYPE_META[type].label} title…`}
        />
      </div>

      {type === 'reference' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            URL
          </label>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      )}

      {type === 'task' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Status
            </label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">To do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Priority
            </label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Due
            </label>
            <input
              type="date"
              className="input"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
        </div>
      )}

      {type === 'tracker' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Unit (optional)
          </label>
          <input
            className="input"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="hours, kg, count…"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {type === 'reference' ? 'Notes' : 'Body'}
        </label>
        <textarea
          className="input min-h-[96px] resize-y"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details, context, links…"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          Tags (comma separated)
        </label>
        <input
          className="input"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="work, urgent, project-x"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-subtle" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}
