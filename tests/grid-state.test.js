import test from "node:test";
import assert from "node:assert/strict";
import { createInitialGridState, transitionGridState } from "../js/grid/state.js";

test("initial state matches the data-grid contract", () => {
  const state = createInitialGridState();
  assert.equal(state.query, "");
  assert.equal(state.category, "");
  assert.equal(state.sortKey, null);
  assert.equal(state.sortDirection, "asc");
  assert.equal(state.page, 1);
  assert.equal(state.pageSize, 10);
  assert.deepEqual([...state.selectedIds], []);
  assert.equal(state.activeCell, null);
});

test("query and category changes reset pagination without mutation", () => {
  const original = { ...createInitialGridState(), page: 4 };
  const queryState = transitionGridState(original, { type: "QUERY_CHANGED", value: "key" });
  const categoryState = transitionGridState(original, { type: "CATEGORY_CHANGED", value: "Audio" });
  assert.equal(queryState.query, "key");
  assert.equal(categoryState.category, "Audio");
  assert.equal(queryState.page, 1);
  assert.equal(categoryState.page, 1);
  assert.equal(original.page, 4);
});

test("sorting starts ascending and toggles on the same sortable column", () => {
  const first = transitionGridState(createInitialGridState(), {
    type: "SORT_REQUESTED", key: "price", sortable: true,
  });
  const second = transitionGridState(first, {
    type: "SORT_REQUESTED", key: "price", sortable: true,
  });
  assert.equal(first.sortDirection, "asc");
  assert.equal(second.sortDirection, "desc");
  assert.equal(transitionGridState(first, {
    type: "SORT_REQUESTED", key: "stock", sortable: false,
  }), first);
});

test("page size accepts only supported values", () => {
  const state = { ...createInitialGridState(), page: 3 };
  assert.equal(transitionGridState(state, {
    type: "PAGE_SIZE_CHANGED", pageSize: 20,
  }).pageSize, 20);
  assert.equal(transitionGridState(state, {
    type: "PAGE_SIZE_CHANGED", pageSize: 15,
  }), state);
});

test("row toggling copies the selected ID set and ignores invalid IDs", () => {
  const original = createInitialGridState();
  const selected = transitionGridState(original, { type: "ROW_TOGGLED", id: "SP001" });
  const deselected = transitionGridState(selected, { type: "ROW_TOGGLED", id: "SP001" });
  assert.deepEqual([...selected.selectedIds], ["SP001"]);
  assert.deepEqual([...deselected.selectedIds], []);
  assert.deepEqual([...original.selectedIds], []);
  assert.equal(transitionGridState(original, { type: "ROW_TOGGLED", id: "" }), original);
});

test("unknown events leave state unchanged", () => {
  const state = createInitialGridState();
  assert.equal(transitionGridState(state, { type: "UNKNOWN" }), state);
});
