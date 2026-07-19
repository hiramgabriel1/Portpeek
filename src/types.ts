export interface PortInfo {
  port: number;
  protocol: string;
  local_address: string;
  pid: number;
  process_name: string;
  executable_path: string;
  command: string;
  status: string;
  start_time: number;
  cpu_usage: number;
  memory_usage: number;
  parent_pid: number;
}

export interface ProcessDetails {
  pid: number;
  name: string;
  executable_path: string;
  command: string;
  working_directory: string;
  cpu_usage: number;
  memory_usage: number;
  parent_pid: number;
  child_pids: number[];
  start_time: number;
}

export type SortField = "port" | "process_name" | "pid" | "start_time";
export type SortDirection = "asc" | "desc";

export type FilterType =
  | "all"
  | "http"
  | "database"
  | "docker"
  | "node"
  | "python"
  | "java"
  | "system"
  | "user"
  | "apps"
  | "terminal"
  | "other"
  | "favorites"
  | "conflicts";

export interface Settings {
  refreshInterval: number;
  theme: "dark" | "light" | "system";
  minimizeToTray: boolean;
  startOnLogin: boolean;
  enableNotifications: boolean;
}

export interface FavoritePort {
  port: number;
  pid: number;
  process_name: string;
  pinned_at: number;
}
