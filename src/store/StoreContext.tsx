import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Item, ItemType } from '../types';
import { defaultsForType } from '../types';
import { uid } from '../lib/util';
import * as api from './api';

export interface NewItemInput {
  type: ItemType;
  title: string;
  body?: string;
  tags?: string[];
  status?: Item['status'];
  priority?: Item['priority'];
  due?: number;
}

export type ConnState = 'loading' | 'ready' | 'error';

interface StoreValue {
  items: Item[];
  conn: ConnState;
  connError: string | null;
  reload: () => void;
  addItem: (input: NewItemInput) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  importItems: (incoming: Item[], mode: 'merge' | 'replace') => Promise<void>;
  exportJSON: () => string;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [conn, setConn] = useState<ConnState>('loading');
  const [connError, setConnError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setConn('loading');
    api
      .fetchItems()
      .then((loaded) => {
        setItems(loaded);
        setConn('ready');
        setConnError(null);
      })
      .catch((err: unknown) => {
        setConn('error');
        setConnError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Live updates: re-fetch when the server signals a data-dir change (e.g. a
  // markdown file added directly to the bind-mounted folder). EventSource
  // reconnects on its own, so a dropped connection degrades gracefully.
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/events');
    es.addEventListener('change', () => reload());
    return () => es.close();
  }, [reload]);

  /** Surface a background-write failure without losing the optimistic state. */
  const flagError = useCallback((err: unknown) => {
    setConnError(err instanceof Error ? err.message : String(err));
    setConn('error');
  }, []);

  const addItem = useCallback(
    (input: NewItemInput): Item => {
      const now = Date.now();
      const item: Item = {
        id: uid(),
        type: input.type,
        title: input.title.trim() || 'Untitled',
        body: input.body ?? '',
        tags: input.tags ?? [],
        createdAt: now,
        updatedAt: now,
        ...defaultsForType(input.type),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.due !== undefined ? { due: input.due } : {}),
      };
      setItems((prev) => [item, ...prev]);
      api.createItem(item).then(
        () => setConn('ready'),
        flagError,
      );
      return item;
    },
    [flagError],
  );

  const persist = useCallback(
    (next: Item) => {
      api.putItem(next).then(() => setConn('ready'), flagError);
    },
    [flagError],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<Item>) => {
      setItems((prev) => {
        const next = prev.map((it) =>
          it.id === id ? { ...it, ...patch, updatedAt: Date.now() } : it,
        );
        const changed = next.find((it) => it.id === id);
        if (changed) persist(changed);
        return next;
      });
    },
    [persist],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
      api.deleteItem(id).then(() => setConn('ready'), flagError);
    },
    [flagError],
  );

  const importItems = useCallback(
    async (incoming: Item[], mode: 'merge' | 'replace') => {
      const result = await api.bulkImport(incoming, mode);
      setItems(result);
      setConn('ready');
    },
    [],
  );

  const exportJSON = useCallback(() => api.exportJSON(items), [items]);

  const value: StoreValue = {
    items,
    conn,
    connError,
    reload,
    addItem,
    updateItem,
    deleteItem,
    importItems,
    exportJSON,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
