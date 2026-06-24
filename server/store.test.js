import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MarkdownStore, slugify, fileName } from './store.js';

let dir;
let store;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'brain-test-'));
  store = new MarkdownStore(dir);
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function task(over = {}) {
  return {
    id: 'a',
    type: 'task',
    title: 'Do the thing',
    body: '',
    tags: [],
    status: 'todo',
    priority: 'med',
    createdAt: 1000,
    updatedAt: 1000,
    ...over,
  };
}

describe('MarkdownStore', () => {
  it('writes a .md file into the per-type folder', async () => {
    await store.write(task());
    const files = await fs.readdir(path.join(dir, 'tasks'));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.md$/);
  });

  it('lists written items', async () => {
    await store.write(task({ id: 'a', title: 'Alpha' }));
    await store.write(task({ id: 'b', title: 'Beta' }));
    const items = await store.list();
    expect(items.map((i) => i.title).sort()).toEqual(['Alpha', 'Beta']);
  });

  it('updates in place and renames when the title changes', async () => {
    const t = task({ id: 'a', title: 'Old title' });
    await store.write(t);
    await store.write({ ...t, title: 'New title', updatedAt: 2000 });
    const files = await fs.readdir(path.join(dir, 'tasks'));
    expect(files).toHaveLength(1); // old file removed, not duplicated
    expect(files[0]).toContain('new-title');
    const items = await store.list();
    expect(items[0].title).toBe('New title');
  });

  it('removes an item', async () => {
    await store.write(task({ id: 'a' }));
    expect(await store.remove('a')).toBe(true);
    expect(await store.list()).toHaveLength(0);
  });

  it('returns false when removing a missing item', async () => {
    expect(await store.remove('nope')).toBe(false);
  });
});

describe('slugify / fileName', () => {
  it('slugifies titles', () => {
    expect(slugify('Review PR #42 before standup!')).toBe(
      'review-pr-42-before-standup',
    );
    expect(slugify('   ')).toBe('');
  });
  it('builds <slug>--<id8>.md', () => {
    expect(fileName({ title: 'Hello World', id: 'abcdef1234567' })).toBe(
      'hello-world--abcdef12.md',
    );
  });
});
