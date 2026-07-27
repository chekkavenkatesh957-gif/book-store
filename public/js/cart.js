// Cart Management Functions

let cart = [];

// Load cart on page load
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    displayCart();
});

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem("bookstoreCart");
    cart = savedCart ? JSON.parse(savedCart) : [];
    updateCartCount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem("bookstoreCart", JSON.stringify(cart));
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Display cart items
function displayCart() {
    const cartItemsDiv = document.getElementById("cartItems");
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty. <a href="index.html" style="color: var(--secondary-color); text-decoration: none;">Continue shopping</a></p>';
        document.querySelector(".btn-checkout").disabled = true;
        updateTotals();
        return;
    }
    
    document.querySelector(".btn-checkout").disabled = false;
    
    cartItemsDiv.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="item-details">
                <div class="item-title">${item.title}</div>
                <div class="item-author">${item.author}</div>
            </div>
            <div class="item-price">₹${item.price}</div>
            <div class="quantity-control">
                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">−</button>
                <div class="quantity-display">${item.quantity}</div>
                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
            </div>
            <button class="item-remove" onclick="removeFromCart(${index})">Remove</button>
        </div>
    `).join("");
    
    updateTotals();
}

// Update item quantity
function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
        saveCart();
        displayCart();
    }
}

// Remove item from cart
function removeFromCart(index) {
    if (confirm("Remove this book from cart?")) {
        cart.splice(index, 1);
        saveCart();
        displayCart();
    }
}

// Clear entire cart
function clearCart() {
    if (confirm("Are you sure you want to clear your entire cart?")) {
        cart = [];
        saveCart();
        displayCart();
    }
}

// Update cart totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = cart.length > 0 ? 50 : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;
    
    document.getElementById("subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("shipping").textContent = `₹${shipping}`;
    document.getElementById("tax").textContent = `₹${tax}`;
    document.getElementById("total").textContent = `₹${total.toFixed(2)}`;
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + 50 + tax;
    
    const orderSummary = `
Order Summary:
${cart.map(item => `${item.title} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: ₹${subtotal.toFixed(2)}
Shipping: ₹50
Tax (5%): ₹${tax}
Total: ₹${total.toFixed(2)}

Thank you for your purchase! Your order has been placed successfully.
    `;
    
    alert(orderSummary);
    
    // Clear cart after checkout
    cart = [];
    saveCart();
    displayCart();
    
    // Redirect to home
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}
