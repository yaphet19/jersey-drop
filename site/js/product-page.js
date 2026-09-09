import { SHOP_DATA, DEFAULT_FIT, DEFAULT_SLEEVE } from './data.js';
import { computeDiscountedPrice, formatETB } from './money.js';
import { addToCart, getCart } from './cart-store.js';
import { renderMiniCart } from './mini-cart.js';

function renderCartCount() {
  document.getElementById('cart-count').textContent = getCart(window.localStorage).reduce(
    (sum, item) => sum + item.qty,
    0
  );
}

const params = new URLSearchParams(window.location.search);
const product = SHOP_DATA.products.find((p) => p.id === params.get('id'));

const container = document.getElementById('product-container');

if (!product) {
  container.innerHTML = `
    <a class="back-link" href="index.html">← Back to Shop</a>
    <p>Sorry, we couldn't find that jersey.</p>
  `;
} else {
  const selection = { size: null, sleeve: DEFAULT_SLEEVE, fit: DEFAULT_FIT };
  let activeImageIndex = 0;
  const images = product.images && product.images.length ? product.images : [product.image];
  const finalPrice = computeDiscountedPrice(product.price, product.discountPercent);
  const priceHtml = product.discountPercent
    ? `<span class="price-old">${formatETB(product.price)}</span><span class="price-new">${formatETB(finalPrice)}</span>`
    : `<span class="price-new">${formatETB(finalPrice)}</span>`;
  const badgeHtml = product.discountPercent
    ? `<div class="badge-discount">-${product.discountPercent}%</div>`
    : '';

  container.innerHTML = `
    <a class="back-link" href="index.html">← Back to Shop</a>
    <div class="pdp-gallery">
      ${badgeHtml}
      <div class="pdp-gallery-track" id="pdp-gallery-track">
        ${images
          .map(
            (src, i) => `
          <div class="pdp-gallery-slide" data-index="${i}">
            <img src="${src}" alt="${product.name}">
          </div>
        `
          )
          .join('')}
      </div>
      <div class="pdp-zoom-hint">🔍 Tap to zoom</div>
      ${
        images.length > 1
          ? `
        <button class="pdp-arrow pdp-arrow-left" id="pdp-arrow-left" aria-label="Previous photo">‹</button>
        <button class="pdp-arrow pdp-arrow-right" id="pdp-arrow-right" aria-label="Next photo">›</button>
      `
          : ''
      }
    </div>
    ${images.length > 1 ? `<div class="pdp-gallery-dots" id="pdp-gallery-dots">${images.map((_, i) => `<span class="dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`).join('')}</div>` : ''}

    <div class="product-category">${product.category}</div>
    <div class="pdp-name">${product.name}</div>
    <div class="product-price">${priceHtml}</div>
    <p class="pdp-description">${product.description}</p>

    <div class="field-label">SELECT SIZE</div>
    <div class="size-options" id="pdp-size-options">
      ${product.sizes.map((size) => `<div class="size-option" data-value="${size}">${size}</div>`).join('')}
    </div>

    <button class="btn btn-primary btn-block" id="pdp-add-btn" disabled>ADD TO CART</button>
  `;

  function checkReady() {
    document.getElementById('pdp-add-btn').disabled = !selection.size;
  }

  function wireOptionGroup(containerId, key) {
    document.querySelectorAll(`#${containerId} .size-option`).forEach((el) => {
      el.addEventListener('click', () => {
        document.querySelectorAll(`#${containerId} .size-option`).forEach((o) => o.classList.remove('selected'));
        el.classList.add('selected');
        selection[key] = el.dataset.value;
        checkReady();
      });
    });
  }

  wireOptionGroup('pdp-size-options', 'size');

  document.getElementById('pdp-add-btn').addEventListener('click', () => {
    addToCart(window.localStorage, product.id, selection.size, selection.sleeve, selection.fit, 1);
    renderCartCount();
    renderMiniCart();
    const btn = document.getElementById('pdp-add-btn');
    btn.textContent = 'ADDED ✓';
    setTimeout(() => {
      btn.textContent = 'ADD TO CART';
    }, 1500);
  });

  const track = document.getElementById('pdp-gallery-track');
  const dots = document.querySelectorAll('#pdp-gallery-dots .dot');
  const arrowLeft = document.getElementById('pdp-arrow-left');
  const arrowRight = document.getElementById('pdp-arrow-right');

  function goToImage(index) {
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
    setActiveDot(clamped);
  }

  function setActiveDot(index) {
    activeImageIndex = index;
    dots.forEach((dot) => dot.classList.toggle('active', Number(dot.dataset.index) === index));
    if (arrowLeft) arrowLeft.classList.toggle('pdp-arrow-disabled', index === 0);
    if (arrowRight) arrowRight.classList.toggle('pdp-arrow-disabled', index === images.length - 1);
  }

  track.addEventListener('scroll', () => {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActiveDot(index);
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => goToImage(Number(dot.dataset.index)));
  });

  if (arrowLeft) arrowLeft.addEventListener('click', () => goToImage(activeImageIndex - 1));
  if (arrowRight) arrowRight.addEventListener('click', () => goToImage(activeImageIndex + 1));
  setActiveDot(0);

  track.addEventListener('click', () => {
    const zoomRoot = document.getElementById('zoom-root');
    zoomRoot.innerHTML = `
      <div class="zoom-overlay" id="zoom-overlay">
        <img src="${images[activeImageIndex]}" alt="${product.name}">
        <div class="zoom-close">✕</div>
      </div>
    `;
    document.getElementById('zoom-overlay').addEventListener('click', () => {
      zoomRoot.innerHTML = '';
    });
  });
}

renderCartCount();
renderMiniCart();
