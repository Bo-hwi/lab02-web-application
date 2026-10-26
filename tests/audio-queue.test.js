import test from "node:test";
import assert from "node:assert/strict";
import { AudioTaskQueue } from "../js/audio/queue.js";

const baseUrl = "http://localhost:5500/";
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

function controlledLoader() {
  const operations = [];
  let active = 0;
  let maximum = 0;
  const load = (url, { signal, onPhase }) => {
    active += 1;
    maximum = Math.max(maximum, active);
    return new Promise((resolve, reject) => {
      operations.push({
        url,
        signal,
        onPhase,
        succeed(buffer) {
          active -= 1;
          onPhase("decoding");
          resolve(buffer);
        },
        fail(error) {
          active -= 1;
          reject(error);
        },
      });
    });
  };
  return { load, operations, get maximum() { return maximum; } };
}

test("default limit starts A and B in FIFO order while C waits", async () => {
  const loader = controlledLoader();
  const queue = new AudioTaskQueue({ load: loader.load, baseUrl });
  const tasks = ["a", "b", "c"].map((name) => queue.enqueue(`${name}.wav`));
  assert.deepEqual(queue.getSnapshot().map((entry) => entry.state), ["pending", "pending", "pending"]);
  await nextTurn();
  assert.deepEqual(loader.operations.map((op) => op.url), [`${baseUrl}a.wav`, `${baseUrl}b.wav`]);
  assert.equal(queue.getSnapshot()[2].state, "pending");
  loader.operations[1].succeed("buffer-b");
  assert.equal(await tasks[1].promise, "buffer-b");
  await nextTurn();
  assert.equal(loader.operations[2].url, `${baseUrl}c.wav`);
  loader.operations[2].succeed("buffer-c");
  loader.operations[0].succeed("buffer-a");
  assert.deepEqual(await Promise.all(tasks.map((task) => task.promise)), ["buffer-a", "buffer-b", "buffer-c"]);
  assert.equal(loader.maximum, 2);
  assert.deepEqual(queue.getSnapshot().map((entry) => entry.id), tasks.map((task) => task.id));
});

