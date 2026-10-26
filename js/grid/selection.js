import { transitionGridState } from "./state.js";

/** Apply checkbox selection and notify only for a newly selected product. */
export function updateProductSelection(state, product, checked, onRowSelect) {
  if (!product || typeof product.id !== "string" || product.id.length === 0) return false;

  const shouldBeSelected = checked === true;
  const isSelected = state.selectedIds.has(product.id);
  if (isSelected === shouldBeSelected) return false;

  Object.assign(state, transitionGridState(state, {
    type: "ROW_TOGGLED",
    id: product.id,
  }));

  if (!isSelected && shouldBeSelected) onRowSelect?.(product);
  return true;
}
