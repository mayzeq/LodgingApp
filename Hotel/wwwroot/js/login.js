const API = "/api";

document.addEventListener("DOMContentLoaded", () => {
    const current = localStorage.getItem("hotelCurrentUser");
    if (current) {
        location.replace("/app.html");
        return;
    }

    document.getElementById("tab-login")?.addEventListener("click", () => switchTab("login"));
    document.getElementById("tab-register")?.addEventListener("click", () => switchTab("register"));
    document.getElementById("login-form")?.addEventListener("submit", onLogin);
    document.getElementById("register-form")?.addEventListener("submit", onRegister);
});

function switchTab(name) {
    const loginTab = document.getElementById("tab-login");
    const registerTab = document.getElementById("tab-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const showLogin = name === "login";
    loginTab?.classList.toggle("active", showLogin);
    registerTab?.classList.toggle("active", !showLogin);
    loginForm?.classList.toggle("active", showLogin);
    registerForm?.classList.toggle("active", !showLogin);
}

function setMessage(text, isError = false) {
    const node = document.getElementById("auth-message");
    if (!node) return;
    node.textContent = text;
    node.classList.toggle("error", isError);
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API}${path}`, options);
    if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `Ошибка ${response.status}`);
    }
    const type = response.headers.get("content-type") || "";
    return type.includes("application/json") ? response.json() : response.text();
}

async function onLogin(event) {
    event.preventDefault();
    try {
        const user = await apiRequest("/Users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                login: document.getElementById("login-username")?.value.trim(),
                password: document.getElementById("login-password")?.value
            })
        });
        localStorage.setItem("hotelCurrentUser", JSON.stringify(user));
        // one app shell, but role-based views inside
        location.replace("/app.html");
    } catch (error) {
        setMessage(error.message, true);
    }
}

async function onRegister(event) {
    event.preventDefault();
    try {
        const user = await apiRequest("/Users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                login: document.getElementById("reg-username")?.value.trim(),
                password: document.getElementById("reg-password")?.value,
                email: document.getElementById("reg-email")?.value.trim(),
                phone: document.getElementById("reg-phone")?.value.trim(),
                role: "guest"
            })
        });
        localStorage.setItem("hotelCurrentUser", JSON.stringify(user));
        location.replace("/app.html");
    } catch (error) {
        setMessage(error.message, true);
    }
}
