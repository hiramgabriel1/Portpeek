import { useState } from "react";
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

function getCategory(p: PortInfo): { label: string; color: string } {
  const service = detectService(p);
  if (p.pid < 100) return { label: "SYSTEM", color: "bg-purple-500/20 text-purple-400" };
  if (service?.category === "database") return { label: "DATABASE", color: "bg-blue-500/20 text-blue-400" };
  if (service?.category === "node") return { label: "NODE", color: "bg-green-500/20 text-green-400" };
  if (service?.category === "python") return { label: "PYTHON", color: "bg-yellow-500/20 text-yellow-400" };
  if (service?.category === "docker") return { label: "DOCKER", color: "bg-cyan-500/20 text-cyan-400" };
  if (service?.category === "http") return { label: "HTTP", color: "bg-orange-500/20 text-orange-400" };
  return { label: "OTHER", color: "bg-gray-500/20 text-gray-400" };
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return `today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return `yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays < 7) return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function PortTable({
  ports,
  favorites,
  onSelect,
  onKill,
  onToggleFavorite,
}: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (ports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] gap-2">
        <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm">No ports found</p>
      </div>
    );
  }

  const toggleExpand = (key: string) => {
    const next = new Set(expandedRows);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedRows(next);
  };

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border)] z-10">
        <tr className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
          <th className="px-4 py-3 text-left w-8"></th>
          <th className="px-4 py-3 text-left w-20">Port</th>
          <th className="px-4 py-3 text-left w-16">Proto</th>
          <th className="px-4 py-3 text-left">Process</th>
          <th className="px-4 py-3 text-left w-20">PID</th>
          <th className="px-4 py-3 text-left w-24">Category</th>
          <th className="px-4 py-3 text-left w-24">Address</th>
          <th className="px-4 py-3 text-left w-28">Started</th>
          <th className="px-4 py-3 text-right w-32">Actions</th>
        </tr>
      </thead>
      <tbody>
        {ports.map((p) => {
          const service = detectService(p);
          const http = isHttpServer(p);
          const fav = isFavorite(p.port, favorites);
          const isSystem = p.pid < 100;
          const category = getCategory(p);
          const rowKey = `${p.port}-${p.pid}`;
          const isExpanded = expandedRows.has(rowKey);

          return (
            <>
              <tr
                key={rowKey}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
              >
                <td className="px-4 py-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(rowKey);
                    }}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-sm font-medium">{p.port}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      p.protocol === "TCP"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-green-500/15 text-green-400"
                    }`}
                  >
                    {p.protocol}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {service && <span className="text-sm">{service.icon}</span>}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{p.process_name}</span>
                      {service && service.name !== p.process_name && (
                        <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-[200px]">
                          {service.name}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs text-[var(--text-secondary)]">{p.pid}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${category.color}`}>
                    {category.label}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs text-[var(--text-secondary)]">{p.local_address.split(':')[0]}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs text-[var(--text-secondary)]">{formatDate(p.start_time)}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(p);
                      }}
                      className={`p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors ${fav ? "text-yellow-400" : "text-[var(--text-secondary)]"}`}
                      title={fav ? "Unpin" : "Pin"}
                    >
                      <svg className="w-4 h-4" fill={fav ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    {isSystem && (
                      <span className="p-1 text-[var(--text-secondary)]" title="System process">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                    )}
                    {http && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUrl(`http://localhost:${p.port}`);
                        }}
                        className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        title="Open in browser"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onKill(p.pid);
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                      title="Kill process"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              {isExpanded && (
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                  <td colSpan={9} className="px-4 py-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[var(--text-secondary)]">Executable: </span>
                        <span className="font-mono text-[var(--text-primary)]">{p.executable_path || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Command: </span>
                        <span className="font-mono text-[var(--text-primary)] truncate block">{p.command || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">CPU: </span>
                        <span className="text-[var(--text-primary)]">{p.cpu_usage.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Memory: </span>
                        <span className="text-[var(--text-primary)]">{(p.memory_usage / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          );
        })}
      </tbody>
    </table>
  );
}
