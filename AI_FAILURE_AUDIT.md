# AI Failure and Risk Audit

## Scope

This audit records AI-related failures and risks observed while implementing
HW1 — Accessible Data-Grid on branch `hw1/data-grid`.

The findings below are based on actual project work. Slide inconsistencies are
not presented as failures discovered in this implementation.

## Finding 1 — Browser Test Executed with the Wrong Runtime

### Context

An AI-assisted verification step attempted to execute
`tests/grid-event.test.js` directly with Node.js.

### Failure

The test depends on browser APIs such as `document`, so the command failed with
a `document is not defined` error. The failure did not prove that the grid event
implementation was broken; it showed that the wrong test environment was used.

### Detection

The Node.js error identified the missing browser environment.

### Correction

The browser test was executed through
`tests/grid-event-test.html` over Live Server instead.

### Verification

The browser event page completed all 8 checks successfully.

### Lesson

Before executing generated test instructions, verify whether a test targets
Node.js or a browser environment.

## Finding 2 — Browser Console Noise Could Be Misdiagnosed as an Application Error

### Context

Browser verification displayed a Summarizer API warning even though the
application does not use that API.

### Risk

An AI assistant could incorrectly attribute the warning to the application and
change unrelated project code.

### Detection

The application source was inspected and contained no Summarizer API usage.
The grid tests continued to pass, and the warning was independent of grid
interactions.

### Correction

The warning was recorded separately and was not treated as a grid failure.
Application errors and external browser or extension messages were
distinguished during verification.

### Verification

The application workflow and browser test pages passed without grid JavaScript
exceptions.

### Lesson

Console messages must be traced to their actual source before modifying code.

## Finding 3 — Lighthouse Scores Could Be Overstated as Complete WCAG Proof

### Context

Lighthouse reported Accessibility 100/100 and Best Practices 100/100.

### Risk

An AI-generated report could claim that these scores prove complete WCAG 2.2 AA
conformance.

### Detection

The project rules and Lighthouse report both indicate that automated checks
cover only part of accessibility verification.

### Correction

Keyboard, focus and screen-reader workflows were checked manually. The
verification report explicitly states that Lighthouse scores alone do not prove
complete WCAG conformance.

### Verification

Keyboard operation, focus behavior, table context, column headers, sorting,
selection, result count and page state were manually reviewed in addition to
the Lighthouse audit.

### Lesson

Automated accessibility scores must be combined with documented manual checks.

## Review Practice

AI-assisted changes in this project were handled using the following cycle:

1. Define one isolated task.
2. Review generated changes.
3. Run focused logic or browser checks.
4. Inspect the Git diff.
5. Commit only verified work.

The student remains responsible for the submitted architecture, code,
documentation and verification evidence.