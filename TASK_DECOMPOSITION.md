# HW2 - Concurrent FIFO Audio Visualizer: Task Decomposition

## 1. Scope and Status

- Repository: https://github.com/Bo-hwi/lab02-web-application
- Branch: `hw2/audio-queue`
- Baseline commit: `2b6135f`
- Assignment source: Lab 02, slide 31.
- Status: T01-T13 complete; HW2 is submitted on `hw2/audio-queue`.
- Technology: HTML, CSS and vanilla JavaScript with native browser APIs.
- Submission language: English.
- HW1 and HW3 remain on separate branches.
- Existing baseline documentation is preserved in Git history.

## 2. Assignment Requirements

| ID | Requirement | Verification evidence |
|---|---|---|
| R01 | Integrate Web Audio API and AnalyserNode for frequency analysis | Browser playback and analyser checks |
| R02 | Implement a FIFO queue for concurrent track downloads and audio decoding | Queue ordering, concurrency and failure tests |
| R03 | Support cancellation through AbortController | Pending and active cancellation tests |
| R04 | Explicitly clean up AudioBufferSourceNodes and other owned resources | Lifecycle tests and browser inspection |
| R05 | Use requestAnimationFrame for a Canvas or SVG visualizer targeting 60fps | Browser performance recording |
| R06 | Avoid excessive UI updates and memory leaks | Repeated interaction and cleanup checks |

The slide's code is reference material and must be independently verified.

## 3. Design Decisions Confirmed in T02

These are implementation choices, not additional instructor requirements.

- Use Canvas for the frequency visualizer.
- Use bundled, licensed audio samples with documented sources.
- Serve the project over local HTTP.
- Start or resume AudioContext after a user gesture.
- Use a bounded concurrency limit, initially 2.
- FIFO applies to the order in which pending tasks start.
- Tasks may finish in a different order.
- Keep displayed queue entries in enqueue order.
- Play one decoded track at a time.
- Cancellation rejects unfinished queue work; playback stop leaves ready tasks available.
- Use fftSize 512 for 256 frequency bins; 512 bins would require fftSize 1024.
- Distinguish abortable downloads from non-abortable decoding.
- Discard late decode results after cancellation or disposal.
- Keep a cancelled operation's concurrency slot until its loader actually settles.
- Release retained audio buffers when entries are removed.
- Avoid recreating application state on each animation frame.
- Use meaningful commits after verified work.

## 4. Proposed Structure

```text
index.html
css/
  audio.css
js/
  audio/
    queue.js
    loader.js
    player.js
    visualizer.js
    main.js
audio/
  README.md
tests/
  audio-queue.test.js
  audio-lifecycle-test.html
  audio-lifecycle.test.js
docs/
  contracts/
    audio-queue.md
  verification/
    HW2_VERIFICATION.md
README.md
TASK_DECOMPOSITION.md
AI_FAILURE_AUDIT.md
project-rules.md
```

Adjust filenames when implementation decisions require it.
The README must eventually reflect the actual structure.

## 5. Workflow

1. Define the task contract.
2. Implement one isolated change.
3. Run focused verification.
4. Review the diff and tracked files.
5. Commit verified work with a meaningful message.
6. Update this document with actual evidence.
7. Push completed checkpoints.

Do not mark planned tests as passed.
Do not create empty commits or fabricate findings.

## 6. Ordered Tasks

### T01 - Establish HW2 Scope

- [x] Create `hw2/audio-queue` from the main baseline.
- [x] Record baseline commit `2b6135f`.
- [x] Add the HW2 task decomposition.
- [x] Update project-rules.md for HW2.
- [x] Rerun available baseline tests.
- [x] Record actual baseline results.

Acceptance: HW2 has a clear scope and a verified starting point.

### T02 - Define Contracts and State Transitions

- [x] Define task IDs, queue entries and public queue methods.
- [x] Define pending, downloading, decoding, ready, failed and cancelled states.
- [x] Define FIFO start order and the concurrency limit.
- [x] Define cancellation before starting, during download and during decoding.
- [x] Specify exactly when task promises resolve or reject.
- [x] Define playback, stop, removal and disposal behavior.
- [x] Specify fftSize and expected frequencyBinCount.
- [x] Document ownership and cleanup of audio and animation resources.

Acceptance: behavior can be tested without ambiguity.

### T03 - Implement the Bounded FIFO Scheduler

- [x] Assign stable task IDs.
- [x] Start pending tasks in FIFO order.
- [x] Enforce the concurrency limit.
- [x] Continue processing after a task fails.
- [x] Settle each task promise exactly once.
- [x] Test ordering, concurrency and out-of-order completion.

Acceptance: concurrent execution never exceeds the configured limit.

### T04 - Implement Download and Decode

- [x] Download audio using fetch with AbortSignal.
- [x] Reject unsuccessful HTTP responses.
- [x] Decode downloaded data using AudioContext.
- [x] Report download and decode failures clearly.
- [x] Test the loader with controlled dependencies.
- [x] Verify real audio decoding in the browser.

