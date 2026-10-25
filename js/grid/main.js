import { renderToDOM } from "../../mini-react.js";
import { products } from "../data/products.js";
import { createGridView } from "./view.js";

const columns = [
  { header: "Product ID", accessorKey: "id", sortable: true },
  { header: "Product name", accessorKey: "name", sortable: true },
  { header: "Category", accessorKey: "category", sortable: true },
  { header: "Price (VND)", accessorKey: "price", sortable: true },
  { header: "Stock", accessorKey: "stock", sortable: true },
];

const root = document.getElementById("grid-root");
const status = document.getElementById("grid-status");

root.replaceChildren(renderToDOM(createGridView({
  data: products,
  columns,
  ariaLabel: "Product inventory",
})));

status.textContent = `${products.length} products`;
