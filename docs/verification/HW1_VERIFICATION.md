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
