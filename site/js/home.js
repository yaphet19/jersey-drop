import { SHOP_DATA, DEFAULT_FIT, DEFAULT_SLEEVE } from './data.js';
import { computeDiscountedPrice, formatETB } from './money.js';
import { addToCart, getCart, pruneCart } from './cart-store.js';
import { renderMiniCart } from './mini-cart.js';

pruneCart(window.localStorage, SHOP_DATA.products.map((p) => p.id));

function cartItemCount() {
  return getCart(window.localStorage).reduce((sum, item) => sum + item.qty, 0);
}

function renderCartCount() {
  document.getElementById('cart-count').textContent = cartItemCount();
}

function productsForFilter(filter) {
  if (filter === 'new') return SHOP_DATA.products.filter((p) => p.isNew);
  if (filter === 'offers') return SHOP_DATA.products.filter((p) => p.discountPercent > 0);
  return SHOP_DATA.products;
}

function renderProductGrid(filter = 'all') {
  const grid = document.getElementById('product-grid');
  const products = productsForFilter(filter);

  if (products.length === 0) {
    grid.innerHTML = `<p class="empty-grid-note">Nothing here right now — check back soon.</p>`;
    return;
  }

  grid.innerHTML = products
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
          <a class="product-link" href="product.html?id=${product.id}">
            <div class="product-image-wrap">
              ${badgeHtml}
              <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-category">${product.category}</div>
            <div class="product-name">${product.name}</div>
          </a>
          <div class="product-price">${priceHtml}</div>
          <button class="btn-outline add-to-cart-btn" data-product-id="${product.id}">+ Add to Cart</button>
        </div>
      `;
    })
    .join('');

  grid.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', () => openSizeModal(btn.dataset.productId));
  });
}

function wireFilterControls() {
  document.querySelectorAll('.nav-filter').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.tagName === 'A') e.preventDefault();
      const filter = el.dataset.filter;
      document
        .querySelectorAll('.nav-links .nav-filter')
        .forEach((o) => o.classList.toggle('selected', o.dataset.filter === filter));
      renderProductGrid(filter);
      document.getElementById('product-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderOptionGroup(container, groupClass, values, onPick) {
  container.querySelectorAll(`.${groupClass} .size-option`).forEach((el) => {
    el.addEventListener('click', () => {
      container.querySelectorAll(`.${groupClass} .size-option`).forEach((o) => o.classList.remove('selected'));
      el.classList.add('selected');
      onPick(el.dataset.value);
    });
  });
}

function openSizeModal(productId) {
  const product = SHOP_DATA.products.find((p) => p.id === productId);
  const root = document.getElementById('modal-root');
  const selection = { size: null, sleeve: DEFAULT_SLEEVE, fit: DEFAULT_FIT };

  function optionsHtml(groupClass, values) {
    return `<div class="size-options ${groupClass}">${values
      .map((v) => `<div class="size-option" data-value="${v}">${v}</div>`)
      .join('')}</div>`;
  }

  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="product-name">${product.name}</div>
        <div class="field-label">SELECT SIZE</div>
        ${optionsHtml('group-size', product.sizes)}
        <button class="btn btn-primary btn-block" id="confirm-add-btn" disabled>ADD TO CART</button>
      </div>
    </div>
  `;

  const confirmBtn = root.querySelector('#confirm-add-btn');
  function checkReady() {
    confirmBtn.disabled = !selection.size;
  }

  renderOptionGroup(root, 'group-size', product.sizes, (v) => {
    selection.size = v;
    checkReady();
  });

  root.querySelector('.modal-backdrop').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) root.innerHTML = '';
  });

  confirmBtn.addEventListener('click', () => {
    addToCart(window.localStorage, productId, selection.size, selection.sleeve, selection.fit, 1);
    root.innerHTML = '';
    renderCartCount();
    renderMiniCart();
  });
}

renderProductGrid();
wireFilterControls();
renderCartCount();
renderMiniCart();
