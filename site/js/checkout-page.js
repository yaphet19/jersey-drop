import { SHOP_DATA } from './data.js';
import { formatETB } from './money.js';
import { getCart } from './cart-store.js';

if (getCart(window.localStorage).length === 0) {
  window.location.href = 'cart.html';
}

document.getElementById('city-note').textContent =
  `We currently deliver in ${SHOP_DATA.deliveryCity} only — flat delivery fee of ${formatETB(SHOP_DATA.deliveryFee)}.`;

function checkFormValid() {
  const name = document.getElementById('field-name').value.trim();
  const phone = document.getElementById('field-phone').value.trim();
  const area = document.getElementById('field-area').value.trim();
  const address = document.getElementById('field-address').value.trim();
  document.getElementById('submit-btn').disabled = !(name && phone && area && address);
}

['field-name', 'field-phone', 'field-area', 'field-address'].forEach((id) => {
  document.getElementById(id).addEventListener('input', checkFormValid);
});

document.getElementById('checkout-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const checkoutInfo = {
    name: document.getElementById('field-name').value.trim(),
    phone: document.getElementById('field-phone').value.trim(),
    area: document.getElementById('field-area').value.trim(),
    address: document.getElementById('field-address').value.trim(),
  };
  window.localStorage.setItem('jerseydrop_checkout', JSON.stringify(checkoutInfo));
  window.location.href = 'receipt.html';
});
