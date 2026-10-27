"use strict";

const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 2499,
    emoji: "🎧",
  },
  {
    id: 2,
    name: "Classic Sneakers",
    category: "Fashion",
    price: 1899,
    emoji: "👟",
  },
  {
    id: 3,
    name: "Everyday Backpack",
    category: "Accessories",
    price: 1299,
    emoji: "🎒",
  },
  {
    id: 4,
    name: "Smart Watch",
    category: "Electronics",
    price: 3299,
    emoji: "⌚",
  },
  {
    id: 5,
    name: "Cotton T-Shirt",
    category: "Fashion",
    price: 599,
    emoji: "👕",
  },
  {
    id: 6,
    name: "Desk Lamp",
    category: "Home",
    price: 999,
    emoji: "💡",
  },
  {
    id: 7,
    name: "Sunglasses",
    category: "Accessories",
    price: 799,
    emoji: "🕶️",
  },
  {
    id: 8,
    name: "Travel Bottle",
    category: "Home",
    price: 449,
    emoji: "🧴",
  },
];

const coupons = {
  SAVE10: 10,
  WELCOME15: 15,
};

let appliedCoupon = null;

const STORAGE_KEY = "shopease-cart";

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!Array.isArray(savedCart)) {
      return [];
    }

    return savedCart
      .filter((item) => {
        return (
          products.some((p) => p.id === Number(item.id)) &&
          Number.isInteger(Number(item.quantity)) &&
          Number(item.quantity) >= 1 &&
          Number(item.quantity) <= 99
        );
      })
      .map((item) => ({
        id: Number(item.id),
        quantity: Number(item.quantity),
      }));
  } catch (error) {
    return [];
  }
}

let cart = loadCart();

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Could not save cart:", error);
  }
}

const productList = document.getElementById("product-list");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");

const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const emptyCart = document.getElementById("empty-cart");
const noProducts = document.getElementById("no-products");

const subtotalElement = document.getElementById("subtotal");
const discountElement = document.getElementById("discount");
const totalElement = document.getElementById("total");

const couponInput = document.getElementById("coupon");
const couponMessage = document.getElementById("coupon-message");
const applyCouponButton = document.getElementById("apply-coupon");

const checkoutButton = document.getElementById("checkout");
const checkoutDialog = document.getElementById("checkout-dialog");
const checkoutForm = document.getElementById("checkout-form");
const checkoutTotal = document.getElementById("checkout-total");

const successDialog = document.getElementById("success-dialog");
const successMessage = document.getElementById("success-message");

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function displayProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;
  const sortValue = sortSelect.value;

  let filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (sortValue === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortValue === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortValue === "name") {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  noProducts.hidden = filteredProducts.length !== 0;

  productList.innerHTML = filteredProducts
    .map(
      (product) => `
    <article class="product-card">
      <div class="product-image">
        ${product.emoji}
      </div>

      <div class="product-info">
        <p class="category-label">
          ${product.category}
        </p>

        <h3>${product.name}</h3>

        <p class="price">
          ${formatPrice(product.price)}
        </p>

        <button
          class="add-btn"
          data-add="${product.id}"
          type="button"
        >
          Add to Cart
        </button>
      </div>
    </article>
  `,
    )
    .join("");
}

function addToCart(productId) {
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    if (existingItem.quantity >= 99) {
      alert("Maximum quantity is 99.");
      return;
    }

    existingItem.quantity++;
  } else {
    cart.push({
      id: productId,
      quantity: 1,
    });
  }

  saveCart();
  displayCart();

  const product = products.find((item) => item.id === productId);

  alert(product.name + " added to cart!");
}

function changeQuantity(productId, change) {
  const item = cart.find((item) => item.id === productId);

  if (!item) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  if (newQuantity > 99) {
    alert("Maximum quantity is 99.");
    return;
  }

  item.quantity = newQuantity;

  saveCart();
  displayCart();
}

function removeFromCart(productId) {
  const product = products.find((item) => item.id === productId);

  cart = cart.filter((item) => item.id !== productId);

  if (cart.length === 0) {
    appliedCoupon = null;
    couponInput.value = "";
    showCouponMessage("");
  }

  saveCart();
  displayCart();

  if (product) {
    alert(product.name + " removed from cart.");
  }
}

function calculateSubtotal() {
  return cart.reduce((total, item) => {
    const product = products.find((p) => p.id === item.id);

    return total + product.price * item.quantity;
  }, 0);
}

