# HW2 AI Failure and Risk Audit

## Scope and evidence

- Assignment: Lab 02 Web Application Development, Concurrent FIFO Audio Queue.
- Branch: `hw2/audio-queue`.
- Source revision reviewed: `c6d7169e423dd946b1fc0e86dc2294d04dbd7207`.
- Audit update: 2026-10-30, Asia/Saigon.
- Fresh execution environment: Node.js `v24.22.1` on Windows.

This report contains three concrete failures or risks in the AI-assisted
workflow. A historical failure is not presented as a defect reproduced today,
and a tested risk is not presented as a bug that was necessarily present in
the implementation. The repository does not preserve all prompts or rejected
drafts, so model-specific authorship and failure rates cannot be established.
Only this report is changed by this update.

## Finding 1: A short fixed wait produced a false browser-test failure

**Classification:** Historically recorded test-timing failure; not rerun in a
native browser during this audit.

**Context and symptom:** The T06 entry in
[`HW2_VERIFICATION.md`](docs/verification/HW2_VERIFICATION.md) records an initial
5/6 player result when the test waited 250 ms for the native `ended` event.
An AI assistant could interpret this timing-dependent assertion as proof of
a production cleanup defect.

**Detection:** The recorded check passed 6/6 after increasing the wait to
1000 ms. The current `tests/audio-player.browser.js` contains that 1000 ms wait.
The saved report is evidence of the historical observation; it is not a
retained raw failing trace or proof that AI introduced the original wait.

**Corrective action:** The test budget was increased without changing
production playback to match an arbitrary 250 ms threshold. Tests should
separate a bounded observation timeout from the audio lifecycle condition
being asserted. A longer fixed wait remains sensitive to a heavily loaded or
suspended browser and is not a real-time guarantee.

**Verification and limit:** Current controlled player tests passed as part of
the 54-test audio suite. The historical native-browser 6/6 result was not
repeated today; actual audible quality was not assessed.

**Lesson:** A failed timing assertion must be investigated before changing the
implementation to satisfy the test.

## Finding 2: Cancellation can release a slot too early or publish stale results

**Classification:** Concrete concurrency/lifecycle risk; controlled cases
passed in this audit, with no new failure observed.

**Context and risk:** Fetch can be aborted, but a started decode may still
settle later. An AI-generated implementation could mark a task cancelled,
immediately reuse its active slot and then accept a late decoded result. That
can exceed the concurrency bound or turn a cancelled task back into Ready.

**Detection evidence:** `tests/audio-cancellation.test.js` includes checks named
`active cancellation aborts signal but retains its slot until late success`,
`late decode rejection cannot overwrite cancellation or stall following work`
and `real loader adapter holds a cancelled decode slot until decode settles`.
The queue tests also check FIFO start order, concurrency limits and recovery
after a rejected task. These are specific exercised cases, not just an audit
assertion that the code looks correct.

**Corrective action/control:** Retain an occupied slot until its loader settles,
ignore late results after cancellation or disposal, settle each ticket once,
and keep remaining pending work in FIFO order. The controls already exist in
the reviewed revision; this documentation update introduces no new code fix.

**Verification and limit:** The cancellation and scheduler tests passed within
the fresh 54-test audio suite. Controlled dependencies do not reproduce every
native browser decoder, network race or device condition.

**Lesson:** Cancellation of an observable task and settlement of its underlying
operation are distinct lifecycle events.

## Finding 3: Finite cleanup and frame tests can be overstated as universal guarantees

**Classification:** Evidence-interpretation risk supported by the checked-in
test harness and performance trace; no new leak or frame-rate defect claimed.

**Context and risk:** An AI report could turn a passing 100-cycle harness into
"zero memory leaks", or one short visualizer trace into "always 60 fps".
Both claims exceed the measurements.

**Detection evidence:** `tests/audio-lifecycle.test.js` runs 100 controlled
cycles with simulated animation, canvas and audio dependencies. The historical
T10 heap observations use different garbage-collection conditions.
[`HW2_PERFORMANCE_TRACE.md`](docs/verification/HW2_PERFORMANCE_TRACE.md) contains
120 frame intervals from one visible-tab, muted-oscillator run and reports
approximately 59.98 fps. Its rounded intervals and unrounded elapsed time are
already distinguished in that document. Canvas pixel drawing is not measured
by its DOM MutationObserver count.

**Corrective action/control:** Describe exactly the finite resource counters,
cleanup operations and sampled frame intervals that were observed. Preserve
source-node replacement, disconnect/dispose paths and stale-frame guards.
Do not convert zero pending test resources into a proof about garbage
collection, long sessions or all devices.

**Verification and limit:** The lifecycle and visualizer checks passed in the
fresh Node suite. No fresh heap profiling, native audio playback, visible-tab
frame trace or cross-device measurement was performed on 2026-10-30.

**Lesson:** Performance and memory claims must retain the measurement window,
dependencies and environment that support them.

## Fresh regression verification

Run from this branch's repository root:

```sh
node --test tests/audio-*.test.js
node --test test-runner.js
```

| Check run on 2026-10-30 | Result | Scope |
|---|---|---|
| HW2 audio Node suite | 54 passed, 0 failed, 0 skipped | Queue, loader, cancellation, player, visualizer, fixtures, observer and lifecycle checks |
| Shared renderer normalization suite | 6 passed, 0 failed, 0 skipped | VNode normalization and props; not native browser audio or DOM integration |

Execution used an isolated copy of the reviewed revision. Terminal logs were
retained locally and are not additional submission files. Native browser pages
remain separate from the Node command above. Historical browser results and
their conditions are documented in
[`HW2_VERIFICATION.md`](docs/verification/HW2_VERIFICATION.md).

## Disposition and remaining boundaries

The current Node regression suites passed. This audit records one historical
test-timing failure and two exercised engineering/evidence risks. It does not
establish a model-specific failure rate, leak-free operation, sustained 60 fps,
audible quality or complete WCAG conformance. Keyboard, browser accessibility
and actual screen-reader speech must be reported only where separately
observed. The checked-in audio fixtures are documented generated tones; this
audit did not add third-party music or a remote service.
