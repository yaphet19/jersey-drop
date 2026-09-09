import { SHOP_DATA } from './data.js';
import { computeDiscountedPrice, formatETB } from './money.js';
import { getCart } from './cart-store.js';

export function renderMiniCart() {
  let el = document.getElementById('mini-cart');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mini-cart';
    el.className = 'mini-cart';
    document.body.appendChild(el);
  }

  const cart = getCart(window.localStorage);
  if (cart.length === 0) {
    el.style.display = 'none';
    return;
  }

  let count = 0;
  let subtotal = 0;
  cart.forEach((item) => {
    const product = SHOP_DATA.products.find((p) => p.id === item.productId);
    if (!product) return;
    count += item.qty;
    subtotal += computeDiscountedPrice(product.price, product.discountPercent) * item.qty;
  });

  el.style.display = 'flex';
  el.innerHTML = `
    <div class="mini-cart-info">
      <span class="mini-cart-count">${count} item${count === 1 ? '' : 's'}</span>
      <span class="mini-cart-subtotal">${formatETB(subtotal)}</span>
    </div>
    <a class="btn btn-primary mini-cart-btn" href="checkout.html">CHECKOUT</a>
  `;
}
