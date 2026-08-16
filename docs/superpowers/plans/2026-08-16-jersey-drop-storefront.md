# Jersey Drop Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working, clickable trial version of the Jersey Drop storefront: browse jerseys, add to cart with size, enter delivery details, see an itemized receipt with delivery fee and total, pick a payment method, and send the order via WhatsApp or Telegram.

**Architecture:** A static site (no backend, no database, no build step) served as plain files. Product/zone/payment data lives in one importable JS module the owner edits directly. Pure calculation logic (pricing, cart, delivery fee, order-message formatting) is written as testable ES modules with no DOM dependency; page scripts import those modules and handle rendering/DOM only. Cart and checkout data hand off between pages via `localStorage`, since there's no server session.

**Tech Stack:** Plain HTML/CSS/JavaScript (ES modules, loaded natively via `<script type="module">`, no bundler). Node.js (v22, already installed) is used only as the test runner during development (`node --test`) — it is never required to run the site itself. Python's built-in `http.server` serves the static files locally for preview.

## Global Constraints

- Colors are black/white only: `--color-black:#111111`, `--color-white:#ffffff`, `--color-gray-bg:#f2f2f2`, `--color-gray-border:#dddddd`, `--color-gray-text:#888888` (from `2026-08-16-jersey-drop-online-shop-design.md`, Branding section).
- No payment gateway or automated payment verification anywhere in the flow (spec: Cart & Checkout Flow, step 4).
- Cash is never offered as a payment method — only Telebirr and CBE (spec: Cart & Checkout Flow, step 4).
- The receipt must show the exact note "No payment now — pay via Telebirr/CBE when your order arrives" (or equivalent wording) before the send buttons (spec: Cart & Checkout Flow, step 4).
- No admin dashboard or backend — the owner edits `site/js/data.js` directly to add/change jerseys, zones, and payment details (spec: Product Catalog).
- Delivery fee comes from a flat, owner-set fee per zone, looked up from `site/js/data.js` — no live courier API call (spec: Delivery Fee).
- Product images are illustrated placeholder graphics, not photos and not AI-generated photorealistic images — and product names must be original/fictional, not real club names or crests, to avoid trademark issues (spec: Product Catalog; and this session's discussion of image sourcing).
- Every page must work on a 375px-wide mobile viewport without horizontal scrolling (majority of Ethiopian shoppers are on phones — implied by the Beu-Delivery-style, phone-shaped mockups approved during brainstorming).

---

## File Structure

```
jersey-drop/
  site/
    package.json                  # {"type": "module"} so Node treats .js as ESM for tests
    index.html                    # homepage: nav, hero, product grid
    cart.html                     # cart page
    checkout.html                 # delivery details form
    receipt.html                  # itemized receipt + payment + send buttons
    css/
      styles.css                  # shared design tokens + layout for all pages
    js/
      data.js                     # SHOP_DATA: products, zones, payment/contact info
      money.js                    # price/discount formatting (pure, tested)
      money.test.js
      cart-store.js                # localStorage-backed cart CRUD (pure given a storage object, tested)
      cart-store.test.js
      fee.js                      # zone -> fee lookup (pure, tested)
      fee.test.js
      order-message.js             # builds receipt summary + WhatsApp/Telegram message text (pure, tested)
      order-message.test.js
      home.js                     # renders index.html product grid + add-to-cart modal
      cart-page.js                 # renders cart.html
      checkout-page.js             # renders/handles checkout.html form
      receipt-page.js              # renders receipt.html + send buttons
    assets/
      jersey-drop-logo.jpg         # copied from ../assets/jersey-drop-logo.jpg
      jerseys/
        jersey-red.svg
        jersey-blue.svg
        jersey-skyblue.svg
        jersey-maroon.svg
```

---

### Task 1: Project scaffold, product data, and placeholder jersey art

**Files:**
- Create: `jersey-drop/site/package.json`
- Create: `jersey-drop/site/js/data.js`
- Create: `jersey-drop/site/assets/jerseys/jersey-red.svg`
- Create: `jersey-drop/site/assets/jerseys/jersey-blue.svg`
- Create: `jersey-drop/site/assets/jerseys/jersey-skyblue.svg`
- Create: `jersey-drop/site/assets/jerseys/jersey-maroon.svg`
- Create: `jersey-drop/site/assets/jersey-drop-logo.jpg` (copy of `jersey-drop/assets/jersey-drop-logo.jpg`)

**Interfaces:**
- Produces: `SHOP_DATA` object (named export from `data.js`) with shape:
  ```js
  {
    shopName: string,
    whatsappNumber: string,      // digits only, E.164 without '+', e.g. '251900000000'
    telegramUsername: string,    // no '@'
    telebirrNumber: string,
    cbeAccount: string,
    zones: [{ id: string, name: string, fee: number }],
    products: [{ id: string, name: string, price: number, discountPercent: number, sizes: string[], image: string }]
  }
  ```

- [ ] **Step 1: Create `site/package.json`**

```json
{
  "name": "jersey-drop-site",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 2: Create `site/js/data.js`**

```js
export const SHOP_DATA = {
  shopName: 'Jersey Drop',
  whatsappNumber: '251900000000',
  telegramUsername: 'jerseydropshop',
  telebirrNumber: '0912345678',
  cbeAccount: '1000123456789',
  zones: [
    { id: 'bole', name: 'Bole, Addis Ababa', fee: 150 },
    { id: 'piassa', name: 'Piassa, Addis Ababa', fee: 120 },
    { id: 'other', name: 'Other city (Ethiopia)', fee: 300 },
  ],
  products: [
    {
      id: 'p1',
      name: 'Crimson Home Kit',
      price: 2200,
      discountPercent: 20,
      sizes: ['S', 'M', 'L', 'XL'],
      image: 'assets/jerseys/jersey-red.svg',
    },
    {
      id: 'p2',
      name: 'Royal Away Kit',
      price: 2400,
      discountPercent: 0,
      sizes: ['S', 'M', 'L', 'XL'],
      image: 'assets/jerseys/jersey-blue.svg',
    },
    {
      id: 'p3',
      name: 'Sky Performance Kit',
      price: 2300,
      discountPercent: 15,
      sizes: ['S', 'M', 'L', 'XL'],
      image: 'assets/jerseys/jersey-skyblue.svg',
    },
    {
      id: 'p4',
      name: 'Classic Away Kit',
      price: 2250,
      discountPercent: 0,
      sizes: ['S', 'M', 'L', 'XL'],
      image: 'assets/jerseys/jersey-maroon.svg',
    },
  ],
};
```

Note: `whatsappNumber` and `telegramUsername` above are placeholders — the owner must replace them with the shop's real WhatsApp number and Telegram username before launch (call this out explicitly when handing off the trial site).

- [ ] **Step 3: Create the four placeholder jersey SVGs**

`site/assets/jerseys/jersey-red.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f2f2f2"/>
  <path d="M70 40 L40 60 L55 90 L70 80 L70 170 L130 170 L130 80 L145 90 L160 60 L130 40 L115 55 L85 55 Z" fill="#c81e2c" stroke="#111" stroke-width="3"/>
  <text x="100" y="120" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" text-anchor="middle" fill="#fff">9</text>
</svg>
```

`site/assets/jerseys/jersey-blue.svg` (same shape, blue fill, number 7):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f2f2f2"/>
  <path d="M70 40 L40 60 L55 90 L70 80 L70 170 L130 170 L130 80 L145 90 L160 60 L130 40 L115 55 L85 55 Z" fill="#1e3a8a" stroke="#111" stroke-width="3"/>
  <text x="100" y="120" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" text-anchor="middle" fill="#fff">7</text>
</svg>
```

`site/assets/jerseys/jersey-skyblue.svg` (same shape, sky-blue fill, number 10):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f2f2f2"/>
  <path d="M70 40 L40 60 L55 90 L70 80 L70 170 L130 170 L130 80 L145 90 L160 60 L130 40 L115 55 L85 55 Z" fill="#38bdf8" stroke="#111" stroke-width="3"/>
  <text x="100" y="120" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" text-anchor="middle" fill="#fff">10</text>
</svg>
```

`site/assets/jerseys/jersey-maroon.svg` (same shape, maroon fill, number 4):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f2f2f2"/>
  <path d="M70 40 L40 60 L55 90 L70 80 L70 170 L130 170 L130 80 L145 90 L160 60 L130 40 L115 55 L85 55 Z" fill="#7f1d1d" stroke="#111" stroke-width="3"/>
  <text x="100" y="120" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" text-anchor="middle" fill="#fff">4</text>
</svg>
```

- [ ] **Step 4: Copy the real logo into the site's assets**

```bash
cp "jersey-drop/assets/jersey-drop-logo.jpg" "jersey-drop/site/assets/jersey-drop-logo.jpg"
```

- [ ] **Step 5: Verify the data module loads under Node**

Run: `node -e "import('./jersey-drop/site/js/data.js').then(m => console.log(m.SHOP_DATA.products.length, m.SHOP_DATA.zones.length))"`
Expected output: `4 3`

- [ ] **Step 6: Commit**

```bash
git -C jersey-drop add site/package.json site/js/data.js site/assets
git -C jersey-drop commit -m "Add site scaffold, shop data, and placeholder jersey art"
```

---

### Task 2: Money and discount formatting (`money.js`)

**Files:**
- Create: `jersey-drop/site/js/money.js`
- Test: `jersey-drop/site/js/money.test.js`

**Interfaces:**
- Produces:
  - `computeDiscountedPrice(price: number, discountPercent: number): number`
  - `formatETB(amount: number): string`

- [ ] **Step 1: Write the failing test**

```js
// site/js/money.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test site/js/money.test.js` (from `jersey-drop/`)
Expected: FAIL — `Cannot find module './money.js'`

- [ ] **Step 3: Write the implementation**

```js
// site/js/money.js
export function computeDiscountedPrice(price, discountPercent) {
  if (!discountPercent) return price;
  return Math.round(price * (1 - discountPercent / 100));
}

export function formatETB(amount) {
  return `${amount.toLocaleString('en-US')} ETB`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test site/js/money.test.js`
Expected: PASS, `3 tests passed`

- [ ] **Step 5: Commit**

```bash
git -C jersey-drop add site/js/money.js site/js/money.test.js
git -C jersey-drop commit -m "Add money/discount formatting with tests"
```

---

### Task 3: Cart store (`cart-store.js`)

**Files:**
- Create: `jersey-drop/site/js/cart-store.js`
- Test: `jersey-drop/site/js/cart-store.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces (all take a `storage` object with `getItem/setItem/removeItem`, so page code passes `window.localStorage` and tests pass a fake):
  - `getCart(storage): Array<{productId: string, size: string, qty: number}>`
  - `addToCart(storage, productId: string, size: string, qty: number): Array<CartItem>`
  - `updateQty(storage, productId: string, size: string, qty: number): Array<CartItem>`
  - `removeFromCart(storage, productId: string, size: string): Array<CartItem>`
  - `clearCart(storage): void`

- [ ] **Step 1: Write the failing test**

```js
// site/js/cart-store.test.js
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

test('addToCart adds a new line, and increases qty when the same product+size is added again', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 1);
  const cart = addToCart(storage, 'p1', 'M', 2);
  assert.deepEqual(cart, [{ productId: 'p1', size: 'M', qty: 3 }]);
});

