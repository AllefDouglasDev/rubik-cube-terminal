import { writeSync } from "node:fs";

// Tela alternativa, cursor oculto, sem quebra automática de linha e
// protocolo de teclado do kitty (flags 1+2+8: desambiguar, tipos de evento,
// todas as teclas como CSI u). Terminais que não o conhecem ignoram.
const ENTER = "\x1b[?1049h\x1b[?25l\x1b[?7l\x1b[>11u\x1b[2J";
const LEAVE = "\x1b[<u\x1b[?7h\x1b[?25h\x1b[?1049l";

export function createTerminal(input = process.stdin, output = process.stdout) {
  let active = false;
  let previous = [];

  return {
    enter() {
      input.setRawMode(true);
      input.setEncoding("utf8");
      input.resume();
      output.write(ENTER);
      active = true;
    },
    leave() {
      if (!active) return;
      active = false;
      writeSync(output.fd, LEAVE);
      try {
        input.setRawMode(false);
      } catch {}
      input.pause();
    },
    // Reescreve só as linhas que mudaram, num único write.
    draw(lines) {
      let out = "";
      lines.forEach((line, i) => {
        if (line !== previous[i]) out += `\x1b[${i + 1};1H${line}`;
      });
      previous = lines;
      if (out) output.write(out);
    },
    invalidate() {
      previous = [];
      output.write("\x1b[2J");
    },
  };
}
