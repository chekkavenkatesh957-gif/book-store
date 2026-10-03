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

function getMatchingCoverSvg(title, category) {
    const t = (title || "").toLowerCase();
    const c = (category || "").toLowerCase();

    if (t.includes("java") && !t.includes("script")) return "java.svg";
    if (t.includes("javascript") || t.includes("js") || t.includes("typescript")) return "javascript.svg";
    if (t.includes("python")) return "python.svg";
    if (t.includes("react")) return "react.svg";
    if (t.includes("node") || t.includes("express")) return "nodejs.svg";
    if (t.includes("docker")) return "docker.svg";
    if (t.includes("kubernetes") || t.includes("k8s")) return "kubernetes.svg";
    if (t.includes("mongo")) return "mongodb.svg";
    if (t.includes("sql") || t.includes("postgres") || t.includes("mysql")) return "sql.svg";
    if (t.includes("clean code") || t.includes("clean architecture") || t.includes("clean coder")) return "cleancode.svg";
    if (t.includes("cracking") || t.includes("interview")) return "cracking.svg";
    if (t.includes("structure") || t.includes("data structure")) return "datastructures.svg";
    if (t.includes("pattern") || t.includes("design pattern")) return "designpatterns.svg";
    if (t.includes("eloquent")) return "eloquent.svg";
    if (t.includes("go ") || t.includes("golang") || t.includes("in go")) return "go.svg";
    if (t.includes("pragmatic") || t.includes("passionate programmer")) return "pragmatic.svg";
    if (t.includes("refactor")) return "refactoring.svg";
    if (t.includes("web") || t.includes("html") || t.includes("css")) return "webdev.svg";
    if (t.includes("c++")) return "cpp.svg";
    if (t.includes(" c ") || t.startsWith("c ") || t.includes("c programming")) return "c.svg";
    if (c.includes("devops") || c.includes("cloud") || t.includes("aws") || t.includes("azure")) return "devops.svg";
    if (t.includes("algorithm")) return "algorithms.svg";

    if (c.includes("web")) return "webdev.svg";
    if (c.includes("backend")) return "nodejs.svg";
    if (c.includes("database")) return "mongodb.svg";
    if (c.includes("cloud") || c.includes("devops")) return "devops.svg";
    if (c.includes("ai") || c.includes("ml") || c.includes("data science")) return "python.svg";
    if (c.includes("security")) return "cleancode.svg";
    if (c.includes("architecture")) return "designpatterns.svg";
    if (c.includes("cs theory") || c.includes("theory")) return "algorithms.svg";
    if (c.includes("interview")) return "cracking.svg";
    if (c.includes("mobile")) return "react.svg";
    if (c.includes("game")) return "cpp.svg";

    return "default-book.svg";
}

function resolveBookImage(imagePath, title, category) {
    if (!imagePath || imagePath.trim() === "" || imagePath === "default-book.png" || imagePath === "default-book.jpg") {
        const svgFile = getMatchingCoverSvg(title, category);
        return `/images/${svgFile}`;
    }
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:") || imagePath.startsWith("/")) {
        return imagePath;
    }
    let cleanName = imagePath.replace(/\.(jpg|png|jpeg)$/i, ".svg");
    return `/images/${cleanName}`;
}

function addToCart(bookId, title, price, author, image) {
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
        cart.push({ id: bookId, title, price, author, image: image || '', quantity: 1 });
    }
    saveCart();
    showNotification(`🛒 "${title}" added to your cart!`);
}

function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2800);
}

async function safeParseResponse(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text || 'Server returned an invalid response' };
    }
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
            booksList.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #ef4444; font-weight: bold; padding: 40px;'>Unable to load books. Please check server connection.</p>";
        }
    }
}

function handleSearch(query) {
    searchTerm = (query || "").toLowerCase().trim();
    const clearBtn = document.getElementById("searchClearBtn");
    if (clearBtn) {
        clearBtn.style.display = searchTerm.length > 0 ? "flex" : "none";
    }
    applyFilters();
}

function clearSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    handleSearch("");
}

function renderCategoryChips() {
    const container = document.getElementById("categoryChips");
    if (!container) return;

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
    
    const chips = document.querySelectorAll(".category-chip");
    chips.forEach(chip => chip.classList.remove("active"));
    if (element) {
        element.classList.add("active");
    }

    applyFilters();
}

function applyFilters() {
    filteredBooks = allBooks.filter(book => {
        const matchesCategory = (selectedCategory === "all") || 
            (book.category && book.category.toLowerCase() === selectedCategory.toLowerCase());
            
        const matchesSearch = !searchTerm || 
            (book.title && book.title.toLowerCase().includes(searchTerm)) ||
            (book.author && book.author.toLowerCase().includes(searchTerm)) ||
            (book.category && book.category.toLowerCase().includes(searchTerm));

        return matchesCategory && matchesSearch;
    });

    displayBooks(filteredBooks);
}

