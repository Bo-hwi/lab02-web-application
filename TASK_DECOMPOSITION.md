
# Lab 02 — Task Decomposition (WBS)

## Exercise 1: Mini-React VNode & Mounting Engine

**Course:** Web Application Development — UIT Advanced Program  
**Sprint:** In-Class Sprint 1  
**Duration:** 35 minutes (lecture allocation)  
**Status:** In Progress — Independent Verification (Exercise 1)  
**Implementation Strategy:** Contract-First, Atomic Generation, Independent Verification

---

## 1. Exercise Objective

Build a minimal Virtual DOM creation and mounting engine from scratch.

The engine must provide:

1. A structured VNode contract.
2. A text element factory.
3. A general VNode element factory.
4. A recursive DOM mounting engine.
5. Safe rendering of untrusted strings.
6. Semantic HTML output.
7. Independently verified implementation checkpoints.

### Required Runtime Exports

The engine must export:

- `createTextElement`
- `createElement`
- `renderToDOM`

The lecture's verification example imports the runtime functions from `mini-react.js`.

### Mandatory Git Milestones

- `feat(core): implement createElement factory`
- `feat(core): implement renderToDOM`

---

## 2. Strict WBS Execution Rules

- Complete only one implementation subtask at a time.
- Do not generate code for the entire exercise.
- Specify each function's contract before implementation.
- Verify the current subtask before continuing.
- Create the specified Conventional Commit after verification.
- Do not combine Exercise 1 with later sprints.
- Do not mark a task complete without evidence.
- Do not commit failing or unverified implementation work.

A subtask is complete only when its acceptance criteria pass and its associated commit is created.

---

## 3. Phase 0 — Engineering Documentation

### Task 0.1 — Establish Engineering Rules

- [x] Create `project-rules.md`.
- [x] Document Anti-XSS requirements.
- [x] Document forbidden JavaScript patterns.
- [x] Document Prop Mapping rules.
- [x] Document the no-monolithic-code rule.
- [x] Document verification and Git requirements.

**Target commit:**

`docs: add engineering rules and exercise 1 WBS`

**Acceptance Criteria:**

- The file exists at the repository root.
- All required security and workflow rules are documented.
- No application implementation is included.

### Task 0.2 — Establish the WBS

- [x] Create `TASK_DECOMPOSITION.md`.
- [x] Define atomic development tasks.
- [x] Assign a target Conventional Commit to each task.
- [x] Define acceptance criteria.
- [x] Record technical risks and verification checkpoints.

**Commit handling:**

Task 0.2 is included in the documentation commit specified in Task 0.1.

Both documentation files must be staged and committed together before implementation begins.

---

## 4. Phase 1 — Contract-First Design

### Task 1.1 — Define VNode and Props Interfaces

**Target artifact:** `vnode-interface.ts`

**Scope:**

Define TypeScript contracts for the custom Virtual DOM representation.

- [x] Define `VNodeType`.
- [x] Define `VNode`.
- [x] Define the Props structure.
- [x] Define the `children` collection.
- [x] Define optional text node content.
- [x] Represent supported component types.

**Required Structural Contract:**

- `type`: Native tag name or component function.
- `props`: Object containing supported properties.
- `props.children`: Array of VNodes.
- `props.nodeValue`: Optional text value.

**Acceptance Criteria:**

- The contract matches the lecture's VNode representation.
- The interfaces are syntactically valid TypeScript.
- No runtime renderer is implemented.
- No state-management functionality is introduced.

The TypeScript contract serves as a specification for the JavaScript engine and does not require introducing a separate TypeScript runtime.

**Target Conventional Commit:**

`docs(core): define vnode and props contracts`

---

## 5. Phase 2 — Virtual DOM Factories

### Task 2.1 — Implement createTextElement

**Target module:** `mini-react.js`

**Target function:** `createTextElement(text)`

**Scope:**

Implement only the text node factory.

- [x] Accept primitive text input.
- [x] Convert the input into a string.
- [x] Return a `TEXT_ELEMENT` VNode.
- [x] Store content in `props.nodeValue`.
- [x] Initialize `props.children` as an empty array.
- [x] Avoid mutating external data.

