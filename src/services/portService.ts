import { invoke } from "@tauri-apps/api/core";
import type { PortInfo, ProcessDetails } from "../types";

export async function scanPorts(): Promise<PortInfo[]> {
  return invoke<PortInfo[]>("scan_ports");
}

export async function getProcessDetails(pid: number): Promise<ProcessDetails | null> {
  return invoke<ProcessDetails | null>("get_process_details", { pid });
}

export async function killProcess(pid: number): Promise<boolean> {
  return invoke<boolean>("kill_process", { pid });
}
