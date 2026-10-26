import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../js/data/products.js";
import { filterProducts, sortProducts } from "../js/grid/model.js";

const sortableColumns = [
  { accessorKey: "id", sortable: true },
  { accessorKey: "name", sortable: true },
  { accessorKey: "category", sortable: true },
  { accessorKey: "price", sortable: true },
  { accessorKey: "stock", sortable: true },
  { accessorKey: "internalNote", sortable: false },
];

test("search trims whitespace and ignores case in product IDs", () => {
  const result = filterProducts(products, { query: "  sp001  " });
  assert.deepEqual(result.map((product) => product.id), ["SP001"]);
});

test("search matches product names", () => {
  const result = filterProducts(products, { query: "WIRELESS MOUSE" });
  assert.equal(result.length, 10);
  assert.ok(result.every((product) => product.name.toLowerCase().includes("wireless mouse")));
});

test("category matching is exact", () => {
  const result = filterProducts(products, { category: "Audio" });
  assert.equal(result.length, 20);
  assert.ok(result.every((product) => product.category === "Audio"));
  assert.deepEqual(filterProducts(products, { category: "audio" }), []);
});

test("query and category filters combine with AND", () => {
  const matches = filterProducts(products, { query: "series 1", category: "Audio" });
  assert.deepEqual(matches.map((product) => product.id), ["SP006", "SP007", "SP096", "SP097"]);
  assert.deepEqual(filterProducts(products, { query: "wireless mouse", category: "Displays" }), []);
});

test("empty filters return a new array without mutating source data", () => {
  const originalFirstId = products[0].id;
  const result = filterProducts(products);
  assert.equal(result.length, products.length);
  assert.notEqual(result, products);
  assert.equal(products[0].id, originalFirstId);
});

test("search remains accent-sensitive", () => {
  const accentedProducts = [{ id: "SP-C1", name: "Café Speaker", category: "Audio" }];
  assert.equal(filterProducts(accentedProducts, { query: "cafe" }).length, 0);
  assert.equal(filterProducts(accentedProducts, { query: "café" }).length, 1);
});

test("numeric sorting uses numeric order in both directions", () => {
  const sample = [
    { id: "a", price: 10 },
    { id: "b", price: 100 },
    { id: "c", price: 2 },
  ];

  assert.deepEqual(
    sortProducts(sample, { key: "price", columns: sortableColumns }).map((product) => product.price),
    [2, 10, 100],
  );
  assert.deepEqual(
    sortProducts(sample, { key: "price", direction: "desc", columns: sortableColumns })
      .map((product) => product.price),
    [100, 10, 2],
  );
});

test("equal values keep their original order", () => {
  const sample = [
    { id: "second", price: 10 },
    { id: "first", price: 2 },
    { id: "third", price: 10 },
  ];

  assert.deepEqual(
    sortProducts(sample, { key: "price", columns: sortableColumns }).map((product) => product.id),
    ["first", "second", "third"],
  );
});

test("text sorting uses English locale comparison", () => {
  const sample = [
    { id: "1", category: "Office" },
    { id: "2", category: "Audio" },
    { id: "3", category: "Displays" },
  ];

  assert.deepEqual(
    sortProducts(sample, { key: "category", columns: sortableColumns })
      .map((product) => product.category),
    ["Audio", "Displays", "Office"],
  );
});

test("non-sortable and unknown columns preserve input order", () => {
  const sample = [{ id: "b" }, { id: "a" }];

  assert.deepEqual(sortProducts(sample, {
    key: "internalNote",
    columns: sortableColumns,
  }), sample);
  assert.deepEqual(sortProducts(sample, {
    key: "missing",
    columns: sortableColumns,
  }), sample);
});

test("sorting filtered results does not mutate source products", () => {
  const filtered = filterProducts(products, { query: "series 1", category: "Audio" });
  const sorted = sortProducts(filtered, {
    key: "price",
    columns: sortableColumns,
  });

  assert.ok(sorted.every((product) => product.category === "Audio"));
  assert.deepEqual(sorted.map((product) => product.price),
    [...sorted].map((product) => product.price).sort((a, b) => a - b));
  assert.deepEqual(products.map((product) => product.id),
    Array.from({ length: products.length }, (_, index) => `SP${String(index + 1).padStart(3, "0")}`));
});
