import { useRef, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { parseImport } from '../store/api';
import { useTheme } from '../lib/theme';

export function BackupControls() {
  const { exportJSON, importItems } = useStore();
  const { theme, toggle } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `second-brain-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const items = parseImport(text);
      const merge = confirm(
        `Import ${items.length} items.\n\nOK = merge with existing data.\nCancel = replace everything.`,
      );
      await importItems(items, merge ? 'merge' : 'replace');
      flash(`Imported ${items.length} items.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="flex items-center gap-2">
      {msg && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {msg}
        </span>
      )}
      <button
        className="btn-ghost h-9 w-9 !px-0"
        onClick={toggle}
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button className="btn-subtle h-9" onClick={doExport} title="Export JSON backup">
        Export
      </button>
      <button
        className="btn-subtle h-9"
        onClick={() => fileRef.current?.click()}
        title="Import JSON backup"
      >
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
