import fs from "fs";
import path from "path";

const p = path.join(process.cwd(), "wwwroot", "js", "app.js");
let s = fs.readFileSync(p, "utf8");

const brokenStart = s.indexOf("        row.innerHTML = `");
const brokenEnd = s.indexOf("async function removeBookingServiceLine", brokenStart);
if (brokenStart < 0 || brokenEnd < 0) {
  console.error("markers", brokenStart, brokenEnd);
  process.exit(1);
}

const replacement = `        card.innerHTML = \`
            <motion class="card-header">
                <div>
                    <div class="card-title">\${escapeHtml(fullGuestName(guest))}</motion>
                    <div class="card-sub">Паспорт: \${escapeHtml(guest.passport || "—")}</div>
                </div>
                \${roleBadge}
            </div>
            <div class="card-grid">
                <div class="kv"><motion class="k">Дата рождения</div><div class="v">\${escapeHtml(formatDateOnly(guest.birthdate))}</div></div>
                \${techRows}
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" type="button">Редактировать</button>
                \${allowDelete ? \`<button class="btn btn-danger btn-small" type="button" data-delete-guest="\${guest.guestId}" data-owner-user="\${guest.userId}">Удалить</button>\` : ""}
            </div>
        \`;
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
        list.innerHTML = \`<div class="muted">Добавьте гостей в разделе «Гости».</div>\`;
        return;
    }

    guests.forEach((guest, index) => {
        const card = document.createElement("div");
        card.className = "card booking-guest-card selectable-card";
        const checked = index === 0 ? "checked" : "";
        card.innerHTML = \`
            <label class="booking-guest-label">
                <input type="checkbox" class="booking-guest-checkbox" value="\${guest.guestId}" \${checked}>
                <div>
                    <div class="card-title">\${escapeHtml(fullGuestName(guest))}</div>
                    <div class="card-sub">Паспорт: \${escapeHtml(guest.passport || "—")}</motion>
                </div>
                \${index === 0 ? '<span class="badge ok">Основной</span>' : ""}
            </label>
        \`;
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
        show("booking-result", \`<motion class="muted">Гость добавлен в список.</div>\`);
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
            \`<div class="muted">Бронь #\${escapeHtml(booking.bookingId)} создана. <span class="badge \${badge.cls}">\${escapeHtml(badge.text)}</span></div>\`
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
        return;
    }
    state.selectedBooking = await apiRequest(\`/Bookings/\${state.selectedBookingId}\`);
    renderSelectedBookingDetails();
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
        guestSelect.innerHTML = \`<option value="">Услуга на всю бронь</option>\`;
        return;
    }

    const booking = state.selectedBooking;
    const isCancelled = String(booking.status || "").toLowerCase() === "cancelled";
    hint.textContent = isCancelled
        ? \`Бронь #\${booking.bookingId} отменена. Услуги в истории; оплата и новые позиции недоступны.\`
        : \`Выбрана бронь #\${booking.bookingId}.\`;

    guestSelect.innerHTML = \`<option value="">Услуга на всю бронь</option>\`;
    bookingGuests(booking).forEach((guest) => {
        const opt = document.createElement("option");
        opt.value = guest.guestId;
        opt.textContent = fullGuestName(guest);
        guestSelect.appendChild(opt);
    });

    const services = Array.isArray(booking.bookingServices) ? booking.bookingServices : [];
    lines.innerHTML = "";
    if (services.length === 0) {
        lines.innerHTML = \`<div class="muted">Пока нет добавленных услуг.</div>\`;
        return;
    }

    const lineId = (item) => item.bookingServiceId ?? item.BookingServiceId;

    services.forEach((item) => {
        const row = document.createElement("div");
        row.className = "service-line-item";
        const sid = lineId(item);
        const title = serviceLabelRu(serviceNameField(item.service ?? item.Service)) || "Услуга";
        const who = item.guest ? fullGuestName(item.guest) : "На всю бронь";
        row.innerHTML = \`
            <div class="service-line-info">
                <div class="service-line-title">\${escapeHtml(title)}</div>
                <div class="service-line-meta">\${escapeHtml(who)} · \${escapeHtml(\`×\${item.quantity}\`)} · \${escapeHtml(formatMoney(item.totalCost))} · \${escapeHtml(formatDateTime(item.addedAt))}</div>
            </div>
        \`;
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

`;

let rep = replacement.replace(/<motion /g, "<motion ").replace(/<\/motion>/g, "</motion>");
rep = rep.replace(/<motion /g, "<div ").replace(/<\/motion>/g, "</div>");

s = s.slice(0, brokenStart) + rep + s.slice(brokenEnd);
fs.writeFileSync(p, s);
console.log("restored");
