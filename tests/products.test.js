import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../js/data/products.js";

test("products provide 100 rows with unique non-empty IDs", () => {
  assert.equal(products.length, 100);
  assert.ok(products.every((product) =>
    typeof product.id === "string" && product.id.trim().length > 0,
  ));
  assert.equal(new Set(products.map((product) => product.id)).size, 100);
});

test("every product satisfies the field contract", () => {
  for (const product of products) {
    for (const field of ["name", "category"]) {
      assert.equal(typeof product[field], "string", `${product.id}: ${field}`);
      assert.ok(product[field].trim().length > 0, `${product.id}: empty ${field}`);
    }

    assert.equal(typeof product.price, "number", `${product.id}: price type`);
    assert.ok(Number.isFinite(product.price) && product.price >= 0,
      `${product.id}: invalid price`);
    assert.ok(Number.isInteger(product.stock) && product.stock >= 0,
      `${product.id}: invalid stock`);
  }
});

test("fixtures cover category filters, price ties and zero stock", () => {
  assert.ok(new Set(products.map((product) => product.category)).size > 1);
  assert.ok(new Set(products.map((product) => product.price)).size < products.length);
  assert.ok(products.some((product) => product.stock === 0));
  assert.ok(products.some((product) => product.stock > 0));
});

test("source fixtures cannot be sorted or edited in place", () => {
  const originalFirstId = products[0].id;
  const originalPrice = products[0].price;

  assert.throws(() => products.sort((a, b) => a.price - b.price), TypeError);
  assert.throws(() => { products[0].price = -1; }, TypeError);
  assert.equal(products[0].id, originalFirstId);
  assert.equal(products[0].price, originalPrice);
});
