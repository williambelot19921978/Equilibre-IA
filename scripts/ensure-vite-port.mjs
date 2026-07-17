import { execSync } from "node:child_process";
import { platform } from "node:os";

const VITE_PORT = 5173;

/** Ports alternatifs parfois utilisés par d'anciennes instances — à libérer aussi. */
const LEGACY_PORTS = [5174, 5175, 5176];

function log(message) {
  console.log(`[ensure-vite-port] ${message}`);
}

function getListeningPidsOnPort(port) {
  if (platform() === "win32") {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
      });
      const pids = new Set();
      for (const line of output.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts.at(-1);
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: "utf8" });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter((pid) => /^\d+$/.test(pid));
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (platform() === "win32") {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
  } else {
    execSync(`kill -9 ${pid}`, { stdio: "ignore" });
  }
}

function freePort(port) {
  const pids = getListeningPidsOnPort(port);
  if (pids.length === 0) return;

  log(`Port ${port} occupé par PID(s) : ${pids.join(", ")} — arrêt…`);
  for (const pid of pids) {
    try {
      killPid(pid);
      log(`PID ${pid} arrêté.`);
    } catch {
      log(`Impossible d'arrêter PID ${pid}. Fermez-le manuellement.`);
      if (port === VITE_PORT) process.exit(1);
    }
  }
}

function main() {
  log(`Port cible : ${VITE_PORT} (strictPort — jamais de fallback)`);

  for (const port of [VITE_PORT, ...LEGACY_PORTS]) {
    freePort(port);
  }

  log(`Prêt — une instance Vite sur http://localhost:${VITE_PORT}`);
}

main();
