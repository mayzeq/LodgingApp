const API = "/api";
const state = {
    currentUser: null,
    role: "guest",
    rooms: [],
    roomTypes: [],
    services: [],
    guests: [],
    /** Только админ: полный список при отсутствии фильтра по userId (для таблицы, не для брони). */
    adminGuestsRaw: [],
    users: [],
    bookingClientUserId: null,
    selectedRoomId: null,
    selectedBookingId: null,
    selectedBooking: null
};

document.addEventListener("DOMContentLoaded", async () => {
    const raw = localStorage.getItem("hotelCurrentUser");
    if (!raw) {
        location.replace("/login.html");
        return;
    }

    state.currentUser = JSON.parse(raw);
    state.role = String(state.currentUser.role || "guest").toLowerCase();
    const login = state.currentUser.login || "Пользователь";
    document.getElementById("session-status").textContent = isAdmin() ? `${login} • администратор` : login;
    syncGuestOwnerHidden();

    applyRoleUi();
    bindMenu();
    bindForms();
    initBookingDatesIfEmpty();

    await Promise.all([
        loadRoomTypes(),
        loadServices(),
        loadGuests(),
        loadRooms()
    ]);

    if (isAdmin()) {
        await Promise.all([loadAdminPayments(), loadUsers(), ensureUsersLoaded()]);
        await initAdminBookingClient();
        renderGuestOwnerSelects();
        renderBookingsFilterSelects();
    } else {
        await loadBookingsView();
    }

    renderSelectedBookingDetails();
});

function isAdmin() {
    return state.role === "admin";
}

function applyRoleUi() {
    document.querySelectorAll(".menu-item").forEach((btn) => {
        const roles = String(btn.dataset.roles || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
        btn.style.display = roles.includes(state.role) ? "" : "none";
    });

    document.querySelectorAll(".admin-only").forEach((el) => {
        el.style.display = isAdmin() ? "" : "none";
    });

    document.querySelectorAll(".guest-only").forEach((el) => {
        el.style.display = isAdmin() ? "none" : "";
    });

    const bookingsTitle = document.getElementById("bookings-view-title");
    if (bookingsTitle) {
        bookingsTitle.textContent = isAdmin() ? "Все бронирования" : "Мои брони";
    }
}

function bindMenu() {
    document.querySelectorAll(".menu-item").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (btn.style.display === "none") return;
            document.querySelectorAll(".menu-item").forEach((node) => node.classList.remove("active"));
            document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`${btn.dataset.view}-view`)?.classList.add("active");

            if (btn.dataset.view === "bookings") {
                if (isAdmin()) {
                    await ensureUsersLoaded();
                    renderBookingsFilterSelects();
                }
                await loadBookingsView();
            }
            if (btn.dataset.view === "guests" && isAdmin()) {
                await ensureUsersLoaded();
                renderGuestOwnerSelects();
            }
            if (btn.dataset.view === "payments" && isAdmin()) {
                await loadAdminPayments();
            }
            if (btn.dataset.view === "services" && isAdmin()) {
                await loadServices();
            }
            if (btn.dataset.view === "users" && isAdmin()) {
                await loadUsers();
            }
            if (btn.dataset.view === "booking" && isAdmin()) {
                await ensureUsersLoaded();
                renderBookingClientSelect();
            }
            if (btn.dataset.view === "account" && !isAdmin()) {
                await loadAccountProfile();
            }
            if (btn.dataset.view === "room-admin" && isAdmin()) {
                await Promise.all([loadRoomTypes(), loadRooms()]);
            }
        });
    });
}

async function loadAccountProfile() {
    try {
        const user = await apiRequest(`/Users/${state.currentUser.userId}`);
        document.getElementById("account-login").value = user.login || state.currentUser.login || "";
        document.getElementById("account-email").value = user.email || "";
        document.getElementById("account-phone").value = user.phone || "";
        document.getElementById("account-current-password").value = "";
        document.getElementById("account-new-password").value = "";
        show("account-result", "");
    } catch (error) {
        show("account-result", error.message, true);
    }
}

