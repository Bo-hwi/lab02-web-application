import { filterProducts, paginateProducts, sortProducts } from "./model.js";
import { renderToDOM } from "../../mini-react.js";
import { products } from "../data/products.js";
import { createGridView } from "./view.js";
import { setupGridEventHub } from "./events.js";
import { createInitialGridState, transitionGridState } from "./state.js";
import { updateProductSelection } from "./selection.js";
import { getAdjacentCell } from "./keyboard.js";

const columns = [
  { header: "Product ID", accessorKey: "id", sortable: true },
  { header: "Product name", accessorKey: "name", sortable: true },
  { header: "Category", accessorKey: "category", sortable: true },
  { header: "Price (VND)", accessorKey: "price", sortable: true },
  { header: "Stock", accessorKey: "stock", sortable: true },
];

const state = createInitialGridState();
const root = document.getElementById("grid-root");
const status = document.getElementById("grid-status");
const selectionStatus = document.getElementById("selection-status");
const announcement = document.getElementById("grid-announcement");
const categoryFilter = document.getElementById("category-filter");
const previousPageButton = document.getElementById("previous-page");
const nextPageButton = document.getElementById("next-page");
const pageSizeControl = document.getElementById("page-size");
const onRowSelect = typeof window.onGridRowSelect === "function"
  ? window.onGridRowSelect
  : undefined;
const columnKeys = ["selection", ...columns.map((column) => column.accessorKey)];
let currentPageProducts = [];
let searchAnnouncementTimer = null;

function announce(message) {
  clearTimeout(searchAnnouncementTimer);
  searchAnnouncementTimer = null;
  announcement.textContent = message;
}

function describeResults(pageResult) {
  if (pageResult.totalRows === 0) return "0 products found.";
  return `${pageResult.totalRows} products found. Showing rows ${pageResult.startRow} ` +
    `to ${pageResult.endRow}, page ${pageResult.page} of ${pageResult.pageCount}.`;
}

function announceFilteredResults(pageResult) {
  clearTimeout(searchAnnouncementTimer);
  searchAnnouncementTimer = setTimeout(() => {
    searchAnnouncementTimer = null;
    announce(describeResults(pageResult));
  }, 350);
}

function changeSelection(product, checked, focusActiveCell = false) {
  if (!updateProductSelection(state, product, checked, onRowSelect)) return false;
  render({ focusActiveCell });
  announce(`${product.name} (${product.id}) ${checked ? "selected" : "deselected"}. ` +
    `${state.selectedIds.size} selected total.`);
  return true;
}

for (const category of new Set(products.map((product) => product.category))) {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = category;
  categoryFilter.append(option);
}

function render({ focusActiveCell = false } = {}) {
  const visibleProducts = filterProducts(products, {
    query: state.query,
    category: state.category,
  });
  const sortedProducts = sortProducts(visibleProducts, {
    key: state.sortKey,
    direction: state.sortDirection,
    columns,
  });
  const pageResult = paginateProducts(sortedProducts, {
    page: state.page,
    pageSize: state.pageSize,
  });
  state.page = pageResult.page;
  currentPageProducts = pageResult.items;
  if (currentPageProducts.length === 0) {
    state.activeCell = null;
  } else if (
    !state.activeCell ||
    !currentPageProducts.some((product) => product.id === state.activeCell.productId) ||
    !columnKeys.includes(state.activeCell.columnKey)
  ) {
    state.activeCell = {
      productId: currentPageProducts[0].id,
      columnKey: columnKeys.includes(state.activeCell?.columnKey)
        ? state.activeCell.columnKey
        : columnKeys[0],
    };
  }
  const focusedElement = root.contains(document.activeElement) ? document.activeElement : null;
  const focusedSortKey = focusedElement?.dataset.sortKey;
  const focusedProductId = focusedElement instanceof HTMLInputElement
    ? focusedElement.dataset.productId
    : undefined;
  const focusedCell = focusedElement?.closest?.('[role="gridcell"][data-product-id][data-column-key]');
  const focusedCellPosition = focusedCell
    ? { productId: focusedCell.dataset.productId, columnKey: focusedCell.dataset.columnKey }
    : null;
  root.replaceChildren(renderToDOM(createGridView({
    data: pageResult.items,
    columns,
    ariaLabel: "Product inventory",
    ariaDescribedBy: "keyboard-help",
    sortKey: state.sortKey,
    sortDirection: state.sortDirection,
    selectedIds: state.selectedIds,
    activeCell: state.activeCell,
  })));

  const cellToFocus = focusActiveCell
    ? state.activeCell
    : focusedCellPosition;
  if (focusedSortKey) {
    [...root.querySelectorAll("[data-sort-key]")]
      .find((button) => button.dataset.sortKey === focusedSortKey)
      ?.focus({ preventScroll: true });
  } else if (focusedProductId) {
    const checkbox = [...root.querySelectorAll('input[data-grid-action="row-selection"]')]
      .find((item) => item.dataset.productId === focusedProductId);
    if (checkbox) checkbox.focus({ preventScroll: true });
    else focusCellOrGrid(cellToFocus);
  } else if (cellToFocus) {
    focusCellOrGrid(cellToFocus);
  } else if (focusedElement && !root.contains(document.activeElement)) {
    focusCellOrGrid(null);
  }

  status.textContent = pageResult.totalRows === 0
    ? "0 products"
    : `${pageResult.totalRows} products · Showing ${pageResult.startRow}-${pageResult.endRow}` +
      ` (Page ${pageResult.page} of ${pageResult.pageCount})`;
  previousPageButton.disabled = pageResult.pageCount === 0 || pageResult.page === 1;
  nextPageButton.disabled = pageResult.pageCount === 0 || pageResult.page === pageResult.pageCount;
  pageSizeControl.value = String(pageResult.pageSize);
  const selectedCount = state.selectedIds.size;
  selectionStatus.textContent = `${selectedCount} selected; count includes products outside this page`;
  return pageResult;
}

