import { useState } from "react";
import type { Settings } from "../types";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState<Settings>(settings);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm">Refresh Interval (ms)</label>
            <input
              type="number"
              value={form.refreshInterval}
              onChange={(e) =>
                setForm({ ...form, refreshInterval: Number(e.target.value) })
              }
              className="w-full mt-1 px-3 py-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm"
            />
          </div>

          <div>
            <label className="text-sm">Theme</label>
            <select
              value={form.theme}
              onChange={(e) =>
                setForm({
                  ...form,
                  theme: e.target.value as Settings["theme"],
                })
              }
              className="w-full mt-1 px-3 py-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">Enable Notifications</label>
            <input
              type="checkbox"
              checked={form.enableNotifications}
              onChange={(e) =>
                setForm({ ...form, enableNotifications: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">Minimize to Tray</label>
            <input
              type="checkbox"
              checked={form.minimizeToTray}
              onChange={(e) =>
                setForm({ ...form, minimizeToTray: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">Start on Login</label>
            <input
              type="checkbox"
              checked={form.startOnLogin}
              onChange={(e) =>
                setForm({ ...form, startOnLogin: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="px-4 py-2 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
