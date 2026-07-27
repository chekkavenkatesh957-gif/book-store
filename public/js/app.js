const API_URL = "/api/books";
let allBooks = [];
let filteredBooks = [];
let selectedCategory = "all";
let searchTerm = "";
let cart = [];

// Load books on page load
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    loadBooks();
});

function loadCart() {
    const savedCart = localStorage.getItem("bookstoreCart");
    cart = savedCart ? JSON.parse(savedCart) : [];
    updateCartCount();
}

function saveCart() {
    localStorage.setItem("bookstoreCart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCount) cartCount.textContent = totalItems;
}

function addToCart(bookId, title, price, author) {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("Please log in first to add books to your cart!");
        window.location.href = "/login";
        return;
    }

    const existingItem = cart.find(item => item.id === bookId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: bookId, title, price, author, quantity: 1 });
    }
    saveCart();
    showNotification(`"${title}" added to cart!`);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function loadBooks() {
    try {
        const response = await fetch(API_URL);
        const data = await safeParseResponse(response);
        if (!response.ok || !Array.isArray(data)) throw new Error(data.message || "Failed to fetch books");
        allBooks = data;
        renderCategoryChips();
        applyFilters();
    } catch (error) {
        console.error("Error loading books:", error);
        const booksList = document.getElementById("booksList");
        if (booksList) {
            booksList.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #ef4444; font-weight: bold;'>Unable to load books. Please check server connection.</p>";
        }
    }
}

function renderCategoryChips() {
    const container = document.getElementById("categoryChips");
    if (!container) return;

    // Extract unique categories
    const categoriesMap = new Map();
    allBooks.forEach(b => {
        if (b.category && b.category.trim()) {
            const catClean = b.category.trim();
            categoriesMap.set(catClean, (categoriesMap.get(catClean) || 0) + 1);
        }
    });

    let html = `
        <button class="category-chip ${selectedCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all', this)">
            📚 All Books (${allBooks.length})
        </button>
    `;

    categoriesMap.forEach((count, cat) => {
        const isActive = (selectedCategory.toLowerCase() === cat.toLowerCase());
        html += `
            <button class="category-chip ${isActive ? 'active' : ''}" onclick="selectCategory('${escapeHtml(cat)}', this)">
                🏷️ ${escapeHtml(cat)} (${count})
            </button>
        `;
    });

    container.innerHTML = html;
}

function selectCategory(category, element) {
    selectedCategory = category;
    
    // Update active class state on chips
    const chips = document.querySelectorAll(".category-chip");
    chips.forEach(chip => chip.classList.remove("active"));
    if (element) {
        element.classList.add("active");
    }

    applyFilters();
}

function applyFilters() {
    filteredBooks = allBooks.filter(book => {
        return (selectedCategory === "all") || 
            (book.category && book.category.toLowerCase() === selectedCategory.toLowerCase());
    });

    displayBooks(filteredBooks);
}

function displayBooks(books) {
    const booksList = document.getElementById("booksList");
    if (!booksList) return;

    if (books.length === 0) {
        booksList.innerHTML = "<p style='grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; font-size: 16px;'>No books found matching your selection.</p>";
        return;
    }

    booksList.innerHTML = books.map(book => `
        <div class="book-card">
            <div>
                <h3>${escapeHtml(book.title)}</h3>
                <span class="author">By ${escapeHtml(book.author || "Unknown")}</span>
                <span class="category">${escapeHtml(book.category || "General")}</span>
                <p class="price">₹${book.price}</p>
            </div>
            <div class="book-actions">
                <button class="btn-small btn-cart" onclick="addToCart('${book._id || book.id}', '${escapeHtml(book.title)}', ${book.price}, '${escapeHtml(book.author || '')}')">🛒 Add to Cart</button>
            </div>
        </div>
    `).join("");
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}