test("configured limits bound actual in-flight loaders across many tasks", async () => {
  for (const concurrency of [1, 2, 3]) {
    const loader = controlledLoader();
    const queue = new AudioTaskQueue({ load: loader.load, concurrency, baseUrl });
    const tasks = Array.from({ length: 9 }, (_, i) => queue.enqueue(`${i}.wav`));
    await nextTurn();
    assert.equal(loader.operations.length, concurrency);
    for (let i = 0; i < tasks.length; i += 1) {
      loader.operations[i].succeed(i);
      await nextTurn();
    }
    assert.deepEqual(await Promise.all(tasks.map((task) => task.promise)), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(loader.maximum, concurrency);
    assert.deepEqual(loader.operations.map((op) => op.url), tasks.map((_, i) => `${baseUrl}${i}.wav`));
  }
});

test("rejected tasks preserve the original failure and release a slot", async () => {
  const loader = controlledLoader();
  const queue = new AudioTaskQueue({ load: loader.load, concurrency: 1, baseUrl });
  const first = queue.enqueue("bad.wav");
  const second = queue.enqueue("good.wav");
  const failure = new Error("Download failed");
  const rejection = assert.rejects(first.promise, (error) => error === failure);
  await nextTurn();
  loader.operations[0].fail(failure);
  await rejection;
  await nextTurn();
  assert.equal(loader.operations.length, 2);
  assert.equal(queue.getSnapshot()[0].state, "failed");
  loader.operations[1].succeed("good");
  assert.equal(await second.promise, "good");
});

test("synchronous loader throws do not recurse or stall the queue", async () => {
  const failure = new Error("Synchronous failure");
  const queue = new AudioTaskQueue({ load() { throw failure; }, concurrency: 1, baseUrl });
  const tasks = Array.from({ length: 1000 }, () => queue.enqueue("bad.wav"));
  const results = await Promise.allSettled(tasks.map((task) => task.promise));
  assert.ok(results.every((result) => result.status === "rejected" && result.reason === failure));
  assert.ok(queue.getSnapshot().every((entry) => entry.state === "failed"));
});

test("duplicate URLs receive distinct stable IDs and independent results", async () => {
  const queue = new AudioTaskQueue({ baseUrl, load: async (_, { onPhase }) => {
    onPhase("decoding");
    return {};
  } });
  const first = queue.enqueue("same.wav");
  const second = queue.enqueue("same.wav");
  assert.notEqual(first.id, second.id);
  const [a, b] = await Promise.all([first.promise, second.promise]);
  assert.notEqual(a, b);
  assert.deepEqual(queue.getSnapshot().map((entry) => entry.id), [first.id, second.id]);
});

test("loader receives a signal and decoding phase cannot move backwards", async () => {
  const loader = controlledLoader();
  const queue = new AudioTaskQueue({ load: loader.load, baseUrl });
  const task = queue.enqueue("sample.wav");
  await nextTurn();
  const operation = loader.operations[0];
  assert.ok(operation.signal instanceof AbortSignal);
  assert.equal(operation.signal.aborted, false);
  operation.onPhase("decoding");
  operation.onPhase("downloading");
  assert.equal(queue.getSnapshot()[0].state, "decoding");
  operation.succeed("buffer");
  await task.promise;
  operation.onPhase("decoding");
  assert.equal(queue.getSnapshot()[0].state, "ready");
});

test("misbehaving thenable cannot settle twice or consume an extra slot", async () => {
  let calls = 0;
  const queue = new AudioTaskQueue({ concurrency: 1, baseUrl, load(_, { onPhase }) {
    calls += 1;
    onPhase("decoding");
    return { then(resolve, reject) { resolve("first"); reject(new Error("late")); resolve("late"); } };
  } });
  const tasks = [queue.enqueue("a.wav"), queue.enqueue("b.wav")];
  assert.deepEqual(await Promise.all(tasks.map((task) => task.promise)), ["first", "first"]);
  assert.equal(calls, 2);
  assert.ok(queue.getSnapshot().every((entry) => entry.state === "ready"));
});

test("snapshots are detached metadata without owned resources", async () => {
  const queue = new AudioTaskQueue({ baseUrl, load(_, { onPhase }) {
    onPhase("decoding");
    throw new Error("decode failure");
  } });
  await assert.rejects(queue.enqueue("bad.wav").promise);
  const snapshot = queue.getSnapshot();
  assert.deepEqual(Object.keys(snapshot[0]), ["id", "url", "state", "error"]);
  snapshot[0].state = "ready";
  snapshot[0].error.message = "changed";
  snapshot.pop();
  assert.equal(queue.getSnapshot()[0].state, "failed");
  assert.equal(queue.getSnapshot()[0].error.message, "decode failure");
});

test("invalid options are rejected", () => {
  assert.throws(() => new AudioTaskQueue(), TypeError);
  assert.throws(() => new AudioTaskQueue({ load: 1 }), TypeError);
  for (const concurrency of [0, -1, 1.5, NaN, Infinity, "2"]) {
    assert.throws(() => new AudioTaskQueue({ load() {}, concurrency }), RangeError);
  }
});

test("invalid URLs never allocate IDs or invoke the loader", async () => {
  let calls = 0;
  const queue = new AudioTaskQueue({ baseUrl, load(_, { onPhase }) {
    calls += 1;
    onPhase("decoding");
    return "valid";
  } });
  for (const url of ["", "  ", null, 42, "javascript:alert(1)", "file:///a.wav", "https://user:pass@example.com/a.wav", "http://["]) {
    assert.throws(() => queue.enqueue(url), TypeError);
  }
  assert.deepEqual(queue.getSnapshot(), []);
  const task = queue.enqueue("  sample.wav  ");
  assert.equal(task.id, "audio-1");
  assert.equal(await task.promise, "valid");
  assert.equal(calls, 1);
  assert.equal(queue.getSnapshot()[0].url, `${baseUrl}sample.wav`);
});

test("a new enqueue restarts an idle scheduler", async () => {
  const queue = new AudioTaskQueue({ baseUrl, load: async (url, { onPhase }) => {
    onPhase("decoding");
    return url;
  } });
  await queue.enqueue("first.wav").promise;
  await nextTurn();
  assert.equal(await queue.enqueue("second.wav").promise, `${baseUrl}second.wav`);
});

test("missing decoding report fails explicitly and does not stall following work", async () => {
  let calls = 0;
  const queue = new AudioTaskQueue({ concurrency: 1, baseUrl, load(_, { onPhase }) {
    calls += 1;
    if (calls > 1) onPhase("decoding");
    return "buffer";
  } });
  const invalid = queue.enqueue("invalid-loader.wav");
  const valid = queue.enqueue("valid-loader.wav");
  await assert.rejects(invalid.promise, /must report decoding/);
  assert.equal(await valid.promise, "buffer");
});
