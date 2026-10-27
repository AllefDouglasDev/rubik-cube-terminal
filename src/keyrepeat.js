import { execFileSync } from "node:child_process";

// Lê a repetição de teclas do macOS (unidades de 15 ms). Sem valor
// definido, valem os padrões do sistema: 225 ms de espera, 30 ms entre repetições.
function readDefault(key) {
  try {
    const out = execFileSync("defaults", ["read", "-g", key], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const value = Number(out.trim());
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function readKeyRepeat() {
  if (process.platform !== "darwin") return { initialDelay: 500, repeatInterval: 33 };
  return {
    initialDelay: (readDefault("InitialKeyRepeat") ?? 15) * 15,
    repeatInterval: (readDefault("KeyRepeat") ?? 2) * 15,
  };
}
