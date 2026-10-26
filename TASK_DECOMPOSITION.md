# HW2 - Concurrent FIFO Audio Visualizer: Task Decomposition

## 1. Scope and Status

- Repository: https://github.com/Bo-hwi/lab02-web-application
- Branch: `hw2/audio-queue`
- Baseline commit: `2b6135f`
- Assignment source: Lab 02, slide 31.
- Status: planning; implementation and verification are pending.
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

## 3. Design Decisions to Confirm in T02

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
- Define the difference between task cancellation and playback stopping.
- Verify the relationship between fftSize and frequencyBinCount.
- Distinguish abortable downloads from non-abortable decoding.
- Discard late decode results after cancellation or disposal.
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
- [ ] Add the HW2 task decomposition.
- [ ] Update project-rules.md for HW2.
- [ ] Rerun available baseline tests.
- [ ] Record actual baseline results.

Acceptance: HW2 has a clear scope and a verified starting point.

### T02 - Define Contracts and State Transitions

- [ ] Define task IDs, queue entries and public queue methods.
- [ ] Define pending, downloading, decoding, ready, failed and cancelled states.
- [ ] Define FIFO start order and the concurrency limit.
- [ ] Define cancellation before starting, during download and during decoding.
- [ ] Specify exactly when task promises resolve or reject.
- [ ] Define playback, stop, removal and disposal behavior.
- [ ] Specify fftSize and expected frequencyBinCount.
- [ ] Document ownership and cleanup of audio and animation resources.

Acceptance: behavior can be tested without ambiguity.

### T03 - Implement the Bounded FIFO Scheduler

- [ ] Assign stable task IDs.
- [ ] Start pending tasks in FIFO order.
- [ ] Enforce the concurrency limit.
- [ ] Continue processing after a task fails.
- [ ] Settle each task promise exactly once.
- [ ] Test ordering, concurrency and out-of-order completion.

Acceptance: concurrent execution never exceeds the configured limit.

### T04 - Implement Download and Decode

- [ ] Download audio using fetch with AbortSignal.
- [ ] Reject unsuccessful HTTP responses.
- [ ] Decode downloaded data using AudioContext.
- [ ] Report download and decode failures clearly.
- [ ] Test the loader with controlled dependencies.
- [ ] Verify real audio decoding in the browser.

Acceptance: valid audio becomes an AudioBuffer and failures do not stall the queue.

### T05 - Implement Cancellation and Queue Disposal

- [ ] Cancel a pending task without starting it.
- [ ] Abort an active download.
- [ ] Ignore late decode results after cancellation.
- [ ] Prevent cancelled tasks from becoming ready.
- [ ] Release scheduler slots after cancellation.
- [ ] Cancel or reject unfinished tasks during disposal.
- [ ] Test repeated cancellation and disposal.

Acceptance: cancellation is predictable and the queue continues safely.

### T06 - Implement Audio Playback

- [ ] Create or resume AudioContext after a user gesture.
- [ ] Create a new AudioBufferSourceNode for each playback.
- [ ] Connect the playback graph through AnalyserNode.
- [ ] Implement play and stop behavior.
- [ ] Stop and disconnect old source nodes.
- [ ] Clear ended handlers and retained source references.
- [ ] Verify repeated play and stop interactions.

Acceptance: playback does not overlap unintentionally or reuse a started source node.

### T07 - Implement the Frequency Visualizer

- [ ] Configure AnalyserNode using the verified FFT contract.
- [ ] Reuse the frequency data array.
- [ ] Draw using Canvas and requestAnimationFrame.
- [ ] Maintain at most one animation loop.
- [ ] Cancel animation when stopped or disposed.
- [ ] Handle Canvas resizing and device pixel ratio.
- [ ] Check visualizer behavior during playback and silence.

Acceptance: the visualizer responds to audio without creating duplicate loops.

### T08 - Build Queue Controls and Accessible Feedback

- [ ] Display entries in enqueue order with stable IDs.
- [ ] Provide enqueue, cancel, play, stop and remove controls.
- [ ] Display useful task states and errors.
- [ ] Label controls and preserve visible keyboard focus.
- [ ] Announce important state changes appropriately.
- [ ] Keep animation frames separate from routine DOM updates.
- [ ] Verify keyboard operation and empty states.

Acceptance: users can operate the queue and understand its current state.

### T09 - Prepare Reproducible Audio Fixtures

- [ ] Add small audio samples permitted for redistribution.
- [ ] Record sources and licenses.
- [ ] Include a documented failure scenario.
- [ ] Avoid dependence on unrelated remote servers.
- [ ] Verify sample URLs over the local HTTP server.

Acceptance: another person can reproduce playback and queue tests.

### T10 - Verify Lifecycle and Memory Cleanup

- [ ] Repeat enqueue, cancel, play, stop and remove cycles.
- [ ] Verify source nodes are stopped and disconnected.
- [ ] Verify removed entries release owned buffer references.
- [ ] Verify disposal removes listeners and cancels animation.
- [ ] Inspect memory behavior after repeated cycles.
- [ ] Record observations and limitations without claiming absolute proof.

Acceptance: no identified retained-resource or duplicate-loop defect remains.

### T11 - Verify Performance and Integration

- [ ] Run scheduler, loader and cancellation tests.
- [ ] Test multiple tracks and mixed success/failure results.
- [ ] Record a browser performance trace during visualization.
- [ ] Assess the 60fps target in the recorded environment.
- [ ] Check for unnecessary per-frame DOM updates.
- [ ] Check browser console errors.
- [ ] Rerun relevant baseline tests if shared code changes.

Acceptance: functional and performance results have actual evidence.

### T12 - Write README and AI Audit

- [ ] Document setup, sample audio, controls and test instructions.
- [ ] Explain FIFO ordering, concurrency and cancellation.
- [ ] Explain the audio graph and resource lifecycle.
- [ ] Document actual AI failures with detection and corrections.
- [ ] Distinguish observed failures from possible risks.
- [ ] Record missing audit evidence honestly.
- [ ] Document browser and performance limitations.

Acceptance: documentation matches the implementation and actual evidence.

### T13 - Review and Submit

- [ ] Review R01-R06 and every required task.
- [ ] Reconcile task statuses and verification records.
- [ ] Inspect tracked files and commit history.
- [ ] Confirm no secrets or unrelated temporary files are included.
- [ ] Verify the README procedure from committed files.
- [ ] Push the HW2 branch.
- [ ] Compare local and remote commit IDs.
- [ ] Record the submission branch URL.

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
| T01 | In progress | Branch created from baseline 2b6135f; baseline tests pending | Not yet recorded |
| T02-T13 | Not started | Not yet recorded | Not yet recorded |

## 9. Definition of Done

- [ ] R01-R06 have actual verification evidence.
- [ ] Required tasks are complete.
- [ ] FIFO, concurrency, failure and cancellation tests pass.
- [ ] Browser playback and visualizer checks pass.
- [ ] Lifecycle and performance observations are recorded.
- [ ] README, audit and task statuses match the actual work.
- [ ] Audio sample licenses and sources are documented.
- [ ] Commits are meaningful and HW2 is isolated on its branch.
- [ ] Local and remote submission commits match.