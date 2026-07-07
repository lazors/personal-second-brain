export type ItemType = 'thought' | 'idea' | 'task';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Priority = 'low' | 'med' | 'high';

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
}

export const ITEM_TYPES: ItemType[] = ['thought', 'idea', 'task'];

export const TYPE_META: Record<
  ItemType,
  { label: string; plural: string; accent: string }
> = {
  thought: {
    label: 'Thought',
    plural: 'Thoughts',
    accent: 'text-[#33514d] dark:text-[#6fc28d]',
  },
  idea: {
    label: 'Idea',
    plural: 'Ideas',
    accent: 'text-[#b08a45] dark:text-[#d8b46a]',
  },
  task: {
    label: 'Task',
    plural: 'Tasks',
    accent: 'text-[#2c6f49] dark:text-[#6fc28d]',
  },
};

/** Defaults applied when creating a fresh item of a given type. */
export function defaultsForType(type: ItemType): Partial<Item> {
  switch (type) {
    case 'task':
      return { status: 'todo', priority: 'med' };
    default:
      return {};
  }
}

/** Patch that converts an existing item to another type, resetting task fields. */
export function patchForTypeChange(type: ItemType): Partial<Item> {
  return type === 'task'
    ? { type, status: 'todo', priority: undefined, due: undefined }
    : { type, status: undefined, priority: undefined, due: undefined };
}

/** dataTransfer type used to drag items between views (e.g. onto sidebar tabs). */
export const ITEM_DRAG_TYPE = 'application/x-second-brain-item-id';
