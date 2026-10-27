import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { addSolve } from "../src/solves.js";
import { loadConfig, loadSolves, paths, writeJson } from "../src/store.js";

const tmp = () => mkdtempSync(join(tmpdir(), "cubo-"));

test("caminhos seguem XDG", () => {
  const p = paths({ XDG_DATA_HOME: "/d", XDG_CONFIG_HOME: "/c" });
  assert.equal(p.solves, "/d/cubo/solves.json");
  assert.equal(p.config, "/c/cubo/config.json");
});

test("sem arquivos: histórico vazio e tempo visível", () => {
  const dir = tmp();
  assert.deepEqual(loadSolves(join(dir, "s.json")).data.solves, []);
  assert.equal(loadConfig(join(dir, "c.json")).config.showElapsed, true);
});

test("grava e relê os tempos e a configuração", () => {
  const dir = tmp();
  const file = join(dir, "sub", "solves.json");
  const { data } = loadSolves(file);
  writeJson(file, addSolve(data, 36_270, "x"));
  assert.deepEqual(loadSolves(file).data.solves.map((s) => s.ms), [36_270]);
  assert.equal(loadSolves(file).data.nextId, 2);

  const config = join(dir, "config.json");
  writeJson(config, { version: 1, showElapsed: false });
  assert.equal(loadConfig(config).config.showElapsed, false);
  assert.ok(!existsSync(`${config}.tmp`));
});

test("arquivo corrompido é movido, nunca sobrescrito", () => {
  const dir = tmp();
  const file = join(dir, "solves.json");
  writeFileSync(file, "{oops");
  const { data, warning } = loadSolves(file);
  assert.deepEqual(data.solves, []);
  assert.match(warning, /corrupt/);
  assert.ok(readdirSync(dir).some((f) => f.startsWith("solves.json.corrupt-")));
});
