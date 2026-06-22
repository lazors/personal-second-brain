/** Generate a reasonably-unique id without external deps. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

/** Parse a comma/space separated tag string into a clean tag array. */
export function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,\n]/)
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
    ),
  );
}

/** Format an epoch-ms timestamp as a short local date. */
export function formatDate(ts?: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Relative "time ago" string for recent activity. */
export function timeAgo(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

/** Convert a yyyy-mm-dd input value to epoch ms (local midnight). */
export function dateInputToTs(value: string): number | undefined {
  if (!value) return undefined;
  const d = new Date(value + 'T00:00:00');
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

/** Convert an epoch-ms timestamp to a yyyy-mm-dd input value. */
export function tsToDateInput(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DAY_MS = 86_400_000;

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole calendar days until `due` (negative = overdue), or null if no due. */
export function dueDaysUntil(due?: number, now: number = Date.now()): number | null {
  if (!due) return null;
  return Math.round((startOfDay(due) - startOfDay(now)) / DAY_MS);
}

export type DueUrgency = 'overdue' | 'today' | 'soon' | 'week' | 'later';

/** Bucket a days-until value. `soon` = due tomorrow. */
export function dueUrgency(days: number | null): DueUrgency | null {
  if (days === null) return null;
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'soon';
  if (days <= 7) return 'week';
  return 'later';
}

/** A task counts as "urgent" when it's overdue, due today, or due tomorrow. */
export function isUrgent(days: number | null): boolean {
  return days !== null && days <= 1;
}

/** Short human label for a days-until value. */
export function dueLabel(days: number): string {
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `in ${days}d`;
  return `in ${days}d`;
}
