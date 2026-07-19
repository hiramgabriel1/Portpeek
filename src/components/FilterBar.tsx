import type { FilterType } from "../types";

interface Props {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  counts: Record<string, number>;
}

const FILTERS = [
  { value: "all", label: "All", icon: "layers" },
  { value: "system", label: "System", icon: "cpu" },
  { value: "apps", label: "Apps", icon: "app" },
  { value: "terminal", label: "Terminal", icon: "terminal" },
  { value: "other", label: "Other", icon: "circle" },
  { value: "favorites", label: "Favorites", icon: "star" },
  { value: "conflicts", label: "Conflicts", icon: "alert" },
];

export default function FilterBar({ filter, onFilterChange, counts }: Props) {
  return (
    <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1">
      {FILTERS.map((f) => {
        const count = counts[f.value] || 0;
        const isActive = filter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value as FilterType)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50"
            }`}
          >
            {f.value === "conflicts" && count > 0 ? (
              <svg className="w-3.5 h-3.5 text-[var(--warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : f.value === "favorites" ? (
              <svg className="w-3.5 h-3.5" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ) : null}
            <span>{f.label}</span>
            <span className={`text-[10px] ${isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-secondary)]/60"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
