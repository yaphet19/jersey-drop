import { SHOP_DATA } from './data.js';
import { formatETB, computeDiscountedPrice } from './money.js';
import { getCart, updateQty, removeFromCart } from './cart-store.js';

function render() {
  const cart = getCart(window.localStorage);
  const linesEl = document.getElementById('cart-lines');
  const emptyEl = document.getElementById('cart-empty');
  const subtotalRow = document.getElementById('subtotal-row');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (cart.length === 0) {
    linesEl.innerHTML = '';
    emptyEl.style.display = 'block';
    subtotalRow.style.display = 'none';
    checkoutBtn.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  subtotalRow.style.display = 'flex';
  checkoutBtn.style.display = 'block';

  let subtotal = 0;
  linesEl.innerHTML = cart
    .map((item) => {
      const product = SHOP_DATA.products.find((p) => p.id === item.productId);
      const unitPrice = computeDiscountedPrice(product.price, product.discountPercent);
      const lineTotal = unitPrice * item.qty;
      subtotal += lineTotal;
      const dataAttrs = `data-product-id="${item.productId}" data-size="${item.size}" data-sleeve="${item.sleeve}" data-fit="${item.fit}"`;
      return `
        <div class="cart-line">
          <img src="${product.image}" alt="${product.name}">
          <div class="info">
            <div class="name">${product.name}</div>
            <div class="meta">Size ${item.size} · ${item.sleeve} · ${item.fit}</div>
            <div class="meta">Qty
              <button data-action="dec" ${dataAttrs}>-</button>
              ${item.qty}
              <button data-action="inc" ${dataAttrs}>+</button>
            </div>
            <div class="remove" data-action="remove" ${dataAttrs}>Remove</div>
          </div>
          <div class="price-new">${formatETB(lineTotal)}</div>
        </div>
      `;
    })
    .join('');

  document.getElementById('subtotal-value').textContent = formatETB(subtotal);

  linesEl.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const { action, productId, size, sleeve, fit } = el.dataset;
      const current = getCart(window.localStorage).find(
        (i) => i.productId === productId && i.size === size && i.sleeve === sleeve && i.fit === fit
      );
      if (action === 'remove') {
        removeFromCart(window.localStorage, productId, size, sleeve, fit);
      } else if (action === 'inc') {
        updateQty(window.localStorage, productId, size, sleeve, fit, current.qty + 1);
      } else if (action === 'dec') {
        updateQty(window.localStorage, productId, size, sleeve, fit, current.qty - 1);
      }
      render();
    });
  });
}

render();
