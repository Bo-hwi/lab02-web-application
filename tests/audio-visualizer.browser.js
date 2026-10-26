import { FrequencyVisualizer } from "../js/audio/visualizer.js";

const button = document.getElementById("run");
const summary = document.getElementById("summary");
const output = document.getElementById("results");
const canvas = document.getElementById("visualizer");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const require = (condition, message) => { if (!condition) throw new Error(message); };

function hasPaintedPixels() {
  const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] > 0) return true;
  }
  return false;
}

button.addEventListener("click", async () => {
  button.disabled = true;
  summary.textContent = "Running";
  const results = [];
  const check = async (name, action) => {
    try { await action(); results.push(`PASS: ${name}`); }
    catch (error) { results.push(`FAIL: ${name}: ${error.message}`); }
  };
  let context;
  let source;
  let visualizer;
  try {
    context = new AudioContext();
    await context.resume();
    const analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0;
    const mutedOutput = context.createGain();
    mutedOutput.gain.value = 0;
    analyser.connect(mutedOutput).connect(context.destination);
    visualizer = new FrequencyVisualizer({ canvas, analyserNode: analyser, windowObject: window });
    await check("Native analyser is configured with 512 FFT samples and 256 bins", () => {
      require(analyser.fftSize === 512 && analyser.frequencyBinCount === 256, "Unexpected analyser configuration");
    });
    await check("Canvas bitmap matches display dimensions and device pixel ratio", () => {
      const bounds = canvas.getBoundingClientRect();
      require(canvas.width === Math.round(bounds.width * devicePixelRatio) &&
        canvas.height === Math.round(bounds.height * devicePixelRatio), "Canvas bitmap is not scaled");
    });
    await check("Silent analyser produces an empty Canvas", async () => {
      require(visualizer.start(), "Visualizer did not start");
      await wait(120);
      require(!hasPaintedPixels(), "Silence painted bars");
    });
    await check("Repeated start does not create another animation loop", () => {
      require(visualizer.start() === false, "Repeated start was accepted");
    });
    await check("Native oscillator paints frequency bars without audible output", async () => {
      source = context.createOscillator();
      source.frequency.value = 440;
      source.connect(analyser);
      source.start();
      await wait(250);
      require(hasPaintedPixels(), "Audio did not paint the Canvas");
    });
    await check("Stop clears the Canvas and cancels drawing", async () => {
      visualizer.stop();
      require(visualizer.state === "idle" && !hasPaintedPixels(), "Stop did not clear the Canvas");
      await wait(100);
      require(!hasPaintedPixels(), "A later frame repainted after stop");
    });
    await check("Disposed visualizer cannot restart", () => {
      visualizer.dispose();
      try { visualizer.start(); } catch (error) {
        require(error.name === "InvalidStateError", "Unexpected disposal error");
        return;
      }
      throw new Error("Visualizer restarted after disposal");
    });
  } catch (error) {
    results.push(`FAIL: Test setup: ${error.message}`);
  } finally {
    visualizer?.dispose();
    if (source) { source.stop(); source.disconnect(); }
    if (context) await context.close();
    output.textContent = results.join("\n");
    summary.textContent = `${results.filter((item) => item.startsWith("PASS:")).length}/${results.length} checks passed`;
    button.disabled = false;
  }
});
