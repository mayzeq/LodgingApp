const API = "/api";
const state = { currentUser: null, selectedRoomId: null, selectedBookingId: null, services: [] };

document.addEventListener("DOMContentLoaded", () => {
    const raw = localStorage.getItem("hotelCurrentUser");
    if (!raw) {
        location.replace("/login.html");
        return;
    }

    state.currentUser = JSON.parse(raw);
    const role = String(state.currentUser.role || "guest").toLowerCase();
    const isAdmin = role === "admin";
    document.getElementById("session-status").textContent = isAdmin
        ? `${state.currentUser.login} (ID: ${state.currentUser.userId}) • ${role}`
        : `${state.currentUser.login} • ${role}`;
    document.getElementById("guest-user-id").value = state.currentUser.userId;
    document.getElementById("my-user-id").value = state.currentUser.userId;

    applyRoleUi(role);
    bindMenu(role);
    bindForms();
    loadRooms();
    loadMyBookingsInto("my-bookings-cards-inline", "my-bookings-inline-message", true);
    preloadGuestProfile();
    loadServicesIntoSelect();
});

function applyRoleUi(role) {
    document.querySelectorAll(".menu-item").forEach((btn) => {
        const rolesAttr = btn.getAttribute("data-roles") || "";
        const roles = rolesAttr.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
        const allowed = roles.length === 0 || roles.includes(role);
        btn.style.display = allowed ? "" : "none";
    });

    const active = document.querySelector(".menu-item.active");
    if (active && active.style.display === "none") {
        active.classList.remove("active");
    }
    const firstVisible = Array.from(document.querySelectorAll(".menu-item")).find((b) => b.style.display !== "none");
    if (firstVisible && !document.querySelector(".menu-item.active")) {
        firstVisible.classList.add("active");
        document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
        document.getElementById(`${firstVisible.dataset.view}-view`)?.classList.add("active");
    }

    // Hide internal IDs from guests (keep for admin)
    const isAdmin = role === "admin";
    document.querySelectorAll(".hidden-field").forEach((el) => {
        el.style.display = isAdmin ? "block" : "none";
    });
}

function bindMenu(role) {
    document.querySelectorAll(".menu-item").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.style.display === "none") return;
            document.querySelectorAll(".menu-item").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`${btn.dataset.view}-view`)?.classList.add("active");
            if (btn.dataset.view === "profile") {
                loadMyBookingsInto("my-bookings-cards", "my-bookings-result", false);
            }
        });
    });
}

function bindForms() {
    document.getElementById("logout-btn")?.addEventListener("click", () => {
        localStorage.removeItem("hotelCurrentUser");
        location.replace("/login.html");
    });
    document.getElementById("refresh-rooms-btn")?.addEventListener("click", loadRooms);
    document.getElementById("rooms-search")?.addEventListener("input", () => renderRooms());
    document.getElementById("rooms-status-filter")?.addEventListener("change", () => renderRooms());
    document.getElementById("rooms-checkin")?.addEventListener("change", () => syncDatesAndReloadRooms());
    document.getElementById("rooms-checkout")?.addEventListener("change", () => syncDatesAndReloadRooms());
    document.getElementById("booking-start-date")?.addEventListener("change", () => syncDatesAndReloadRooms(true));
    document.getElementById("booking-end-date")?.addEventListener("change", () => syncDatesAndReloadRooms(true));
    document.getElementById("guest-form")?.addEventListener("submit", createGuest);
    document.getElementById("booking-form")?.addEventListener("submit", createBooking);
    document.getElementById("payment-form")?.addEventListener("submit", createPayment);
    document.getElementById("confirm-payment-form")?.addEventListener("submit", confirmPayment);
    document.getElementById("service-form")?.addEventListener("submit", createService);
    document.getElementById("booking-service-form")?.addEventListener("submit", addServiceToBooking);
    document.getElementById("my-bookings-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        loadMyBookingsInto("my-bookings-cards", "my-bookings-result", false);
    });
    document.getElementById("refresh-my-bookings-btn")?.addEventListener("click", () => {
        loadMyBookingsInto("my-bookings-cards-inline", "my-bookings-inline-message", true);
    });
    document.getElementById("cancel-booking-form")?.addEventListener("submit", cancelBooking);

    document.getElementById("refresh-services-btn")?.addEventListener("click", loadServicesIntoSelect);
    document.getElementById("add-service-btn")?.addEventListener("click", addServiceToSelectedBooking);
    document.getElementById("pay-now-btn")?.addEventListener("click", paySelectedBooking);

    document.getElementById("refresh-payments-btn")?.addEventListener("click", loadAdminPayments);

    document.getElementById("service-admin-update-btn")?.addEventListener("click", updateServiceAdmin);
    document.getElementById("service-admin-delete-btn")?.addEventListener("click", deleteServiceAdmin);
}

