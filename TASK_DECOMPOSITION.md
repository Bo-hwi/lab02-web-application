# HW1 - Accessible Data-Grid: Task Decomposition

## 1. Scope and Status

- Repository: https://github.com/Bo-hwi/lab02-web-application
- Target branch: `hw1/data-grid`.
- Assignment: HW1 - Production Enterprise Data-Grid (WCAG 2.2 AA), Lab 02 slide 30.
- Status: planning; implementation and runtime verification have not been confirmed complete.
- Technology: HTML, CSS and vanilla JavaScript, using ES Modules and native browser APIs.
- Reuse useful repository code. Completing Sprints 2-3 or building another framework is not required.
- This branch covers HW1 only. HW2 and HW3 belong on separate branches.
- Submission: push source code and documentation to the GitHub branch.
- Submission language: English for documentation, UI text, sample data, code comments and commit messages.

## 2. Acceptance Requirements from the Slides

| ID | Requirement | Required evidence |
|---|---|---|
| R01 | Sorting, filtering and pagination | Logic tests and browser interaction checks |
| R02 | WCAG 2.2 AA; specified contrast ratio of 4.5:1; screen reader support | Contrast, keyboard, screen reader and applicable AA checks |
| R03 | Arrow keys navigate cells; Enter selects; Space toggles | Keyboard and selection test scenarios |
| R04 | Use table, thead, tbody, th scope="col" and button; avoid div-soup | Inspection of the rendered DOM |
| R05 | Appropriate ARIA grid, row and gridcell semantics | Accessibility tree and screen reader inspection |
| R06 | Lighthouse Accessibility 100/100 and Best Practices 100/100 | Actual reports for the final version |
| R07 | Column configuration includes header, accessorKey and sortable; grid options include data, columns, ariaLabel and optional onRowSelect | Contracts and configuration tests |

General workflow requirements: decompose tasks, define contracts before implementation, verify independently, maintain project-rules.md and use clear commits.

Virtual scrolling, a backend, login, product CRUD, React, JSX and a complete reconciliation engine are not assumed requirements. The minimum of eight commits is specified for HW3, not HW1.

## 3. Implementation Decisions for Unspecified Details

These are project design decisions, not additional instructor requirements:

- Use approximately 100 deterministic sample products stored in the repository, without an external API dependency.
- Columns: product ID, name, category, price and stock, plus a row-selection column.
- Include unique IDs, English text, numeric values, equal values and zero-stock products for testing.
- Search by ID/name and filter by category; combine filter conditions.
- Sort one column at a time; repeated activation toggles ascending/descending order.
- Compare prices and stock numerically, using raw values rather than formatted strings.
- Use English locale-aware text comparison with locale `en`.
- Show 10 rows per page by default; allow page sizes of 10, 20 or 50.
- Enter selects the row containing the focused cell; Space toggles its selection.
- Store selection by ID and preserve it across pagination, filtering and sorting.
- Display keyboard instructions; use checkboxes to communicate row selection.
- Only the active data cell is in the grid body's Tab sequence; arrows navigate within it.
- Sort buttons, filters and pagination controls remain keyboard accessible using appropriate native control behavior.
- Arrow navigation stops at the current page boundaries and does not automatically change pages.
- Describe contracts in JSDoc/Markdown; browser runtime code remains JavaScript.
- Serve the application over static HTTP to support ES Modules; document a verified launch procedure in README.

## 4. Proposed Structure

```text
index.html
mini-react.js                 # Existing engine; reuse or modify as needed
css/
  base.css
  data-grid.css
js/
  data/products.js
  grid/
    model.js
    view.js
    keyboard.js
    main.js
tests/
  grid-tests.html
  grid-tests.js
docs/
  contracts/data-grid.md
  verification/HW1_VERIFICATION.md
  evidence/
README.md
project-rules.md
TASK_DECOMPOSITION.md
AI_FAILURE_AUDIT.md
```

