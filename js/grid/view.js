import { createElement } from "../../mini-react.js";

const numberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

/** Build a table VNode without changing data or registering listeners. */
export function createGridView({
  data,
  columns,
  ariaLabel,
  ariaDescribedBy = null,
  sortKey = null,
  sortDirection = "asc",
  selectedIds = new Set(),
  activeCell = null,
}) {
  const headers = [
    createElement("th", { scope: "col", role: "columnheader" }, "Selection"),
    ...columns.map((column) =>
    createElement("th", {
      scope: "col",
      role: "columnheader",
      "data-column-key": column.accessorKey,
      ...(sortKey === column.accessorKey
        ? { "aria-sort": sortDirection === "desc" ? "descending" : "ascending" }
        : {}),
    }, column.sortable
      ? createElement("button", {
        type: "button",
        "data-grid-action": "sort",
        "data-sort-key": column.accessorKey,
        "aria-label": sortKey === column.accessorKey
          ? `${column.header}, sorted ${sortDirection === "desc" ? "descending" : "ascending"}; activate to reverse`
          : `Sort by ${column.header} ascending`,
      }, `${column.header}${sortKey === column.accessorKey
        ? sortDirection === "desc" ? " ▼" : " ▲"
        : ""}`)
      : column.header)),
  ];

  const rows = data.map((product) =>
    createElement("tr", {
      role: "row",
      key: product.id,
      "data-product-id": product.id,
      "aria-selected": selectedIds.has(product.id) ? "true" : "false",
    }, [
      createElement("td", {
        role: "gridcell",
        "data-column-key": "selection",
        "data-product-id": product.id,
        tabIndex: activeCell?.productId === product.id && activeCell?.columnKey === "selection" ? 0 : -1,
      },
        createElement("input", {
          type: "checkbox",
          checked: selectedIds.has(product.id),
          tabIndex: -1,
          "data-grid-action": "row-selection",
          "data-product-id": product.id,
          "aria-label": `Select ${product.id}: ${product.name}`,
        })),
      ...columns.map((column) => {
      const value = product[column.accessorKey];
      const text = typeof value === "number"
        ? numberFormatter.format(value)
        : String(value ?? "");
      return createElement("td", {
        role: "gridcell",
        "data-column-key": column.accessorKey,
        "data-product-id": product.id,
        tabIndex: activeCell?.productId === product.id && activeCell?.columnKey === column.accessorKey ? 0 : -1,
      }, text);
    })]),
  );

  if (rows.length === 0) {
    rows.push(createElement("tr", { role: "row" },
      createElement("td", {
        role: "gridcell",
        colSpan: columns.length + 1,
      }, "No results found"),
    ));
  }

  return createElement("table", {
    role: "grid",
    "aria-label": ariaLabel,
    ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
    ...(rows.length === 0 ? { tabIndex: -1 } : {}),
  },
    createElement("thead", null, createElement("tr", { role: "row" }, headers)),
    createElement("tbody", null, rows));
}
