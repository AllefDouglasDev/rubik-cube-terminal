import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { emptySolves } from "./solves.js";

export const DEFAULT_CONFIG = { version: 1, showElapsed: true };

export function paths(env = process.env) {
  const home = homedir();
  return {
    solves: join(env.CUBO_DATA_DIR || join(env.XDG_DATA_HOME || join(home, ".local", "share"), "cubo"), "solves.json"),
    config: join(env.CUBO_CONFIG_DIR || join(env.XDG_CONFIG_HOME || join(home, ".config"), "cubo"), "config.json"),
  };
}

// Escreve num .tmp e renomeia: um kill no meio nunca deixa o arquivo pela metade.
export function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(tmp, file);
}

// Arquivo corrompido nunca é sobrescrito: vai para o lado e o app avisa.
function readJson(file) {
  if (!existsSync(file)) return { value: null, warning: null };
  try {
    return { value: JSON.parse(readFileSync(file, "utf8")), warning: null };
  } catch {
    const moved = `${file}.corrupt-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    renameSync(file, moved);
    return { value: null, warning: `arquivo inválido movido para ${moved}` };
  }
}

const isSolve = (s) => s && Number.isInteger(s.id) && Number.isFinite(s.ms);

export function loadSolves(file) {
  const { value, warning } = readJson(file);
  if (!value || !Array.isArray(value.solves)) return { data: emptySolves(), warning };
  const solves = value.solves.filter(isSolve);
  const maxId = solves.reduce((max, s) => Math.max(max, s.id), 0);
  const nextId = Math.max(Number.isInteger(value.nextId) ? value.nextId : 1, maxId + 1);
  return { data: { version: 1, nextId, solves }, warning };
}

export function loadConfig(file) {
  const { value, warning } = readJson(file);
  const config = { ...DEFAULT_CONFIG };
  if (value && typeof value.showElapsed === "boolean") config.showElapsed = value.showElapsed;
  return { config, warning };
}
