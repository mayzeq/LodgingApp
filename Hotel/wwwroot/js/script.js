const API = "/api";
const state = {
    selectedRoomId: null,
    currentUser: null
};

document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    bindForms();
    restoreSession();
    applyAuthState();
    showResult("auth-info", "Войдите или зарегистрируйтесь, чтобы открыть все разделы.");
});

function initMenu() {
    document.querySelectorAll(".menu-item").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("requires-auth") && !state.currentUser) {
                showResult("auth-info", "Сначала выполните вход или регистрацию.", true);
                activateView("auth");
                return;
            }

            document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
            document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
            btn.classList.add("active");
            const view = document.getElementById(`${btn.dataset.view}-view`);
            if (view) {
                view.classList.add("active");
            }
        });
    });
}

function bindForms() {
    document.getElementById("register-form")?.addEventListener("submit", registerUser);
    document.getElementById("login-form")?.addEventListener("submit", loginUser);
    document.getElementById("logout-btn")?.addEventListener("click", logoutUser);
    document.getElementById("refresh-rooms-btn")?.addEventListener("click", loadRooms);
    document.getElementById("guest-form")?.addEventListener("submit", createGuest);
    document.getElementById("booking-form")?.addEventListener("submit", createBooking);
    document.getElementById("payment-form")?.addEventListener("submit", createPayment);
    document.getElementById("confirm-payment-form")?.addEventListener("submit", confirmPayment);
    document.getElementById("service-form")?.addEventListener("submit", createService);
    document.getElementById("booking-service-form")?.addEventListener("submit", addServiceToBooking);
    document.getElementById("my-bookings-form")?.addEventListener("submit", loadMyBookings);
    document.getElementById("cancel-booking-form")?.addEventListener("submit", cancelBooking);
}

function saveSession() {
    if (state.currentUser) {
        localStorage.setItem("hotelCurrentUser", JSON.stringify(state.currentUser));
    } else {
        localStorage.removeItem("hotelCurrentUser");
    }
}

function restoreSession() {
    const raw = localStorage.getItem("hotelCurrentUser");
    if (!raw) return;
    try {
        state.currentUser = JSON.parse(raw);
    } catch {
        localStorage.removeItem("hotelCurrentUser");
    }
}

function activateView(viewName) {
    document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));

    const menuItem = document.querySelector(`.menu-item[data-view="${viewName}"]`);
    const view = document.getElementById(`${viewName}-view`);
    if (menuItem) menuItem.classList.add("active");
    if (view) view.classList.add("active");
}

function applyAuthState() {
    const isAuthorized = Boolean(state.currentUser?.userId);

    document.querySelectorAll(".menu-item.requires-auth").forEach((btn) => {
        btn.disabled = !isAuthorized;
    });

    const panel = document.getElementById("session-panel");
    const statusNode = document.getElementById("session-status");
    const logoutBtn = document.getElementById("logout-btn");

    if (statusNode) {
        statusNode.textContent = isAuthorized
            ? `${state.currentUser.login} (ID: ${state.currentUser.userId})`
            : "Гость";
    }

    if (panel) panel.classList.toggle("authorized", isAuthorized);
    if (logoutBtn) logoutBtn.disabled = !isAuthorized;

    const guestUserId = document.getElementById("guest-user-id");
    const myUserId = document.getElementById("my-user-id");
    if (isAuthorized) {
        if (guestUserId) guestUserId.value = state.currentUser.userId;
        if (myUserId) myUserId.value = state.currentUser.userId;
    } else {
        if (guestUserId) guestUserId.value = "";
        if (myUserId) myUserId.value = "";
    }

    if (!isAuthorized) {
        activateView("auth");
    } else {
        activateView("lodgings");
        loadRooms();
    }
}

function showResult(containerId, text, isError = false) {
    const node = document.getElementById(containerId);
    if (!node) {
        return;
    }
    node.innerHTML = `<p class="${isError ? "error" : ""}">${escapeHtml(text)}</p>`;
}

function showJson(containerId, payload) {
    const node = document.getElementById(containerId);
    if (!node) {
        return;
    }
    node.innerHTML = `<pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
}

function escapeHtml(input) {
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API}${path}`, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Ошибка ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}

function toQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            query.set(key, value);
        }
    });
    return query.toString();
}

async function registerUser(event) {
    event.preventDefault();
    try {
        const data = await apiRequest("/Users/register", {
            method: "POST",
            body: JSON.stringify({
                login: document.getElementById("reg-username")?.value.trim(),
                password: document.getElementById("reg-password")?.value,
                email: document.getElementById("reg-email")?.value.trim(),
                phone: document.getElementById("reg-phone")?.value.trim(),
                role: "guest"
            })
        });
        state.currentUser = {
            userId: data.userId,
            login: data.login,
            email: data.email,
            role: data.role
        };
        saveSession();
        applyAuthState();
        showResult("auth-info", `Регистрация успешна. Добро пожаловать, ${data.login}!`);
    } catch (error) {
        showResult("auth-info", error.message, true);
    }
}

async function loginUser(event) {
    event.preventDefault();
    try {
        const data = await apiRequest("/Users/login", {
            method: "POST",
            body: JSON.stringify({
                login: document.getElementById("login-username")?.value.trim(),
                password: document.getElementById("login-password")?.value
            })
        });
        state.currentUser = {
            userId: data.userId,
            login: data.login,
            email: data.email,
            role: data.role
        };
        saveSession();
        applyAuthState();
        renderAuthInfo(`Вход успешен. Добро пожаловать, ${data.login}!`);
    } catch (error) {
        showResult("auth-info", error.message, true);
    }
}

