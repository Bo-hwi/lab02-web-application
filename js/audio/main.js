import { AudioTaskQueue } from "./queue.js";
import { createAudioLoader } from "./loader.js";
import { AudioPlayer } from "./player.js";
import { FrequencyVisualizer } from "./visualizer.js";

const LABELS = {
  pending: "Waiting",
  downloading: "Downloading",
  decoding: "Decoding",
  ready: "Ready",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** The page owns the context, queue, player, visualizer and decoded buffers. */
export function mountAudioQueueApp({
  documentObject = globalThis.document,
  windowObject = globalThis,
  contextFactory = () => new windowObject.AudioContext(),
} = {}) {
  const form = documentObject.getElementById("enqueue-form");
  const urlInput = documentObject.getElementById("audio-url");
  const list = documentObject.getElementById("queue-list");
  const empty = documentObject.getElementById("queue-empty");
  const status = documentObject.getElementById("announcements");
  const stopButton = documentObject.getElementById("stop-playback");
  const canvas = documentObject.getElementById("frequency-canvas");
  if (![form, urlInput, list, empty, status, stopButton, canvas].every(Boolean)) {
    throw new Error("Audio queue page is missing a required element");
  }

  let context;
  let queue;
  let player;
  let visualizer;
  let unsubscribeQueue;
  let unsubscribePlayer;
  let disposed = false;
  const buffers = new Map();
  const previousStates = new Map();

  function announce(message) { status.textContent = message; }

  function ensureEngine() {
    if (queue) return;
    if (typeof windowObject.AudioContext !== "function") {
      throw new Error("This browser does not support Web Audio");
    }
    try {
      context = contextFactory();
      const analyser = context.createAnalyser();
      player = new AudioPlayer({ audioContext: context, analyserNode: analyser });
      visualizer = new FrequencyVisualizer({ canvas, analyserNode: analyser, windowObject });
      queue = new AudioTaskQueue({
        load: createAudioLoader({ audioContext: context }),
        baseUrl: documentObject.baseURI,
      });
      unsubscribeQueue = queue.subscribe(onQueueChange);
      unsubscribePlayer = player.subscribe(onPlayerChange);
    } catch (error) {
      queue?.dispose();
      visualizer?.dispose();
      player?.dispose();
      void context?.close().catch(() => {});
      queue = undefined;
      player = undefined;
      visualizer = undefined;
      context = undefined;
      throw error;
    }
  }

  function button(action, id, label) {
    const control = documentObject.createElement("button");
    control.type = "button";
    control.dataset.action = action;
    control.dataset.id = id;
    control.textContent = label;
    return control;
  }

  function render() {
    const active = documentObject.activeElement;
    const focusWasInList = list.contains(active);
    const focusId = focusWasInList ? active.dataset.id : null;
    const focusAction = focusWasInList ? active.dataset.action : null;
    const entries = queue?.getSnapshot() ?? [];
    const fragment = documentObject.createDocumentFragment();
    for (const entry of entries) {
      const row = documentObject.createElement("li");
      row.className = "task";
      row.dataset.id = entry.id;
      const identity = documentObject.createElement("p");
      identity.className = "task-id";
      identity.textContent = entry.id;
      const url = documentObject.createElement("p");
      url.textContent = entry.url;
      const state = documentObject.createElement("p");
      state.className = "task-state";
      state.textContent = LABELS[entry.state] ?? entry.state;
      const error = documentObject.createElement("p");
      error.className = "task-error";
      if (entry.error) error.textContent = entry.error.message;
      const actions = documentObject.createElement("div");
      actions.className = "task-actions";
      if (["pending", "downloading", "decoding"].includes(entry.state)) {
        actions.append(button("cancel", entry.id, "Cancel " + entry.id));
      }
      if (entry.state === "ready") {
        actions.append(button("play", entry.id, "Play " + entry.id));
        if (player.currentId === entry.id) {
          actions.append(button("stop", entry.id, "Stop " + entry.id));
        }
      }
      if (["ready", "failed", "cancelled"].includes(entry.state)) {
        actions.append(button("remove", entry.id, "Remove " + entry.id));
      }
      row.append(identity, url, state, error, actions);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    empty.hidden = entries.length > 0;
    stopButton.disabled = player?.state !== "playing";
    if (focusWasInList) {
      const row = [...list.children].find((item) => item.dataset.id === focusId);
      const replacement = [...(row?.querySelectorAll("button") ?? [])]
        .find((item) => item.dataset.action === focusAction) ??
        row?.querySelector("button");
      (replacement ?? (stopButton.disabled ? urlInput : stopButton)).focus();
    }
  }

  function onQueueChange(snapshot) {
    for (const entry of snapshot) {
      if (previousStates.get(entry.id) !== entry.state) {
        previousStates.set(entry.id, entry.state);
        announce(entry.id + ": " + (LABELS[entry.state] ?? entry.state) +
          (entry.error ? ". " + entry.error.message : ""));
      }
    }
    for (const id of [...previousStates.keys()]) {
      if (!snapshot.some((entry) => entry.id === id)) previousStates.delete(id);
    }
    render();
  }

  function onPlayerChange({ state, currentId }) {
    if (state === "playing") {
      visualizer.start();
      announce("Playing " + currentId);
    } else {
      visualizer.stop();
      announce("Playback stopped.");
    }
    render();
  }

  function onSubmit(event) {
    event.preventDefault();
    if (disposed) return;
    try {
      ensureEngine(); // AudioContext is created inside a user gesture.
      const { id, promise } = queue.enqueue(urlInput.value);
      promise.then((buffer) => {
        if (!disposed) buffers.set(id, buffer);
      }).catch(() => {
        // The queue reports the failure and its reason through the live region.
      });
    } catch (error) {
      announce(error.message);
    }
  }

  function onListClick(event) {
    if (disposed) return;
    const control = event.target.closest("button[data-action][data-id]");
    if (!control || !list.contains(control)) return;
    const { action, id } = control.dataset;
    if (action === "cancel") queue.cancel(id);
    if (action === "stop") player.stop();
    if (action === "remove") {
      if (player.currentId === id) player.stop();
      buffers.delete(id);
      if (queue.remove(id)) announce("Removed " + id);
    }
    if (action === "play") {
      const buffer = buffers.get(id);
      if (!buffer) { announce(id + " is not ready for playback."); return; }
      void player.play(id, buffer).catch((error) => {
        if (error.name !== "AbortError") announce("Playback failed: " + error.message);
      });
    }
  }

  function onStop() { player?.stop(); }
  function dispose() {
    if (disposed) return;
    disposed = true;
    form.removeEventListener("submit", onSubmit);
    list.removeEventListener("click", onListClick);
    stopButton.removeEventListener("click", onStop);
    windowObject.removeEventListener("pagehide", dispose);
    unsubscribeQueue?.();
    unsubscribePlayer?.();
    queue?.dispose();
    player?.dispose();
    visualizer?.dispose();
    buffers.clear();
    if (context) void context.close().catch((error) => {
      console.error("Closing the audio context failed", error);
    });
  }

  form.addEventListener("submit", onSubmit);
  list.addEventListener("click", onListClick);
  stopButton.addEventListener("click", onStop);
  windowObject.addEventListener("pagehide", dispose);
  render();
  return { dispose };
}

if (typeof document !== "undefined" && document.getElementById("enqueue-form")) {
  mountAudioQueueApp();
}
