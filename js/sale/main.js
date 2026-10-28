import { flashSaleProducts } from "./products.js";
import { createInventoryState, getAvailableStock } from "./inventory.js";
import { createSaleController } from "./controller.js";
import { createDeadlineCountdown } from "./clock.js";

const BUYER_ID = "local-buyer";
const SALE_DURATION_MS = 5 * 60 * 1000;
let saleEndsAtMs;
let controller;
let timer;
let unsubscribeInventory;
const list = document.getElementById("product-list");
const feedback = document.getElementById("sale-feedback");
const countdown = document.getElementById("sale-countdown");
const saleAnnouncement = document.getElementById("sale-announcement");
const resetButton = document.getElementById("reset-sale");
const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency", currency: "VND", maximumFractionDigits: 0,
});
let nextRequest = 1;
let lastShownSeconds = null;

function secondsRemaining(deadlineMs) {
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}

function setFeedback(message, kind = "info", moveFocus = false) {
  feedback.textContent = message;
  feedback.dataset.kind = kind;
  if (moveFocus) feedback.focus();
}

function currentHold(productId) {
  return controller.inventory.reservations.find((hold) =>
    hold.productId === productId && hold.buyerId === BUYER_ID && hold.status === "RESERVED");
}

function actionButton(label, action, productId, disabled = false, secondary = false) {
  const button = element("button", secondary ? "secondary" : "", label);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.productId = productId;
  button.disabled = disabled;
  return button;
}

function renderProducts() {
  const active = list.contains(document.activeElement) ? document.activeElement : null;
  const focusedAction = active?.dataset.action;
  const focusedProductId = active?.dataset.productId;
  const closed = Date.now() >= saleEndsAtMs;
  const cards = flashSaleProducts.map((product) => {
    const card = element("li", "product");
    const title = element("h3", "", product.name);
    const id = element("p", "", "Product ID: " + product.id);
    const price = element("p", "price", priceFormatter.format(product.priceVnd));
    const available = getAvailableStock(controller.inventory, product.id);
    const stock = element("p", "", "Available stock: " + available);
    const hold = currentHold(product.id);
    const state = element("p", "", hold
      ? "Your hold " + hold.id + " is active. " + secondsRemaining(hold.expiresAtMs) + " seconds remain."
      : available === 0 ? "Sold out." : closed ? "Sale closed." : "Ready to reserve.");
    if (hold) state.dataset.holdId = hold.id;
    const actions = element("div", "actions");
    if (hold) {
      actions.append(
        actionButton("Checkout " + product.name, "checkout", product.id),
        actionButton("Cancel hold for " + product.name, "cancel", product.id, false, true),
      );
    } else {
      actions.append(actionButton("Reserve " + product.name, "reserve", product.id,
        closed || available === 0));
    }
    card.append(title, id, price, stock, state, actions);
    return card;
  });
  list.replaceChildren(...cards);
  if (focusedAction && focusedProductId) {
    const replacement = [...list.querySelectorAll("button[data-action]")].find((button) =>
      button.dataset.action === focusedAction && button.dataset.productId === focusedProductId);
    if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
    else feedback.focus({ preventScroll: true });
  }
}

function updateHoldCountdowns() {
  for (const node of list.querySelectorAll("[data-hold-id]")) {
    const hold = controller.inventory.reservations.find((item) => item.id === node.dataset.holdId);
    if (hold?.status === "RESERVED") {
      const message = "Your hold " + hold.id + " is active. " +
        secondsRemaining(hold.expiresAtMs) + " seconds remain.";
      if (node.textContent !== message) node.textContent = message;
    }
  }
}

const messages = {
  RESERVED: "Product reserved. Complete checkout before your hold expires.",
  EXISTING_HOLD: "You already have an active hold for this product.",
  CHECKED_OUT: "Checkout complete. No payment was taken in this demo.",
  CANCELLED: "Hold cancelled. Stock is available again.",
  SOLD_OUT: "This product is sold out.",
  SALE_CLOSED: "The sale has ended. New reservations are closed.",
  HOLD_EXPIRED: "Your hold expired. The product is available again.",
};

function handleAction(action, productId) {
  if (!controller) return;
  const product = flashSaleProducts.find((item) => item.id === productId);
  if (!product) return;
  let result;
  if (action === "reserve") {
    controller.enqueue({
      requestId: "web-" + nextRequest++,
      buyerId: BUYER_ID,
      productId,
    });
    result = controller.processNext().settlement?.result;
  } else {
    const hold = currentHold(productId);
    if (!hold) {
      setFeedback("No active hold for " + product.name + ".", "error", true);
      return;
    }
    result = action === "checkout"
      ? controller.checkout(hold.id, BUYER_ID).result
      : action === "cancel" ? controller.cancelHold(hold.id, BUYER_ID).result : null;
  }
  if (!result) return;
  setFeedback(product.name + ": " + (messages[result.code] || result.code),
    result.ok ? "success" : "error", true);
}

function onInventoryChange(current, previous) {
  renderProducts();
  const expired = current.reservations.find((hold) => hold.buyerId === BUYER_ID &&
    hold.status === "EXPIRED" && previous.reservations.some((prior) =>
      prior.id === hold.id && prior.status === "RESERVED"));
  if (expired) setFeedback("Your hold " + expired.id + " expired. Stock is available again.", "error");
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || !list.contains(button) || button.disabled) return;
  handleAction(button.dataset.action, button.dataset.productId);
});

function disposeSession() {
  timer?.dispose();
  unsubscribeInventory?.();
  controller?.dispose();
  timer = null;
  unsubscribeInventory = null;
  controller = null;
}

function startSession() {
  disposeSession();
  saleEndsAtMs = Date.now() + SALE_DURATION_MS;
  controller = createSaleController({
    inventory: createInventoryState({ products: flashSaleProducts, saleEndsAtMs }),
  });
  nextRequest = 1;
  lastShownSeconds = null;
  unsubscribeInventory = controller.subscribeInventory(onInventoryChange);
  timer = createDeadlineCountdown({
    deadlineMs: saleEndsAtMs,
    onTick(remainingMs) {
      const totalSeconds = Math.ceil(remainingMs / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      const display = minutes + ":" + seconds;
      if (countdown.textContent !== display) {
        countdown.textContent = display;
        if (controller.inventory.reservations.some((hold) =>
          hold.status === "RESERVED" && hold.expiresAtMs <= Date.now())) controller.expireDue();
        updateHoldCountdowns();
      }
      if (lastShownSeconds !== null && totalSeconds < lastShownSeconds &&
          totalSeconds > 0 && (totalSeconds % 10 === 0 || totalSeconds <= 5)) {
        saleAnnouncement.textContent = "Sale ends in " + totalSeconds + " seconds.";
      }
      lastShownSeconds = totalSeconds;
      if (remainingMs === 0) {
        renderProducts();
        saleAnnouncement.textContent = "The sale has ended. Existing valid holds may still be checked out.";
      }
    },
  });
  renderProducts();
  timer.start();
}

resetButton.addEventListener("click", () => {
  startSession();
  setFeedback("Sale reset. Stock and holds have returned to their starting state.");
  saleAnnouncement.textContent = "A new five-minute sale has started.";
});
window.addEventListener("pagehide", disposeSession);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) startSession();
});
startSession();
