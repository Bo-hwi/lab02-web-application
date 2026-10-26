/** Draws analyser frequency bins without owning the audio graph or context. */
export class FrequencyVisualizer {
  #canvas;
  #context;
  #analyser;
  #window;
  #frequencyData;
  #observer = null;
  #onResize;
  #frameId = null;
  #generation = 0;
  #width = 0;
  #height = 0;
  #ratio = 0;
  #state = "idle";

  constructor({ canvas, analyserNode, windowObject = globalThis } = {}) {
    const context = canvas?.getContext?.("2d");
    if (!context || typeof canvas.getBoundingClientRect !== "function") {
      throw new TypeError("canvas must provide a 2D context and display bounds");
    }
    if (typeof analyserNode?.getByteFrequencyData !== "function") {
      throw new TypeError("analyserNode must provide frequency data");
    }
    if (typeof windowObject.requestAnimationFrame !== "function" ||
        typeof windowObject.cancelAnimationFrame !== "function") {
      throw new TypeError("requestAnimationFrame and cancelAnimationFrame are required");
    }

    this.#canvas = canvas;
    this.#context = context;
    this.#analyser = analyserNode;
    this.#window = windowObject;
    this.#analyser.fftSize = 512;
    this.#frequencyData = new Uint8Array(this.#analyser.frequencyBinCount);
    this.#onResize = () => this.resize();

    if (typeof windowObject.ResizeObserver === "function") {
      this.#observer = new windowObject.ResizeObserver(this.#onResize);
      this.#observer.observe(canvas);
    } else if (typeof windowObject.addEventListener === "function") {
      windowObject.addEventListener("resize", this.#onResize);
    }
    this.resize();
  }

  get state() { return this.#state; }

  /** Reconfigure the backing bitmap only when the display size or DPR changes. */
  resize() {
    if (this.#state === "disposed") return;
    const bounds = this.#canvas.getBoundingClientRect();
    const width = Math.max(0, bounds.width);
    const height = Math.max(0, bounds.height);
    const ratio = Number.isFinite(this.#window.devicePixelRatio) &&
      this.#window.devicePixelRatio > 0 ? this.#window.devicePixelRatio : 1;
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    this.#width = width;
    this.#height = height;
    const bitmapChanged = this.#canvas.width !== pixelWidth || this.#canvas.height !== pixelHeight;
    if (bitmapChanged) {
      this.#canvas.width = pixelWidth;
      this.#canvas.height = pixelHeight;
    }
    if (bitmapChanged || this.#ratio !== ratio) {
      this.#context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    this.#ratio = ratio;
  }

  /** Called by the application after playback has started. */
  start() {
    if (this.#state === "disposed") {
      throw new DOMException("Visualizer has been disposed", "InvalidStateError");
    }
    if (this.#state === "running") return false;
    this.#state = "running";
    const generation = ++this.#generation;
    this.resize();
    this.#schedule(generation);
    return true;
  }

  /** Called on playback stop, natural end or failure. */
  stop() {
    if (this.#state !== "running") return false;
    this.#state = "idle";
    ++this.#generation;
    if (this.#frameId !== null) {
      this.#window.cancelAnimationFrame(this.#frameId);
      this.#frameId = null;
    }
    this.#context.clearRect(0, 0, this.#width, this.#height);
    return true;
  }

  dispose() {
    if (this.#state === "disposed") return;
    this.stop();
    this.#observer?.disconnect();
    if (!this.#observer && typeof this.#window.removeEventListener === "function") {
      this.#window.removeEventListener("resize", this.#onResize);
    }
    this.#state = "disposed";
  }

  #schedule(generation) {
    this.#frameId = this.#window.requestAnimationFrame(() => {
      if (this.#state !== "running" || generation !== this.#generation) return;
      this.#frameId = null;
      this.resize();
      if (this.#analyser.frequencyBinCount !== this.#frequencyData.length) {
        this.#frequencyData = new Uint8Array(this.#analyser.frequencyBinCount);
      }
      this.#analyser.getByteFrequencyData(this.#frequencyData);
      this.#context.clearRect(0, 0, this.#width, this.#height);
      if (this.#width > 0 && this.#height > 0) {
        const barWidth = this.#width / this.#frequencyData.length;
        this.#context.fillStyle = "#167a45";
        for (let index = 0; index < this.#frequencyData.length; index += 1) {
          const barHeight = this.#height * this.#frequencyData[index] / 255;
          if (barHeight > 0) {
            this.#context.fillRect(index * barWidth, this.#height - barHeight,
              Math.max(1, barWidth - 1), barHeight);
          }
        }
      }
      if (this.#state === "running" && generation === this.#generation) {
        this.#schedule(generation);
      }
    });
  }
}
