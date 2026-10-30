# HW3 AI Failure and Risk Audit

## Scope and evidence

- Assignment: Lab 02 Web Application Development, Flash-Sale E-Commerce Engine.
- Branch: `hw3/flash-sale`.
- Source revision reviewed: `d4190628529eaadb542a919b5b75d3105b275448`.
- Audit update: 2026-10-30, Asia/Saigon.
- Fresh execution environment: Node.js `v24.22.1` on Windows.

This audit preserves three observed gaps in intermediate AI-assisted revisions
and verifies their source-history evidence. Those gaps were corrected before
the reviewed branch tip. They are not reported as current application failures.
Git records commit authors but cannot prove which lines an AI generated; prompt
archives are not available for that attribution. Only this report changes in
this update.

Historical browser observations are identified as historical. Fresh Node test
results below are separate from browser, screen-reader and performance claims.

## Finding 1: Scheduled hold expiry did not immediately redraw the product state

**Classification:** Historical integration gap, corrected in source; current
controller regression cases passed.

**Symptom:** A hold could expire in the controller while its card retained the
old hold until a later user action or sale-end redraw. Availability and action
buttons were temporarily stale.

**Detection and affected revision:** At `23e98d8`, `js/sale/main.js` had action
and sale-close rendering but no `subscribeInventory` call. Inspecting that
snapshot during this audit confirmed the absent subscription.

**Corrective action:** Commit `72539d7` connected
`controller.subscribeInventory(onInventoryChange)` and updated the interface
and expiry announcement on inventory changes. The subscription is still
present at the reviewed branch tip and is removed during session disposal.

**Verification:** The historical T09 browser record observed the 30-second hold
expire, availability return from 1 to 2 and Reserve reappear without another
action. Current controller/lifecycle checks passed within the fresh 34-test
HW3 suite. That historical visual browser workflow was not rerun today.

**Reproduction reference:** Compare
`git show 23e98d8:js/sale/main.js` with
`git show 72539d7:js/sale/main.js`. An isolated old checkout can demonstrate the
stale card; do not switch an unrelated checkout with uncommitted work.

**Lesson:** A correct state transition is insufficient if the UI is not
subscribed to the transition's source of truth.

## Finding 2: An intermediate countdown omitted required coarse announcements

**Classification:** Historical accessibility-contract gap, corrected in source;
some speech behaviors still have bounded evidence.

**Symptom:** The T09 interface displayed time but did not provide the separate
polite status messages for ten-second milestones and each of the final five
seconds required by the contract.

**Detection and affected revision:** At `72539d7`, `js/sale/main.js` had no
`saleAnnouncement` branch. The old snapshot and the correction were inspected
again during this audit.

**Corrective action:** Commit `d4c86a1` added a separate polite announcement
region and milestone logic, while keeping routine timer updates at
`aria-live="off"`. The reviewed source still contains the ten-second and
final-five-second condition. Routine ticks do not deliberately move focus.

**Verification:** The historical T10 accessibility-tree review observed
ten-second milestone text and the final sale-ended message. It did not
individually observe all final-five-second announcements. A later
Chrome/Windows Narrator follow-up, recorded at the reviewed branch tip,
reports that reservation, checkout/cancellation and expiry statuses were
spoken and that the timer did not speak every second. That student-reported
speech check has no recording or verbatim transcript and does not establish
every milestone or full WCAG conformance. No fresh speech test was run today.

**Reproduction reference:** Compare
`git show 72539d7:js/sale/main.js` with
`git show d4c86a1:js/sale/main.js` for the announcement region and conditional.

**Lesson:** Source markup, accessibility-tree changes and actual spoken output
are separate checks. Preserve the limits of each observation.

## Finding 3: The pre-T11 interface had no in-page Reset action

**Classification:** Historical requirement gap, corrected in its planned
lifecycle task; not evidence that the earlier milestone was falsely complete.

**Symptom:** After stock was spent or the sale ended, a visitor could not start
a fresh run on the same page despite the contract's Reset and cleanup rules.

**Detection and affected revision:** At `d4c86a1`, `index.html` had no
`reset-sale` control and `js/sale/main.js` created its session once. This audit
confirmed that the control was absent there and present at `0fdf950`.

**Corrective action:** Commit `0fdf950` added a native Reset button,
`startSession()` and `disposeSession()`. A reset disposes the previous timer,
inventory subscription and controller before restoring fixture stock and a
fresh five-minute deadline. These paths remain in the reviewed source.

**Verification:** The historical T11 browser check reserved a product, reset
the session, observed stock return from 1 to 2 and the timer return to `05:00`,
then repeated Reset twice without a reported JavaScript error. Current
lifecycle tests passed within the fresh 34-test suite, including controlled
disposal cycles and ignored old callbacks. The browser Reset sequence was not
rerun today.

**Reproduction reference:** Inspect
`git show d4c86a1:index.html` and `git show 0fdf950:index.html`, together with the
same revisions of `js/sale/main.js`.

**Lesson:** A lifecycle feature needs both a user-visible action and explicit
ownership/cleanup of the resources it replaces.

## Additional reviewed risks

- **Back-forward cache:** The earlier `pagehide` cleanup had no matching
  `pageshow` recovery. `0fdf950` added recovery when `event.persisted` is true.
  This audit confirmed the current source paths but did not perform a real
  browser back-forward-cache restoration.
- **Inventory authority:** FIFO serialization and nonnegative stock tests
  concern one JavaScript runtime. They do not establish consistency between
  independent tabs, devices or servers. No real payment or durable order
  processing is present.
- **Timer precision:** Absolute deadlines prevent accumulated callback drift;
  `requestAnimationFrame` does not guarantee a repaint every millisecond.

## Fresh regression verification

Run from this branch's repository root:

```sh
node --test tests/*.test.js
node --test test-runner.js
```

| Check run on 2026-10-30 | Result | Scope |
|---|---|---|
| HW3 Node suite | 34 passed, 0 failed, 0 skipped | Fixtures, deadline clock, inventory transitions, FIFO queue, controller and lifecycle |
| Shared renderer normalization suite | 6 passed, 0 failed, 0 skipped | VNode normalization and props; not actual browser integration |
| Historical source comparisons | Three affected/fixed paths confirmed | Subscription, announcement and Reset changes; not fresh browser retests |

Execution used an isolated copy of the named revision. Local test logs were
retained during this audit but are not additional submission files. The
historical observations and focused Narrator follow-up are in
[`HW3_VERIFICATION.md`](docs/verification/HW3_VERIFICATION.md); behavior is
specified by the [flash-sale contract](docs/contracts/flash-sale.md).

## Disposition

The three earlier gaps have traceable source corrections and recorded retests.
Current Node regression suites passed. Fresh browser integration, actual
screen-reader speech, back-forward-cache behavior, long-session resource
profiling and cross-client stock consistency were not verified by this update.
No claim of proven AI authorship, production concurrency safety or complete
WCAG conformance is made.
