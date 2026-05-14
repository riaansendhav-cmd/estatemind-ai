export function formatPrice(value) {
  if (!value && value !== 0) return "Price unavailable";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  return `₹${(value / 100000).toFixed(1)} L`;
}