function logoutUser() {
    state.currentUser = null;
    saveSession();
    applyAuthState();
    renderAuthInfo("Вы вышли из системы.");
}

function renderAuthInfo(message = "") {
    const text = message || "Выполните вход, чтобы получить свой UserId.";
    showResult("auth-info", text);
}

async function loadRooms() {
    if (!state.currentUser) return;
    try {
        const rooms = await apiRequest("/Rooms");
        renderRooms(rooms);
    } catch (error) {
        showResult("rooms-selected", error.message, true);
    }
}

function renderRooms(rooms) {
    const table = document.getElementById("rooms-table");
    if (!table) {
        return;
    }
    table.innerHTML = "";
    rooms.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${item.roomId}</strong></td>
            <td>${escapeHtml(item.roomNumber)}</td>
            <td>${escapeHtml(item.roomType?.typeName || "-")}</td>
            <td>${item.roomType?.pricePerNight ?? "-"}</td>
            <td>${escapeHtml(item.status)}</td>
        `;
        row.addEventListener("click", () => selectRoom(item));
        table.appendChild(row);
    });
}

function selectRoom(item) {
    state.selectedRoomId = item.roomId;
    const bookingRoomId = document.getElementById("booking-room-id");
    if (bookingRoomId) bookingRoomId.value = item.roomId;
    showResult("rooms-selected", `Выбран номер #${item.roomId}: ${item.roomNumber}`);
}

async function createGuest(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const guest = await apiRequest("/Guests", {
            method: "POST",
            body: JSON.stringify({
                userId: Number(document.getElementById("guest-user-id")?.value),
                surname: document.getElementById("guest-surname")?.value.trim(),
                firstName: document.getElementById("guest-first-name")?.value.trim(),
                patronymic: document.getElementById("guest-patronymic")?.value.trim() || null,
                birthdate: document.getElementById("guest-birthdate")?.value,
                passport: document.getElementById("guest-passport")?.value.trim()
            })
        });
        showJson("guest-result", guest);
        const bookingGuestId = document.getElementById("booking-guest-id");
        if (bookingGuestId) bookingGuestId.value = guest.guestId;
    } catch (error) {
        showResult("guest-result", error.message, true);
    }
}

async function createBooking(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const booking = await apiRequest("/Bookings", {
            method: "POST",
            body: JSON.stringify({
                guestId: Number(document.getElementById("booking-guest-id")?.value),
                roomId: Number(document.getElementById("booking-room-id")?.value),
                checkInDate: document.getElementById("booking-start-date")?.value,
                checkOutDate: document.getElementById("booking-end-date")?.value
            })
        });
        showJson("booking-result", booking);
        if (booking.orderId) {
            const paymentOrderId = document.getElementById("payment-order-id");
            if (paymentOrderId) paymentOrderId.value = booking.orderId;
        }
    } catch (error) {
        showResult("booking-result", error.message, true);
    }
}

async function createPayment(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const payment = await apiRequest("/Payments", {
            method: "POST",
            body: JSON.stringify({
                orderId: Number(document.getElementById("payment-order-id")?.value),
                amount: Number(document.getElementById("payment-amount")?.value),
                paymentMethod: document.getElementById("payment-method")?.value.trim() || "card"
            })
        });
        showJson("payment-result", payment);
        if (payment.paymentId) {
            const confirmId = document.getElementById("confirm-payment-id");
            if (confirmId) confirmId.value = payment.paymentId;
        }
    } catch (error) {
        showResult("payment-result", error.message, true);
    }
}

async function confirmPayment(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const paymentId = document.getElementById("confirm-payment-id")?.value;
        const result = await apiRequest(`/Payments/${paymentId}/confirm`, { method: "PATCH" });
        if (typeof result === "string") {
            showResult("payment-result", result);
        } else {
            showJson("payment-result", result);
        }
    } catch (error) {
        showResult("payment-result", error.message, true);
    }
}

async function createService(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const service = await apiRequest("/Services", {
            method: "POST",
            body: JSON.stringify({
                serviceName: document.getElementById("service-name")?.value.trim(),
                description: document.getElementById("service-description")?.value.trim() || null,
                price: Number(document.getElementById("service-price")?.value),
                isIncluded: document.getElementById("service-included")?.checked || false
            })
        });
        showJson("services-result", service);
    } catch (error) {
        showResult("services-result", error.message, true);
    }
}

async function addServiceToBooking(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const link = await apiRequest("/Services/booking-link", {
            method: "POST",
            body: JSON.stringify({
                bookingId: Number(document.getElementById("booking-service-booking-id")?.value),
                serviceId: Number(document.getElementById("booking-service-service-id")?.value),
                quantity: Number(document.getElementById("booking-service-quantity")?.value)
            })
        });
        showJson("services-result", link);
    } catch (error) {
        showResult("services-result", error.message, true);
    }
}

async function loadMyBookings(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const userId = document.getElementById("my-user-id")?.value || state.currentUser.userId;
        const bookings = await apiRequest(`/Bookings/by-user/${userId}`);
        showJson("my-bookings-result", bookings);
    } catch (error) {
        showResult("my-bookings-result", error.message, true);
    }
}

async function cancelBooking(event) {
    event.preventDefault();
    if (!state.currentUser) return;
    try {
        const bookingId = document.getElementById("cancel-booking-id")?.value;
        const result = await apiRequest(`/Bookings/${bookingId}/cancel`, { method: "PATCH" });
        if (typeof result === "string") {
            showResult("my-bookings-result", result);
        } else {
            showJson("my-bookings-result", result);
        }
    } catch (error) {
        showResult("my-bookings-result", error.message, true);
    }
}
