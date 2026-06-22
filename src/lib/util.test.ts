import { describe, it, expect } from 'vitest';
import { parseTags, timeAgo, dateInputToTs, tsToDateInput } from './util';

describe('parseTags', () => {
  it('splits, trims, lowercases, strips #, dedupes', () => {
    expect(parseTags('Work, #urgent,  work , ,Project-X')).toEqual([
      'work',
      'urgent',
      'project-x',
    ]);
  });
  it('handles empty input', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('timeAgo', () => {
  const now = 1_000_000_000_000;
  it('reports just now under a minute', () => {
    expect(timeAgo(now - 30_000, now)).toBe('just now');
  });
  it('reports minutes', () => {
    expect(timeAgo(now - 5 * 60_000, now)).toBe('5m ago');
  });
  it('reports hours and days', () => {
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe('3h ago');
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe('2d ago');
  });
});

describe('date input round-trip', () => {
  it('converts to ms and back to yyyy-mm-dd', () => {
    const ts = dateInputToTs('2026-06-22');
    expect(ts).toBeTypeOf('number');
    expect(tsToDateInput(ts)).toBe('2026-06-22');
  });
  it('returns undefined/empty for blanks', () => {
    expect(dateInputToTs('')).toBeUndefined();
    expect(tsToDateInput(undefined)).toBe('');
  });
});
