const CART_KEY = 'jerseydrop_cart';

function sameLine(item, productId, size, sleeve, fit) {
  return item.productId === productId && item.size === size && item.sleeve === sleeve && item.fit === fit;
}

export function getCart(storage) {
  const raw = storage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(storage, cart) {
  storage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function addToCart(storage, productId, size, sleeve, fit, qty) {
  const cart = getCart(storage);
  const existing = cart.find((item) => sameLine(item, productId, size, sleeve, fit));
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, size, sleeve, fit, qty });
  }
  return saveCart(storage, cart);
}

export function updateQty(storage, productId, size, sleeve, fit, qty) {
  const cart = getCart(storage)
    .map((item) => (sameLine(item, productId, size, sleeve, fit) ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);
  return saveCart(storage, cart);
}

export function removeFromCart(storage, productId, size, sleeve, fit) {
  const cart = getCart(storage).filter((item) => !sameLine(item, productId, size, sleeve, fit));
  return saveCart(storage, cart);
}

export function clearCart(storage) {
  storage.removeItem(CART_KEY);
}

// Drops saved items whose product is no longer in the catalog, so a cart saved
// before a catalog change can't crash the pages that look those products up.
export function pruneCart(storage, validProductIds) {
  const cart = getCart(storage).filter((item) => validProductIds.includes(item.productId));
  return saveCart(storage, cart);
}