Acceptance: valid audio becomes an AudioBuffer and failures do not stall the queue.

### T05 - Implement Cancellation and Queue Disposal

- [x] Cancel a pending task without starting it.
- [x] Abort an active download.
- [x] Ignore late decode results after cancellation.
- [x] Prevent cancelled tasks from becoming ready.
- [x] Release cancelled operations' scheduler slots only after their loaders settle.
- [x] Cancel or reject unfinished tasks during disposal.
- [x] Test repeated cancellation and disposal.

Acceptance: cancellation is predictable and the queue continues safely.

### T06 - Implement Audio Playback

- [x] Create or resume AudioContext after a user gesture.
- [x] Create a new AudioBufferSourceNode for each playback.
- [x] Connect the playback graph through AnalyserNode.
- [x] Implement play and stop behavior.
- [x] Stop and disconnect old source nodes.
- [x] Clear ended handlers and retained source references.
- [x] Verify repeated play and stop interactions.

Acceptance: playback does not overlap unintentionally or reuse a started source node.

### T07 - Implement the Frequency Visualizer

- [x] Configure AnalyserNode using the verified FFT contract.
- [x] Reuse the frequency data array.
- [x] Draw using Canvas and requestAnimationFrame.
- [x] Maintain at most one animation loop.
- [x] Cancel animation when stopped or disposed.
- [x] Handle Canvas resizing and device pixel ratio.
- [x] Check visualizer behavior during a native audio signal and silence.

Acceptance: the visualizer responds to audio without creating duplicate loops.

### T08 - Build Queue Controls and Accessible Feedback

- [x] Display entries in enqueue order with stable IDs.
- [x] Provide enqueue, cancel, play, stop and remove controls.
- [x] Display useful task states and errors.
- [x] Label controls and preserve visible keyboard focus.
- [x] Announce important state changes appropriately.
- [x] Keep animation frames separate from routine DOM updates.
- [x] Verify keyboard operation and empty states.

Acceptance: users can operate the queue and understand its current state.

### T09 - Prepare Reproducible Audio Fixtures

- [x] Add small audio samples permitted for redistribution.
- [x] Record sources and licenses.
- [x] Include a documented failure scenario.
- [x] Avoid dependence on unrelated remote servers.
- [x] Verify sample URLs over the local HTTP server.

Acceptance: another person can reproduce playback and queue tests.

### T10 - Verify Lifecycle and Memory Cleanup

- [x] Repeat enqueue, cancel, play, stop and remove cycles.
- [x] Verify source nodes are stopped and disconnected.
- [x] Verify removed entries release owned buffer references.
- [x] Verify disposal removes listeners and cancels animation.
- [x] Inspect memory behavior after repeated cycles.
- [x] Record observations and limitations without claiming absolute proof.

Acceptance: no identified retained-resource or duplicate-loop defect remains.

### T11 - Verify Performance and Integration

- [x] Run scheduler, loader and cancellation tests.
- [x] Test multiple tracks and mixed success/failure results.
- [x] Record a browser performance trace during visualization.
- [x] Assess the 60fps target in the recorded environment.
- [x] Check for unnecessary per-frame DOM updates.
- [x] Check browser console errors.
- [x] Rerun relevant baseline tests if shared code changes.

Acceptance: functional and performance results have actual evidence.

### T12 - Write README and AI Audit

- [x] Document setup, sample audio, controls and test instructions.
- [x] Explain FIFO ordering, concurrency and cancellation.
- [x] Explain the audio graph and resource lifecycle.
- [x] Document an observed workflow failure with detection and correction; AI authorship is unverified.
- [x] Distinguish observed failures from possible risks.
- [x] Record missing audit evidence honestly.
- [x] Document browser and performance limitations.

Acceptance: documentation matches the implementation and actual evidence.

### T13 - Review and Submit

- [x] Review R01-R06 and every required task.
- [x] Reconcile task statuses and verification records.
- [x] Inspect tracked files and commit history.
- [x] Confirm no secrets or unrelated temporary files are included.
- [x] Verify the README procedure from committed files and recorded browser evidence.
- [x] Push the HW2 branch.
- [x] Compare local and remote commit IDs at the T12 checkpoint; repeat after this commit is pushed.
- [x] Record the submission branch URL.

Acceptance: GitHub contains the verified source and matching documentation.

## 7. Minimum Verification Matrix

| Area | Scenario | Expected result |
|---|---|---|
| FIFO | Enqueue A, B and C | Tasks start in enqueue order |
| Concurrency | Enqueue more tasks than the limit | Active tasks never exceed the limit |
| Completion | B finishes before A | Results remain associated with the correct task |
| Failure | One task fails | Remaining tasks continue |
| Cancellation | Cancel a pending task | It never starts |
| Cancellation | Cancel during download | Fetch is aborted and the task is cancelled |
| Cancellation | Cancel during decoding | Late results are discarded |
| Playback | Play the same track repeatedly | A fresh source node is created each time |
| Playback | Stop and replace a track | Previous source is stopped and disconnected |
| Visualizer | Start repeatedly | Only one animation loop runs |
| Disposal | Dispose during active work | Owned resources are released |
| Memory | Repeat interaction cycles | No identified accumulating retained references |
| Performance | Record active visualization | Frame behavior is assessed against the 60fps target |
| Accessibility | Operate with keyboard | Controls are usable and focus is visible |