function calculateDiscount() {
  if (!appliedCoupon) {
    return 0;
  }

  const percentage = coupons[appliedCoupon];

  return (calculateSubtotal() * percentage) / 100;
}

function calculateTotal() {
  return calculateSubtotal() - calculateDiscount();
}

function displayCart() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCount.textContent = totalQuantity;
  emptyCart.hidden = cart.length !== 0;

  cartItems.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.id);
      const itemTotal = product.price * item.quantity;

      return `
      <div class="cart-item">
        <div>
          <h3>${product.emoji} ${product.name}</h3>
          <p>Price: ${formatPrice(product.price)}</p>
          <p>Item total: ${formatPrice(itemTotal)}</p>
        </div>

        <div class="quantity-control">
          <button
            class="quantity-btn"
            data-id="${product.id}"
            data-change="-1"
            type="button"
            aria-label="Decrease quantity"
          >−</button>

          <span class="quantity-value">
            ${item.quantity}
          </span>

          <button
            class="quantity-btn"
            data-id="${product.id}"
            data-change="1"
            type="button"
            aria-label="Increase quantity"
            ${item.quantity >= 99 ? "disabled" : ""}
          >+</button>
        </div>

        <button
          class="remove-btn"
          data-remove="${product.id}"
          type="button"
        >
          Remove
        </button>
      </div>
    `;
    })
    .join("");

  subtotalElement.textContent = formatPrice(calculateSubtotal());
  discountElement.textContent = "-" + formatPrice(calculateDiscount());
  totalElement.textContent = formatPrice(calculateTotal());

  checkoutButton.disabled = cart.length === 0;
}

function showCouponMessage(message, type = "") {
  couponMessage.textContent = message;
  couponMessage.className = "message";

  if (type === "success") {
    couponMessage.classList.add("success-message");
  }

  if (type === "error") {
    couponMessage.classList.add("error-message");
  }
}

function applyCoupon() {
  const code = couponInput.value.trim().toUpperCase();

  if (cart.length === 0) {
    appliedCoupon = null;
    showCouponMessage("Add products before applying a coupon.", "error");
    displayCart();
    return;
  }

  if (code === "") {
    appliedCoupon = null;
    showCouponMessage("Please enter a coupon code.", "error");
    displayCart();
    return;
  }

  if (Object.prototype.hasOwnProperty.call(coupons, code)) {
    appliedCoupon = code;

    showCouponMessage(
      code + " applied successfully! You saved " + coupons[code] + "%.",
      "success",
    );
  } else {
    appliedCoupon = null;
    showCouponMessage("Invalid coupon. Try SAVE10 or WELCOME15.", "error");
  }

  displayCart();
}

checkoutButton.addEventListener("click", function () {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  checkoutTotal.textContent = formatPrice(calculateTotal());
  checkoutDialog.showModal();
});

document.getElementById("close-dialog").addEventListener("click", function () {
  checkoutDialog.close();
});

checkoutForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (cart.length === 0) {
    checkoutDialog.close();
    alert("Your cart is empty!");
    return;
  }

  const customerName = document.getElementById("customer-name").value.trim();
  const orderTotal = formatPrice(calculateTotal());
  const orderNumber = "SE" + Date.now().toString().slice(-7);

  checkoutDialog.close();

  successMessage.textContent =
    "Thank you, " +
    customerName +
    "! Your demo order " +
    orderNumber +
    " for " +
    orderTotal +
    " has been placed. No payment was taken.";

  successDialog.showModal();

  cart = [];
  appliedCoupon = null;
  couponInput.value = "";

  showCouponMessage("");

  saveCart();
  displayCart();

  checkoutForm.reset();
});

productList.addEventListener("click", function (event) {
  const button = event.target.closest("[data-add]");

  if (button) {
    addToCart(Number(button.dataset.add));
  }
});

cartItems.addEventListener("click", function (event) {
  const quantityButton = event.target.closest("[data-change]");

  if (quantityButton) {
    changeQuantity(
      Number(quantityButton.dataset.id),
      Number(quantityButton.dataset.change),
    );
    return;
  }

  const removeButton = event.target.closest("[data-remove]");

  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.remove));
  }
});

searchInput.addEventListener("input", displayProducts);
categorySelect.addEventListener("change", displayProducts);
sortSelect.addEventListener("change", displayProducts);
applyCouponButton.addEventListener("click", applyCoupon);

couponInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    applyCoupon();
  }
});

document
  .getElementById("continue-shopping")
  .addEventListener("click", function () {
    successDialog.close();
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  });

displayProducts();
displayCart();
