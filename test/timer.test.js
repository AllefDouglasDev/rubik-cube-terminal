import assert from "node:assert/strict";
import { test } from "node:test";
import { createSpaceDetector } from "../src/space.js";
import { createTimer, HOLD_MS } from "../src/timer.js";

function setup() {
  const solves = [];
  const timer = createTimer({ onSolve: (ms) => solves.push(ms) });
  const space = createSpaceDetector({
    initialDelay: 225,
    repeatInterval: 30,
    onPress: (t) => timer.press(t),
    onHold: (t) => timer.hold(t),
    onRelease: (t) => timer.release(t),
  });
  // Avança o relógio em passos de 10 ms, como o laço do app.
  let clock = 0;
  const advance = (to) => {
    for (; clock <= to; clock += 10) {
      space.tick(clock);
      timer.tick(clock);
    }
  };
  // Segura o espaço sem protocolo: press, pausa inicial, repetições a cada 30 ms.
  const holdLegacy = (from, until) => {
    advance(from);
    space.feed("legacy", from);
    for (let t = from + 225; t <= until; t += 30) {
      advance(t);
      space.feed("legacy", t);
    }
    return until;
  };
  return { timer, space, solves, advance, holdLegacy };
}

test("pressionar não inicia; segurar 0,5 s fica pronto; soltar inicia", () => {
  const { timer, space, advance } = setup();
  space.feed("press", 0);
  assert.equal(timer.state, "holding");
  advance(HOLD_MS - 10);
  assert.equal(timer.state, "holding");
  advance(HOLD_MS);
  assert.equal(timer.state, "ready");
  space.feed("release", 600);
  assert.equal(timer.state, "running");
  assert.equal(timer.elapsed(1600), 1000);
});

test("soltar antes de 0,5 s cancela sem gravar", () => {
  const { timer, space, solves } = setup();
  space.feed("press", 0);
  space.feed("release", 300);
  assert.equal(timer.state, "idle");
  assert.deepEqual(solves, []);
});

test("espaço em running para no press e grava fim − início", () => {
  const { timer, space, solves, advance } = setup();
  space.feed("press", 0);
  advance(500);
  space.feed("release", 600);
  space.feed("press", 10_600);
  assert.equal(timer.state, "idle");
  assert.deepEqual(solves, [10_000]);
});

test("o release do espaço que parou não inicia de novo", () => {
  const { timer, space, solves, advance } = setup();
  space.feed("press", 0);
  advance(500);
  space.feed("release", 600);
  space.feed("press", 5_000);
  space.feed("release", 5_800);
  assert.equal(timer.state, "idle");
  space.feed("press", 6_000);
  assert.equal(timer.state, "holding");
  assert.equal(solves.length, 1);
});

test("heurística: segurar com repetições fica pronto e o fim delas inicia", () => {
  const { timer, advance, holdLegacy } = setup();
  const last = holdLegacy(0, 800);
  assert.equal(timer.state, "ready");
  advance(last + 200);
  assert.equal(timer.state, "running");
  // Início retroagido para perto da última repetição, não para o instante da detecção.
  assert.ok(timer.elapsed(last + 200) > 150);
});

test("heurística: um toque sem repetição não fica pronto nem inicia", () => {
  const { timer, space, advance, solves } = setup();
  space.feed("legacy", 0);
  advance(1_000);
  assert.equal(timer.state, "idle");
  assert.deepEqual(solves, []);
});

test("heurística: repetições do espaço que parou são ignoradas", () => {
  const { timer, space, solves, advance, holdLegacy } = setup();
  const last = holdLegacy(0, 800);
  advance(last + 300);
  assert.equal(timer.state, "running");
  holdLegacy(5_000, 6_000);
  assert.equal(timer.state, "idle");
  advance(7_000);
  assert.equal(timer.state, "idle");
  assert.equal(solves.length, 1);
});
