import test from "node:test";
import assert from "node:assert/strict";
import { AudioTaskQueue } from "../js/audio/queue.js";
import { AudioPlayer } from "../js/audio/player.js";
import { FrequencyVisualizer } from "../js/audio/visualizer.js";

const tick = () => new Promise((resolve) => setImmediate(resolve));

test("repeated queue, playback and visualization cycles release owned resources", async (t) => {
  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;
  const pendingFrames = new Map();
  const sources = [];
  const retainedBuffers = new Map();
  const listeners = new Map();
  let nextFrame = 0;
  let observerDisconnected = 0;
  let contextClosed = 0;
  const canvasContext = {
    setTransform() {}, clearRect() {}, fillRect() {},
  };
  const canvas = {
    width: 0, height: 0,
    getContext: () => canvasContext,
    getBoundingClientRect: () => ({ width: 320, height: 80 }),
  };
  const windowObject = {
    devicePixelRatio: 1,
    requestAnimationFrame(callback) {
      const id = ++nextFrame;
      pendingFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { pendingFrames.delete(id); },
    ResizeObserver: class {
      observe() {}
      disconnect() { observerDisconnected += 1; }
    },
  };
  const analyser = {
    fftSize: 0, frequencyBinCount: 256, connections: 0, disconnections: 0,
    connect() { this.connections += 1; },
    disconnect() { this.disconnections += 1; },
    getByteFrequencyData(data) { data.fill(0); },
  };
  const context = {
    state: "running", destination: {},
    createBufferSource() {
      const source = {
        buffer: null, stops: 0, disconnections: 0,
        connect() {}, start() {},
        stop() { this.stops += 1; },
        disconnect() { this.disconnections += 1; },
      };
      sources.push(source);
      return source;
    },
    async resume() {},
    async close() { contextClosed += 1; },
  };
  const queue = new AudioTaskQueue({
    baseUrl: "http://localhost/", concurrency: 2,
    async load(url, { signal, onPhase }) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      onPhase("decoding");
      return { url };
    },
  });
  const player = new AudioPlayer({ audioContext: context, analyserNode: analyser });
  const visualizer = new FrequencyVisualizer({ canvas, analyserNode: analyser, windowObject });
  const unsubscribeQueue = queue.subscribe((snapshot) => listeners.set("queue", snapshot.length));
  const unsubscribePlayer = player.subscribe(({ state }) => listeners.set("player", state));

  for (let cycle = 0; cycle < 100; cycle += 1) {
    const cancelled = queue.enqueue(`cancel-${cycle}.wav`);
    const cancelledResult = assert.rejects(cancelled.promise, { name: "AbortError" });
    assert.equal(queue.cancel(cancelled.id), true);
    await cancelledResult;
    assert.equal(queue.remove(cancelled.id), true);

    const task = queue.enqueue(`play-${cycle}.wav`);
    const buffer = await task.promise;
    retainedBuffers.set(task.id, buffer);
    await player.play(task.id, buffer);
    visualizer.start();
    visualizer.start();
    assert.equal(pendingFrames.size, 1);
    const [frameId, frame] = pendingFrames.entries().next().value;
    pendingFrames.delete(frameId);
    frame();
    assert.equal(pendingFrames.size, 1);
    player.stop();
    visualizer.stop();
    assert.equal(pendingFrames.size, 0);
    retainedBuffers.delete(task.id);
    assert.equal(queue.remove(task.id), true);
    assert.deepEqual(queue.getSnapshot(), []);
  }

  assert.equal(retainedBuffers.size, 0);
  assert.equal(sources.length, 100);
  assert.ok(sources.every((source) => source.stops === 1 &&
    source.disconnections === 1 && source.onended === null));
  assert.equal(analyser.connections, 1);
  unsubscribeQueue();
  unsubscribePlayer();
  queue.dispose();
  player.dispose();
  visualizer.dispose();
  await context.close();
  await tick();
  assert.equal(pendingFrames.size, 0);
  assert.equal(observerDisconnected, 1);
  assert.equal(analyser.disconnections, 1);
  assert.equal(contextClosed, 1);
  assert.deepEqual(queue.getSnapshot(), []);
  sources.length = 0;
  if (global.gc) global.gc();
  const heapAfter = process.memoryUsage().heapUsed;
  t.diagnostic(`Node heap used: ${heapBefore} -> ${heapAfter} bytes after 100 cycles; GC exposed: ${Boolean(global.gc)}`);
});
