import test from "node:test";
import assert from "node:assert/strict";
import { AudioTaskQueue } from "../js/audio/queue.js";
import { createAudioLoader } from "../js/audio/loader.js";

const baseUrl = "http://localhost/";
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function harness(concurrency = 1) {
  const operations = [];
  const queue = new AudioTaskQueue({ concurrency, baseUrl, load(url, options) {
    const operation = { url, ...options, ...deferred() };
    operations.push(operation);
    return operation.promise;
  } });
  const succeed = (index, buffer = {}) => {
    operations[index].onPhase("decoding");
    operations[index].resolve(buffer);
  };
  return { queue, operations, succeed };
}

test("cancel before the drain starts prevents invocation and settles once", async () => {
  const { queue, operations } = harness();
  const task = queue.enqueue("a.wav");
  const rejection = assert.rejects(task.promise, { name: "AbortError" });
  assert.equal(queue.cancel(task.id), true);
  assert.equal(queue.cancel(task.id), false);
  await rejection;
  await nextTurn();
  assert.equal(operations.length, 0);
  assert.equal(queue.getSnapshot()[0].state, "cancelled");
});

test("cancelling pending B preserves FIFO order of remaining C", async () => {
  const { queue, operations, succeed } = harness();
  const [a, b, c] = ["a", "b", "c"].map((name) => queue.enqueue(`${name}.wav`));
  const rejection = assert.rejects(b.promise, { name: "AbortError" });
  await nextTurn();
  assert.equal(queue.cancel(b.id), true);
  succeed(0);
  await a.promise;
  await rejection;
  await nextTurn();
  assert.deepEqual(operations.map((operation) => operation.url), [`${baseUrl}a.wav`, `${baseUrl}c.wav`]);
  succeed(1);
  await c.promise;
});

test("active cancellation aborts signal but retains its slot until late success", async () => {
  const { queue, operations, succeed } = harness();
  const a = queue.enqueue("a.wav");
  const b = queue.enqueue("b.wav");
  const rejection = assert.rejects(a.promise, { name: "AbortError" });
  await nextTurn();
  assert.equal(queue.cancel(a.id), true);
  await rejection;
  assert.equal(operations[0].signal.aborted, true);
  await nextTurn();
  assert.equal(operations.length, 1);
  succeed(0, { mustBeDiscarded: true });
  await nextTurn();
  assert.equal(queue.getSnapshot()[0].state, "cancelled");
  assert.equal(operations.length, 2);
  succeed(1);
  await b.promise;
});

test("late decode rejection cannot overwrite cancellation or stall following work", async () => {
  const { queue, operations, succeed } = harness();
  const a = queue.enqueue("a.wav");
  const b = queue.enqueue("b.wav");
  const rejection = assert.rejects(a.promise, { name: "AbortError" });
  await nextTurn();
  operations[0].onPhase("decoding");
  queue.cancel(a.id);
  await rejection;
  operations[0].reject(new Error("Late failure"));
  await nextTurn();
  assert.equal(queue.getSnapshot()[0].state, "cancelled");
  assert.equal(queue.getSnapshot()[0].error.name, "AbortError");
  succeed(1);
  await b.promise;
});

test("real loader adapter aborts its active fetch and schedules the next task", async () => {
  const started = deferred();
  let aborted = false;
  const load = createAudioLoader({ audioContext: { async decodeAudioData() { return {}; } },
    fetchImpl(url, { signal }) {
      if (url.endsWith("good.wav")) return Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
      return new Promise((_, reject) => {
        signal.addEventListener("abort", () => { aborted = true; reject(new DOMException("Aborted", "AbortError")); }, { once: true });
        started.resolve();
      });
    } });
  const queue = new AudioTaskQueue({ load, concurrency: 1, baseUrl });
  const bad = queue.enqueue("slow.wav");
  const good = queue.enqueue("good.wav");
  const rejection = assert.rejects(bad.promise, { name: "AbortError" });
  await started.promise;
  queue.cancel(bad.id);
  await rejection;
  await good.promise;
  assert.equal(aborted, true);
  assert.deepEqual(queue.getSnapshot().map((entry) => entry.state), ["cancelled", "ready"]);
});

test("real loader adapter holds a cancelled decode slot until decode settles", async () => {
  const decoding = deferred();
  const started = deferred();
  let fetches = 0;
  const load = createAudioLoader({ fetchImpl: async () => {
    fetches += 1;
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  }, audioContext: { decodeAudioData() {
    if (fetches === 1) { started.resolve(); return decoding.promise; }
    return Promise.resolve({});
  } } });
  const queue = new AudioTaskQueue({ load, concurrency: 1, baseUrl });
  const a = queue.enqueue("a.wav");
  const b = queue.enqueue("b.wav");
  const rejection = assert.rejects(a.promise, { name: "AbortError" });
  await started.promise;
  queue.cancel(a.id);
  await rejection;
  await nextTurn();
  assert.equal(fetches, 1);
  decoding.resolve({ late: true });
  await b.promise;
  assert.equal(fetches, 2);
  assert.equal(queue.getSnapshot()[0].state, "cancelled");
});

