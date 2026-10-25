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

root.replaceChildren(renderToDOM(createGridView({
  data: products,
  columns,
  ariaLabel: "Product inventory",
})));
status.textContent = `${products.length} products`;

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
  },
  onKeydown() {
    // Keyboard navigation will be connected in its dedicated task.
  },
});