Keep existing baseline tests unless moving them has a clear purpose and their imports have been updated and verified. Create images/ only if images are actually used; product images are not required.

## 5. Workflow for Each Task

1. Read the requirement and define inputs, outputs and invariants.
2. Implement only the current task; do not request the entire application in one AI generation.
3. Run focused verification and relevant integration checks.
4. Review git diff and git status; stage only files belonging to the task.
5. Create a meaningful commit after verification passes.
6. Record evidence, commit IDs and completion status in this document.

Commit messages below are proposed messages. Do not create empty commits, fabricate history or report passing checks that were not performed.

## 6. Ordered Work Breakdown

### T01 - Confirm the Baseline and Update Documentation Scope

- [ ] Confirm hw1/data-grid is checked out and record the actual baseline commit.
- [ ] Read existing code, documentation and tests; rerun available baseline checks.
- [ ] Record tests that have not run or are failing; do not infer current results from old reports.
- [ ] Preserve the previous Exercise 1 WBS in docs/ before replacement if an in-branch archive is needed.
- [x] Update project-rules.md from Exercise 1 to HW1 while retaining applicable safety and verification rules.
- [x] Add this task decomposition document.

Acceptance: scope and baseline status have evidence; no HW2/HW3 implementation is accidentally included.

Commit: `docs(hw1): define data-grid scope and task decomposition`

### T02 - Define Contracts and Invariants

- [x] Describe Product, ColumnDef, GridOptions and GridState in docs/contracts/data-grid.md.
- [x] Define minimum state: filters, sort column/direction, page, page size, selected IDs and active cell.
- [x] Specify the pipeline: original data -> filtering -> sorting -> pagination.
- [x] Define Enter, Space, arrow and Tab behavior; distinguish focus from selection.
- [x] Define empty-data handling, out-of-range pages, invalid IDs and removal of the active cell by filtering.
- [x] Require immutable source data, stable IDs and counts/ARIA states consistent with the displayed data.

Acceptance: behaviors can be translated into concrete tests, with no contradictions between keyboard interaction and row selection.

Commit: `docs(grid): define data and interaction contracts`

### T03 - Prepare Sample Data

- [ ] Create approximately 100 deterministic products with unique IDs.
- [ ] Include multiple categories, English names, equal prices and zero stock.
- [ ] Validate data types, duplicate IDs and invalid values.

Acceptance: data spans multiple pages and produces reproducible results across runs.

Commit: `feat(grid): add deterministic product fixtures`

### T04 - Build the Semantic Table and UI Structure

- [ ] Create index.html with a heading, controls, table, status messages and pagination.
- [ ] Render columns from configuration using table, thead, tbody, th scope="col" and button.
- [ ] Provide an accessible table name and appropriate grid, row, columnheader and gridcell roles.
- [ ] Label inputs/selects; render text through safe DOM APIs.
- [ ] Keep data and behavior separate from view construction.
- [ ] Verify that HTML-like strings render as text without creating injected elements or executing code.

Acceptance: DOM structure is correct, data and headers match the contract, and the console has no errors.

Commit: `feat(grid): render semantic configurable data table`

### T05 - Establish State and Delegated Events

- [ ] Implement the flow: update state -> derive displayed data -> update the UI.
- [ ] Delegate appropriate events at the root and map keydown correctly.
- [ ] Ensure rerendering does not register duplicate listeners.
- [ ] Avoid replacing the entire root during interactions in ways that lose focus or caret position.
- [ ] Define focus restoration using row ID and column key when nodes must be replaced.

Acceptance: repeated updates do not duplicate handlers, lose input content or unexpectedly move focus.

Commit: `feat(grid): add state updates and delegated events`

### T06 - Filter Data

- [ ] Search by ID/name, trim surrounding whitespace and ignore case.
- [ ] Combine search with category filtering.
- [ ] Reset the page to 1 when filter conditions change.
- [ ] Display an empty state and the matching result count.
- [ ] Test empty filters, unmatched queries, mixed-case English text and combined filters.

