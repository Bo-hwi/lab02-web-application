import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const [name, frequency] of [["tone-a.wav", 440], ["tone-b.wav", 660]]) {
  test(name + " is a short, non-silent PCM WAV that Web Audio can decode", async () => {
    const bytes = await readFile(new URL("../audio/fixtures/" + name, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.readUInt32LE(4), bytes.length - 8);
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
    assert.equal(bytes.toString("ascii", 12, 16), "fmt ");
    assert.equal(bytes.readUInt16LE(20), 1); // PCM
    assert.equal(bytes.readUInt16LE(22), 1); // mono
    assert.equal(bytes.readUInt32LE(24), 16000);
    assert.equal(bytes.readUInt16LE(34), 16);
    assert.equal(bytes.toString("ascii", 36, 40), "data");
    assert.equal(bytes.readUInt32LE(40), bytes.length - 44);
    assert.ok(bytes.length < 30000);
    assert.ok(bytes.readInt16LE(44 + Math.floor(16000 / frequency) * 2) !== 0);
  });
}