**Acceptance Criteria:**

- String input produces a valid text VNode.
- Numeric input is normalized to a string.
- The returned object follows the VNode contract.
- The function has no DOM side effects.
- No unrelated factory or renderer is implemented.

**Target Conventional Commit:**

`feat(core): implement createTextElement factory`

**History note:** This dedicated commit was not made. Based on the student-provided Git screenshot, `createTextElement` was committed together with `createElement` under `feat(core): implement createElement factory`. The implementation and automated tests are complete; record this atomic-commit deviation honestly instead of manufacturing Git history.

### Task 2.2 — Implement createElement

**Target module:** `mini-react.js`

**Target function:** `createElement(type, props, ...children)`

**Scope:**

Implement only the general VNode factory.

- [x] Accept an element type.
- [x] Accept nullable props.
- [x] Accept variadic children.
- [x] Normalize missing props into an empty object.
- [x] Flatten nested children arrays.
- [x] Exclude `null`, `undefined`, and `false` children.
- [x] Wrap primitive text and numeric children with `createTextElement`.
- [x] Preserve existing VNode children.
- [x] Return a correctly structured VNode.
- [x] Avoid mutating incoming props and child arrays.

**Acceptance Criteria:**

- A simple element produces a valid VNode.
- An element with null props is handled safely.
- Nested child arrays are flattened.
- Primitive children become text VNodes.
- Excluded child values are not rendered.
- Input objects remain unchanged.
- Generated objects satisfy the contract.

**Target Conventional Commit:**

`feat(core): implement createElement factory`

**Mandatory lecture milestone: Commit 1**

---

## 6. Phase 3 — Recursive DOM Mounting

### Task 3.1 — Implement renderToDOM

**Verification status:** Implementation exists and passed JavaScript syntax inspection, but actual browser DOM mounting has not yet been independently verified. Do not mark the runtime acceptance criteria complete until Task 4.2 passes.

**Target module:** `mini-react.js`

**Target function:** `renderToDOM(vNode)`

**Scope:**

Implement one recursive function that converts a VNode tree into real DOM nodes.

The function must handle:

- [ ] Identification of `TEXT_ELEMENT` nodes.
- [ ] Safe creation of native text nodes.
- [ ] Creation of standard HTML elements.
- [ ] Safe assignment of supported props.
- [ ] Mapping `className` to HTML `class`.
- [ ] Exclusion of reserved VNode properties.
- [ ] Prevention of inline HTML event attributes.
- [ ] Recursive mounting of child VNodes.
- [ ] Returning the completed DOM node.

**Security Requirements:**

- Never use `innerHTML`.
- Use `document.createTextNode()` for text content.
- Never interpret raw strings as HTML.
- Never serialize event handlers into HTML attributes.

**Acceptance Criteria:**

- Text VNodes produce browser Text nodes.
- HTML VNodes produce the correct element types.
- `className` maps to the native `class` attribute.
- Nested elements are mounted recursively.
- The output hierarchy matches the VNode tree.
- No unexpected elements are inserted.
- The implementation respects the documented event architecture boundary.

**Target Conventional Commit:**

`feat(core): implement renderToDOM`

**Mandatory lecture milestone: Commit 2**

---

## 7. Phase 4 — Independent Verification

### Task 4.1 — Verify VNode Normalization

**Evidence:** 6/6 existing Node.js tests passed against the uploaded source on 2026-10-16. This does not prove DOM or XSS safety.

**Target artifact:** Focused factory tests

- [x] Verify string child normalization.
- [x] Verify numeric child normalization.
- [x] Verify null props.
- [x] Verify nested children arrays.
- [x] Verify empty children arrays.
- [x] Verify exclusion of unsupported child placeholders.
- [x] Verify that caller-owned props are unchanged.

**Acceptance Criteria:**

- Every factory test passes.
- Failures provide meaningful diagnostics.
- No DOM rendering is required for these tests.

**Target Conventional Commit:**

`test(core): verify vnode normalization`

### Task 4.2 — Verify Recursive Mounting

