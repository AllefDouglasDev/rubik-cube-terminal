import assert from "node:assert/strict";
import { test } from "node:test";
import { parseKeys } from "../src/keys.js";

test("espaço comum chega como legacy", () => {
  assert.deepEqual(parseKeys(" "), [{ key: "space", ctrl: false, type: "legacy" }]);
});

test("protocolo kitty: press, repeat e release do espaço", () => {
  assert.deepEqual(
    parseKeys("\x1b[32u\x1b[32;1:2u\x1b[32;1:3u").map((e) => e.type),
    ["press", "repeat", "release"],
  );
});

test("ctrl+c nos dois formatos", () => {
  assert.deepEqual(parseKeys("\x03")[0], { key: "c", ctrl: true, type: "legacy" });
  assert.deepEqual(parseKeys("\x1b[99;5u")[0], { key: "c", ctrl: true, type: "press" });
});

test("setas nos formatos legado, aplicação e kitty", () => {
  assert.deepEqual(
    parseKeys("\x1b[A\x1bOB\x1b[1;1:3A").map((e) => [e.key, e.type]),
    [["up", "press"], ["down", "legacy"], ["up", "release"]],
  );
});

test("respostas do terminal são ignoradas", () => {
  assert.deepEqual(parseKeys("\x1b[?11u\x1b[?62;22c"), []);
});

test("letras e esc", () => {
  assert.deepEqual(parseKeys("q\x1b").map((e) => e.key), ["q", "escape"]);
  assert.equal(parseKeys("\x1b[113u")[0].key, "q");
});
