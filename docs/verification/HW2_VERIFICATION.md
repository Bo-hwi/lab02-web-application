# HW2 Verification Report

## T01 - Baseline Verification

- Date: 2026-10-26.
- Branch: hw2/audio-queue.
- Source baseline: 2b6135f.
- Command: node --test test-runner.js.
- Result: 6 passed, 0 failed.
- Browser DOM checks: dom-mount-test.html, 9/9 passed.
- Browser security checks: xss-security-test.html, 8/8 passed.
- Results were run and confirmed by the student.
- HW2 queue, playback and visualizer verification remain pending.

## T02 - Contract and State Transition Review

- Date: 2026-10-26.
- Review type: documentation and API contract review; no HW2 runtime implementation.
- Contract: docs/contracts/audio-queue.md.
- Reviewed all eight T02 checklist items against the written specification.
- Defined stable IDs, detached metadata snapshots, queue methods and task transitions.
- Defined FIFO start order with default concurrency 2; completion may be out of order.
- Clarified exactly-once promise settlement and cancellation/completion races.
- Defined AbortController cancellation for fetch and late decode-result guards.
- Retained slots until underlying loaders settle to preserve the actual concurrency bound.
- Defined removal, idempotent disposal and ownership of retained buffers.
- Defined playback restart, fresh sources, async resume races and cleanup.
- Cross-checked the decodeAudioData signature: no AbortSignal parameter.
- Cross-checked frequencyBinCount = fftSize / 2; default 512 FFT samples gives 256 bins.
- Interpreted the slide's bin wording explicitly as a design decision.
- Defined one animation loop, Canvas sizing, AudioContext ownership and final disposal.
- Updated the T05 slot-release wording to agree with cancellation during decoding.
- Result: T02 specification complete; T03-T13 and Definition of Done remain unchecked.
- Queue, audio, cancellation, memory and performance runtime tests have not run.

References:

- https://webaudio.github.io/web-audio-api/#dom-baseaudiocontext-decodeaudiodata
- https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount

## T03 - Bounded FIFO Scheduler

- Date: 2026-10-26.
- Implementation: js/audio/queue.js.
- Test file: tests/audio-queue.test.js; Node built-in test runner, no dependencies added.
- Syntax command: node --check js/audio/queue.js - PASS.
- Test command: node --test tests/audio-queue.test.js - 12 passed, 0 failed.
- Baseline regression: node --test test-runner.js - 6 passed, 0 failed.
- Git whitespace validation: git diff --check - PASS.
- Controlled loaders verified actual in-flight limits of 1, 2 and 3 over nine tasks each.
- Verified A/B start before C, B can finish before A, and results match their IDs.
- Verified rejected tasks release a slot and preserve the original failure.
- Verified 1,000 synchronous loader failures complete without recursive stack overflow.
- Verified unique IDs for duplicate URLs and detached snapshots, including error metadata.
- Verified repeated thenable settlement attempts do not overwrite results or duplicate work.
- Verified invalid options/URLs, decoding phase reporting, late phase guards and idle restart.
- Clarified in the contract that missing a decoding phase report is a loader violation.
- These tests use synthetic buffers and controlled operations, not real Web Audio decoding.
- T04 real downloads/decoding, T05 cancellation/disposal and T08 subscriptions remain pending.
- No browser playback, memory or performance result is claimed for T03.

## T04 - Download and Decode Adapter

- Date: 2026-10-26.
- Implementation: js/audio/loader.js; createAudioLoader with injected AudioContext/fetch.
- Syntax checks: node --check js/audio/loader.js and node --check tests/audio-loader.browser.js - PASS.
- Command: node --test tests/audio-loader.test.js tests/audio-queue.test.js.
- Result: 23 passed, 0 failed (11 loader tests and 12 scheduler regression tests).
- Verified signal forwarding, full-body decode, decoding phase order and context receiver binding.
- Verified HTTP/network/body errors, synchronous/asynchronous decode errors and preserved causes.
- Verified pre-abort, active fetch abort, cancellation during body reading and late decoding results.
- Verified queue recovery after HTTP/decode failure and ownership of the supplied context.
- Verified error reporting for non-Error rejection values.
- Browser: Codex in-app browser over Live Server, http://127.0.0.1:5500/tests/audio-loader-test.html.
- Final browser result: 5/5 checks passed after clicking Run audio loader tests.
- Native fetch read a Blob URL containing an original generated mono PCM WAV (8000 Hz, 0.1 seconds).
- Real decodeAudioData produced a non-silent AudioBuffer with the expected duration and channels.
- Native HTTP fetch of this test page supplied HTML, correctly rejected at the decode stage.
- Pre-aborted loading rejected with AbortError; the queue then recovered from invalid audio and decoded a valid WAV.
- Browser integration maps a same-origin fixture URL to the generated Blob URL; no claim of a checked-in HTTP WAV asset.
- The test revoked its Blob URL and closed its owned AudioContext; 5th check verified closed state.
- The test emits no audio and does not verify playback, visualization or full queue cancellation/disposal.
- T05-T13 and final Definition of Done remain pending.

## T05 - Cancellation and Queue Disposal