**Target artifact:** Browser DOM test harness (`dom-mount-test.html`), with manual Chrome DevTools inspection. The existing `test-runner.js` only runs Node-side VNode tests; Node does not provide browser DOM APIs by default.

- [x] Create a semantic VNode tree.
- [x] Include `main`, `header`, `h1`, `p`, and `button`.
- [x] Mount the tree into the root container.
- [x] Verify the existence of the button.
- [x] Verify the expected element hierarchy.
- [x] Verify proper HTML class mapping.
- [x] Verify text node content.
- [x]x Inspect the Elements panel in Browser DevTools.
- [x] Confirm no unexpected orphan nodes.

**Acceptance Criteria:**

- The root DOM structure matches the VNode tree.
- The button mount assertion passes.
- Semantic HTML elements are present.
- No unexpected DOM nodes are generated.

**Target Conventional Commit:**

`test(core): verify recursive dom mounting`

### Task 4.3 — Verify XSS Resistance

**Target artifact:** Security verification tests

- [x] Test a script-tag string as a text child.
- [x] Test an image-tag string with an `onerror` payload.
- [x] Verify that both strings render literally.
- [x] Verify that no payload executes.
- [x] Verify that no injected script or image element appears.
- [x] Inspect relevant DOM output in DevTools.

**Acceptance Criteria:**

- All supplied attack strings remain inert text.
- No injected script executes.
- No HTML parsing is performed on text content.
- Security findings are recorded accurately.

**Target Conventional Commit:**

`test(security): verify xss-safe text rendering`

### Task 4.4 — Record Exercise Verification

**Target artifact:** Verification notes in the project documentation

- [ ] Record the tests executed.
- [ ] Record observed pass/fail results.
- [ ] Record DOM inspection findings.
- [ ] Record any architectural exceptions.
- [ ] Review the final implementation diff.

**Acceptance Criteria:**

- Results are supported by actual test evidence.
- All required implementation tasks are complete.
- Any remaining issue is explicitly documented.

**Target Conventional Commit:**

`docs(verification): record exercise 1 test results`

---


### Exercise 1 — Final Verification Report

**Verification Date:** 2026-10-16
**Scope:** Mini-React VNode & Mounting Engine
**Status:** Functional checkpoints passed; final review pending

#### Test Results

| Checkpoint | Result | Evidence |
|---|---|---|
| VNode Normalization | 6/6 PASS | Node.js test runner |
| Recursive DOM Mounting | 9/9 PASS | Chrome browser test |
| XSS Security Verification | 8/8 PASS | Chrome browser test |
| Total | 23/23 PASS | Test execution screenshots |

#### Verified Requirements

- VNode factories generate normalized tree structures.
- Recursive mounting creates native DOM elements.
- Plain text is rendered using safe Text nodes.
- `className` is mapped to `class`.
- `htmlFor` is mapped to `for`.
- Tested accessibility attributes are preserved.
- Semantic HTML elements are successfully mounted.
- The tested XSS payloads remain inert.
- Case-insensitive inline event attributes are blocked.

#### Security Finding

**Issue:** Uppercase inline event attributes bypassed
the original event handler detection logic.

**Before fix:** 7/8 security checks passed.

**Correction:** Case-insensitive event attribute filtering.

**After fix:** 8/8 security checks passed.

**Fix commit:** `78bcc14`

#### Architectural Limitations

- Exercise 1 uses element-level event listeners.
- Root Event Delegation belongs to Sprint 2.
- Full WCAG 2.2 AA conformance has not been audited.
- The passing security tests do not prove complete XSS immunity.
- Object freezing and deeper immutability guarantees
  require further verification.
- The text element factory was included in the
  createElement milestone commit.

#### Git Verification

- Required createElement milestone commit: Verified.
- Required renderToDOM milestone commit: Verified.
- Conventional Commit history: Verified.
- Local branch synchronized with origin/main: Verified.

#### Final Review

- [x] Record executed tests.
- [x] Record observed test results.
- [x] Record available browser verification findings.
- [x] Record architectural exceptions.
- [x] Complete final Git diff review.
- [ ] Commit final verification documentation.

