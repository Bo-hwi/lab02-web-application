
# Lab 02 — Engineering Rules & AI Safety Protocol

**Course:** Web Application Development — UIT Advanced Program  
**Lab:** Modern React Architecture, Virtual DOM & State Machines  
**Current Scope:** Exercise 1 — Mini-React VNode & Mounting Engine

## 1. Engineering Philosophy

This project follows the principle:

> AI enhances developer productivity but never replaces engineering comprehension, verification, or accountability.

All generated code must be reviewed, understood, tested, and verified before being committed.

### Mandatory Rules

- Follow Contract-First Development.
- Decompose requirements into atomic tasks.
- Generate code for exactly ONE subtask per AI request.
- Verify every implementation independently.
- Review changes using Git diff before committing.
- Never introduce unverified AI-generated code.
- Maintain a clear Conventional Commit history.

### Strictly Prohibited

- Monolithic code generation.
- Implementing several exercises simultaneously.
- Generating an entire application in a single AI prompt.
- Introducing unrelated features or dependencies.
- Accepting code without understanding its behavior.
- Committing code that fails its acceptance criteria.

**Non-negotiable AI instruction:**

Never prompt AI with more than one implementation subtask simultaneously.

---

## 2. Anti-XSS Security Protocol

Cross-Site Scripting (XSS) prevention is mandatory.

### 2.1 Forbidden DOM APIs

Never use the following APIs to render untrusted content:

- `element.innerHTML`
- `element.outerHTML`
- `element.insertAdjacentHTML()`
- `document.write()`

Do not create DOM elements by concatenating user-controlled HTML strings.

### 2.2 Mandatory Safe Text Rendering

All primitive text content must be converted into safe text nodes.

Required API:

`document.createTextNode(String(value))`

Safe updates to existing text nodes may use their `nodeValue` property.

Never interpret user-controlled strings as HTML.

### 2.3 Security Test Cases

The rendering engine must safely handle strings containing:

- `<script>alert(1)</script>`
- `<img src=x onerror=alert(1)>`
- `<b>Untrusted Text</b>`

Expected behavior:

- The strings appear as literal text.
- No scripts execute.
- No injected HTML elements are created.
- No unexpected DOM nodes appear.

### 2.4 Attribute Safety

- Never generate HTML inline event attributes.
- Never map `onclick`, `onerror`, or similar handler strings into HTML attributes.
- Reject unsafe URL protocols such as `javascript:` when processing user-controlled URL attributes.
- Prefer explicit attribute handling rather than unrestricted assignment of arbitrary props.
- Do not execute dynamic code from untrusted input.

The URL validation rule is an additional defense-in-depth safeguard.

---

## 3. Prop Mapping Protocol

The Virtual DOM engine must distinguish JavaScript-style props from native HTML attributes.

### 3.1 Mandatory Property Mapping

| Virtual DOM Prop | HTML Representation |
|---|---|
| `className` | `class` |
| `id` | `id` |
| `role` | `role` |
| `aria-*` | Corresponding ARIA attribute |
| `data-*` | Corresponding data attribute |

When setting an HTML class attribute, use the correct native attribute name:

`className` → `class`

Native HTML attributes should be assigned through safe DOM APIs such as `setAttribute()`.

### 3.2 Reserved Virtual DOM Properties

The following properties must not be treated as ordinary HTML attributes:

- `children`
- `nodeValue`
- `key`
- Event handler properties

`children` controls tree traversal.

`nodeValue` represents text node content.

`key` is reserved for reconciliation and must not be rendered as a native DOM attribute.

### 3.3 Event Handler Safety

Event handlers must never be converted into inline HTML event attributes.

The lecture requires centralized Event Delegation as the target architecture.

**Important scope distinction:**

- Exercise 1 focuses on Virtual DOM construction and mounting.
- The slide 12 example attaches DOM listeners directly.
- The slide 3 rules require centralized Event Delegation.
- Sprint 2 explicitly implements the root delegation hub.

This discrepancy must be documented during Exercise 1 verification.

Do not silently claim that per-element listeners satisfy the root delegation requirement.

Do not implement the entire Sprint 2 event system as part of Exercise 1 without explicit authorization.

---

## 4. JavaScript Modernization Rules

### Forbidden Patterns

- `var`
- Implicit global variables
- Deprecated `keypress` events
- Deprecated `event.keyCode`
- Inline HTML event handlers
- Raw HTML injection
- Obsolete standalone Babel-based application execution

### Required Practices

- Use `const` by default.
- Use `let` only for reassigned variables.
- Use ES Modules with `import` and `export`.
- Use `keydown` with `event.key` or `event.code`.
- Prefer pure functions for tree construction.
- Use modern DOM APIs.
- Use Vite/esbuild or an equivalent modern toolchain when JSX transformation is required.

Do not introduce React itself to replace the custom engine.

---

## 5. Virtual DOM Architecture Contract

The custom Virtual DOM engine must represent UI elements as lightweight Plain Old JavaScript Objects (POJOs).

### 5.1 VNode Contract

Every VNode must contain:

- `type`: Native element name or component reference.
- `props`: Object containing supported properties.
- `props.children`: Array containing normalized child VNodes.

