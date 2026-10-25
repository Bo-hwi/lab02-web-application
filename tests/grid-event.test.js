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
const originalAdd = root.addEventListener.bind(root);
root.addEventListener = (...args) => {
  addCount += 1;
  return originalAdd(...args);
};
const handlers = {
  onAction: (action) => actions.push(action),
  onKeydown: (key) => keys.push(key),
};
const hub = setupGridEventHub(root, handlers);
const repeatedHub = setupGridEventHub(root, handlers);

check("Repeated setup reuses the same four delegated listeners",
  hub === repeatedHub && addCount === 4);
root.querySelector("#test-search").dispatchEvent(new Event("input", { bubbles: true }));
check("Input action is delegated with its current value",
  actions.length === 1 && actions[0].action === "query" && actions[0].value === "keyboard");
root.querySelector("[data-test-id='action'] span").dispatchEvent(
  new MouseEvent("click", { bubbles: true }),
);
check("Nested click target resolves its action control",
  actions.length === 2 && actions[1].action === "sort");
root.querySelector("[data-grid-action='ignored']").dispatchEvent(
  new MouseEvent("click", { bubbles: true }),
);
check("Disabled controls do not dispatch actions", actions.length === 2);
root.querySelector("#test-search").dispatchEvent(
  new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
);
check("Keyboard events reach the delegated keyboard handler",
  keys.length === 1 && keys[0].key === "Enter");
hub.dispose();
root.querySelector("#test-search").dispatchEvent(new Event("input", { bubbles: true }));
check("Disposal removes delegated listeners", actions.length === 2);

const passed = checks.filter((item) => item.passed).length;
document.getElementById("summary").textContent = `${passed}/${checks.length} checks passed`;
document.getElementById("results").textContent = checks
  .map((item) => `${item.passed ? "PASS" : "FAIL"}: ${item.name}`).join("\n");
console.table(checks);
