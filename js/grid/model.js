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
