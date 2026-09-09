import { parseOrderMessage, parseTelebirrSms, crossCheck } from './payment-check.js';
import { buildTelebirrReceiptUrl } from './order-message.js';

const VERDICTS = {
  match: { className: 'verify-match', title: 'Everything matches', note: 'The SMS agrees with what the customer sent.' },
  mismatch: {
    className: 'verify-mismatch',
    title: "Doesn't match — do not send the order",
    note: 'Check the rows marked below against the customer before shipping.',
  },
  incomplete: {
    className: 'verify-incomplete',
    title: "Couldn't read everything",
    note: "Some details couldn't be found in the text, so this is not a pass. Check those rows yourself.",
  },
};

function row(check) {
  const icon = { match: '✓', mismatch: '✗', unknown: '?' }[check.status];
  const show = (v) => (v === null || v === undefined ? '—' : v);
  return `
    <div class="verify-row verify-row-${check.status}">
      <div class="verify-row-head"><span>${icon}</span> ${check.label}</div>
      <div class="verify-row-detail">Customer said: <strong>${show(check.expected)}</strong></div>
      <div class="verify-row-detail">Telebirr SMS: <strong>${show(check.found)}</strong></div>
    </div>
  `;
}

document.getElementById('check-btn').addEventListener('click', () => {
  const order = parseOrderMessage(document.getElementById('order-input').value);
  const sms = parseTelebirrSms(document.getElementById('sms-input').value);
  const { checks, verdict } = crossCheck(order, sms);
  const v = VERDICTS[verdict];

  const receiptLink = order.transactionNumber
    ? `<a class="btn btn-outline" href="${buildTelebirrReceiptUrl(order.transactionNumber)}" target="_blank" rel="noopener">OPEN THE RECEIPT ON ETHIO TELECOM</a>`
    : '';

  document.getElementById('verify-result').innerHTML = `
    <div class="verify-verdict ${v.className}">
      <div class="verify-verdict-title">${v.title}</div>
      <div class="verify-verdict-note">${v.note}</div>
    </div>
    ${checks.map(row).join('')}
    ${receiptLink}
  `;
});
