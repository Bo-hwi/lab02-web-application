import { transitionInventory } from "./inventory.js";
import { createReservationQueue, enqueueReservation, cancelPendingReservation,
  processNextReservation } from "./queue.js";

/** Owns one page instance's FIFO queue, holds, and expiry timer. */
export function createSaleController({ inventory, clock = { now: () => Date.now() },
  timer = { set: (callback, delayMs) => setTimeout(callback, delayMs),
    clear: (handle) => clearTimeout(handle) } }) {
  if (!inventory || typeof clock?.now !== "function" ||
      typeof timer?.set !== "function" || typeof timer?.clear !== "function") {
    throw new TypeError("Inventory, clock and timer are required");
  }

  let queue = createReservationQueue(inventory);
  let disposed = false;
  let timeoutHandle = null;
  let timerGeneration = 0;
  const inventoryListeners = new Set();
  const disposedResult = Object.freeze({ ok: false, code: "DISPOSED" });

  function observedNow() {
    const nowMs = clock.now();
    if (!Number.isSafeInteger(nowMs)) throw new TypeError("clock.now() must return integer milliseconds");
    return nowMs;
  }

  function clearExpiryTimer() {
    timerGeneration += 1;
    if (timeoutHandle !== null) {
      timer.clear(timeoutHandle);
      timeoutHandle = null;
    }
  }

  function scheduleExpiry() {
    clearExpiryTimer();
    if (disposed) return;
    const dueAtMs = Math.min(...queue.inventory.reservations
      .filter((hold) => hold.status === "RESERVED")
      .map((hold) => hold.expiresAtMs));
    if (!Number.isFinite(dueAtMs)) return;
    const delayMs = Math.max(1, dueAtMs - observedNow());
    const generation = timerGeneration;
    timeoutHandle = timer.set(() => {
      if (disposed || generation !== timerGeneration) return;
      timeoutHandle = null;
      expireDue();
    }, delayMs);
  }

  function setInventory(inventoryState) {
    const previous = queue.inventory;
    queue = Object.freeze({ ...queue, inventory: inventoryState });
    scheduleExpiry();
    if (previous !== inventoryState) notifyInventoryChange(inventoryState, previous);
  }

  function notifyInventoryChange(current, previous) {
    for (const listener of [...inventoryListeners]) listener(current, previous);
  }

  function subscribeInventory(listener) {
    if (typeof listener !== "function") throw new TypeError("listener must be a function");
    if (!disposed) inventoryListeners.add(listener);
    return () => inventoryListeners.delete(listener);
  }

  function expireDue() {
    if (disposed) return { result: disposedResult, state: queue.inventory };
    const changed = transitionInventory(queue.inventory, { type: "EXPIRE" }, observedNow());
    setInventory(changed.state);
    return changed;
  }

  function enqueue(request) {
    if (disposed) return { ticket: null, result: disposedResult };
    const outcome = enqueueReservation(queue, request);
    queue = outcome.queue;
    return { ticket: outcome.ticket };
  }

  function processNext() {
    if (disposed) return { settlement: null, result: disposedResult };
    const previous = queue.inventory;
    const outcome = processNextReservation(queue, observedNow());
    queue = outcome.queue;
    if (outcome.settlement) scheduleExpiry();
    if (previous !== queue.inventory) notifyInventoryChange(queue.inventory, previous);
    return { settlement: outcome.settlement };
  }

  function cancelPending(requestId) {
    if (disposed) return { settlement: null, result: disposedResult };
    const outcome = cancelPendingReservation(queue, requestId);
    queue = outcome.queue;
    return { settlement: outcome.settlement };
  }

  function applyHoldAction(type, reservationId, buyerId) {
    if (disposed) return { result: disposedResult, state: queue.inventory };
    const changed = transitionInventory(queue.inventory,
      { type, reservationId, buyerId }, observedNow());
    setInventory(changed.state);
    return changed;
  }

  function dispose() {
    if (disposed) return false;
    disposed = true;
    clearExpiryTimer();
    inventoryListeners.clear();
    const cancelled = queue.pending.map((ticket) => Object.freeze({
      ...ticket,
      result: Object.freeze({ ok: false, code: "REQUEST_CANCELLED" }),
    }));
    queue = Object.freeze({
      ...queue,
      pending: Object.freeze([]),
      settled: Object.freeze([...queue.settled, ...cancelled]),
    });
    return true;
  }

  scheduleExpiry();
  return Object.freeze({
    enqueue, processNext, cancelPending, expireDue, subscribeInventory,
    checkout: (reservationId, buyerId) => applyHoldAction("CHECKOUT", reservationId, buyerId),
    cancelHold: (reservationId, buyerId) => applyHoldAction("CANCEL", reservationId, buyerId),
    dispose,
    get inventory() { return queue.inventory; },
    get queue() { return queue; },
    get disposed() { return disposed; },
  });
}
