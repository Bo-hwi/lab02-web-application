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