async function saveAccount(event) {
    event.preventDefault();
    try {
        const payload = {
            email: document.getElementById("account-email").value.trim(),
            phone: document.getElementById("account-phone").value.trim() || null
        };
        const newPass = document.getElementById("account-new-password").value;
        const currentPass = document.getElementById("account-current-password").value;
        if (newPass) {
            if (!currentPass) throw new Error("Укажите текущий пароль для смены пароля.");
            payload.currentPassword = currentPass;
            payload.newPassword = newPass;
        }
        const updated = await apiRequest(`/Users/${state.currentUser.userId}/account`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        state.currentUser = { ...state.currentUser, email: updated.email, phone: updated.phone };
        localStorage.setItem("hotelCurrentUser", JSON.stringify(state.currentUser));
        document.getElementById("account-current-password").value = "";
        document.getElementById("account-new-password").value = "";
        show("account-result", `<div class="muted">Данные аккаунта сохранены.</div>`);
    } catch (error) {
        show("account-result", error.message, true);
    }
}

function bindForms() {
    document.getElementById("logout-btn")?.addEventListener("click", () => {
        localStorage.removeItem("hotelCurrentUser");
        location.replace("/login.html");
    });

    document.getElementById("refresh-rooms-btn")?.addEventListener("click", loadRooms);
    document.getElementById("rooms-search")?.addEventListener("input", renderRooms);
    document.getElementById("rooms-status-filter")?.addEventListener("change", renderRooms);
    document.getElementById("rooms-checkin")?.addEventListener("change", () => syncDatesAndReloadRooms());
    document.getElementById("rooms-checkout")?.addEventListener("change", () => syncDatesAndReloadRooms());
    document.getElementById("booking-start-date")?.addEventListener("change", () => syncDatesAndReloadRooms(true));
    document.getElementById("booking-end-date")?.addEventListener("change", () => syncDatesAndReloadRooms(true));

    document.getElementById("guest-form")?.addEventListener("submit", saveGuest);
    document.getElementById("guest-form-reset-btn")?.addEventListener("click", resetGuestForm);
    document.getElementById("refresh-guests-btn")?.addEventListener("click", loadGuests);
    document.getElementById("booking-extra-guest-form")?.addEventListener("submit", createInlineGuest);

    document.getElementById("booking-form")?.addEventListener("submit", createBooking);
    document.getElementById("refresh-bookings-btn")?.addEventListener("click", loadBookingsView);
    document.getElementById("refresh-services-btn")?.addEventListener("click", loadServices);
    document.getElementById("add-service-btn")?.addEventListener("click", addServiceToSelectedBooking);
    document.getElementById("pay-now-btn")?.addEventListener("click", paySelectedBooking);
    document.getElementById("open-pay-modal-btn")?.addEventListener("click", openPayModal);
    document.querySelectorAll("[data-pay-modal-close]").forEach((el) => {
        el.addEventListener("click", closePayModal);
    });

    document.getElementById("room-form")?.addEventListener("submit", saveRoom);
    document.getElementById("room-form-reset-btn")?.addEventListener("click", resetRoomForm);
    document.getElementById("room-form-delete-btn")?.addEventListener("click", deleteRoomFromForm);

    document.getElementById("room-type-form")?.addEventListener("submit", saveRoomType);
    document.getElementById("room-type-form-reset-btn")?.addEventListener("click", resetRoomTypeForm);
    document.getElementById("room-type-form-delete-btn")?.addEventListener("click", deleteRoomTypeFromForm);

    let guestsFilterTimer;
    document.getElementById("guests-filter-apply")?.addEventListener("click", loadGuests);
    document.getElementById("guests-filter-clear")?.addEventListener("click", () => {
        ["guests-filter-owner-select", "guests-filter-owner-id-manual", "guests-filter-guest-select", "guests-filter-guest-id-manual"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        loadGuests();
    });

    document.getElementById("guests-filter-owner-select")?.addEventListener("change", (e) => {
        syncGuestFilterFromOwnerSelect();
        syncOwnerFormFromFilter();
        if (e.target.value) loadGuests();
    });
    document.getElementById("guests-filter-owner-id-manual")?.addEventListener("input", () => {
        clearTimeout(guestsFilterTimer);
        guestsFilterTimer = setTimeout(() => loadGuests(), 450);
    });
    document.getElementById("guests-filter-guest-select")?.addEventListener("change", (e) => {
        const manual = document.getElementById("guests-filter-guest-id-manual");
        if (manual && e.target.value) manual.value = e.target.value;
        if (e.target.value) loadGuests();
    });
    document.getElementById("guests-filter-guest-id-manual")?.addEventListener("input", () => {
        clearTimeout(guestsFilterTimer);
        guestsFilterTimer = setTimeout(() => loadGuests(), 450);
    });

    document.getElementById("guests-owner-user-id")?.addEventListener("change", (e) => {
        const manual = document.getElementById("guests-owner-user-id-manual");
        if (manual && e.target.value) manual.value = e.target.value;
        syncGuestOwnerHidden();
    });
    document.getElementById("guests-owner-user-id-manual")?.addEventListener("input", (e) => {
        const sel = document.getElementById("guests-owner-user-id");
        if (sel && e.target.value) sel.value = e.target.value;
        syncGuestOwnerHidden();
    });

    document.getElementById("account-form")?.addEventListener("submit", saveAccount);
    document.getElementById("refresh-room-admin-btn")?.addEventListener("click", async () => {
        await Promise.all([loadRoomTypes(), loadRooms()]);
    });

    document.getElementById("refresh-payments-btn")?.addEventListener("click", loadAdminPayments);

    document.getElementById("booking-client-user-id")?.addEventListener("change", async (e) => {
        const manual = document.getElementById("booking-client-user-id-manual");
        if (manual && e.target.value) manual.value = e.target.value;
        const uid = Number(e.target.value);
        if (uid > 0) await loadBookingClientGuests(uid);
    });
    document.getElementById("booking-client-user-id-manual")?.addEventListener("change", async (e) => {
        const uid = Number(e.target.value);
        if (uid > 0) await loadBookingClientGuests(uid);
    });

    document.getElementById("user-admin-form")?.addEventListener("submit", saveUserAdmin);
    document.getElementById("user-admin-reset-btn")?.addEventListener("click", resetUserAdminForm);

    let paymentsFilterTimer;
    ["payments-status-filter", "payments-from-filter", "payments-to-filter"].forEach((id) => {
        document.getElementById(id)?.addEventListener("change", () => {
            if (!isAdmin()) return;
            clearTimeout(paymentsFilterTimer);
            paymentsFilterTimer = setTimeout(() => loadAdminPayments(), 320);
        });
    });

    let adminBookingsFilterTimer;
    ["bookings-status-filter", "bookings-from-filter", "bookings-to-filter", "bookings-room-select", "bookings-user-select"].forEach((id) => {
        document.getElementById(id)?.addEventListener("change", () => {
            if (!isAdmin()) return;
            clearTimeout(adminBookingsFilterTimer);
            adminBookingsFilterTimer = setTimeout(() => loadAdminBookings(), 320);
        });
    });
    ["bookings-room-id-manual", "bookings-user-id-manual", "bookings-id-manual"].forEach((id) => {
        document.getElementById(id)?.addEventListener("input", () => {
            if (!isAdmin()) return;
            clearTimeout(adminBookingsFilterTimer);
            adminBookingsFilterTimer = setTimeout(() => loadAdminBookings(), 450);
        });
    });
    document.getElementById("bookings-room-select")?.addEventListener("change", (e) => {
        const manual = document.getElementById("bookings-room-id-manual");
        if (manual && e.target.value) manual.value = e.target.value;
    });
    document.getElementById("bookings-user-select")?.addEventListener("change", (e) => {
        const manual = document.getElementById("bookings-user-id-manual");
        if (manual && e.target.value) manual.value = e.target.value;
    });

    document.getElementById("service-form")?.addEventListener("submit", saveService);
    document.getElementById("service-form-reset-btn")?.addEventListener("click", resetServiceForm);
    document.getElementById("service-form-delete-btn")?.addEventListener("click", deleteServiceFromForm);
    document.getElementById("refresh-services-admin-btn")?.addEventListener("click", loadServices);

    document.getElementById("refresh-users-btn")?.addEventListener("click", loadUsers);
}

function show(containerId, content, isError = false) {
    const node = document.getElementById(containerId);
    if (!node) return;
    node.innerHTML = isError ? `<p class="error">${escapeHtml(content)}</p>` : content;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatDateOnly(value) {
    return value ? String(value) : "—";
}

function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/** Локальная дата YYYY-MM-DD без сдвига часового пояса */
function formatLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function parseLocalDate(iso) {
    if (!iso) return null;
    const parts = String(iso).split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

/** Дата из API (DateOnly / ISO) → значение для input[type=date]. */
function toDateInputValue(value) {
    if (!value) return "";
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : formatLocalDate(d);
}

function addDaysToIso(iso, delta) {
    const d = parseLocalDate(iso);
    if (!d) return "";
    d.setDate(d.getDate() + delta);
    return formatLocalDate(d);
}

/** Выезд — первый день после последней ночи; минимум одна ночь => выезд строго позже заезда */
function enforceBookingDateRangeAfterSync() {
    const bookingIn = document.getElementById("booking-start-date");
    const bookingOut = document.getElementById("booking-end-date");
    const roomsIn = document.getElementById("rooms-checkin");
    const roomsOut = document.getElementById("rooms-checkout");
    if (!bookingIn || !bookingOut) return;

    const start = bookingIn.value;
    if (start) {
        const minOut = addDaysToIso(start, 1);
        bookingOut.min = minOut;
        if (!bookingOut.value || bookingOut.value <= start) {
            bookingOut.value = minOut;
        }
    }

    if (roomsIn && roomsOut) {
        roomsIn.value = bookingIn.value;
        roomsOut.min = bookingOut.min;
        roomsOut.value = bookingOut.value;
    }
}

function initBookingDatesIfEmpty() {
    const bookingIn = document.getElementById("booking-start-date");
    const bookingOut = document.getElementById("booking-end-date");
    const roomsIn = document.getElementById("rooms-checkin");
    const roomsOut = document.getElementById("rooms-checkout");
    if (!bookingIn || !bookingOut) return;

    const today = formatLocalDate(new Date());
    const tomorrow = addDaysToIso(today, 1);

    if (!bookingIn.value && !bookingOut.value) {
        bookingIn.value = today;
        bookingOut.value = tomorrow;
    } else if (bookingIn.value && (!bookingOut.value || bookingOut.value <= bookingIn.value)) {
        bookingOut.value = addDaysToIso(bookingIn.value, 1);
    }

    enforceBookingDateRangeAfterSync();

    if (roomsIn && roomsOut && !roomsIn.value && !roomsOut.value) {
        roomsIn.value = bookingIn.value;
        roomsOut.value = bookingOut.value;
    }
}

function formatMoney(value) {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(Number(value));
}

function normalizePassport(value) {
    return String(value || "").replace(/\s+/g, "");
}

function validatePassport(value) {
    const p = normalizePassport(value);
    if (!/^\d{10}$/.test(p)) {
        throw new Error("Паспорт РФ: 10 цифр (формат 1234 567890).");
    }
    return `${p.slice(0, 4)} ${p.slice(4)}`;
}

function validateBirthdate(value) {
    if (!value) throw new Error("Укажите дату рождения.");
    const d = parseLocalDate(value);
    if (!d) throw new Error("Некорректная дата рождения.");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d > today) throw new Error("Дата рождения не может быть в будущем.");
    const ageCutoff = new Date(today);
    ageCutoff.setFullYear(ageCutoff.getFullYear() - 14);
    if (d > ageCutoff) throw new Error("Гость должен быть не младше 14 лет.");
    return value;
}

function validateCardPayment(cardRaw, expRaw, cvcRaw) {
    const card = String(cardRaw || "").replace(/\s+/g, "");
    const exp = String(expRaw || "").trim();
    const cvc = String(cvcRaw || "").trim();
    if (!/^\d{13,19}$/.test(card)) throw new Error("Номер карты: от 13 до 19 цифр.");
    if (!/^\d{2}\/?\d{2}$/.test(exp)) throw new Error("Срок: формат MM/YY.");
    if (!/^\d{3,4}$/.test(cvc)) throw new Error("CVC: 3 или 4 цифры.");
    return { card, exp, cvc };
}

function getBookingClientUserId() {
    if (!isAdmin()) return state.currentUser.userId;
    const manual = document.getElementById("booking-client-user-id-manual")?.value?.trim();
    const id = Number(manual || document.getElementById("booking-client-user-id")?.value || state.bookingClientUserId || 0);
    if (!id) throw new Error("Выберите клиента (аккаунт) для бронирования.");
    return id;
}

async function ensureUsersLoaded() {
    if (state.users.length > 0) return state.users;
    state.users = await apiRequest("/Users");
    return state.users;
}

async function initAdminBookingClient() {
    await ensureUsersLoaded();
    renderBookingClientSelect();
    const sel = document.getElementById("booking-client-user-id");
    if (!sel) return;
    const guestUsers = state.users.filter((u) => String(u.role).toLowerCase() === "guest");
    const first = guestUsers[0] || state.users[0];
    if (first) {
        sel.value = String(first.userId);
        state.bookingClientUserId = first.userId;
        await loadBookingClientGuests(first.userId);
    }
}

function renderBookingClientSelect() {
    const sel = document.getElementById("booking-client-user-id");
    if (!sel) return;
    fillUserSelect(sel, { includeEmpty: false, guestsOnly: true });
}

function clientUsersForSelect() {
    const guestsOnly = state.users.filter((u) => String(u.role).toLowerCase() === "guest");
    return guestsOnly.length ? guestsOnly : state.users;
}

function fillUserSelect(selectEl, { includeEmpty = true, guestsOnly = true } = {}) {
    if (!selectEl) return;
    const prev = selectEl.value;
    selectEl.innerHTML = "";
    if (includeEmpty) {
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = guestsOnly ? "Все клиенты" : "—";
        selectEl.appendChild(empty);
    }
    const list = guestsOnly ? clientUsersForSelect() : state.users;
    list.forEach((user) => {
        const opt = document.createElement("option");
        opt.value = String(user.userId);
        const blocked = user.isActive === false ? " • заблокирован" : "";
        opt.textContent = `${user.login} (ID ${user.userId})${blocked}`;
        selectEl.appendChild(opt);
    });
    if (prev && [...selectEl.options].some((o) => o.value === prev)) {
        selectEl.value = prev;
    }
}

function userLoginById(userId) {
    const u = state.users.find((x) => x.userId === Number(userId));
    return u?.login || String(userId ?? "—");
}

function renderGuestOwnerSelects() {
    if (!isAdmin()) return;
    fillUserSelect(document.getElementById("guests-filter-owner-select"), { includeEmpty: true, guestsOnly: true });
    const ownerSel = document.getElementById("guests-owner-user-id");
    fillUserSelect(ownerSel, { includeEmpty: false, guestsOnly: true });
    if (ownerSel && !ownerSel.value && ownerSel.options.length) {
        ownerSel.value = ownerSel.options[0].value;
    }
    syncGuestOwnerHidden();
}

function syncGuestOwnerHidden() {
    const hidden = document.getElementById("guest-user-id");
    if (!hidden) return;
    if (isAdmin()) {
        const owner = document.getElementById("guests-owner-user-id");
        hidden.value = owner?.value || "";
    } else {
        hidden.value = state.currentUser.userId;
    }
}

function getAdminGuestOwnerUserId() {
    const manual = document.getElementById("guests-owner-user-id-manual")?.value?.trim();
    const uid = Number(manual || document.getElementById("guests-owner-user-id")?.value || 0);
    if (!uid) throw new Error("Выберите владельца (аккаунт клиента) для гостя.");
    return uid;
}

function renderBookingsFilterSelects() {
    if (!isAdmin()) return;
    const roomSel = document.getElementById("bookings-room-select");
    if (roomSel) {
        const prev = roomSel.value;
        roomSel.innerHTML = `<option value="">Все номера</option>`;
        state.rooms.forEach((room) => {
            const opt = document.createElement("option");
            opt.value = String(room.roomId);
            opt.textContent = `${room.roomNumber} (ID ${room.roomId})`;
            roomSel.appendChild(opt);
        });
        if (prev) roomSel.value = prev;
    }
    fillUserSelect(document.getElementById("bookings-user-select"), { includeEmpty: true, guestsOnly: true });
}

function resolveBookingsFilterRoomId() {
    return resolveFilterValue("bookings-room-id-manual", "bookings-room-select");
}

function resolveBookingsFilterUserId() {
    return resolveFilterValue("bookings-user-id-manual", "bookings-user-select");
}

function resolveFilterValue(manualId, selectId) {
    const manual = document.getElementById(manualId)?.value?.trim();
    if (manual) return manual;
    return document.getElementById(selectId)?.value?.trim() || "";
}

function resolveGuestsFilterOwnerId() {
    return resolveFilterValue("guests-filter-owner-id-manual", "guests-filter-owner-select");
}

function resolveGuestsFilterGuestId() {
    return resolveFilterValue("guests-filter-guest-id-manual", "guests-filter-guest-select");
}

function renderGuestsFilterGuestSelect(guestList) {
    const sel = document.getElementById("guests-filter-guest-select");
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="">Все в выборке</option>`;
    (guestList || []).forEach((g) => {
        const opt = document.createElement("option");
        opt.value = String(g.guestId);
        opt.textContent = `${fullGuestName(g)} (ID ${g.guestId})`;
        sel.appendChild(opt);
    });
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

function syncGuestFilterFromOwnerSelect() {
    const ownerSel = document.getElementById("guests-filter-owner-select");
    const manual = document.getElementById("guests-filter-owner-id-manual");
    if (manual && ownerSel?.value) manual.value = ownerSel.value;
}

function syncOwnerFormFromFilter() {
    const filterUid = resolveGuestsFilterOwnerId();
    const ownerSel = document.getElementById("guests-owner-user-id");
    const ownerManual = document.getElementById("guests-owner-user-id-manual");
    if (filterUid && ownerSel) ownerSel.value = filterUid;
    if (filterUid && ownerManual) ownerManual.value = filterUid;
    syncGuestOwnerHidden();
}

async function loadBookingsView() {
    if (isAdmin()) {
        await loadAdminBookings();
    } else {
        await loadMyBookingsInto("bookings-list", "bookings-list-result", false);
    }
}

async function loadBookingClientGuests(userId) {
    state.bookingClientUserId = userId;
    state.guests = await apiRequest(`/Guests/by-user/${userId}`);
    renderBookingGuestsSelection();
    const guestUserField = document.getElementById("guest-user-id");
    if (guestUserField) guestUserField.value = userId;
}

function badgeForStatus(statusRaw) {
    const status = String(statusRaw || "").toLowerCase();
    const map = {
        available: { cls: "ok", text: "Доступен" },
        booked: { cls: "bad", text: "Занят" },
        maintenance: { cls: "warn", text: "Обслуживание" },
        confirmed: { cls: "ok", text: "Подтверждено" },
        cancelled: { cls: "bad", text: "Отменено" },
        pending: { cls: "warn", text: "Ожидает" },
        created: { cls: "warn", text: "Создано" },
        paid: { cls: "ok", text: "Оплачено" }
    };
    return map[status] || { cls: "", text: status || "—" };
}

/** Статус учётной записи номера (available / booked / maintenance) — для таблиц админа. */
function roomOperationalStatusRu(statusRaw) {
    const status = String(statusRaw || "").toLowerCase();
    const map = {
        available: "Свободен",
        booked: "Занят",
        maintenance: "На обслуживании"
    };
    return map[status] || (statusRaw ? String(statusRaw) : "—");
}

/** Статус платежа в списке «Оплаты». */
function paymentListStatusBadge(statusRaw) {
    const s = String(statusRaw || "").toLowerCase();
    if (s === "confirmed") return { cls: "ok", text: "Оплачено" };
    const map = {
        created: { cls: "warn", text: "Создан" },
        pending: { cls: "warn", text: "Ожидает" },
        cancelled: { cls: "bad", text: "Отменён" }
    };
    return map[s] || { cls: "", text: String(statusRaw || "—") };
}

function userRoleRu(roleRaw) {
    const r = String(roleRaw || "").toLowerCase();
    if (r === "admin") return "Администратор";
    if (r === "guest") return "Гость";
    return roleRaw ? String(roleRaw) : "—";
}

function paymentDisplayBadge(booking) {
    const st = String(booking?.payment?.status || "").toLowerCase();
    if (st === "confirmed") return badgeForStatus("paid");
    return badgeForStatus(booking?.payment?.status || "");
}

/** Доступность для сетки номеров: без полного диапазона дат API возвращает null — не считаем номер занятым по броням, только по статусу номера. */
function roomGridAvailability(room) {
    const fromApi = room?.isAvailable ?? room?.IsAvailable;
    if (fromApi === null || fromApi === undefined) {
        return String(room?.status || "").toLowerCase() === "available";
    }
    return Boolean(fromApi);
}

function roomImage(room) {
    const url = room?.photoUrl || room?.PhotoUrl;
    return url ? String(url) : "/images/room-default.svg";
}

function fullGuestName(guest) {
    if (!guest) return "—";
    return [guest.surname, guest.firstName, guest.patronymic].filter(Boolean).join(" ");
}

/** Поля типа номера: API может отдавать camelCase или PascalCase. */
function roomTypeFields(rt) {
    if (!rt || typeof rt !== "object") {
        return { typeName: undefined, maxGuests: 0, pricePerNight: 0, description: "" };
    }
    return {
        typeName: rt.typeName ?? rt.TypeName,
        maxGuests: Number(rt.maxGuests ?? rt.MaxGuests ?? 0),
        pricePerNight: Number(rt.pricePerNight ?? rt.PricePerNight ?? 0),
        description: String(rt.description ?? rt.Description ?? "")
    };
}

/** Локализованное название типа номера (англ. значения из БД → русский). */
function roomTypeLabelRu(typeName) {
    if (typeName === undefined || typeName === null) return "—";
    const raw = String(typeName).trim();
    if (!raw) return "—";
    const lower = raw.toLowerCase();
    const map = {
        standard: "Стандарт",
        standart: "Стандарт",
        deluxe: "Делюкс",
        "de luxe": "Делюкс",
        suite: "Люкс"
    };
    return map[lower] ?? raw;
}

function serviceNameField(s) {
    if (!s || typeof s !== "object") return undefined;
    return s.serviceName ?? s.ServiceName;
}

function serviceFields(s) {
    if (!s || typeof s !== "object") {
        return { serviceId: 0, serviceName: "", description: "", price: 0, isIncluded: false };
    }
    return {
        serviceId: s.serviceId ?? s.ServiceId ?? 0,
        serviceName: s.serviceName ?? s.ServiceName ?? "",
        description: s.description ?? s.Description ?? "",
        price: Number(s.price ?? s.Price ?? 0),
        isIncluded: Boolean(s.isIncluded ?? s.IsIncluded)
    };
}

function populateServiceSelect() {
    const sel = document.getElementById("service-select");
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="">Выберите услугу</option>`;
    (state.services || []).forEach((s) => {
        const f = serviceFields(s);
        const opt = document.createElement("option");
        opt.value = String(f.serviceId);
        opt.textContent = `${serviceLabelRu(f.serviceName)} • ${formatMoney(f.price)}`;
        sel.appendChild(opt);
    });
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

function renderServicesAdminList() {
    const list = document.getElementById("services-admin-list");
    if (!list) return;
    list.innerHTML = "";
    if (!state.services?.length) {
        list.innerHTML = `<div class="muted">Нет услуг в каталоге.</div>`;
        return;
    }
    state.services.forEach((s) => {
        const f = serviceFields(s);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${escapeHtml(serviceLabelRu(f.serviceName))}</div>
                    <div class="card-sub">${escapeHtml(f.description || "—")}</div>
                </div>
                <span class="badge">ID ${escapeHtml(f.serviceId)}</span>
            </div>
            <div class="card-grid">
                <div class="kv"><div class="k">Цена</div><div class="v">${escapeHtml(formatMoney(f.price))}</div></div>
                <div class="kv"><div class="k">В тарифе</div><div class="v">${f.isIncluded ? "Да" : "Нет"}</div></div>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" type="button">Редактировать</button>
            </div>
        `;
        card.querySelector("button")?.addEventListener("click", () => populateServiceForm(s));
        list.appendChild(card);
    });
}

async function loadServices() {
    state.services = await apiRequest("/Services");
    populateServiceSelect();
    if (isAdmin()) renderServicesAdminList();
}

function populateServiceForm(service) {
    const f = serviceFields(service);
    document.getElementById("service-id").value = f.serviceId || "";
    document.getElementById("service-name").value = f.serviceName || "";
    document.getElementById("service-description").value = f.description || "";
    document.getElementById("service-price").value = f.price ?? "";
    document.getElementById("service-included").checked = f.isIncluded;
}

function resetServiceForm() {
    document.getElementById("service-id").value = "";
    document.getElementById("service-name").value = "";
    document.getElementById("service-description").value = "";
    document.getElementById("service-price").value = "";
    document.getElementById("service-included").checked = false;
}

async function saveService(event) {
    event.preventDefault();
    try {
        const id = Number(document.getElementById("service-id").value || 0);
        const payload = {
            serviceName: document.getElementById("service-name").value.trim(),
            description: document.getElementById("service-description").value.trim() || null,
            price: Number(document.getElementById("service-price").value),
            isIncluded: document.getElementById("service-included").checked
        };
        if (id) {
            await apiRequest(`/Services/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        } else {
            await apiRequest("/Services", { method: "POST", body: JSON.stringify(payload) });
        }
        resetServiceForm();
        await loadServices();
        show("services-result", `<div class="muted">Услуга ${id ? "обновлена" : "создана"}.</div>`);
    } catch (error) {
        show("services-result", error.message, true);
    }
}

async function deleteServiceFromForm() {
    const id = Number(document.getElementById("service-id").value || 0);
    if (!id) {
        show("services-result", "Выберите услугу для удаления.", true);
        return;
    }
    if (!confirm("Удалить эту услугу?")) return;
    try {
        await apiRequest(`/Services/${id}`, { method: "DELETE" });
        resetServiceForm();
        await loadServices();
        show("services-result", `<div class="muted">Услуга удалена.</div>`);
    } catch (error) {
        show("services-result", error.message, true);
    }
}

function setBookingServiceControlsEnabled(enabled) {
    ["service-select", "booking-service-guest-id", "service-qty", "add-service-btn"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.disabled = !enabled;
    });
}

/** Название услуги для интерфейса: англ. из БД и типовые варианты → русский. */
function serviceLabelRu(name) {
    if (name === undefined || name === null) return "—";
    const raw = String(name).trim();
    if (!raw) return "—";
    if (/[а-яё]/i.test(raw)) return raw;

    const norm = raw.toLowerCase().replace(/\s+/g, " ").trim();
    const map = {
        breakfast: "Завтрак",
        "late checkout": "Поздний выезд",
        "late check-out": "Поздний выезд",
        transfer: "Трансфер",
        pool: "Бассейн",
        swimming: "Бассейн",
        "swimming pool": "Бассейн",
        massage: "Массаж",
        spa: "СПА",
        sauna: "Сауна",
        wifi: "Wi‑Fi",
        "wi-fi": "Wi‑Fi",
        parking: "Парковка",
        laundry: "Прачечная",
        "room service": "Обслуживание в номере",
        cleaning: "Уборка номера",
        minibar: "Мини-бар",
        concierge: "Консьерж",
        gym: "Спортзал",
        fitness: "Фитнес"
    };
    return map[norm] ?? raw;
}

function bookingGuests(booking) {
    const list = Array.isArray(booking?.bookingGuests) ? booking.bookingGuests : [];
    if (list.length > 0) {
        return list.map((item) => item.guest ?? item.Guest).filter(Boolean);
    }
    const g = booking?.guest ?? booking?.Guest;
    return g ? [g] : [];
}

function resolveBookingRoom(booking) {
    const embedded = booking?.room ?? booking?.Room;
    if (embedded) return embedded;
    const roomId = booking?.roomId ?? booking?.RoomId;
    if (!roomId) return null;
    return state.rooms.find((r) => (r.roomId ?? r.RoomId) === roomId) || null;
}

function renderSelectedBookingGuestsList(booking) {
    const list = document.getElementById("booking-guests-list");
    if (!list) return;
    const guests = bookingGuests(booking);
    list.innerHTML = "";
    if (!guests.length) {
        list.innerHTML = `<div class="muted">Гости не указаны.</div>`;
        return;
    }
    guests.forEach((guest, index) => {
        const card = document.createElement("div");
        card.className = "card booking-guest-card";
        card.innerHTML = `
            <div class="booking-guest-label booking-guest-label--readonly">
                <div class="booking-guest-main">
                    <div class="card-title">${escapeHtml(fullGuestName(guest))}</div>
                    <div class="card-sub">Паспорт: ${escapeHtml((guest.passport ?? guest.Passport) || "—")}</div>
                </div>
                ${index === 0 ? '<span class="badge ok">Основной</span>' : ""}
            </div>
        `;
        list.appendChild(card);
    });
}

function clearSelectedBooking() {
    state.selectedBookingId = null;
    state.selectedBooking = null;
    closePayModal();
    renderSelectedBookingDetails();
    syncSelectedBookingToBookingView();
}

function openPayModal() {
    if (!state.selectedBooking) return;
    syncSelectedBookingToBookingView();
    const modal = document.getElementById("pay-modal");
    if (!modal) return;
    modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    document.getElementById("pay-card")?.focus();
}

function closePayModal() {
    document.getElementById("pay-modal")?.setAttribute("hidden", "");
    document.body.style.overflow = "";
}

function syncSelectedBookingToBookingView() {
    const booking = state.selectedBooking;
    const startIn = document.getElementById("booking-start-date");
    const endIn = document.getElementById("booking-end-date");
    const roomIdIn = document.getElementById("booking-room-id");
    const paySummary = document.getElementById("pay-booking-summary");
    const payBtn = document.getElementById("pay-now-btn");
    const bookingHint = document.getElementById("booking-hint");
    const createBtn = document.getElementById("booking-create-btn");
    const openPayBtn = document.getElementById("open-pay-modal-btn");
    const extraGuest = document.querySelector(".booking-extra-guest-details");

    if (!booking) {
        if (paySummary) paySummary.innerHTML = "";
        if (payBtn) payBtn.disabled = true;
        if (startIn) startIn.readOnly = false;
        if (endIn) endIn.readOnly = false;
        createBtn?.classList.remove("is-hidden");
        openPayBtn?.classList.add("is-hidden");
        extraGuest?.classList.remove("is-hidden");
        if (bookingHint) {
            bookingHint.textContent = "Выберите номер в разделе «Номера», затем добавьте гостей и создайте бронь.";
        }
        syncSelectedRoomState();
        renderBookingGuestsSelection();
        return;
    }

    const room = resolveBookingRoom(booking);
    const roomId = booking.roomId ?? booking.RoomId;
    if (roomIdIn && roomId) roomIdIn.value = String(roomId);
    if (roomId) state.selectedRoomId = roomId;

    const img = document.getElementById("booking-room-image");
    const title = document.getElementById("booking-room-title");
    const sub = document.getElementById("booking-room-sub");
    const checkIn = toDateInputValue(booking.checkInDate ?? booking.CheckInDate);
    const checkOut = toDateInputValue(booking.checkOutDate ?? booking.CheckOutDate);

    if (room) {
        const rt = room.roomType ?? room.RoomType;
        const tf = roomTypeFields(rt);
        const num = room.roomNumber ?? room.RoomNumber;
        if (img) img.src = roomImage(room);
        if (title) title.textContent = `Номер ${num} • ${roomTypeLabelRu(tf.typeName)}`;
        if (sub) {
            sub.textContent = `Этаж ${room.floor ?? room.Floor ?? "—"} • ${formatDateOnly(checkIn)} — ${formatDateOnly(checkOut)}`;
        }
    } else if (title) {
        title.textContent = `Бронь #${booking.bookingId ?? booking.BookingId}`;
        if (sub) sub.textContent = `${formatDateOnly(checkIn)} — ${formatDateOnly(checkOut)}`;
    }

    if (startIn) {
        startIn.value = checkIn;
        startIn.readOnly = true;
    }
    if (endIn) {
        endIn.value = checkOut;
        endIn.readOnly = true;
    }

    renderSelectedBookingGuestsList(booking);

    const isCancelled = String(booking.status || booking.Status || "").toLowerCase() === "cancelled";
    const isPaid = String(booking.payment?.status || booking.Payment?.status || "").toLowerCase() === "confirmed";
    const total = Number(booking.totalPrice ?? booking.TotalPrice ?? 0);
    const payBadge = paymentDisplayBadge(booking);

    if (paySummary) {
        if (isCancelled) {
            paySummary.innerHTML = `<span class="badge ${badgeForStatus("cancelled").cls}">Бронь отменена — оплата недоступна</span>`;
        } else if (isPaid) {
            paySummary.innerHTML = `Оплачено: <strong>${escapeHtml(formatMoney(total))}</strong> <span class="badge ${payBadge.cls}">${escapeHtml(payBadge.text)}</span>`;
        } else {
            paySummary.innerHTML = `К оплате: <strong>${escapeHtml(formatMoney(total))}</strong>`;
        }
    }

    if (payBtn) payBtn.disabled = isCancelled || isPaid;
    createBtn?.classList.add("is-hidden");
    extraGuest?.classList.add("is-hidden");
    if (isCancelled || isPaid) {
        openPayBtn?.classList.add("is-hidden");
    } else {
        openPayBtn?.classList.remove("is-hidden");
    }
    if (bookingHint) {
        bookingHint.textContent = `Просмотр брони #${booking.bookingId ?? booking.BookingId}. Для новой брони выберите номер в «Номера».`;
    }
}

async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API}${path}`, { ...options, headers });
    if (!response.ok) {
        const text = await response.text();
        let message = text || `Ошибка ${response.status}`;
        try {
            const body = JSON.parse(text);
            if (body.errors && typeof body.errors === "object") {
                const lines = Object.entries(body.errors).flatMap(([field, msgs]) =>
                    (Array.isArray(msgs) ? msgs : [msgs]).map((m) => `${field}: ${m}`)
                );
                if (lines.length) message = lines.join(" ");
            } else if (body.title) {
                message = body.title;
            }
        } catch {
            /* ответ не JSON */
        }
        throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : response.text();
}

async function deleteGuestById(guestId, ownerUserId) {
    if (!confirm("Удалить этого гостя? Если он указан в бронировании, удаление будет отклонено.")) return;
    const uid = ownerUserId ?? state.currentUser.userId;
    try {
        await apiRequest(`/Guests/${guestId}?userId=${encodeURIComponent(uid)}`, { method: "DELETE" });
        await loadGuests();
        show("guest-result", `<div class="muted">Гость удален.</div>`);
        show("booking-result", `<div class="muted">Гость удален.</div>`);
    } catch (error) {
        show("guest-result", error.message, true);
        show("booking-result", error.message, true);
    }
}

async function loadRoomTypes() {
    state.roomTypes = await apiRequest("/Rooms/types");
    const roomTypeSelect = document.getElementById("room-form-type");
    if (roomTypeSelect) {
        roomTypeSelect.innerHTML = "";
        state.roomTypes.forEach((type) => {
            const tf = roomTypeFields(type);
            const opt = document.createElement("option");
            opt.value = String(type.roomTypeId ?? type.RoomTypeId ?? "");
            opt.textContent = `${roomTypeLabelRu(tf.typeName)} • до ${tf.maxGuests} гостей • ${formatMoney(tf.pricePerNight)}`;
            roomTypeSelect.appendChild(opt);
        });
        if (!document.getElementById("room-form-id").value && state.roomTypes.length > 0) {
            const first = state.roomTypes[0];
            roomTypeSelect.value = String(first.roomTypeId ?? first.RoomTypeId ?? "");
        }
    }
    renderRoomTypesAdmin();
}

function renderRoomTypesAdmin() {
    const tbody = document.getElementById("room-types-admin-table");
    if (!tbody) return;

    const selectedId = Number(document.getElementById("room-type-id")?.value || 0);
    tbody.innerHTML = "";
    if (!state.roomTypes.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="cell-muted">Нет типов номеров.</td></tr>`;
        return;
    }

    state.roomTypes.forEach((type) => {
        const tf = roomTypeFields(type);
        const id = type.roomTypeId ?? type.RoomTypeId;
        const tr = document.createElement("tr");
        tr.dataset.roomTypeId = String(id);
        tr.innerHTML = `
            <td>${escapeHtml(id)}</td>
            <td>${escapeHtml(roomTypeLabelRu(tf.typeName))}</td>
            <td class="cell-muted">${escapeHtml(tf.description || "—")}</td>
            <td>${escapeHtml(tf.maxGuests)}</td>
            <td>${escapeHtml(formatMoney(tf.pricePerNight))}</td>
        `;
        if (Number(id) === selectedId) tr.classList.add("is-selected");
        tr.addEventListener("click", () => populateRoomTypeForm(type));
        tbody.appendChild(tr);
    });
}

