const PRODUCTS = {
  pro: {
    id: 'pro',
    name: 'SMYLOX Pro Series',
    price: 4999,
    image: 'https://www.smylox.in/cdn/shop/files/colours.png?v=1767985369&width=1100',
  },
  luxe: {
    id: 'luxe',
    name: 'SMYLOX Luxe',
    price: 3499,
    image: 'https://www.smylox.in/cdn/shop/files/in_hand_black.png?v=1767985369&width=1100',
  },
  starter: {
    id: 'starter',
    name: 'SMYLOX Starter',
    price: 2299,
    image: 'https://www.smylox.in/cdn/shop/files/sonic_refills_white.png?v=1767985369&width=1100',
  },
};

const formatPrice = value => `Rs. ${value.toLocaleString('en-IN')}`;

const getCart = () => JSON.parse(localStorage.getItem('smyloxCart') || '[]');
const setCart = cart => localStorage.setItem('smyloxCart', JSON.stringify(cart));

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function updateCartUI() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = count;
  });

  const cartItems = document.querySelector('[data-cart-items]');
  const subtotalEl = document.querySelector('[data-cart-subtotal]');
  const emptyEl = document.querySelector('[data-cart-empty]');

  if (!cartItems || !subtotalEl || !emptyEl) return;

  cartItems.innerHTML = '';
  emptyEl.hidden = cart.length > 0;

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div>
        <strong>${item.name}</strong>
        <span>${formatPrice(item.price)} x ${item.quantity}</span>
      </div>
      <div class="quantity-control" aria-label="Quantity controls for ${item.name}">
        <button type="button" data-cart-decrease="${item.id}" aria-label="Decrease quantity">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-cart-increase="${item.id}" aria-label="Increase quantity">+</button>
      </div>
    `;
    cartItems.appendChild(row);
  });

  subtotalEl.textContent = formatPrice(subtotal);
}

function addToCart(productId, quantity = 1) {
  const product = PRODUCTS[productId] || PRODUCTS.pro;
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  setCart(cart);
  updateCartUI();
  showToast(`${product.name} added to cart`);
}

function changeQuantity(productId, delta) {
  const nextCart = getCart()
    .map(item => (item.id === productId ? { ...item, quantity: item.quantity + delta } : item))
    .filter(item => item.quantity > 0);

  setCart(nextCart);
  updateCartUI();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.cart-drawer')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="cart-overlay" data-close-cart></div>
      <aside class="cart-drawer" aria-label="Shopping cart">
        <div class="cart-head">
          <h2>Your Cart</h2>
          <button class="icon-button" type="button" data-close-cart aria-label="Close cart">x</button>
        </div>
        <div class="cart-items" data-cart-items></div>
        <p class="policy-card" data-cart-empty>Your cart is empty. Add a SMYLOX brush to begin.</p>
        <div class="cart-foot">
          <strong>Subtotal: <span data-cart-subtotal>Rs. 0</span></strong>
          <button class="cta-button" type="button" data-checkout>Checkout</button>
        </div>
      </aside>
    `);
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartOverlay = document.querySelector('.cart-overlay');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('.accordion-button').forEach(button => {
    button.addEventListener('click', () => {
      const panel = button.nextElementSibling;
      const isOpen = panel.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });

  function openCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
  }

  function closeCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  }

  document.querySelectorAll('[data-open-cart]').forEach(button => {
    button.addEventListener('click', openCart);
  });

  document.querySelectorAll('[data-close-cart]').forEach(button => {
    button.addEventListener('click', closeCart);
  });

  document.querySelectorAll('[data-add-to-cart]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const quantityInput = document.querySelector('[data-product-quantity]');
      const quantity = quantityInput ? Math.max(1, Number(quantityInput.value) || 1) : 1;
      addToCart(button.dataset.addToCart, quantity);
      openCart();
    });
  });

  document.querySelectorAll('[data-buy-now]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      addToCart(button.dataset.buyNow, 1);
      openCart();
    });
  });

  document.addEventListener('click', event => {
    const increase = event.target.closest('[data-cart-increase]');
    const decrease = event.target.closest('[data-cart-decrease]');

    if (increase) changeQuantity(increase.dataset.cartIncrease, 1);
    if (decrease) changeQuantity(decrease.dataset.cartDecrease, -1);
  });

  document.querySelector('[data-checkout]')?.addEventListener('click', () => {
    const cart = getCart();
    if (!cart.length) {
      showToast('Your cart is empty');
      return;
    }

    const orderId = `SMY-${Math.floor(100000 + Math.random() * 900000)}`;
    localStorage.setItem('smyloxLastOrder', orderId);
    setCart([]);
    updateCartUI();
    closeCart();
    showToast(`Demo order placed: ${orderId}`);
  });

  document.querySelector('[data-contact-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast('Message sent. Our support team will contact you soon.');
  });

  document.querySelector('[data-newsletter-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast('You are subscribed to SMYLOX updates.');
  });

  document.querySelector('[data-track-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = event.currentTarget.querySelector('input');
    const result = document.querySelector('[data-track-result]');
    const orderId = input.value.trim() || localStorage.getItem('smyloxLastOrder');

    if (!orderId) {
      showToast('Enter an order number to track.');
      return;
    }

    result.hidden = false;
    result.innerHTML = `
      <h3>${orderId.toUpperCase()}</h3>
      <p>Your SMYLOX order is confirmed, packed, and waiting for courier pickup. Estimated delivery: 2-5 business days.</p>
      <div class="status-steps">
        <span class="done">Confirmed</span>
        <span class="done">Packed</span>
        <span>Shipped</span>
        <span>Delivered</span>
      </div>
    `;
  });

  updateCartUI();
});
