import { invoke } from "@tauri-apps/api/core";

export async function copyToClipboard(text: string): Promise<void> {
  await invoke("plugin:clipboard_manager|write_text", { text });
}

export async function openUrl(url: string): Promise<void> {
  const { open } = await import("@tauri-apps/plugin-shell");
  await open(url);
}
