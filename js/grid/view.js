import { createElement } from "../../mini-react.js";

const numberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

/** Build a table VNode without changing data or registering listeners. */
export function createGridView({ data, columns, ariaLabel }) {
  const headers = columns.map((column) =>
    createElement("th", {
      scope: "col",
      role: "columnheader",
      "data-column-key": column.accessorKey,
    }, column.sortable
      ? createElement("button", {
        type: "button",
        disabled: true,
        "data-grid-action": "sort",
        "data-sort-key": column.accessorKey,
      }, column.header)
      : column.header),
  );

  const rows = data.map((product) =>
    createElement("tr", {
      role: "row",
      key: product.id,
      "data-product-id": product.id,
    }, columns.map((column) => {
      const value = product[column.accessorKey];
      const text = typeof value === "number"
        ? numberFormatter.format(value)
        : String(value ?? "");
      return createElement("td", {
        role: "gridcell",
        "data-column-key": column.accessorKey,
      }, text);
    })),
  );

  if (rows.length === 0) {
    rows.push(createElement("tr", { role: "row" },
      createElement("td", {
        role: "gridcell",
        colSpan: columns.length,
      }, "No results found"),
    ));
  }

  return createElement("table", { role: "grid", "aria-label": ariaLabel },
    createElement("thead", null, createElement("tr", { role: "row" }, headers)),
    createElement("tbody", null, rows));
}
