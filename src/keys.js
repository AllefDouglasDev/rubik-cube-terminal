// Converte os bytes do stdin em eventos { key, ctrl, type }.
// type: "press" | "repeat" | "release" vêm do protocolo de teclado do kitty;
// "legacy" é uma tecla sem informação de evento (terminal comum, tmux).

const TYPES = { 1: "press", 2: "repeat", 3: "release" };
const CODES = { 32: "space", 27: "escape", 13: "enter", 9: "tab", 127: "backspace" };
const ARROWS = { A: "up", B: "down", C: "right", D: "left" };
const CSI = /^\x1b\[([?<>=]?)([0-9;:]*)([A-Za-z~])/;

function parseModifiers(field = "") {
  const [mod, type] = field.split(":");
  const bits = (parseInt(mod, 10) || 1) - 1;
  return { ctrl: (bits & 4) !== 0, type: TYPES[parseInt(type, 10) || 1] };
}

function keyFromCode(code) {
  if (CODES[code]) return CODES[code];
  return String.fromCodePoint(code).toLowerCase();
}

export function parseKeys(chunk) {
  const events = [];
  let i = 0;
  while (i < chunk.length) {
    const rest = chunk.slice(i);
    const csi = rest.match(CSI);
    if (csi) {
      i += csi[0].length;
      const [, prefix, params, final] = csi;
      if (prefix) continue; // respostas do terminal (ex.: CSI ? flags u)
      const fields = params.split(";");
      if (final === "u") {
        const code = parseInt(fields[0].split(":")[0], 10);
        if (Number.isNaN(code)) continue;
        events.push({ key: keyFromCode(code), ...parseModifiers(fields[1]) });
      } else if (ARROWS[final]) {
        events.push({ key: ARROWS[final], ...parseModifiers(fields[1]) });
      }
      continue;
    }
    if (rest.startsWith("\x1bO") && ARROWS[rest[2]]) {
      events.push({ key: ARROWS[rest[2]], ctrl: false, type: "legacy" });
      i += 3;
      continue;
    }
    const ch = String.fromCodePoint(rest.codePointAt(0));
    i += ch.length;
    if (ch === "\x1b") events.push({ key: "escape", ctrl: false, type: "legacy" });
    else if (ch === " ") events.push({ key: "space", ctrl: false, type: "legacy" });
    else if (ch === "\r" || ch === "\n") events.push({ key: "enter", ctrl: false, type: "legacy" });
    else if (ch === "\x7f") events.push({ key: "backspace", ctrl: false, type: "legacy" });
    else if (ch.charCodeAt(0) < 32) {
      events.push({ key: String.fromCharCode(ch.charCodeAt(0) + 96), ctrl: true, type: "legacy" });
    } else events.push({ key: ch.toLowerCase(), ctrl: false, type: "legacy" });
  }
  return events;
}
