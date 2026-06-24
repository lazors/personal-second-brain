import { describe, it, expect } from 'vitest';
import { itemToMarkdown, markdownToItem } from './markdown.js';

const base = {
  id: 'abc12345',
  type: 'thought',
  title: 'Design the Q3 roadmap deck',
  body: 'Some **markdown** body.\nSecond line.',
  tags: ['work', 'roadmap'],
  createdAt: Date.parse('2026-06-22T09:00:00.000Z'),
  updatedAt: Date.parse('2026-06-22T10:00:00.000Z'),
};

describe('itemToMarkdown', () => {
  it('writes front-matter then body', () => {
    const md = itemToMarkdown(base);
    expect(md).toMatch(/^---\n/);
    expect(md).toContain('id: "abc12345"');
    expect(md).toContain('title: "Design the Q3 roadmap deck"');
    expect(md).toContain('tags: ["work","roadmap"]');
    expect(md).toContain('created: "2026-06-22T09:00:00.000Z"');
    expect(md).toContain('Some **markdown** body.');
  });

  it('omits empty optional fields', () => {
    const md = itemToMarkdown({ ...base, tags: [] });
    expect(md).not.toContain('tags:');
  });
});

describe('round-trip', () => {
  it('preserves a thought', () => {
    const back = markdownToItem(itemToMarkdown(base));
    expect(back).toMatchObject({
      id: base.id,
      type: 'thought',
      title: base.title,
      tags: base.tags,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
    });
    expect(back.body).toBe(base.body);
  });

  it('preserves a task with status/priority/due', () => {
    const task = {
      ...base,
      type: 'task',
      title: 'Review PR #42',
      status: 'doing',
      priority: 'high',
      due: Date.parse('2026-06-25T00:00:00.000Z'),
    };
    const md = itemToMarkdown(task);
    expect(md).toContain('status: "doing"');
    expect(md).toContain('due: "2026-06-25"');
    const back = markdownToItem(md);
    expect(back.status).toBe('doing');
    expect(back.priority).toBe('high');
    expect(back.due).toBe(task.due);
  });
});

describe('markdownToItem tolerance', () => {
  it('handles hand-edited unquoted scalars', () => {
    const md = [
      '---',
      'id: hand1',
      'type: task',
      'title: Buy milk',
      'status: todo',
      '---',
      '',
      'body text',
    ].join('\n');
    const item = markdownToItem(md);
    expect(item.id).toBe('hand1');
    expect(item.title).toBe('Buy milk');
    expect(item.status).toBe('todo');
    expect(item.body).toBe('body text');
  });

  it('handles CRLF line endings', () => {
    const md = itemToMarkdown(base).replace(/\n/g, '\r\n');
    const back = markdownToItem(md);
    expect(back.title).toBe(base.title);
  });
});
