# HW2 Visualizer Frame Trace

- Date: 2026-10-27.
- Test page: `tests/audio-performance-test.html`, served at `http://127.0.0.1:8765/tests/audio-performance-test.html`.
- Component: production `FrequencyVisualizer` using a native `AudioContext`, analyser and muted 440 Hz oscillator. The tab was visible and device pixel ratio was 1.25.
- Method: after starting the visualizer, collect 120 consecutive `requestAnimationFrame` timestamp intervals. Observe the containing `main` for child, attribute and text mutations during the sample. Stop the visualizer, oscillator and audio context afterward.
- Result: 120 intervals over 2,000.8 ms; average 59.98 fps; median 16.7 ms; p95 16.9 ms; 0 intervals above 33.33 ms; 0 DOM mutation records. The trace is consistent with the approximately 60 fps target in this environment.

Frame intervals in milliseconds, rounded to 0.1 ms:

The rounded intervals sum to 2,000.7 ms; the reported elapsed time uses unrounded timestamps.

```text
[16.5,16.7,16.8,16.6,16.9,16.7,16.6,16.6,16.8,16.4,16.9,16.7,16.4,16.7,16.9,16.5,16.7,16.6,16.7,16.8,16.6,16.7,16.6,16.7,16.6,16.7,16.7,16.8,16.5,16.7,16.7,16.7,16.6,16.7,16.7,16.7,16.8,16.5,16.7,16.7,16.6,16.8,16.6,16.7,16.6,16.9,16.5,16.6,16.6,16.7,16.6,16.8,16.8,16.4,16.8,16.8,16.5,16.8,16.8,16.4,16.9,16.5,16.6,16.8,16.6,16.9,16.5,16.6,16.7,16.8,16.7,16.6,16.6,16.6,16.7,16.7,16.7,16.8,16.7,16.5,16.7,16.8,16.5,16.6,16.9,16.5,16.6,16.7,16.8,16.6,16.9,16.6,16.5,16.8,16.6,16.7,17,16.5,16.5,16.6,16.8,16.7,16.7,16.5,16.7,16.9,16.5,16.8,16.5,16.7,16.6,16.8,16.8,16.5,16.6,16.9,16.5,16.8,16.7,16.6]
```

This is a short single-environment sample of the visualizer component. It is not a long-session or cross-device performance guarantee. A MutationObserver does not measure Canvas pixel writes; the visualizer intentionally draws pixels each frame.