**Status:** Verification passed; documentation commit pending

## 8. Technical Trap Register

| ID | Technical Trap | Required Check |
|---|---|---|
| T01 | Raw HTML injection | Verify inert text rendering |
| T02 | Incorrect `className` mapping | Inspect native `class` attribute |
| T03 | Null props handling | Test element creation with null props |
| T04 | Incorrect child flattening | Test nested children arrays |
| T05 | Invalid primitive normalization | Verify text VNode structure |
| T06 | Mutating caller-owned objects | Check input immutability |
| T07 | DOM hierarchy mismatch | Compare VNode and Elements tree |
| T08 | Per-node versus root event handling | Document lecture discrepancy |
| T09 | Unverified code generation | Require test evidence and Git diff |
| T10 | Unnecessary feature expansion | Enforce exercise scope isolation |

---

## 9. Git Commit Sequence

The planned implementation history is:

| Order | Conventional Commit |
|---|---|
| 1 | `docs: add engineering rules and exercise 1 WBS` |
| 2 | `docs(core): define vnode and props contracts` |
| 3 | `feat(core): implement createTextElement factory` |
| 4 | `feat(core): implement createElement factory` |
| 5 | `feat(core): implement renderToDOM` |
| 6 | `test(core): verify vnode normalization` |
| 7 | `test(core): verify recursive dom mounting` |
| 8 | `test(security): verify xss-safe text rendering` |
| 9 | `docs(verification): record exercise 1 test results` |

Commits 4 and 5 preserve the exact mandatory milestone messages from the lecture.

Additional commits are proposed to support atomic development and independent verification.

Do not create a commit before completing its corresponding task.

---

## 10. Definition of Done (DoD)

Exercise 1 is complete when:

- [x] Required engineering documentation exists.
- [x] VNode and Props contracts are defined.
- [x] Text element factory passes verification.
- [x] Element factory passes verification.
- [x] Recursive DOM mounting passes verification.
- [x] Required semantic HTML is present.
- [x] Required property mapping is correct.
- [x] All mandatory XSS checks pass.
- [ ] No unexpected orphan DOM nodes remain.
- [ ] Browser DevTools inspection is complete.
- [x] Both mandatory Git milestone commits exist.
- [ ] All completed subtasks have verification evidence.
- [ ] The repository contains no unrelated exercise implementation.

---

## 11. Execution Gate

**Current State:** Independent Verification — Task 4.2 pending browser runtime testing

**Next Authorized Subtask:** Task 4.2 — Verify Recursive Mounting (browser DOM).

Prerequisites already met for this phase:

1. `project-rules.md` and `TASK_DECOMPOSITION.md` exist.
2. VNode contracts and factories have been implemented.
3. All six VNode normalization tests pass.

Remaining gate: run and verify real browser DOM mounting before completing Task 4.2. A clean Git commit must follow the verified task.

No additional task may be implemented in the same AI request.

---

## 12. Lab-Level Follow-Up

The complete lab also requires `AI_FAILURE_AUDIT.md`.

This document must eventually record:

- At least three actual AI-related failures or risks.
- The original problematic output or behavior.
- Security, memory, or rendering implications.
- Evidence from DevTools or tests.
- Engineering corrections and verification.

This deliverable is tracked separately and must not expand the current Exercise 1 implementation scope.

---

**Engineering Standard:** Generate → Understand → Verify → Commit

**WBS Rule:** Never prompt AI with more than one subtask simultaneously.


---

# Exercise 2 — Reactive State Machine & Event Delegation

**Course:** Web Application Development — UIT Advanced Program
**Sprint:** In-Class Sprint 2
**Duration:** 40 minutes (lecture allocation)
**Branch:** `ex-2`
**Status:** In Progress

## 1. Exercise Objective

Implement a custom reactive state management system
and centralized event delegation architecture.

The implementation must extend the Mini-React engine
developed in Exercise 1.

### Required Features

- Custom `useState(initialValue)` hook
- Persistent external state storage
- Cursor-based hook indexing
- Closure-based state setters
- Functional state updates
- Change detection using `Object.is`
- Automatic component re-rendering
- Root-level Event Delegation
- Reactive Task Manager
- Dynamic task filtering

