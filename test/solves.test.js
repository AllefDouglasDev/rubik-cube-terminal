import assert from "node:assert/strict";
import { test } from "node:test";
import { addSolve, deleteSolve, emptySolves, formatTime, sidebarRows } from "../src/solves.js";

const build = (times) => times.reduce((d, ms) => addSolve(d, ms, "2026-10-27T00:00:00Z"), emptySolves());

test("formata centésimos truncados e minutos", () => {
  assert.equal(formatTime(0), "0.00");
  assert.equal(formatTime(36_279), "36.27");
  assert.equal(formatTime(62_450), "1:02.45");
});

test("3 melhores em ordem crescente e 7 últimos do mais novo ao mais antigo", () => {
  const data = build([35950, 44890, 31850, 46380, 43200, 37620, 44960, 37820, 34840, 38470]);
  const rows = sidebarRows(data.solves);
  assert.equal(rows.length, 10);
  assert.deepEqual(rows.slice(0, 3).map((s) => s.ms), [31850, 34840, 35950]);
  assert.deepEqual(rows.slice(3).map((s) => s.id), [10, 9, 8, 7, 6, 5, 4]);
});

test("os melhores aparecem mesmo quando são antigos", () => {
  const data = build([10_000, ...Array(19).fill(50_000)]);
  assert.equal(sidebarRows(data.solves)[0].id, 1);
});

test("linhas vazias com poucas execuções", () => {
  const rows = sidebarRows(build([30_000]).solves);
  assert.equal(rows.filter(Boolean).length, 2);
});

test("apagar um dos melhores promove o próximo e não reaproveita o id", () => {
  let data = build([30_000, 31_000, 32_000, 33_000]);
  data = deleteSolve(data, 1);
  assert.deepEqual(sidebarRows(data.solves).slice(0, 3).map((s) => s.ms), [31_000, 32_000, 33_000]);
  data = addSolve(data, 1_000, "x");
  assert.equal(data.solves.at(-1).id, 5);
});
