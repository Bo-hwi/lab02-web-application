/** Playback owns source nodes and its graph connections, never the supplied context. */
export class AudioPlayer {
  #context;
  #analyser;
  #source = null;
  #currentId = null;
  #generation = 0;
  #state = "idle";
  #listeners = new Set();

  constructor({ audioContext, analyserNode } = {}) {
    if (typeof audioContext?.createBufferSource !== "function" ||
        typeof audioContext?.resume !== "function" || !audioContext.destination) {
      throw new TypeError("audioContext must provide playback methods and destination");
    }
    if (typeof analyserNode?.connect !== "function" ||
        typeof analyserNode?.disconnect !== "function") {
      throw new TypeError("analyserNode must be an audio node");
    }
    this.#context = audioContext;
    this.#analyser = analyserNode;
    this.#analyser.connect(this.#context.destination);
  }

  get state() { return this.#state; }
  get currentId() { return this.#currentId; }

  subscribe(listener) {
    if (this.#state === "disposed") {
      throw new DOMException("Player has been disposed", "InvalidStateError");
    }
    if (typeof listener !== "function") throw new TypeError("listener must be a function");
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify() {
    for (const listener of [...this.#listeners]) {
      try { listener({ state: this.#state, currentId: this.#currentId }); }
      catch (error) { console.error("Audio player subscriber failed", error); }
    }
  }

  async play(id, buffer) {
    if (this.#state === "disposed") {
      throw new DOMException("Player has been disposed", "InvalidStateError");
    }
    if (id == null || id === "" || buffer == null) {
      throw new TypeError("play requires an ID and decoded AudioBuffer");
    }

    const generation = ++this.#generation;
    this.#stopSource();
    try {
      if (this.#context.state !== "running") await this.#context.resume();
    } catch (error) {
      if (generation !== this.#generation) {
        throw new DOMException("Playback request was superseded", "AbortError");
      }
      throw error;
    }
    if (generation !== this.#generation) {
      throw new DOMException("Playback request was superseded", "AbortError");
    }

    const source = this.#context.createBufferSource();
    try {
      source.buffer = buffer;
      source.connect(this.#analyser);
      this.#source = source;
      this.#currentId = id;
      this.#state = "playing";
      source.onended = () => {
        if (this.#source === source) this.#releaseSource(source);
      };
      source.start(0);
      this.#notify();
    } catch (error) {
      if (this.#source === source) this.#releaseSource(source);
      else { source.onended = null; source.disconnect(); }
      throw error;
    }
  }

  stop() {
    if (this.#state === "disposed") return;
    ++this.#generation;
    this.#stopSource();
  }

  dispose() {
    if (this.#state === "disposed") return;
    ++this.#generation;
    this.#stopSource();
    this.#analyser.disconnect(this.#context.destination);
    this.#state = "disposed";
    this.#listeners.clear();
  }

  #releaseSource(source) {
    source.onended = null;
    source.disconnect();
    this.#source = null;
    this.#currentId = null;
    this.#state = "idle";
    this.#notify();
  }

  #stopSource() {
    const source = this.#source;
    if (!source) return;
    // Detach before stop: an ended callback may run during or after it.
    this.#releaseSource(source);
    try {
      source.stop();
    } catch (error) {
      if (error?.name !== "InvalidStateError") throw error;
    }
  }
}
