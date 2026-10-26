import test from "node:test";
import assert from "node:assert/strict";
import { AudioPlayer } from "../js/audio/player.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture() {
  const sources = [];
  const destination = {};
  const analyser = {
    connections: [], disconnections: [],
    connect(node) { this.connections.push(node); },
    disconnect(node) { this.disconnections.push(node); },
  };
  const context = {
    state: "running", destination, resumes: [],
    resume() { const gate = deferred(); this.resumes.push(gate); return gate.promise; },
    createBufferSource() {
      const source = {
        connections: [], disconnections: 0, stops: 0, starts: 0,
        connect(node) { this.connections.push(node); },
        disconnect() { this.disconnections += 1; },
        start() { this.starts += 1; },
        stop() { this.stops += 1; },
      };
      sources.push(source);
      return source;
    },
  };
  const player = new AudioPlayer({ audioContext: context, analyserNode: analyser });
  return { player, context, analyser, sources, destination };
}

test("fresh sources play through one analyser graph; replacement releases the old source", async () => {
  const { player, analyser, sources, destination } = fixture();
  const firstBuffer = {}, secondBuffer = {};
  await player.play("A", firstBuffer);
  assert.equal(player.state, "playing");
  assert.equal(player.currentId, "A");
  await player.play("B", secondBuffer);
  assert.equal(sources.length, 2);
  assert.notEqual(sources[0], sources[1]);
  assert.equal(sources[0].stops, 1);
  assert.equal(sources[0].disconnections, 1);
  assert.equal(sources[0].onended, null);
  assert.equal(sources[1].buffer, secondBuffer);
  assert.deepEqual(sources.map((source) => source.connections), [[analyser], [analyser]]);
  assert.deepEqual(analyser.connections, [destination]);
  assert.equal(player.currentId, "B");
  assert.equal(sources[1].starts, 1);
});

test("stale ended callbacks cannot release newer playback; natural ending clears references", async () => {
  const { player, sources } = fixture();
  await player.play("A", {});
  const oldEnded = sources[0].onended;
  await player.play("B", {});
  oldEnded();
  assert.equal(player.currentId, "B");
  sources[1].onended();
  assert.equal(player.state, "idle");
  assert.equal(player.currentId, null);
  assert.equal(sources[1].onended, null);
  assert.equal(sources[1].disconnections, 1);
});

test("stop and dispose are idempotent and do not close the supplied context", async () => {
  const { player, context, analyser, sources, destination } = fixture();
  await player.play("A", {});
  player.stop(); player.stop();
  assert.equal(sources[0].stops, 1);
  assert.equal(player.state, "idle");
  await player.play("B", {});
  player.dispose(); player.dispose(); player.stop();
  assert.equal(sources[1].stops, 1);
  assert.deepEqual(analyser.disconnections, [destination]);
  assert.equal(context.state, "running");
  await assert.rejects(player.play("C", {}), { name: "InvalidStateError" });
});

test("only the latest request starts after overlapping asynchronous resumes", async () => {
  const { player, context, sources } = fixture();
  context.state = "suspended";
  const first = player.play("A", {});
  const second = player.play("B", {});
  context.resumes[1].resolve();
  await second;
  context.resumes[0].resolve();
  await assert.rejects(first, { name: "AbortError" });
  assert.equal(sources.length, 1);
  assert.equal(player.currentId, "B");
});

test("stop or dispose during resume prevents delayed playback", async () => {
  for (const action of ["stop", "dispose"]) {
    const { player, context, sources } = fixture();
    context.state = "suspended";
    const pending = player.play("A", {});
    player[action]();
    context.resumes[0].resolve();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(sources.length, 0);
  }
});

test("resume and start failures are visible and release any created source", async () => {
  const { player, context, sources } = fixture();
  context.state = "suspended";
  const pending = player.play("A", {});
  const resumeError = new Error("gesture rejected");
  context.resumes[0].reject(resumeError);
  await assert.rejects(pending, (error) => error === resumeError);
  assert.equal(sources.length, 0);
  context.state = "running";
  const startError = new Error("start failed");
  const create = context.createBufferSource.bind(context);
  context.createBufferSource = () => {
    const source = create();
    source.start = () => { throw startError; };
    return source;
  };
  await assert.rejects(player.play("B", {}), (error) => error === startError);
  assert.equal(player.state, "idle");
  assert.equal(sources[0].onended, null);
  assert.equal(sources[0].disconnections, 1);
});

test("invalid player inputs fail before changing playback", async () => {
  const { player } = fixture();
  await player.play("A", {});
  await assert.rejects(player.play("", {}), TypeError);
  await assert.rejects(player.play("B", null), TypeError);
  assert.equal(player.currentId, "A");
});
