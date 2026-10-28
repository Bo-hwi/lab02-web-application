# HW3 Verification Report

## T01 - Baseline Verification

- Date: 2026-10-27 (Asia/Ho_Chi_Minh).
- Branch: `hw3/flash-sale`.
- Source baseline: `main` at `2b6135fb1a16531d833530da31c764dfac21dfa7`.
- Planning revision tested: `fcfb9bdfe0c08e50be191eb12270804f1c7e9720`.
- Runtime: Node.js `v26.12.1`; local Python HTTP server at `http://127.0.0.1:8765/`.
- Browser: Codex in-app browser (Chromium); exact browser version was not recorded.

| Check | Command or page | Observed result |
|---|---|---|
| Mini-React Node tests | `node --test test-runner.js` | 6 passed, 0 failed |
| DOM mounting checks | `http://127.0.0.1:8765/dom-mount-test.html` | 9/9 checks passed |
| XSS security checks | `http://127.0.0.1:8765/xss-security-test.html` | 8/8 security checks passed |

The DOM page reported semantic hierarchy, native controls, label association, ARIA live region, one mounted main element, a real Text node, and event feedback as passing. The XSS page reported inert HTML and script payloads, blocked unsafe URLs and attributes, working safe event handling, and preserved accessibility props as passing. These are the existing Exercise 1 checks; they do not verify the HW3 sale engine.

The branch diff against `main` before this report contained only `TASK_DECOMPOSITION.md` and `project-rules.md`. No HW3 functional implementation was present at T01. T02 and later tasks were pending then.

## T02 - Contract Review

- Date: 2026-10-27 (Asia/Ho_Chi_Minh).
- Source checked: Lab 02 slide 32, Homework 3. It requires a Vietnam flash-sale scenario, deadline-based millisecond countdown, optimistic inventory reservation with expiry and checkout, an AI failure audit and at least eight discrete commits. The sample timer code was not assumed correct.
- Document reviewed: docs/contracts/flash-sale.md.
- Review result: the contract specifies three immutable products, VND display, single-controller stock accounting, FIFO request ordering, repeated-request behavior, reservation guards and terminal states, exact expiry versus checkout policy, injected time and disposal, browser feedback and limits of local contention simulation.
- The transition table covers reserve success, sold out, closed sale, invalid input, duplicate holds, checkout, expiry, cancellation and illegal repeated transitions. Stock conservation and nonnegative availability are explicit invariants.
- This is a specification review. No HW3 timer, inventory engine or browser workflow has been implemented or runtime-tested yet. T03-T11 verification remains pending.

## T03 - Deterministic Sale Fixtures

- Date: 2026-10-27 (Asia/Ho_Chi_Minh).
- Files: js/sale/products.js and tests/products.test.js.
- Command: node --test tests/products.test.js.
- Result: 3 tests passed, 0 failed.
- Confirmed exact IDs, names, integer VND prices and initial stock values against the T02 contract; checked unique IDs, valid values, zero-stock coverage, frozen records and unchanged source order after rejected mutations.
- The fixture is static and needs no network or external data. Timer, reservation and browser behavior remain pending.

## T04 - Fixed-Deadline Countdown

- Date: 2026-10-27 (Asia/Ho_Chi_Minh).
- Pre-implementation review: T01-T03 source, contract, task log and clean Git state were checked. The existing Node checks passed 9/9; branch diff passed git diff main...HEAD --check. No defect was found in T01-T03.
- Files: js/sale/clock.js and tests/clock.test.js.
- Command: node --test tests/clock.test.js. Result: 5 passed, 0 failed.
- Command: node --test test-runner.js tests/products.test.js tests/clock.test.js. Result: 14 passed, 0 failed.
- Verified that every tick derives remaining milliseconds from the absolute deadline, including delayed frame callbacks. The clock clamps at zero, emits the zero tick once, and schedules no later frame.
- Verified immediate expiry, stop/dispose cancellation, ignored late callbacks and whole-second plus three-digit millisecond formatting with an injected clock and frame scheduler.
- Browser timer display and reservation integration remain pending. Existing DOM/XSS browser pages were not rerun during this T04 review.

## T05 - Inventory State Machine

