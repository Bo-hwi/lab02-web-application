# HW1 - Data-Grid Contract

Status: Specification only; implementation and verification pending.
Branch: hw1/data-grid

## 1. Product

Each product contains:

| Field | Type | Rules |
|---|---|---|
| id | string | Non-empty, unique and stable |
| name | string | Non-empty product name |
| category | string | Non-empty category |
| price | number | Non-negative finite number, in VND |
| stock | number | Non-negative integer |

The application uses approximately 100 deterministic sample products.

Product IDs identify rows across filtering, sorting and pagination.
Array positions must not be used as product identity.

Invalid fixture data must be reported during validation.
Filtering and sorting must not mutate the original dataset.

## 2. ColumnDef and GridOptions

ColumnDef:

- header: non-empty column label.
- accessorKey: a valid Product field.
- sortable: optional boolean; defaults to false.

GridOptions:

- data: array of Product objects.
- columns: array of ColumnDef objects.
- ariaLabel: non-empty accessible name for the grid.
- onRowSelect: optional callback receiving the selected Product.

The selection checkbox column is a UI column, not a Product field.
It is not sortable.

## 3. GridState

- query: search string; initially empty.
- category: selected category, or null for all categories.
- sortKey: sortable Product field, or null for original order.
- sortDirection: "asc" or "desc"; initially "asc".
- page: integer starting at 1.
- pageSize: 10, 20 or 50; initially 10.
- selectedIds: Set of selected product IDs; initially empty.
- activeCell: { productId, columnKey }, or null if no data row exists.

Rows, result counts and page counts are derived from data and state.
Do not maintain separate editable copies of these derived values.

## 4. Data Processing

Always apply operations in this order:

original data -> filtering -> sorting -> pagination

### Filtering

- Search matches product ID or name.
- Trim leading and trailing whitespace.
- Search is case-insensitive.
- Vietnamese accents remain significant.
- Category filtering uses exact category values.
- Search and category conditions are combined with AND.
- Changing a filter resets page to 1.
- An empty query does not exclude products.

### Sorting

- Only columns marked sortable can trigger sorting.
- First activation of a different column sorts ascending.
- Repeated activation of that column toggles asc/desc.
- Price and stock use numeric comparison.
- Text uses Vietnamese locale-aware comparison.
- Equal values retain their original dataset order.
- Sorting applies to all filtered rows before pagination.
- Changing sorting resets page to 1.

### Pagination

- totalRows is the number of filtered products.
- pageCount = ceil(totalRows / pageSize).
- For non-empty results, page is clamped to 1..pageCount.
- Changing pageSize resets page to 1.
- Empty results keep internal page at 1 and pageCount at 0.
- Empty UI shows "Không có kết quả", not "Trang 1/0".
- Previous/next controls are disabled when unavailable.
- Displayed row ranges and totals must match actual results.

## 5. Row Selection

- Selection is stored by product ID.
- Multiple rows may be selected.
- Clicking a row checkbox toggles its selection.
- Enter on a data cell selects its row without toggling it off.
- Space on a data cell toggles its row selection.
- Selection persists across sorting, filtering and page changes.
- The selected count includes selected rows outside the current view.
- The interface must make this counting behavior clear.
- Checkbox state and aria-selected must agree.

onRowSelect is called once when a product changes from unselected
to selected. It is not called for deselection, repeated Enter on
an already selected row, or rendering.

Pointer and keyboard handlers must not trigger duplicate actions.

## 6. Keyboard and Focus

- ArrowUp/ArrowDown move between data rows on the current page.
- ArrowLeft/ArrowRight move between data columns.
- Arrow navigation stops at the current page boundaries.
- Arrow navigation does not change selection.
- Enter and Space follow the selection rules in section 5.
- The active data cell is the entry point into the grid body.
- Other data cells do not create additional Tab stops.
- Embedded checkboxes must not create duplicate Tab stops.
- Tab and Shift+Tab can leave the grid without a keyboard trap.
- Sort buttons and surrounding controls remain keyboard accessible.
- Native button/input behavior is preserved.
- Grid shortcuts must not intercept typing in search fields.

When updating the view:

- Preserve the active product ID and column if still visible.
- Otherwise choose the first visible row and a valid column.
- If no rows remain, activeCell becomes null.
- Filtering must not steal focus from the search/filter control.
- Pagination must not unexpectedly steal focus from its button.
- If a focused data cell is removed, restore focus to the new
  active cell, or the named grid container when results are empty.
- Focus must always have a visible indicator.

## 7. Rendering and Accessibility

- Use native table, thead, tbody, th scope="col", td and button.
- Apply grid, row, columnheader and gridcell semantics appropriately.
- Preserve the accessible name of the table.
- Each input/select and row checkbox has an accessible name.
- The active sorted header exposes the correct aria-sort value.
- Selection is not communicated through color alone.
- Announce relevant result/page/selection changes without repeatedly
  reading the entire table.
- Render data as text through safe DOM APIs.
- Never interpret product text as HTML.
- Do not attach inline event attributes.
- Delegated event listeners must not accumulate after rerendering.

## 8. Acceptance Examples

- Sorting prices 100, 2, 10 ascending produces 2, 10, 100.
- A query with no matches shows an accessible empty state.
- Filtering while on a later page resets the view to page 1.
- Selecting SP001 and then sorting keeps SP001 selected.
- Pressing Enter twice on SP001 selects it once.
- Pressing Space twice restores the original selection state.
- Arrow navigation at a boundary does not leave the valid cells.
- Typing continuously in search preserves input focus and caret.
- Text resembling HTML displays literally without execution.

## 9. Verification Targets

- Functional tests for filtering, sorting, pagination and selection.
- Browser tests for focus, keyboard interaction and event handling.
- Manual screen reader and applicable WCAG 2.2 AA checks.
- Verified Lighthouse Accessibility: 100/100.
- Verified Lighthouse Best Practices: 100/100.

These are targets, not claims that verification has already passed.