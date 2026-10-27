import { bigText } from "./digits.js";
import { BEST_COUNT, formatTime } from "./solves.js";

const SGR = {
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  inverse: "\x1b[7m",
  red: "\x1b[1;91m",
  green: "\x1b[1;92m",
  white: "\x1b[1;97m",
  orange: "\x1b[1;38;5;208m",
  yellow: "\x1b[1;93m",
};

export const SIDEBAR_WIDTH = 22;
const MIN_SIDEBAR_COLS = 60;
const STATE_COLOR = { idle: "white", holding: "red", ready: "green", running: "white" };

class Screen {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => [" ", ""]));
  }

  put(x, y, text, style = "") {
    if (y < 0 || y >= this.rows) return;
    let col = x;
    for (const ch of text) {
      if (col >= 0 && col < this.cols && ch !== "\0") this.cells[y][col] = [ch, style];
      col += 1;
    }
  }

  lines() {
    return this.cells.map((row) => {
      let out = "";
      let current = "";
      for (const [ch, style] of row) {
        if (style !== current) {
          out += `\x1b[0m${style}`;
          current = style;
        }
        out += ch;
      }
      return `${out}\x1b[0m`;
    });
  }
}

const centered = (text, x0, width) => x0 + Math.max(0, Math.floor((width - [...text].length) / 2));

function drawSidebar(screen, view) {
  const { rows, cursor } = view;
  const best = rows[0];
  const line = (solve) => {
    const label = solve ? `#${solve.id}` : "";
    const time = solve ? formatTime(solve.ms) : "-";
    return `  ${label.padEnd(7)}${time.padStart(10)} `;
  };
  screen.put(1, 1, "Melhores", SGR.bold + SGR.dim);
  screen.put(1, BEST_COUNT + 3, "Últimos", SGR.bold + SGR.dim);
  rows.forEach((solve, i) => {
    const y = i < BEST_COUNT ? 2 + i : 3 + i + 1;
    let style = solve && best && solve.id === best.id ? SGR.orange : "";
    if (!solve) style = SGR.dim;
    if (cursor === i) style = SGR.inverse + style;
    screen.put(0, y, line(solve), style);
  });
  for (let y = 0; y < screen.rows - 1; y++) screen.put(SIDEBAR_WIDTH, y, "│", SGR.dim);
}

function statusText(view) {
  switch (view.state) {
    case "holding":
      return "Segure…";
    case "ready":
      return "Solte para começar";
    case "running":
      return "Espaço para parar";
    default:
      return "Segure espaço para preparar";
  }
}

function drawCenter(screen, view, x0, width, height) {
  const status = statusText(view);
  const color = SGR[STATE_COLOR[view.state]];

  if (view.state === "running" && !view.showElapsed) {
    const mid = Math.floor(height / 2);
    screen.put(centered("Começou", x0, width), mid - 1, "Começou", SGR.white);
    screen.put(centered(status, x0, width), mid + 2, status, SGR.dim);
    return;
  }

  const text = formatTime(view.ms);
  let lines = null;
  for (const scale of [3, 2, 1]) {
    const candidate = bigText(text, scale);
    if (candidate[0].length <= width - 4 && candidate.length + 4 <= height) {
      lines = candidate;
      break;
    }
  }
  if (!lines) {
    const mid = Math.floor(height / 2);
    screen.put(centered(text, x0, width), mid, text, color);
    screen.put(centered(status, x0, width), mid + 2, status, SGR.dim);
    return;
  }
  const top = Math.max(0, Math.floor((height - lines.length - 3) / 2));
  const left = centered(lines[0], x0, width);
  lines.forEach((line, i) => {
    let col = left;
    for (const ch of line) {
      if (ch === "#") screen.put(col, top + i, "█", color);
      col += 1;
    }
  });
  screen.put(centered(status, x0, width), top + lines.length + 2, status, SGR.dim);
}

function footerText(view) {
  if (view.pending) {
    const { id, ms } = view.pending;
    return [`Apagar #${id} (${formatTime(ms)})? y/n`, SGR.yellow];
  }
  if (view.message) return [view.message, SGR.yellow];
  if (view.state === "running") return ["espaço: parar", SGR.dim];
  if (view.state !== "idle") return ["solte antes de 0,5 s para cancelar", SGR.dim];
  if (view.cursor !== null) return ["↑↓: mover · d: apagar · esc: sair da lista", SGR.dim];
  const elapsed = view.showElapsed ? "tempo visível" : "tempo oculto";
  return [`espaço: preparar · ↑↓: selecionar · t: ${elapsed} · q: sair`, SGR.dim];
}

export function render(view, cols, rows) {
  const screen = new Screen(cols, rows);
  const withSidebar = cols >= MIN_SIDEBAR_COLS;
  const x0 = withSidebar ? SIDEBAR_WIDTH + 1 : 0;
  if (withSidebar) drawSidebar(screen, view);
  drawCenter(screen, view, x0, cols - x0, rows - 1);
  const [footer, style] = footerText(view);
  screen.put(1, rows - 1, footer, style);
  return screen.lines();
}
