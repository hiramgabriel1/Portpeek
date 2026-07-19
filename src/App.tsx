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
  }, [ports, search, filter, sortField, sortDirection, favorites]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold">PortPeek</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-sm"
          >
            Settings
          </button>
        </div>
      </header>

      <div className="px-6 py-3 border-b border-[var(--border)]">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={(field) => {
            if (sortField === field) {
              setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
            } else {
              setSortField(field);
              setSortDirection("asc");
            }
          }}
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
