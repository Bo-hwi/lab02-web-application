import test from "node:test";
import assert from "node:assert/strict";
import { createInitialGridState, transitionGridState } from "../js/grid/state.js";
import { updateProductSelection } from "../js/grid/selection.js";

const product = { id: "SP001", name: "Mechanical Keyboard - Series 1" };

test("selecting a product stores its ID before calling the optional callback", () => {
  const state = createInitialGridState();
  const selectedProducts = [];
  const changed = updateProductSelection(state, product, true, (selectedProduct) => {
    assert.ok(state.selectedIds.has(product.id));
    selectedProducts.push(selectedProduct);
  });

  assert.equal(changed, true);
  assert.deepEqual(selectedProducts, [product]);
});

test("deselecting a product does not call onRowSelect", () => {
  const state = createInitialGridState();
  state.selectedIds.add(product.id);
  let callbackCount = 0;

  assert.equal(updateProductSelection(state, product, false, () => callbackCount += 1), true);
  assert.equal(state.selectedIds.has(product.id), false);
  assert.equal(callbackCount, 0);
});

test("repeated checked events do not toggle or call the callback twice", () => {
  const state = createInitialGridState();
  let callbackCount = 0;
  const callback = () => callbackCount += 1;

  assert.equal(updateProductSelection(state, product, true, callback), true);
  assert.equal(updateProductSelection(state, product, true, callback), false);
  assert.equal(state.selectedIds.has(product.id), true);
  assert.equal(callbackCount, 1);
});

test("selection remains keyed to product IDs across view-state changes", () => {
  const state = createInitialGridState();
  updateProductSelection(state, product, true);
  const filtered = transitionGridState(state, { type: "QUERY_CHANGED", value: "mouse" });
  const sorted = transitionGridState(filtered, {
    type: "SORT_REQUESTED", key: "price", sortable: true,
  });
  const nextPage = transitionGridState(sorted, { type: "PAGE_CHANGED", page: 2 });

  assert.ok(filtered.selectedIds.has(product.id));
  assert.ok(sorted.selectedIds.has(product.id));
  assert.ok(nextPage.selectedIds.has(product.id));
});

test("invalid products and deselecting an unselected product are no-ops", () => {
  const state = createInitialGridState();
  assert.equal(updateProductSelection(state, null, true), false);
  assert.equal(updateProductSelection(state, product, false), false);
  assert.equal(state.selectedIds.size, 0);
});