- Date: 2026-10-27 (Asia/Ho_Chi_Minh).
- Files: js/sale/inventory.js and tests/inventory.test.js.
- Command: node --test tests/inventory.test.js. Result: 9 passed, 0 failed.
- Command: node --test test-runner.js tests/products.test.js tests/clock.test.js tests/inventory.test.js. Result: 23 passed, 0 failed.
- Verified immutable state snapshots and derived available stock, successful reserve/checkout, cancellation, rejection of invalid or sold-out requests, owner and terminal-state guards, and nonnegative availability under repeated attempts.
- Verified that a processed request ID returns its original result, a buyer's active hold is reused without consuming stock, and an existing hold remains reusable after the sale closes. New holds are rejected after the sale deadline.
- Verified that expiry runs before a command: at the exact hold deadline, checkout is rejected and stock is released once. A later duplicate expiry has no further stock effect.
- This is domain-model verification only. T06 request ordering and pending cancellation, T07 scheduled expiry, and browser integration remain pending.

## T06 - Ordered Reservation Requests

- Date: 2026-10-27 (Asia/Ho_Chi_Minh).
- Files: js/sale/queue.js and tests/queue.test.js.
- Command: node --test tests/queue.test.js. Result: 7 passed, 0 failed.
- Command: node --test test-runner.js tests/products.test.js tests/clock.test.js tests/inventory.test.js tests/queue.test.js. Result: 30 passed, 0 failed.
- Verified FIFO sequence numbers and serial reserve transitions. Three buyers competing for two units settled RESERVED, RESERVED and SOLD_OUT, with zero available stock and no third hold.
- Verified pending cancellation settles as REQUEST_CANCELLED before inventory transition; duplicate pending and settled request IDs return the original ticket without another stock change.
- Verified invalid and closed-sale results, separately observed clock time per command, expiry before a later request, and identical final states for identical inputs and times.
- This is deterministic competition in one JavaScript runtime. It does not demonstrate parallel execution or atomic inventory across tabs or devices. T07 scheduled expiry and the browser workflow remain pending.

## T07 - Hold Expiry and Checkout Controller

- Date: 2026-10-27 (Asia/Ho_Chi_Minh).
- Files: `js/sale/controller.js` and `tests/controller.test.js`.
- Command: `node --test tests/controller.test.js`. Result: 6 passed, 0 failed.
- Command: `node --test test-runner.js tests/products.test.js tests/clock.test.js tests/inventory.test.js tests/queue.test.js tests/controller.test.js`. Result: 36 passed, 0 failed.
- Verified that the controller schedules the earliest absolute hold deadline and expires due holds using the observed clock, even when a timer callback runs late. A repeated expiry does not release stock again.
- Verified checkout at one millisecond before expiry succeeds; checkout at the exact expiry timestamp rejects as `HOLD_EXPIRED` and releases stock once. An active hold can be checked out after the sale closes while it is still valid.
- Verified cancellation and repeated terminal commands do not release stock twice. Disposal cancels the timer, settles all queued requests as `REQUEST_CANCELLED` (including malformed requests), ignores late callbacks and rejects later commands as `DISPOSED`.
- These are deterministic checks within one JavaScript runtime. Browser UI integration, cross-tab inventory authority and real payment processing are not claimed.


## T08 - Semantic Browser Interface

- Date: 2026-10-28 (Asia/Ho_Chi_Minh). Branch: `hw3/flash-sale`.
- Files: `index.html`, `css/sale.css`, `js/sale/main.js`.
- `node --check js/sale/main.js` passed.
- `node --test test-runner.js tests/products.test.js tests/clock.test.js tests/inventory.test.js tests/queue.test.js tests/controller.test.js`: 36 passed, 0 failed.
- Browser: loaded `index.html` from a local HTTP server. It displayed all three products with VND prices, available stock and a running sale countdown. The zero-stock product had a disabled Reserve button.
- Browser: Reserve Midnight Earbuds showed success and reduced available stock from 2 to 1. Pressing Enter on Checkout completed the simulated checkout; available stock remained 1.
- Browser: pressing Enter on Reserve Wireless Mouse and clicking Cancel showed success and restored available stock from 0 to 1. A checkout attempt after the hold had expired showed `No active hold` and restored stock.
- Product data is inserted through `textContent`; the page uses semantic headings, a product list, native buttons, a focusable status region and visible focus styles.
- This verifies the immediate browser workflow. T09 remains responsible for synchronizing visible hold status with scheduled expiry, polishing deadline announcements and guarding focus through timer-driven rerenders. No real payment or shared inventory is involved.

## T09 - UI State and Deadline Integration