Acceptance: results are correct and the original dataset remains unchanged.

Commit: `feat(grid): implement search and category filtering`

### T07 - Sort Data

- [ ] Allow sorting only on columns marked sortable.
- [ ] Support ascending/descending order with separate numeric and text comparisons.
- [ ] Preserve stable ordering for equal values; never use array indices as row identity.
- [ ] Update aria-sort on the relevant column header and clearly indicate the direction.
- [ ] Test numbers 2/10/100, equal values, English text and sorting after filtering.

Acceptance: all filtered results are sorted before pagination without mutating the source array.

Commit: `feat(grid): implement stable column sorting`

### T08 - Paginate Data

- [ ] Calculate page counts and slices from the filtered/sorted results.
- [ ] Add previous/next controls and a page-size selector.
- [ ] Disable unavailable actions and clearly communicate the current page.
- [ ] Handle zero rows, one page, partially filled final pages and fewer pages after filtering.
- [ ] Verify that traversing pages does not duplicate or omit rows.

Acceptance: pages remain valid; no Page 1/0, negative counts or NaN values are displayed.

Commit: `feat(grid): implement pagination and page size controls`

### T09 - Select Rows by ID

- [ ] Add an accessibly named checkbox for each row.
- [ ] Store selection by ID and keep checkbox state and aria-selected consistent.
- [ ] Implement optional onRowSelect and document exactly when it runs.
- [ ] Preserve selection across filtering, sorting and pagination; show an accurate selected count.
- [ ] Test that repeated interactions do not cause unintended duplicate callbacks or toggles.

Acceptance: selection stays attached to the correct product when its row position changes.

Commit: `feat(grid): add persistent row selection by product id`

### T10 - Implement Keyboard Navigation and Focus Management

- [ ] Use four arrow keys to move focus between cells and handle row/column boundaries.
- [ ] Make Enter select and Space toggle according to the contract.
- [ ] Handle focused checkboxes/buttons without triggering the same action twice.
- [ ] Use preventDefault selectively without blocking search input or necessary native behavior.
- [ ] Allow Tab/Shift+Tab to enter and leave the grid without a keyboard trap.
- [ ] Preserve or reset focus appropriately after filtering, sorting and pagination.

Acceptance: all features work without a mouse and focus remains visible and predictable.

Commit: `feat(a11y): implement grid keyboard navigation and focus management`

### T11 - Complete Styling and Accessible Feedback

- [ ] Style the layout, table, controls and empty state.
- [ ] Measure required text contrast and applicable control/focus contrast.
- [ ] Provide visible focus and communicate selection/sort direction through more than color alone.
- [ ] Check narrow viewports, zoom and target size; provide appropriate table scrolling when necessary.
- [ ] Announce relevant result/page/selection changes without repeatedly reading the entire table.
- [ ] Check focus obscuration and other applicable WCAG 2.2 AA requirements.

Acceptance: the interface remains readable and operable at tested sizes and communicates its states clearly.

Commit: `feat(a11y): improve grid styling and accessible feedback`

### T12 - Run Integration and Regression Checks

- [ ] Run logic tests using available JavaScript tools or a plain test harness; do not introduce a test library without authorization.
- [ ] Exercise filtering -> sorting -> pagination -> selection -> changed filters.
- [ ] Check empty data, the last page, selection outside the filtered results and focus after updates.
- [ ] Check for accumulating listeners and console errors after repeated interactions.
- [ ] Rerun relevant baseline tests when mini-react.js or shared code changes.
- [ ] Record actual observations in docs/verification/HW1_VERIFICATION.md.

Acceptance: critical tests pass; detected issues are fixed and rechecked, or explicitly documented as unresolved.

Commit: `test(grid): verify data-grid integration and regression cases`

### T13 - Audit Accessibility and Lighthouse Scores

