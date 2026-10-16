
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

- [ ] Test a script-tag string as a text child.
- [ ] Test an image-tag string with an `onerror` payload.
- [ ] Verify that both strings render literally.
- [ ] Verify that no payload executes.
- [ ] Verify that no injected script or image element appears.
- [ ] Inspect relevant DOM output in DevTools.

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
- [ ] Recursive DOM mounting passes verification.
- [ ] Required semantic HTML is present.
- [ ] Required property mapping is correct.
- [ ] All mandatory XSS checks pass.
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
