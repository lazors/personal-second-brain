import type { ItemType } from '../types';

/**
 * Simple geometric marks used in place of emoji.
 * Calm, monoline shapes that inherit `currentColor`.
 */
export type MarkShape =
  | 'diamond' // overview / brand
  | 'circle' //  thought
  | 'triangle' // idea
  | 'square' //  task
  | 'search'
  | 'plus';

/** Which shape stands in for each collection type. */
export const TYPE_SHAPE: Record<ItemType, MarkShape> = {
  thought: 'circle',
  idea: 'triangle',
  task: 'square',
};

export function Mark({
  shape,
  size = 13,
  className,
}: {
  shape: MarkShape;
  size?: number;
  className?: string;
}) {
  const sw = 1.4;
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: sw,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={className}
      aria-hidden
    >
      {shape === 'diamond' && <path d="M6 1 L11 6 L6 11 L1 6 Z" {...common} />}
      {shape === 'circle' && <circle cx="6" cy="6" r="4.5" {...common} />}
      {shape === 'triangle' && <path d="M6 1.7 L10.6 10 L1.4 10 Z" {...common} />}
      {shape === 'square' && (
        <rect x="1.7" y="1.7" width="8.6" height="8.6" rx="2.2" {...common} />
      )}
      {shape === 'search' && (
        <>
          <circle cx="5" cy="5" r="3.4" {...common} />
          <line x1="7.6" y1="7.6" x2="10.5" y2="10.5" {...common} />
        </>
      )}
      {shape === 'plus' && (
        <>
          <line x1="6" y1="2.2" x2="6" y2="9.8" {...common} />
          <line x1="2.2" y1="6" x2="9.8" y2="6" {...common} />
        </>
      )}
    </svg>
  );
}