function show(containerId, content, isError = false) {
    const node = document.getElementById(containerId);
    if (!node) return;
    node.innerHTML = isError ? `<p class="error">${escapeHtml(content)}</p>` : content;
}

function showJson(containerId, data) {
    show(containerId, `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`);
}

function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDateOnly(value) {
    if (!value) return "-";
    return String(value);
}

function formatMoney(value) {
    if (value === null || value === undefined) return "-";
    try {
        return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(Number(value));
    } catch {
        return String(value);
    }
}

function badgeForStatus(statusRaw) {
    const status = String(statusRaw || "").toLowerCase();
    const map = {
        available: { cls: "ok", text: "Доступен" },
        booked: { cls: "bad", text: "Занят" },
        confirmed: { cls: "ok", text: "Подтверждено" },
        cancelled: { cls: "bad", text: "Отменено" },
        pending: { cls: "warn", text: "Ожидает" },
        created: { cls: "warn", text: "Создано" },
        paid: { cls: "ok", text: "Оплачено" }
    };
    return map[status] || { cls: "", text: status ? status : "—" };
}

function roomImage(room) {
    const url = room?.photoUrl || room?.PhotoUrl;
    return url && String(url).trim().length > 0 ? url : "/images/room-default.svg";
}

function updateBookingRoomCard(room) {
    const img = document.getElementById("booking-room-image");
    const title = document.getElementById("booking-room-title");
    const sub = document.getElementById("booking-room-sub");
    if (!img || !title || !sub) return;

    if (!room) {
        img.src = "/images/room-default.svg";
        title.textContent = "Номер не выбран";
        sub.textContent = "Нажмите на строку в “Номера”, чтобы выбрать";
        return;
    }
    img.src = roomImage(room);
    const typeName = room.roomType?.typeName || "-";
    const price = room.roomType?.pricePerNight ?? null;
    title.textContent = `Номер ${room.roomNumber} • ${typeName}`;
    const isAvailable = room.isAvailable === undefined ? (String(room.status || "").toLowerCase() === "available") : Boolean(room.isAvailable);
    sub.textContent = `Этаж: ${room.floor} • Цена: ${price === null ? "-" : formatMoney(price)} • На выбранные даты: ${isAvailable ? "доступен" : "занят"}`;
}

