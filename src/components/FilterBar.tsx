import type { FilterType, SortField, SortDirection } from "../types";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "http", label: "HTTP" },
  { value: "database", label: "Databases" },
  { value: "docker", label: "Docker" },
  { value: "node", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "system", label: "System" },
  { value: "user", label: "User" },
];

interface Props {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
}

export default function FilterBar({
  filter,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
}: Props) {
  return (
    <div className="flex items-center gap-4 mt-3 flex-wrap">
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1 rounded text-xs ${
              filter === f.value
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-tertiary)] hover:bg-[var(--border)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 ml-auto">
        {(["port", "process_name", "pid", "start_time"] as SortField[]).map(
          (field) => (
            <button
              key={field}
              onClick={() => onSortChange(field)}
              className={`px-3 py-1 rounded text-xs ${
                sortField === field
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-tertiary)] hover:bg-[var(--border)]"
              }`}
            >
              {field === "start_time"
                ? "Uptime"
                : field === "process_name"
                  ? "Process"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field && (sortDirection === "asc" ? " ↑" : " ↓")}
            </button>
          )
        )}
      </div>
    </div>
  );
}
