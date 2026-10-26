/** Return matching products without changing the source array or its records. */
export function filterProducts(products, { query = "", category = "" } = {}) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase("en");

  return products.filter((product) => {
    const matchesQuery = normalizedQuery === "" ||
      product.id.toLocaleLowerCase("en").includes(normalizedQuery) ||
      product.name.toLocaleLowerCase("en").includes(normalizedQuery);
    const matchesCategory = category === "" || product.category === category;

    return matchesQuery && matchesCategory;
  });
}

/** Return a stable sorted copy when the configured column is sortable. */
export function sortProducts(products, { key = null, direction = "asc", columns = [] } = {}) {
  const column = columns.find((item) => item.accessorKey === key && item.sortable);
  if (!column || !["asc", "desc"].includes(direction)) return [...products];

  const directionMultiplier = direction === "desc" ? -1 : 1;
  return products
    .map((product, originalPosition) => ({ product, originalPosition }))
    .sort((left, right) => {
      const leftValue = left.product[column.accessorKey];
      const rightValue = right.product[column.accessorKey];
      let comparison;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        comparison = leftValue - rightValue;
      } else {
        comparison = String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "en");
      }

      return comparison === 0
        ? left.originalPosition - right.originalPosition
        : comparison * directionMultiplier;
    })
    .map(({ product }) => product);
}

/** Return one valid page slice and its derived row/page counts. */
export function paginateProducts(products, { page = 1, pageSize = 10 } = {}) {
  const normalizedPageSize = [10, 20, 50].includes(pageSize) ? pageSize : 10;
  const requestedPage = Number.isInteger(page) && page >= 1 ? page : 1;
  const totalRows = products.length;
  const pageCount = Math.ceil(totalRows / normalizedPageSize);
  const currentPage = pageCount === 0 ? 1 : Math.min(requestedPage, pageCount);
  const startIndex = (currentPage - 1) * normalizedPageSize;
  const endIndex = Math.min(startIndex + normalizedPageSize, totalRows);

  return {
    items: products.slice(startIndex, endIndex),
    page: currentPage,
    pageSize: normalizedPageSize,
    pageCount,
    totalRows,
    startRow: totalRows === 0 ? 0 : startIndex + 1,
    endRow: endIndex,
  };
}
