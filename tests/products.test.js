import test from "node:test";
import assert from "node:assert/strict";
import { flashSaleProducts } from "../js/sale/products.js";

test("fixtures match the reviewed flash-sale contract", () => {
  assert.deepEqual(
    flashSaleProducts.map(({ id, name, priceVnd, initialStock }) => ({
      id, name, priceVnd, initialStock,
    })),
    [
      { id: "SALE-001", name: "Midnight Earbuds", priceVnd: 199000, initialStock: 2 },
      { id: "SALE-002", name: "Wireless Mouse", priceVnd: 99000, initialStock: 1 },
      { id: "SALE-003", name: "Compact Keyboard", priceVnd: 299000, initialStock: 0 },
    ],
  );
});

test("IDs are unique and all product fields satisfy the data contract", () => {
  const ids = new Set();
  for (const product of flashSaleProducts) {
    assert.match(product.id, /^SALE-\d{3}$/);
    assert.equal(ids.has(product.id), false);
    ids.add(product.id);
    assert.equal(typeof product.name, "string");
    assert.ok(product.name.trim().length > 0);
    assert.ok(Number.isSafeInteger(product.priceVnd) && product.priceVnd >= 0);
    assert.ok(Number.isSafeInteger(product.initialStock) && product.initialStock >= 0);
  }
  assert.ok(flashSaleProducts.some(({ initialStock }) => initialStock === 0));
  assert.ok(flashSaleProducts.some(({ initialStock }) => initialStock > 0));
});

test("source inventory rejects edits and preserves its order", () => {
  assert.ok(Object.isFrozen(flashSaleProducts));
  assert.ok(flashSaleProducts.every(Object.isFrozen));
  const idsBefore = flashSaleProducts.map(({ id }) => id);
  assert.throws(() => flashSaleProducts.reverse(), TypeError);
  assert.throws(() => { flashSaleProducts[0].initialStock = 99; }, TypeError);
  assert.deepEqual(flashSaleProducts.map(({ id }) => id), idsBefore);
  assert.equal(flashSaleProducts[0].initialStock, 2);
});