# HW1 Verification Report

## Baseline

- Branch: hw1/data-grid
- Original baseline commit: 2b6135f
- Tested checkout: 8a54ae3
- Node.js version: v26.12.1
- Browser: Chrome; exact version not recorded.
- Browser tests served through Live Server at http://127.0.0.1:5500.

## Results

| Check | Result | Evidence |
|---|---|---|
| VNode normalization | 6/6 PASS | Terminal output from node --test test-runner.js |
| DOM mounting | 9/9 PASS | Browser report and Console output |
| Manual button activation | PASS | Counter increased from 1 to 2 after one additional click |
| XSS regression checks | 8/8 PASS | Browser report and Console output |

## Observations and Limitations

- The DOM page reported a 404 response for favicon.ico.
- Both browser pages displayed a Summarizer API warning.
  Its source has not been established.
- These messages did not cause the listed checks to fail.
- Manual inspection of the Elements tree has not been documented.
- Passing the supplied XSS checks does not prove complete XSS immunity.
- These results cover the existing engine, not the future Data-Grid.
- The baseline run did not cover HW1 functionality. Current HW1 feature
  verification is recorded by task below; full WCAG conformance and
  Lighthouse scores remain unverified.

## Historical Documentation

The previous Exercise 1 task decomposition remains available
in Git history at commit 2b6135f.
A separate in-branch archive is not required for this project.

## T03 - Product Fixtures

- Command: node --test tests/products.test.js
- Result: 4 tests passed, 0 failed.
- Verified 100 products with unique, non-empty IDs.
- Verified required field types and valid price/stock values.
- Verified multiple categories, equal prices and zero-stock products.
- Verified that source fixtures reject in-place sorting and editing.
- Data-Grid rendering and interactions are not yet implemented.

## T05 - State and Delegated Events

- State tests: 6 passed, 0 failed.
- Browser event delegation checks: 6/6 passed.
- Verified repeated hub setup reuses four listeners, actions bubble
  to the root, disabled controls are ignored, keydown is forwarded,
  and disposal removes listeners.
- The application entry point loaded successfully in the browser.
- Filter state changes update the rendered product list (see T06).
- Focus behavior for remaining grid interactions is still pending.
- A Summarizer API warning appeared in the browser console;
  no JavaScript test failed.

## T06 - Search and Category Filtering

- Command: node --test tests/grid-model.test.js tests/grid-state.test.js
- Result: 12 tests passed, 0 failed.
- Verified ID/name matching, whitespace trimming, case-insensitive search,
  exact category matching, combined filters, empty filters and source-array
  immutability; filter changes reset pagination state to page 1.
- Browser checks: SP010 returned 1 product; SP010 with Displays returned
  0 products and the empty state; Displays alone returned 20 products.
- Search updates while typing; Enter is not required.
- Commit: 375e510 (feat(grid): implement search and category filtering).

## T07 - Stable Column Sorting

- Command: node --test tests/grid-model.test.js tests/grid-state.test.js
- Result: 17 tests passed, 0 failed; node --check passed for
  js/grid/main.js and js/grid/view.js.
- Browser rendering checks: tests/grid-render-test.html reported
  10/10 checks passed, including enabled sortable headers and ascending/
  descending aria-sort values with visible direction indicators.
- Manual browser check: with query "1" and category Audio, ascending price
  placed 850,000 before 1,200,000; descending price reversed the groups.
- The browser console showed a Summarizer API warning; no grid JavaScript
  error was visible.
- Commit: 758e9a5 (feat(grid): implement stable column sorting).

## T08 - Pagination and Page Size

- Command: node --test tests/grid-pagination.test.js tests/grid-model.test.js
  tests/grid-state.test.js
- Result: 24 tests passed, 0 failed.
- Verified empty results, one page, a partially filled final page, clamping
  after the result count shrinks, supported page sizes and complete traversal
  without duplicated or omitted rows.
- Browser checks: page 1 showed rows 1-10; Next showed rows 11-20;
  changing page size to 20 reset to page 1 of 5; filtering Displays from
  page 5 reset to page 1 of 1 with 20 products; an unmatched query showed
  0 products and the empty state with both page buttons disabled.
- No Page 1/0 was displayed for empty results.
- Commit: 259ee18 (feat(grid): implement pagination and page size controls).

## T10 - Keyboard Navigation and Focus Management

- Logic tests: 36 passed, 0 failed across products, model, state,
  pagination, selection and keyboard suites.
- Browser checks: tests/grid-render-test.html reported 12/12 checks passed;
  tests/grid-event-test.html reported 8/8 checks passed, including delegated
  focus handling and single checkbox action dispatch.
- Syntax checks passed for js/grid/main.js, js/grid/view.js,
  js/grid/events.js and js/grid/keyboard.js; `git diff --check` passed.
- Manual keyboard checks verified Tab entry and exit, arrow-key cell
  navigation, Enter selection, Space toggle, and focus retention through
  filtering, sorting and pagination. Selection remained attached to the
  same product ID across page changes.
- Commit: b8e1f94 (feat(a11y): implement grid keyboard navigation and focus management).

## T11 - Styling and Accessible Feedback (Complete)

- `node --test tests/products.test.js tests/grid-model.test.js
  tests/grid-state.test.js tests/grid-pagination.test.js
  tests/grid-selection.test.js tests/grid-keyboard.test.js`: 36 passed,
  0 failed. Syntax checks for `js/grid/main.js` and `js/grid/view.js` and
  `git diff --check` also passed.
- Browser render report: `tests/grid-render-test.html` showed 12/12 checks
  passed, including the full-width empty state and named grid semantics.
- Main page loaded at `http://127.0.0.1:5500/index.html` with its title,
  filter labels, named inventory grid, five configured columns, and pagination
  controls present in the accessibility tree.
- At a 320 CSS-pixel viewport, the document stayed 320 pixels wide and did not
  overflow horizontally; the 672-pixel table remained within its 283-pixel
  scrollable grid viewport. Filter controls wrapped to the available width.
- Measured row checkboxes at 24 by 24 CSS pixels, sort buttons at 32 pixels
  high, and remaining controls at 40 pixels high. The grid render page reported
  12/12 checks passed. Browser interactions updated the polite live region for
  filtering, sorting and selection. No browser JavaScript errors were logged
  on the render test page.
- Manual verification: the page remained usable at 200% browser zoom and
  keyboard focus was visible and unobscured. Lighthouse Accessibility scored
  100; the user reviewed all 10 additional Lighthouse manual checks and
  confirmed they passed. This does not establish complete WCAG conformance.
- Calculated WCAG contrast ratios from the stylesheet colors:
  `#172033` on `#f5f7fb`: 15.17:1; `#38465c` on `#f5f7fb`: 8.90:1;
  `#38465c` on white: 9.55:1; disabled text `#475569` on `#e9edf2`: 6.44:1;
  control border `#68778c` on white: 4.56:1; focus outline `#005fcc` on
  white: 5.98:1; selected-row text `#172033` on `#e4efff`: 14.01:1.
- A visible focus outline is defined; sorting exposes `aria-sort` and a
  visible direction marker. A dedicated polite live region now announces
  filter, sort, page and selection updates; runtime screen-reader announcement
  behavior has not yet been manually confirmed.

## T12 - Integration and Regression Checks (In Progress)

- Logic suite, 2026-10-26: `node --test tests/products.test.js tests/grid-model.test.js tests/grid-state.test.js tests/grid-pagination.test.js tests/grid-selection.test.js tests/grid-keyboard.test.js` — 36 passed, 0 failed.
- Browser workflow and regression checks remain pending.
