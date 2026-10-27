# HW2 AI Failure and Risk Audit

This audit separates failures observed while developing the AI-assisted coursework from risks that have not been reproduced. The repository does not preserve every prompt, generated draft or review decision. A software failure below therefore must not be attributed to a particular AI output without evidence.

## Observed failure and correction

| Finding | Detection | Correction and verification | Attribution |
|---|---|---|---|
| The first native browser player check reported 5/6 because it waited only 250 ms for `ended`. | The T06 browser check and its result were recorded in [`docs/verification/HW2_VERIFICATION.md`](docs/verification/HW2_VERIFICATION.md). | The wait was raised to 1000 ms; the browser check passed 6/6. The controlled player lifecycle tests also cover natural-end cleanup. | A test timing error occurred in the AI-assisted workflow. The retained evidence does not show whether AI introduced that wait. |

## Risks reviewed, not confirmed failures

- A FIFO queue could start tasks out of order or exceed two active loaders. The controlled scheduler suite checked start order, concurrency limits, out-of-order completion and recovery after failure.
- Cancelling during non-abortable decoding could publish a late Ready state or free a slot too soon. Cancellation tests checked ignored late results and slot retention until settlement.
- Reusing a started `AudioBufferSourceNode` or leaving an animation loop running could cause playback or resource faults. Player, visualizer and 100-cycle lifecycle checks covered these paths; the finite checks do not prove behavior for unlimited sessions.
- A high Lighthouse score could be mistaken for complete WCAG compliance. Accessibility still requires manual keyboard and assistive technology review. The HW2 evidence records browser and automated checks; any screen-reader result should be stated only where separately observed.

## Evidence limits

- No transcript or versioned set of rejected AI-generated HW2 drafts is available, so a model-specific failure rate or claim that an AI generated the T06 timing error cannot be established.
- The T10 heap readings are one-time observations with different garbage-collection conditions. They do not prove zero memory leaks.
- The T11 frame trace measures 120 intervals in a visible browser tab with a muted signal. It does not establish sustained 60 fps across devices or measure audible output quality.
- The checked-in fixtures are original generated tones with a documented CC0-1.0 grant. No third-party music or remote service is used.

The review method was to define contracts, inspect the changes, run focused tests and browser checks, then commit verified work. Actual commands and results are in the verification report and task decomposition; unobserved outcomes remain unclaimed.
