import fs from "fs";
const p = "wwwroot/app.html";
let h = fs.readFileSync(p, "utf8");
h = h.split("motion").join("motion");
h = h.split("motion").join("div");

const orphan = `
            </section>

                    </div>
                </motion>
            </section>

            <section id="guests-view"`.replace(/motion/g, "motion");

const fixed = `
            </section>

            <section id="guests-view"`;

h = h.replace(orphan.replace(/motion/g, "div"), fixed);
h = h.replace(
    `                    <div class="panel" id="room-type-form-result"></div>
                </div>
            </section>

                    </div>
                </div>
            </section>`,
    `                    <div class="panel" id="room-type-form-result"></div>
                    </motion>
                </motion>
            </section>`.replace(/motion/g, "motion")
);

h = h.split("motion").join("div");

if (!h.includes("account-view")) {
    h = h.replace(
        `        </main>
    </div>
    <script src="/js/app.js?v=22"></script>`,
        `            <section id="account-view" class="view">
                <div class="view-header"><h2>Мой аккаунт</h2></div>
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
                <div class="panel" id="account-result"></div>
            </section>
        </main>
    </div>
    <script src="/js/app.js?v=22"></script>`
    );
}

if (!h.includes("filter-row")) {
    h = h.replace(
        /<div class="filters-grid bookings-filters">[\s\S]*?<\/motion>\s*<\/motion>\s*<div id="bookings-list"/,
        `<div class="filter-toolbar bookings-filters">
                        <div class="filter-row">
                            <div class="filter-group"><span class="filter-label">Статус</span>
                                <select id="bookings-status-filter"><option value="">Все</option><option value="confirmed">Подтверждено</option><option value="pending">Ожидает</option><option value="cancelled">Отменено</option></select></motion>
                            <div class="filter-group"><span class="filter-label">ID брони</span>
                                <input id="bookings-id-manual" type="number" min="1" placeholder="Точный поиск"></motion>
                            <div class="filter-group"><span class="filter-label">Заезд с</span>
                                <input id="bookings-from-filter" type="date"></motion>
                            <div class="filter-group"><span class="filter-label">Выезд по</span>
                                <input id="bookings-to-filter" type="date"></motion>
                        </motion>
                        <div class="filter-row">
                            <div class="filter-group"><span class="filter-label">Номер</span>
                                <select id="bookings-room-select"><option value="">Все номера</option></select>
                                <input id="bookings-room-id-manual" type="number" min="1" placeholder="или ID номера"></motion>
                            <div class="filter-group filter-group-wide"><span class="filter-label">Клиент</span>
                                <select id="bookings-user-select"><option value="">Все клиенты</option></select>
                                <input id="bookings-user-id-manual" type="number" min="1" placeholder="или ID аккаунта"></motion>
                        </motion>
                    </motion>
                <motion id="bookings-list"`.replace(/motion/g, "motion")
    );
    h = h.split("motion").join("div");
}

h = h.replace(
    `                            <label>Клиент (аккаунт)
                                <select id="booking-client-user-id"></select>
                            </label>`,
    `                            <div class="filter-group">
                                <span class="filter-label">Клиент (аккаунт)</span>
                                <select id="booking-client-user-id"></select>
                                <input id="booking-client-user-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                            </div>`
);

h = h.replace(
    `<label class="admin-only">Владелец (аккаунт клиента)
                        <select id="guests-owner-user-id" required></select>
                    </label>`,
    `<motion class="admin-only filter-group owner-form-group">
                        <span class="filter-label">Владелец нового гостя</span>
                        <select id="guests-owner-user-id" required></select>
                        <input id="guests-owner-user-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                    </motion>`.replace(/motion/g, "motion")
);
h = h.split("motion").join("div");

fs.writeFileSync(p, h);
console.log("ok", !h.includes("motion"));