async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
        headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${API}${path}`, { ...options, headers });
    if (!response.ok) {
        throw new Error((await response.text()) || `Ошибка ${response.status}`);
    }
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : response.text();
}

let roomsCache = [];

async function loadRooms() {
    try {
        const start = document.getElementById("rooms-checkin")?.value;
        const end = document.getElementById("rooms-checkout")?.value;
        const qs = start && end ? `?checkInDate=${encodeURIComponent(start)}&checkOutDate=${encodeURIComponent(end)}` : "";
        roomsCache = await apiRequest(`/Rooms${qs}`);
        renderRooms();
    } catch (error) {
        show("rooms-selected", error.message, true);
    }
}

function syncDatesAndReloadRooms(fromBooking = false) {
    const roomsIn = document.getElementById("rooms-checkin");
    const roomsOut = document.getElementById("rooms-checkout");
    const bookIn = document.getElementById("booking-start-date");
    const bookOut = document.getElementById("booking-end-date");
    if (!roomsIn || !roomsOut || !bookIn || !bookOut) return;

    if (fromBooking) {
        roomsIn.value = bookIn.value || roomsIn.value;
        roomsOut.value = bookOut.value || roomsOut.value;
    } else {
        bookIn.value = roomsIn.value || bookIn.value;
        bookOut.value = roomsOut.value || bookOut.value;
    }
    loadRooms();
}

function renderRooms() {
    const grid = document.getElementById("rooms-grid");
    if (!grid) return;
    const search = String(document.getElementById("rooms-search")?.value || "").trim().toLowerCase();
    const statusFilter = String(document.getElementById("rooms-status-filter")?.value || "").trim().toLowerCase();

    const list = (Array.isArray(roomsCache) ? roomsCache : []).filter((r) => {
        const available = r.isAvailable === undefined ? (String(r.status || "").toLowerCase() === "available") : Boolean(r.isAvailable);
        if (statusFilter === "available" && !available) return false;
        if (statusFilter === "busy" && available) return false;
        if (!search) return true;
        const hay = `${r.roomNumber || ""} ${r.roomType?.typeName || ""} ${r.roomType?.description || ""} ${r.floor || ""}`.toLowerCase();
        return hay.includes(search);
    });

    const count = document.getElementById("rooms-count");
    if (count) count.textContent = `Найдено: ${list.length}`;

    grid.innerHTML = "";
    list.forEach((r) => {
        const tile = document.createElement("div");
        const isAvailable = r.isAvailable === undefined ? (String(r.status || "").toLowerCase() === "available") : Boolean(r.isAvailable);
        const badge = isAvailable ? { cls: "ok", text: "Доступен" } : { cls: "bad", text: "Занят" };
        tile.className = `room-tile ${!isAvailable ? "disabled" : ""} ${state.selectedRoomId === r.roomId ? "selected" : ""}`;
        const price = r.roomType?.pricePerNight ?? null;
        tile.innerHTML = `
            <img class="photo" src="${escapeHtml(roomImage(r))}" alt="Фото номера">
            <div class="body">
                <div class="title">
                    <span>Номер ${escapeHtml(r.roomNumber)}</span>
                    <span class="badge ${badge.cls}">${escapeHtml(badge.text)}</span>
                </div>
                <div class="meta">
                    <div>${escapeHtml(r.roomType?.typeName || "—")} • Этаж ${escapeHtml(r.floor)}</div>
                    <div class="price">${price === null ? "—" : escapeHtml(formatMoney(price))} / ночь</div>
                </div>
                <div class="footer">
                    <span class="muted">${isAvailable ? "Нажмите, чтобы выбрать" : "Недоступно для брони"}</span>
                </div>
            </div>
        `;
        tile.addEventListener("click", () => {
            if (!isAvailable) return;
            state.selectedRoomId = r.roomId;
            document.getElementById("booking-room-id").value = r.roomId;
            updateBookingRoomCard(r);
            show("rooms-selected", `Выбран номер ${escapeHtml(r.roomNumber)}.`);
            renderRooms();
        });
        grid.appendChild(tile);
    });
}

async function createGuest(event) {
    event.preventDefault();
    try {
        const payload = {
            userId: Number(document.getElementById("guest-user-id").value),
            surname: document.getElementById("guest-surname").value.trim(),
            firstName: document.getElementById("guest-first-name").value.trim(),
            patronymic: document.getElementById("guest-patronymic").value.trim() || null,
            birthdate: document.getElementById("guest-birthdate").value,
            passport: document.getElementById("guest-passport").value.trim()
        };
        const guest = await apiRequest("/Guests", { method: "POST", body: JSON.stringify(payload) });
        document.getElementById("booking-guest-id").value = guest.guestId;
        localStorage.setItem("hotelGuestId", String(guest.guestId));
        show("guest-result", `<div class="muted">Профиль сохранён. Теперь можно бронировать номера.</div>`);
    } catch (error) {
        show("guest-result", error.message, true);
    }
}

async function preloadGuestProfile() {
    // Persist profile between sessions by loading from DB (Guests/by-user/{userId})
    try {
        const list = await apiRequest(`/Guests/by-user/${state.currentUser.userId}`);
        const guest = Array.isArray(list) && list.length > 0 ? list[0] : null;
        if (!guest) return;

        document.getElementById("guest-surname").value = guest.surname || "";
        document.getElementById("guest-first-name").value = guest.firstName || "";
        document.getElementById("guest-patronymic").value = guest.patronymic || "";
        document.getElementById("guest-birthdate").value = guest.birthdate || "";
        document.getElementById("guest-passport").value = guest.passport || "";

        document.getElementById("booking-guest-id").value = guest.guestId;
        localStorage.setItem("hotelGuestId", String(guest.guestId));
    } catch {
        // ignore: profile is optional until user saves it
    }
}

async function loadServicesIntoSelect() {
    try {
        state.services = await apiRequest("/Services");
        const select = document.getElementById("service-select");
        if (!select) return;
        select.innerHTML = "";
        (Array.isArray(state.services) ? state.services : []).forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.serviceId;
            opt.textContent = `${s.serviceName} • ${formatMoney(s.price)}`;
            select.appendChild(opt);
        });
    } catch (e) {
        show("service-add-result", e.message || String(e), true);
    }
}

async function addServiceToSelectedBooking() {
    try {
        if (!state.selectedBookingId) throw new Error("Сначала выберите бронь в списке справа.");
        const serviceId = Number(document.getElementById("service-select")?.value);
        const qty = Number(document.getElementById("service-qty")?.value || 1);
        if (!serviceId) throw new Error("Выберите услугу.");
        if (!qty || qty < 1) throw new Error("Количество должно быть >= 1.");

        await apiRequest("/Services/booking-link", {
            method: "POST",
            body: JSON.stringify({ bookingId: state.selectedBookingId, serviceId, quantity: qty })
        });

        show("service-add-result", "Услуга добавлена к брони.");
        await loadMyBookingsInto("my-bookings-cards-inline", "my-bookings-inline-message", true);
        await loadMyBookingsInto("my-bookings-cards", "my-bookings-result", false);
    } catch (e) {
        show("service-add-result", e.message || String(e), true);
    }
}

async function paySelectedBooking() {
    try {
        if (!state.selectedBookingId) throw new Error("Сначала выберите бронь в списке справа.");

        // simple client-side validation (demo)
        const card = String(document.getElementById("pay-card")?.value || "").replace(/\s+/g, "");
        const exp = String(document.getElementById("pay-exp")?.value || "");
        const cvc = String(document.getElementById("pay-cvc")?.value || "");
        if (card.length < 12) throw new Error("Введите номер карты.");
        if (exp.length < 4) throw new Error("Введите срок действия.");
        if (cvc.length < 3) throw new Error("Введите CVC.");

        const booking = await apiRequest(`/Bookings/${state.selectedBookingId}`);
        const orderId = booking?.orderId;
        const alreadyPaid = String(booking?.order?.status || "").toLowerCase() === "paid";
        if (alreadyPaid) {
            show("pay-result", "Уже оплачено.");
            return;
        }
        if (!orderId) throw new Error("Не найден заказ для брони.");

        const amount = Number(booking?.order?.totalAmount ?? booking?.totalPrice ?? 0);
        if (!amount || amount <= 0) throw new Error("Некорректная сумма для оплаты.");

        const payment = await apiRequest("/Payments", {
            method: "POST",
            body: JSON.stringify({ orderId, amount, paymentMethod: "card" })
        });

        await apiRequest(`/Payments/${payment.paymentId}/confirm`, { method: "PATCH" });
        show("pay-result", `Оплачено: ${formatMoney(amount)}.`);
        await loadMyBookingsInto("my-bookings-cards-inline", "my-bookings-inline-message", true);
        await loadMyBookingsInto("my-bookings-cards", "my-bookings-result", false);
    } catch (e) {
        show("pay-result", e.message || String(e), true);
    }
}

async function loadAdminPayments() {
    try {
        const cards = document.getElementById("payments-admin");
        if (!cards) return;
        const payments = await apiRequest("/Payments");
        cards.innerHTML = "";
        (Array.isArray(payments) ? payments : []).slice(0, 50).forEach((p) => {
            const badge = badgeForStatus(p.status);
            const el = document.createElement("div");
            el.className = "card";
            el.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">Платеж</div>
                        <div class="card-sub">Заказ #${escapeHtml(p.orderId)} • ${escapeHtml(formatMoney(p.amount))}</div>
                    </div>
                    <span class="badge ${badge.cls}">${escapeHtml(badge.text)}</span>
                </div>
                <div class="card-grid">
                    <div class="kv"><div class="k">Метод</div><div class="v">${escapeHtml(p.paymentMethod || "—")}</div></div>
                    <div class="kv"><div class="k">Транзакция</div><div class="v">${escapeHtml((p.transactionId || "").slice(0, 10))}…</div></div>
                    <div class="kv"><div class="k">Пользователь</div><div class="v">${escapeHtml(p.order?.user?.login || "—")}</div></div>
                </div>
            `;
            cards.appendChild(el);
        });
    } catch (e) {
        show("payment-result", e.message || String(e), true);
    }
}

