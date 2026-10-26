import { createAudioLoader } from "../js/audio/loader.js";
import { AudioTaskQueue } from "../js/audio/queue.js";

// Original synthetic fixture: 0.1-second mono PCM WAV, generated in memory.
function createWav() {
  const sampleRate = 8000;
  const samples = 800;
  const bytes = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(bytes);
  const text = (offset, value) => [...value].forEach((character, i) => view.setUint8(offset + i, character.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, bytes.byteLength - 8, true);
  text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i += 1) {
    view.setInt16(44 + i * 2, Math.round(2000 * Math.sin(2 * Math.PI * 440 * i / sampleRate)), true);
  }
  return bytes;
}

const button = document.getElementById("run");
const summary = document.getElementById("summary");
const output = document.getElementById("results");
button.addEventListener("click", async () => {
  button.disabled = true;
  summary.replaceChildren(document.createTextNode("Running"));
  const results = [];
  let context;
  let wavUrl;
  const check = async (name, action) => {
    try { await action(); results.push(`PASS: ${name}`); }
    catch (error) { results.push(`FAIL: ${name}: ${error.message}`); }
  };
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  try {
    context = new AudioContext();
    await context.resume();
    const load = createAudioLoader({ audioContext: context });
    wavUrl = URL.createObjectURL(new Blob([createWav()], { type: "audio/wav" }));
    await check("Native fetch and decodeAudioData produce a real AudioBuffer", async () => {
      const phases = [];
      const buffer = await load(wavUrl, { onPhase: (phase) => phases.push(phase) });
      require(buffer instanceof AudioBuffer, "Not an AudioBuffer");
      require(buffer.numberOfChannels === 1 && Math.abs(buffer.duration - 0.1) < 0.005, "Unexpected audio shape");
      require(buffer.getChannelData(0).some((value) => value !== 0), "Decoded signal is unexpectedly silent");
      require(phases.join() === "decoding", "Wrong phase");
    });
    await check("HTTP HTML content reports a real decode failure", async () => {
      try { await load(location.href); } catch (error) {
        require(error.stage === "decode" && error.cause, "Missing decode error context"); return;
      }
      throw new Error("Invalid audio was accepted");
    });
    await check("Pre-aborted real loader rejects with AbortError", async () => {
      const controller = new AbortController(); controller.abort();
      try { await load(wavUrl, { signal: controller.signal }); } catch (error) {
        require(error.name === "AbortError", "Wrong cancellation error"); return;
      }
      throw new Error("Cancelled load was accepted");
    });
    await check("Queue recovers from invalid audio then decodes valid WAV", async () => {
      // Map a same-origin fixture URL to an in-memory WAV; native fetch still reads it.
      const mappedLoad = createAudioLoader({ audioContext: context, fetchImpl: (url, options) =>
        fetch(url.endsWith("generated.wav") ? wavUrl : url, options) });
      const queue = new AudioTaskQueue({ load: mappedLoad, concurrency: 1, baseUrl: location.href });
      const tasks = [queue.enqueue(location.href), queue.enqueue("generated.wav")];
      const settled = await Promise.allSettled(tasks.map((task) => task.promise));
      require(settled[0].status === "rejected" && settled[1].status === "fulfilled", "Queue did not recover");
      require(settled[1].value instanceof AudioBuffer, "Queue result is not an AudioBuffer");
      require(queue.getSnapshot().map((entry) => entry.state).join() === "failed,ready", "Wrong queue states");
    });
  } catch (error) {
    results.push(`FAIL: Test setup: ${error.message}`);
  } finally {
    if (wavUrl) URL.revokeObjectURL(wavUrl);
    if (context) await check("Owned AudioContext closes after tests", async () => {
      await context.close(); require(context.state === "closed", "Context did not close");
    });
    const passed = results.filter((result) => result.startsWith("PASS:")).length;
    output.replaceChildren(document.createTextNode(results.join("\n")));
    summary.replaceChildren(document.createTextNode(`${passed}/${results.length} checks passed`));
    button.disabled = false;
  }
});
