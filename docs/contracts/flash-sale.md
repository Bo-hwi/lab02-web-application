# HW3 Flash-Sale Contract

## Scenario and fixtures

This is a fictional Vietnam 11.11 midnight flash sale in one browser session. It uses English UI, integer VND prices and no accounts, payments, merchant integration or network inventory service. Each run establishes an absolute sale deadline of nowMs + 300000 (five minutes); reset starts a new run. The 11.11 theme is illustrative so the demo works on any calendar date.

| ID | Product | Price VND | Initial stock |
|---|---|---:|---:|
| SALE-001 | Midnight Earbuds | 199000 | 2 |
| SALE-002 | Wireless Mouse | 99000 | 1 |
| SALE-003 | Compact Keyboard | 299000 | 0 |

Fixtures are immutable, with unique IDs and nonnegative integer prices and stock. Format price using Intl.NumberFormat with locale vi-VN, currency VND and zero fractional digits. Calculations use integer VND.

## Inventory authority and invariants

One in-memory sale controller owns inventory, reservations, processed request results and request ordering for one page instance. The UI only reads projections of its state. Per product, available = initialStock - checkedOutCount - activeReservedCount, and available is always nonnegative. An active reservation is RESERVED with a future expiry after due expirations have been processed. Checkout moves one unit from active reserved to checked out, so available does not change. Expiry and cancellation release a unit exactly once. Rejections change nothing. A buyer may hold at most one active reservation for each product. Reservation IDs are unique and tied to one buyer and one product.

Reservation records have RESERVED, EXPIRED, CHECKED_OUT and CANCELLED states. AVAILABLE is a derived quantity rather than a stored reservation state. Terminal records remain inspectable and consume no stock.

## Time and timer

Production receives a clock dependency whose default now() calls Date.now(). Tests inject now() and a frame scheduler. All timestamps are Unix milliseconds. Each display callback computes remainingMs = max(0, saleEndsAtMs - now()); delayed callbacks must show actual remaining time rather than accumulated frame durations. At zero, emit one final zero display and stop scheduling. A timer started after its deadline emits zero once without scheduling. Stop or dispose cancels the outstanding frame and prevents later UI or state updates. requestAnimationFrame only controls display cadence; it does not measure time or guarantee millisecond repaint frequency. Display whole seconds and three-digit milliseconds, clamped at zero.

An accepted hold expires at acceptedAtMs + 30000. Process due holds from the injected clock before every command and on scheduled expiry checks. A delayed callback cannot extend a hold. At nowMs equal to expiresAtMs, expiry wins over checkout.

## Ordered requests

Reserve requests receive monotonically increasing sequence numbers and are processed serially in that order within one JavaScript runtime. For each command, expire due holds at observed nowMs, evaluate guards, then commit at most one transition. Rendering cannot change order. Every request settles once with success or a named rejection.

A reserve request has a stable requestId, buyerId and productId. A repeated processed requestId returns its original result without mutating stock; the caller must separately inspect current hold state because it may have expired. A second reserve from the same buyer and product while a hold is active returns the existing hold without consuming another unit. Invalid input or product rejects as INVALID_REQUEST. A closed sale rejects as SALE_CLOSED; no available stock rejects as SOLD_OUT. A request cancelled while pending settles as REQUEST_CANCELLED and never reserves stock. An accepted hold can be released only with the distinct CANCEL event.

This is deterministic local contention, not parallel execution or a cross-tab lock. Atomic consistency across tabs, devices or processes requires a server-controlled transaction or atomic inventory operation, authenticated buyers and trusted server time.

## Transition table

Before each event, expire all holds with nowMs >= expiresAtMs. New reservations close at nowMs >= saleEndsAtMs. Existing valid holds may check out after sale close until their own expiry.

| State | Event | Guard | Result | Stock effect |
|---|---|---|---|---|
| No hold | RESERVE | Sale open, valid buyer/product, available > 0 | Create unique RESERVED hold | Active reserved +1; available -1 |
| No hold | RESERVE | Sale closed | Reject SALE_CLOSED | None |
| No hold | RESERVE | Available = 0 | Reject SOLD_OUT | None |
| No hold | RESERVE | Invalid input or product | Reject INVALID_REQUEST | None |
| RESERVED | Duplicate RESERVE by same buyer/product | Hold active | Return existing hold | None |
| RESERVED | CHECKOUT | Same buyer and nowMs < expiresAtMs | CHECKED_OUT, simulated success | Active reserved -1; checked out +1 |
| RESERVED | EXPIRE | nowMs >= expiresAtMs | EXPIRED | Active reserved -1; available +1 |
| RESERVED | CANCEL | Same buyer, hold active | CANCELLED | Active reserved -1; available +1 |
| EXPIRED | CHECKOUT or CANCEL | Any time | Reject HOLD_EXPIRED or ALREADY_SETTLED | None |
| CHECKED_OUT | CHECKOUT, CANCEL or EXPIRE | Any time | Reject ALREADY_SETTLED | None |
| CANCELLED | CHECKOUT, CANCEL or EXPIRE | Any time | Reject ALREADY_SETTLED | None |

Unknown reservation IDs reject as UNKNOWN_RESERVATION; a buyer mismatch rejects as NOT_HOLD_OWNER. At the exact expiry boundary, expire before attempting checkout. Terminal states never transition again. Repeated expiry never releases twice. A buyer may reserve afresh after expiry or cancellation if the sale remains open and stock exists. Checkout never charges real money.

## Visible actions and accessibility

Show countdown, product ID/name, VND price, available stock and current buyer hold state. Reserve is available only while the sale is open and stock exists. Checkout and Cancel reservation are available only for that buyer's valid hold. Explain disabled actions with visible text. Pending requests expose pending feedback and may be cancelled before processing. Successful reserve shows hold ID and time remaining; checkout shows simulated success; cancellation and expiry show updated availability; rejection shows its named reason without claiming a stock change.

Use semantic headings, labeled native controls and product groups or a table. All actions work by keyboard. Render product strings as text nodes or textContent, never executable HTML. Keep focus on an invoking control when it remains. If it is removed, move focus to a relevant next action or focusable status heading. Reset disposes old timers and listeners.

Frequent countdown repainting must not constantly speak through a live region. Announce coarse milestones (each 10 seconds and each of the final five seconds), one final sale-ended message and reservation outcomes in a polite status region. Use an assertive alert only for actionable errors. Routine timer ticks never move focus. Maintain visible focus and sufficient text contrast.

## Later verification targets

T03-T11 tests should cover delayed frames, expired deadlines, exact expiry/checkout boundaries, duplicate requests and holds, FIFO contention beyond stock, pending cancellation, repeated terminal events, reset/disposal and nonnegative stock. Browser checks should cover reserve, sold out, checkout, expiry, keyboard operation, focus and announcements. These are targets, not completed T02 runtime claims.
