# PortPeek

<p align="center">
  <img src="assets/portpeek.png" alt="PortPeek Logo" width="120" />
</p>

A desktop utility to inspect and manage local network ports. Inspired by [Portero](https://github.com/sudharsan-selvaraj/portero).

## Features

- **Real-time port scanning** — Detects all listening TCP/UDP ports on your machine
- **Process identification** — Shows which process is using each port, with PID, CPU, and memory usage
- **Service detection** — Automatically identifies common services (Node.js, Python, PostgreSQL, Redis, Docker, etc.)
- **Port conflicts** — Highlights when multiple processes compete for the same port
- **Process management** — Kill processes directly from the UI
- **Favorites** — Pin important ports for quick access
- **Cross-platform** — Works on macOS, Linux, and Windows

## Download

### macOS

1. Go to the [Releases page](https://github.com/hiramgabriel1/Portpeek/releases)
2. Download the latest `.dmg` file
3. Open the DMG and drag PortPeek to your Applications folder
4. First launch: right-click → Open (macOS Gatekeeper may block unsigned apps)

**Requirements:** macOS 12+ (Monterey or later)

### Linux

Download the appropriate package for your distribution:

| Distribution | Package | Install Command |
|-------------|---------|-----------------|
| Debian/Ubuntu | `.deb` | `sudo dpkg -i portpeek_*.deb && sudo apt install -f` |
| Fedora/RHEL | `.rpm` | `sudo dnf install portpeek-*.rpm` |
| Any distro | `.AppImage` | `chmod +x portpeek_*.AppImage && ./portpeek_*.AppImage` |

**Requirements:** glibc 2.31+ (Ubuntu 20.04+, Fedora 33+, etc.)

### Windows

1. Download the `.exe` installer from the [Releases page](https://github.com/hiramgabriel1/Portpeek/releases)
2. Run the installer and follow the prompts
3. Launch PortPeek from the Start menu

**Requirements:** Windows 10 or later

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Tauri CLI](https://tauri.app/) (installed via npm)

### Setup

```bash
# Clone the repository
git clone https://github.com/hiramgabriel1/Portpeek.git
cd Portpeek

# Install frontend dependencies
npm install
```

### Development

```bash
npm run tauri dev
```

This starts both the Vite dev server (port 1420) and the Rust backend in debug mode.

### Production Build

```bash
npm run tauri build
```

Output:
- **macOS:** `src-tauri/target/release/bundle/macos/PortPeek.app` and `.dmg`
- **Linux:** `src-tauri/target/release/bundle/deb/`, `rpm/`, and `appimage/`
- **Windows:** `src-tauri/target/release/bundle/msi/` and `.exe`

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rust (Tauri v2) |
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 |
| IPC | Tauri `invoke()` API |

### Project Structure

```
Portpeek/
├── src/                          # React frontend
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Main app component
│   ├── components/
│   │   ├── PortTable.tsx         # Port listing table
│   │   ├── FilterBar.tsx         # Category filters
│   │   ├── SearchBar.tsx         # Search input
│   │   ├── DetailsPanel.tsx      # Process details modal
│   │   └── SettingsPanel.tsx     # Settings modal
│   ├── services/
│   │   ├── portService.ts        # Tauri invoke wrappers
│   │   ├── detectionService.ts   # Service detection patterns
│   │   └── settingsService.ts    # localStorage persistence
│   ├── types.ts                  # TypeScript interfaces
│   └── index.css                 # Tailwind + CSS variables
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   └── main.rs               # All Tauri commands
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
└── package.json                  # Node dependencies
```

### Data Flow

```
┌─────────────┐     invoke()     ┌──────────────┐
│  React UI   │ ───────────────► │  Rust Backend │
│  (Frontend) │ ◄─────────────── │  (Tauri)      │
─────────────┘   PortInfo[]     └──────┬───────┘
                                        │
                              ┌─────────┴─────────┐
                              │  System Commands  │
                              │  lsof / ss / netstat │
                              └───────────────────┘
```

### Tauri Commands

| Command | Description | Return Type |
|---------|-------------|-------------|
| `scan_ports()` | Scans all listening ports | `Vec<PortInfo>` |
| `get_process_details(pid)` | Gets extended process info | `Option<ProcessDetails>` |
| `kill_process(pid)` | Terminates a process | `Result<bool, String>` |

### Port Scanning by Platform

| OS | Command | Filter |
|----|---------|--------|
| macOS | `lsof -i -P -n -sTCP:LISTEN` | TCP/UDP listening sockets |
| Linux | `ss -tulnp` | TCP/UDP listening sockets |
| Windows | `netstat -ano -p TCP` | TCP LISTENING state |

Results are deduplicated by `(port, protocol, pid)` to avoid duplicate rows from multiple sockets per process.

## License

MIT
