// Markdown <-> item (de)serialization.
//
// Each board item is stored as a single .md file: a YAML front-matter block
// followed by the item body as plain markdown. We encode every front-matter
// value with JSON.stringify, which is also valid YAML flow syntax — so the
// files are human-readable, parseable by any YAML/front-matter tool (and by
// Claude Code routines), and round-trip losslessly.
//
// On-disk front-matter uses friendly fields (ISO dates); the API/Item shape
// uses epoch-ms. Conversion happens here.

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** ISO string (or undefined) from epoch ms. */
function toIso(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString();
}

/** Epoch ms (or undefined) from an ISO/date string. */
function fromIso(s) {
  if (!s || typeof s !== 'string') return undefined;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? undefined : ms;
}

/** "YYYY-MM-DD" (or undefined) from epoch ms, in UTC. */
function toDateOnly(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Serialize an Item (API shape, epoch-ms) to a .md file string. */
export function itemToMarkdown(item) {
  const fm = {};
  // Stable, readable key order.
  fm.id = item.id;
  fm.type = item.type;
  fm.title = item.title ?? '';
  if (Array.isArray(item.tags) && item.tags.length) fm.tags = item.tags;

  if (item.type === 'task') {
    if (item.status) fm.status = item.status;
    if (item.priority) fm.priority = item.priority;
    const due = toDateOnly(item.due);
    if (due) fm.due = due;
  }
  if (item.type === 'reference' && item.url) fm.url = item.url;
  if (item.type === 'tracker') {
    if (item.unit) fm.unit = item.unit;
    fm.entries = (item.entries ?? []).map((e) => ({
      id: e.id,
      value: e.value,
      ...(e.note ? { note: e.note } : {}),
      at: toIso(e.at) ?? e.at,
    }));
  }

  fm.created = toIso(item.createdAt);
  fm.updated = toIso(item.updatedAt);

  const lines = Object.entries(fm)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);

  const body = (item.body ?? '').replace(/\s+$/, '');
  return `---\n${lines.join('\n')}\n---\n\n${body}\n`;
}

/** Parse a .md file string back into an Item (API shape, epoch-ms). */
export function markdownToItem(text) {
  const match = text.match(FRONTMATTER_RE);
  const fm = {};
  let body = text;
  if (match) {
    body = text.slice(match[0].length);
    for (const raw of match[1].split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const valueStr = line.slice(idx + 1).trim();
      fm[key] = parseValue(valueStr);
    }
  }

  const item = {
    id: fm.id,
    type: fm.type,
    title: fm.title ?? '',
    body: body.replace(/^\s*\n/, '').replace(/\s+$/, ''),
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    createdAt: fromIso(fm.created) ?? 0,
    updatedAt: fromIso(fm.updated) ?? fromIso(fm.created) ?? 0,
  };

  if (fm.status) item.status = fm.status;
  if (fm.priority) item.priority = fm.priority;
  if (fm.due !== undefined) item.due = fromIso(String(fm.due));
  if (fm.url !== undefined) item.url = fm.url;
  if (fm.unit !== undefined) item.unit = fm.unit;
  if (Array.isArray(fm.entries)) {
    item.entries = fm.entries.map((e) => ({
      id: e.id,
      value: e.value,
      note: e.note,
      at: fromIso(e.at) ?? (typeof e.at === 'number' ? e.at : 0),
    }));
  }
  return item;
}

/** JSON.parse a front-matter value, falling back to the raw (unquoted) string. */
function parseValue(s) {
  if (s === '') return '';
  try {
    return JSON.parse(s);
  } catch {
    // Tolerate hand-edited unquoted scalars (e.g. `title: Hello world`).
    if (s === 'true') return true;
    if (s === 'false') return false;
    const n = Number(s);
    if (!Number.isNaN(n) && s.match(/^-?\d/)) return n;
    return s.replace(/^["']|["']$/g, '');
  }
}
