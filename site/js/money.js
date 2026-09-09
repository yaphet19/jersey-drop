export function computeDiscountedPrice(price, discountPercent) {
  if (!discountPercent) return price;
  return Math.round(price * (1 - discountPercent / 100));
}

export function formatETB(amount) {
  return `${amount.toLocaleString('en-US')} ETB`;
}