function highlightAdminRoomTypeRow(roomTypeId) {
    document.querySelectorAll("#room-types-admin-table tr[data-room-type-id]").forEach((tr) => {
        tr.classList.toggle(
            "is-selected",
            Number(tr.dataset.roomTypeId) === Number(roomTypeId) && Number(roomTypeId) > 0
        );
    });
}

function resetRoomTypeForm() {
    document.getElementById("room-type-id").value = "";
    document.getElementById("room-type-name").value = "";
    document.getElementById("room-type-description").value = "";
    document.getElementById("room-type-max-guests").value = "";
    document.getElementById("room-type-price").value = "";
    highlightAdminRoomTypeRow(0);
    renderRoomTypesAdmin();
}

function populateRoomTypeForm(type) {
    const tf = roomTypeFields(type);
    document.getElementById("room-type-id").value = type.roomTypeId ?? type.RoomTypeId ?? "";
    document.getElementById("room-type-name").value = tf.typeName ?? "";
    document.getElementById("room-type-description").value = tf.description ?? "";
    document.getElementById("room-type-max-guests").value = tf.maxGuests ?? "";
    document.getElementById("room-type-price").value = tf.pricePerNight ?? "";
    const typeId = type.roomTypeId ?? type.RoomTypeId;
    highlightAdminRoomTypeRow(typeId);
    renderRoomTypesAdmin();
}

