# HW2 - Audio Queue and Resource Lifecycle Contract

## 1. Scope

This is the T02 specification. T03 implements the scheduler, enqueue and snapshots;
its controlled-loader tests are recorded in HW2_VERIFICATION.md. T04 provides the
real download/decode adapter with browser verification. T05 implements queue
cancellation, terminal-entry removal and disposal. T06 implements the playback
lifecycle with an injected AudioContext and AnalyserNode. T08 adds queue/player
subscriptions and accessible application controls. T09 adds checked-in,
reproducible WAV fixtures and their source/license notes.
FIFO start order and a default concurrency limit of 2 are project decisions.

## 2. Task Identity and State

Each enqueue operation has a unique, stable ID, including duplicate URLs.
IDs are never reused during a queue instance's lifetime.
Internal entries contain id, normalized URL, state, controller, promise settlement
callbacks, optional buffer and error, and whether the loader still occupies a slot.
Playback state is separate from task state.

Allowed task transitions:

- pending -> downloading
- downloading -> decoding
- decoding -> ready
- downloading/decoding -> failed
- pending/downloading/decoding -> cancelled

Ready, failed and cancelled are terminal. Late phase reports or results cannot
change terminal entries. Task completion does not automatically start playback.

## 3. Queue API

Constructor options: { load, concurrency = 2, baseUrl }.
load must be a function; concurrency must be a positive integer.
Invalid constructor arguments throw TypeError or RangeError.

Injected loader contract:

    load(url, { signal, onPhase }) -> Promise<AudioBuffer>

The scheduler marks downloading before invoking load. The loader reports decoding
after the complete response body is available and before calling decodeAudioData.
The queue also handles synchronous loader throws as task failures.
Resolving without reporting decoding is a loader contract violation and rejects
the task with TypeError; subsequent tasks still run.

Public methods:

- enqueue(url) -> { id, promise }: register and schedule a task.
- cancel(id) -> boolean: whether an unfinished task became cancelled.
- remove(id) -> boolean: remove a terminal entry; false for unknown/unfinished IDs.
- getSnapshot() -> array: detached metadata in enqueue order.
- subscribe(listener) -> unsubscribe function: receive metadata after mutations.
- dispose() -> void: idempotently prevent new work and release queue ownership.

enqueue validates before allocating an ID or scheduling. A non-empty string must
resolve against baseUrl to an HTTP(S) URL without embedded username/password.
Invalid input throws TypeError synchronously. enqueue after disposal throws an
InvalidStateError synchronously. Relative fixture paths are supported via baseUrl.

Each returned promise resolves with its AudioBuffer on success, rejects with an
AbortError on cancellation, or rejects with the loader failure. It settles once.
Callers attach rejection handling immediately and release resolved buffers when done.

Snapshots contain id, url, state and error metadata, but no AudioBuffers,
controllers or settlement callbacks. Mutating a snapshot cannot mutate the queue.
subscribe does not invoke immediately; the caller reads getSnapshot initially.
Subscriber errors must not stop scheduling or prevent other subscribers receiving
updates. No subscriber callbacks occur after disposal; unsubscribe is idempotent.

## 4. FIFO and Bounded Concurrency

Pending tasks start in enqueue order, skipping cancelled tasks.
With limit 2, A and B may run together; C starts when one operation settles.
Completion order may differ from start order. Results remain associated with IDs.

A slot covers download, response body reading and decoding. Occupied slots never
exceed the limit. Each started operation releases its slot exactly once when its
loader settles, including a throw, rejection or late result after cancellation.
Failure does not stall subsequent tasks.

## 5. Loader and Cancellation

Use fetch(url, { signal }), check response.ok, read the complete ArrayBuffer,
then decodeAudioData. HTTP, body-reading and decoding failures reject the loader.
Check cancellation before starting decode and after decode resolves.
createAudioLoader({ audioContext, fetchImpl = globalThis.fetch }) returns load.
Download/body/HTTP failures reject with AudioLoadError(stage = "download");
decode failures use stage = "decode". The original failure is preserved as cause.
AbortError remains distinct from download/decode failures.

Pending cancellation removes eligibility to start and rejects the public promise.
Downloading cancellation aborts the controller and rejects the public promise.
decodeAudioData has no AbortSignal parameter: cancellation during decoding rejects
the public promise immediately, but the underlying operation may continue.
Discard any late buffer and do not publish ready or change cancelled to failed.

