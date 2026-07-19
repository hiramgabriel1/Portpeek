# PortPeek — Agent Guide

Tauri v2 desktop app (Rust backend + React 19/Vite frontend) for inspecting and managing local network ports. Inspired by Portero.

## Commands

```bash
npm run tauri dev      # dev mode (builds frontend + runs Rust backend)
npm run tauri build    # production build (macOS .app, Linux .deb/AppImage, Windows .exe)
npm run build          # frontend-only build (tsc + vite)
npm run dev            # Vite dev server only (port 1420, no Rust)
```

**Always use `npm run tauri dev` for development.** Running `npm run dev` alone skips the Rust backend entirely.

## Architecture

- **`src-tauri/src/main.rs`** — Single Rust file with all Tauri commands:
  - `scan_ports()` — Parses `lsof` (macOS), `ss` (Linux), or `netstat` (Windows) to find listening ports. Deduplicates by `(port, protocol, pid)` to avoid duplicate rows from multiple sockets.
  - `get_process_details(pid)` — Returns extended process info including child PIDs.
  - `kill_process(pid)` — Uses `kill -9` (Unix) or `taskkill /F` (Windows). Returns error message on failure.
- **`src/`** — React frontend. Entry: `src/main.tsx` → `App.tsx`.
- **`src/services/portService.ts`** — Thin wrapper calling `invoke()` for the 3 Tauri commands.
- **`src/services/detectionService.ts`** — Pure TS: service detection patterns, uptime/memory formatting.
- **`src/services/settingsService.ts`** — localStorage persistence for favorites and settings.

## Key Gotchas

- **Port scanning is OS-specific.** Each platform uses different system commands with `#[cfg(target_os = "...")]` branches. Test changes on the target OS.
- **`lsof` output parsing on macOS** uses columns: `parts[7]` = protocol (TCP/UDP), `parts[8]` = address:port. The port string contains trailing text like `64689 (LISTEN)`, so digits are extracted with `take_while(|c| c.is_ascii_digit())`.
- **Deduplication** in `scan_ports()` uses a `HashSet<(u16, String, u32)>` keyed on `(port, protocol, pid)`. Without it, `lsof` reports multiple sockets per process creating duplicate rows.
- **`kill_process` fails silently** if you try to kill system processes (PID < 100) without root. The command returns an error string — the frontend shows it in an alert.
- **Vite dev server runs on port 1420** (strict port, configured in `vite.config.ts`). Tauri connects to this during `tauri dev`.
- **No test suite exists.** Manual testing is the only verification. Run the app and check behavior.

## Style Conventions

- CSS uses Tailwind with CSS variables for theming (`--bg-primary`, `--accent`, etc.). Dark theme is default.
- Components are functional with inline event handlers. No separate CSS files beyond `index.css`.
- Rust code is a single `main.rs` file — no module splitting. Keep it that way unless the file grows significantly.

## Git

- `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/` are gitignored. Never commit build artifacts.
- Push directly to `main`. No CI workflows configured.
