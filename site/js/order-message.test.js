import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrderSummary,
  formatOrderMessage,
  buildWhatsAppLink,
  buildTelegramLink,
  buildTelebirrReceiptUrl,
} from './order-message.js';

const products = [
  { id: 'p1', name: 'Crimson Home Kit', price: 2200, discountPercent: 20 },
  { id: 'p2', name: 'Royal Away Kit', price: 2400, discountPercent: 0 },
];
const cartItems = [
  { productId: 'p1', size: 'M', sleeve: 'Short Sleeve', fit: 'Replica', qty: 1 },
  { productId: 'p2', size: 'L', sleeve: 'Long Sleeve', fit: 'Player Version', qty: 1 },
];
const customer = { name: 'Abel Tesfaye', phone: '0911111111', address: 'Near Edna Mall, house #12' };
const zone = { id: 'bole', name: 'Bole, Addis Ababa', fee: 150 };

test('buildOrderSummary computes discounted line totals, subtotal, and total including delivery', () => {
  const summary = buildOrderSummary(cartItems, products, customer, zone, 'Telebirr');
  assert.equal(summary.lines[0].unitPrice, 1760);
  assert.equal(summary.lines[0].lineTotal, 1760);
  assert.equal(summary.lines[0].sleeve, 'Short Sleeve');
  assert.equal(summary.lines[0].fit, 'Replica');
  assert.equal(summary.subtotal, 1760 + 2400);
  assert.equal(summary.deliveryFee, 150);
  assert.equal(summary.total, 1760 + 2400 + 150);
});

test('formatOrderMessage includes items with sleeve/fit, totals and customer details', () => {
  const summary = buildOrderSummary(cartItems, products, customer, zone, 'Telebirr');
  const message = formatOrderMessage(summary);
  assert.match(message, /Crimson Home Kit \(M, Short Sleeve, Replica\) x1/);
  assert.match(message, /TOTAL: 4,310 ETB/);
  assert.match(message, /Abel Tesfaye/);
  assert.match(message, /Payment method: Telebirr/);
});

test('a zone with no set fee leaves delivery unpriced and keeps the total at items only', () => {
  const pendingZone = { id: 'other', name: 'Other area in Addis', fee: null };
  const summary = buildOrderSummary(cartItems, products, customer, pendingZone, 'Telebirr');
  assert.equal(summary.deliveryFee, null);
  assert.equal(summary.total, 1760 + 2400);

  const message = formatOrderMessage(summary);
  assert.match(message, /Delivery \(Other area in Addis\): to be confirmed/);
  assert.match(message, /TOTAL \(before delivery\): 4,160 ETB/);
});

test('payment details add the payer, transaction number and an Ethio Telecom verify link', () => {
  const summary = buildOrderSummary(cartItems, products, customer, zone, 'Telebirr');
  const message = formatOrderMessage(summary, {
    payerName: 'Sara Bekele',
    payerPhone: '0922334455',
    transactionNumber: 'CH24ABC7XY',
  });
  assert.match(message, /Paid by: Sara Bekele/);
  assert.match(message, /Telebirr number: 0922334455/);
  assert.match(message, /Transaction number: CH24ABC7XY/);
  assert.match(message, /Verify: https:\/\/transactioninfo\.ethiotelecom\.et\/receipt\/CH24ABC7XY/);
});

test('the order message omits payment lines entirely when no payment details are given', () => {
  const summary = buildOrderSummary(cartItems, products, customer, zone, 'Telebirr');
  const message = formatOrderMessage(summary);
  assert.doesNotMatch(message, /Paid by:/);
  assert.doesNotMatch(message, /Verify:/);
});

test('buildTelebirrReceiptUrl trims and URL-encodes the transaction number', () => {
  assert.equal(
    buildTelebirrReceiptUrl('  AB/12 34  '),
    'https://transactioninfo.ethiotelecom.et/receipt/AB%2F12%2034'
  );
});

test('buildWhatsAppLink URL-encodes the message into a wa.me link', () => {
  const link = buildWhatsAppLink('251900000000', 'Hello there');
  assert.equal(link, 'https://wa.me/251900000000?text=Hello%20there');
});

test('buildTelegramLink URL-encodes the message into a t.me link', () => {
  const link = buildTelegramLink('jerseydropshop', 'Hello there');
  assert.equal(link, 'https://t.me/jerseydropshop?text=Hello%20there');
});
