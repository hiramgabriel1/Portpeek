import { useEffect, useState } from "react";
import type { PortInfo } from "../types";
import { getProcessDetails, killProcess as killProc } from "../services/portService";
import {
  detectService,
  formatUptime,
  formatMemory,
} from "../services/detectionService";
import { copyToClipboard, openUrl } from "./Actions";

interface Props {
  port: PortInfo;
  onClose: () => void;
  onKill: (pid: number) => void;
  onToggleFavorite: (port: PortInfo) => void;
  isFav: boolean;
}

export default function DetailsPanel({
  port,
  onClose,
  onKill,
  onToggleFavorite,
  isFav,
}: Props) {
  const [details, setDetails] = useState<Awaited<ReturnType<typeof getProcessDetails>>>(null);

  useEffect(() => {
    getProcessDetails(port.pid).then(setDetails);
  }, [port.pid]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">Process Details</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Port" value={port.port.toString()} onCopy={() => copyToClipboard(port.port.toString())} />
            <InfoRow label="Protocol" value={port.protocol} />
            <InfoRow label="PID" value={port.pid.toString()} onCopy={() => copyToClipboard(port.pid.toString())} />
            <InfoRow label="Status" value={port.status} />
            <InfoRow label="Address" value={port.local_address} />
            <InfoRow label="Uptime" value={formatUptime(port.start_time)} />
            <InfoRow label="CPU" value={`${port.cpu_usage.toFixed(1)}%`} />
            <InfoRow label="Memory" value={formatMemory(port.memory_usage)} />
            <InfoRow label="Parent PID" value={port.parent_pid.toString()} />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)]">Process Name</label>
            <p className="font-mono text-sm mt-1">{port.process_name}</p>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)]">Executable Path</label>
            <p className="font-mono text-xs mt-1 break-all">{port.executable_path || "N/A"}</p>
            {port.executable_path && (
              <button onClick={() => copyToClipboard(port.executable_path)} className="text-xs text-[var(--accent)] mt-1">
                Copy
              </button>
            )}
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)]">Command</label>
            <p className="font-mono text-xs mt-1 break-all">{port.command || "N/A"}</p>
            {port.command && (
              <button onClick={() => copyToClipboard(port.command)} className="text-xs text-[var(--accent)] mt-1">
                Copy
              </button>
            )}
          </div>

          {details?.working_directory && (
            <div>
              <label className="text-xs text-[var(--text-secondary)]">Working Directory</label>
              <p className="font-mono text-xs mt-1 break-all">{details.working_directory}</p>
            </div>
          )}

          {details && details.child_pids.length > 0 && (
            <div>
              <label className="text-xs text-[var(--text-secondary)]">Child Processes</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {details.child_pids.map((pid) => (
                  <span key={pid} className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs font-mono">
                    {pid}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => onToggleFavorite(port)}
              className="px-4 py-2 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-sm"
            >
              {isFav ? "Unpin" : "Pin"}
            </button>
            {port.command?.toLowerCase().includes("http") || [80, 443, 3000, 8080, 5173].includes(port.port) ? (
              <button
                onClick={() => openUrl(`http://localhost:${port.port}`)}
                className="px-4 py-2 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-sm text-white"
              >
                Open in Browser
              </button>
            ) : null}
            <button
              onClick={() => onKill(port.pid)}
              className="px-4 py-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm ml-auto"
            >
              Kill Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-secondary)]">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <p className="font-mono text-sm">{value}</p>
        {onCopy && (
          <button onClick={onCopy} className="text-xs text-[var(--accent)]">
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
