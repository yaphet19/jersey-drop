import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCart, addToCart, updateQty, removeFromCart, clearCart } from './cart-store.js';

function makeMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

test('getCart returns an empty array when nothing is stored', () => {
  assert.deepEqual(getCart(makeMemoryStorage()), []);
});

test('addToCart adds a new line, and increases qty when the same product+size+sleeve+fit is added again', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 1);
  const cart = addToCart(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 2);
  assert.deepEqual(cart, [{ productId: 'p1', size: 'M', sleeve: 'Short Sleeve', fit: 'Replica', qty: 3 }]);
});

test('addToCart keeps different sizes, sleeve lengths, or fits of the same product as separate lines', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 1);
  addToCart(storage, 'p1', 'L', 'Short Sleeve', 'Replica', 1);
  addToCart(storage, 'p1', 'M', 'Long Sleeve', 'Replica', 1);
  const cart = addToCart(storage, 'p1', 'M', 'Short Sleeve', 'Player Version', 1);
  assert.equal(cart.length, 4);
});

test('updateQty changes the qty of a matching line and removes it if qty drops to 0', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 1);
  updateQty(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 5);
  assert.deepEqual(getCart(storage), [
    { productId: 'p1', size: 'M', sleeve: 'Short Sleeve', fit: 'Replica', qty: 5 },
  ]);
  updateQty(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 0);
  assert.deepEqual(getCart(storage), []);
});

test('removeFromCart removes only the matching product+size+sleeve+fit line', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 1);
  addToCart(storage, 'p2', 'L', 'Long Sleeve', 'Player Version', 1);
  removeFromCart(storage, 'p1', 'M', 'Short Sleeve', 'Replica');
  assert.deepEqual(getCart(storage), [
    { productId: 'p2', size: 'L', sleeve: 'Long Sleeve', fit: 'Player Version', qty: 1 },
  ]);
});

test('clearCart empties the cart', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 'Short Sleeve', 'Replica', 1);
  clearCart(storage);
  assert.deepEqual(getCart(storage), []);
});
