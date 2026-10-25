/** Create the minimum grid state before filtering and sorting are enabled. */
export function createInitialGridState() {
  return {
    query: "",
    category: "",
    sortKey: null,
    sortDirection: "asc",
    page: 1,
    pageSize: 10,
    selectedIds: new Set(),
    activeCell: null,
  };
}

/** Return a new state object for one named event without mutating the old one. */
export function transitionGridState(state, event) {
  switch (event.type) {
    case "QUERY_CHANGED":
      return { ...state, query: event.value, page: 1 };
    case "CATEGORY_CHANGED":
      return { ...state, category: event.value, page: 1 };
    case "SORT_REQUESTED": {
      if (!event.sortable) return state;
      const sameColumn = state.sortKey === event.key;
      return {
        ...state,
        sortKey: event.key,
        sortDirection: sameColumn && state.sortDirection === "asc" ? "desc" : "asc",
        page: 1,
      };
    }
    case "PAGE_CHANGED":
      return Number.isInteger(event.page) && event.page >= 1
        ? { ...state, page: event.page }
        : state;
    case "PAGE_SIZE_CHANGED":
      return [10, 20, 50].includes(event.pageSize)
        ? { ...state, pageSize: event.pageSize, page: 1 }
        : state;
    case "ROW_TOGGLED": {
      if (typeof event.id !== "string" || event.id.length === 0) return state;
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(event.id)) selectedIds.delete(event.id);
      else selectedIds.add(event.id);
      return { ...state, selectedIds };
    }
    default:
      return state;
  }
}
