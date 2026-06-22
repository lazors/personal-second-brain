import type { Item } from '../types';

const BASE = '/api';

async function asJson(res: Response) {
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error ?? '';
    } catch {
      /* ignore */
    }
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Load every board item (parsed from the .md files on disk). */
export async function fetchItems(): Promise<Item[]> {
  const data = await asJson(await fetch(`${BASE}/items`));
  return Array.isArray(data.items) ? data.items : [];
}

/** Create a new item (writes a new .md file). */
export async function createItem(item: Item): Promise<Item> {
  const data = await asJson(
    await fetch(`${BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }),
  );
  return data.item;
}

/** Update an existing item (rewrites its .md file). */
export async function putItem(item: Item): Promise<Item> {
  const data = await asJson(
    await fetch(`${BASE}/items/${encodeURIComponent(item.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }),
  );
  return data.item;
}

/** Delete an item (removes its .md file). */
export async function deleteItem(id: string): Promise<void> {
  await asJson(
    await fetch(`${BASE}/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  );
}

/** Import items in bulk; mode 'merge' upserts, 'replace' wipes first. */
export async function bulkImport(
  items: Item[],
  mode: 'merge' | 'replace',
): Promise<Item[]> {
  const data = await asJson(
    await fetch(`${BASE}/items/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, mode }),
    }),
  );
  return Array.isArray(data.items) ? data.items : [];
}

/** Parse an export file (array or { items: [...] } envelope) into items. */
export function parseImport(raw: string): Item[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  const arr = Array.isArray(parsed)
    ? parsed
    : (parsed as { items?: unknown })?.items;
  if (!Array.isArray(arr)) throw new Error('No item list found in file.');
  const valid = arr.filter(
    (v): v is Item =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as Item).id === 'string' &&
      typeof (v as Item).type === 'string',
  );
  if (valid.length === 0) throw new Error('No valid items found in file.');
  return valid;
}

/** Build a pretty JSON export string from items. */
export function exportJSON(items: Item[]): string {
  return JSON.stringify({ version: 1, exportedAt: Date.now(), items }, null, 2);
}
