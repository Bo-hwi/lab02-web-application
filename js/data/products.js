/**
 * Deterministic product fixtures for the HW1 data grid.
 * Prices are numeric VND amounts; formatting belongs to the view.
 */
const templates = [
  { name: "Mechanical Keyboard", category: "Accessories", price: 850000 },
  { name: "Wireless Mouse", category: "Accessories", price: 350000 },
  { name: "USB-C Hub", category: "Accessories", price: 450000 },
  { name: "Portable Monitor", category: "Displays", price: 3200000 },
  { name: "Desktop Monitor", category: "Displays", price: 4500000 },
  { name: "Wireless Headphones", category: "Audio", price: 1200000 },
  { name: "Desktop Speakers", category: "Audio", price: 850000 },
  { name: "External SSD", category: "Storage", price: 1800000 },
  { name: "USB Flash Drive", category: "Storage", price: 180000 },
  { name: "Laptop Stand", category: "Office", price: 450000 },
];

export const products = Object.freeze(
  Array.from({ length: 100 }, (_, index) => {
    const template = templates[index % templates.length];
    const series = Math.floor(index / templates.length) + 1;

    return Object.freeze({
      id: `SP${String(index + 1).padStart(3, "0")}`,
      name: `${template.name} - Series ${series}`,
      category: template.category,
      price: template.price,
      stock: (index * 7) % 41,
    });
  }),
);