function focusCellOrGrid(cellPosition) {
  const cells = [...root.querySelectorAll('[role="gridcell"][data-product-id][data-column-key]')];
  const cell = cellPosition
    ? cells.find((item) => item.dataset.productId === cellPosition.productId &&
        item.dataset.columnKey === cellPosition.columnKey)
    : null;
  const activeCell = state.activeCell
    ? cells.find((item) => item.dataset.productId === state.activeCell.productId &&
      item.dataset.columnKey === state.activeCell.columnKey)
    : null;
  (cell ?? activeCell ?? root.querySelector('[role="grid"]'))?.focus({ preventScroll: true });
}

render();

setupGridEventHub(document.querySelector("main"), {
  onAction(action) {
    let stateEvent = null;
    switch (action.action) {
      case "query":
        stateEvent = { type: "QUERY_CHANGED", value: action.value };
        break;
      case "category":
        stateEvent = { type: "CATEGORY_CHANGED", value: action.value };
        break;
      case "sort": {
        const sortKey = action.event.target.closest("[data-sort-key]")?.dataset.sortKey;
        const column = columns.find((item) => item.accessorKey === sortKey);
        stateEvent = {
          type: "SORT_REQUESTED",
          key: column?.accessorKey,
          sortable: Boolean(column?.sortable),
        };
        break;
      }
      case "page-size":
        stateEvent = { type: "PAGE_SIZE_CHANGED", pageSize: Number(action.value) };
        break;
      case "row-selection": {
        const productId = action.event.target.dataset.productId;
        const product = products.find((item) => item.id === productId);
        if (!product) return;
        changeSelection(product, action.checked);
        return;
      }
      case "previous-page":
        stateEvent = { type: "PAGE_CHANGED", page: state.page - 1 };
        break;
      case "next-page":
        stateEvent = { type: "PAGE_CHANGED", page: state.page + 1 };
        break;
      default:
        return;
    }
    Object.assign(state, transitionGridState(state, stateEvent));
    const pageResult = render();
    if (action.action === "query") {
      announceFilteredResults(pageResult);
    } else if (action.action === "category") {
      announce(describeResults(pageResult));
    } else if (action.action === "sort") {
      const column = columns.find((item) => item.accessorKey === state.sortKey);
      if (column) announce(`Sorted by ${column.header}, ${state.sortDirection}. ${describeResults(pageResult)}`);
    } else if (action.action === "page-size") {
      announce(`${state.pageSize} rows per page. ${describeResults(pageResult)}`);
    } else if (action.action === "previous-page" || action.action === "next-page") {
      announce(describeResults(pageResult));
    }
  },
  onKeydown({ key, target, event }) {
    if (!(target instanceof Element)) return;
    const cell = target.closest('#grid-root [role="gridcell"][data-product-id][data-column-key]');
    const checkbox = target instanceof HTMLInputElement && target.type === "checkbox"
      ? target
      : null;

    if (key === "Enter" && checkbox) {
      const product = products.find((item) => item.id === checkbox.dataset.productId);
      if (!product) return;
      event.preventDefault();
      changeSelection(product, true, true);
      return;
    }

    if (!cell || target !== cell) return;
    const product = products.find((item) => item.id === cell.dataset.productId);
    if (!product) return;

    if (key === "Enter") {
      event.preventDefault();
      changeSelection(product, true, true);
      return;
    }

    if (key === " ") {
      event.preventDefault();
      const shouldSelect = !state.selectedIds.has(product.id);
      changeSelection(product, shouldSelect, true);
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
      event.preventDefault();
      const nextCell = getAdjacentCell(currentPageProducts, {
        productId: cell.dataset.productId,
        columnKey: cell.dataset.columnKey,
      }, key, columnKeys);
      if (nextCell && (nextCell.productId !== state.activeCell?.productId ||
        nextCell.columnKey !== state.activeCell?.columnKey)) {
        state.activeCell = nextCell;
        render({ focusActiveCell: true });
      }
    }
  },
  onFocusin({ target }) {
    if (!(target instanceof Element)) return;
    const cell = target.closest('#grid-root [role="gridcell"][data-product-id][data-column-key]');
    if (cell) {
      state.activeCell = {
        productId: cell.dataset.productId,
        columnKey: cell.dataset.columnKey,
      };
      for (const gridCell of root.querySelectorAll('[role="gridcell"][data-product-id]')) {
        gridCell.tabIndex = gridCell === cell ? 0 : -1;
      }
    }
  },
});