### Mandatory Git Milestones

1. `feat(state): implement stateStore and resetCursor engine`
2. `feat(state): implement reactive useState dispatcher`
3. `feat(events): attach root event delegation listener`
4. `feat(ui): assemble reactive todo application`

---

## 2. Engineering Constraints

- [ ] Follow the Anti-Monolithic Coding protocol.
- [ ] Implement only one atomic subtask per request.
- [ ] Preserve Exercise 1 functionality.
- [ ] Do not modify the `ex-1` branch.
- [ ] Use Modern JavaScript ES Modules.
- [ ] Preserve WCAG 2.2 AA accessibility requirements.
- [ ] Prevent XSS and unsafe HTML injection.
- [ ] Avoid orphan event listeners.
- [ ] Maintain deterministic hook call order.
- [ ] Verify every milestone before committing.

---

## 3. Phase 0 — Architecture Contract

### Task 0.1 — Define Reactive Engine Architecture

**Target artifact:** Architecture documentation

- [ ] Identify the external state store.
- [ ] Define the hook cursor lifecycle.
- [ ] Define the state setter contract.
- [ ] Define the root rendering lifecycle.
- [ ] Define the event delegation architecture.
- [ ] Identify state and event invariants.

**Acceptance Criteria:**

- State persistence rules are documented.
- Rendering responsibilities are clearly defined.
- Hook ordering constraints are identified.
- Event listener ownership is specified.
- No runtime code is generated.

**Target Commit:**

`docs(architecture): define reactive engine contracts`

---

### Reactive Engine Architecture Contract

**Status:** Proposed — Pending Review

#### A. Module Responsibilities

`mini-react.js`:
- Creates Virtual DOM nodes.
- Converts VNodes into browser DOM nodes.
- Provides the mounting functionality from Exercise 1.
- Requires minimal integration changes for Event Delegation.

`reactive-engine.js`:
- Owns the external state store.
- Manages the hook cursor.
- Implements the state dispatcher.
- Coordinates the root rendering lifecycle.
- Owns the centralized event delegation hub.

#### B. State Store Invariants

- State values are stored outside function components.
- Each hook receives a deterministic array index.
- The hook cursor starts at zero for every render pass.
- Cursor reset must not clear existing state.
- State initialization occurs only for uninitialized slots.
- Valid stored values include null and undefined.
- State must persist between render passes.

#### C. State Setter Contract

Each state setter must:
- Capture its assigned hook index using a closure.
- Accept direct replacement values.
- Accept functional updater callbacks.
- Read the current previous state when updating.
- Use Object.is() to detect state changes.
- Avoid triggering rendering for unchanged values.
- Trigger the registered rendering lifecycle when changed.

#### D. Root Rendering Lifecycle

The renderer must:
1. Register the root component and container.
2. Reset the hook cursor before each render.
3. Execute the root component.
4. Obtain its Virtual DOM representation.
5. Convert the VNode tree into browser DOM.
6. Mount the result without duplicate root nodes.
7. Preserve state between render passes.

Rendering must not accidentally reinitialize hooks.

#### E. Hook Ordering Invariants

- Hooks must execute in a consistent order.
- Hooks must not be called conditionally.
- Hooks must not be called inside loops.
- Hooks must not be called inside nested callbacks.
- Each state slot must retain its logical identity.

#### F. Event Delegation Contract

- One root listener per supported event type.
- Supported types: click, input, keydown.
- Events are dispatched through bubbling.
- The dispatcher resolves the current VNode handler.
- Child DOM nodes must not accumulate direct listeners.
- Re-rendered nodes must use current handler references.
- Repeated rendering must not duplicate root listeners.

#### G. Security & Accessibility Invariants

- Never use innerHTML for untrusted content.
- Render text through createTextNode().
- Preserve semantic native HTML elements.
- Map className to class.
- Map htmlFor to for.
- Preserve valid ARIA attributes.
- Preserve native keyboard interactions.
- Maintain predictable focus behavior.
- Prevent inline event attribute injection.

#### H. Known Architectural Risks

