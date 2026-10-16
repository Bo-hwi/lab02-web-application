
# Lab 02 — AI Failure Audit

**Course:** Web Application Development — UIT Advanced Program
**Project:** Mini-React and Reactive State Engine
**Branch:** ex-2
**Status:** In Progress

## 1. Audit Objective

Document real engineering failures identified during
AI-assisted implementation.

Each finding must include:

- The original problem
- How the problem was detected
- Actual observed behavior
- Technical root cause
- Corrective action
- Verification evidence
- Git commit reference, if available

Findings must not be fabricated.

---

## 2. Audit Findings

### AF-01 — Case-Insensitive Event Attribute Injection

**Category:** Security / XSS

**Affected Module:** mini-react.js

**Original Issue:**

The original event handling condition used:

`key.startsWith("on")`

This check was case-sensitive and did not recognize
uppercase variants such as `ONCLICK`.

Unrecognized event attributes could reach the
native `setAttribute()` operation.

**Detection Method:**

Browser-based XSS security verification.

**Observed Result:**

- Before correction: 7/8 checks passed.
- Failed check: Uppercase inline event attribute blocked.

**Root Cause:**

Case-sensitive filtering of event attribute names.

**Corrective Action:**

Use case-insensitive detection of event-like attributes
and register only supported function-based event handlers.

**Verification:**

- After correction: 8/8 security checks passed.
- Inline uppercase event attribute was blocked.

**Fix Commit:** `78bcc14`

**Status:** Fixed and verified against the recorded test cases.

---

### AF-02 — Input Focus Lost During Reactive Re-rendering

**Category:** Accessibility / DOM Lifecycle

**Affected Module:** reactive-engine.js

**Original Issue:**

The rendering lifecycle replaced the entire DOM tree:

`rootContainer.replaceChildren(domNode)`

This removed the currently focused input element
and replaced it with a new DOM node.

**Detection Method:**

Manual keyboard interaction during Task Manager testing.

**Observed Result:**

- Automated Task Manager checks: 9/9 passed.
- Manual typing test: Input lost focus after the first character.

**Root Cause:**

Full DOM replacement without focus restoration.

**Proposed Corrective Action:**

Preserve the active element identity and caret position,
then restore focus after the DOM is replaced.

**Verification:**

Pending manual testing after applying the correction.

**Fix Commit:** Pending

**Status:** Identified — Correction pending verification.

---


### AF-03 — Stale DOM Reference in AI-Generated Test Harness

**Category:** Testing / DOM Lifecycle

**Affected File:** task-manager-test.html

**Original Issue:**

The AI-generated test harness stored a reference to the
Add Task button before triggering a reactive state update.

The input event caused the rendering engine to replace
the DOM tree, detaching the original button.

The test then called `.click()` on the detached button.

**Detection Method:**

Browser-based functional regression testing.

**Observed Result:**

- Before correction: 7/9 checks passed.
- Task creation assertion failed.
- Task counter assertion failed.
- After correction: 9/9 checks passed.

**Root Cause:**

The test harness retained a stale DOM element reference
after `replaceChildren()` replaced the application subtree.

Because the button was detached, its click event did not
bubble to the active root event delegation listener.

**Corrective Action:**

Re-query the current Add Task button after the input event
and before invoking `.click()`.

**Verification:**

- Task successfully created.
- Task counter updated.
- Browser test restored to 9/9 PASS.

**Fix Commit:** Pending

**Status:** Fixed and verified.


**Category:** To be determined

**Affected Module:** To be determined

**Observed Result:** Not yet available.

**Root Cause:** Not yet established.


**Corrective Action:**

Implemented focus restoration in `renderApp()`.

The renderer records the active element's ID and text
selection before replacing the DOM tree.

After mounting the new tree, the renderer attempts to
restore focus and the previous caret position.

**Verification:**

- Before fix: Input lost focus after the first character.
- After fix: Continuous typing works without re-focusing.
- Manual test: `Study React today` entered successfully.
- Task Manager automated tests: 9/9 PASS.
- Task creation and counter updates remain functional.

**Fix Commit:** Pending

**Status:** Fixed — Verified for the tested input scenario.


**Verification:** Pending.

**Status:** Awaiting a genuine third finding.

---

## 3. Audit Completion Checklist

- [x] Record the first verified security failure.
- [x] Record the second observed accessibility failure.
- [x] Verify the corrective action for AF-02.
- [ ] Identify a third genuine AI-related failure or risk.
- [ ] Document the third finding with evidence.
- [ ] Verify all applicable corrections.
- [ ] Review the completed audit.
- [ ] Commit the final audit document.

---

## 4. Engineering Lessons

- Passing automated tests does not guarantee accessibility.
- DOM replacement may destroy focus and selection state.
- Event attribute filtering must account for case variations.
- Security and accessibility require independent verification.
- AI-generated implementations must be reviewed and tested.

**Engineering Principle:**

Generate → Understand → Verify → Document → Commit
