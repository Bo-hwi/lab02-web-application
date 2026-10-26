import test from "node:test";
import assert from "node:assert/strict";
import { AudioTaskQueue } from "../js/audio/queue.js";
import { AudioPlayer } from "../js/audio/player.js";

test("queue observers receive ordered detached states and can unsubscribe", async () => {
  let finish;
  const queue = new AudioTaskQueue({
    baseUrl: "http://localhost/",
    load: (_url, { onPhase }) => new Promise((resolve) => {
      finish = () => { onPhase("decoding"); resolve({ duration: 1 }); };
    }),
  });
  const states = [];
  const unsubscribe = queue.subscribe((snapshot) => {
    states.push(snapshot.map(({ state }) => state).join(","));
    snapshot[0].state = "tampered";
  });
  const task = queue.enqueue("tone.wav");
  await Promise.resolve();
  finish();
  await task.promise;
  assert.deepEqual(states, ["pending", "downloading", "decoding", "ready"]);
  assert.equal(queue.getSnapshot()[0].state, "ready");
  unsubscribe();
  queue.remove(task.id);
  assert.equal(states.length, 4);
  queue.dispose();
  assert.throws(() => queue.subscribe(() => {}), { name: "InvalidStateError" });
});

test("player observers report play, natural end and stop", async () => {
  const sources = [];
  const context = {
    state: "running",
    destination: {},
    resume() {},
    createBufferSource() {
      const source = {
        connect() {}, disconnect() {}, start() {}, stop() {},
      };
      sources.push(source);
      return source;
    },
  };
  const analyser = { connect() {}, disconnect() {} };
  const player = new AudioPlayer({ audioContext: context, analyserNode: analyser });
  const changes = [];
  const unsubscribe = player.subscribe((snapshot) => changes.push(snapshot));
  await player.play("first", {});
  sources[0].onended();
  await player.play("second", {});
  player.stop();
  assert.deepEqual(changes, [
    { state: "playing", currentId: "first" },
    { state: "idle", currentId: null },
    { state: "playing", currentId: "second" },
    { state: "idle", currentId: null },
  ]);
  unsubscribe();
  player.dispose();
  assert.throws(() => player.subscribe(() => {}), { name: "InvalidStateError" });
});
