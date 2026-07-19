import type { PortInfo } from "../types";

export interface ServiceInfo {
  name: string;
  icon: string;
  category: string;
}

const SERVICE_PATTERNS: Record<string, ServiceInfo> = {
  node: { name: "Node.js", icon: "🟢", category: "node" },
  bun: { name: "Bun", icon: "🥟", category: "node" },
  deno: { name: "Deno", icon: "🦕", category: "node" },
  vite: { name: "Vite", icon: "⚡", category: "node" },
  "next-server": { name: "Next.js", icon: "▲", category: "node" },
  next: { name: "Next.js", icon: "▲", category: "node" },
  svelte: { name: "SvelteKit", icon: "🔴", category: "node" },
  astro: { name: "Astro", icon: "🚀", category: "node" },
  nest: { name: "NestJS", icon: "🔴", category: "node" },
  express: { name: "Express", icon: "🚂", category: "node" },
  fastify: { name: "Fastify", icon: "🏎️", category: "node" },
  python: { name: "Python", icon: "🐍", category: "python" },
  flask: { name: "Flask", icon: "🧪", category: "python" },
  django: { name: "Django", icon: "🎸", category: "python" },
  fastapi: { name: "FastAPI", icon: "🚀", category: "python" },
  java: { name: "Java", icon: "☕", category: "java" },
  postgres: { name: "PostgreSQL", icon: "🐘", category: "database" },
  mysql: { name: "MySQL", icon: "🐬", category: "database" },
  mongod: { name: "MongoDB", icon: "🍃", category: "database" },
  redis: { name: "Redis", icon: "🔴", category: "database" },
  rabbitmq: { name: "RabbitMQ", icon: "🐰", category: "database" },
  docker: { name: "Docker", icon: "🐳", category: "docker" },
  nginx: { name: "Nginx", icon: "🟩", category: "http" },
  apache: { name: "Apache", icon: "🪶", category: "http" },
  httpd: { name: "Apache", icon: "🪶", category: "http" },
};

const WELL_KNOWN_PORTS: Record<number, ServiceInfo> = {
  80: { name: "HTTP", icon: "🌐", category: "http" },
  443: { name: "HTTPS", icon: "🔒", category: "http" },
  3000: { name: "Dev Server", icon: "🔧", category: "node" },
  3306: { name: "MySQL", icon: "🐬", category: "database" },
  5432: { name: "PostgreSQL", icon: "🐘", category: "database" },
  6379: { name: "Redis", icon: "🔴", category: "database" },
  27017: { name: "MongoDB", icon: "🍃", category: "database" },
  8080: { name: "HTTP Proxy", icon: "🌐", category: "http" },
  9090: { name: "HTTP Alt", icon: "🌐", category: "http" },
};

export function detectService(portInfo: PortInfo): ServiceInfo | null {
  const name = portInfo.process_name.toLowerCase();
  const command = portInfo.command.toLowerCase();
  const combined = `${name} ${command}`;

  for (const [pattern, info] of Object.entries(SERVICE_PATTERNS)) {
    if (combined.includes(pattern)) {
      return info;
    }
  }

  if (portInfo.port in WELL_KNOWN_PORTS) {
    return WELL_KNOWN_PORTS[portInfo.port];
  }

  return null;
}

export function isHttpServer(portInfo: PortInfo): boolean {
  const service = detectService(portInfo);
  if (service?.category === "http") return true;

  const commonHttpPorts = [80, 443, 3000, 8080, 8000, 8888, 3001, 5173, 4200, 8001];
  return commonHttpPorts.includes(portInfo.port);
}

export function formatUptime(startTime: number): string {
  if (!startTime) return "Unknown";

  const now = Date.now() / 1000;
  const uptimeSeconds = now - startTime;

  if (uptimeSeconds < 0) return "Unknown";

  const minutes = Math.floor(uptimeSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function formatMemory(bytes: number): string {
  if (bytes === 0) return "Unknown";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}