## 8. Progress and Evidence Log

| Task | Status | Evidence | Commit |
|---|---|---|---|
| T01 | Complete | HW2 scope and rules recorded; baseline 2b6135f verified: Node 6/6, browser DOM 9/9 and XSS 8/8 PASS. Details in docs/verification/HW2_VERIFICATION.md. | c954fa7; scope and baseline documentation commits |
| T02 | Complete | All eight contract items reviewed; FIFO, bounded concurrency, cancellation races, promise settlement, playback, FFT and ownership specified in docs/contracts/audio-queue.md. The implementation was verified in T03-T11. | 3ef91ff |
| T03 | Complete | Scheduler syntax check and 12/12 controlled-loader tests PASS: FIFO starts, limits 1/2/3, out-of-order results, failure recovery, stable IDs, exactly-once settlement and detached snapshots. Real audio and cancellation were completed in T04-T05. | 8563177 |
| T04 | Complete | Loader and scheduler Node tests 23/23 PASS; browser real WAV decode, invalid audio, abort guard, queue recovery and context cleanup 5/5 PASS. See HW2_VERIFICATION.md. | e421772 |
| T05 | Complete | 14 cancellation and disposal tests PASS; combined queue, loader and cancellation suite 37/37 PASS. Pending and active cancellation, fetch abort, late decode results, slot retention, removal, disposal and reentrancy verified. See HW2_VERIFICATION.md. | 47eac15 |
| T06 | Complete | Player lifecycle tests 7/7 PASS; native browser playback checks 6/6 PASS using a user click, AudioContext and 256-bin analyser; prior queue/loader/cancellation suite 37/37 PASS. See HW2_VERIFICATION.md. | c7a5599 |
| T07 | Complete | Visualizer Node tests 5/5 PASS; native browser Canvas and analyser checks 7/7 PASS with a silent frame and a muted oscillator signal. The combined audio suite passed 49/49; baseline engine suite passed 6/6. See HW2_VERIFICATION.md. | 1e6d9f4 |
| T08 | Complete | Queue and player subscriptions drive the HTML controls and live status; 51/51 audio Node tests PASS. Browser HTTP check confirmed Enter enqueues, a failed URL reports HTTP 404, Remove restores focus to the URL field and the empty state. Local playable samples were added in T09. See HW2_VERIFICATION.md. | 3092efc |
| T09 | Complete | Two generated 0.75-second mono PCM WAV fixtures and CC0-1.0/source notes committed. Both served locally as audio/wav HTTP 200 at 24,044 bytes; missing fixture returned HTTP 404. Browser queue decoded both to Ready and Play announced each track. Fixture format tests 2/2 PASS. See HW2_VERIFICATION.md. | 6a7e5f2 |
| T10 | Complete | Controlled Node and native browser checks completed 100 cancel/play/stop/remove cycles; source cleanup, buffer release, one animation loop and disposal were checked. One-time heap readings are inconclusive; see HW2_VERIFICATION.md. | 5e364ca |
| T11 | Complete | Audio Node suite 54/54 and baseline engine 6/6 PASS. Browser queue held two Ready fixtures and one expected HTTP 404 failure; both valid tracks played. A 120-interval visualizer trace measured 59.98 average fps, 16.7 ms median, 16.9 ms p95, no interval above 33.33 ms and no observed per-frame DOM mutations. No browser JavaScript errors were reported. See HW2_VERIFICATION.md and HW2_PERFORMANCE_TRACE.md for conditions and limits. | 8d3b874 |
| T12 | Complete | README documents local setup, controls, queue and playback lifecycle, tests, fixture provenance and limits. AI_FAILURE_AUDIT.md records the observed T06 timing failure, correction, unverified attribution and remaining risks. See HW2_VERIFICATION.md. | c4ac1a3 |
| T13 | Complete | Reviewed R01-R06, tracked files, commit history, documentation, tests and prior browser evidence. T12 local and remote commit IDs matched after push; submission URL recorded in HW2_VERIFICATION.md. | Final T13 documentation commit |


## 9. Definition of Done

- [x] R01-R06 have actual verification evidence, with the stated measurement limits.
- [x] Required tasks are complete.
- [x] FIFO, concurrency, failure and cancellation tests pass.
- [x] Browser playback and visualizer checks pass.
- [x] Lifecycle and performance observations are recorded.
- [x] README, audit and task statuses match the actual work.
- [x] Audio sample licenses and sources are documented.
- [x] Commits are meaningful and HW2 is isolated on its branch.
- [x] Local and remote commits matched at the T12 checkpoint; the final T13 push is verified separately.
