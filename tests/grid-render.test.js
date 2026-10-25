import { renderToDOM } from "../mini-react.js";
import { products } from "../js/data/products.js";
import { createGridView } from "../js/grid/view.js";

const checks = [];
const check = (name, passed) => {
  checks.push({ name, passed: Boolean(passed) });
  console.assert(passed, name);
};

const columns = [
  { header: "Product name", accessorKey: "name", sortable: true },
  { header: "Price (VND)", accessorKey: "price", sortable: true },
  { header: "Stock", accessorKey: "stock" },
];

const before = JSON.stringify(products);
const table = renderToDOM(createGridView({
  data: products,
  columns,
  ariaLabel: "Rendering test inventory",
}));
document.getElementById("test-root").appendChild(table);

check("Native table sections and ARIA grid name are preserved",
  table instanceof HTMLTableElement && table.tHead && table.tBodies.length === 1 &&
  table.getAttribute("role") === "grid" &&
  table.getAttribute("aria-label") === "Rendering test inventory");

const headers = [...table.querySelectorAll("thead th")];
check("Headers follow column configuration and preserve semantics",
  headers.length === 3 && headers.every((header, index) =>
    header.textContent === columns[index].header &&
    header.scope === "col" && header.getAttribute("role") === "columnheader"));

const rows = [...table.tBodies[0].rows];
check("All 100 rows have the configured cells and stable product IDs",
  rows.length === 100 && rows.every((row, index) =>
    row.cells.length === 3 && row.dataset.productId === products[index].id &&
    row.getAttribute("role") === "row" &&
    [...row.cells].every((cell) => cell.getAttribute("role") === "gridcell")));

check("Numeric values are formatted in English and zero stock is retained",
  rows[0].cells[1].textContent === "850,000" && rows[0].cells[2].textContent === "0");

const headerButtons = [...table.querySelectorAll("thead button")];
check("Only sortable headers contain native disabled buttons",
  headerButtons.length === 2 && headerButtons.every((button) => button.disabled));

const empty = renderToDOM(createGridView({ data: [], columns, ariaLabel: "Empty inventory" }));
check("Empty data produces a full-width empty state",
  empty.tBodies[0].rows.length === 1 &&
  empty.tBodies[0].rows[0].cells[0].colSpan === 3 &&
  empty.tBodies[0].textContent === "No results found");

const payload = '<img src=x onerror="alert(1)">';
const unsafeTextTable = renderToDOM(createGridView({
  data: [{ id: "TEST-1", name: payload, price: 0, stock: 0 }],
  columns,
  ariaLabel: "Safe text rendering test",
}));
document.getElementById("test-root").appendChild(unsafeTextTable);
const payloadCell = unsafeTextTable.tBodies[0].rows[0].cells[0];
check("HTML-like product names remain inert text",
  payloadCell.textContent === payload && payloadCell.firstChild.nodeType === Node.TEXT_NODE &&
  unsafeTextTable.querySelector("img, script") === null);

check("Rendering does not mutate the source products", JSON.stringify(products) === before);

const passed = checks.filter((item) => item.passed).length;
document.getElementById("summary").textContent = `${passed}/${checks.length} checks passed`;
document.getElementById("results").textContent = checks
  .map((item) => `${item.passed ? "PASS" : "FAIL"}: ${item.name}`).join("\n");
console.table(checks);
