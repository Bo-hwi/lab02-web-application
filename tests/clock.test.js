import test from "node:test";
import assert from "node:assert/strict";
import { createDeadlineCountdown, formatRemainingTime } from "../js/sale/clock.js";

function makeHarness(nowMs = 1000) {
  let currentTime = nowMs;
  let nextHandle = 1;
  const pending = new Map();
  const cancelled = [];
  return {
    clock: { now: () => currentTime },
    frameScheduler: {
      request(callback) {
        const handle = nextHandle++;
        pending.set(handle, callback);
        return handle;
      },
      cancel(handle) {
        cancelled.push(handle);
        pending.delete(handle);
      },
    },
    setTime(value) { currentTime = value; },
    runFrame(handle = [...pending.keys()][0]) {
      const callback = pending.get(handle);
      assert.ok(callback, "expected one scheduled frame");
      pending.delete(handle);
      callback();
      return callback;
    },
    get pendingCount() { return pending.size; },
    get cancelled() { return cancelled; },
  };
}

test("delayed frames read the absolute clock without accumulating drift", () => {
  const harness = makeHarness(1000);
  const ticks = [];
  const timer = createDeadlineCountdown({
    deadlineMs: 6000,
    onTick: (remainingMs) => ticks.push(remainingMs),
    clock: harness.clock,
    frameScheduler: harness.frameScheduler,
  });

  assert.equal(timer.start(), true);
  assert.equal(timer.start(), false);
  harness.setTime(4200);
  harness.runFrame();
  harness.setTime(5999);
  harness.runFrame();
  harness.setTime(6000);
  harness.runFrame();

  assert.deepEqual(ticks, [5000, 1800, 1, 0]);
  assert.equal(timer.state, "finished");
  assert.equal(harness.pendingCount, 0);
});

test("a timer started at or after its deadline emits zero once", () => {
  for (const nowMs of [6000, 7000]) {
    const harness = makeHarness(nowMs);
    const ticks = [];
    const timer = createDeadlineCountdown({
      deadlineMs: 6000,
      onTick: (remainingMs) => ticks.push(remainingMs),
      clock: harness.clock,
      frameScheduler: harness.frameScheduler,
    });
    assert.equal(timer.start(), true);
    assert.equal(timer.start(), false);
    assert.deepEqual(ticks, [0]);
    assert.equal(harness.pendingCount, 0);
  }
});

test("stop and dispose cancel the frame and ignore even a late callback", () => {
  for (const method of ["stop", "dispose"]) {
    const harness = makeHarness();
    const ticks = [];
    const timer = createDeadlineCountdown({
      deadlineMs: 6000,
      onTick: (remainingMs) => ticks.push(remainingMs),
      clock: harness.clock,
      frameScheduler: harness.frameScheduler,
    });
    timer.start();
    const staleCallback = harness.runFrame();
    assert.deepEqual(ticks, [5000, 5000]);
    assert.equal(harness.pendingCount, 1);
    timer[method]();
    timer[method]();
    assert.equal(harness.pendingCount, 0);
    assert.equal(harness.cancelled.length, 1);
    harness.setTime(6000);
    staleCallback();
    assert.deepEqual(ticks, [5000, 5000]);
    assert.equal(timer.start(), false);
  }
});

test("stopping from onTick never schedules a frame", () => {
  const harness = makeHarness();
  const ticks = [];
  let timer;
  timer = createDeadlineCountdown({
    deadlineMs: 6000,
    onTick: (remainingMs) => {
      ticks.push(remainingMs);
      timer.stop();
    },
    clock: harness.clock,
    frameScheduler: harness.frameScheduler,
  });
  timer.start();
  assert.deepEqual(ticks, [5000]);
  assert.equal(harness.pendingCount, 0);
});

test("remaining time formats whole seconds and three millisecond digits", () => {
  assert.equal(formatRemainingTime(300000), "300.000");
  assert.equal(formatRemainingTime(1001), "1.001");
  assert.equal(formatRemainingTime(9), "0.009");
  assert.equal(formatRemainingTime(-1), "0.000");
});
