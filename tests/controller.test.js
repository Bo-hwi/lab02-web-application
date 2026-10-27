import test from "node:test";
import assert from "node:assert/strict";
import { flashSaleProducts } from "../js/sale/products.js";
import { createInventoryState, getAvailableStock } from "../js/sale/inventory.js";
import { createSaleController } from "../js/sale/controller.js";

function setup(saleEndsAtMs = 305000) {
  let nowMs = 5000;
  let nextHandle = 1;
  const callbacks = new Map();
  const timer = {
    set(callback, delayMs) {
      const handle = nextHandle++;
      callbacks.set(handle, { callback, delayMs });
      return handle;
    },
    clear(handle) { callbacks.delete(handle); },
  };
  const controller = createSaleController({
    inventory: createInventoryState({ products: flashSaleProducts, saleEndsAtMs }),
    clock: { now: () => nowMs }, timer,
  });
  function fire(handle) {
    const entry = callbacks.get(handle);
    callbacks.delete(handle);
    entry.callback();
  }
  function reserve(requestId = "r1", buyerId = "alice", productId = "SALE-001") {
    controller.enqueue({ requestId, buyerId, productId });
    return controller.processNext().settlement.result;
  }
  return { controller, callbacks, fire, reserve,
    setNow(value) { nowMs = value; } };
}

test("scheduled absolute expiry releases a hold once and does not release it again", () => {
  const env = setup();
  const hold = env.reserve();
  assert.equal(hold.code, "RESERVED");
  assert.equal(getAvailableStock(env.controller.inventory, "SALE-001"), 1);
  const [[handle, scheduled]] = env.callbacks;
  assert.equal(scheduled.delayMs, 30000);
  env.setNow(35000);
  env.fire(handle);
  assert.equal(env.controller.inventory.reservations[0].status, "EXPIRED");
  assert.equal(getAvailableStock(env.controller.inventory, "SALE-001"), 2);
  assert.equal(env.callbacks.size, 0);
  assert.deepEqual(env.controller.expireDue().result.reservationIds, []);
  assert.equal(getAvailableStock(env.controller.inventory, "SALE-001"), 2);
});

test("a delayed expiry callback uses actual observed time", () => {
  const env = setup();
  env.reserve();
  const [handle] = env.callbacks.keys();
  env.setNow(40000);
  env.fire(handle);
  assert.equal(env.controller.inventory.reservations[0].status, "EXPIRED");
});

test("checkout immediately before deadline succeeds; at deadline expiry wins", () => {
  const before = setup();
  const hold1 = before.reserve();
  before.setNow(34999);
  assert.equal(before.controller.checkout(hold1.reservationId, "alice").result.code, "CHECKED_OUT");
  assert.equal(getAvailableStock(before.controller.inventory, "SALE-001"), 1);
  assert.equal(before.callbacks.size, 0);

  const boundary = setup();
  const hold2 = boundary.reserve();
  boundary.setNow(35000);
  assert.equal(boundary.controller.checkout(hold2.reservationId, "alice").result.code, "HOLD_EXPIRED");
  assert.equal(getAvailableStock(boundary.controller.inventory, "SALE-001"), 2);
  assert.equal(boundary.callbacks.size, 0);
});

test("checkout after sale closes is allowed while the hold remains valid", () => {
  const env = setup(6000);
  const hold = env.reserve();
  env.setNow(6000);
  assert.equal(env.controller.checkout(hold.reservationId, "alice").result.code, "CHECKED_OUT");
});

test("cancel and repeated terminal commands never release stock twice", () => {
  const env = setup();
  const hold = env.reserve();
  assert.equal(env.controller.cancelHold(hold.reservationId, "alice").result.code, "CANCELLED");
  assert.equal(getAvailableStock(env.controller.inventory, "SALE-001"), 2);
  assert.equal(env.controller.cancelHold(hold.reservationId, "alice").result.code, "ALREADY_SETTLED");
  env.setNow(50000);
  assert.deepEqual(env.controller.expireDue().result.reservationIds, []);
  assert.equal(getAvailableStock(env.controller.inventory, "SALE-001"), 2);
});

test("dispose clears timer, settles all pending attempts and blocks late work", () => {
  const env = setup();
  env.reserve();
  const [handle] = env.callbacks.keys();
  const late = env.callbacks.get(handle).callback;
  env.controller.enqueue({ requestId: "pending", buyerId: "bob", productId: "SALE-001" });
  env.controller.enqueue({ buyerId: "bad", productId: "SALE-001" });
  assert.equal(env.controller.dispose(), true);
  assert.equal(env.controller.dispose(), false);
  assert.equal(env.callbacks.size, 0);
  assert.equal(env.controller.queue.pending.length, 0);
  assert.deepEqual(env.controller.queue.settled.slice(-2).map((item) => item.result.code),
    ["REQUEST_CANCELLED", "REQUEST_CANCELLED"]);
  env.setNow(35000);
  late();
  assert.equal(env.controller.inventory.reservations[0].status, "RESERVED");
  assert.equal(env.controller.processNext().result.code, "DISPOSED");
  assert.equal(env.controller.checkout("HOLD-000001", "alice").result.code, "DISPOSED");
  assert.equal(env.controller.enqueue({ requestId: "new" }).result.code, "DISPOSED");
  assert.equal(getAvailableStock(env.controller.inventory, "SALE-001"), 1);
});
