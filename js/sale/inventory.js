/** Pure inventory transitions for one in-memory flash sale. */
const HOLD_MS = 30000;

function validId(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function snapshot(products, saleEndsAtMs, reservations = [], requestResults = [], nextReservationNumber = 1) {
  return Object.freeze({
    products,
    saleEndsAtMs,
    reservations: Object.freeze(reservations.map((hold) => Object.freeze(hold))),
    requestResults: Object.freeze(requestResults.map((entry) => Object.freeze(entry))),
    nextReservationNumber,
  });
}

export function createInventoryState({ products, saleEndsAtMs }) {
  if (!Array.isArray(products) || !Number.isSafeInteger(saleEndsAtMs)) {
    throw new TypeError("Products and an integer sale deadline are required");
  }
  const ids = new Set();
  const copy = products.map((product) => {
    if (!validId(product?.id) || ids.has(product.id) ||
        !Number.isSafeInteger(product.initialStock) || product.initialStock < 0) {
      throw new TypeError("Products need unique IDs and nonnegative integer stock");
    }
    ids.add(product.id);
    return Object.freeze({ ...product });
  });
  return snapshot(Object.freeze(copy), saleEndsAtMs);
}

export function getAvailableStock(state, productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return null;
  const committed = state.reservations.filter((hold) => hold.productId === productId &&
    (hold.status === "RESERVED" || hold.status === "CHECKED_OUT")).length;
  return product.initialStock - committed;
}

function expireDue(state, nowMs) {
  const due = state.reservations.filter((hold) =>
    hold.status === "RESERVED" && nowMs >= hold.expiresAtMs).map((hold) => hold.id);
  if (due.length === 0) return { state, due };
  const dueSet = new Set(due);
  const reservations = state.reservations.map((hold) =>
    dueSet.has(hold.id) ? { ...hold, status: "EXPIRED" } : hold);
  return {
    state: snapshot(state.products, state.saleEndsAtMs, reservations,
      state.requestResults, state.nextReservationNumber),
    due,
  };
}

function reject(state, code) {
  return { state, result: Object.freeze({ ok: false, code }) };
}

function recordRequest(state, requestId, result) {
  return snapshot(state.products, state.saleEndsAtMs, state.reservations,
    [...state.requestResults, { requestId, result }], state.nextReservationNumber);
}

function replaceHold(state, holdId, status) {
  const reservations = state.reservations.map((hold) =>
    hold.id === holdId ? { ...hold, status } : hold);
  return snapshot(state.products, state.saleEndsAtMs, reservations,
    state.requestResults, state.nextReservationNumber);
}

/** The caller supplies observed Unix milliseconds; no wall clock is read here. */
export function transitionInventory(previousState, event, nowMs) {
  if (!Number.isSafeInteger(nowMs)) {
    throw new TypeError("nowMs must be an integer Unix timestamp");
  }
  const { state, due } = expireDue(previousState, nowMs);
  if (!event || typeof event !== "object") return reject(state, "INVALID_EVENT");

  if (event.type === "EXPIRE") {
    return { state, result: Object.freeze({ ok: true, code: "EXPIRED_DUE", reservationIds: Object.freeze(due) }) };
  }

  if (event.type === "RESERVE") {
    if (!validId(event.requestId)) return reject(state, "INVALID_REQUEST");
    const prior = state.requestResults.find((entry) => entry.requestId === event.requestId);
    if (prior) return { state, result: prior.result };

    let result;
    if (!validId(event.buyerId) || !validId(event.productId) ||
        !state.products.some((product) => product.id === event.productId)) {
      result = { ok: false, code: "INVALID_REQUEST" };
    } else {
      const existing = state.reservations.find((hold) => hold.status === "RESERVED" &&
        hold.buyerId === event.buyerId && hold.productId === event.productId);
      if (existing) {
        result = { ok: true, code: "EXISTING_HOLD", reservationId: existing.id };
      } else if (nowMs >= state.saleEndsAtMs) {
        result = { ok: false, code: "SALE_CLOSED" };
      } else if (getAvailableStock(state, event.productId) === 0) {
        result = { ok: false, code: "SOLD_OUT" };
      } else {
        const id = "HOLD-" + String(state.nextReservationNumber).padStart(6, "0");
        const hold = { id, buyerId: event.buyerId, productId: event.productId,
          acceptedAtMs: nowMs, expiresAtMs: nowMs + HOLD_MS, status: "RESERVED" };
        const result = Object.freeze({ ok: true, code: "RESERVED", reservationId: id });
        const next = snapshot(state.products, state.saleEndsAtMs,
          [...state.reservations, hold], [...state.requestResults, { requestId: event.requestId, result }],
          state.nextReservationNumber + 1);
        return { state: next, result };
      }
    }
    const frozenResult = Object.freeze(result);
    return { state: recordRequest(state, event.requestId, frozenResult), result: frozenResult };
  }

  if (event.type === "CHECKOUT" || event.type === "CANCEL") {
    if (!validId(event.reservationId) || !validId(event.buyerId)) {
      return reject(state, "INVALID_REQUEST");
    }
    const hold = state.reservations.find((item) => item.id === event.reservationId);
    if (!hold) return reject(state, "UNKNOWN_RESERVATION");
    if (hold.buyerId !== event.buyerId) return reject(state, "NOT_HOLD_OWNER");
    if (hold.status === "EXPIRED") return reject(state, "HOLD_EXPIRED");
    if (hold.status !== "RESERVED") return reject(state, "ALREADY_SETTLED");
    const status = event.type === "CHECKOUT" ? "CHECKED_OUT" : "CANCELLED";
    const next = replaceHold(state, hold.id, status);
    return { state: next, result: Object.freeze({ ok: true, code: status, reservationId: hold.id }) };
  }

  return reject(state, "INVALID_EVENT");
}