- [ ] Check the full workflow with a keyboard and at least one screen reader, such as NVDA.
- [ ] Check table names, column headers, cell position, sort state, selection and announcements.
- [ ] Review applicable WCAG 2.2 AA criteria; distinguish pass, fail, untested and not applicable.
- [ ] Run Lighthouse over HTTP and achieve Accessibility 100 and Best Practices 100.
- [ ] Save reports with the date, browser/version, URL, configuration and tested commit.
- [ ] Recheck affected behavior and rerun the final audit after subsequent code changes.

Acceptance: requirements have actual evidence; Lighthouse scores do not replace manual WCAG checks.

Commit: `docs(a11y): record accessibility checks and Lighthouse evidence`

### T14 - Document AI Findings and Run Instructions

- [ ] Record actual AI-related failures: context, faulty code/behavior, detection, correction and verification.
- [ ] Address the lab-level requirement for three findings without fabricating evidence or treating slide errors as AI failures discovered in this implementation.
- [ ] If evidence is insufficient, report what remains missing instead of claiming the audit is complete.
- [ ] Write README instructions covering HW1, its branch, setup, features, keyboard controls and tests.
- [ ] Document the decisions in section 3 and remaining limitations.
- [ ] Prepare a short explanation of the data pipeline, focus management, event delegation and verification.

Acceptance: another person can clone, run and verify the branch using README; the audit reflects actual evidence.

Commit: `docs(hw1): add run instructions and AI failure audit`

### T15 - Review and Submit the Branch

- [ ] Review R01-R07 and all tasks without skipping unmet requirements.
- [ ] Inspect diffs, Git status and commit history; include only relevant files.
- [ ] Ensure secrets, temporary files and reports containing private information are not committed.
- [ ] Verify the README procedure using committed source files.
- [ ] Push using git push -u origin hw1/data-grid.
- [ ] Confirm the latest GitHub commit matches the submission and record the branch URL.

Acceptance: GitHub contains the verified version and matching documentation. Do not create a commit solely to record a push.

## 7. Minimum Test Matrix

| Area | Scenario | Expected result |
|---|---|---|
| Data | Duplicate ID or invalid price type | Fixture validation detects the error |
| Filtering | Unmatched search query | Correct empty state and valid pagination behavior |
| Filtering | Continuous typing | Focus and caret are preserved |
| Sorting | Numeric values 2, 10, 100 | Numeric rather than string order |
| Sorting | Two products with equal prices | Stable tie ordering |
| Pagination | Narrow a filter while on the final page | Valid page and correct counts |
| Selection | Select, then sort/filter/change pages | The same product ID remains selected |
| Keyboard | Arrows, Enter, Space, Tab and Shift+Tab | Contract behavior without duplicate actions or traps |
| Focus | Filter removes the active row | Focus follows the contract and is not lost |
| Screen reader | Navigate, sort and select | Appropriate context and state are announced |
| Security | Data contains HTML-like text | Literal text, no execution or injected nodes |
| Lifecycle | Repeated rendering and interaction | No duplicate listeners or handler execution |
| Lighthouse | Final HW1 version | Accessibility 100; Best Practices 100 |

## 8. Progress and Evidence Log

Update this section after actual work. A planned check is not completion evidence.

| Task | Status | Verification evidence | Commit |
|---|---|---|---|
| T01 | In progress | WBS added and project-rules scope updated to HW1; baseline tests have not been rerun | 2e7837b, 9cdf270 |
| T02 | Specification complete | Contract reviewed against all six T02 items; implementation and runtime verification remain pending | d6cc8d9 |
| T03-T15 | Not started | Not yet recorded | Not yet recorded |
## 9. Definition of Done

- [ ] R01-R07 have acceptance evidence.
- [ ] Required tasks are complete and no blocking usability defects remain.
- [ ] Actual logic, browser, keyboard and screen reader checks have been performed.
- [ ] Lighthouse reports show the required scores for the submitted version.
- [ ] Workflow documentation, README and audit are truthful and consistent with the code.
- [ ] Commits are clear, do not mix HW2/HW3 and do not fabricate history.
- [ ] The hw1/data-grid branch has been pushed and verified on GitHub.
