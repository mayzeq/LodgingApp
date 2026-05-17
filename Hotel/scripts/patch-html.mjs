import fs from "fs";
const path = "wwwroot/app.html";
const D = "motion".replace("motion", "div"); // div
let html = fs.readFileSync(path, "utf8");

// 1. Room admin separate section
if (!html.includes("room-admin-view")) {
    const guestsMarker = '            <section id="guests-view"';
    const adminStart = html.indexOf('                <div class="admin-only">');
    const afterRooms = html.indexOf(`</${D}>`, html.indexOf('id="rooms-selected"')) + `</${D}>`.length;

    if (adminStart > 0) {
        let adminInner = html.slice(adminStart, html.indexOf(guestsMarker));
        adminInner = adminInner.replace(`<${D} class="admin-only">`, "");
        adminInner = adminInner.replace(
            /<div class="view-header">\s*<h3>Управление номерами<\/h3>\s*<\/div>\s*/,
            ""
        );

        const roomAdmin = `            <section id="room-admin-view" class="view">
                <${D} class="view-header">
                    <h2>Управление номерами</h2>
                    <button class="btn btn-secondary" id="refresh-room-admin-btn" type="button">Обновить</button>
                </${D}>
                <p class="muted">Учётный статус: «свободен» или «на обслуживании». Занятость на даты — по бронированиям.</p>
                <${D} class="room-admin-layout">
                    <${D} class="room-admin-list panel">
                        <h3 class="section-title">Список номеров</h3>
${adminInner}                    </${D}>
                </${D}>
            </section>

`;

        html =
            html.slice(0, afterRooms) +
            `\n                <p class="muted guest-only">Нажмите на карточку номера, затем откройте «Бронирование».</p>\n            </section>\n\n` +
            roomAdmin +
            html.slice(html.indexOf(guestsMarker));
    }
}

// 2. Guests filters
if (!html.includes("guests-filter-guest-select")) {
    html = html.replace(
        `                    <motion class="muted">Фильтр: клиент по логину или точный поиск по ID гостя. Владелец нового гостя — в поле ниже формы.</motion>
                    <motion class="filters-grid">
                        <label class="small">Клиент (логин)
                            <select id="guests-filter-owner-select">
                                <option value="">Все клиенты</option>
                            </select>
                        </label>
                        <label class="small">ID гостя
                            <input id="guests-filter-guest-id" type="number" min="1" placeholder="Точный поиск">
                        </label>
                    </motion>`.replaceAll("motion", D),
        `                    <p class="muted">Клиент и гость: список или ручной ID.</p>
                    <${D} class="filter-toolbar">
                        <${D} class="filter-group">
                            <span class="filter-label">Клиент (аккаунт)</span>
                            <select id="guests-filter-owner-select"><option value="">Все клиенты</option></select>
                            <input id="guests-filter-owner-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                        </${D}>
                        <${D} class="filter-group">
                            <span class="filter-label">Гость</span>
                            <select id="guests-filter-guest-select"><option value="">Все в выборке</option></select>
                            <input id="guests-filter-guest-id-manual" type="number" min="1" placeholder="или ID гостя">
                        </${D}>
                    </${D}>`
    );
}

if (!html.includes("guests-owner-user-id-manual")) {
    html = html.replace(
        `<label class="admin-only">Владелец (аккаунт клиента)
                        <select id="guests-owner-user-id" required></select>
                    </label>`,
        `<${D} class="admin-only filter-group owner-form-group">
                        <span class="filter-label">Владелец нового гостя</span>
                        <select id="guests-owner-user-id" required></select>
                        <input id="guests-owner-user-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                    </${D}>`
    );
}

if (!html.includes("booking-client-user-id-manual")) {
    html = html.replace(
        `                            <label>Клиент (аккаунт)
                                <select id="booking-client-user-id"></select>
                            </label>`,
        `                            <${D} class="filter-group">
                                <span class="filter-label">Клиент (аккаунт)</span>
                                <select id="booking-client-user-id"></select>
                                <input id="booking-client-user-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                            </${D}>`
    );
}

