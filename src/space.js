// Transforma os eventos do espaço em press / hold / release.
//
// Com o protocolo do kitty o terminal manda press e release de verdade.
// Sem ele (tmux), segurar uma tecla gera um press, uma pausa e repetições;
// o release é deduzido quando as repetições param, e o instante dele é
// retroagido para logo depois da última repetição.
//
// "hold" confirma que a tecla está mesmo segura: sem ele, um toque rápido
// antes da primeira repetição seria indistinguível de segurar.

export const RELEASE_GAP_MIN = 80;
export const RELEASE_GAP_MAX = 250;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createSpaceDetector({ initialDelay = 225, repeatInterval = 30, onPress, onHold, onRelease }) {
  const tapGap = Math.max(300, initialDelay + 150);
  let held = false;
  let legacy = false;
  let lastAt = 0;
  let repeats = 0;
  let interval = repeatInterval;

  function feed(type, t) {
    if (type === "press") {
      if (held) return;
      held = true;
      legacy = false;
      onPress(t);
      onHold(t);
      return;
    }
    if (type === "repeat") return;
    if (type === "release") {
      if (!held || legacy) return;
      held = false;
      onRelease(t);
      return;
    }
    if (!held) {
      held = true;
      legacy = true;
      lastAt = t;
      repeats = 0;
      interval = repeatInterval;
      onPress(t);
      return;
    }
    if (!legacy) return;
    repeats += 1;
    if (repeats >= 2) interval = interval * 0.6 + (t - lastAt) * 0.4;
    lastAt = t;
    if (repeats === 1) onHold(t);
  }

  function tick(now) {
    if (!held || !legacy) return;
    const gap = repeats === 0 ? tapGap : clamp(interval * 3, RELEASE_GAP_MIN, RELEASE_GAP_MAX);
    if (now - lastAt < gap) return;
    held = false;
    const at = repeats === 0 ? lastAt : lastAt + interval / 2;
    onRelease(Math.min(at, now));
  }

  return { feed, tick };
}
