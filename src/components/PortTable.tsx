import type { PortInfo, FavoritePort } from "../types";
import { detectService, isHttpServer, formatUptime } from "../services/detectionService";
import { isFavorite } from "../services/settingsService";
import { openUrl } from "./Actions";

interface Props {
  ports: PortInfo[];
  favorites: FavoritePort[];
  onSelect: (port: PortInfo) => void;
  onKill: (pid: number) => void;
  onToggleFavorite: (port: PortInfo) => void;
}

export default function PortTable({
  ports,
  favorites,
  onSelect,
  onKill,
  onToggleFavorite,
}: Props) {
  if (ports.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
        No ports found
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <tr>
          <th className="px-4 py-2 text-left">⭐</th>
          <th className="px-4 py-2 text-left">Port</th>
          <th className="px-4 py-2 text-left">Protocol</th>
          <th className="px-4 py-2 text-left">Process</th>
          <th className="px-4 py-2 text-left">PID</th>
          <th className="px-4 py-2 text-left">Address</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">Uptime</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {ports.map((p) => {
          const service = detectService(p);
          const http = isHttpServer(p);
          const fav = isFavorite(p.port, favorites);

          return (
            <tr
              key={`${p.port}-${p.pid}`}
              className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
              onClick={() => onSelect(p)}
            >
              <td className="px-4 py-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(p);
                  }}
                  className="text-lg"
                >
                  {fav ? "★" : "☆"}
                </button>
              </td>
              <td className="px-4 py-2 font-mono">{p.port}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    p.protocol === "TCP"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {p.protocol}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  {service && <span>{service.icon}</span>}
                  <span>{p.process_name}</span>
                  {service && (
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)]">
                      {service.name}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2 font-mono">{p.pid}</td>
              <td className="px-4 py-2 font-mono text-xs">{p.local_address}</td>
              <td className="px-4 py-2">
                <span className="text-green-400 text-xs">{p.status}</span>
              </td>
              <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">
                {formatUptime(p.start_time)}
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {http && (
                    <button
                      onClick={() => openUrl(`http://localhost:${p.port}`)}
                      className="px-2 py-1 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-xs text-white"
                    >
                      Open
                    </button>
                  )}
                  <button
                    onClick={() => onKill(p.pid)}
                    className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs"
                  >
                    Kill
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