async function saveRoomType(event) {
    event.preventDefault();
    try {
        const id = Number(document.getElementById("room-type-id").value || 0);
        const payload = {
            typeName: document.getElementById("room-type-name").value.trim(),
            description: document.getElementById("room-type-description").value.trim() || null,
            maxGuests: Number(document.getElementById("room-type-max-guests").value),
            pricePerNight: Number(document.getElementById("room-type-price").value)
        };

        await apiRequest(id ? `/Rooms/types/${id}` : "/Rooms/types", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });

        resetRoomTypeForm();
        await loadRoomTypes();
        await loadRooms();
        show("room-type-form-result", `<div class="muted">Тип номера ${id ? "обновлён" : "создан"}.</div>`);
    } catch (error) {
        show("room-type-form-result", error.message, true);
    }
}

async function deleteRoomTypeFromForm() {
    try {
        const id = Number(document.getElementById("room-type-id").value || 0);
        if (!id) throw new Error("Сначала выберите тип для удаления.");
        if (!confirm(`Удалить тип номера #${id}? Невозможно, если есть номера этого типа.`)) return;

        await apiRequest(`/Rooms/types/${id}`, { method: "DELETE" });
        resetRoomTypeForm();
        await loadRoomTypes();
        await loadRooms();
        show("room-type-form-result", `<div class="muted">Тип удалён.</div>`);
    } catch (error) {
        show("room-type-form-result", error.message, true);
    }
}