- Date: 2026-10-28 (Asia/Ho_Chi_Minh). Branch: `hw3/flash-sale`.
- Files: `index.html`, `js/sale/controller.js`, `js/sale/main.js`, and `tests/controller.test.js`.
- `node --check js/sale/main.js` passed. The combined Node suite passed 38/38 with zero failures.
- Added controller subscriptions for inventory transitions. The UI now redraws after a scheduled hold expiry without requiring a click or keyboard action. Subscription cleanup and one notification per inventory change are covered by controller tests.
- Browser over local HTTP: reserving Midnight Earbuds changed available stock from 2 to 1 and showed the active hold ID with its remaining time. After the 30-second hold deadline passed, the UI displayed an expiry notice, restored available stock to 2 and offered Reserve again without a user action.
- The sale timer derives its displayed value from the fixed deadline. Its `timer` role and `aria-live="off"` avoid announcing every second; changes such as hold expiry use the separate status region. The current action button or feedback region receives focus after a product-list redraw.
- This is one local buyer and one JavaScript runtime. Full keyboard and screen-reader audits, repeated lifecycle stress, and cross-tab inventory authority are outside this T09 result.

## T10 - Functional and Accessibility Checks

- Date: 2026-10-28 (Asia/Ho_Chi_Minh). Branch: `hw3/flash-sale`.
- `node --check js/sale/main.js` and `git diff --check` passed. `node --test test-runner.js tests/products.test.js tests/clock.test.js tests/inventory.test.js tests/queue.test.js tests/controller.test.js` passed 38/38, with zero failures. The suite covers delayed timer callbacks, reservation transitions, FIFO contention without overselling, exact hold expiry, checkout and cancellation.
- Browser: opened `index.html` over local HTTP in the Codex in-app browser. Pressing Tab focused Reserve Midnight Earbuds; pressing Enter reserved it, reduced available stock from 2 to 1, and moved focus to the result status. Clicking Checkout completed the demo checkout and left stock at 1. Reserving then cancelling Wireless Mouse changed its available stock from 1 to 0 and back to 1. Compact Keyboard had zero stock and a disabled Reserve button.
- Browser: on a fresh page, a Midnight Earbuds hold expired after its 30-second deadline without further input. The status named the expired hold, stock returned from 1 to 2, and Reserve became available again. At the five-minute sale deadline, the timer showed `00:00`, the page announced the sale had ended, and all new reservation buttons were disabled.
- Browser accessibility tree: the second-by-second timer had `aria-live="off"`; a separate polite status contained observed ten-second milestone text and the final sale-ended message. Product action buttons had accessible names, while the result status exposed its message and received focus after an action. Keyboard Tab and Enter worked for reservation. The final five-second milestone branch was inspected in code but not individually observed in this browser run.
- CSS contrast calculated from `css/sale.css`: body text on white 15.51:1, timer/eyebrow text on white 8.56:1, error text on white 11.00:1, button text 8.69:1, disabled button text 6.13:1. The orange focus outline against white is 4.02:1 and against the page background is 3.71:1.
- Limits: an actual screen-reader speech session was not run, so the browser accessibility tree and live-region markup do not establish what a screen reader speaks. This check does not claim full WCAG 2.2 AA conformance, a production payment flow or inventory consistency across independent clients. Lifecycle stress remains T11 work.

## T11 - Lifecycle and Recovery Audit

- Date: 2026-10-28 (Asia/Ho_Chi_Minh). Branch: `hw3/flash-sale`.
- Added a Reset sale control. Each reset disposes the old countdown, inventory subscription and controller before creating a new five-minute session. Page hide disposes the session; restoration from the back-forward cache starts a new one.
- `node --test tests/*.test.js`: 34 passed, 0 failed, including two new lifecycle tests. `node --test test-runner.js`: 6 passed, 0 failed. `git diff --check` passed.
- With an injected clock and scheduler, 20 start/finish/disposal cycles reached zero on the countdown and left zero pending animation frames and expiry timeouts after disposal. Invoking captured old callbacks after disposal produced no further ticks or inventory notifications. This is a resource-count observation in the test harness, not a memory or CPU benchmark.
- A simulated FIFO batch of 12 requests for two Midnight Earbuds units produced two reservations and no negative availability. Pending cancellation, checkout, hold cancellation, a replacement reservation, expiry and a rejected late checkout settled without duplicate stock release.
- Browser over local HTTP: reserving Midnight Earbuds reduced available stock from 2 to 1 and displayed an active hold. Reset returned the countdown to `05:00`, cleared the hold and restored stock to 2. Two further Reset clicks kept the page responsive; the browser reported no JavaScript errors.
- Limits: simulated contention occurs within one JavaScript runtime. Cross-tab authority, measured long-run memory/CPU use and actual screen-reader speech were not tested.

## T12 - Run Guide and AI-Assisted Failure Audit

