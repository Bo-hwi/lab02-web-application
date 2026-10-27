# HW2: Concurrent FIFO Audio Queue

This branch implements the Lab 02 HW2 audio queue with HTML, CSS, vanilla JavaScript, Web Audio and Canvas. No package installation or external library is required. HW1 and HW3 live on separate branches.

## Run locally

From the repository root, start an HTTP server (Python 3):

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/index.html` in a browser with Web Audio and Canvas support. Opening the page as `file://` is unsupported because the application uses JavaScript modules and fetches local WAV files. If port 8765 is occupied, choose another port and use it in the URL.

The URL field starts with `./audio/fixtures/tone-a.wav`. Press **Add to queue**, wait for **Ready**, then press **Play**. Add `./audio/fixtures/tone-b.wav` for a second track. The fixtures are original generated 0.75-second sine tones; their source, CC0-1.0 license and regeneration instructions are in [`audio/fixtures/README.md`](audio/fixtures/README.md). Use `./audio/fixtures/missing.wav` to see an intentional HTTP 404 failure.

## Controls and behavior

- **Add to queue** starts a download and decode task. Tasks begin in enqueue order; up to two run at once. They may finish in a different order, while each result remains attached to its task ID.
- **Cancel** rejects pending or active work. A pending task never starts. An active fetch uses `AbortController`; decoding cannot be aborted, so any late result is ignored. A cancelled operation retains its concurrency slot until its loader settles.
- **Play** is available for Ready tasks and starts one track at a time. **Stop** ends current playback while leaving the decoded task Ready. **Remove** releases a terminal task and its retained buffer.
- The queue list and status message expose task state and errors. The Canvas shows frequency bars during playback; the text status communicates playback without relying on the animation.

Playback uses `AudioBufferSourceNode → AnalyserNode → AudioContext.destination`. The analyser uses `fftSize = 512` (256 frequency bins). Each play creates a fresh source node. Stopping, natural completion and page disposal disconnect owned nodes; page disposal also stops the animation loop, releases buffers and closes the application-owned context. The context is created after a user action to satisfy browser playback policy. The full behavior contract is in [`docs/contracts/audio-queue.md`](docs/contracts/audio-queue.md).

## Verify

Node.js with the built-in test runner is needed for automated tests; no `npm install` is needed. Run from the repository root:

```sh
node --test tests/audio-*.test.js
node --test test-runner.js
```

For native browser checks, open `tests/audio-loader-test.html`, `tests/audio-player-test.html`, `tests/audio-visualizer-test.html`, `tests/audio-lifecycle-test.html` and `tests/audio-performance-test.html` through the same HTTP server. Follow each page's on-screen controls. The latest recorded results and their conditions are in [`docs/verification/HW2_VERIFICATION.md`](docs/verification/HW2_VERIFICATION.md); the frame trace is in [`docs/verification/HW2_PERFORMANCE_TRACE.md`](docs/verification/HW2_PERFORMANCE_TRACE.md).

The 60 fps observation is a short visible-tab trace on one device. Heap observations do not prove the absence of every memory leak. Browser autoplay policy, device load, audio output and timing can change results. The AI review and missing evidence are documented in [`AI_FAILURE_AUDIT.md`](AI_FAILURE_AUDIT.md).
