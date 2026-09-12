import { SHOP_DATA } from './data.js';
import { getCart, clearCart, pruneCart } from './cart-store.js';
import { formatETB } from './money.js';
import { buildOrderSummary, formatOrderMessage, buildWhatsAppLink, buildTelegramLink } from './order-message.js';

pruneCart(window.localStorage, SHOP_DATA.products.map((p) => p.id));

const cart = getCart(window.localStorage);
const checkoutInfoRaw = window.localStorage.getItem('jerseydrop_checkout');
const savedCheckout = checkoutInfoRaw ? JSON.parse(checkoutInfoRaw) : null;
const savedZone = savedCheckout && SHOP_DATA.deliveryZones.find((z) => z.id === savedCheckout.zoneId);

if (cart.length === 0 || !savedCheckout) {
  window.location.href = 'cart.html';
} else if (!savedZone) {
  // Checkout details saved before the delivery zones existed (or a zone that
  // has since been removed) — send them back to pick one.
  window.location.href = 'checkout.html';
} else {
  const checkoutInfo = savedCheckout;
  const zone = savedZone;
  const customer = { name: checkoutInfo.name, phone: checkoutInfo.phone, address: checkoutInfo.address };

  let selectedPaymentMethod = 'Telebirr';
  let lastSummary = null;

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
    const feePending = summary.deliveryFee === null;
    document.getElementById('receipt-subtotal').textContent = formatETB(summary.subtotal);
    document.getElementById('receipt-delivery-label').textContent = `Delivery fee (${zone.name})`;
    document.getElementById('receipt-delivery-value').textContent = feePending
      ? "We'll confirm on WhatsApp"
      : formatETB(summary.deliveryFee);
    document.getElementById('receipt-total').textContent = formatETB(summary.total);
    document.querySelector('.receipt-total span').textContent = feePending ? 'TOTAL (before delivery)' : 'TOTAL';

    lastSummary = summary;
    renderPayNote(summary);
    renderSendLinks();
  }

  function renderPayNote(summary) {
    const account =
      selectedPaymentMethod === 'Telebirr'
        ? `Telebirr ${SHOP_DATA.telebirrNumber}`
        : `CBE account ${SHOP_DATA.cbeAccount}`;
    const amount = summary.deliveryFee === null ? `${formatETB(summary.total)} plus delivery` : formatETB(summary.total);
    document.getElementById('pay-note').textContent = `Send ${amount} to ${account}, then confirm below.`;
    document.getElementById('pay-to-box').innerHTML =
      `<div class="pay-to-amount">${amount}</div><div class="pay-to-target">to ${account}</div>`;
  }

  function paymentDetails() {
    return {
      payerName: document.getElementById('field-payer-name').value.trim(),
      payerPhone: document.getElementById('field-payer-phone').value.trim(),
      transactionNumber: document.getElementById('field-txn').value.trim(),
    };
  }

  function paymentComplete() {
    const p = paymentDetails();
    return Boolean(p.payerName && p.payerPhone && p.transactionNumber);
  }

  function renderSendLinks() {
    const ready = paymentComplete();
    const message = formatOrderMessage(lastSummary, ready ? paymentDetails() : null);
    const wa = document.getElementById('whatsapp-link');
    const tg = document.getElementById('telegram-link');
    wa.href = buildWhatsAppLink(SHOP_DATA.whatsappNumber, message);
    tg.href = buildTelegramLink(SHOP_DATA.telegramUsername, message);
    // Until the payment details are filled in, the shop would have nothing to
    // verify against, so don't let the order be sent yet.
    [wa, tg].forEach((el) => el.classList.toggle('btn-disabled', !ready));
  }

  function renderPayOptions() {
    const payOptionsEl = document.getElementById('pay-options');
    const options = [
      { id: 'Telebirr', label: 'Telebirr', detail: `Send to ${SHOP_DATA.telebirrNumber}` },
      { id: 'CBE', label: 'CBE (bank transfer)', detail: `Account ${SHOP_DATA.cbeAccount}` },
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

  document.getElementById('send-note').textContent =
    `Attach your payment screenshot in the chat after it opens. ` +
    `We confirm your order ${SHOP_DATA.confirmationTime}.`;

  document.getElementById('proceed-payment-btn').addEventListener('click', (e) => {
    const step = document.getElementById('payment-step');
    step.hidden = false;
    e.target.hidden = true;
    step.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  ['field-payer-name', 'field-payer-phone', 'field-txn'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderSendLinks);
  });

  ['whatsapp-link', 'telegram-link'].forEach((id) => {
    document.getElementById(id).addEventListener('click', (e) => {
      if (!paymentComplete()) {
        e.preventDefault();
        return;
      }
      clearCart(window.localStorage);
    });
  });

  renderPayOptions();
  renderSummary();
}
