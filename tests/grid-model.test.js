import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../js/data/products.js";
import { filterProducts } from "../js/grid/model.js";

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