test('addToCart keeps different sizes of the same product as separate lines', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 1);
  const cart = addToCart(storage, 'p1', 'L', 1);
  assert.equal(cart.length, 2);
});

test('updateQty changes the qty of a matching line and removes it if qty drops to 0', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 1);
  updateQty(storage, 'p1', 'M', 5);
  assert.deepEqual(getCart(storage), [{ productId: 'p1', size: 'M', qty: 5 }]);
  updateQty(storage, 'p1', 'M', 0);
  assert.deepEqual(getCart(storage), []);
});

test('removeFromCart removes only the matching product+size line', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 1);
  addToCart(storage, 'p2', 'L', 1);
  removeFromCart(storage, 'p1', 'M');
  assert.deepEqual(getCart(storage), [{ productId: 'p2', size: 'L', qty: 1 }]);
});

test('clearCart empties the cart', () => {
  const storage = makeMemoryStorage();
  addToCart(storage, 'p1', 'M', 1);
  clearCart(storage);
  assert.deepEqual(getCart(storage), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test site/js/cart-store.test.js`
Expected: FAIL — `Cannot find module './cart-store.js'`

- [ ] **Step 3: Write the implementation**

```js
// site/js/cart-store.js
const CART_KEY = 'jerseydrop_cart';

export function getCart(storage) {
  const raw = storage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(storage, cart) {
  storage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function addToCart(storage, productId, size, qty) {
  const cart = getCart(storage);
  const existing = cart.find((item) => item.productId === productId && item.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, size, qty });
  }
  return saveCart(storage, cart);
}

export function updateQty(storage, productId, size, qty) {
  const cart = getCart(storage)
    .map((item) => (item.productId === productId && item.size === size ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);
  return saveCart(storage, cart);
}

export function removeFromCart(storage, productId, size) {
  const cart = getCart(storage).filter((item) => !(item.productId === productId && item.size === size));
  return saveCart(storage, cart);
}

export function clearCart(storage) {
  storage.removeItem(CART_KEY);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test site/js/cart-store.test.js`
Expected: PASS, `6 tests passed`

- [ ] **Step 5: Commit**

```bash
git -C jersey-drop add site/js/cart-store.js site/js/cart-store.test.js
git -C jersey-drop commit -m "Add localStorage-backed cart store with tests"
```

---

### Task 4: Delivery zone fee lookup (`fee.js`)

**Files:**
- Create: `jersey-drop/site/js/fee.js`
- Test: `jersey-drop/site/js/fee.test.js`

**Interfaces:**
- Consumes: `zones` array shaped like `SHOP_DATA.zones` from Task 1 (`{id, name, fee}`).
- Produces: `getZone(zones, zoneId): {id: string, name: string, fee: number}` (throws if not found).

- [ ] **Step 1: Write the failing test**

```js
// site/js/fee.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getZone } from './fee.js';

const zones = [
  { id: 'bole', name: 'Bole, Addis Ababa', fee: 150 },
  { id: 'piassa', name: 'Piassa, Addis Ababa', fee: 120 },
];

test('getZone returns the matching zone', () => {
  assert.deepEqual(getZone(zones, 'piassa'), { id: 'piassa', name: 'Piassa, Addis Ababa', fee: 120 });
});

test('getZone throws a clear error for an unknown zone id', () => {
  assert.throws(() => getZone(zones, 'nowhere'), /Unknown delivery zone: nowhere/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test site/js/fee.test.js`
Expected: FAIL — `Cannot find module './fee.js'`

- [ ] **Step 3: Write the implementation**

```js
// site/js/fee.js
export function getZone(zones, zoneId) {
  const zone = zones.find((z) => z.id === zoneId);
  if (!zone) throw new Error(`Unknown delivery zone: ${zoneId}`);
  return zone;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test site/js/fee.test.js`
Expected: PASS, `2 tests passed`

- [ ] **Step 5: Commit**

```bash
git -C jersey-drop add site/js/fee.js site/js/fee.test.js
git -C jersey-drop commit -m "Add delivery zone fee lookup with tests"
```

---

### Task 5: Order summary and message builder (`order-message.js`)

**Files:**
- Create: `jersey-drop/site/js/order-message.js`
- Test: `jersey-drop/site/js/order-message.test.js`

**Interfaces:**
- Consumes: `computeDiscountedPrice, formatETB` from `money.js` (Task 2).
- Produces:
  - `buildOrderSummary(cartItems, products, customer, zone, paymentMethod): OrderSummary` where `OrderSummary = {lines: [{name, size, qty, unitPrice, lineTotal}], subtotal, deliveryFee, total, customer, zone, paymentMethod}`
  - `formatOrderMessage(summary: OrderSummary): string`
  - `buildWhatsAppLink(phoneE164: string, message: string): string`
  - `buildTelegramLink(username: string, message: string): string`

- [ ] **Step 1: Write the failing test**

```js
// site/js/order-message.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderSummary, formatOrderMessage, buildWhatsAppLink, buildTelegramLink } from './order-message.js';

const products = [
  { id: 'p1', name: 'Crimson Home Kit', price: 2200, discountPercent: 20 },
  { id: 'p2', name: 'Royal Away Kit', price: 2400, discountPercent: 0 },
];
const cartItems = [
  { productId: 'p1', size: 'M', qty: 1 },
  { productId: 'p2', size: 'L', qty: 1 },
];
const customer = { name: 'Abel Tesfaye', phone: '0911111111', address: 'Near Edna Mall, house #12' };
const zone = { id: 'bole', name: 'Bole, Addis Ababa', fee: 150 };

test('buildOrderSummary computes discounted line totals, subtotal, and total including delivery', () => {
  const summary = buildOrderSummary(cartItems, products, customer, zone, 'Telebirr');
  assert.equal(summary.lines[0].unitPrice, 1760);
  assert.equal(summary.lines[0].lineTotal, 1760);
  assert.equal(summary.subtotal, 1760 + 2400);
  assert.equal(summary.deliveryFee, 150);
  assert.equal(summary.total, 1760 + 2400 + 150);
});

test('formatOrderMessage includes items, totals, customer details, and the no-payment-now note', () => {
  const summary = buildOrderSummary(cartItems, products, customer, zone, 'Telebirr');
  const message = formatOrderMessage(summary);
  assert.match(message, /Crimson Home Kit \(M\) x1/);
  assert.match(message, /TOTAL: 4,310 ETB/);
  assert.match(message, /Abel Tesfaye/);
  assert.match(message, /No payment now/);
});

test('buildWhatsAppLink URL-encodes the message into a wa.me link', () => {
  const link = buildWhatsAppLink('251900000000', 'Hello there');
  assert.equal(link, 'https://wa.me/251900000000?text=Hello%20there');
});

test('buildTelegramLink URL-encodes the message into a t.me link', () => {
  const link = buildTelegramLink('jerseydropshop', 'Hello there');
  assert.equal(link, 'https://t.me/jerseydropshop?text=Hello%20there');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test site/js/order-message.test.js`
Expected: FAIL — `Cannot find module './order-message.js'`

- [ ] **Step 3: Write the implementation**

```js
// site/js/order-message.js
import { computeDiscountedPrice, formatETB } from './money.js';

export function buildOrderSummary(cartItems, products, customer, zone, paymentMethod) {
  const lines = cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPrice = computeDiscountedPrice(product.price, product.discountPercent);
    return {
      name: product.name,
      size: item.size,
      qty: item.qty,
      unitPrice,
      lineTotal: unitPrice * item.qty,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return {
    lines,
    subtotal,
    deliveryFee: zone.fee,
    total: subtotal + zone.fee,
    customer,
    zone,
    paymentMethod,
  };
}

export function formatOrderMessage(summary) {
  const itemLines = summary.lines
    .map((l) => `- ${l.name} (${l.size}) x${l.qty} — ${formatETB(l.lineTotal)}`)
    .join('\n');
  return [
    'JERSEY DROP ORDER',
    itemLines,
    `Subtotal: ${formatETB(summary.subtotal)}`,
    `Delivery (${summary.zone.name}): ${formatETB(summary.deliveryFee)}`,
    `TOTAL: ${formatETB(summary.total)}`,
    '',
    `Name: ${summary.customer.name}`,
    `Phone: ${summary.customer.phone}`,
    `Address: ${summary.customer.address}`,
    `Payment method: ${summary.paymentMethod}`,
    'No payment now — pay via Telebirr/CBE when your order arrives.',
  ].join('\n');
}

export function buildWhatsAppLink(phoneE164, message) {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
}

export function buildTelegramLink(username, message) {
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test site/js/order-message.test.js`
Expected: PASS, `4 tests passed`

- [ ] **Step 5: Commit**

```bash
git -C jersey-drop add site/js/order-message.js site/js/order-message.test.js
git -C jersey-drop commit -m "Add order summary and WhatsApp/Telegram message builder with tests"
```

---

### Task 6: Shared styles

**Files:**
- Create: `jersey-drop/site/css/styles.css`

**Interfaces:**
- Produces: CSS classes consumed by every page task below: `.nav`, `.nav-brand`, `.nav-links`, `.hero`, `.btn`, `.btn-primary`, `.product-grid`, `.product-card`, `.badge-discount`, `.price-old`, `.price-new`, `.cart-line`, `.field`, `.field-label`, `.zone-option`, `.receipt-line`, `.receipt-total`, `.pay-option`, `.btn-whatsapp`, `.btn-telegram`.

- [ ] **Step 1: Write `site/css/styles.css`**

```css
:root {
  --color-black: #111111;
  --color-white: #ffffff;
  --color-gray-bg: #f2f2f2;
  --color-gray-border: #dddddd;
  --color-gray-text: #888888;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: var(--color-black);
  background: var(--color-white);
}

a { color: inherit; text-decoration: none; }

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-gray-border);
}
.nav-brand img { height: 40px; display: block; }
.nav-links { display: flex; gap: 20px; font-size: 12px; letter-spacing: 1px; font-weight: 700; }
.nav-cart { font-size: 20px; }

.hero {
  background: var(--color-black);
  color: var(--color-white);
  text-align: center;
  padding: 64px 24px;
}
.hero h1 { font-size: 30px; font-weight: 900; letter-spacing: 1px; margin: 0 0 10px; }
.hero p { font-size: 14px; opacity: .85; margin: 0 0 20px; }

.btn {
  display: inline-block;
  border: none;
  padding: 12px 24px;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 3px;
  text-align: center;
}
.btn-primary { background: var(--color-black); color: var(--color-white); }
.btn-primary:hover { opacity: .85; }
.btn-block { display: block; width: 100%; margin-top: 10px; }
.btn-whatsapp { background: #25D366; color: var(--color-white); }
.btn-telegram { background: #229ED9; color: var(--color-white); }

.section-title { padding: 24px 20px 8px; font-weight: 800; font-size: 15px; letter-spacing: 1px; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--color-gray-border);
  padding: 1px;
  max-width: 800px;
  margin: 0 auto;
}
.product-card { background: var(--color-white); padding: 14px; position: relative; }
.product-card img { width: 100%; display: block; margin-bottom: 10px; }
.badge-discount {
  position: absolute; top: 20px; left: 20px;
  background: var(--color-black); color: var(--color-white);
  font-size: 11px; font-weight: 800; padding: 3px 8px;
}
.product-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.price-old { text-decoration: line-through; color: var(--color-gray-text); margin-right: 8px; font-size: 12px; }
.price-new { font-weight: 800; font-size: 13px; }

.container { max-width: 600px; margin: 0 auto; padding: 20px; }

.cart-line { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-gray-border); }
.cart-line img { width: 56px; height: 56px; flex-shrink: 0; }
.cart-line .info { flex: 1; }
.cart-line .name { font-weight: 700; font-size: 13px; }
.cart-line .meta { color: var(--color-gray-text); font-size: 12px; }
.cart-line .remove { font-size: 11px; color: var(--color-gray-text); cursor: pointer; text-decoration: underline; }

.subtotal-row, .receipt-total {
  display: flex; justify-content: space-between; font-weight: 900; font-size: 16px;
  padding-top: 12px; margin-top: 8px; border-top: 2px solid var(--color-black);
}

.field-label { font-size: 11px; font-weight: 700; letter-spacing: .5px; color: #555; margin: 14px 0 5px; }
.field {
  width: 100%; border: 1px solid #ccc; border-radius: 3px; padding: 10px; font-size: 13px;
}

.zone-option, .pay-option {
  border: 1px solid #ccc; border-radius: 3px; padding: 10px; font-size: 13px; margin-bottom: 8px;
  display: flex; justify-content: space-between; align-items: center; cursor: pointer;
}
.zone-option.selected, .pay-option.selected { border-color: var(--color-black); background: var(--color-gray-bg); font-weight: 700; }

.receipt-title { text-align: center; font-weight: 800; font-size: 14px; letter-spacing: 1px; margin-bottom: 10px; }
.receipt-line { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--color-gray-border); font-size: 13px; }
.receipt-line .qty { color: var(--color-gray-text); font-size: 11px; }

.note-box { text-align: center; font-size: 12px; color: #666; margin: 14px 0; padding: 10px; background: var(--color-gray-bg); border-radius: 3px; }

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: flex-end; justify-content: center; z-index: 10;
}
.modal { background: var(--color-white); width: 100%; max-width: 420px; padding: 20px; border-radius: 10px 10px 0 0; }
.size-options { display: flex; gap: 8px; margin: 10px 0 18px; flex-wrap: wrap; }
.size-option { border: 1px solid #ccc; border-radius: 3px; padding: 8px 14px; font-size: 13px; cursor: pointer; }
.size-option.selected { border-color: var(--color-black); background: var(--color-black); color: var(--color-white); }

@media (max-width: 480px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 2: Commit**

```bash
git -C jersey-drop add site/css/styles.css
git -C jersey-drop commit -m "Add shared black/white design system styles"
```

---

### Task 7: Homepage (`index.html` + `home.js`)

**Files:**
- Create: `jersey-drop/site/index.html`
- Create: `jersey-drop/site/js/home.js`

**Interfaces:**
- Consumes: `SHOP_DATA` (Task 1), `computeDiscountedPrice, formatETB` (Task 2), `addToCart, getCart` (Task 3).
- Produces: nothing consumed by later tasks (cart/checkout/receipt read `cart-store.js` directly, not through `home.js`).

- [ ] **Step 1: Create `site/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Jersey Drop</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="nav">
    <a class="nav-brand" href="index.html"><img src="assets/jersey-drop-logo.jpg" alt="Jersey Drop"></a>
    <div class="nav-links"><span>SHOP</span><span>NEW</span><span>OFFERS</span></div>
    <a class="nav-cart" href="cart.html" id="cart-link">🛒 <span id="cart-count">0</span></a>
  </nav>

  <div class="hero">
    <h1>NEW SEASON. NEW KITS.</h1>
    <p>Home &amp; away jerseys, all sizes, delivered across Ethiopia.</p>
  </div>

  <div class="section-title">FEATURED</div>
  <div class="product-grid" id="product-grid"></div>

  <div class="note-box">Delivery fee calculated at checkout · No payment now — pay via Telebirr/CBE when your order arrives.</div>

  <div id="modal-root"></div>

  <script type="module" src="js/home.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `site/js/home.js`**

```js
import { SHOP_DATA } from './data.js';
import { computeDiscountedPrice, formatETB } from './money.js';
import { addToCart, getCart } from './cart-store.js';

function cartItemCount() {
  return getCart(window.localStorage).reduce((sum, item) => sum + item.qty, 0);
}

function renderCartCount() {
  document.getElementById('cart-count').textContent = cartItemCount();
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = SHOP_DATA.products
    .map((product) => {
      const finalPrice = computeDiscountedPrice(product.price, product.discountPercent);
      const priceHtml = product.discountPercent
        ? `<span class="price-old">${formatETB(product.price)}</span><span class="price-new">${formatETB(finalPrice)}</span>`
        : `<span class="price-new">${formatETB(finalPrice)}</span>`;
      const badgeHtml = product.discountPercent
        ? `<div class="badge-discount">-${product.discountPercent}%</div>`
        : '';
      return `
        <div class="product-card" data-product-id="${product.id}">
          ${badgeHtml}
          <img src="${product.image}" alt="${product.name}">
          <div class="product-name">${product.name}</div>
          <div class="product-price">${priceHtml}</div>
          <button class="btn btn-primary btn-block add-to-cart-btn" data-product-id="${product.id}">ADD TO CART</button>
        </div>
      `;
    })
    .join('');

  grid.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', () => openSizeModal(btn.dataset.productId));
  });
}

function openSizeModal(productId) {
  const product = SHOP_DATA.products.find((p) => p.id === productId);
  const root = document.getElementById('modal-root');
  let selectedSize = null;

  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="product-name">${product.name}</div>
        <div class="field-label">SELECT SIZE</div>
        <div class="size-options">
          ${product.sizes.map((size) => `<div class="size-option" data-size="${size}">${size}</div>`).join('')}
        </div>
        <button class="btn btn-primary btn-block" id="confirm-add-btn" disabled>ADD TO CART</button>
      </div>
    </div>
  `;

  const confirmBtn = root.querySelector('#confirm-add-btn');
  root.querySelectorAll('.size-option').forEach((el) => {
    el.addEventListener('click', () => {
      root.querySelectorAll('.size-option').forEach((o) => o.classList.remove('selected'));
      el.classList.add('selected');
      selectedSize = el.dataset.size;
      confirmBtn.disabled = false;
    });
  });

  root.querySelector('.modal-backdrop').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) root.innerHTML = '';
  });

  confirmBtn.addEventListener('click', () => {
    addToCart(window.localStorage, productId, selectedSize, 1);
    root.innerHTML = '';
    renderCartCount();
  });
}

renderProductGrid();
renderCartCount();
```

- [ ] **Step 3: Manual verification**

Start the server (see Task 11 for the exact command) and open `index.html`. Confirm:
- Logo shows in the nav.
- Four product cards show, "Crimson Home Kit" and "Sky Performance Kit" show a discount badge and a struck-through old price next to a bold new price; the other two show only the plain price.
- Clicking "ADD TO CART" opens a bottom-sheet modal with size buttons; the confirm button stays disabled until a size is picked.
- After picking a size and confirming, the modal closes and the cart count in the nav increases by 1.
- A footer note below the grid reads "Delivery fee calculated at checkout · No payment now — pay via Telebirr/CBE when your order arrives."

- [ ] **Step 4: Commit**

```bash
git -C jersey-drop add site/index.html site/js/home.js
git -C jersey-drop commit -m "Add homepage with product grid and size-picker modal"
```

---

### Task 8: Cart page (`cart.html` + `cart-page.js`)

**Files:**
- Create: `jersey-drop/site/cart.html`
- Create: `jersey-drop/site/js/cart-page.js`

**Interfaces:**
- Consumes: `SHOP_DATA` (Task 1), `formatETB, computeDiscountedPrice` (Task 2), `getCart, updateQty, removeFromCart` (Task 3).

- [ ] **Step 1: Create `site/cart.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Cart — Jersey Drop</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="nav">
    <a class="nav-brand" href="index.html"><img src="assets/jersey-drop-logo.jpg" alt="Jersey Drop"></a>
    <div class="nav-links"><span>SHOP</span></div>
    <a class="nav-cart" href="cart.html">🛒</a>
  </nav>

  <div class="container">
    <div class="section-title" style="padding-left:0">YOUR CART</div>
    <div id="cart-lines"></div>
    <div id="cart-empty" style="display:none">Your cart is empty. <a href="index.html">Go shop jerseys</a>.</div>
    <div class="subtotal-row" id="subtotal-row" style="display:none">
      <span>Subtotal</span><span id="subtotal-value"></span>
    </div>
    <a class="btn btn-primary btn-block" id="checkout-btn" href="checkout.html" style="display:none">PROCEED TO CHECKOUT</a>
  </div>

  <script type="module" src="js/cart-page.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `site/js/cart-page.js`**

```js
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
      return `
        <div class="cart-line">
          <img src="${product.image}" alt="${product.name}">
          <div class="info">
            <div class="name">${product.name}</div>
            <div class="meta">Size ${item.size} · Qty
              <button data-action="dec" data-product-id="${item.productId}" data-size="${item.size}">-</button>
              ${item.qty}
              <button data-action="inc" data-product-id="${item.productId}" data-size="${item.size}">+</button>
            </div>
            <div class="remove" data-action="remove" data-product-id="${item.productId}" data-size="${item.size}">Remove</div>
          </div>
          <div class="price-new">${formatETB(lineTotal)}</div>
        </div>
      `;
    })
    .join('');

  document.getElementById('subtotal-value').textContent = formatETB(subtotal);

  linesEl.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const { action, productId, size } = el.dataset;
      const current = getCart(window.localStorage).find((i) => i.productId === productId && i.size === size);
      if (action === 'remove') {
        removeFromCart(window.localStorage, productId, size);
      } else if (action === 'inc') {
        updateQty(window.localStorage, productId, size, current.qty + 1);
      } else if (action === 'dec') {
        updateQty(window.localStorage, productId, size, current.qty - 1);
      }
      render();
    });
  });
}

render();
```

- [ ] **Step 3: Manual verification**

From the homepage, add two different jerseys (different sizes) to the cart, then open `cart.html`. Confirm both lines show with the correct thumbnail, name, size, quantity, and line price; the +/- buttons change quantity and update the subtotal; "Remove" deletes a line; removing all lines shows the empty-cart message and hides the checkout button.

- [ ] **Step 4: Commit**

```bash
git -C jersey-drop add site/cart.html site/js/cart-page.js
git -C jersey-drop commit -m "Add cart page with quantity controls and subtotal"
```

---

### Task 9: Checkout page (`checkout.html` + `checkout-page.js`)

**Files:**
- Create: `jersey-drop/site/checkout.html`
- Create: `jersey-drop/site/js/checkout-page.js`

**Interfaces:**
- Consumes: `SHOP_DATA.zones` (Task 1), `formatETB` (Task 2), `getCart` (Task 3).
- Produces: writes `localStorage['jerseydrop_checkout'] = JSON.stringify({name, phone, address, zoneId})`, consumed by Task 10.

- [ ] **Step 1: Create `site/checkout.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Delivery Details — Jersey Drop</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="nav">
    <a class="nav-brand" href="index.html"><img src="assets/jersey-drop-logo.jpg" alt="Jersey Drop"></a>
    <div class="nav-links"><span>DELIVERY DETAILS</span></div>
    <a class="nav-cart" href="cart.html">🛒</a>
  </nav>

  <div class="container">
    <form id="checkout-form">
      <div class="field-label">FULL NAME</div>
      <input class="field" id="field-name" required>

      <div class="field-label">PHONE NUMBER</div>
      <input class="field" id="field-phone" required>

      <div class="field-label">DELIVERY ZONE</div>
      <div id="zone-list"></div>

      <div class="field-label">EXACT ADDRESS / LANDMARK</div>
      <input class="field" id="field-address" required>

      <button class="btn btn-primary btn-block" type="submit" id="submit-btn" disabled>VIEW ORDER SUMMARY</button>
    </form>
  </div>

  <script type="module" src="js/checkout-page.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `site/js/checkout-page.js`**

```js
import { SHOP_DATA } from './data.js';
import { formatETB } from './money.js';
import { getCart } from './cart-store.js';

if (getCart(window.localStorage).length === 0) {
  window.location.href = 'cart.html';
}

let selectedZoneId = null;

function renderZones() {
  const list = document.getElementById('zone-list');
  list.innerHTML = SHOP_DATA.zones
    .map(
      (zone) => `
      <div class="zone-option" data-zone-id="${zone.id}">
        <span>${zone.name}</span><span>${formatETB(zone.fee)}</span>
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
    address: document.getElementById('field-address').value.trim(),
    zoneId: selectedZoneId,
  };
  window.localStorage.setItem('jerseydrop_checkout', JSON.stringify(checkoutInfo));
  window.location.href = 'receipt.html';
});

renderZones();
```

- [ ] **Step 3: Manual verification**

With items in the cart, open `checkout.html` directly (with an empty cart first, to confirm it redirects to `cart.html`), then with items in cart: fill in name/phone/address and pick a zone, confirm the submit button only enables once all fields + a zone are set, and submitting navigates to `receipt.html`.

- [ ] **Step 4: Commit**

```bash
git -C jersey-drop add site/checkout.html site/js/checkout-page.js
git -C jersey-drop commit -m "Add checkout page for delivery details and zone selection"
```

---

### Task 10: Receipt page (`receipt.html` + `receipt-page.js`)

**Files:**
- Create: `jersey-drop/site/receipt.html`
- Create: `jersey-drop/site/js/receipt-page.js`

**Interfaces:**
- Consumes: `SHOP_DATA` (Task 1), `getCart, clearCart` (Task 3), `getZone` (Task 4), `buildOrderSummary, formatOrderMessage, buildWhatsAppLink, buildTelegramLink` (Task 5). Reads `localStorage['jerseydrop_checkout']` written by Task 9.

- [ ] **Step 1: Create `site/receipt.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Order Summary — Jersey Drop</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="nav">
    <a class="nav-brand" href="index.html"><img src="assets/jersey-drop-logo.jpg" alt="Jersey Drop"></a>
    <div class="nav-links"><span>ORDER SUMMARY</span></div>
    <a class="nav-cart" href="cart.html">🛒</a>
  </nav>

  <div class="container">
    <div class="receipt-title">JERSEY DROP RECEIPT</div>
    <div id="receipt-lines"></div>
    <div class="receipt-line"><span>Subtotal</span><span id="receipt-subtotal"></span></div>
    <div class="receipt-line" id="receipt-delivery-row"><span id="receipt-delivery-label"></span><span id="receipt-delivery-value"></span></div>
    <div class="receipt-total"><span>TOTAL</span><span id="receipt-total"></span></div>

    <div class="field-label">PAYMENT METHOD</div>
    <div id="pay-options"></div>

    <div class="note-box">No payment now — pay via Telebirr/CBE when your order arrives.</div>

    <div class="field-label" style="text-align:center">SEND YOUR ORDER TO CONFIRM</div>
    <a class="btn btn-whatsapp btn-block" id="whatsapp-link" target="_blank" rel="noopener">📱 SEND ON WHATSAPP</a>
    <a class="btn btn-telegram btn-block" id="telegram-link" target="_blank" rel="noopener">✈️ SEND ON TELEGRAM</a>
  </div>

  <script type="module" src="js/receipt-page.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `site/js/receipt-page.js`**

```js
import { SHOP_DATA } from './data.js';
import { getCart, clearCart } from './cart-store.js';
import { getZone } from './fee.js';
import { formatETB } from './money.js';
import { buildOrderSummary, formatOrderMessage, buildWhatsAppLink, buildTelegramLink } from './order-message.js';

const cart = getCart(window.localStorage);
const checkoutInfoRaw = window.localStorage.getItem('jerseydrop_checkout');

if (cart.length === 0 || !checkoutInfoRaw) {
  window.location.href = 'cart.html';
} else {
  const checkoutInfo = JSON.parse(checkoutInfoRaw);
  const zone = getZone(SHOP_DATA.zones, checkoutInfo.zoneId);
  const customer = { name: checkoutInfo.name, phone: checkoutInfo.phone, address: checkoutInfo.address };

  let selectedPaymentMethod = 'Telebirr';

  function renderSummary() {
    const summary = buildOrderSummary(cart, SHOP_DATA.products, customer, zone, selectedPaymentMethod);

    document.getElementById('receipt-lines').innerHTML = summary.lines
      .map(
        (l) => `
        <div class="receipt-line">
          <span>${l.name} <span class="qty">x${l.qty}, Size ${l.size}</span></span>
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
      { id: 'Telebirr', label: 'Telebirr', detail: `Send to ${SHOP_DATA.telebirrNumber} when the courier arrives, then confirm.` },
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
```

- [ ] **Step 3: Manual verification**

Complete the full flow: add jerseys to cart → checkout with a name/phone/address and a zone → land on `receipt.html`. Confirm: itemized lines match the cart, subtotal/delivery fee/total math is correct, switching between Telebirr and CBE updates the shown account details, the "No payment now" note is visible, and both send buttons carry a `wa.me`/`t.me` link with the full order text URL-encoded in `?text=` (inspect the link's `href` — do not actually click through and send in WhatsApp/Telegram during verification, since no real business account exists yet).

- [ ] **Step 4: Commit**

```bash
git -C jersey-drop add site/receipt.html site/js/receipt-page.js
git -C jersey-drop commit -m "Add receipt page with payment method and WhatsApp/Telegram send links"
```

---

### Task 11: Local preview server and end-to-end walkthrough

**Files:**
- Create: `jersey-drop/.claude/launch.json`

**Interfaces:**
- Consumes: the full site built in Tasks 1–10.

- [ ] **Step 1: Create `.claude/launch.json` so the site can be previewed with `preview_start`**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "jersey-drop-site",
      "runtimeExecutable": "python",
      "runtimeArgs": ["-m", "http.server", "5500", "--directory", "site"],
      "port": 5500
    }
  ]
}
```

- [ ] **Step 2: Start the server and confirm it serves the homepage**

Run: `python -m http.server 5500 --directory jersey-drop/site` (from the repo root, in a background/separate terminal)
Then: `curl -s http://localhost:5500/index.html | head -5`
Expected: the first lines of `index.html`'s `<!doctype html>` output, not a connection error.

- [ ] **Step 3: Full manual walkthrough at mobile width (375px)**

Using the browser preview tool at a 375×812 viewport: load `index.html`, add two jerseys (different sizes) to cart, go to `cart.html` and adjust a quantity, proceed to `checkout.html` and fill in the form with a zone, submit to `receipt.html`, switch payment methods, and confirm the total updates correctly and no step causes horizontal scrolling.

- [ ] **Step 4: Commit**

```bash
git -C jersey-drop add .claude/launch.json
git -C jersey-drop commit -m "Add local preview server configuration"
```
