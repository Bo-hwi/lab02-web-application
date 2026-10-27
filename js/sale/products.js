/**
 * Fixed, fictional 11.11 inventory shared by the flash-sale demo and tests.
 * Stock changes belong to the sale controller, never to these source records.
 */
export const flashSaleProducts = Object.freeze([
  Object.freeze({
    id: "SALE-001",
    name: "Midnight Earbuds",
    priceVnd: 199000,
    initialStock: 2,
  }),
  Object.freeze({
    id: "SALE-002",
    name: "Wireless Mouse",
    priceVnd: 99000,
    initialStock: 1,
  }),
  Object.freeze({
    id: "SALE-003",
    name: "Compact Keyboard",
    priceVnd: 299000,
    initialStock: 0,
  }),
]);