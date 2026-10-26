/**
 * Bounded FIFO scheduling with cancellation and explicit ownership cleanup.
 * Subscription/UI integration belongs to T08; the loader is supplied by callers.
 */
export class AudioTaskQueue {
  #load;
  #concurrency;
  #baseUrl;
  #entries = [];
  #pending = [];
  #nextId = 1;
  #active = 0;
  #drainScheduled = false;
  #disposed = false;

  constructor({ load, concurrency = 2, baseUrl = globalThis.location?.href } = {}) {
    if (typeof load !== "function") {
      throw new TypeError("load must be a function");
    }
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new RangeError("concurrency must be a positive integer");
    }
    this.#load = load;
    this.#concurrency = concurrency;
    this.#baseUrl = baseUrl;
  }

  /** Returns a stable task ID and a promise; callers must handle rejection. */
  enqueue(url) {
    if (this.#disposed) {
      throw new DOMException("The audio queue is disposed", "InvalidStateError");
    }
    const normalizedUrl = this.#normalizeUrl(url);
    let resolve;
    let reject;
    const promise = new Promise((resolveTask, rejectTask) => {
      resolve = resolveTask;
      reject = rejectTask;
    });
    const entry = {
      id: `audio-${this.#nextId++}`,
      url: normalizedUrl,
      state: "pending",
      controller: new AbortController(),
      resolve,
      reject,
      settled: false,
      buffer: undefined,
      error: undefined,
    };
    this.#entries.push(entry);
    this.#pending.push(entry);
    this.#scheduleDrain();
    return { id: entry.id, promise };
  }

  /** Public cancellation is immediate; the loader retains its slot until settled. */
  cancel(id) {
    const entry = this.#entries.find((item) => item.id === id);
    if (!entry || entry.settled) return false;
    this.#pending = this.#pending.filter((item) => item !== entry);
    this.#cancelEntry(entry);
    return true;
  }

  /** The application must stop playback before removing a playing ready entry. */
  remove(id) {
    const index = this.#entries.findIndex((item) => item.id === id);
    if (index < 0 || !this.#entries[index].settled) return false;
    const [entry] = this.#entries.splice(index, 1);
    entry.buffer = undefined;
    entry.controller = undefined;
    return true;
  }

  /** Stops scheduling without pretending that non-abortable decoding has stopped. */
  dispose() {
    if (this.#disposed) return;
    this.#disposed = true;
    const entries = this.#entries;
    this.#entries = [];
    this.#pending = [];
    // Active invocations have already captured their loader; release queue ownership.
    this.#load = undefined;
    for (const entry of entries) {
      if (!entry.settled) this.#cancelEntry(entry);
      entry.buffer = undefined;
      entry.controller = undefined;
    }
  }

  #cancelEntry(entry) {
    const controller = entry.controller;
    const error = new DOMException("Audio task was cancelled", "AbortError");
    // Commit terminal state before dispatching abort events, which can re-enter us.
    this.#settle(entry, "cancelled", error);
    controller.abort();
  }

  /** Detached metadata: no buffers, controllers, promises or mutable entries. */
  getSnapshot() {
    return this.#entries.map(({ id, url, state, error }) => ({
      id,
      url,
      state,
      error: error ? { ...error } : null,
    }));
  }

  #normalizeUrl(value) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new TypeError("A non-empty HTTP(S) audio URL is required");
    }
    const url = new URL(value.trim(), this.#baseUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new TypeError("Audio URLs must use HTTP(S) without credentials");
    }
    return url.href;
  }

  #scheduleDrain() {
    if (this.#disposed || this.#drainScheduled) return;
    this.#drainScheduled = true;
    // Defer loader invocation so enqueue always returns before user code runs.
    queueMicrotask(() => {
      this.#drainScheduled = false;
      while (!this.#disposed && this.#active < this.#concurrency && this.#pending.length > 0) {
        const entry = this.#pending.shift();
        this.#active += 1;
        entry.state = "downloading";
        void this.#run(entry);
      }
    });
  }

  async #run(entry) {
    try {
      const buffer = await this.#load(entry.url, {
        signal: entry.controller.signal,
        onPhase: (phase) => {
          if (!entry.settled && phase === "decoding" && entry.state === "downloading") {
            entry.state = "decoding";
          }
        },
      });
      // Cancellation/removal/disposal may have happened while awaiting the loader.
      if (entry.settled) return;
      if (entry.state !== "decoding") {
        throw new TypeError("The loader must report decoding before resolving");
      }
      this.#settle(entry, "ready", buffer);
    } catch (error) {
      this.#settle(entry, "failed", error);
    } finally {
      entry.controller = undefined;
      this.#active -= 1;
      this.#scheduleDrain();
    }
  }

  #settle(entry, state, value) {
    if (entry.settled) return;
    entry.settled = true;
    entry.state = state;
    const callback = state === "ready" ? entry.resolve : entry.reject;
    entry.resolve = undefined;
    entry.reject = undefined;
    entry.controller = undefined;
    if (state === "ready") {
      entry.buffer = value;
    } else {
      entry.error = {
        name: value instanceof Error ? value.name : "Error",
        message: value instanceof Error ? value.message : String(value),
      };
    }
    callback(value);
  }
}