The occupied slot remains reserved until that underlying operation settles.
Cancellation therefore does not promise immediate physical decoding interruption.
Repeated cancellation of terminal/unknown IDs returns false.
If cancellation and completion race, the first terminal transition wins.

## 6. Removal and Disposal

The application stops playback before removing the playing entry.
Removing a terminal entry releases queue-owned buffer references and callbacks.
An in-flight cancelled operation retains only the bookkeeping needed to settle and
release its slot; its completion cannot recreate a removed entry.

dispose marks the queue disposed before aborting work, rejects unfinished public
promises with AbortError, clears pending entries/subscribers and releases retained
buffers. Already settled promises stay settled. Late operations are observed to
avoid unhandled rejections, release their slots, and cannot start new tasks.
getSnapshot returns an empty array after disposal; subscribe then throws
InvalidStateError. cancel/remove return false for entries already cleared.

## 7. Playback Contract

Create or resume AudioContext from a user gesture; expose resume/start failures.
Player API: play(id, buffer) -> Promise<void>, stop() -> void, dispose() -> void.
States: idle, playing and disposed. play resolves when playback starts, not at end.
Only one track plays. Each play creates a fresh AudioBufferSourceNode and stops
the previous source. Playback restarts from the beginning; pause is out of scope.

Use a request generation token around asynchronous resume: only the latest play
request may start. stop/dispose invalidate pending starts. Superseded play promises
reject with AbortError. play after disposal rejects with InvalidStateError.

Natural completion and explicit stop disconnect the source, clear onended, release
the source/buffer reference and return to idle. Stale ended callbacks cannot stop
newer playback. stop/dispose are idempotent. Stop does not cancel queue tasks.

## 8. Audio Graph and FFT

    AudioBufferSourceNode -> AnalyserNode -> AudioContext.destination

Default fftSize is 512, producing frequencyBinCount 256.
If a 512-bin mode is added, its fftSize is 1024.
Read frequencyBinCount when allocating a reusable Uint8Array.
Changing FFT settings requires resizing that array once, not every frame.

The slide's 256/512-bin wording is interpreted as frequency-bin count.
This interpretation is a documented design decision, not a verified instructor clarification.

## 9. Visualizer Lifecycle

Canvas uses requestAnimationFrame with at most one active loop.
start is idempotent while running. stop cancels the scheduled frame and clears
Canvas. dispose also removes owned resize listeners/observers and prevents restart.
Drawing checks lifecycle state before scheduling another frame.
Start drawing when playback starts; stop on playback stop, end, error or disposal.
Use display size and device pixel ratio for Canvas sizing.
Frames reuse data arrays and draw Canvas without rebuilding application DOM/state.
60fps is a target to measure, not a guaranteed or already verified result.

## 10. Ownership and Application Disposal

The application owns the queue, player, analyser, visualizer and AudioContext.
Child modules do not close externally supplied contexts.
Final application disposal first blocks further UI actions, disposes the queue,
stops/disposes playback and visualization, removes application listeners,
disconnects owned nodes, closes the owned context and releases buffer references.
Observe pending async work; context closure does not replace late-result guards.
Closing errors are handled and recorded rather than causing unhandled rejection.

## 11. Verification Scenarios

- Enqueue A/B/C at limit 2: A/B start first; C waits for a settled operation.
- B finishes first: B's promise resolves correctly and C starts next.
- A throws or rejects: its promise rejects once and scheduling continues.
- Cancel pending C: it never reaches the loader.
- Cancel decoding A: public promise rejects, its slot stays occupied until settle.
- Repeated cancel/remove/dispose: no duplicate settlement or resurrected entries.
- Mutate a snapshot or throw in a subscriber: internal state/scheduling survives.
- Play twice around delayed resume: only the latest request starts.
- Stop during resume: no delayed audio starts afterward.
- Repeat play/stop/start visualizer: fresh sources, one loop, explicit cleanup.

These are future test targets. No runtime checks are claimed by this specification.

## 12. API References Reviewed for T02

- Web Audio specification, decodeAudioData signature:
  https://webaudio.github.io/web-audio-api/#dom-baseaudiocontext-decodeaudiodata
- AnalyserNode frequencyBinCount relationship:
  https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount
