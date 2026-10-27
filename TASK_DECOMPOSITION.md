# HW3 - High-Concurrency Flash-Sale E-Commerce Engine: Task Decomposition

## 1. Scope and Status

- Repository: https://github.com/Bo-hwi/lab02-web-application
- Branch: hw3/flash-sale
- Baseline: main at 2b6135f (Lab 02 Exercise 1).
- Assignment source: Lab 02 slide 32, Homework 3.
- Status: T01-T06 complete; scheduled expiry and the browser workflow have not started.
- Technology: HTML, CSS, vanilla JavaScript and native browser APIs. No external framework or library.
- Submission language: English.
- HW1 and HW2 remain on their own branches.
- The timer code printed on the slide is reference material, not a verified implementation.

## 2. Numbered Assignment Checklist

| ID | Slide requirement | Evidence required |
|---|---|---|
| R01 | Simulate a Vietnam 11.11 or midnight flash sale | Working browser workflow and clear scenario |
| R02 | Show a millisecond countdown based on a fixed deadline and Date.now() delta | Clock tests including delayed callbacks and boundary cases |
| R03 | Model optimistic inventory reservation as a finite state machine | Transition table and tests for legal and illegal transitions |
| R04 | Handle lock expiry and checkout | Expiry, checkout and recovery tests |
| R05 | Document at least three actual AI flaws in AI_FAILURE_AUDIT.md | Reproducible observation, correction and verification for each |
| R06 | Make at least eight discrete Conventional Commits | Git history review showing separate verified work |

The assignment does not specify server infrastructure, payment processing, exact stock quantities, hold duration or checkout success rules. Define these as explicit simulation decisions in T02. A browser-only simulation cannot prove atomic inventory consistency between independent users or devices.

## 3. Proposed Folder Structure

    index.html
    css/
      flash-sale.css
    js/
      sale/
        clock.js
        inventory.js
        machine.js
        view.js
        main.js
    tests/
      clock.test.js
      inventory.test.js
      machine.test.js
      flash-sale-browser-test.html
    docs/
      contracts/
        flash-sale.md
      verification/
        HW3_VERIFICATION.md
    README.md
    AI_FAILURE_AUDIT.md
    TASK_DECOMPOSITION.md
    project-rules.md

Names may change when implementation warrants it. Keep the README consistent with the files actually committed. The existing Mini-React Exercise 1 files are baseline history, not HW3 dependencies.

## 4. Workflow and Commit Rules

1. Complete one small task at a time.
2. State its behavior and failure cases before coding.
3. Implement with vanilla browser APIs and independently inspect the diff.
4. Run focused tests and record real results.
5. Update this checklist and the verification report with evidence.
6. Commit the verified task using a Conventional Commit message.
7. Keep at least eight meaningful, discrete commits for the completed HW3 branch. Documentation-only planning does not substitute for implementation milestones.
8. Push and compare local HEAD with the remote branch before submission.

Do not mark a check complete solely because code exists or a slide example appears plausible. Do not invent three AI mistakes to satisfy R05; investigate real mistakes and state when their cause cannot be established.

## 5. Ordered Work Breakdown

### T01 - Establish Branch and Baseline

- [x] Start hw3/flash-sale from the clean, up-to-date main branch.
- [x] Run and record the existing Mini-React Node and browser checks.
- [x] Record baseline revision, browser and test results in HW3_VERIFICATION.md.
- [x] Confirm the branch remains limited to HW3 work.

Acceptance: baseline checks are recorded truthfully; failures are explained before implementation.
Suggested commit: test(hw3): record baseline verification

### T02 - Define Flash-Sale Contract

- [x] Choose a Vietnam flash-sale scenario, product dataset, currency display and stock values.
- [x] Define the authoritative inventory quantity and how simulated competing requests are ordered.
- [x] Define reservation states, events, guards, expiry time and checkout rules in a transition table.
- [x] Define how time is injected for deterministic tests and how a stopped timer is cleaned up.
- [x] State explicitly which concurrency guarantees are simulated locally and which require a server.
- [x] Define accessible countdown and status announcement behavior.

Acceptance: every visible action, state transition and failure path has a written expected outcome.
Suggested commit: docs(hw3): define flash-sale state machine contract

