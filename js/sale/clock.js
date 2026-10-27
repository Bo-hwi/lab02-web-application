/**
 * A one-shot countdown tied to an absolute Unix-millisecond deadline.
 * Frame callbacks decide when to repaint; the clock decides how much time remains.
 */
export function createDeadlineCountdown({
  deadlineMs,
  onTick,
  clock = { now: () => Date.now() },
  frameScheduler = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  },
}) {
  if (!Number.isSafeInteger(deadlineMs)) {
    throw new TypeError("deadlineMs must be an integer Unix timestamp");
  }
  if (typeof onTick !== "function" || typeof clock?.now !== "function" ||
      typeof frameScheduler?.request !== "function" ||
      typeof frameScheduler?.cancel !== "function") {
    throw new TypeError("A tick callback, clock and frame scheduler are required");
  }

  let state = "idle";
  let pendingHandle = null;
  let generation = 0;

  function update() {
    if (state !== "running") return;

    const nowMs = clock.now();
    if (!Number.isSafeInteger(nowMs)) {
      stop();
      throw new TypeError("clock.now() must return an integer Unix timestamp");
    }

    const remainingMs = Math.max(0, deadlineMs - nowMs);
    if (remainingMs === 0) {
      state = "finished";
      onTick(0);
      return;
    }

    onTick(remainingMs);
    if (state !== "running") return;

    const scheduledGeneration = ++generation;
    pendingHandle = frameScheduler.request(() => {
      if (state !== "running" || scheduledGeneration !== generation) return;
      pendingHandle = null;
      update();
    });
  }

  function start() {
    if (state !== "idle") return false;
    state = "running";
    update();
    return true;
  }

  function stop() {
    if (state === "stopped") return;
    state = "stopped";
    generation += 1;
    if (pendingHandle !== null) {
      frameScheduler.cancel(pendingHandle);
      pendingHandle = null;
    }
  }

  return Object.freeze({
    start,
    stop,
    dispose: stop,
    get state() { return state; },
  });
}

/** Whole seconds and exactly three millisecond digits, clamped at zero. */
export function formatRemainingTime(remainingMs) {
  if (!Number.isSafeInteger(remainingMs)) {
    throw new TypeError("remainingMs must be an integer");
  }
  const safeMs = Math.max(0, remainingMs);
  const seconds = Math.floor(safeMs / 1000);
  const milliseconds = String(safeMs % 1000).padStart(3, "0");
  return seconds + "." + milliseconds;
}
