// Estados: idle → holding (vermelho) → ready (verde) → running → idle.
export const HOLD_MS = 500;

export function createTimer({ onSolve }) {
  let state = "idle";
  let holdStart = 0;
  let confirmed = false;
  let start = 0;
  // O espaço que parou o timer ainda está apertado: o release dele não conta.
  let ignoreRelease = false;

  return {
    get state() {
      return state;
    },
    elapsed(now) {
      return state === "running" ? now - start : 0;
    },
    press(t) {
      if (state === "running") {
        state = "idle";
        ignoreRelease = true;
        onSolve(Math.max(0, Math.round(t - start)));
        return;
      }
      if (state === "idle" && !ignoreRelease) {
        state = "holding";
        holdStart = t;
        confirmed = false;
      }
    },
    hold() {
      if (state === "holding") confirmed = true;
    },
    release(t) {
      if (ignoreRelease) {
        ignoreRelease = false;
        return;
      }
      if (state === "holding") state = "idle";
      else if (state === "ready") {
        state = "running";
        start = t;
      }
    },
    tick(now) {
      if (state === "holding" && confirmed && now - holdStart >= HOLD_MS) state = "ready";
    },
  };
}