### T03 - Build Deterministic Sale Fixtures

- [x] Add a small immutable product inventory dataset suited to the chosen scenario.
- [x] Ensure IDs and stock values are valid and unique.
- [x] Test data integrity without mutating source fixtures.

Acceptance: repeatable tests can run without network or hidden data.
Suggested commit: feat(hw3): add deterministic sale inventory

### T04 - Implement Fixed-Deadline Countdown

- [x] Compute remaining time from deadline minus current Date.now() on every update.
- [x] Clamp at zero, emit a final zero tick once and stop scheduling.
- [x] Support cancellation/disposal with no later callback.
- [x] Test delayed frames, clock boundaries and an already expired deadline.
- [x] Use requestAnimationFrame only for display cadence; derive time from the deadline.

Acceptance: delayed callbacks do not accumulate countdown drift.
Suggested commit: feat(hw3): implement fixed-deadline countdown

### T05 - Implement Inventory State Machine

- [x] Implement pure transitions for available, reserved, expired and checked-out states.
- [x] Reject invalid events and prevent stock below zero.
- [x] Define one active reservation per unit or the exact alternative in the contract.
- [x] Test duplicate requests, invalid transitions and expiry versus checkout boundaries.

Acceptance: transitions are deterministic, explicit and independently tested.
Suggested commit: feat(hw3): implement inventory reservation machine

### T06 - Simulate Concurrent Reservation Requests

- [x] Accept competing reservation attempts and process them according to the T02 contract.
- [x] Ensure every attempt settles with a success or failure result.
- [x] Prove stock is never oversold within the simulation.
- [x] Test concurrent attempts, cancellation and repeated requests.

Acceptance: the same input sequence produces the same legal final inventory state.
Suggested commit: feat(hw3): coordinate competing reservations

### T07 - Add Expiry and Checkout Flow

- [x] Expire holds against an absolute deadline and release stock exactly once.
- [x] Accept checkout only for a currently valid reservation.
- [x] Define and test the expiry/checkout race boundary.
- [x] Ensure disposal stops timers and pending work.

Acceptance: checkout cannot succeed after expiry and stock is not released twice.
Suggested commit: feat(hw3): complete reservation expiry and checkout

### T08 - Build Semantic Browser Interface

- [ ] Create an English-language sale page with product, price, stock and countdown.
- [ ] Provide controls to reserve and check out, plus clear error and success states.
- [ ] Use semantic HTML, visible focus and keyboard-operable controls.
- [ ] Render user-visible data as text, never executable HTML.

Acceptance: the core sale workflow works in a browser without a mouse.
Suggested commit: feat(hw3): add flash-sale interface

### T09 - Connect UI to Clock and State Machine

- [ ] Connect user actions to the tested domain model without duplicating state.
- [ ] Keep countdown display in sync with the fixed deadline.
- [ ] Show accurate inventory and reservation status through expiry and checkout.
- [ ] Prevent duplicate UI handlers after repeated rendering.

Acceptance: visible state matches domain state under ordinary and boundary workflows.
Suggested commit: feat(hw3): connect sale UI and inventory state

### T10 - Run Functional and Accessibility Checks

- [ ] Run logic tests for timer, state machine, contention, expiry and checkout.
- [ ] Exercise complete browser workflows including sold-out and expiry cases.
- [ ] Test keyboard navigation, focus, status announcements and text contrast.
- [ ] Record actual browser and test results in HW3_VERIFICATION.md.

Acceptance: critical paths pass; unresolved issues are recorded accurately.
Suggested commit: test(hw3): verify sale workflows and accessibility

### T11 - Audit Lifecycle and Recovery

- [ ] Repeatedly start, finish and reset the sale without duplicate timers or listeners.
- [ ] Check cleanup after cancellation, checkout, expiry and page disposal.
- [ ] Test delayed callbacks and simulated competing requests under stress.
- [ ] Record performance and resource observations without unmeasured claims.

Acceptance: no observed stale callbacks, negative stock or duplicate settlement.
Suggested commit: test(hw3): verify lifecycle and contention recovery

### T12 - Document AI Failures and Run Instructions