1. Conditional hooks can corrupt state slot ordering.
2. Nullish coalescing is insufficient for detecting
   uninitialized state slots.
3. Incorrect closure capture can update the wrong slot.
4. Direct child listeners conflict with root delegation.
5. Full DOM replacement may cause focus loss.
6. Repeated root listener installation can cause
   duplicate event handling.

#### I. Architecture Acceptance Criteria

- [ ] Module responsibilities are reviewed.
- [ ] State lifecycle invariants are reviewed.
- [ ] Setter behavior is specified.
- [ ] Rendering lifecycle is specified.
- [ ] Hook ordering requirements are documented.
- [ ] Event listener ownership is documented.
- [ ] Security and accessibility requirements are included.
- [ ] No implementation code has been generated.


## 4. Phase 1 — State Store

### Task 1.1 — Implement stateStore and resetCursor

**Target file:** `reactive-engine.js`

**Scope:**
- [x] Create an external state array.
- [x] Create a hook cursor.
- [x] Implement `resetCursor()`.
- [x] Reset cursor before a render pass.
- [x] Preserve state values between render passes.

**Acceptance Criteria:**

- State storage persists across renders.
- Cursor resets to zero correctly.
- Resetting the cursor does not delete state.
- State slots retain deterministic ordering.

**Target Commit:**

`feat(state): implement stateStore and resetCursor engine`

---

## 5. Phase 2 — Reactive State Dispatcher

### Task 2.1 — Implement useState

**Target file:** `reactive-engine.js`

**Target function:** `useState(initialValue)`

**Scope:**

- [x] Allocate state using the current hook cursor.
- [x] Initialize state only when uninitialized.
- [x] Preserve existing state values.
- [x] Capture the current cursor in a closure.
- [x] Return `[state, setState]`.
- [x] Increment the cursor after hook registration.
- [x] Support direct value updates.
- [x] Support functional updates.
- [x] Detect changes using `Object.is`.
- [x] Trigger re-rendering when state changes.

**Acceptance Criteria:**

- State persists across component executions.
- Functional updates receive the previous state.
- Unchanged state does not trigger a re-render.
- Multiple hooks retain their correct state slots.
- Hook ordering remains deterministic.
- No unrelated UI implementation is introduced.

**Target Commit:**

`feat(state): implement reactive useState dispatcher`

---

## 6. Phase 3 — Rendering Lifecycle

### Task 3.1 — Implement renderApp

**Target file:** `reactive-engine.js`

**Target function:** `renderApp(Component, rootContainer)`

**Scope:**

- [x] Register the root component.
- [x] Register the root DOM container.
- [x] Reset the hook cursor before rendering.
- [x] Execute the component function.
- [x] Convert its VNode tree into browser DOM.
- [x] Mount the result in the root container.
- [x] Connect state updates to the rendering lifecycle.

**Acceptance Criteria:**

- The initial component renders successfully.
- State changes trigger rendering.
- State is preserved across render passes.
- The container does not accumulate duplicate root nodes.
- Existing Mini-React behavior remains functional.

**Architecture Note:**

The root rendering implementation must account for
event handler lifecycle and focus preservation.

A full reconciliation engine is outside this task
unless explicitly required by verification.

**Target Commit:**

`feat(render): implement reactive application lifecycle`

---

## 7. Phase 4 — Event Delegation Hub

### Task 4.1 — Implement Root Event Delegation

**Target files:**

- `reactive-engine.js`
- `mini-react.js` (minimal integration changes only)

**Scope:**

- [x] Register root event listeners.
- [x] Support `click`, `input`, and `keydown`.
- [x] Attach at most one listener per supported event type.
- [x] Identify the original event target.
- [x] Traverse the target's ancestor chain.
- [x] Resolve the associated VNode handler.
- [x] Invoke the correct callback.
- [x] Prevent duplicate root listener registration.
- [x] Prevent element-level listener duplication.
- [x] Ensure re-rendered nodes use current handlers.

**Acceptance Criteria:**

