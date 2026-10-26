import test from "node:test";
import assert from "node:assert/strict";
import { paginateProducts } from "../js/grid/model.js";

const makeRows = (count) =>
  Array.from({ length: count }, (_, index) => ({ id: `row-${index + 1}` }));

test("empty results stay on page 1 with zero pages and zero row range", () => {
  assert.deepEqual(paginateProducts([], { page: 4 }), {
    items: [],
    page: 1,
    pageSize: 10,
    pageCount: 0,
    totalRows: 0,
    startRow: 0,
    endRow: 0,
  });
});

test("a single page returns all items and exact row bounds", () => {
  const rows = makeRows(7);
  const result = paginateProducts(rows);

  assert.equal(result.pageCount, 1);
  assert.equal(result.startRow, 1);
  assert.equal(result.endRow, 7);
  assert.deepEqual(result.items, rows);
});

test("a partially filled final page reports its actual row range", () => {
  const result = paginateProducts(makeRows(25), { page: 3, pageSize: 10 });

  assert.equal(result.page, 3);
  assert.equal(result.pageCount, 3);
  assert.equal(result.startRow, 21);
  assert.equal(result.endRow, 25);
  assert.deepEqual(result.items.map((row) => row.id), [
    "row-21", "row-22", "row-23", "row-24", "row-25",
  ]);
});

test("requested pages are clamped when filtering leaves fewer pages", () => {
  const result = paginateProducts(makeRows(12), { page: 5, pageSize: 10 });

  assert.equal(result.page, 2);
  assert.equal(result.pageCount, 2);
  assert.equal(result.startRow, 11);
  assert.equal(result.endRow, 12);
});

test("all supported page sizes produce the expected page counts", () => {
  for (const pageSize of [10, 20, 50]) {
    const result = paginateProducts(makeRows(100), { pageSize });
    assert.equal(result.pageSize, pageSize);
    assert.equal(result.pageCount, 100 / pageSize);
  }
});

test("traversing all pages neither duplicates nor omits rows", () => {
  const source = makeRows(25);
  const allPages = [1, 2, 3].flatMap((page) =>
    paginateProducts(source, { page, pageSize: 10 }).items);

  assert.deepEqual(allPages.map((row) => row.id), source.map((row) => row.id));
  assert.equal(new Set(allPages.map((row) => row.id)).size, source.length);
});

test("invalid pages and page sizes use safe defaults", () => {
  const result = paginateProducts(makeRows(3), { page: 0, pageSize: 15 });

  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 10);
  assert.equal(result.pageCount, 1);
});
