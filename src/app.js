import { now } from "./clock.js";
import { parseKeys } from "./keys.js";
import { readKeyRepeat } from "./keyrepeat.js";
import { render } from "./render.js";
import { addSolve, deleteSolve, sidebarRows } from "./solves.js";
import { createSpaceDetector } from "./space.js";
import { loadConfig, loadSolves, paths, writeJson } from "./store.js";
import { createTerminal } from "./terminal.js";
import { createTimer } from "./timer.js";

const FRAME_MS = 10;

export function run() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stderr.write("cubo: precisa rodar num terminal\n");
    process.exit(1);
  }

  const files = paths();
  let { data, warning } = loadSolves(files.solves);
  const loaded = loadConfig(files.config);
  let config = loaded.config;
  let message = warning || loaded.warning;
  let cursor = null;
  let pending = null;

  const save = (file, value) => {
    try {
      writeJson(file, value);
    } catch (err) {
      message = `erro ao gravar ${file}: ${err.message}`;
    }
  };

  const timer = createTimer({
    onSolve(ms) {
      data = addSolve(data, ms, new Date().toISOString());
      save(files.solves, data);
    },
  });
  const space = createSpaceDetector({
    ...readKeyRepeat(),
    onPress: (t) => timer.press(t),
    onHold: (t) => timer.hold(t),
    onRelease: (t) => timer.release(t),
  });
  const term = createTerminal();

  const quit = (code = 0) => {
    term.leave();
    process.exit(code);
  };
  process.on("exit", () => term.leave());
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => quit(0));
  process.on("uncaughtException", (err) => {
    term.leave();
    process.stderr.write(`${err.stack}\n`);
    process.exit(1);
  });

  const moveCursor = (step) => {
    const rows = sidebarRows(data.solves);
    const valid = rows.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
    if (!valid.length) return;
    if (cursor === null) {
      cursor = step > 0 ? valid[0] : valid[valid.length - 1];
      return;
    }
    const pos = valid.indexOf(cursor);
    cursor = valid[Math.min(valid.length - 1, Math.max(0, pos + step))];
  };

  const confirmDelete = () => {
    data = deleteSolve(data, pending.id);
    save(files.solves, data);
    pending = null;
    const valid = sidebarRows(data.solves)
      .map((s, i) => (s ? i : -1))
      .filter((i) => i >= 0);
    if (!valid.length) cursor = null;
    else if (!valid.includes(cursor)) cursor = valid.filter((i) => i < cursor).pop() ?? valid[0];
  };

  const handleKey = (ev, t) => {
    if (ev.ctrl && ev.key === "c") return quit(0);

    if (ev.key === "space") {
      if (ev.type !== "release" && ev.type !== "repeat") {
        cursor = null;
        pending = null;
        message = null;
      }
      space.feed(ev.type, t);
      return;
    }
    if (ev.type === "release" || timer.state !== "idle") return;
    message = null;

    if (pending) {
      if (ev.key === "y") confirmDelete();
      else if (ev.key === "n" || ev.key === "escape") pending = null;
      return;
    }
    switch (ev.key) {
      case "q":
        return quit(0);
      case "t":
        config = { ...config, showElapsed: !config.showElapsed };
        save(files.config, config);
        break;
      case "up":
        moveCursor(-1);
        break;
      case "down":
        moveCursor(1);
        break;
      case "d":
        if (cursor !== null) pending = sidebarRows(data.solves)[cursor];
        break;
      case "escape":
        cursor = null;
        break;
    }
  };

  const view = (t) => {
    const latest = data.solves.reduce((a, s) => (!a || s.id > a.id ? s : a), null);
    return {
      state: timer.state,
      ms: timer.state === "running" ? timer.elapsed(t) : timer.state === "idle" && latest ? latest.ms : 0,
      showElapsed: config.showElapsed,
      rows: sidebarRows(data.solves),
      cursor,
      pending,
      message,
    };
  };

  term.enter();
  process.stdin.on("data", (chunk) => {
    const t = now();
    for (const ev of parseKeys(chunk)) handleKey(ev, t);
  });
  process.stdout.on("resize", () => term.invalidate());
  setInterval(() => {
    const t = now();
    space.tick(t);
    timer.tick(t);
    term.draw(render(view(t), process.stdout.columns, process.stdout.rows));
  }, FRAME_MS);
}
