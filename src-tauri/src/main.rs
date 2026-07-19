#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::collections::HashMap;
use std::process::Command;
use sysinfo::{ProcessRefreshKind, System};

#[derive(Serialize, Clone, Debug)]
pub struct PortInfo {
    pub port: u16,
    pub protocol: String,
    pub local_address: String,
    pub pid: u32,
    pub process_name: String,
    pub executable_path: String,
    pub command: String,
    pub status: String,
    pub start_time: u64,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub parent_pid: u32,
}

#[derive(Serialize, Clone, Debug)]
pub struct ProcessDetails {
    pub pid: u32,
    pub name: String,
    pub executable_path: String,
    pub command: String,
    pub working_directory: String,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub parent_pid: u32,
    pub child_pids: Vec<u32>,
    pub start_time: u64,
}

#[tauri::command]
fn scan_ports() -> Vec<PortInfo> {
    let mut ports: Vec<PortInfo> = Vec::new();
    let mut seen: std::collections::HashSet<(u16, String, u32)> = std::collections::HashSet::new();

    #[cfg(target_os = "macos")]
    {
        let output = Command::new("lsof")
            .args(["-i", "-P", "-n", "-sTCP:LISTEN"])
            .output()
            .expect("Failed to execute lsof");

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut process_cache: HashMap<u32, (String, String, String)> = HashMap::new();

        for line in stdout.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 9 {
                continue;
            }

            let process_name = parts[0].to_string();
            let pid_str = parts[1];
            let pid: u32 = pid_str.parse().unwrap_or(0);
            let node_field = parts[7];
            let name_field = parts[8];

            let protocol = if node_field.starts_with("TCP") {
                "TCP".to_string()
            } else if node_field.starts_with("UDP") {
                "UDP".to_string()
            } else {
                continue;
            };

            if let Some(addr) = name_field.split("->").next() {
                if let Some(port_str) = addr.split(':').last() {
                    let port_clean = port_str.chars().take_while(|c| c.is_ascii_digit()).collect::<String>();
                    if let Ok(port) = port_clean.parse::<u16>() {
                        let key = (port, protocol.clone(), pid);
                        if seen.contains(&key) {
                            continue;
                        }
                        seen.insert(key);

                        let local_address = addr.to_string();

                        let (executable_path, command, _working_directory) =
                            process_cache.entry(pid).or_insert_with(|| {
                                get_process_info(pid)
                            });

        let mut sys = System::new_all();
                        let (cpu_usage, memory_usage, start_time, parent_pid) =
                            if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
                                (
                                    process.cpu_usage(),
                                    process.memory(),
                                    process.start_time(),
                                    process.parent().map(|p| p.as_u32()).unwrap_or(0),
                                )
                            } else {
                                (0.0, 0, 0, 0)
                            };

                        ports.push(PortInfo {
                            port,
                            protocol,
                            local_address,
                            pid,
                            process_name,
                            executable_path: executable_path.clone(),
                            command: command.clone(),
                            status: "Listening".to_string(),
                            start_time,
                            cpu_usage,
                            memory_usage,
                            parent_pid,
                        });
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("ss")
            .args(["-tulnp"])
            .output()
            .expect("Failed to execute ss");

        let stdout = String::from_utf8_lossy(&output.stdout);

        for line in stdout.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 6 {
                continue;
            }

            let protocol = parts[0].to_uppercase();
            let local_address = parts[4].to_string();

            if let Some(port_str) = local_address.split(':').last() {
                if let Ok(port) = port_str.parse::<u16>() {
                    let key = (port, protocol.clone(), 0u32);
                    if seen.contains(&key) {
                        continue;
                    }
                    seen.insert(key);

                    let users_field = if parts.len() > 6 {
                        parts[6]
                    } else {
                        ""
                    };

                    let mut pid: u32 = 0;
                    let mut process_name = String::from("Unknown");

                    if let Some(pid_info) = users_field
                        .split(',')
                        .find(|s| s.starts_with("pid="))
                    {
                        if let Some(pid_str) = pid_info.strip_prefix("pid=") {
                            pid = pid_str.parse().unwrap_or(0);
                        }
                    }

                    if let Some(name_info) = users_field
                        .split(',')
                        .find(|s| s.starts_with("(\""))
                    {
                        process_name = name_info
                            .trim_matches(|c: char| c == '(' || c == '"' || c == ')')
                            .to_string();
                    }

                    let (executable_path, command, _) = get_process_info(pid);

                    let sys = System::new_all();
                    let (cpu_usage, memory_usage, start_time, parent_pid) =
                        if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
                            (
                                process.cpu_usage(),
                                process.memory(),
                                process.start_time(),
                                process.parent().map(|p| p.as_u32()).unwrap_or(0),
                            )
                        } else {
                            (0.0, 0, 0, 0)
                        };

                    ports.push(PortInfo {
                        port,
                        protocol,
                        local_address,
                        pid,
                        process_name,
                        executable_path,
                        command,
                        status: "Listening".to_string(),
                        start_time,
                        cpu_usage,
                        memory_usage,
                        parent_pid,
                    });
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        let output = Command::new("netstat")
            .args(["-ano", "-p", "TCP"])
            .output()
            .expect("Failed to execute netstat");

        let stdout = String::from_utf8_lossy(&output.stdout);

        for line in stdout.lines().skip(4) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 5 {
                continue;
            }

            let protocol = parts[0].to_string();
            let local_address = parts[1].to_string();
            let state = parts[3].to_string();

            if state != "LISTENING" {
                continue;
            }

            if let Some(port_str) = local_address.split(':').last() {
                if let Ok(port) = port_str.parse::<u16>() {
                    let pid: u32 = parts[4].parse().unwrap_or(0);
                    let key = (port, protocol.clone(), pid);
                    if seen.contains(&key) {
                        continue;
                    }
                    seen.insert(key);

                    let (process_name, executable_path, command) =
                        get_process_info_windows(pid);

                    let sys = System::new_all();
                    let (cpu_usage, memory_usage, start_time, parent_pid) =
                        if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
                            (
                                process.cpu_usage(),
                                process.memory(),
                                process.start_time(),
                                process.parent().map(|p| p.as_u32()).unwrap_or(0),
                            )
                        } else {
                            (0.0, 0, 0, 0)
                        };

                    ports.push(PortInfo {
                        port,
                        protocol,
                        local_address,
                        pid,
                        process_name,
                        executable_path,
                        command,
                        status: state,
                        start_time,
                        cpu_usage,
                        memory_usage,
                        parent_pid,
                    });
                }
            }
        }
    }

    ports
}

#[cfg(target_os = "macos")]
fn get_process_info(pid: u32) -> (String, String, String) {
    if pid == 0 {
        return (String::new(), String::new(), String::new());
    }

    let ps_output = Command::new("ps")
        .args(["-p", &pid.to_string(), "-o", "comm=,args="])
        .output();

    if let Ok(output) = ps_output {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = stdout.lines().collect();
        if !lines.is_empty() {
            let line = lines[0].trim();
            let parts: Vec<&str> = line.splitn(2, |c: char| c == ' ' || c == '\t').collect();
            let executable_path = parts.first().unwrap_or(&"").to_string();
            let command = parts.get(1).unwrap_or(&"").to_string();

            let cwd_output = Command::new("lsof")
                .args(["-p", &pid.to_string(), "-a", "-d", "cwd", "-Fn"])
                .output();

            let working_directory = if let Ok(cwd_out) = cwd_output {
                let cwd_stdout = String::from_utf8_lossy(&cwd_out.stdout);
                cwd_stdout
                    .lines()
                    .find(|line| line.starts_with('n'))
                    .map(|line| line[1..].to_string())
                    .unwrap_or_default()
            } else {
                String::new()
            };

            return (executable_path, command, working_directory);
        }
    }

    (String::new(), String::new(), String::new())
}

#[cfg(target_os = "linux")]
fn get_process_info(pid: u32) -> (String, String, String) {
    use std::fs;

    if pid == 0 {
        return (String::new(), String::new(), String::new());
    }

    let exe_path = fs::read_link(format!("/proc/{}/exe", pid)).unwrap_or_default();
    let cmdline = fs::read_to_string(format!("/proc/{}/cmdline", pid)).unwrap_or_default();
    let command = cmdline.replace('\0', " ").trim().to_string();
    let cwd = fs::read_link(format!("/proc/{}/cwd", pid)).unwrap_or_default();

    (
        exe_path.to_string(),
        command,
        cwd.to_string(),
    )
}

#[cfg(target_os = "windows")]
fn get_process_info_windows(pid: u32) -> (String, String, String) {
    use std::os::windows::process::CommandExt;

    if pid == 0 {
        return (String::new(), String::new(), String::new());
    }

    let output = Command::new("wmic")
        .args([
            "process",
            "where",
            &format!("ProcessId={}", pid),
            "get",
            "Name,ExecutablePath,CommandLine",
            "/format:list",
        ])
        .creation_flags(0x08000000)
        .output();

    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        let mut name = String::new();
        let mut exe_path = String::new();
        let mut command = String::new();

        for line in stdout.lines() {
            if let Some(val) = line.strip_prefix("Name=") {
                name = val.to_string();
            } else if let Some(val) = line.strip_prefix("ExecutablePath=") {
                exe_path = val.to_string();
            } else if let Some(val) = line.strip_prefix("CommandLine=") {
                command = val.to_string();
            }
        }

        return (name, exe_path, command);
    }

    (String::new(), String::new(), String::new())
}

