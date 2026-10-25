import { filterProducts } from "./model.js";
import { renderToDOM } from "../../mini-react.js";
import { products } from "../data/products.js";
import { createGridView } from "./view.js";
import { setupGridEventHub } from "./events.js";
import { createInitialGridState, transitionGridState } from "./state.js";

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
const categoryFilter = document.getElementById("category-filter");

for (const category of new Set(products.map((product) => product.category))) {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = category;
  categoryFilter.append(option);
}

function render() {
  const visibleProducts = filterProducts(products, {
    query: state.query,
    category: state.category,
  });
  const focusedSortKey = root.contains(document.activeElement)
    ? document.activeElement.dataset.sortKey
    : undefined;
  root.replaceChildren(renderToDOM(createGridView({
    data: visibleProducts,
    columns,
    ariaLabel: "Product inventory",
  })));

  if (focusedSortKey) {
  const replacementButton = [...root.querySelectorAll("[data-sort-key]")]
    .find((button) => button.dataset.sortKey === focusedSortKey);

  replacementButton?.focus({ preventScroll: true });
}

  status.textContent = `${visibleProducts.length} products`;
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
    render();
  },
  onKeydown() {
    // Keyboard navigation will be connected in its dedicated task.
  },
});
