import { useState, useEffect, useCallback, useMemo } from "react";
import { scanPorts, killProcess as killProc } from "./services/portService";
import {
  detectService,
  isHttpServer,
  formatUptime,
  formatMemory,
} from "./services/detectionService";
import {
  loadSettings,
  saveSettings,
  loadFavorites,
  saveFavorites,
  isFavorite,
  toggleFavorite,
} from "./services/settingsService";
import type {
  PortInfo,
  SortField,
  SortDirection,
  FilterType,
  Settings,
  FavoritePort,
} from "./types";
import PortTable from "./components/PortTable";
import DetailsPanel from "./components/DetailsPanel";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import SettingsPanel from "./components/SettingsPanel";

function App() {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("port");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedPort, setSelectedPort] = useState<PortInfo | null>(null);
  const [favorites, setFavorites] = useState<FavoritePort[]>(loadFavorites);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  const fetchPorts = useCallback(async () => {
    try {
      const data = await scanPorts();
      setPorts(data);
    } catch (err) {
      console.error("Failed to scan ports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPorts();
  }, [fetchPorts]);

  useEffect(() => {
    const interval = setInterval(fetchPorts, settings.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPorts, settings.refreshInterval]);

  const handleKill = async (pid: number) => {
    if (confirm(`Kill process ${pid}?`)) {
      await killProc(pid);
      fetchPorts();
    }
  };

  const handleToggleFavorite = (portInfo: PortInfo) => {
    const updated = toggleFavorite(portInfo, favorites);
    setFavorites(updated);
    saveFavorites(updated);
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const conflicts = useMemo(() => {
    const portMap = new Map<number, Set<number>>();
    ports.forEach((p) => {
      if (!portMap.has(p.port)) portMap.set(p.port, new Set());
      portMap.get(p.port)!.add(p.pid);
    });
    return Array.from(portMap.entries())
      .filter(([, pids]) => pids.size > 1)
      .map(([port]) => port);
  }, [ports]);

  const conflictPorts = useMemo(() => {
    return new Set(conflicts);
  }, [conflicts]);

  const filteredAndSorted = useMemo(() => {
    let result = [...ports];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.port.toString().includes(q) ||
          p.process_name.toLowerCase().includes(q) ||
          p.pid.toString().includes(q) ||
          p.executable_path.toLowerCase().includes(q)
      );
    }

    if (filter !== "all") {
      result = result.filter((p) => {
        const service = detectService(p);
        switch (filter) {
          case "http":
            return isHttpServer(p);
          case "database":
            return service?.category === "database";
          case "docker":
            return service?.category === "docker";
          case "node":
            return service?.category === "node";
          case "python":
            return service?.category === "python";
          case "java":
            return service?.category === "java";
          case "system":
            return p.pid < 100;
          case "user":
            return p.pid >= 100;
          case "apps":
            return p.pid >= 100 && !["rapportd", "ControlCenter", "sharingd", "identitysd", "logioptionsplus_agent"].includes(p.process_name);
          case "terminal":
            return ["zsh", "bash", "fish", "node", "bun", "deno", "python"].includes(p.process_name.toLowerCase());
          case "other":
            return p.pid >= 100 && !["zsh", "bash", "fish", "node", "bun", "deno", "python"].includes(p.process_name.toLowerCase());
          case "favorites":
            return isFavorite(p.port, favorites);
          case "conflicts":
            return conflictPorts.has(p.port);
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => {
      const aFav = isFavorite(a.port, favorites) ? 0 : 1;
      const bFav = isFavorite(b.port, favorites) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;

      let cmp = 0;
      if (sortField === "port") cmp = a.port - b.port;
      else if (sortField === "process_name")
        cmp = a.process_name.localeCompare(b.process_name);
      else if (sortField === "pid") cmp = a.pid - b.pid;
      else if (sortField === "start_time") cmp = a.start_time - b.start_time;
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [ports, search, filter, sortField, sortDirection, favorites, conflictPorts]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ports.length };
    ports.forEach((p) => {
      const service = detectService(p);
      if (p.pid < 100) counts.system = (counts.system || 0) + 1;
      if (p.pid >= 100 && !["rapportd", "ControlCenter", "sharingd", "identitysd", "logioptionsplus_agent"].includes(p.process_name)) {
        counts.apps = (counts.apps || 0) + 1;
      }
      if (["zsh", "bash", "fish", "node", "bun", "deno", "python"].includes(p.process_name.toLowerCase())) {
        counts.terminal = (counts.terminal || 0) + 1;
      }
      if (p.pid >= 100 && !["zsh", "bash", "fish", "node", "bun", "deno", "python"].includes(p.process_name.toLowerCase())) {
        counts.other = (counts.other || 0) + 1;
      }
      if (isFavorite(p.port, favorites)) counts.favorites = (counts.favorites || 0) + 1;
    });
    counts.conflicts = conflicts.length;
    return counts;
  }, [ports, favorites, conflicts]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">PortPeek</h1>
          <span className="text-sm text-[var(--text-secondary)]">{ports.length} listening ports</span>
          {conflicts.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--warning)]/20 text-[var(--warning)] text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {conflicts.length} PORT{conflicts.length > 1 ? 'S' : ''} IN CONFLICT
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPorts}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="px-6 py-3 border-b border-[var(--border)]">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
        />
      </div>

      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--text-secondary)]">Scanning ports...</p>
          </div>
        ) : (
          <PortTable
            ports={filteredAndSorted}
            favorites={favorites}
            onSelect={setSelectedPort}
            onKill={handleKill}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>

      {selectedPort && (
        <DetailsPanel
          port={selectedPort}
          onClose={() => setSelectedPort(null)}
          onKill={handleKill}
          onToggleFavorite={handleToggleFavorite}
          isFav={isFavorite(selectedPort.port, favorites)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
