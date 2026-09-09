import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDiscountedPrice, formatETB } from './money.js';

test('computeDiscountedPrice returns the original price when there is no discount', () => {
  assert.equal(computeDiscountedPrice(2200, 0), 2200);
});

test('computeDiscountedPrice applies a percent discount, rounded to the nearest birr', () => {
  assert.equal(computeDiscountedPrice(2200, 20), 1760);
  assert.equal(computeDiscountedPrice(2300, 15), 1955);
});

test('formatETB adds thousands separators and the ETB suffix', () => {
  assert.equal(formatETB(4310), '4,310 ETB');
  assert.equal(formatETB(150), '150 ETB');
});
