const hubs = new WeakMap();
const delegatedTypes = ["click", "input", "change", "keydown", "focusin"];

/** Install one delegated listener per supported event on a stable root. */
export function setupGridEventHub(root, { onAction, onKeydown, onFocusin } = {}) {
  if (!(root instanceof Element)) {
    throw new TypeError("A DOM Element is required as the event root.");
  }

  const existingHub = hubs.get(root);
  if (existingHub) return existingHub;

  const listeners = new Map();
  const hub = {
    dispose() {
      for (const [type, listener] of listeners) {
        root.removeEventListener(type, listener);
      }
      listeners.clear();
      hubs.delete(root);
    },
  };

  const actionEvents = new Set(["click", "input", "change"]);
  for (const type of delegatedTypes) {
    const listener = (event) => {
      if (type === "keydown") {
        onKeydown?.({ key: event.key, target: event.target, event });
        return;
      }

      if (type === "focusin") {
        onFocusin?.({ target: event.target, event });
        return;
      }

      if (!actionEvents.has(type) || !(event.target instanceof Element)) return;
      const control = event.target.closest("[data-grid-action]");
      if (!control || !root.contains(control) || control.disabled) return;
      if (control instanceof HTMLInputElement && control.type === "checkbox" && type !== "change") return;

      onAction?.({
        action: control.dataset.gridAction,
        value: "value" in control ? control.value : undefined,
        checked: control instanceof HTMLInputElement && control.type === "checkbox"
          ? control.checked
          : undefined,
        event,
      });
    };

    root.addEventListener(type, listener);
    listeners.set(type, listener);
  }

  hubs.set(root, hub);
  return hub;
}
