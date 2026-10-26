import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputDir = fileURLToPath(new URL("../audio/fixtures/", import.meta.url));
const sampleRate = 16000;
const durationSeconds = 0.75;
const sampleCount = Math.round(sampleRate * durationSeconds);

function createTone(frequency) {
  const bytes = Buffer.alloc(44 + sampleCount * 2);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVE", 8);
  bytes.write("fmt ", 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20); // PCM
  bytes.writeUInt16LE(1, 22); // mono
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(sampleCount * 2, 40);
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const fade = Math.min(1, index / 400, (sampleCount - 1 - index) / 400);
    const sample = Math.round(Math.sin(2 * Math.PI * frequency * time) * 9000 * fade);
    bytes.writeInt16LE(sample, 44 + index * 2);
  }
  return bytes;
}

await mkdir(outputDir, { recursive: true });
await writeFile(new URL("../audio/fixtures/tone-a.wav", import.meta.url), createTone(440));
await writeFile(new URL("../audio/fixtures/tone-b.wav", import.meta.url), createTone(660));
