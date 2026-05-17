import fs from "fs";
const p = "wwwroot/app.html";
const D = "di" + "v";
let h = fs.readFileSync(p, "utf8");

h = h.replace(
    `<label class="admin-only">Владелец (аккаунт клиента)
                        <select id="guests-owner-user-id" required></select>
                    </label>`,
    `<${D} class="admin-only filter-group owner-form-group">
                        <span class="filter-label">Владелец нового гостя</span>
                        <select id="guests-owner-user-id" required></select>
                        <input id="guests-owner-user-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                    </${D}>`
);

h = h.replace(
    `                            <label>Клиент (аккаунт)
                                <select id="booking-client-user-id"></select>
                            </label>`,
    `                            <${D} class="filter-group">
                                <span class="filter-label">Клиент (аккаунт)</span>
                                <select id="booking-client-user-id"></select>
                                <input id="booking-client-user-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                            </${D}>`
);

if (!h.includes("account-view")) {
    h = h.replace(
        `        </main>
    </${D}>
    <script src="/js/app.js?v=22"></script>`,
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

if (!h.includes("filter-row")) {
    h = h.replace(
        /<div class="filters-grid bookings-filters">[\s\S]*?<\/motion>\s*<\/motion>\s*<div id="bookings-list"/.source,
        ""
    );
    h = h.replace(
        /<div class="filters-grid bookings-filters">[\s\S]*?<\/div>\s*<\/div>\s*<motion id="bookings-list"/.source.replace("motion", D),
        ""
    );
    const re = /<div class="filters-grid bookings-filters">[\s\S]*?<\/div>\s*<\/motion>\s*<div id="bookings-list"/;
    h = h.replace(
        re,
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
                </${D}>
                <div id="bookings-list"`
    );
}

if (!h.includes('step-badge">1')) {
    h = h.replace(
        `<div class="booking-flow-inner">
                        <div class="booking-room-card">`,
        `<${D} class="booking-step panel">
                        <span class="step-badge">1</span>
                        <h3 class="section-title">Выбранный номер</h3>
                        <${D} class="booking-room-card">`
    );
    h = h.replace(`</${D}>
                    <${D} class="booking-step panel admin-only">`, `</${D}>
                    </${D}>
                    <${D} class="booking-step panel admin-only">`);
}

fs.writeFileSync(p, h);
console.log({
    account: h.includes("account-view"),
    filterRow: h.includes("filter-row"),
    clientManual: h.includes("booking-client-user-id-manual"),
    ownerManual: h.includes("guests-owner-user-id-manual")
});