- [ ] Write README.md with setup, controls, architecture and simulation limits.
- [ ] Document at least three real AI failure observations in AI_FAILURE_AUDIT.md.
- [ ] For each flaw record the symptom, affected code, reproduction, fix and retest.
- [ ] Distinguish AI-caused mistakes from defects whose authorship is unknown.
- [ ] Recheck that documentation matches the committed code.

Acceptance: another student can run the branch and audit claims can be reproduced.
Suggested commit: docs(hw3): document operation and verified AI audit

### T13 - Review and Submit HW3 Branch

- [ ] Review R01-R06 against actual code, tests and verification evidence.
- [ ] Check Git history contains at least eight separate Conventional Commits.
- [ ] Inspect tracked files for secrets, temporary outputs and unrelated HW1/HW2 changes.
- [ ] Update this file and HW3_VERIFICATION.md with final truthful results.
- [ ] Push hw3/flash-sale and compare the full local and remote commit IDs.
- [ ] Record the branch URL.

Acceptance: GitHub contains the final reviewed branch with matching documentation.
Suggested commit: docs(hw3): finalize submission review

## 6. Minimum Test Matrix

| Area | Scenario | Expected result |
|---|---|---|
| Timer | Callback is delayed | Remaining time reflects wall-clock deadline |
| Timer | Deadline passes | Exactly zero displayed; no further updates |
| Timer | Timer is disposed | No later callback |
| Inventory | Competing buyers exceed stock | Successful reservations never exceed stock |
| Inventory | Duplicate reservation | Documented single outcome; no duplicate hold |
| State | Checkout before expiry | Valid transition and one stock deduction |
| State | Checkout after expiry | Rejected; released stock remains consistent |
| State | Expiry and checkout boundary | Deterministic policy and test |
| UI | Sold out or expired | Clear accessible status and disabled invalid action |
| Lifecycle | Repeated reset | No duplicate handlers or timers |
| Security | Product text resembles HTML | Displayed literally |

## 7. Progress and Evidence Log

Update only after actual work. Planning and suggested commit names are not completion evidence.

| Task | Status | Verification evidence | Commit |
|---|---|---|---|
| T01 | Complete | Node 6/6, DOM 9/9 and XSS 8/8 passed; details in docs/verification/HW3_VERIFICATION.md | 1b8cf02 |
| T02 | Complete | Contract reviewed for scenario, time, inventory invariants, transition guards, simulated contention and accessibility; see docs/contracts/flash-sale.md and docs/verification/HW3_VERIFICATION.md | 05fb386 |
| T03 | Complete | Fixed three-product fixture matches the T02 contract; node --test tests/products.test.js: 3/3 passed, 0 failed; see docs/verification/HW3_VERIFICATION.md | 3e0e510 |
| T04 | Complete | Fixed deadline, delayed frames, zero tick, cancellation and formatting verified: node --test tests/clock.test.js 5/5 PASS; combined Node suite 14/14 PASS; see docs/verification/HW3_VERIFICATION.md | 76fdd52 |
| T05 | Complete | Pure inventory transitions; node --test tests/inventory.test.js: 9/9 PASS; combined Node suite 23/23 PASS; see docs/verification/HW3_VERIFICATION.md | 3b2f0f3 |
| T06 | Complete | FIFO request coordinator; node --test tests/queue.test.js: 7/7 PASS; combined Node suite 30/30 PASS; see docs/verification/HW3_VERIFICATION.md | This commit |
| T07 | Complete | Scheduled absolute hold expiry, checkout boundary and disposal verified; node --test tests/controller.test.js: 6/6 PASS; combined Node suite 36/36 PASS; see docs/verification/HW3_VERIFICATION.md | This commit |
| T08-T13 | Not started | Not yet recorded | Not yet recorded |

## 8. Definition of Done

- [ ] R01-R06 have actual acceptance evidence.
- [ ] Timer, reservation, expiry and checkout tests pass.
- [ ] Browser sale workflow and accessibility checks pass.
- [ ] AI_FAILURE_AUDIT.md contains at least three verified AI flaws.
- [ ] README, verification report and task statuses match the implementation.
- [ ] At least eight discrete Conventional Commits are present.
- [ ] hw3/flash-sale is pushed and matches the remote commit.