const CAT_COLORS = {
    'programming':  ['#1e3a8a', '#0284c7', '#f59e0b', '💻'],
    'web':          ['#0f766e', '#0284c7', '#38bdf8', '🌐'],
    'backend':      ['#065f46', '#10b981', '#34d399', '⚙️'],
    'database':     ['#7c2d12', '#ea580c', '#fb923c', '🗄️'],
    'ai & ml':      ['#4c1d95', '#7c3aed', '#c084fc', '🤖'],
    'devops':       ['#1e3a5f', '#2563eb', '#60a5fa', '🚀'],
    'cloud':        ['#0369a1', '#0284c7', '#38bdf8', '☁️'],
    'security':     ['#7f1d1d', '#dc2626', '#f87171', '🛡️'],
    'architecture': ['#701a75', '#c026d3', '#e879f9', '🏛️'],
    'default':      ['#1e293b', '#334155', '#94a3b8', '📘'],
};

function getCatMeta(cat) {
    const key = (cat || '').toLowerCase();
    for (const [k, v] of Object.entries(CAT_COLORS)) {
        if (key.includes(k)) return v;
    }
    return CAT_COLORS.default;
}

function bookCoverHTML(book) {
    const imgSrc = resolveBookImage(book.image, book.title, book.category);
    const [c1, c2, accent, icon] = getCatMeta(book.category);

    return `
        <div class="book-cover-wrapper">
            <img class="book-cover"
                 src="${imgSrc}"
                 alt="${escapeHtml(book.title)}"
                 loading="lazy"
                 onerror="this.parentElement.innerHTML=generateDynamicVectorCover('${escapeHtml(book.title)}','${escapeHtml(book.author||'')}','${escapeHtml(book.category||'')}','${c1}','${c2}','${accent}','${icon}')">
        </div>`;
}

function generateDynamicVectorCover(title, author, category, c1, c2, accent, icon) {
    const safeTitle = escapeHtml(title || 'Book Title');
    const safeAuthor = escapeHtml(author || 'Unknown Author');
    const safeCategory = escapeHtml((category || 'General').toUpperCase());
    
    const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg_dyn" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${c1}" />
              <stop offset="100%" stop-color="${c2}" />
            </linearGradient>
            <linearGradient id="spine_dyn" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#000000" stop-opacity="0.4" />
              <stop offset="6%" stop-color="#ffffff" stop-opacity="0.2" />
              <stop offset="12%" stop-color="#000000" stop-opacity="0.1" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </linearGradient>
          </defs>

          <rect width="300" height="420" fill="url(#bg_dyn)" rx="8" />
          <rect width="24" height="420" fill="url(#spine_dyn)" />
          <line x1="24" y1="0" x2="24" y2="420" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1" />

          <g stroke="#ffffff" stroke-opacity="0.06" stroke-width="1">
            <line x1="35" y1="0" x2="35" y2="420" />
            <line x1="265" y1="0" x2="265" y2="420" />
            <line x1="0" y1="70" x2="300" y2="70" />
            <line x1="0" y1="350" x2="300" y2="350" />
          </g>

          <rect x="35" y="32" width="130" height="22" rx="11" fill="#ffffff" fill-opacity="0.15" stroke="${accent}" stroke-opacity="0.5" stroke-width="1" />
          <text x="100" y="47" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="${accent}" text-anchor="middle" letter-spacing="1">${safeCategory}</text>

          <text x="35" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#ffffff">
            <tspan x="35" dy="0">${safeTitle}</tspan>
          </text>

          <text x="35" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="rgba(255,255,255,0.85)">By ${safeAuthor}</text>

          <circle cx="150" cy="265" r="48" fill="#ffffff" fill-opacity="0.08" stroke="${accent}" stroke-opacity="0.4" stroke-width="2" />
          <text x="150" y="278" font-family="'Segoe UI Emoji', sans-serif" font-size="38" text-anchor="middle">${icon}</text>

          <rect x="0" y="412" width="300" height="8" fill="${accent}" />
        </svg>
    `;

    return `<div class="book-cover-wrapper">${svgContent}</div>`;
}

function displayBooks(books) {
    const booksList = document.getElementById("booksList");
    if (!booksList) return;

    if (books.length === 0) {
        booksList.innerHTML = "<p style='grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; font-size: 15px; font-weight: 500;'>No books found matching your selection.</p>";
        return;
    }

    booksList.innerHTML = books.map(book => {
        const imgArg = escapeHtml(book.image || '');
        return `
        <div class="book-card">
            ${bookCoverHTML(book)}
            <div>
                <h3>${escapeHtml(book.title)}</h3>
                <span class="author">By ${escapeHtml(book.author || "Unknown")}</span>
                <div style="margin: 6px 0;"><span class="category">${escapeHtml(book.category || "General")}</span></div>
                <p class="price">₹${book.price}</p>
            </div>
            <div class="book-actions">
                <button class="btn-small btn-cart" onclick="addToCart('${book._id || book.id}', '${escapeHtml(book.title)}', ${book.price}, '${escapeHtml(book.author || '')}', '${imgArg}')">🛒 Add to Cart</button>
            </div>
        </div>
        `;
    }).join("");
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}