- Date: 2026-10-28 (Asia/Ho_Chi_Minh). Branch: `hw3/flash-sale`.
- Added `README.md` with local HTTP setup, controls, architecture, test commands and simulation limits. Its paths, controls and timings were checked against the current source and contract.
- Added `AI_FAILURE_AUDIT.md` with three observed gaps in earlier AI-assisted revisions: stale UI after scheduled hold expiry at `23e98d8`, absent timer milestone announcements at `72539d7`, and no Reset control at `d4c86a1`. Each finding names the affected files, reproduction, corrective commit and recorded retest. A separate back-forward cache risk is clearly marked as a source-code inference without a browser retest.
- Historical source checks used `git show` to compare the affected revisions with fixes `72539d7`, `d4c86a1` and `0fdf950`. Git does not establish AI authorship of individual lines, so the audit does not claim it.
- Current regression: `node --test tests/*.test.js` passed 34/34; `node --test test-runner.js` passed 6/6. Earlier browser retests are documented under T09-T11 above. T12 changed documentation only.
- Actual screen-reader speech, browser back-forward cache restoration and cross-tab inventory were not separately verified by T12.

## T13 - Final Branch Review and Submission

- Date: 2026-10-28 (Asia/Ho_Chi_Minh). Branch: `hw3/flash-sale`.
- Reviewed the source, task checklist, contract, README, AI audit and the recorded browser observations. Final `node --test tests/*.test.js`: 34 passed, 0 failed. Final `node --test test-runner.js`: 6 passed, 0 failed. `git diff --check` passed.
- Before this review commit, `git rev-list --count main..HEAD` returned 14 separate HW3 commits. All 14 subjects matched the Conventional Commit form. The sequence separates planning, baseline testing, data, clock, inventory, queue, controller, interface, integration, accessibility, lifecycle and documentation work.
- `git diff --name-status main...HEAD` showed only HW3 files and the branch-specific `project-rules.md` update. A tracked-filename scan found no `.env`, private-key, log, build, coverage or temporary artifacts. A simple Git content scan found no private-key blocks or GitHub token prefixes. These scans do not prove that every possible secret pattern is absent.

| Requirement | Final evidence | Limit |
|---|---|---|
| R01: Vietnam flash-sale simulation | `index.html`, `js/sale/main.js` and the T08-T11 browser observations show the three-product VND sale, reservation, checkout, cancellation, sold-out state and Reset. | One local browser runtime; no payment or shared stock server. |
| R02: fixed-deadline millisecond countdown | `js/sale/clock.js` derives remaining time from the deadline and the observed clock; five clock tests cover delayed frames, zero, cancellation and formatting. | Browser scheduling controls display cadence. |
| R03: inventory finite state machine | `docs/contracts/flash-sale.md`, `js/sale/inventory.js` and nine inventory tests cover legal transitions, guards, idempotency and nonnegative stock. | Contention is serialized only inside this runtime. |
| R04: expiry and checkout | Controller, queue and lifecycle tests cover scheduled expiry, the exact deadline boundary, cancelled requests and cleanup; T09-T11 recorded browser expiry and checkout behavior. | No real order or payment service. |
| R05: three AI-failure findings | `AI_FAILURE_AUDIT.md` traces three observable gaps in earlier AI-assisted revisions to source snapshots, fixes and recorded retests. | Git cannot prove AI authorship of individual lines. The final-five-second announcement branch and back-forward cache restoration were not separately observed in a browser. |
| R06: discrete Conventional Commits | Fourteen qualifying commits preceded T13, checked from `main..HEAD` by count and subject. | The T13 review adds a further documentation commit. |

- Accessibility evidence at T13 included keyboard Tab/Enter interaction, browser accessibility-tree inspection, status-region behavior and CSS contrast calculations in T10. Actual screen-reader speech was still pending at T13; a later focused speech check is recorded below. Full WCAG 2.2 AA conformance was not verified.
- Submission URL: https://github.com/Bo-hwi/lab02-web-application/tree/hw3/flash-sale. After pushing this T13 review, compare full local `git rev-parse HEAD` and remote `git ls-remote origin refs/heads/hw3/flash-sale` IDs; the final result is reported with the submission handoff.

## Follow-up - Chrome and Narrator Speech Check

- Date: 2026-10-28 (Asia/Ho_Chi_Minh). Tester: student using Chrome and Windows Narrator; results reported in chat. No audio recording or verbatim speech transcript was captured.
- The sold-out product action was confirmed disabled.
- After Reserve, Narrator audibly read the resulting status message.
- After Checkout or Cancel hold, Narrator audibly read the resulting status message.
- After an active hold expired, Narrator audibly read the expiry notification.
- The countdown did not repeatedly speak every second during the check.
- This is a focused speech check of the reported interactions. Exact spoken wording, every product name, full navigation flow and full WCAG 2.2 AA conformance were not assessed by this follow-up.
