import { SHOP_DATA } from './data.js';
import { getCart, clearCart, pruneCart } from './cart-store.js';
import { formatETB } from './money.js';
import { buildOrderSummary, formatOrderMessage, buildWhatsAppLink, buildTelegramLink } from './order-message.js';

pruneCart(window.localStorage, SHOP_DATA.products.map((p) => p.id));

const cart = getCart(window.localStorage);
const checkoutInfoRaw = window.localStorage.getItem('jerseydrop_checkout');

if (cart.length === 0 || !checkoutInfoRaw) {
  window.location.href = 'cart.html';
} else {
  const checkoutInfo = JSON.parse(checkoutInfoRaw);
  const zone = { name: `${SHOP_DATA.deliveryCity} — ${checkoutInfo.area}`, fee: SHOP_DATA.deliveryFee };
  const customer = { name: checkoutInfo.name, phone: checkoutInfo.phone, address: checkoutInfo.address };

  let selectedPaymentMethod = 'Telebirr';

  function renderSummary() {
    const summary = buildOrderSummary(cart, SHOP_DATA.products, customer, zone, selectedPaymentMethod);

    document.getElementById('receipt-lines').innerHTML = summary.lines
      .map(
        (l) => `
        <div class="receipt-line">
          <span>${l.name} <span class="qty">x${l.qty}, ${l.size}, ${l.sleeve}, ${l.fit}</span></span>
          <span>${formatETB(l.lineTotal)}</span>
        </div>
      `
      )
      .join('');
    document.getElementById('receipt-subtotal').textContent = formatETB(summary.subtotal);
    document.getElementById('receipt-delivery-label').textContent = `Delivery fee (${zone.name})`;
    document.getElementById('receipt-delivery-value').textContent = formatETB(summary.deliveryFee);
    document.getElementById('receipt-total').textContent = formatETB(summary.total);

    const message = formatOrderMessage(summary);
    document.getElementById('whatsapp-link').href = buildWhatsAppLink(SHOP_DATA.whatsappNumber, message);
    document.getElementById('telegram-link').href = buildTelegramLink(SHOP_DATA.telegramUsername, message);
  }

  function renderPayOptions() {
    const payOptionsEl = document.getElementById('pay-options');
    const options = [
      { id: 'Telebirr', label: 'Telebirr', detail: `Send to ${SHOP_DATA.telebirrNumber} when the delivery person arrives, then confirm.` },
      { id: 'CBE', label: 'CBE (bank transfer)', detail: `Account ${SHOP_DATA.cbeAccount}, confirm with your screenshot.` },
    ];
    payOptionsEl.innerHTML = options
      .map(
        (opt) => `
        <div class="pay-option ${opt.id === selectedPaymentMethod ? 'selected' : ''}" data-method="${opt.id}">
          <div>
            <div>${opt.label}</div>
            <div style="font-size:11px;color:#666;font-weight:400">${opt.detail}</div>
          </div>
        </div>
      `
      )
      .join('');
    payOptionsEl.querySelectorAll('.pay-option').forEach((el) => {
      el.addEventListener('click', () => {
        selectedPaymentMethod = el.dataset.method;
        renderPayOptions();
        renderSummary();
      });
    });
  }

  document.getElementById('whatsapp-link').addEventListener('click', () => clearCart(window.localStorage));
  document.getElementById('telegram-link').addEventListener('click', () => clearCart(window.localStorage));

  renderPayOptions();
  renderSummary();
}
