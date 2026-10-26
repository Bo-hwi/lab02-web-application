# HW1 - Accessible Product Data Grid

An accessible product data grid implemented with semantic HTML, CSS and vanilla JavaScript. The application supports deterministic product data, combined filtering, stable sorting, pagination, persistent row selection and keyboard navigation.

## Branch

The HW1 implementation is maintained on:

```text
hw1/data-grid
```

## Technology

- Semantic HTML5
- CSS
- Vanilla JavaScript with ES Modules
- Native browser APIs
- Node.js built-in test runner
- No frontend framework
- No external runtime library

## Requirements

- Git
- A modern browser
- Node.js 18 or newer
- A local static HTTP server, such as the VS Code Live Server extension

The application must be served over HTTP because it uses JavaScript modules. Opening `index.html` directly with a `file://` URL is not supported.

## Clone and Checkout

```powershell
git clone https://github.com/Bo-hwi/lab02-web-application.git
cd lab02-web-application
git switch hw1/data-grid
```

Confirm the current branch:

```powershell
git branch --show-current
```

Expected result:

```text
hw1/data-grid
```

## Run the Application

### Using VS Code Live Server

1. Open the repository folder in VS Code.
2. Open `index.html`.
3. Select **Open with Live Server**.
4. Open the following URL if it is not opened automatically:

```text
http://127.0.0.1:5500/index.html
```

## Features

- 100 deterministic local product records
- Stable and unique product IDs
- Search by product ID or product name
- Exact category filtering
- Combined search and category filtering
- Ascending and descending column sorting
- Numeric sorting for price and stock
- English locale comparison for text
- Stable ordering for equal values
- Pagination with 10, 20 or 50 rows per page
- Selection stored by product ID
- Selection preserved across filtering, sorting and pagination
- Accurate result, page and selected-row information
- Empty-result feedback
- Keyboard navigation with a roving tab stop
- Accessible labels, table structure and live feedback

## Data Fields

Each product contains:

- `id`
- `name`
- `category`
- `price`
- `stock`

The data also includes:

- Multiple product categories
- Equal price values
- Numeric stock values
- Zero-stock products

The original product fixture is treated as immutable. Filtering, sorting and pagination return derived data instead of editing the source array.

## Data Pipeline

The displayed rows are produced in this order:

```text
source products
  -> filter by query and category
  -> sort by the active column and direction
  -> clamp the requested page
  -> select the rows for the current page
  -> render the table
```

Changing a search or category filter resets the current page to page 1. Page values are clamped so the interface does not display invalid page numbers, negative counts or `NaN`.

## Event Delegation

The application attaches a small fixed set of listeners to the application root. Events from search controls, sorting buttons, pagination controls and row checkboxes are resolved through their `data-action` attributes.

Repeated rendering does not attach duplicate listeners. Disabled controls are ignored, and the event handlers can be disposed when necessary.

## Selection Model

Selection is stored using stable product IDs rather than row positions.

This means a selected product remains selected when:

- Results are sorted
- A filter temporarily hides the product
- The user changes pages
- The table is rendered again

The selected count may include products that are not visible on the current page or in the current filtered result.

## Keyboard Controls

Use `Tab` and `Shift+Tab` to enter or leave the grid.

Inside the grid:

- `Arrow Right`: move to the next cell
- `Arrow Left`: move to the previous cell
- `Arrow Down`: move to the same column in the next row
- `Arrow Up`: move to the same column in the previous row
- `Enter`: select the focused row
- `Space`: toggle selection for the focused row

Arrow navigation is bounded to the cells rendered on the current page. It does not create a keyboard trap.

Native controls such as search fields, category selectors, sorting buttons, row checkboxes and pagination buttons retain their normal browser keyboard behavior.

## Automated Logic Tests

Run the complete HW1 logic suite:

```powershell
node --test tests/products.test.js tests/grid-model.test.js tests/grid-state.test.js tests/grid-pagination.test.js tests/grid-selection.test.js tests/grid-keyboard.test.js
```

Expected result:

