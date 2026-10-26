import test from "node:test";
import assert from "node:assert/strict";
import { FrequencyVisualizer } from "../js/audio/visualizer.js";

function fixture() {
  const calls = { clear: [], fill: [], transforms: [], buffers: [], cancelled: [], observed: 0, disconnected: 0 };
  const pending = new Map();
  let nextId = 1;
  let width = 200;
  let height = 100;
  const context = {
    setTransform(...args) { calls.transforms.push(args); },
    clearRect(...args) { calls.clear.push(args); },
    fillRect(...args) { calls.fill.push(args); },
  };
  const canvas = {
    width: 0, height: 0,
    getContext(kind) { return kind === "2d" ? context : null; },
    getBoundingClientRect() { return { width, height }; },
  };
  const analyser = {
    frequencyBinCount: 256, fftSize: 0, level: 0,
    getByteFrequencyData(buffer) { calls.buffers.push(buffer); buffer.fill(this.level); },
  };
  const windowObject = {
    devicePixelRatio: 2,
    requestAnimationFrame(callback) { const id = nextId++; pending.set(id, callback); return id; },
    cancelAnimationFrame(id) { calls.cancelled.push(id); pending.delete(id); },
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; }
      observe(target) { assert.equal(target, canvas); calls.observed += 1; }
      disconnect() { calls.disconnected += 1; }
    },
  };
  const frame = () => {
    const [id, callback] = pending.entries().next().value ?? [];
    if (!callback) throw new Error("No animation frame was scheduled");
    pending.delete(id);
    callback();
  };
  return { calls, pending, canvas, analyser, windowObject, frame,
    setSize(w, h) { width = w; height = h; } };
}

test("sets FFT 512 and reuses one 256-bin buffer across silent and active frames", () => {
  const f = fixture();
  const visualizer = new FrequencyVisualizer({ canvas: f.canvas, analyserNode: f.analyser, windowObject: f.windowObject });
  assert.equal(f.analyser.fftSize, 512);
  assert.equal(visualizer.start(), true);
  f.frame();
  assert.equal(f.calls.fill.length, 0);
  f.analyser.level = 128;
  f.frame();
  f.frame();
  assert.ok(f.calls.fill.length > 0);
  assert.equal(f.calls.buffers.length, 3);
  assert.ok(f.calls.buffers.every((buffer) => buffer === f.calls.buffers[0] && buffer.length === 256));
  visualizer.dispose();
});

test("start and stop are idempotent and stale frames cannot restart the loop", () => {
  const f = fixture();
  const visualizer = new FrequencyVisualizer({ canvas: f.canvas, analyserNode: f.analyser, windowObject: f.windowObject });
  assert.equal(visualizer.start(), true);
  assert.equal(visualizer.start(), false);
  assert.equal(f.pending.size, 1);
  const oldCallback = f.pending.values().next().value;
  f.frame();
  assert.equal(f.pending.size, 1);
  assert.equal(visualizer.stop(), true);
  assert.equal(visualizer.stop(), false);
  assert.equal(f.pending.size, 0);
  const drawn = f.calls.fill.length;
  oldCallback();
  assert.equal(f.pending.size, 0);
  assert.equal(f.calls.fill.length, drawn);
  assert.equal(visualizer.start(), true);
  oldCallback();
  assert.equal(f.pending.size, 1);
  visualizer.dispose();
  assert.equal(f.pending.size, 0);
  assert.equal(f.calls.disconnected, 1);
  assert.throws(() => visualizer.start(), { name: "InvalidStateError" });
});

test("Canvas bitmap follows CSS size and device pixel ratio without unnecessary resets", () => {
  const f = fixture();
  const visualizer = new FrequencyVisualizer({ canvas: f.canvas, analyserNode: f.analyser, windowObject: f.windowObject });
  assert.deepEqual([f.canvas.width, f.canvas.height], [400, 200]);
  assert.deepEqual(f.calls.transforms.at(-1), [2, 0, 0, 2, 0, 0]);
  visualizer.resize();
  assert.equal(f.calls.transforms.length, 1);
  f.setSize(300, 80);
  f.windowObject.devicePixelRatio = 1.5;
  visualizer.resize();
  assert.deepEqual([f.canvas.width, f.canvas.height], [450, 120]);
  assert.deepEqual(f.calls.transforms.at(-1), [1.5, 0, 0, 1.5, 0, 0]);
  f.setSize(225, 60);
  f.windowObject.devicePixelRatio = 2;
  visualizer.resize();
  assert.deepEqual([f.canvas.width, f.canvas.height], [450, 120]);
  assert.deepEqual(f.calls.transforms.at(-1), [2, 0, 0, 2, 0, 0]);
  visualizer.dispose();
});

test("frequency buffer is resized only after an FFT bin-count change", () => {
  const f = fixture();
  const visualizer = new FrequencyVisualizer({ canvas: f.canvas, analyserNode: f.analyser, windowObject: f.windowObject });
  visualizer.start();
  f.frame();
  f.analyser.frequencyBinCount = 128;
  f.frame();
  f.frame();
  assert.notEqual(f.calls.buffers[0], f.calls.buffers[1]);
  assert.equal(f.calls.buffers[1], f.calls.buffers[2]);
  assert.equal(f.calls.buffers[1].length, 128);
  visualizer.dispose();
});

test("invalid dependencies are rejected and disposal preserves the caller analyser", () => {
  const f = fixture();
  assert.throws(() => new FrequencyVisualizer({ canvas: {}, analyserNode: f.analyser, windowObject: f.windowObject }), TypeError);
  assert.throws(() => new FrequencyVisualizer({ canvas: f.canvas, analyserNode: {}, windowObject: f.windowObject }), TypeError);
  const visualizer = new FrequencyVisualizer({ canvas: f.canvas, analyserNode: f.analyser, windowObject: f.windowObject });
  visualizer.dispose();
  visualizer.dispose();
  assert.equal(f.analyser.fftSize, 512);
  assert.equal(f.calls.disconnected, 1);
});