test("dispose before scheduling rejects pending work without invoking loaders", async () => {
  const { queue, operations } = harness();
  const tasks = [queue.enqueue("a.wav"), queue.enqueue("b.wav")];
  const results = Promise.allSettled(tasks.map((task) => task.promise));
  queue.dispose();
  queue.dispose();
  assert.ok((await results).every((result) => result.status === "rejected" && result.reason.name === "AbortError"));
  await nextTurn();
  assert.equal(operations.length, 0);
  assert.deepEqual(queue.getSnapshot(), []);
  assert.throws(() => queue.enqueue("c.wav"), { name: "InvalidStateError" });
});

test("dispose aborts active tasks, rejects pending ones and ignores late outcomes", async () => {
  const { queue, operations } = harness(2);
  const tasks = ["a", "b", "c"].map((name) => queue.enqueue(`${name}.wav`));
  const results = Promise.allSettled(tasks.map((task) => task.promise));
  await nextTurn();
  operations[0].onPhase("decoding");
  queue.dispose();
  assert.ok((await results).every((result) => result.status === "rejected" && result.reason.name === "AbortError"));
  assert.ok(operations.every((operation) => operation.signal.aborted));
  operations[0].resolve({});
  operations[1].reject(new Error("Late error"));
  await nextTurn();
  assert.equal(operations.length, 2);
  assert.deepEqual(queue.getSnapshot(), []);
  assert.equal(queue.cancel(tasks[0].id), false);
  assert.equal(queue.remove(tasks[0].id), false);
});

test("remove accepts only terminal entries and never reuses IDs", async () => {
  const { queue, succeed } = harness();
  const a = queue.enqueue("a.wav");
  assert.equal(queue.remove(a.id), false);
  assert.equal(queue.remove("unknown"), false);
  await nextTurn();
  succeed(0);
  await a.promise;
  assert.equal(queue.cancel(a.id), false);
  assert.equal(queue.remove(a.id), true);
  assert.equal(queue.remove(a.id), false);
  const b = queue.enqueue("b.wav");
  assert.notEqual(a.id, b.id);
  const rejection = assert.rejects(b.promise, { name: "AbortError" });
  queue.cancel(b.id);
  await rejection;
  assert.equal(queue.remove(b.id), true);
  assert.deepEqual(queue.getSnapshot(), []);
});

test("removing a cancelled in-flight entry cannot resurrect it on completion", async () => {
  const { queue, operations, succeed } = harness();
  const a = queue.enqueue("a.wav");
  const b = queue.enqueue("b.wav");
  const rejection = assert.rejects(a.promise, { name: "AbortError" });
  await nextTurn();
  queue.cancel(a.id);
  await rejection;
  assert.equal(queue.remove(a.id), true);
  await nextTurn();
  assert.equal(operations.length, 1);
  succeed(0);
  await nextTurn();
  succeed(1);
  await b.promise;
  assert.deepEqual(queue.getSnapshot().map((entry) => entry.id), [b.id]);
});

test("terminal completion wins when cancellation is attempted afterward", async () => {
  const { queue, succeed } = harness();
  const task = queue.enqueue("a.wav");
  await nextTurn();
  const buffer = {};
  succeed(0, buffer);
  assert.equal(await task.promise, buffer);
  assert.equal(queue.cancel(task.id), false);
  queue.dispose();
  assert.equal(await task.promise, buffer);
});

test("cancellation before the completion continuation wins and settles once", async () => {
  const { queue, succeed } = harness();
  const task = queue.enqueue("a.wav");
  const rejection = assert.rejects(task.promise, { name: "AbortError" });
  await nextTurn();
  succeed(0);
  assert.equal(queue.cancel(task.id), true);
  await rejection;
  await nextTurn();
  assert.equal(queue.getSnapshot()[0].state, "cancelled");
});

test("abort callback reentrancy cannot start work after disposal", async () => {
  const { queue, operations } = harness();
  const a = queue.enqueue("a.wav");
  const b = queue.enqueue("b.wav");
  const results = Promise.allSettled([a.promise, b.promise]);
  await nextTurn();
  operations[0].signal.addEventListener("abort", () => queue.dispose(), { once: true });
  queue.cancel(a.id);
  await results;
  operations[0].resolve({});
  await nextTurn();
  assert.equal(operations.length, 1);
  assert.deepEqual(queue.getSnapshot(), []);
});

test("repeated cancellations retain both occupied slots and preserve FIFO", async () => {
  const { queue, operations, succeed } = harness(2);
  const tasks = ["a", "b", "c", "d"].map((name) => queue.enqueue(`${name}.wav`));
  const first = Promise.allSettled(tasks.slice(0, 2).map((task) => task.promise));
  await nextTurn();
  for (let i = 0; i < 10; i += 1) { queue.cancel(tasks[0].id); queue.cancel(tasks[1].id); }
  await first;
  await nextTurn();
  assert.equal(operations.length, 2);
  operations[1].reject(new Error("Late"));
  await nextTurn();
  assert.equal(operations[2].url, `${baseUrl}c.wav`);
  succeed(0);
  await nextTurn();
  assert.equal(operations[3].url, `${baseUrl}d.wav`);
  succeed(2); succeed(3);
  await Promise.all(tasks.slice(2).map((task) => task.promise));
});
