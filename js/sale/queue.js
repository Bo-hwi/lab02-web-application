import { transitionInventory } from "./inventory.js";

/** A deterministic FIFO queue for reservation attempts in one JS runtime. */
function queueSnapshot(inventory, pending, settled, nextSequence) {
  return Object.freeze({
    inventory,
    pending: Object.freeze(pending),
    settled: Object.freeze(settled),
    nextSequence,
  });
}

function validRequestId(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

export function createReservationQueue(inventory) {
  if (!inventory || !Array.isArray(inventory.products) || !Array.isArray(inventory.reservations)) {
    throw new TypeError("An inventory state is required");
  }
  return queueSnapshot(inventory, [], [], 1);
}

/** Repeated valid IDs return their original ticket without adding another attempt. */
export function enqueueReservation(queue, request) {
  const requestId = request?.requestId;
  if (validRequestId(requestId)) {
    const prior = queue.pending.find((entry) => entry.requestId === requestId) ||
      queue.settled.find((entry) => entry.requestId === requestId);
    if (prior) return { queue, ticket: prior };
  }

  const ticket = Object.freeze({
    sequence: queue.nextSequence,
    requestId,
    buyerId: request?.buyerId,
    productId: request?.productId,
  });
  return {
    queue: queueSnapshot(queue.inventory, [...queue.pending, ticket], queue.settled,
      queue.nextSequence + 1),
    ticket,
  };
}

/** Cancellation only affects an attempt that has not yet reached the inventory machine. */
export function cancelPendingReservation(queue, requestId) {
  const pending = queue.pending.find((entry) => entry.requestId === requestId);
  if (!pending || !validRequestId(requestId)) {
    const prior = queue.settled.find((entry) => entry.requestId === requestId);
    return { queue, settlement: prior || Object.freeze({
      requestId, result: Object.freeze({ ok: false, code: "UNKNOWN_REQUEST" }),
    }) };
  }
  const settlement = Object.freeze({ ...pending,
    result: Object.freeze({ ok: false, code: "REQUEST_CANCELLED" }) });
  return {
    queue: queueSnapshot(queue.inventory, queue.pending.filter((entry) => entry !== pending),
      [...queue.settled, settlement], queue.nextSequence),
    settlement,
  };
}

/** The caller supplies the observed clock time for this one serial transition. */
export function processNextReservation(queue, nowMs) {
  if (queue.pending.length === 0) return { queue, settlement: null };
  const [next, ...remaining] = queue.pending;
  const { state, result } = transitionInventory(queue.inventory, {
    type: "RESERVE",
    requestId: next.requestId,
    buyerId: next.buyerId,
    productId: next.productId,
  }, nowMs);
  const settlement = Object.freeze({ ...next, result });
  return {
    queue: queueSnapshot(state, remaining, [...queue.settled, settlement], queue.nextSequence),
    settlement,
  };
}

/** now() is sampled separately for each pending request. */
export function drainReservationQueue(queue, now) {
  if (typeof now !== "function") throw new TypeError("A clock function is required");
  const settlements = [];
  let current = queue;
  while (current.pending.length > 0) {
    const next = processNextReservation(current, now());
    current = next.queue;
    settlements.push(next.settlement);
  }
  return { queue: current, settlements: Object.freeze(settlements) };
}