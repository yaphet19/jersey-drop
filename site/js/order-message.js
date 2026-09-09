import { computeDiscountedPrice, formatETB } from './money.js';

export function buildOrderSummary(cartItems, products, customer, zone, paymentMethod) {
  const lines = cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPrice = computeDiscountedPrice(product.price, product.discountPercent);
    return {
      name: product.name,
      size: item.size,
      sleeve: item.sleeve,
      fit: item.fit,
      qty: item.qty,
      unitPrice,
      lineTotal: unitPrice * item.qty,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return {
    lines,
    subtotal,
    deliveryFee: zone.fee,
    total: subtotal + zone.fee,
    customer,
    zone,
    paymentMethod,
  };
}

export function formatOrderMessage(summary) {
  const itemLines = summary.lines
    .map((l) => `- ${l.name} (${l.size}, ${l.sleeve}, ${l.fit}) x${l.qty} — ${formatETB(l.lineTotal)}`)
    .join('\n');
  return [
    'JERSEY DROP ORDER',
    itemLines,
    `Subtotal: ${formatETB(summary.subtotal)}`,
    `Delivery (${summary.zone.name}): ${formatETB(summary.deliveryFee)}`,
    `TOTAL: ${formatETB(summary.total)}`,
    '',
    `Name: ${summary.customer.name}`,
    `Phone: ${summary.customer.phone}`,
    `Address: ${summary.customer.address}`,
    `Payment method: ${summary.paymentMethod}`,
    'No payment now — pay via Telebirr/CBE when your order arrives.',
  ].join('\n');
}

export function buildWhatsAppLink(phoneE164, message) {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
}

export function buildTelegramLink(username, message) {
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`;
}
