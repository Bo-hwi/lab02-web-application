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
