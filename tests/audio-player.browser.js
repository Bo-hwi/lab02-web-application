import { AudioPlayer } from "../js/audio/player.js";

const button = document.getElementById("run");
const summary = document.getElementById("summary");
const output = document.getElementById("results");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

button.addEventListener("click", async () => {
  button.disabled = true;
  summary.textContent = "Running";
  const results = [];
  let context;
  let player;
  const check = async (name, action) => {
    try { await action(); results.push(`PASS: ${name}`); }
    catch (error) { results.push(`FAIL: ${name}: ${error.message}`); }
  };
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  try {
    // Construct and resume only in this trusted click handler.
    context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    player = new AudioPlayer({ audioContext: context, analyserNode: analyser });
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.08), context.sampleRate);
    await check("User gesture resumes a native AudioContext", async () => {
      await player.play("first", buffer);
      require(context.state === "running" && player.state === "playing", "Playback did not start");
    });
    await check("Native analyser has 256 bins at fftSize 512", () => {
      require(analyser.frequencyBinCount === 256, "Unexpected frequency bin count");
    });
    await check("Replacement starts a new track and stop returns to idle", async () => {
      await player.play("second", buffer);
      require(player.currentId === "second", "Replacement did not start");
      player.stop();
      require(player.state === "idle" && player.currentId === null, "Stop did not release playback");
    });
    await check("Native ended event releases the source", async () => {
      await player.play("third", buffer);
      await wait(1000);
      require(player.state === "idle" && player.currentId === null, `Natural end did not release playback (context time ${context.currentTime})`);
    });
    await check("Disposal blocks playback without closing caller context", async () => {
      player.dispose();
      try { await player.play("fourth", buffer); } catch (error) {
        require(error.name === "InvalidStateError" && context.state === "running", "Unexpected disposal behavior");
        return;
      }
      throw new Error("Disposed player accepted playback");
    });
  } catch (error) {
    results.push(`FAIL: Test setup: ${error.message}`);
  } finally {
    player?.dispose();
    if (context) await check("Test closes its owned context", async () => {
      await context.close();
      require(context.state === "closed", "Context remained open");
    });
    const passed = results.filter((result) => result.startsWith("PASS:")).length;
    output.textContent = results.join("\n");
    summary.textContent = `${passed}/${results.length} checks passed`;
    button.disabled = false;
  }
});
