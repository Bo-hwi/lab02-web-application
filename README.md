# HW3: 11.11 Flash Sale Simulator

This branch implements the Lab 02 HW3 flash sale in HTML, CSS and vanilla JavaScript. It runs locally in one browser page. No framework, third-party package, account, payment service or backend is required.

## Run

1. Clone the repository and switch to `hw3/flash-sale`.
2. In the repository root, start a static HTTP server. For example, run `python -m http.server 8765` (or `py -3 -m http.server 8765` on Windows).
3. Open `http://127.0.0.1:8765/` in a browser. The page starts a new five-minute sale immediately. JavaScript modules need HTTP; opening `index.html` directly as a `file://` URL is not the supported setup.

To check the code with Node.js, run these commands from the repository root:

```sh
node --test tests/*.test.js
node --test test-runner.js
```

The first command covers the HW3 product fixture, deadline clock, inventory transitions, FIFO queue, controller and lifecycle. The second reruns the inherited Mini-React baseline. `dom-mount-test.html` and `xss-security-test.html` are inherited browser checks; serve them from the same local server if you want to rerun them.

## Use the simulator

- **Reserve** creates a 30-second hold if the sale is still open and that product has stock. The page shows the hold ID, remaining seconds and updated available stock.
- **Checkout** completes a valid hold without taking payment. **Cancel hold** releases it. At the hold deadline, expiry releases it automatically. Checkout at the exact deadline is too late.
- The five-minute sale clock closes new reservations at zero. An existing, unexpired hold can still be checked out after the sale closes.
- **Reset sale** clears holds and checkout state, restores starting stock and starts another five-minute run. Reset also disposes the previous session's timers and subscription.
- The three fixed products are Midnight Earbuds (`SALE-001`, 199,000 VND, stock 2), Wireless Mouse (`SALE-002`, 99,000 VND, stock 1) and Compact Keyboard (`SALE-003`, 299,000 VND, stock 0). The zero-stock product cannot be reserved.

Use Tab and Shift+Tab to move among the native buttons. Enter or Space activates a focused button. Status text reports reservation outcomes and expiry. The second-by-second clock is kept out of the live region; a separate polite status announces ten-second milestones, the final five seconds and sale closure.

## Code map

| Path | Purpose |
|---|---|
| `index.html`, `css/sale.css` | Semantic page and visual styling |
| `js/sale/products.js` | Immutable fixed product data |
| `js/sale/clock.js` | Countdown based on an absolute deadline |
| `js/sale/inventory.js` | Stock and reservation state transitions |
| `js/sale/queue.js` | Ordered, single-runtime reservation requests |
| `js/sale/controller.js` | Coordinates queue, inventory and hold-expiry scheduling |
| `js/sale/main.js` | Browser rendering, actions, announcements and session reset |
| `tests/*.test.js` | Node tests for HW3 domain behavior and lifecycle |
| `docs/contracts/flash-sale.md` | Detailed behavioral contract and limits |
| `docs/verification/HW3_VERIFICATION.md` | Actual test and browser observations |
| `TASK_DECOMPOSITION.md`, `AI_FAILURE_AUDIT.md` | Work breakdown and review of earlier implementation gaps |

## Simulation limits

The FIFO queue serializes requests only inside this page's JavaScript runtime. Opening another tab creates an independent stock copy. This demo has no shared inventory authority, trusted server time, durable orders or payment processing. The `local-buyer` identity is a fixed demo value. Timers depend on browser scheduling, while remaining time and hold validity are calculated from absolute timestamps. Automated tests and accessibility-tree checks do not establish what a screen reader actually speaks or prove full WCAG 2.2 AA conformance.

For a reproducible review of earlier gaps and their fixes, see `AI_FAILURE_AUDIT.md`. For recorded verification and its limits, see `docs/verification/HW3_VERIFICATION.md`.