async function loadRooms() {
    try {
        const start = document.getElementById("rooms-checkin")?.value;
        const end = document.getElementById("rooms-checkout")?.value;
        const query = start && end ? `?checkInDate=${encodeURIComponent(start)}&checkOutDate=${encodeURIComponent(end)}` : "";
        state.rooms = await apiRequest(`/Rooms${query}`);
        renderRooms();
        renderAdminRooms();
        syncSelectedRoomState();
    } catch (error) {
        show("rooms-selected", error.message, true);
    }
}

function syncDatesAndReloadRooms(fromBooking = false) {
    const roomsIn = document.getElementById("rooms-checkin");
    const roomsOut = document.getElementById("rooms-checkout");
    const bookingIn = document.getElementById("booking-start-date");
    const bookingOut = document.getElementById("booking-end-date");
    if (!roomsIn || !roomsOut || !bookingIn || !bookingOut) return;

    if (fromBooking) {
        roomsIn.value = bookingIn.value || roomsIn.value;
        roomsOut.value = bookingOut.value || roomsOut.value;
    } else {
        bookingIn.value = roomsIn.value || bookingIn.value;
        bookingOut.value = roomsOut.value || bookingOut.value;
    }

    enforceBookingDateRangeAfterSync();
    loadRooms();
}

function renderRooms() {
    const grid = document.getElementById("rooms-grid");
    if (!grid) return;

    const search = String(document.getElementById("rooms-search")?.value || "").trim().toLowerCase();
    const statusFilter = String(document.getElementById("rooms-status-filter")?.value || "").trim().toLowerCase();

    const list = state.rooms.filter((room) => {
        const available = roomGridAvailability(room);
        if (statusFilter === "available" && !available) return false;
        if (statusFilter === "busy" && available) return false;
        if (!search) return true;

        const tf = roomTypeFields(room.roomType);
        const typeLabel = roomTypeLabelRu(tf.typeName);
        const hay = `${room.roomNumber} ${room.floor} ${tf.typeName || ""} ${typeLabel} ${tf.description}`.toLowerCase();
        return hay.includes(search);
    });

    const count = document.getElementById("rooms-count");
    if (count) count.textContent = `Найдено: ${list.length}`;

    grid.innerHTML = "";
    list.forEach((room) => {
        const available = roomGridAvailability(room);
        const badge = available ? { cls: "ok", text: "Доступен" } : { cls: "bad", text: "Занят" };
        const tf = roomTypeFields(room.roomType);
        const typeLabel = roomTypeLabelRu(tf.typeName);
        const tile = document.createElement("div");
        tile.className = `room-tile ${!available ? "disabled" : ""} ${state.selectedRoomId === room.roomId ? "selected" : ""}`;
        tile.innerHTML = `
            <img class="photo" src="${escapeHtml(roomImage(room))}" alt="Фото номера">
            <div class="body">
                <div class="title">
                    <span>Номер ${escapeHtml(room.roomNumber)}</span>
                    <span class="badge ${badge.cls}">${escapeHtml(badge.text)}</span>
                </div>
                <div class="meta">
                    <div>${escapeHtml(typeLabel)} • Этаж ${escapeHtml(room.floor)} • До ${escapeHtml(tf.maxGuests)} гостей</div>
                    <div class="price">${escapeHtml(formatMoney(tf.pricePerNight))} / ночь</div>
                </div>
                <div class="footer">
                    <span class="muted">${available ? "Нажмите, чтобы выбрать" : "Недоступно на выбранные даты"}</span>
                </div>
            </div>
        `;
        tile.addEventListener("click", () => {
            if (!available) return;
            selectRoom(room.roomId);
        });
        grid.appendChild(tile);
    });
}

function renderAdminRooms() {
    const tbody = document.getElementById("admin-rooms-table");
    if (!tbody) return;

    tbody.innerHTML = "";
    state.rooms.forEach((room) => {
        const tf = roomTypeFields(room.roomType);
        const tr = document.createElement("tr");
        tr.dataset.roomId = String(room.roomId);
        tr.innerHTML = `
            <td>${escapeHtml(room.roomId)}</td>
            <td>${escapeHtml(room.roomNumber)}</td>
            <td>${escapeHtml(room.floor)}</td>
            <td>${escapeHtml(roomTypeLabelRu(tf.typeName))}</td>
            <td>${escapeHtml(tf.maxGuests || "—")}</td>
            <td>${escapeHtml(roomOperationalStatusRu(room.status))}</td>
        `;
        tr.addEventListener("click", () => populateRoomForm(room));
        tbody.appendChild(tr);
    });
    highlightAdminRoomRow(Number(document.getElementById("room-form-id")?.value || 0));
}

function selectRoom(roomId) {
    clearSelectedBooking();
    state.selectedRoomId = roomId;
    document.getElementById("booking-room-id").value = roomId;
    syncSelectedRoomState();
    renderRooms();
    openView("booking");
}

function openView(viewName) {
    const btn = Array.from(document.querySelectorAll(".menu-item")).find((b) => b.dataset.view === viewName);
    if (!btn || btn.style.display === "none") return;
    document.querySelectorAll(".menu-item").forEach((node) => node.classList.remove("active"));
    document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`${viewName}-view`)?.classList.add("active");
}

function syncSelectedRoomState() {
    const room = state.rooms.find((item) => item.roomId === state.selectedRoomId) || null;
    const img = document.getElementById("booking-room-image");
    const title = document.getElementById("booking-room-title");
    const sub = document.getElementById("booking-room-sub");
    const capacityHint = document.getElementById("booking-capacity-hint");

    if (!room) {
        if (img) img.src = "/images/room-default.svg";
        if (title) title.textContent = "Номер не выбран";
        if (sub) sub.textContent = "Нажмите на карточку номера в разделе “Номера”";
        if (capacityHint) capacityHint.textContent = "";
        show("rooms-selected", `<div class="muted">Выберите номер, чтобы начать бронирование.</div>`);
        return;
    }

    const tf = roomTypeFields(room.roomType);
    if (img) img.src = roomImage(room);
    if (title) title.textContent = `Номер ${room.roomNumber} • ${roomTypeLabelRu(tf.typeName)}`;
    if (sub) sub.textContent = `Этаж ${room.floor} • ${formatMoney(tf.pricePerNight)} • До ${tf.maxGuests} гостей`;
    if (capacityHint) capacityHint.textContent = `Максимум гостей: ${tf.maxGuests}`;
    show("rooms-selected", `<div class="muted">Выбран номер ${escapeHtml(room.roomNumber)}.</div>`);
}

async function saveGuest(event) {
    event.preventDefault();
    try {
        const guestId = Number(document.getElementById("guest-id").value || 0);
        const payload = collectGuestForm("guest");
        const result = guestId
            ? await apiRequest(`/Guests/${guestId}`, { method: "PUT", body: JSON.stringify(payload) })
            : await apiRequest("/Guests", { method: "POST", body: JSON.stringify(payload) });

        resetGuestForm();
        await loadGuests();
        show("guest-result", `<div class="muted">Гость ${guestId ? "обновлен" : "создан"}: ${escapeHtml(fullGuestName(result))}.</div>`);
    } catch (error) {
        show("guest-result", error.message, true);
    }
}