- Clicking a button invokes its handler once.
- Input events reach the correct handler.
- Keyboard events work correctly.
- No duplicate handlers appear after re-rendering.
- No orphan child event listeners accumulate.
- Existing XSS protections remain intact.

**Target Commit:**

`feat(events): attach root event delegation listener`

---

## 8. Phase 5 — Reactive Task Manager

### Task 5.1 — Implement Task Manager UI

**Target artifact:** Reactive Task Manager component

**Scope:**

- [x] Create a semantic application structure.
- [x] Initialize tasks using `useState`.
- [x] Display the task count.
- [x] Implement an Add Task button.
- [x] Update the interface after adding a task.
- [x] Preserve task state across renders.

**Acceptance Criteria:**

- The application mounts successfully.
- The task counter displays the correct value.
- Adding a task updates the counter.
- Task state persists across renders.
- Controls remain keyboard accessible.

### Task 5.2 — Implement Dynamic Task Filtering

**Target artifact:** Task Manager component

**Scope:**

- [x] Define the task filter state.
- [x] Implement filter controls.
- [x] Update the displayed task list.
- [x] Preserve the original task collection.
- [x] Reflect the selected filter accessibly.

**Acceptance Criteria:**

- Filter controls update the displayed tasks.
- Switching filters preserves task data.
- Filter state persists correctly.
- Dynamic UI updates remain accessible.

**Mandatory Milestone Commit:**

`feat(ui): assemble reactive todo application`

**Commit Handling:**

Tasks 5.1 and 5.2 must be implemented and
verified separately.

The milestone commit is created only after the
combined Task Manager functionality passes verification.

---

## 9. Phase 6 — Independent Verification

### Task 6.1 — State Engine Verification

- [x] Verify initial state values.
- [x] Verify state persistence.
- [x] Verify closure-bound setters.
- [x] Verify multiple hook slots.
- [x] Verify functional updates.
- [x] Verify `Object.is` change detection.
- [x] Verify no redundant renders for unchanged state.

**Target Commit:**

`test(state): verify reactive state invariants`

### Task 6.2 — Event Delegation Verification

- [x] Verify root listener registration.
- [x] Verify click event delegation.
- [x] Verify input event delegation.
- [x] Verify keydown event delegation.
- [x] Verify handlers after re-rendering.
- [x] Verify no duplicate event invocation.
- [x] Inspect listener behavior using DevTools.

**Target Commit:**

`test(events): verify delegation integrity`

### Task 6.3 — Accessibility & Security Verification

- [x] Verify semantic HTML structure.
- [x] Verify keyboard accessibility.
- [x] Verify accessible input labels.
- [x] Verify focus behavior after state updates.
- [x] Verify required ARIA attributes.
- [x] Verify XSS-safe text rendering.
- [x] Confirm no inline event attributes are created.

**Target Commit:**

`test(a11y): verify reactive ui accessibility`

### Task 6.4 — Final Verification Report

- [x] Record executed tests.
- [x] Record observed results.
- [x] Document architectural limitations.
- [x] Review Git history.
- [x] Review the final Git diff.
- [x] Update the WBS completion status.

**Target Commit:**

`docs(verification): record exercise 2 results`

---

## 10. Definition of Done

Exercise 2 is complete only when:

- [x] Reactive state engine works correctly.
- [x] Hook cursor ordering remains deterministic.
- [x] Functional state updates are supported.
- [x] Unchanged state does not trigger rendering.
- [x] Root Event Delegation is operational.
- [x] Event listeners do not accumulate.
- [x] Reactive Task Manager is functional.
- [x] Dynamic filtering works.
- [x] Security tests pass.
- [x] Applicable WCAG 2.2 AA checks pass.
- [x] All four mandatory milestone commits exist.
- [x] Verification evidence is documented.
- [x] No unfinished implementation is marked complete.

---

## 11. Execution Gate

**Current Phase:** Stage 1 — Functional Slicing

**Next Task:** Task 0.1 — Define Reactive Engine Architecture

Do not generate runtime implementation until
the architecture contract has been reviewed.

Do not combine multiple implementation tasks
in a single AI request.

**Engineering Standard:**

Contract → Implement → Test → Verify → Update WBS → Commit