Text nodes use:

- `type`: `TEXT_ELEMENT`
- `props.nodeValue`: Text content
- `props.children`: Empty array

### 5.2 VNode Construction Requirements

- Convert primitive strings and numbers into `TEXT_ELEMENT` nodes.
- Normalize nested children arrays.
- Exclude `null`, `undefined`, and `false` children, as demonstrated in the lecture.
- Use an empty object when props are null.
- Avoid mutating caller-owned props and children.
- Construct new VNode objects deterministically.
- Verify the intended immutability guarantees.

**Technical warning:** The lecture describes frozen VNodes, but its example does not implement object freezing. The implemented immutability behavior must be explicitly verified.

### 5.3 Recursive Mounting Requirements

The renderer must:

1. Identify the VNode type.
2. Create text nodes using `document.createTextNode()`.
3. Create native elements using `document.createElement()`.
4. Apply supported properties safely.
5. Recursively mount child VNodes.
6. Return the resulting DOM node.
7. Support mounting into a root container with `replaceChildren()`.

The rendered DOM hierarchy must match the Virtual DOM hierarchy.

---

## 6. Semantic HTML Contract

Semantic HTML is mandatory.

Prefer appropriate native elements:

- `main`
- `header`
- `section`
- `article`
- `h1`–`h6`
- `p`
- `button`

Avoid unnecessary wrappers and "div-soup".

Use native interactive elements instead of generic containers when possible.

Maintain a valid document hierarchy.

---

## 7. Performance & Memory Safety

### 7.1 DOM Performance

Avoid unnecessary DOM mutations.

Never deliberately interleave layout reads and writes in loops when equivalent work can be computed first.

Avoid unnecessary full-tree replacement when later implementing reconciliation.

### 7.2 Event Listener Management

Event handlers must not accumulate across repeated mounting or rendering.

Do not create orphaned listeners.

Root Event Delegation is the required target for Sprint 2.

### 7.3 Stable Keys

When dynamic list reconciliation is introduced:

- Use stable entity IDs.
- Do not use array indices for changing lists.
- Do not use randomly generated keys on each render.

Reconciliation is outside the Exercise 1 implementation scope.

---

## 8. AI Workflow & Work Breakdown Structure

The project must follow four engineering stages:

### Stage 1 — Functional Slicing

Break the requirements into independently implementable tasks.

### Stage 2 — Contract-First Specification

Define interfaces, expected inputs, outputs, and invariants before implementation.

### Stage 3 — Atomic Generation

Request exactly one function, module, or isolated subtask from AI at a time.

### Stage 4 — Independent Verification

Validate each implementation through:

- Focused test cases
- Browser DevTools
- Security assertions
- Git diff inspection
- Manual code review

### Mandatory Project Documents

- `project-rules.md`
- `TASK_DECOMPOSITION.md`

The lab-level AI failure audit also requires:

- `AI_FAILURE_AUDIT.md`

The audit must document three actual AI-related failures or risks, evidence of detection, and corrective actions.

Do not fabricate audit findings.

---

## 9. Git & Conventional Commit Policy

All implementation work must use Conventional Commits.

Required format:

`<type>(<scope>): <description>`

Allowed types include:

- `feat`
- `fix`
- `test`
- `docs`
- `refactor`
- `chore`

### Atomic Commit Requirements

- One independently verified task per commit.
- Never mix unrelated functionality.
- Never commit incomplete or unverified work.
- Preserve the milestone commit messages required by the lecture.
- Inspect `git diff` and `git status` before committing.

### Mandatory Exercise 1 Milestones

1. `feat(core): implement createElement factory`
2. `feat(core): implement renderToDOM`

Additional smaller commits are permitted, provided the mandatory milestones remain identifiable.

---

## 10. Exercise 1 Acceptance Criteria

Exercise 1 is considered complete only when:

- [ ] VNode and Props contracts are defined.
- [ ] `createTextElement` is implemented.
- [ ] `createElement` is implemented.
- [ ] Nested children are normalized correctly.
- [ ] Primitive text nodes are safely constructed.
- [ ] `renderToDOM` recursively mounts VNodes.
- [ ] `className` maps correctly to HTML `class`.
- [ ] Semantic HTML elements are used.
- [ ] XSS test strings render as inert text.
- [ ] DOM structure matches the VNode hierarchy.
- [ ] No unexpected orphan nodes remain.
- [ ] Required Git milestone commits are present.
- [ ] Implementation changes have been independently verified.

---

## 11. Scope Isolation

The current active scope is Exercise 1 only.

Do not implement the following without explicit authorization:

- Custom `useState`
- Reactive state dispatcher
- Hook cursor lifecycle
- Full root Event Delegation hub
- Virtual DOM reconciliation
- Memoization
- Virtual scrolling
- Async finite state machines
- Homework Data-Grid
- Audio queue engine
- Flash-sale engine

These belong to later exercises or additional assignments.

---

## 12. Final Engineering Principle

**Generate → Understand → Verify → Commit**

No implementation is accepted solely because it runs.

The student remains responsible for the architecture, correctness, security, and maintainability of all submitted code.