function collectGuestForm(prefix) {
    let userId;
    if (prefix === "extra-guest" && isAdmin()) {
        userId = getBookingClientUserId();
    } else if (prefix === "guest" && isAdmin()) {
        userId = getAdminGuestOwnerUserId();
    } else {
        userId = state.currentUser.userId;
    }

    const birthdate = validateBirthdate(document.getElementById(`${prefix}-birthdate`).value);
    const passport = validatePassport(document.getElementById(`${prefix}-passport`).value);

    return {
        userId,
        surname: document.getElementById(`${prefix}-surname`).value.trim(),
        firstName: document.getElementById(`${prefix}-first-name`).value.trim(),
        patronymic: document.getElementById(`${prefix}-patronymic`).value.trim() || null,
        birthdate,
        passport
    };
}

function highlightGuestCard() {
    const id = Number(document.getElementById("guest-id")?.value || 0);
    document.querySelectorAll("#guests-list .card").forEach((card) => {
        card.classList.toggle("is-selected", Number(card.dataset.guestId) === id && id > 0);
    });
}

function resetGuestForm() {
    document.getElementById("guest-id").value = "";
    syncGuestOwnerHidden();
    document.getElementById("guest-surname").value = "";
    document.getElementById("guest-first-name").value = "";
    document.getElementById("guest-patronymic").value = "";
    document.getElementById("guest-birthdate").value = "";
    document.getElementById("guest-passport").value = "";
    highlightGuestCard();
}

function populateGuestForm(guest) {
    document.getElementById("guest-id").value = guest.guestId;
    const ownerSel = document.getElementById("guests-owner-user-id");
    if (ownerSel && isAdmin()) ownerSel.value = String(guest.userId);
    const ownerManual = document.getElementById("guests-owner-user-id-manual");
    if (ownerManual && isAdmin()) ownerManual.value = String(guest.userId);
    syncGuestOwnerHidden();
    document.getElementById("guest-surname").value = guest.surname || "";
    document.getElementById("guest-first-name").value = guest.firstName || "";
    document.getElementById("guest-patronymic").value = guest.patronymic || "";
    document.getElementById("guest-birthdate").value = guest.birthdate || "";
    document.getElementById("guest-passport").value = guest.passport || "";
    highlightGuestCard();
}

async function loadGuests() {
    try {
        if (isAdmin()) await ensureUsersLoaded();

        const guestIdFilter = resolveGuestsFilterGuestId();
        const ownerUid = resolveGuestsFilterOwnerId();

        if (isAdmin()) {
            if (guestIdFilter) {
                const g = await apiRequest(`/Guests/${guestIdFilter}`);
                state.guests = [g];
                state.adminGuestsRaw = [];
            } else if (ownerUid) {
                state.guests = await apiRequest(`/Guests?userId=${encodeURIComponent(ownerUid)}`);
                state.adminGuestsRaw = [];
            } else {
                state.adminGuestsRaw = await apiRequest("/Guests");
                state.guests = [];
            }
            renderGuestOwnerSelects();
        } else {
            state.adminGuestsRaw = [];
            state.guests = await apiRequest(`/Guests/by-user/${state.currentUser.userId}`);
        }

        const listForSelect = isAdmin()
            ? (guestIdFilter ? state.guests : ownerUid ? state.guests : state.adminGuestsRaw)
            : state.guests;
        renderGuestsFilterGuestSelect(listForSelect);
        renderGuests();
        renderBookingGuestsSelection();
        if (state.guests.length === 0) {
            resetGuestForm();
        } else {
            highlightGuestCard();
        }
    } catch (error) {
        show("guest-result", error.message, true);
    }
}

function renderGuests() {
    const list = document.getElementById("guests-list");
    if (!list) return;

    const ownerUid = resolveGuestsFilterOwnerId();
    const guestIdFilter = resolveGuestsFilterGuestId();
    const adminShowAllGuests = isAdmin() && !ownerUid && !guestIdFilter;
    const displayList = adminShowAllGuests ? state.adminGuestsRaw : state.guests;

    list.innerHTML = "";
    if (!displayList || displayList.length === 0) {
        list.innerHTML = `<div class="muted">Пока нет сохраненных гостей.</div>`;
        return;
    }

    const showTechIds = isAdmin();

    displayList.forEach((guest, index) => {
        const techRows = showTechIds
            ? `
                <div class="kv"><div class="k">ID гостя</div><div class="v">${escapeHtml(guest.guestId)}</div></div>
                <div class="kv"><div class="k">Аккаунт</div><div class="v">${escapeHtml(userLoginById(guest.userId))}</div></div>`
            : "";

        let roleBadge;
        if (adminShowAllGuests) {
            roleBadge = `<span class="badge">${escapeHtml(userLoginById(guest.userId))}</span>`;
        } else if (index === 0) {
            roleBadge = `<span class="badge ok">Основной</span>`;
        } else {
            roleBadge = `<span class="badge">Дополнительный</span>`;
        }

        const allowDelete = adminShowAllGuests || index > 0;

        const card = document.createElement("div");
        card.className = "card";
        card.dataset.guestId = String(guest.guestId);
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${escapeHtml(fullGuestName(guest))}</div>
                    <div class="card-sub">Паспорт: ${escapeHtml(guest.passport || "—")}</div>
                </div>
                ${roleBadge}
            </div>
            <div class="card-grid">
                <div class="kv"><div class="k">Дата рождения</div><div class="v">${escapeHtml(formatDateOnly(guest.birthdate))}</div></div>
                ${techRows}
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" type="button">Редактировать</button>
                ${allowDelete ? `<button class="btn btn-danger btn-small" type="button" data-delete-guest="${guest.guestId}" data-owner-user="${guest.userId}">Удалить</button>` : ""}
            </div>
        `;
        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-delete-guest]") || e.target.closest("button")) return;
            populateGuestForm(guest);
        });
        card.querySelector(".btn-secondary")?.addEventListener("click", (e) => {
            e.stopPropagation();
            populateGuestForm(guest);
        });
        card.querySelector("[data-delete-guest]")?.addEventListener("click", (e) => {
            const t = e.currentTarget;
            deleteGuestById(Number(t.dataset.deleteGuest), Number(t.dataset.ownerUser));
        });
        list.appendChild(card);
    });
}

function getSelectedBookingGuestIds() {
    return [...document.querySelectorAll(".booking-guest-checkbox:checked")]
        .map((el) => Number(el.value))
        .filter((id) => id > 0);
}

function renderBookingGuestsSelection() {
    const list = document.getElementById("booking-guests-list");
    if (!list) return;

    const guests = state.guests || [];
    list.innerHTML = "";
    if (!guests.length) {
        list.innerHTML = `<div class="muted">Добавьте гостей в разделе «Гости».</div>`;
        return;
    }

    guests.forEach((guest, index) => {
        const card = document.createElement("div");
        card.className = "card booking-guest-card selectable-card";
        const checked = index === 0 ? "checked" : "";
        card.innerHTML = `
            <label class="booking-guest-label">
                <input type="checkbox" class="booking-guest-checkbox" value="${guest.guestId}" ${checked}>
                <div class="booking-guest-main">
                    <div class="card-title">${escapeHtml(fullGuestName(guest))}</div>
                    <div class="card-sub">Паспорт: ${escapeHtml(guest.passport || "—")}</div>
                </div>
                ${index === 0 ? '<span class="badge ok">Основной</span>' : ""}
            </label>
        `;
        list.appendChild(card);
    });
}

async function createInlineGuest(event) {
    event.preventDefault();
    try {
        const payload = collectGuestForm("extra-guest");
        await apiRequest("/Guests", { method: "POST", body: JSON.stringify(payload) });
        document.getElementById("booking-extra-guest-form").reset();
        if (isAdmin() && state.bookingClientUserId) {
            await loadBookingClientGuests(state.bookingClientUserId);
        } else {
            await loadGuests();
        }
        show("booking-result", `<div class="muted">Гость добавлен в список.</div>`);
    } catch (error) {
        show("booking-result", error.message, true);
    }
}

async function createBooking(event) {
    event.preventDefault();
    try {
        const roomId = Number(document.getElementById("booking-room-id").value);
        if (!roomId) throw new Error("Выберите номер в разделе «Номера».");
        const guestIds = getSelectedBookingGuestIds();
        if (!guestIds.length) throw new Error("Выберите хотя бы одного гостя для брони.");
        const payload = {
            guestId: guestIds[0],
            guestIds,
            roomId,
            checkInDate: document.getElementById("booking-start-date").value,
            checkOutDate: document.getElementById("booking-end-date").value
        };
        const booking = await apiRequest("/Bookings", { method: "POST", body: JSON.stringify(payload) });
        state.selectedBookingId = booking.bookingId;
        await loadSelectedBooking();
        const badge = badgeForStatus(booking.status);
        show(
            "booking-result",
            `<div class="muted">Бронь #${escapeHtml(booking.bookingId)} создана. <span class="badge ${badge.cls}">${escapeHtml(badge.text)}</span></div>`
        );
        await Promise.all([loadBookingsView(), loadRooms()]);
    } catch (error) {
        show("booking-result", error.message, true);
    }
}

async function loadSelectedBooking() {
    if (!state.selectedBookingId) {
        state.selectedBooking = null;
        renderSelectedBookingDetails();
        syncSelectedBookingToBookingView();
        return;
    }
    state.selectedBooking = await apiRequest(`/Bookings/${state.selectedBookingId}`);
    renderSelectedBookingDetails();
    syncSelectedBookingToBookingView();
}

async function addServiceToSelectedBooking() {
    try {
        if (!state.selectedBookingId) throw new Error("Сначала выберите бронь в разделе «Бронирования».");
        const serviceId = Number(document.getElementById("service-select").value);
        if (!serviceId) throw new Error("Выберите услугу.");
        const guestIdRaw = document.getElementById("booking-service-guest-id").value;
        const guestId = guestIdRaw ? Number(guestIdRaw) : null;
        const quantity = Number(document.getElementById("service-qty").value || 1);
        await apiRequest("/Services/booking-link", {
            method: "POST",
            body: JSON.stringify({ bookingId: state.selectedBookingId, serviceId, guestId, quantity })
        });
        show("service-add-result", "Позиция услуги добавлена.");
        await Promise.all([loadSelectedBooking(), loadBookingsView()]);
        if (isAdmin()) await loadAdminBookings();
    } catch (error) {
        show("service-add-result", error.message, true);
    }
}

