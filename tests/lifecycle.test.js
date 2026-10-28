import test from "node:test";
import assert from "node:assert/strict";
import { flashSaleProducts } from "../js/sale/products.js";
import { createInventoryState, getAvailableStock } from "../js/sale/inventory.js";
import { createSaleController } from "../js/sale/controller.js";
import { createDeadlineCountdown } from "../js/sale/clock.js";

function makeScheduler() {
  let nowMs = 1000;
  let nextHandle = 1;
  const frames = new Map();
  const timeouts = new Map();
  return {
    clock: { now: () => nowMs },
    frameScheduler: {
      request(callback) { const handle = nextHandle++; frames.set(handle, callback); return handle; },
      cancel(handle) { frames.delete(handle); },
    },
    timer: {
      set(callback) { const handle = nextHandle++; timeouts.set(handle, callback); return handle; },
      clear(handle) { timeouts.delete(handle); },
    },
    setNow(value) { nowMs = value; },
    runFrame() {
      const [handle, callback] = frames.entries().next().value;
      frames.delete(handle);
      callback();
      return callback;
    },
    runTimeout() {
      const [handle, callback] = timeouts.entries().next().value;
      timeouts.delete(handle);
      callback();
      return callback;
    },
    get pendingFrames() { return frames.size; },
    get pendingTimeouts() { return timeouts.size; },
    get expiryCallbacks() { return [...timeouts.values()]; },
  };
}

test("twenty reset and disposal cycles leave no timers, subscriptions or stale actions", () => {
  const scheduler = makeScheduler();
  const priorCallbacks = [];
  let notifications = 0;

  for (let run = 0; run < 20; run++) {
    const nowMs = 1000 + run * 100000;
    scheduler.setNow(nowMs);
    const controller = createSaleController({
      inventory: createInventoryState({ products: flashSaleProducts,
        saleEndsAtMs: nowMs + 300000 }),
      clock: scheduler.clock,
      timer: scheduler.timer,
    });
    const countdownTicks = [];
    const countdown = createDeadlineCountdown({
      deadlineMs: nowMs + 300000,
      onTick: (remainingMs) => countdownTicks.push(remainingMs),
      clock: scheduler.clock,
      frameScheduler: scheduler.frameScheduler,
    });
    controller.subscribeInventory(() => notifications++);
    assert.equal(countdown.start(), true);
    assert.equal(scheduler.pendingFrames, 1);
    assert.equal(getAvailableStock(controller.inventory, "SALE-001"), 2);

    controller.enqueue({ requestId: "run-" + run, buyerId: "buyer", productId: "SALE-001" });
    assert.equal(controller.processNext().settlement.result.code, "RESERVED");
    assert.equal(notifications, run + 1);
    assert.equal(scheduler.pendingTimeouts, 1);
    const expiryCallback = scheduler.expiryCallbacks[0];
    const frameCallback = scheduler.runFrame();
    assert.equal(scheduler.pendingFrames, 1);
    scheduler.setNow(nowMs + 300000);
    scheduler.runFrame();
    assert.equal(countdownTicks.at(-1), 0);
    assert.equal(scheduler.pendingFrames, 0);
    countdown.dispose();
    controller.dispose();
    assert.equal(scheduler.pendingFrames, 0);
    assert.equal(scheduler.pendingTimeouts, 0);
    priorCallbacks.push([expiryCallback, frameCallback, countdownTicks]);

    scheduler.setNow(nowMs + 340000);
    for (const [lateExpiry, lateFrame, ticks] of priorCallbacks) {
      const count = ticks.length;
      lateExpiry();
      lateFrame();
      assert.equal(ticks.length, count);
    }
    assert.equal(controller.inventory.reservations[0].status, "RESERVED");
    assert.equal(controller.processNext().result.code, "DISPOSED");
    assert.equal(notifications, run + 1);
  }
});

test("competing requests settle once without overselling after cancellation and expiry", () => {
  const scheduler = makeScheduler();
  const controller = createSaleController({
    inventory: createInventoryState({ products: flashSaleProducts, saleEndsAtMs: 301000 }),
    clock: scheduler.clock,
    timer: scheduler.timer,
  });
  for (let index = 0; index < 12; index++) {
    controller.enqueue({ requestId: "request-" + index, buyerId: "buyer-" + index,
      productId: "SALE-001" });
  }
  assert.equal(controller.cancelPending("request-3").settlement.result.code, "REQUEST_CANCELLED");
  const outcomes = [];
  while (controller.queue.pending.length) outcomes.push(controller.processNext().settlement.result.code);
  assert.deepEqual(outcomes.slice(0, 2), ["RESERVED", "RESERVED"]);
  assert.ok(outcomes.slice(2).every((code) => code === "SOLD_OUT"));
  assert.equal(getAvailableStock(controller.inventory, "SALE-001"), 0);
  assert.equal(scheduler.pendingTimeouts, 1);

  const [first, second] = controller.inventory.reservations;
  assert.equal(controller.checkout(first.id, first.buyerId).result.code, "CHECKED_OUT");
  assert.equal(controller.cancelHold(second.id, second.buyerId).result.code, "CANCELLED");
  assert.equal(controller.cancelHold(second.id, second.buyerId).result.code, "ALREADY_SETTLED");
  assert.equal(scheduler.pendingTimeouts, 0);
  assert.equal(getAvailableStock(controller.inventory, "SALE-001"), 1);

  controller.enqueue({ requestId: "after-cancel", buyerId: "buyer-new", productId: "SALE-001" });
  const replacement = controller.processNext().settlement.result;
  assert.equal(replacement.code, "RESERVED");
  scheduler.setNow(31001);
  scheduler.runTimeout();
  assert.equal(controller.inventory.reservations.at(-1).status, "EXPIRED");
  assert.equal(getAvailableStock(controller.inventory, "SALE-001"), 1);
  assert.equal(scheduler.pendingTimeouts, 0);
  assert.equal(controller.checkout(replacement.reservationId, "buyer-new").result.code,
    "HOLD_EXPIRED");
  assert.equal(getAvailableStock(controller.inventory, "SALE-001"), 1);
  controller.dispose();
});
