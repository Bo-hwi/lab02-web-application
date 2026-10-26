import { setupGridEventHub } from "../js/grid/events.js";

const checks = [];
const check = (name, passed) => {
  checks.push({ name, passed: Boolean(passed) });
  console.assert(passed, name);
};

const root = document.getElementById("test-root");
const actions = [];
const keys = [];
let addCount = 0;
let focusinCount = 0;
const originalAdd = root.addEventListener.bind(root);
root.addEventListener = (...args) => {
  addCount += 1;
  return originalAdd(...args);
};
const handlers = {
  onAction: (action) => actions.push(action),
  onKeydown: (key) => keys.push(key),
  onFocusin: () => focusinCount += 1,
};
const hub = setupGridEventHub(root, handlers);
const repeatedHub = setupGridEventHub(root, handlers);

check("Repeated setup reuses the same five delegated listeners",
  hub === repeatedHub && addCount === 5);
root.querySelector("#test-search").dispatchEvent(new Event("input", { bubbles: true }));
check("Input action is delegated with its current value",
  actions.length === 1 && actions[0].action === "query" && actions[0].value === "keyboard");
const checkbox = root.querySelector("#test-checkbox");
checkbox.dispatchEvent(new Event("input", { bubbles: true }));
checkbox.dispatchEvent(new Event("click", { bubbles: true }));
checkbox.checked = true;
checkbox.dispatchEvent(new Event("change", { bubbles: true }));
check("A checkbox dispatches one selection action on change only",
  actions.length === 2 && actions[1].action === "row-selection" &&
  actions[1].checked === true && actions[1].event.target.dataset.productId === "SP001");
root.querySelector("[data-test-id='action'] span").dispatchEvent(
  new MouseEvent("click", { bubbles: true }),
);
check("Nested click target resolves its action control",
  actions.length === 3 && actions[2].action === "sort");
root.querySelector("[data-grid-action='ignored']").dispatchEvent(
  new MouseEvent("click", { bubbles: true }),
);
check("Disabled controls do not dispatch actions", actions.length === 3);
root.querySelector("#test-search").dispatchEvent(
  new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
);
check("Keyboard events reach the delegated keyboard handler",
  keys.length === 1 && keys[0].key === "Enter");
root.querySelector("#test-search").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
check("Focus events reach the delegated focus handler", focusinCount === 1);
hub.dispose();
root.querySelector("#test-search").dispatchEvent(new Event("input", { bubbles: true }));
check("Disposal removes delegated listeners", actions.length === 3 && focusinCount === 1);

const passed = checks.filter((item) => item.passed).length;
document.getElementById("summary").textContent = `${passed}/${checks.length} checks passed`;
document.getElementById("results").textContent = checks
  .map((item) => `${item.passed ? "PASS" : "FAIL"}: ${item.name}`).join("\n");
console.table(checks);
