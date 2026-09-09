import { SHOP_DATA } from './data.js';
import { formatETB } from './money.js';
import { getCart, pruneCart } from './cart-store.js';

pruneCart(window.localStorage, SHOP_DATA.products.map((p) => p.id));

if (getCart(window.localStorage).length === 0) {
  window.location.href = 'cart.html';
}

let selectedZoneId = null;

document.getElementById('city-note').textContent =
  `We deliver in ${SHOP_DATA.deliveryCity} only, from ${SHOP_DATA.deliveryFrom}.`;

function renderZones() {
  const list = document.getElementById('zone-list');
  list.innerHTML = SHOP_DATA.deliveryZones
    .map(
      (zone) => `
      <div class="zone-option" data-zone-id="${zone.id}">
        <span>${zone.name}</span>
        <span>${zone.fee === null ? 'We\'ll confirm' : formatETB(zone.fee)}</span>
      </div>
    `
    )
    .join('');

  list.querySelectorAll('.zone-option').forEach((el) => {
    el.addEventListener('click', () => {
      list.querySelectorAll('.zone-option').forEach((o) => o.classList.remove('selected'));
      el.classList.add('selected');
      selectedZoneId = el.dataset.zoneId;
      checkFormValid();
    });
  });
}

function checkFormValid() {
  const name = document.getElementById('field-name').value.trim();
  const phone = document.getElementById('field-phone').value.trim();
  const address = document.getElementById('field-address').value.trim();
  document.getElementById('submit-btn').disabled = !(name && phone && address && selectedZoneId);
}

['field-name', 'field-phone', 'field-address'].forEach((id) => {
  document.getElementById(id).addEventListener('input', checkFormValid);
});

document.getElementById('checkout-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const checkoutInfo = {
    name: document.getElementById('field-name').value.trim(),
    phone: document.getElementById('field-phone').value.trim(),
    zoneId: selectedZoneId,
    address: document.getElementById('field-address').value.trim(),
  };
  window.localStorage.setItem('jerseydrop_checkout', JSON.stringify(checkoutInfo));
  window.location.href = 'receipt.html';
});

renderZones();
