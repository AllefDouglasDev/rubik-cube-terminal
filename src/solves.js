export const BEST_COUNT = 3;
export const LAST_COUNT = 7;

export const emptySolves = () => ({ version: 1, nextId: 1, solves: [] });

export function addSolve(data, ms, at) {
  const solve = { id: data.nextId, ms, at };
  return { ...data, nextId: data.nextId + 1, solves: [...data.solves, solve] };
}

export function deleteSolve(data, id) {
  return { ...data, solves: data.solves.filter((s) => s.id !== id) };
}

export function bestSolves(solves, n = BEST_COUNT) {
  return [...solves].sort((a, b) => a.ms - b.ms || a.id - b.id).slice(0, n);
}

export function lastSolves(solves, n = LAST_COUNT) {
  return [...solves].sort((a, b) => b.id - a.id).slice(0, n);
}

const fill = (list, n) => [...list, ...Array(n - list.length).fill(null)];

// As 10 linhas da coluna da esquerda: 3 melhores e 7 últimos.
export function sidebarRows(solves) {
  return [...fill(bestSolves(solves), BEST_COUNT), ...fill(lastSolves(solves), LAST_COUNT)];
}

const pad2 = (n) => String(n).padStart(2, "0");

// Centésimos truncados, como nos timers de cubo: 36.27, 1:02.45.
export function formatTime(ms) {
  const cs = Math.floor(Math.max(0, ms) / 10);
  const s = Math.floor(cs / 100);
  const c = pad2(cs % 100);
  if (s < 60) return `${s}.${c}`;
  return `${Math.floor(s / 60)}:${pad2(s % 60)}.${c}`;
}
