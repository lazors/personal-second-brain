export type ItemType = 'thought' | 'idea' | 'task' | 'reference' | 'tracker';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Priority = 'low' | 'med' | 'high';

export interface TrackerEntry {
  id: string;
  value: number;
  note?: string;
  at: number; // epoch ms
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  body: string;
  tags: string[];
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // task-specific
  status?: TaskStatus;
  priority?: Priority;
  due?: number; // epoch ms

  // reference-specific
  url?: string;

  // tracker-specific
  unit?: string;
  entries?: TrackerEntry[];
}

export const ITEM_TYPES: ItemType[] = [
  'thought',
  'idea',
  'task',
  'reference',
  'tracker',
];

export const TYPE_META: Record<
  ItemType,
  { label: string; plural: string; icon: string; accent: string }
> = {
  thought: { label: 'Thought', plural: 'Thoughts', icon: '💭', accent: 'sky' },
  idea: { label: 'Idea', plural: 'Ideas', icon: '💡', accent: 'amber' },
  task: { label: 'Task', plural: 'Tasks', icon: '✅', accent: 'emerald' },
  reference: { label: 'Reference', plural: 'References', icon: '🔗', accent: 'violet' },
  tracker: { label: 'Tracker', plural: 'Trackers', icon: '📈', accent: 'rose' },
};

/** Defaults applied when creating a fresh item of a given type. */
export function defaultsForType(type: ItemType): Partial<Item> {
  switch (type) {
    case 'task':
      return { status: 'todo', priority: 'med' };
    case 'tracker':
      return { entries: [], unit: '' };
    case 'reference':
      return { url: '' };
    default:
      return {};
  }
}
