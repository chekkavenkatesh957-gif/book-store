/**
 * Client-Side Authentication Manager & UI Navigation Handler
 */

async function safeParseResponse(response) {
    if (!response) return { ok: false, message: "No response received from server" };
    try {
        const text = await response.text();
        if (!text) return { ok: response.ok };
        try {
            return JSON.parse(text);
        } catch (e) {
            console.warn("Server response was not valid JSON:", text);
            return { ok: response.ok, message: text.length < 150 ? text : `Server error (${response.status})` };
        }
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

function getCurrentUser() {
    try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Error reading user session:", e);
        return null;
    }
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    } else {
        localStorage.removeItem("user");
    }
}

function logoutUser(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem("user");
        window.location.href = "/login";
    }
}

function renderAuthNav() {
    const navAuth = document.getElementById("navAuth");
    if (!navAuth) return;

    const user = getCurrentUser();

    if (user && user.name) {
        navAuth.innerHTML = `
            <a href="#" onclick="showUserProfileModal(); return false;" class="nav-user-badge" title="Click to view login details">👤 ${escapeHtml(user.name)}</a>
            <a href="#" onclick="logoutUser(event)" class="nav-logout-btn">Logout</a>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="/login">Login</a>
            <a href="/signup">Sign Up</a>
        `;
    }
}

function showUserProfileModal() {
    const user = getCurrentUser();
    if (!user) {
        alert("You are not currently logged in.");
        window.location.href = "/login";
        return;
    }

    let modal = document.getElementById("userProfileModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "userProfileModal";
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; justify-content: center;
            align-items: center; z-index: 9999; animation: fadeIn 0.2s ease-in-out;
        `;
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 420px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; font-family: Arial, sans-serif;">
            <button onclick="closeUserProfileModal()" style="position: absolute; top: 12px; right: 15px; border: none; background: transparent; font-size: 22px; cursor: pointer; color: #888;">&times;</button>
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">👤</div>
                <h2 style="color: #0d47a1; margin: 0; font-size: 22px;">My Account Details</h2>
                <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-top: 5px;">Active Session</span>
            </div>
            
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div style="margin-bottom: 10px; font-size: 14px;">
                    <strong style="color: #555; display: block; font-size: 12px; text-transform: uppercase;">Full Name</strong>
                    <span style="color: #111; font-size: 16px; font-weight: bold;">${escapeHtml(user.name)}</span>
                </div>
                <div style="margin-bottom: 10px; font-size: 14px;">
                    <strong style="color: #555; display: block; font-size: 12px; text-transform: uppercase;">Email Address</strong>
                    <span style="color: #111; font-size: 15px;">${escapeHtml(user.email)}</span>
                </div>
                <div style="font-size: 14px;">
                    <strong style="color: #555; display: block; font-size: 12px; text-transform: uppercase;">Account Type</strong>
                    <span style="color: #0d47a1; font-size: 14px; font-weight: bold;">Registered Book Store Customer</span>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <a href="/orders" style="display: block; text-align: center; background: #0d47a1; color: white; text-decoration: none; padding: 12px; border-radius: 6px; font-weight: bold;">📜 View Order History</a>
                <button onclick="logoutUser()" style="width: 100%; background: #dc3545; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px;">🚪 Logout of Account</button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

function closeUserProfileModal() {
    const modal = document.getElementById("userProfileModal");
    if (modal) modal.style.display = "none";
}

function checkActiveSessionOnAuthPages() {
    const user = getCurrentUser();
    const loginBox = document.querySelector(".login-box, .signup-box");
    
    if (user && user.name && loginBox) {
        let sessionNotice = document.getElementById("sessionNoticeBanner");
        if (!sessionNotice) {
            sessionNotice = document.createElement("div");
            sessionNotice.id = "sessionNoticeBanner";
            sessionNotice.style.cssText = `
                background: #e3f2fd; border: 1px solid #90caf9; color: #0d47a1;
                padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;
            `;
            loginBox.insertBefore(sessionNotice, loginBox.firstChild);
        }

        sessionNotice.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 5px;">ℹ️</div>
            <strong>Already Logged In!</strong>
            <p style="margin: 5px 0 10px 0; font-size: 14px; color: #333;">
                You are currently signed in as <strong>${escapeHtml(user.name)}</strong> (${escapeHtml(user.email)}).
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <a href="/" style="background: #0d47a1; color: white; text-decoration: none; padding: 8px 14px; border-radius: 5px; font-size: 13px; font-weight: bold;">🏠 Go to Store</a>
                <button onclick="showUserProfileModal()" style="background: #17a2b8; color: white; border: none; padding: 8px 14px; border-radius: 5px; font-size: 13px; font-weight: bold; cursor: pointer;">👤 My Details</button>
                <button onclick="logoutUser()" style="background: #dc3545; color: white; border: none; padding: 8px 14px; border-radius: 5px; font-size: 13px; font-weight: bold; cursor: pointer;">🚪 Logout</button>
            </div>
        `;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener("DOMContentLoaded", () => {
    renderAuthNav();
    checkActiveSessionOnAuthPages();
});