function renderSelectedBookingDetails() {
    const hint = document.getElementById("selected-booking-hint");
    const lines = document.getElementById("booking-service-lines");
    const guestSelect = document.getElementById("booking-service-guest-id");
    if (!hint || !lines || !guestSelect) return;

    if (!state.selectedBooking) {
        hint.textContent = "Выберите бронь в разделе «Бронирования» → «Выбрать».";
        lines.innerHTML = "";
        guestSelect.innerHTML = `<option value="">Услуга на всю бронь</option>`;
        setBookingServiceControlsEnabled(false);
        return;
    }

    const booking = state.selectedBooking;
    const isCancelled = String(booking.status || "").toLowerCase() === "cancelled";
    setBookingServiceControlsEnabled(!isCancelled);
    hint.textContent = isCancelled
        ? `Бронь #${booking.bookingId} отменена. Услуги в истории; оплата и новые позиции недоступны.`
        : `Выбрана бронь #${booking.bookingId}.`;

    guestSelect.innerHTML = `<option value="">Услуга на всю бронь</option>`;
    bookingGuests(booking).forEach((guest) => {
        const opt = document.createElement("option");
        opt.value = guest.guestId;
        opt.textContent = fullGuestName(guest);
        guestSelect.appendChild(opt);
    });

    const services = Array.isArray(booking.bookingServices) ? booking.bookingServices : [];
    lines.innerHTML = "";
    if (services.length === 0) {
        lines.innerHTML = `<div class="muted">Пока нет добавленных услуг.</div>`;
        return;
    }

    const lineId = (item) => item.bookingServiceId ?? item.BookingServiceId;

    services.forEach((item) => {
        const row = document.createElement("div");
        row.className = "service-line-item";
        const sid = lineId(item);
        const title = serviceLabelRu(serviceNameField(item.service ?? item.Service)) || "Услуга";
        const who = item.guest ? fullGuestName(item.guest) : "На всю бронь";
        row.innerHTML = `
            <div class="service-line-info">
                <div class="service-line-title">${escapeHtml(title)}</div>
                <div class="service-line-meta">${escapeHtml(who)} · ${escapeHtml(`×${item.quantity}`)} · ${escapeHtml(formatMoney(item.totalCost))} · ${escapeHtml(formatDateTime(item.addedAt))}</div>
            </div>
        `;
        if (!isCancelled) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-danger btn-small";
            btn.textContent = "Удалить";
            btn.addEventListener("click", () => removeBookingServiceLine(Number(sid)));
            row.appendChild(btn);
        }
        lines.appendChild(row);
    });
}

async function removeBookingServiceLine(bookingServiceId) {
    if (!confirm("Удалить эту позицию услуги? Сумма брони будет пересчитана.")) return;
    try {
        await apiRequest(`/Services/booking-link/${bookingServiceId}`, { method: "DELETE" });
        show("service-add-result", "Позиция удалена, сумма брони обновлена.");
        await Promise.all([
            loadSelectedBooking(),
            loadBookingsView()
        ]);
        if (isAdmin()) await loadAdminBookings();
    } catch (error) {
        show("service-add-result", error.message, true);
    }
}

async function paySelectedBooking() {
    try {
        if (!state.selectedBookingId) throw new Error("Сначала выберите бронь.");

        validateCardPayment(
            document.getElementById("pay-card").value,
            document.getElementById("pay-exp").value,
            document.getElementById("pay-cvc").value
        );

        const booking = await apiRequest(`/Bookings/${state.selectedBookingId}`);
        if (String(booking?.status || "").toLowerCase() === "cancelled") {
            throw new Error("Нельзя оплатить отменённую бронь.");
        }
        if (String(booking?.payment?.status || "").toLowerCase() === "confirmed") {
            show("pay-result", "Бронь уже оплачена.");
            return;
        }

        const amount = Number(booking?.totalPrice ?? 0);
        let paymentId = booking?.payment?.paymentId;
        if (!paymentId) {
            const created = await apiRequest("/Payments", {
                method: "POST",
                body: JSON.stringify({ bookingId: booking.bookingId, paymentMethod: "card" })
            });
            paymentId = created.paymentId;
        }
        await apiRequest(`/Payments/${paymentId}/confirm`, { method: "PATCH" });

        show("pay-result", `Оплачено: ${formatMoney(amount)}.`);
        await Promise.all([
            loadSelectedBooking(),
            loadBookingsView(),
            ...(isAdmin() ? [loadAdminPayments(), loadAdminBookings()] : [])
        ]);
        closePayModal();
    } catch (error) {
        show("pay-result", error.message, true);
    }
}

async function loadMyBookingsInto(cardsContainerId, messageContainerId, compact) {
    const cards = document.getElementById(cardsContainerId);
    if (!cards) return;

    try {
        const userId = state.currentUser.userId ?? state.currentUser.UserId;
        if (!userId) throw new Error("Не найден ID пользователя. Выйдите и войдите снова.");
        const bookings = await apiRequest(`/Bookings/by-user/${userId}`);
        cards.innerHTML = "";

        const list = compact ? bookings.slice(0, 5) : bookings;
        if (list.length === 0) {
            cards.innerHTML = `<div class="muted">Пока нет бронирований.</div>`;
            show(messageContainerId, "");
            return;
        }

        list.forEach((booking) => cards.appendChild(createBookingCard(booking, messageContainerId, compact)));
        show(messageContainerId, compact ? `<div class="muted">Показаны последние ${Math.min(5, bookings.length)} брони.</div>` : "");
    } catch (error) {
        show(messageContainerId, error.message, true);
    }
}

function createBookingCard(booking, messageContainerId, compact, options = {}) {
    const showOwner = Boolean(options.showOwner);
    const room = booking.room || null;
    const guests = bookingGuests(booking).map(fullGuestName).join(", ");
    const status = badgeForStatus(booking.status);
    const orderBadge = paymentDisplayBadge(booking);
    const serviceSummary = (booking.bookingServices || []).length;
    const ownerUserId = booking.ownerUserId ?? booking.OwnerUserId;
    const ownerLogin = booking.ownerLogin ?? booking.OwnerLogin;

    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
        <div class="card-header">
            <div>
                <div class="card-title">Бронь #${escapeHtml(booking.bookingId)}</div>
                <div class="card-sub">${escapeHtml(formatDateOnly(booking.checkInDate))} — ${escapeHtml(formatDateOnly(booking.checkOutDate))}</div>
            </div>
            <span class="badge ${status.cls}">${escapeHtml(status.text)}</span>
        </div>
        <div class="card-grid">
            ${showOwner ? `<div class="kv"><div class="k">Аккаунт</div><div class="v">${escapeHtml(ownerLogin || "—")} <span class="muted">(user&nbsp;${escapeHtml(ownerUserId ?? "—")})</span></div></div>` : ""}
            <div class="kv"><div class="k">Номер</div><div class="v">${room ? `${escapeHtml(room.roomNumber)} / ${escapeHtml(roomTypeLabelRu(roomTypeFields(room.roomType).typeName))}` : escapeHtml(booking.roomId)}</div></div>
            <div class="kv"><div class="k">Гости</div><div class="v">${escapeHtml(guests || "—")}</div></div>
            <div class="kv"><div class="k">Итого</div><div class="v">${escapeHtml(formatMoney(booking.totalPrice))}</div></div>
            <div class="kv"><div class="k">Оплата</div><div class="v"><span class="badge ${orderBadge.cls}">${escapeHtml(orderBadge.text)}</span></div></div>
            <div class="kv"><div class="k">Услуги</div><div class="v">${escapeHtml(serviceSummary)}</div></div>
            <div class="kv"><div class="k">Платёж</div><div class="v">${booking.payment ? `#${escapeHtml(booking.payment.paymentId)}` : "—"}</div></div>
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary" type="button" data-action="select">Выбрать</button>
            ${String(booking.status || "").toLowerCase() === "cancelled" ? "" : `<button class="btn btn-danger" type="button" data-action="cancel">Отменить</button>`}
        </div>
    `;

    el.querySelector('[data-action="select"]')?.addEventListener("click", async () => {
        state.selectedBookingId = booking.bookingId;
        await Promise.all([loadSelectedBooking(), loadServices()]);
        openView("booking");
        show(messageContainerId, `<div class="muted">Выбрана бронь #${escapeHtml(booking.bookingId)}. Перейдите к услугам справа.</div>`);
    });

    el.querySelector('[data-action="cancel"]')?.addEventListener("click", async () => {
        if (!confirm(`Отменить бронь #${booking.bookingId}? Неподтверждённый платёж будет отменён.`)) return;
        try {
            const res = await apiRequest(`/Bookings/${booking.bookingId}/cancel`, { method: "PATCH" });
            const note = typeof res === "object" && res?.note ? res.note : "";
            if (state.selectedBookingId === booking.bookingId) await loadSelectedBooking();
            await Promise.all([loadBookingsView(), loadRooms()]);
            if (note) show(messageContainerId, `<p class="muted">${escapeHtml(note)}</p>`);
            show(messageContainerId, `<div class="muted">Бронирование #${escapeHtml(booking.bookingId)} отменено.</div>`);
        } catch (error) {
            show(messageContainerId, error.message, true);
        }
    });

    return el;
}

async function loadAdminBookings() {
    const list = document.getElementById("bookings-list");
    if (!list) return;

    try {
        const params = new URLSearchParams();
        const status = document.getElementById("bookings-status-filter")?.value;
        const roomId = resolveBookingsFilterRoomId();
        const userId = resolveBookingsFilterUserId();
        const bookingId = document.getElementById("bookings-id-manual")?.value?.trim();
        const fromDate = document.getElementById("bookings-from-filter")?.value;
        const toDate = document.getElementById("bookings-to-filter")?.value;
        if (status) params.set("status", status);
        if (roomId) params.set("roomId", roomId);
        if (userId) params.set("userId", userId);
        if (bookingId) params.set("bookingId", bookingId);
        if (fromDate) params.set("fromDate", fromDate);
        if (toDate) params.set("toDate", toDate);

        const query = params.toString() ? `?${params.toString()}` : "";
        const bookings = await apiRequest(`/Bookings${query}`);
        list.innerHTML = "";
        if (!bookings.length) {
            list.innerHTML = `<p class="muted">Бронирования не найдены.</p>`;
        } else {
            bookings.forEach((booking) => {
                const card = createBookingCard(booking, "bookings-list-result", false, { showOwner: true });
                list.appendChild(card);
            });
        }
        show("bookings-list-result", `<div class="muted">Найдено бронирований: ${bookings.length}.</div>`);
    } catch (error) {
        show("bookings-list-result", error.message, true);
    }
}

