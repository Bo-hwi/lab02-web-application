import test from "node:test";
import assert from "node:assert/strict";
import { flashSaleProducts } from "../js/sale/products.js";
import { createInventoryState, getAvailableStock, transitionInventory } from "../js/sale/inventory.js";

const deadline = 305000;
const initial = () => createInventoryState({ products: flashSaleProducts, saleEndsAtMs: deadline });
const reserve = (requestId, buyerId = "buyer-a", productId = "SALE-001") =>
  ({ type: "RESERVE", requestId, buyerId, productId });
const apply = (state, event, nowMs = 5000) => transitionInventory(state, event, nowMs);

test("initial available stock is derived and source products stay immutable", () => {
  const state = initial();
  assert.deepEqual(state.products.map((product) => getAvailableStock(state, product.id)), [2, 1, 0]);
  assert.equal(getAvailableStock(state, "missing"), null);
  assert.throws(() => { state.products[0].initialStock = 99; }, TypeError);
});

test("reserve consumes one unit; checkout commits it without releasing stock", () => {
  const original = initial();
  const accepted = apply(original, reserve("r1"));
  assert.equal(accepted.result.code, "RESERVED");
  assert.equal(getAvailableStock(original, "SALE-001"), 2);
  assert.equal(getAvailableStock(accepted.state, "SALE-001"), 1);
  assert.equal(accepted.state.reservations[0].status, "RESERVED");
  assert.equal(accepted.state.reservations[0].expiresAtMs, 35000);
  const checkout = apply(accepted.state, { type: "CHECKOUT", reservationId: accepted.result.reservationId, buyerId: "buyer-a" });
  assert.equal(checkout.result.code, "CHECKED_OUT");
  assert.equal(getAvailableStock(checkout.state, "SALE-001"), 1);
  assert.equal(checkout.state.reservations[0].status, "CHECKED_OUT");
  assert.equal(accepted.state.reservations[0].status, "RESERVED");
});

test("same request returns its original result, and a second request reuses an active hold", () => {
  const first = apply(initial(), reserve("r1"));
  const repeated = apply(first.state, reserve("r1"));
  assert.strictEqual(repeated.state, first.state);
  assert.strictEqual(repeated.result, first.result);
  const second = apply(first.state, reserve("r2"));
  assert.equal(second.result.code, "EXISTING_HOLD");
  assert.equal(second.result.reservationId, first.result.reservationId);
  assert.equal(getAvailableStock(second.state, "SALE-001"), 1);
  assert.equal(second.state.reservations.length, 1);
});

test("sold out, closed sale and invalid input reject without reserving", () => {
  let state = initial();
  const zero = apply(state, reserve("r0", "buyer-a", "SALE-003"));
  assert.equal(zero.result.code, "SOLD_OUT");
  state = apply(state, reserve("r1", "buyer-a", "SALE-002")).state;
  const sold = apply(state, reserve("r2", "buyer-b", "SALE-002"));
  assert.equal(sold.result.code, "SOLD_OUT");
  const closed = apply(state, reserve("r3", "buyer-b"), deadline);
  assert.equal(closed.result.code, "SALE_CLOSED");
  assert.equal(apply(state, reserve("r4", "buyer-b", "missing")).result.code, "INVALID_REQUEST");
  assert.equal(apply(state, { type: "BOGUS" }).result.code, "INVALID_EVENT");
  assert.equal(getAvailableStock(state, "SALE-002"), 0);
});

test("cancel releases exactly once and enforces owner and terminal guards", () => {
  const first = apply(initial(), reserve("r1"));
  const id = first.result.reservationId;
  const wrong = apply(first.state, { type: "CANCEL", reservationId: id, buyerId: "buyer-b" });
  assert.equal(wrong.result.code, "NOT_HOLD_OWNER");
  assert.strictEqual(wrong.state, first.state);
  const cancelled = apply(first.state, { type: "CANCEL", reservationId: id, buyerId: "buyer-a" });
  assert.equal(cancelled.result.code, "CANCELLED");
  assert.equal(getAvailableStock(cancelled.state, "SALE-001"), 2);
  assert.equal(apply(cancelled.state, { type: "CANCEL", reservationId: id, buyerId: "buyer-a" }).result.code, "ALREADY_SETTLED");
  assert.equal(apply(cancelled.state, { type: "CHECKOUT", reservationId: id, buyerId: "buyer-a" }).result.code, "ALREADY_SETTLED");
  assert.equal(getAvailableStock(cancelled.state, "SALE-001"), 2);
});

test("expiry wins at the exact checkout boundary and releases stock once", () => {
  const first = apply(initial(), reserve("r1"));
  const id = first.result.reservationId;
  const justBefore = apply(first.state, { type: "CHECKOUT", reservationId: id, buyerId: "buyer-a" }, 34999);
  assert.equal(justBefore.result.code, "CHECKED_OUT");
  const atBoundary = apply(first.state, { type: "CHECKOUT", reservationId: id, buyerId: "buyer-a" }, 35000);
  assert.equal(atBoundary.result.code, "HOLD_EXPIRED");
  assert.equal(atBoundary.state.reservations[0].status, "EXPIRED");
  assert.equal(getAvailableStock(atBoundary.state, "SALE-001"), 2);
  const repeated = apply(atBoundary.state, { type: "EXPIRE" }, 50000);
  assert.deepEqual(repeated.result.reservationIds, []);
  assert.strictEqual(repeated.state, atBoundary.state);
  assert.equal(getAvailableStock(repeated.state, "SALE-001"), 2);
});

test("processed request IDs remain idempotent after a hold expires", () => {
  const first = apply(initial(), reserve("r1"));
  const repeated = apply(first.state, reserve("r1"), 35000);
  assert.equal(repeated.result.code, "RESERVED");
  assert.equal(repeated.state.reservations[0].status, "EXPIRED");
  assert.equal(getAvailableStock(repeated.state, "SALE-001"), 2);
  const fresh = apply(repeated.state, reserve("r2"), 35000);
  assert.equal(fresh.result.code, "RESERVED");
  assert.notEqual(fresh.result.reservationId, first.result.reservationId);
});

test("availability never drops below zero across repeated attempts", () => {
  let state = initial();
  for (let i = 0; i < 20; i += 1) {
    state = apply(state, reserve("r" + i, "buyer-" + i, "SALE-002")).state;
    assert.ok(getAvailableStock(state, "SALE-002") >= 0);
  }
  assert.equal(state.reservations.length, 1);
  assert.equal(getAvailableStock(state, "SALE-002"), 0);
});

test("active hold remains reusable after sale closes; new holds are rejected", () => {
  const state = createInventoryState({ products: flashSaleProducts, saleEndsAtMs: 6000 });
  const first = apply(state, reserve("r1"));
  const reused = apply(first.state, reserve("r2"), 6000);
  assert.equal(reused.result.code, "EXISTING_HOLD");
  assert.equal(reused.result.reservationId, first.result.reservationId);
  assert.equal(reused.state.reservations.length, 1);
  assert.equal(apply(reused.state, reserve("r3", "buyer-b"), 6000).result.code, "SALE_CLOSED");
  const checkedOut = apply(reused.state,
    { type: "CHECKOUT", reservationId: first.result.reservationId, buyerId: "buyer-a" }, 6000);
  assert.equal(checkedOut.result.code, "CHECKED_OUT");
});