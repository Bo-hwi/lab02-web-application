import test from "node:test";
import assert from "node:assert/strict";
import { flashSaleProducts } from "../js/sale/products.js";
import { createInventoryState, getAvailableStock } from "../js/sale/inventory.js";
import { createReservationQueue, enqueueReservation, cancelPendingReservation,
  processNextReservation, drainReservationQueue } from "../js/sale/queue.js";

const initial = () => createReservationQueue(createInventoryState({
  products: flashSaleProducts, saleEndsAtMs: 305000,
}));
const request = (requestId, buyerId, productId = "SALE-001") =>
  ({ requestId, buyerId, productId });
const add = (queue, attempt) => enqueueReservation(queue, attempt).queue;

test("competing attempts settle in FIFO sequence without overselling", () => {
  let queue = initial();
  for (const [id, buyer] of [["r1", "a"], ["r2", "b"], ["r3", "c"]]) {
    queue = add(queue, request(id, buyer));
  }
  assert.deepEqual(queue.pending.map((entry) => entry.sequence), [1, 2, 3]);
  const drained = drainReservationQueue(queue, () => 5000);
  assert.deepEqual(drained.settlements.map((entry) => entry.result.code),
    ["RESERVED", "RESERVED", "SOLD_OUT"]);
  assert.deepEqual(drained.settlements.map((entry) => entry.requestId), ["r1", "r2", "r3"]);
  assert.equal(drained.queue.pending.length, 0);
  assert.equal(drained.queue.settled.length, 3);
  assert.equal(getAvailableStock(drained.queue.inventory, "SALE-001"), 0);
  assert.equal(drained.queue.inventory.reservations.length, 2);
  assert.equal(getAvailableStock(queue.inventory, "SALE-001"), 2);
});

test("pending cancellation settles once and never acquires stock", () => {
  let queue = add(initial(), request("r1", "a"));
  queue = add(queue, request("r2", "b"));
  const cancelled = cancelPendingReservation(queue, "r1");
  assert.equal(cancelled.settlement.sequence, 1);
  assert.deepEqual(cancelled.settlement.result, { ok: false, code: "REQUEST_CANCELLED" });
  const replay = enqueueReservation(cancelled.queue, request("r1", "a"));
  assert.equal(replay.queue, cancelled.queue);
  assert.equal(replay.ticket, cancelled.settlement);
  const repeatedCancel = cancelPendingReservation(cancelled.queue, "r1");
  assert.equal(repeatedCancel.queue, cancelled.queue);
  assert.equal(repeatedCancel.settlement, cancelled.settlement);
  const drained = drainReservationQueue(cancelled.queue, () => 5000);
  assert.deepEqual(drained.settlements.map((entry) => entry.requestId), ["r2"]);
  assert.equal(getAvailableStock(drained.queue.inventory, "SALE-001"), 1);
  assert.equal(drained.queue.settled.length, 2);
});

test("repeated pending and settled request IDs do not create new attempts", () => {
  const first = enqueueReservation(initial(), request("r1", "a"));
  const pendingReplay = enqueueReservation(first.queue, request("r1", "b"));
  assert.equal(pendingReplay.queue, first.queue);
  assert.equal(pendingReplay.ticket, first.ticket);
  const processed = processNextReservation(first.queue, 5000);
  const settledReplay = enqueueReservation(processed.queue, request("r1", "b"));
  assert.equal(settledReplay.queue, processed.queue);
  assert.equal(settledReplay.ticket, processed.settlement);
  assert.equal(processed.queue.nextSequence, 2);
  assert.equal(getAvailableStock(processed.queue.inventory, "SALE-001"), 1);
});

test("invalid and closed-sale attempts receive named settlements", () => {
  let queue = initial();
  queue = add(queue, request("bad-product", "a", "missing"));
  queue = add(queue, request("closed", "b"));
  queue = add(queue, request("bad-id", "c", "SALE-003"));
  const times = [5000, 305000, 5000];
  const drained = drainReservationQueue(queue, () => times.shift());
  assert.deepEqual(drained.settlements.map((entry) => entry.result.code),
    ["INVALID_REQUEST", "SALE_CLOSED", "SOLD_OUT"]);
  assert.equal(getAvailableStock(drained.queue.inventory, "SALE-001"), 2);
  assert.equal(drained.queue.settled.length, 3);
});

test("each command observes its own time and due holds release before the next command", () => {
  let queue = initial();
  for (const [id, buyer] of [["r1", "a"], ["r2", "b"], ["r3", "c"]]) {
    queue = add(queue, request(id, buyer));
  }
  const times = [5000, 5001, 35000];
  const drained = drainReservationQueue(queue, () => times.shift());
  assert.deepEqual(drained.settlements.map((entry) => entry.result.code),
    ["RESERVED", "RESERVED", "RESERVED"]);
  assert.equal(drained.queue.inventory.reservations[0].status, "EXPIRED");
  assert.equal(getAvailableStock(drained.queue.inventory, "SALE-001"), 0);
  assert.equal(drained.queue.inventory.reservations.length, 3);
});

test("the same input and clock sequence produce the same legal final state", () => {
  const run = () => {
    let queue = initial();
    for (const [id, buyer] of [["r1", "a"], ["r2", "b"], ["r3", "c"]]) {
      queue = add(queue, request(id, buyer));
    }
    queue = cancelPendingReservation(queue, "r2").queue;
    queue = add(queue, request("r4", "d"));
    return drainReservationQueue(queue, () => 5000).queue;
  };
  const first = run();
  assert.deepEqual(first, run());
  assert.deepEqual(first.settled.map((entry) => entry.result.code),
    ["REQUEST_CANCELLED", "RESERVED", "RESERVED", "SOLD_OUT"]);
  assert.ok(flashSaleProducts.every((product) =>
    getAvailableStock(first.inventory, product.id) >= 0));
  assert.equal(processNextReservation(first, 5000).settlement, null);
  assert.equal(cancelPendingReservation(first, "missing").settlement.result.code, "UNKNOWN_REQUEST");
});
test("an attempt without a stable request ID still settles as invalid", () => {
  const queued = enqueueReservation(initial(), { buyerId: "a", productId: "SALE-001" });
  const processed = processNextReservation(queued.queue, 5000);
  assert.deepEqual(processed.settlement.result, { ok: false, code: "INVALID_REQUEST" });
  assert.equal(processed.queue.settled.length, 1);
  assert.equal(processed.queue.pending.length, 0);
  assert.equal(getAvailableStock(processed.queue.inventory, "SALE-001"), 2);
});