if (html.includes('id="bookings-room-select"') && !html.includes("filter-row")) {
    html = html.replace(
        /<div class="filters-grid bookings-filters">[\s\S]*?<\/motion>\s*<\/motion>\s*<div id="bookings-list"/.source.replace("motion", D),
        `<${D} class="filter-toolbar bookings-filters">
                        <${D} class="filter-row">
                            <${D} class="filter-group"><span class="filter-label">Статус</span>
                                <select id="bookings-status-filter"><option value="">Все</option><option value="confirmed">Подтверждено</option><option value="pending">Ожидает</option><option value="cancelled">Отменено</option></select></${D}>
                            <${D} class="filter-group"><span class="filter-label">ID брони</span>
                                <input id="bookings-id-manual" type="number" min="1" placeholder="Точный поиск"></${D}>
                            <${D} class="filter-group"><span class="filter-label">Заезд с</span>
                                <input id="bookings-from-filter" type="date"></${D}>
                            <${D} class="filter-group"><span class="filter-label">Выезд по</span>
                                <input id="bookings-to-filter" type="date"></${D}>
                        </${D}>
                        <${D} class="filter-row">
                            <${D} class="filter-group"><span class="filter-label">Номер</span>
                                <select id="bookings-room-select"><option value="">Все номера</option></select>
                                <input id="bookings-room-id-manual" type="number" min="1" placeholder="или ID номера"></${D}>
                            <${D} class="filter-group filter-group-wide"><span class="filter-label">Клиент</span>
                                <select id="bookings-user-select"><option value="">Все клиенты</option></select>
                                <input id="bookings-user-id-manual" type="number" min="1" placeholder="или ID аккаунта"></${D}>
                        </${D}>
                    </${D}>
                <div id="bookings-list"`
    );
    // fix regex - use div not motion
    html = html.replace(
        /<div class="filters-grid bookings-filters">[\s\S]*?<\/div>\s*<\/div>\s*<motion id="bookings-list"/.source,
        ""
    );
}

// bookings filter - simpler replace
if (html.includes('class="filters-grid bookings-filters"')) {
    html = html.replace(
        /<div class="filters-grid bookings-filters">[\s\S]*?<\/div>\s*<\/motion>\s*<div id="bookings-list"/,
        ""
    );
}

if (!html.includes("booking-flow")) {
    html = html.replace(
        '<div class="booking-layout" id="booking-layout">',
        `<${D} class="booking-flow" id="booking-flow">`
    );
    html = html.replace('class="booking-left"', 'class="booking-flow-inner"');
}

if (!html.includes('id="account-view"')) {
    html = html.replace(
        `        </main>
    </${D}>
    <script src="/js/app.js?v=21"></script>`,
        `            <section id="account-view" class="view">
                <${D} class="view-header"><h2>Мой аккаунт</h2></${D}>
                <p class="muted">Логин изменить нельзя. Обновите email, телефон и при необходимости пароль.</p>
                <form id="account-form" class="form-grid account-form panel">
                    <label>Логин <input id="account-login" readonly></label>
                    <label>Email <input id="account-email" type="email" required></label>
                    <label>Телефон <input id="account-phone"></label>
                    <hr class="form-divider">
                    <label>Текущий пароль <input id="account-current-password" type="password" placeholder="Для смены пароля"></label>
                    <label>Новый пароль <input id="account-new-password" type="password" minlength="6" placeholder="Не менять — оставить пустым"></label>
                    <button class="btn btn-primary" type="submit">Сохранить</button>
                </form>
                <${D} class="panel" id="account-result"></${D}>
            </section>
        </main>
    </${D}>
    <script src="/js/app.js?v=22"></script>`
    );
}

html = html.replace(/style\.css\?v=\d+/, "style.css?v=17");
if (!html.includes("app.js?v=22")) html = html.replace(/app\.js\?v=\d+/, "app.js?v=22");

fs.writeFileSync(path, html);
console.log({
    roomAdmin: html.includes("room-admin-view"),
    account: html.includes("account-view"),
    guestSelect: html.includes("guests-filter-guest-select")
});
