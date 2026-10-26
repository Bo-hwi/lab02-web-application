/** Return the adjacent cell, clamped to the current page's valid bounds. */
export function getAdjacentCell(rows, activeCell, key, columnKeys) {
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(columnKeys) || columnKeys.length === 0) {
    return null;
  }

  let rowIndex = rows.findIndex((product) => product.id === activeCell?.productId);
  let columnIndex = columnKeys.indexOf(activeCell?.columnKey);
  if (rowIndex < 0) rowIndex = 0;
  if (columnIndex < 0) columnIndex = 0;

  if (key === "ArrowUp") rowIndex = Math.max(0, rowIndex - 1);
  else if (key === "ArrowDown") rowIndex = Math.min(rows.length - 1, rowIndex + 1);
  else if (key === "ArrowLeft") columnIndex = Math.max(0, columnIndex - 1);
  else if (key === "ArrowRight") columnIndex = Math.min(columnKeys.length - 1, columnIndex + 1);
  else return null;

  return { productId: rows[rowIndex].id, columnKey: columnKeys[columnIndex] };
}
