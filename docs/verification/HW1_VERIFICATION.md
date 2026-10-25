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
- HW1 functionality, WCAG conformance and Lighthouse scores
  have not yet been verified.

## Historical Documentation

The previous Exercise 1 task decomposition remains available
in Git history at commit 2b6135f.
A separate in-branch archive is not required for this project.