// File-based item store: one .md file per board item, organized into per-type
// folders under a data directory (default ./brain, override with BRAIN_DIR).
//
// The markdown files ARE the source of truth — so a Claude Code routine or
// schedule can read and edit them directly and the app will reflect it.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { itemToMarkdown, markdownToItem } from './markdown.js';

const TYPE_FOLDER = {
  thought: 'thoughts',
  idea: 'ideas',
  task: 'tasks',
};

export class MarkdownStore {
  constructor(dir) {
    this.dir = dir || process.env.BRAIN_DIR || path.join(process.cwd(), 'brain');
  }

  folderFor(type) {
    return path.join(this.dir, TYPE_FOLDER[type] || 'misc');
  }

  /** Read and parse every .md file under the data directory. */
  async list() {
    const items = [];
    for (const folder of Object.values(TYPE_FOLDER)) {
      const abs = path.join(this.dir, folder);
      let names;
      try {
        names = await fs.readdir(abs);
      } catch {
        continue; // folder doesn't exist yet
      }
      for (const name of names) {
        if (!name.endsWith('.md')) continue;
        try {
          const text = await fs.readFile(path.join(abs, name), 'utf8');
          const item = markdownToItem(text);
          if (item.id && item.type) {
            item._path = path.join(folder, name);
            items.push(item);
          }
        } catch {
          // skip unreadable/corrupt file rather than failing the whole list
        }
      }
    }
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  }

  /** Locate the existing relative path for an item id, or null. */
  async findPath(id) {
    const items = await this.list();
    const hit = items.find((i) => i.id === id);
    return hit ? hit._path : null;
  }

  /** Create or update an item, writing/renaming its .md file as needed. */
  async write(item) {
    const folder = this.folderFor(item.type);
    await fs.mkdir(folder, { recursive: true });

    const desiredName = fileName(item);
    const desiredRel = path.join(TYPE_FOLDER[item.type] || 'misc', desiredName);
    const existingRel = await this.findPath(item.id);

    // Remove a stale file if the slug/type changed.
    if (existingRel && existingRel !== desiredRel) {
      await fs.rm(path.join(this.dir, existingRel), { force: true });
    }

    await fs.writeFile(
      path.join(this.dir, desiredRel),
      itemToMarkdown(item),
      'utf8',
    );
    const saved = { ...item };
    delete saved._path;
    return saved;
  }

  /** Delete an item's .md file by id. Returns true if something was removed. */
  async remove(id) {
    const rel = await this.findPath(id);
    if (!rel) return false;
    await fs.rm(path.join(this.dir, rel), { force: true });
    return true;
  }
}

/** Build a readable, collision-resistant filename: <slug>--<id8>.md */
export function fileName(item) {
  const slug = slugify(item.title) || 'untitled';
  const short = String(item.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 8) ||
    'noid';
  return `${slug}--${short}.md`;
}

export function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
    .replace(/-$/, '');
}