async function updateServiceAdmin() {
    try {
        const id = Number(document.getElementById("service-admin-id")?.value);
        if (!id) throw new Error("Укажите ID услуги.");
        const payload = {
            serviceName: document.getElementById("service-admin-name").value.trim(),
            description: document.getElementById("service-admin-description").value.trim() || null,
            price: Number(document.getElementById("service-admin-price").value),
            isIncluded: document.getElementById("service-admin-included").checked
        };
        const res = await apiRequest(`/Services/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        show("services-result", `<div class="muted">Услуга обновлена.</div>`);
        await loadServicesIntoSelect();
        showJson("services-result", res);
    } catch (e) {
        show("services-result", e.message || String(e), true);
    }
}

async function deleteServiceAdmin() {
    try {
        const id = Number(document.getElementById("service-admin-id")?.value);
        if (!id) throw new Error("Укажите ID услуги.");
        const res = await apiRequest(`/Services/${id}`, { method: "DELETE" });
        show("services-result", typeof res === "string" ? res : JSON.stringify(res));
        await loadServicesIntoSelect();
    } catch (e) {
        show("services-result", e.message || String(e), true);
    }
}

async function createBooking(event) {
    event.preventDefault();
    try {
        // if user already has guestId from previous sessions
        const storedGuestId = localStorage.getItem("hotelGuestId");
        if (storedGuestId && !document.getElementById("booking-guest-id").value) {
            document.getElementById("booking-guest-id").value = storedGuestId;
        }
        const payload = {
            guestId: Number(document.getElementById("booking-guest-id").value),
            roomId: Number(document.getElementById("booking-room-id").value),
            checkInDate: document.getElementById("booking-start-date").value,
            checkOutDate: document.getElementById("booking-end-date").value
        };
        if (!payload.guestId) throw new Error("Сначала заполните “Профиль” (профиль гостя).");
        if (!payload.roomId) throw new Error("Выберите номер в разделе “Номера”.");
        const booking = await apiRequest("/Bookings", { method: "POST", body: JSON.stringify(payload) });
        document.getElementById("payment-order-id").value = booking.orderId || "";
        const badge = badgeForStatus(booking.status);
        show(
            "booking-result",
            `<div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">Бронь создана</div>
                        <div class="card-sub">Заезд: ${escapeHtml(formatDateOnly(booking.checkInDate))} — Выезд: ${escapeHtml(formatDateOnly(booking.checkOutDate))}</div>
                    </div>
                    <span class="badge ${badge.cls}">${escapeHtml(badge.text)}</span>
                </div>
                <div class="card-grid">
                    <div class="kv"><div class="k">Итого</div><div class="v">${escapeHtml(formatMoney(booking.totalPrice))}</div></div>
                    <div class="kv"><div class="k">Номер</div><div class="v">${escapeHtml(booking.roomId)}</div></div>
                    <div class="kv"><div class="k">Статус</div><div class="v">${escapeHtml(booking.status)}</div></div>
                </div>
            </div>`
        );
        await loadMyBookingsInto("my-bookings-cards-inline", "my-bookings-inline-message", true);
        await loadRooms();
    } catch (error) {
        show("booking-result", error.message, true);
    }
}

async function createPayment(event) {
    event.preventDefault();
    try {
        const payload = {
            orderId: Number(document.getElementById("payment-order-id").value),
            amount: Number(document.getElementById("payment-amount").value),
            paymentMethod: document.getElementById("payment-method").value.trim() || "card"
        };
        const payment = await apiRequest("/Payments", { method: "POST", body: JSON.stringify(payload) });
        document.getElementById("confirm-payment-id").value = payment.paymentId || "";
        showJson("payment-result", payment);
    } catch (error) {
        show("payment-result", error.message, true);
    }
}

async function confirmPayment(event) {
    event.preventDefault();
    try {
        const paymentId = document.getElementById("confirm-payment-id").value;
        const result = await apiRequest(`/Payments/${paymentId}/confirm`, { method: "PATCH" });
        show("payment-result", typeof result === "string" ? result : JSON.stringify(result));
    } catch (error) {
        show("payment-result", error.message, true);
    }
}

async function createService(event) {
    event.preventDefault();
    try {
        const payload = {
            serviceName: document.getElementById("service-name").value.trim(),
            description: document.getElementById("service-description").value.trim() || null,
            price: Number(document.getElementById("service-price").value),
            isIncluded: document.getElementById("service-included").checked
        };
        const service = await apiRequest("/Services", { method: "POST", body: JSON.stringify(payload) });
        showJson("services-result", service);
    } catch (error) {
        show("services-result", error.message, true);
    }
}

async function addServiceToBooking(event) {
    event.preventDefault();
    try {
        const payload = {
            bookingId: Number(document.getElementById("booking-service-booking-id").value),
            serviceId: Number(document.getElementById("booking-service-service-id").value),
            quantity: Number(document.getElementById("booking-service-quantity").value)
        };
        const link = await apiRequest("/Services/booking-link", { method: "POST", body: JSON.stringify(payload) });
        showJson("services-result", link);
    } catch (error) {
        show("services-result", error.message, true);
    }
}

async function loadMyBookings(event) {
    event.preventDefault();
    try {
        await loadMyBookingsInto("my-bookings-cards", "my-bookings-result", false);
    } catch (error) {
        show("my-bookings-result", error.message, true);
    }
}

async function cancelBooking(event) {
    event.preventDefault();
    try {
        const bookingId = document.getElementById("cancel-booking-id").value;
        const result = await apiRequest(`/Bookings/${bookingId}/cancel`, { method: "PATCH" });
        show("my-bookings-result", typeof result === "string" ? result : JSON.stringify(result));
        await loadMyBookingsInto("my-bookings-cards", "my-bookings-result", false);
        await loadMyBookingsInto("my-bookings-cards-inline", "my-bookings-inline-message", true);
        await loadRooms();
    } catch (error) {
        show("my-bookings-result", error.message, true);
    }
}

async function loadMyBookingsInto(cardsContainerId, messageContainerId, compact) {
    const userId = document.getElementById("my-user-id")?.value || state.currentUser.userId;
    const cards = document.getElementById(cardsContainerId);
    if (!cards) return;
    cards.innerHTML = "";
    try {
        const bookings = await apiRequest(`/Bookings/by-user/${userId}`);
        const list = Array.isArray(bookings) ? bookings : [];
        if (list.length === 0) {
            cards.innerHTML = `<div class="muted">Пока нет бронирований.</div>`;
            show(messageContainerId, "");
            return;
        }
        const limited = compact ? list.slice(0, 5) : list;
        limited.forEach((b) => {
            const room = b.room || null;
            const typeName = room?.roomType?.typeName || "-";
            const badge = badgeForStatus(b.status);
            const el = document.createElement("div");
            el.className = "card";
            const orderStatus = b.order?.status ? String(b.order.status) : "";
            const orderBadge = orderStatus ? badgeForStatus(orderStatus) : null;
            el.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">Бронирование</div>
                        <div class="card-sub">${escapeHtml(formatDateOnly(b.checkInDate))} — ${escapeHtml(formatDateOnly(b.checkOutDate))}</div>
                    </div>
                    <span class="badge ${badge.cls}">${escapeHtml(badge.text)}</span>
                </div>
                <div class="room-card">
                    <img class="room-photo" src="${escapeHtml(roomImage(room))}" alt="Фото номера">
                    <div class="room-meta">
                        <div class="room-title">${room ? `Номер ${escapeHtml(room.roomNumber)} • ${escapeHtml(typeName)}` : `Номер #${escapeHtml(b.roomId)}`}</div>
                        <div class="room-sub">Итого: ${escapeHtml(formatMoney(b.totalPrice))}${orderBadge ? ` • Оплата: <span class="badge ${orderBadge.cls}">${escapeHtml(orderBadge.text)}</span>` : ""}</div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary" type="button" data-action="select">Выбрать</button>
                    ${String(b.status || "").toLowerCase() === "cancelled" ? "" : `<button class="btn btn-danger" type="button" data-action="cancel">Отменить</button>`}
                </div>
            `;
            el.querySelector('[data-action="select"]')?.addEventListener("click", () => {
                state.selectedBookingId = b.bookingId;
                show(messageContainerId, `<div class="muted">Выбрана бронь #${escapeHtml(b.bookingId)}. Теперь можно добавить услугу или оплатить.</div>`);
            });
            el.querySelector('[data-action="cancel"]')?.addEventListener("click", async () => {
                try {
                    await apiRequest(`/Bookings/${b.bookingId}/cancel`, { method: "PATCH" });
                    await loadMyBookingsInto(cardsContainerId, messageContainerId, compact);
                } catch (e) {
                    show(messageContainerId, e.message || String(e), true);
                }
            });
            cards.appendChild(el);
        });
        show(messageContainerId, compact ? `<div class="muted">Показаны последние ${Math.min(5, list.length)} брони.</div>` : "");
    } catch (error) {
        show(messageContainerId, error.message, true);
    }
}