```text
36 tests passed
0 tests failed
```

Run the original mini-renderer regression suite:

```powershell
node --test test-runner.js
```

Expected result:

```text
6 tests passed
0 tests failed
```

## Browser Tests

Start the local HTTP server and open:

```text
http://127.0.0.1:5500/tests/grid-render-test.html
```

Expected result:

```text
12/12 checks passed
```

Then open:

```text
http://127.0.0.1:5500/tests/grid-event-test.html
```

Expected result:

```text
8/8 checks passed
```

These browser test files require browser DOM APIs and must not be executed directly with Node.js.

## Manual Verification

Verify the following workflow in the main application:

1. Search by product ID and product name.
2. Combine a search query with a category.
3. Clear the filters.
4. Sort text and numeric columns in both directions.
5. Change the page size to 10, 20 and 50.
6. Navigate between the first, middle and final pages.
7. Select a row.
8. Sort, filter and change pages.
9. Confirm that selection remains associated with the same product ID.
10. Enter an unmatched query and confirm that the empty state appears.
11. Use only the keyboard to operate the grid.
12. Confirm that focus remains visible and predictable.

## Accessibility Verification

The final page was checked with:

- Keyboard-only navigation
- Screen-reader review
- Table names and column headers
- Sort-state announcements
- Row selection state
- Result and pagination feedback
- Visible focus indicators
- Browser zoom at 200%
- Lighthouse Accessibility
- Lighthouse Best Practices

Recorded final Lighthouse results:

```text
Accessibility: 100/100
Best Practices: 100/100
```

A Lighthouse score does not by itself prove complete WCAG conformance. Manual checks and their limitations are recorded in:

```text
docs/verification/HW1_VERIFICATION.md
```

## Project Structure

```text
.
|-- css/
|   `-- grid.css
|-- docs/
|   |-- contracts/
|   |   `-- data-grid.md
|   `-- verification/
|       `-- HW1_VERIFICATION.md
|-- js/
|   |-- data/
|   |   `-- products.js
|   `-- grid/
|       |-- events.js
|       |-- keyboard.js
|       |-- main.js
|       |-- model.js
|       |-- selection.js
|       |-- state.js
|       `-- view.js
|-- tests/
|   |-- grid-event-test.html
|   |-- grid-event.test.js
|   |-- grid-keyboard.test.js
|   |-- grid-model.test.js
|   |-- grid-pagination.test.js
|   |-- grid-render-test.html
|   |-- grid-render.test.js
|   |-- grid-selection.test.js
|   |-- grid-state.test.js
|   `-- products.test.js
|-- AI_FAILURE_AUDIT.md
|-- TASK_DECOMPOSITION.md
|-- index.html
|-- mini-react.js
|-- project-rules.md
`-- test-runner.js
```

## Implementation Decisions

- The application uses 100 deterministic local records instead of an external API.
- Search checks product IDs and names and is combined with exact category matching.
- Sorting operates on one column at a time and toggles between ascending and descending order.
- Numeric fields are sorted using their raw numeric values.
- Text fields use English locale comparison.
- Equal values retain stable input order.
- Pagination defaults to 10 rows and supports 10, 20 and 50.
- Row selection is stored by stable product ID.
- A roving tab stop is used for data-grid cell navigation.
- Native interactive elements are preserved where they provide the correct semantics.
- Contracts and verification evidence are recorded in Markdown.

## Current Limitations

- Data is local and is not loaded from a backend.
- The project does not implement product creation, editing or deletion.
- The project does not implement authentication.
- The project does not use virtual scrolling.
- Keyboard arrow navigation is limited to rows rendered on the current page.
- Screen-reader announcements can vary by browser and assistive technology.
- Lighthouse results can vary when browser extensions or unrelated browser features affect the page.

## AI Failure and Risk Audit

Verified AI-related failures and risks are recorded in:

```text
AI_FAILURE_AUDIT.md
```

The audit distinguishes observed evidence from assumptions and does not treat Lighthouse scores as complete WCAG proof.