- Date: 2026-10-26.
- Implementation: js/audio/queue.js; cancel, remove and dispose with terminal-state guards.
- Syntax check: node --check js/audio/queue.js - PASS.
- Command: node --test tests/audio-cancellation.test.js tests/audio-loader.test.js tests/audio-queue.test.js.
- Result: 37 passed, 0 failed (14 cancellation/disposal, 11 loader and 12 scheduler tests).
- Pending cancellation rejects with AbortError and prevents the loader from starting; remaining tasks keep FIFO order.
- Active cancellation aborts the signal and rejects the public promise immediately; its scheduler slot remains occupied until the underlying loader settles.
- Late decode success or failure cannot change a cancelled task to ready or failed, including after removal and disposal.
- Controlled real-loader integration verifies fetch abort and cancellation during non-abortable decode.
- Terminal-only removal releases retained buffer references; IDs are not reused. Disposal rejects unfinished work, aborts active signals, prevents new enqueue and ignores late results.
- Repeated cancellation, disposal before/after scheduling and abort-handler reentrancy were checked.
- These are controlled lifecycle tests, not browser playback, memory profiling or performance measurements. T06-T13 and final Definition of Done remain pending.

## T06 - Audio Playback Lifecycle

- Date: 2026-10-26.
- Implementation: `js/audio/player.js` accepts a caller-owned `AudioContext` and `AnalyserNode`; it does not close the context or alter queue tasks.
- Syntax checks: `node --check js/audio/player.js` and `node --check tests/audio-player.browser.js` passed.
- Command: `node --test tests/audio-player.test.js` - 7 passed, 0 failed.
- Controlled tests cover fresh sources, graph connections, replacement, natural end, repeated stop/dispose, asynchronous resume races, late callbacks, start/resume errors and invalid input.
- Browser page: `http://127.0.0.1:5500/tests/audio-player-test.html`. A click constructs the native context, configures `fftSize = 512`, plays a short silent buffer, replaces and stops sources, waits for a natural end, then disposes the player and closes the test-owned context. Final result: 6/6 checks passed.
- An initial browser run waited only 250 ms for `ended` and reported 5/6. The same check passed after increasing the wait to 1000 ms to allow browser audio scheduling; the controlled lifecycle test also verifies natural-end cleanup.
- Existing scheduler, loader and cancellation suite: 37 passed, 0 failed. Baseline engine suite: 6 passed, 0 failed.
- This checks Web Audio playback lifecycle with a silent buffer. Audible music, application playback controls, visualizer behavior, subscriptions and performance remain for later tasks.

## T07 - Frequency Visualizer

- Date: 2026-10-26.
- Implementation: `js/audio/visualizer.js` draws analyser frequency data on Canvas. The caller owns the audio graph and context; connecting the visualizer to the application interface remains for T08.
- Focused Node tests: `node --test tests/audio-visualizer.test.js` — 5 passed, 0 failed. These cover FFT configuration and reusable frequency data, silent and active frames, one animation loop across repeated starts, stop/dispose and stale callbacks, Canvas resizing and device pixel ratio changes, bin count changes, and dependency validation.
- Combined audio suite: `node --test tests/audio-cancellation.test.js tests/audio-loader.test.js tests/audio-player.test.js tests/audio-queue.test.js tests/audio-visualizer.test.js` — 49 passed, 0 failed. Baseline engine suite: `node --test test-runner.js` — 6 passed, 0 failed.
- Browser page: `http://127.0.0.1:5500/tests/audio-visualizer-test.html` — 7/7 checks passed after a user click. The page used a native `AudioContext` and `AnalyserNode` configured with `fftSize = 512` and 256 frequency bins. A muted 440 Hz oscillator produced visible frequency bars; silence left the Canvas empty. Repeated start did not add a loop; stop cleared the Canvas; dispose prevented restart. The test closed its owned audio context.
- This verifies the standalone visualizer and native signal handling. Application queue/player integration, accessible controls and a recorded frame-rate assessment remain for later tasks; no 60 fps result is claimed here.

## T08 - Queue Controls and Accessible Feedback

- Date: 2026-10-27.
- Implementation: \`index.html\`, \`css/audio.css\`, and \`js/audio/main.js\` connect the queue, loader, player and visualizer. The queue and player expose subscriptions. The page creates the AudioContext in the submit gesture and disposes owned resources on pagehide.
- Command: \`node --test tests/audio-observer.test.js tests/audio-queue.test.js tests/audio-cancellation.test.js tests/audio-loader.test.js tests/audio-player.test.js tests/audio-visualizer.test.js\` — 51 passed, 0 failed. \`node --check js/audio/main.js\` and \`git diff --check\` passed.
- Browser check over local HTTP on port 8765: the empty state appeared; pressing Enter on Add to queue created audio-1. The not-yet-added fixture URL returned HTTP 404 and the page announced the failed state and reason. Remove cleared the entry, showed the empty state and returned focus to the URL field.
- Native buttons and form controls retain keyboard activation and visible focus. Queue/player changes update the live text region; Canvas animation does not update the DOM on each frame.
- Successful checked-in fixture playback and local sample URL verification remain for T09. This is not a screen-reader audit or a frame-rate measurement.