#[tauri::command]
fn get_process_details(pid: u32) -> Option<ProcessDetails> {
    let mut sys = System::new_all();
    sys.refresh_processes_specifics(
        ProcessRefreshKind::new(),
    );

    if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
        let child_pids: Vec<u32> = sys
            .processes()
            .iter()
            .filter(|(_, p)| {
                p.parent()
                    .map(|parent| parent.as_u32() == pid)
                    .unwrap_or(false)
            })
            .map(|(p_pid, _)| p_pid.as_u32())
            .collect();

        #[cfg(target_os = "macos")]
        {
            let (executable_path, command, working_directory) = get_process_info(pid);
            return Some(ProcessDetails {
                pid,
                name: process.name().to_string(),
                executable_path,
                command,
                working_directory,
                cpu_usage: process.cpu_usage(),
                memory_usage: process.memory(),
                parent_pid: process.parent().map(|p| p.as_u32()).unwrap_or(0),
                child_pids,
                start_time: process.start_time(),
            });
        }

        #[cfg(target_os = "linux")]
        {
            let (executable_path, command, working_directory) = get_process_info(pid);
            return Some(ProcessDetails {
                pid,
                name: process.name().to_string(),
                executable_path,
                command,
                working_directory,
                cpu_usage: process.cpu_usage(),
                memory_usage: process.memory(),
                parent_pid: process.parent().map(|p| p.as_u32()).unwrap_or(0),
                child_pids,
                start_time: process.start_time(),
            });
        }

        #[cfg(target_os = "windows")]
        {
            let (name, executable_path, command) = get_process_info_windows(pid);
            return Some(ProcessDetails {
                pid,
                name: if name.is_empty() {
                    process.name().to_string()
                } else {
                    name
                },
                executable_path,
                command,
                working_directory: String::new(),
                cpu_usage: process.cpu_usage(),
                memory_usage: process.memory(),
                parent_pid: process.parent().map(|p| p.as_u32()).unwrap_or(0),
                child_pids,
                start_time: process.start_time(),
            });
        }
    }

    None
}

#[tauri::command]
fn kill_process(pid: u32) -> Result<bool, String> {
    let mut sys = System::new_all();
    if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
        if process.kill() {
            Ok(true)
        } else {
            Err("Failed to kill process".to_string())
        }
    } else {
        Err("Process not found".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_ports,
            get_process_details,
            kill_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
