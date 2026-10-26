import test from "node:test";
import assert from "node:assert/strict";
import { createAudioLoader, AudioLoadError } from "../js/audio/loader.js";
import { AudioTaskQueue } from "../js/audio/queue.js";

const url = "http://localhost/sample.wav";
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (bytes = new ArrayBuffer(8)) => ({ ok: true, arrayBuffer: async () => bytes });

test("fetch receives signal; complete bytes decode with context receiver and phase", async () => {
  const bytes = new ArrayBuffer(8);
  const buffer = {};
  const phases = [];
  const controller = new AbortController();
  const audioContext = { async decodeAudioData(value) {
    assert.equal(this, audioContext);
    assert.equal(value, bytes);
    assert.deepEqual(phases, ["decoding"]);
    return buffer;
  } };
  const load = createAudioLoader({ audioContext, fetchImpl: async (value, options) => {
    assert.equal(value, url);
    assert.equal(options.signal, controller.signal);
    return response(bytes);
  } });
  assert.equal(await load(url, { signal: controller.signal, onPhase: (phase) => phases.push(phase) }), buffer);
});

test("HTTP failures do not read or decode the body", async () => {
  const load = createAudioLoader({ audioContext: { decodeAudioData() { assert.fail("must not decode"); } },
    fetchImpl: async () => ({ ok: false, status: 404, statusText: "Not Found", arrayBuffer() { assert.fail("must not read"); } }) });
  await assert.rejects(load(url), (error) => error instanceof AudioLoadError && error.stage === "download" && /HTTP 404/.test(error.message));
});

test("network and body failures identify download stage and original cause", async () => {
  for (const stage of ["network", "body"]) {
    const failure = new Error(stage);
    const load = createAudioLoader({ audioContext: { decodeAudioData() { assert.fail("must not decode"); } },
      fetchImpl: async () => {
        if (stage === "network") throw failure;
        return { ok: true, arrayBuffer: async () => { throw failure; } };
      } });
    await assert.rejects(load(url), (error) => error.stage === "download" && error.cause === failure);
  }
});

test("synchronous and asynchronous decode failures identify decode stage", async () => {
  for (const asynchronous of [false, true]) {
    const failure = new Error("Unsupported audio");
    const load = createAudioLoader({ fetchImpl: async () => response(), audioContext: {
      decodeAudioData() { if (asynchronous) return Promise.reject(failure); throw failure; },
    } });
    await assert.rejects(load(url), (error) => error.stage === "decode" && error.cause === failure);
  }
});

test("already aborted signals reject before starting fetch", async () => {
  const controller = new AbortController();
  controller.abort();
  const load = createAudioLoader({ audioContext: { decodeAudioData() {} }, fetchImpl() { assert.fail("must not fetch"); } });
  await assert.rejects(load(url, { signal: controller.signal }), { name: "AbortError" });
});

test("in-flight fetch abortion remains AbortError", async () => {
  const controller = new AbortController();
  const started = deferred();
  const load = createAudioLoader({ audioContext: { decodeAudioData() { assert.fail("must not decode"); } },
    fetchImpl: (_, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      started.resolve();
    }) });
  const result = load(url, { signal: controller.signal });
  const rejection = assert.rejects(result, { name: "AbortError" });
  await started.promise;
  controller.abort();
  await rejection;
});

test("cancellation while reading body prevents decode", async () => {
  const controller = new AbortController();
  const body = deferred();
  const started = deferred();
  const load = createAudioLoader({ audioContext: { decodeAudioData() { assert.fail("must not decode"); } },
    fetchImpl: async () => ({ ok: true, arrayBuffer() { started.resolve(); return body.promise; } }) });
  const result = load(url, { signal: controller.signal });
  const rejection = assert.rejects(result, { name: "AbortError" });
  await started.promise;
  controller.abort();
  body.resolve(new ArrayBuffer(8));
  await rejection;
});

test("cancellation during decode discards late success and observes late failure", async () => {
  for (const fails of [false, true]) {
    const controller = new AbortController();
    const decode = deferred();
    const started = deferred();
    const load = createAudioLoader({ fetchImpl: async () => response(), audioContext: {
      decodeAudioData() { started.resolve(); return decode.promise; },
    } });
    const result = load(url, { signal: controller.signal });
    const rejection = assert.rejects(result, { name: "AbortError" });
    await started.promise;
    controller.abort();
    if (fails) decode.reject(new Error("Late decode failure"));
    else decode.resolve({});
    await rejection;
  }
});

test("queue continues after loader HTTP and decode failures", async () => {
  const load = createAudioLoader({ fetchImpl: async (value) => {
    if (value.endsWith("404.wav")) return { ok: false, status: 404 };
    return response(new Uint8Array([value.endsWith("invalid.wav") ? 0 : 1]).buffer);
  }, audioContext: { async decodeAudioData(bytes) {
    if (new Uint8Array(bytes)[0] === 0) throw new Error("Invalid audio");
    return { decoded: true };
  } } });
  const queue = new AudioTaskQueue({ load, concurrency: 1 });
  const tasks = ["404", "invalid", "valid"].map((name) => queue.enqueue(`http://localhost/${name}.wav`));
  const results = await Promise.allSettled(tasks.map((task) => task.promise));
  assert.deepEqual(results.map((result) => result.status), ["rejected", "rejected", "fulfilled"]);
  assert.deepEqual(queue.getSnapshot().map((entry) => entry.state), ["failed", "failed", "ready"]);
});

test("loader validates dependencies and never closes caller context", async () => {
  assert.throws(() => createAudioLoader(), TypeError);
  assert.throws(() => createAudioLoader({ audioContext: { decodeAudioData() {} }, fetchImpl: null }), TypeError);
  const load = createAudioLoader({ fetchImpl: async () => response(), audioContext: {
    async decodeAudioData() { return {}; }, close() { assert.fail("caller owns context"); },
  } });
  await load(url);
});

test("non-Error failures retain their cause without breaking error reporting", async () => {
  for (const failure of [null, undefined, "network unavailable"]) {
    const load = createAudioLoader({ audioContext: { decodeAudioData() {} },
      fetchImpl: async () => { throw failure; } });
    await assert.rejects(load(url), (error) => error instanceof AudioLoadError &&
      error.stage === "download" && error.cause === failure);
  }
});