async function loadAdminPayments() {
    const cards = document.getElementById("payments-admin");
    if (!cards) return;

    try {
        const params = new URLSearchParams();
        const status = document.getElementById("payments-status-filter")?.value;
        const fromDate = document.getElementById("payments-from-filter")?.value;
        const toDate = document.getElementById("payments-to-filter")?.value;
        if (status) params.set("status", status);
        if (fromDate) params.set("fromDate", fromDate);
        if (toDate) params.set("toDate", toDate);
        const query = params.toString() ? `?${params.toString()}` : "";

        const payments = await apiRequest(`/Payments${query}`);
        cards.innerHTML = "";
        if (!payments.length) {
            cards.innerHTML = `<div class="muted">Платежи не найдены.</div>`;
            return;
        }
        payments.forEach((payment) => {
            const badge = paymentListStatusBadge(payment.status);
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">Платёж #${escapeHtml(payment.paymentId)}</div>
                        <div class="card-sub">Бронь #${escapeHtml(payment.bookingId)} • ${escapeHtml(formatMoney(payment.amount))}</div>
                    </div>
                    <span class="badge ${badge.cls}">${escapeHtml(badge.text)}</span>
                </div>
                <div class="card-grid">
                    <div class="kv"><div class="k">Метод</div><div class="v">${escapeHtml(payment.paymentMethod)}</div></div>
                    <div class="kv"><div class="k">Транзакция</div><div class="v">${escapeHtml((payment.transactionId || "").slice(0, 12))}</div></div>
                    <div class="kv"><div class="k">Плательщик (логин)</div><div class="v">${escapeHtml(payment.payerLogin || "—")}</div></div>
                </div>
            `;
            const stPay = String(payment.status || "").toLowerCase();
            if (stPay === "created") {
                const actions = document.createElement("div");
                actions.className = "card-actions";
                const confirmBtn = document.createElement("button");
                confirmBtn.type = "button";
                confirmBtn.className = "btn btn-primary btn-small";
                confirmBtn.textContent = "Подтвердить";
                confirmBtn.addEventListener("click", () => adminPaymentAction(payment.paymentId, "confirm"));
                const rejectBtn = document.createElement("button");
                rejectBtn.type = "button";
                rejectBtn.className = "btn btn-danger btn-small";
                rejectBtn.textContent = "Отклонить";
                rejectBtn.addEventListener("click", () => adminPaymentAction(payment.paymentId, "reject"));
                actions.append(confirmBtn, rejectBtn);
                card.appendChild(actions);
            }
            cards.appendChild(card);
        });
        show("payment-result", `<div class="muted">Найдено платежей: ${payments.length}.</div>`);
    } catch (error) {
        show("payment-result", error.message, true);
    }
}

async function adminPaymentAction(paymentId, action) {
    const label = action === "confirm" ? "подтвердить" : "отклонить";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} платёж #${paymentId}?`)) return;
    try {
        const path = action === "confirm" ? "confirm" : "reject";
        await apiRequest(`/Payments/${paymentId}/${path}`, { method: "PATCH" });
        await loadAdminPayments();
        show("payment-result", `<div class="muted">Платёж #${paymentId}: действие выполнено.</div>`);
    } catch (error) {
        show("payment-result", error.message, true);
    }
}

async function loadUsers() {
    const list = document.getElementById("users-list");
    if (!list) return;

    try {
        const users = await apiRequest("/Users");
        state.users = users;
        renderGuestOwnerSelects();
        renderBookingsFilterSelects();
        list.innerHTML = "";
        users.forEach((user) => {
            const active = user.isActive !== false;
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${escapeHtml(user.login)}</div>
                        <div class="card-sub">${escapeHtml(user.email || "—")}</div>
                    </div>
                    <span class="badge ${active ? (String(user.role).toLowerCase() === "admin" ? "ok" : "") : "bad"}">${active ? escapeHtml(userRoleRu(user.role)) : "Заблокирован"}</span>
                </div>
                <div class="card-grid">
                    <div class="kv"><div class="k">ID</div><div class="v">${escapeHtml(user.userId)}</div></div>
                    <div class="kv"><div class="k">Телефон</div><div class="v">${escapeHtml(user.phone || "—")}</div></div>
                    <div class="kv"><div class="k">Создан</div><div class="v">${escapeHtml(user.createdAt || "—")}</div></div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-small" type="button" data-edit-user>Редактировать</button>
                    ${user.userId === state.currentUser.userId ? "" : `<button class="btn btn-danger btn-small" type="button" data-delete-user>Удалить</button>`}
                </div>
            `;
            card.querySelector("[data-edit-user]")?.addEventListener("click", () => populateUserAdminForm(user));
            card.querySelector("[data-delete-user]")?.addEventListener("click", async () => {
                if (!confirm(`Удалить пользователя «${user.login}» (ID ${user.userId})? Это действие необратимо.`)) return;
                try {
                    await apiRequest(`/Users/${user.userId}`, { method: "DELETE" });
                    await loadUsers();
                    resetUserAdminForm();
                    show("users-result", `<div class="muted">Пользователь удален.</div>`);
                } catch (error) {
                    show("users-result", error.message, true);
                }
            });
            list.appendChild(card);
        });
    } catch (error) {
        show("users-result", error.message, true);
    }
}

function populateUserAdminForm(user) {
    document.getElementById("user-admin-id").value = user.userId;
    document.getElementById("user-admin-login").value = user.login || "";
    document.getElementById("user-admin-email").value = user.email || "";
    document.getElementById("user-admin-phone").value = user.phone || "";
    document.getElementById("user-admin-role").value = String(user.role || "guest").toLowerCase();
    document.getElementById("user-admin-active").checked = user.isActive !== false;
    document.getElementById("user-admin-password").value = "";
}

function resetUserAdminForm() {
    document.getElementById("user-admin-id").value = "";
    document.getElementById("user-admin-login").value = "";
    document.getElementById("user-admin-email").value = "";
    document.getElementById("user-admin-phone").value = "";
    document.getElementById("user-admin-role").value = "guest";
    document.getElementById("user-admin-active").checked = true;
    document.getElementById("user-admin-password").value = "";
}

async function saveUserAdmin(event) {
    event.preventDefault();
    try {
        const userId = Number(document.getElementById("user-admin-id").value || 0);
        if (!userId) throw new Error("Выберите пользователя для редактирования.");
        const payload = {
            role: document.getElementById("user-admin-role").value,
            isActive: document.getElementById("user-admin-active").checked,
            email: document.getElementById("user-admin-email").value.trim(),
            phone: document.getElementById("user-admin-phone").value.trim() || null
        };
        await apiRequest(`/Users/${userId}`, { method: "PUT", body: JSON.stringify(payload) });
        const newPass = document.getElementById("user-admin-password").value;
        if (newPass) {
            await apiRequest(`/Users/${userId}/reset-password`, {
                method: "PATCH",
                body: JSON.stringify({ newPassword: newPass })
            });
        }
        await loadUsers();
        show("users-result", `<div class="muted">Пользователь обновлён.</div>`);
    } catch (error) {
        show("users-result", error.message, true);
    }
}

function highlightAdminRoomRow(roomId) {
    document.querySelectorAll("#admin-rooms-table tr").forEach((tr) => {
        tr.classList.toggle("is-selected", Number(tr.dataset.roomId) === Number(roomId) && Number(roomId) > 0);
    });
}

function populateRoomForm(room) {
    document.getElementById("room-form-id").value = room.roomId;
    document.getElementById("room-form-number").value = room.roomNumber || "";
    document.getElementById("room-form-floor").value = room.floor ?? "";
    document.getElementById("room-form-type").value = String(room.roomTypeId ?? room.RoomTypeId ?? "");
    const st = String(room.status || "available").toLowerCase();
    document.getElementById("room-form-status").value = st === "booked" ? "available" : (room.status || "available");
    document.getElementById("room-form-photo").value = room.photoUrl || "";
    highlightAdminRoomRow(room.roomId);
    renderAdminRooms();
}

function resetRoomForm() {
    document.getElementById("room-form-id").value = "";
    document.getElementById("room-form-number").value = "";
    document.getElementById("room-form-floor").value = "";
    if (state.roomTypes.length > 0) {
        const first = state.roomTypes[0];
        document.getElementById("room-form-type").value = String(first.roomTypeId ?? first.RoomTypeId ?? "");
    }
    document.getElementById("room-form-status").value = "available";
    document.getElementById("room-form-photo").value = "";
    highlightAdminRoomRow(0);
    renderAdminRooms();
}

async function saveRoom(event) {
    event.preventDefault();
    try {
        const roomId = Number(document.getElementById("room-form-id").value || 0);
        const payload = {
            roomTypeId: Number(document.getElementById("room-form-type").value),
            roomNumber: document.getElementById("room-form-number").value.trim(),
            floor: Number(document.getElementById("room-form-floor").value),
            status: document.getElementById("room-form-status").value,
            photoUrl: document.getElementById("room-form-photo").value.trim() || null
        };
        await apiRequest(roomId ? `/Rooms/${roomId}` : "/Rooms", {
            method: roomId ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        resetRoomForm();
        await loadRooms();
        show("room-form-result", `<div class="muted">Номер ${roomId ? "обновлен" : "создан"}.</div>`);
    } catch (error) {
        show("room-form-result", error.message, true);
    }
}

async function deleteRoomFromForm() {
    try {
        const roomId = Number(document.getElementById("room-form-id").value || 0);
        if (!roomId) throw new Error("Сначала выберите номер.");
        await apiRequest(`/Rooms/${roomId}`, { method: "DELETE" });
        resetRoomForm();
        await loadRooms();
        show("room-form-result", `<div class="muted">Номер удален.</div>`);
    } catch (error) {
        show("room-form-result", error.message, true);
    }
}
