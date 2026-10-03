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

    const getUpdates = user.getUpdates !== false;
    modal.innerHTML = `
        <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 20px; width: 90%; max-width: 440px; padding: 30px; box-shadow: 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08); position: relative; font-family: 'Outfit', Arial, sans-serif; border: 1px solid rgba(255,255,255,0.08);">
            <button onclick="closeUserProfileModal()" style="position: absolute; top: 16px; right: 16px; border: none; background: rgba(255,255,255,0.06); width:32px; height:32px; border-radius:50%; font-size: 18px; cursor: pointer; color: rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">&times;</button>
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="width:70px;height:70px;margin:0 auto 14px;background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 10px 28px rgba(37,99,235,0.4);">👤</div>
                <h2 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">My Account</h2>
                <span style="display: inline-block; background: rgba(16,185,129,0.15); color: #34d399; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 8px; border: 1px solid rgba(16,185,129,0.25);">● Active Session</span>
            </div>

            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; margin-bottom: 20px; display:flex; flex-direction:column; gap:14px;">
                <div>
                    <div style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Full Name</div>
                    <div style="color: #fff; font-size: 16px; font-weight: 700;">👤 ${escapeHtml(user.name)}</div>
                </div>
                <div style="border-top:1px solid rgba(255,255,255,0.07); padding-top:14px;">
                    <div style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Email Address</div>
                    <div style="color: #93c5fd; font-size: 15px;">📧 ${escapeHtml(user.email)}</div>
                </div>
                <div style="border-top:1px solid rgba(255,255,255,0.07); padding-top:14px;">
                    <div style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Account Type</div>
                    <div style="color: #a5b4fc; font-size: 14px; font-weight: 700;">📚 Registered Customer</div>
                </div>
                <div style="border-top:1px solid rgba(255,255,255,0.07); padding-top:14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Get Updates &amp; Offers</div>
                        <div style="color:${getUpdates ? '#34d399' : 'rgba(255,255,255,0.35)'}; font-size: 14px; font-weight: 600;">${getUpdates ? '🔔 Subscribed' : '🔕 Not subscribed'}</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <a href="/orders" style="display: block; text-align: center; background: linear-gradient(135deg,#2563eb,#1d4ed8); color: white; text-decoration: none; padding: 13px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 6px 18px rgba(37,99,235,0.35);">📜 My Order History</a>
                <button onclick="logoutUser()" style="width: 100%; background: linear-gradient(135deg,#ef4444,#dc2626); color: white; border: none; padding: 13px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 15px; box-shadow: 0 6px 18px rgba(239,68,68,0.3);">🚪 Logout</button>
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
