import test from "node:test";
import assert from "node:assert/strict";
import { getAdjacentCell } from "../js/grid/keyboard.js";

const rows = [{ id: "SP001" }, { id: "SP002" }, { id: "SP003" }];
const columns = ["selection", "id", "name"];

test("arrow keys move between rows and columns without changing axes", () => {
  const current = { productId: "SP002", columnKey: "id" };
  assert.deepEqual(getAdjacentCell(rows, current, "ArrowUp", columns), {
    productId: "SP001", columnKey: "id",
  });
  assert.deepEqual(getAdjacentCell(rows, current, "ArrowDown", columns), {
    productId: "SP003", columnKey: "id",
  });
  assert.deepEqual(getAdjacentCell(rows, current, "ArrowLeft", columns), {
    productId: "SP002", columnKey: "selection",
  });
  assert.deepEqual(getAdjacentCell(rows, current, "ArrowRight", columns), {
    productId: "SP002", columnKey: "name",
  });
});

test("arrow navigation clamps at the current page boundaries", () => {
  assert.deepEqual(getAdjacentCell(rows, {
    productId: "SP001", columnKey: "selection",
  }, "ArrowUp", columns), { productId: "SP001", columnKey: "selection" });
  assert.deepEqual(getAdjacentCell(rows, {
    productId: "SP003", columnKey: "name",
  }, "ArrowDown", columns), { productId: "SP003", columnKey: "name" });
  assert.deepEqual(getAdjacentCell(rows, {
    productId: "SP001", columnKey: "selection",
  }, "ArrowLeft", columns), { productId: "SP001", columnKey: "selection" });
  assert.deepEqual(getAdjacentCell(rows, {
    productId: "SP003", columnKey: "name",
  }, "ArrowRight", columns), { productId: "SP003", columnKey: "name" });
});

test("unknown keys and empty pages do not produce an active cell", () => {
  assert.equal(getAdjacentCell(rows, { productId: "SP001", columnKey: "id" }, "Enter", columns), null);
  assert.equal(getAdjacentCell([], null, "ArrowDown", columns), null);
});
