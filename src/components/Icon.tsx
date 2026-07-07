export type IconName =
  | 'check'
  | 'pencil'
  | 'trash'
  | 'sun'
  | 'moon'
  | 'alert'
  | 'x';

/** Monoline action icons (lucide-style paths) matching the Mark system. */
const PATHS: Record<IconName, string[]> = {
  check: ['M20 6 9 17l-5-5'],
  pencil: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z'],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ],
  sun: [
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41',
  ],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  alert: [
    'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z',
    'M12 9v4',
    'M12 17h.01',
  ],
  x: ['M18 6 6 18', 'm6 6 12 12'],
};

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
