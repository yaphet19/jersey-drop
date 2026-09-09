import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOrderMessage, parseTelebirrSms, crossCheck } from './payment-check.js';

const orderMessage = `JERSEY DROP ORDER
- Arsenal Home (M, Short Sleeve, Replica) x1 — 3,200 ETB
Subtotal: 3,200 ETB
Delivery (Bole (Medhanialem)): 356 ETB
TOTAL: 3,556 ETB

Name: Sara B
Phone: 0911223344
Address: House 12
Payment method: Telebirr

Paid by: Sara Bekele
Telebirr number: 0922334455
Transaction number: CH24ABC7XY
Verify: https://transactioninfo.ethiotelecom.et/receipt/CH24ABC7XY`;

const matchingSms =
  'You have received ETB 3,556.00 from Sara Bekele (251922334455). Your transaction number is CH24ABC7XY on 09/09/2026.';

test('parseOrderMessage pulls the total and the payment details out of our own message', () => {
  const order = parseOrderMessage(orderMessage);
  assert.equal(order.total, 3556);
  assert.equal(order.payerName, 'Sara Bekele');
  assert.equal(order.transactionNumber, 'CH24ABC7XY');
});

test('parseOrderMessage reads the total when delivery is still to be quoted', () => {
  const pending = orderMessage.replace('TOTAL: 3,556 ETB', 'TOTAL (before delivery): 3,200 ETB');
  assert.equal(parseOrderMessage(pending).total, 3200);
});

test('parseTelebirrSms pulls amount, payer and transaction number out of the SMS', () => {
  const sms = parseTelebirrSms(matchingSms);
  assert.equal(sms.amount, 3556);
  assert.equal(sms.payerName, 'Sara Bekele');
  assert.equal(sms.transactionNumber, 'CH24ABC7XY');
});

test('a fully agreeing pair passes', () => {
  const result = crossCheck(parseOrderMessage(orderMessage), parseTelebirrSms(matchingSms));
  assert.equal(result.verdict, 'match');
  assert.ok(result.checks.every((c) => c.status === 'match'));
});

test('an underpayment is caught even though the name and transaction agree', () => {
  const underpaid = matchingSms.replace('3,556.00', '356.00');
  const result = crossCheck(parseOrderMessage(orderMessage), parseTelebirrSms(underpaid));
  assert.equal(result.verdict, 'mismatch');
  const amount = result.checks.find((c) => c.label === 'Amount');
  assert.equal(amount.status, 'mismatch');
  assert.equal(amount.expected, 3556);
  assert.equal(amount.found, 356);
});

test('a recycled transaction number is caught', () => {
  const otherTxn = matchingSms.replace('CH24ABC7XY', 'ZZ99OLD111');
  const result = crossCheck(parseOrderMessage(orderMessage), parseTelebirrSms(otherTxn));
  assert.equal(result.verdict, 'mismatch');
  assert.equal(result.checks.find((c) => c.label === 'Transaction number').status, 'mismatch');
});

test('a different payer name is caught', () => {
  const otherPayer = matchingSms.replace('Sara Bekele', 'Abel Tesfaye');
  const result = crossCheck(parseOrderMessage(orderMessage), parseTelebirrSms(otherPayer));
  assert.equal(result.verdict, 'mismatch');
});

test('name matching ignores case and spacing rather than failing on them', () => {
  const shouty = matchingSms.replace('Sara Bekele', '  SARA   BEKELE ');
  const result = crossCheck(parseOrderMessage(orderMessage), parseTelebirrSms(shouty));
  assert.equal(result.verdict, 'match');
});

test('an unreadable field reports incomplete and never a match', () => {
  const result = crossCheck(parseOrderMessage(orderMessage), parseTelebirrSms('some unrelated text'));
  assert.equal(result.verdict, 'incomplete');
  assert.ok(result.checks.every((c) => c.status !== 'match'));
});

test('empty input cannot produce a match', () => {
  const result = crossCheck(parseOrderMessage(''), parseTelebirrSms(''));
  assert.equal(result.verdict, 'incomplete');
  assert.ok(result.checks.every((c) => c.status !== 'match'));
});
