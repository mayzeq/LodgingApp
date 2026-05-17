import fs from "fs";
import path from "path";

const htmlPath = path.join(process.cwd(), "wwwroot", "app.html");
let html = fs.readFileSync(htmlPath, "utf8").replace(/\r\n/g, "\n");

const newRoomBlock = `                <p class="muted">Учётный статус: «свободен» или «на обслуживании». Занятость на даты — по бронированиям.</p>

                <h3 class="section-title admin-section-heading">Номера</h3>
                <div class="admin-split-layout">
                    <div class="admin-split-list panel">
                        <h4 class="panel-subtitle">Список номеров</h4>
                        <div class="table-wrap admin-table-scroll">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Номер</th>
                                        <th>Этаж</th>
                                        <th>Тип</th>
                                        <th>Мест</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-rooms-table"></tbody>
                            </table>
                        </div>
                    </div>
                    <div class="admin-split-form panel">
                        <h4 class="panel-subtitle">Редактирование номера</h4>
                        <form id="room-form" class="form-grid">
                            <input id="room-form-id" type="hidden">
                            <label>Номер <input id="room-form-number" required></label>
                            <label>Этаж <input id="room-form-floor" type="number" min="1" required></label>
                            <label>Тип номера <select id="room-form-type" required></select></label>
                            <label>Статус (учётный)
                                <select id="room-form-status">
                                    <option value="available">Свободен</option>
                                    <option value="booked">Занят</option>
                                    <option value="maintenance">На обслуживании</option>
                                </select>
                            </label>
                            <label>Фото URL <input id="room-form-photo"></label>
                            <div class="inline-actions">
                                <button class="btn btn-primary" type="submit">Сохранить</button>
                                <button class="btn btn-secondary" id="room-form-reset-btn" type="button">Новый</button>
                                <button class="btn btn-danger" id="room-form-delete-btn" type="button">Удалить</button>
                            </div>
                        </form>
                        <div id="room-form-result" class="form-result"></div>
                    </div>
                </div>

                <h3 class="section-title admin-section-heading">Типы номеров</h3>
                <div class="admin-split-layout">
                    <div class="admin-split-list panel">
                        <h4 class="panel-subtitle">Список типов</h4>
                        <div id="room-types-admin-list" class="admin-type-list"></div>
                    </div>
                    <div class="admin-split-form panel">
                        <h4 class="panel-subtitle">Редактирование типа</h4>
                        <form id="room-type-form" class="form-grid">
                            <input id="room-type-id" type="hidden">
                            <label>Ключ (латиница) <input id="room-type-name" required placeholder="Standard"></label>
                            <label>Описание <input id="room-type-description" placeholder="Для сайта"></label>
                            <label>Макс. гостей <input id="room-type-max-guests" type="number" min="1" required></label>
                            <label>Цена за ночь (₽) <input id="room-type-price" type="number" step="0.01" min="0" required></label>
                            <div class="inline-actions">
                                <button class="btn btn-primary" type="submit">Сохранить</button>
                                <button class="btn btn-secondary" id="room-type-form-reset-btn" type="button">Новый</button>
                                <button class="btn btn-danger" id="room-type-form-delete-btn" type="button">Удалить</button>
                            </div>
                        </form>
                        <div id="room-type-form-result" class="form-result"></div>
                    </div>
                </div>
`;

const i0 = html.indexOf('                <p class="muted">Учётный статус:');
const i1 = html.indexOf('            <section id="guests-view"');
if (i0 < 0 || i1 < 0) {
  console.error("room markers", i0, i1);
  process.exit(1);
}
html = html.slice(0, i0) + newRoomBlock + "\n" + html.slice(i1);

const guestsNew = `                <div class="guests-page-layout">
                    <div class="guests-list-column">
                        <div id="guests-list" class="cards guests-cards-list"></div>
                        <p class="muted guests-list-hint" id="guests-list-hint">Выберите гостя в списке или нажмите «Новый гость».</p>
                    </div>
                    <div class="guests-editor-column">
                        <div class="panel guest-owner-panel admin-only" id="guest-owner-panel">
                            <h3 class="panel-subtitle">Владелец (аккаунт клиента)</h3>
                            <p class="muted guest-owner-hint">Для нового гостя укажите, кому привязать запись.</p>
                            <div class="filter-group">
                                <span class="filter-label">Клиент</span>
                                <select id="guests-owner-user-id" required></select>
                                <input id="guests-owner-user-id-manual" type="number" min="1" placeholder="или ID аккаунта">
                            </div>
                        </div>
                        <div class="panel guest-data-panel">
                            <h3 class="panel-subtitle">Данные гостя</h3>
                            <form id="guest-form" class="form-grid guest-form-fields">
                                <input id="guest-id" type="hidden">
                                <input id="guest-user-id" type="hidden">
                                <label>Фамилия <input id="guest-surname" required></label>
                                <label>Имя <input id="guest-first-name" required></label>
                                <label>Отчество <input id="guest-patronymic"></label>
                                <label>Дата рождения <input id="guest-birthdate" type="date" required></label>
                                <label>Паспорт РФ <input id="guest-passport" maxlength="11" placeholder="1234 567890" required></label>
                                <div class="inline-actions">
                                    <button class="btn btn-primary" type="submit">Сохранить гостя</button>
                                    <button class="btn btn-secondary" id="guest-form-reset-btn" type="button">Новый гость</button>
                                </div>
                            </form>
                            <div id="guest-result" class="form-result"></div>
                        </div>
                    </div>
                </div>
`;

const g0 = html.indexOf('                <form id="guest-form"');
const g1 = html.indexOf('            <section id="booking-view"');
if (g0 < 0 || g1 < 0) {
  console.error("guest markers", g0, g1);
  process.exit(1);
}
html = html.slice(0, g0) + guestsNew + "\n            " + html.slice(g1);

const bookingNew = `<div class="booking-layout" id="booking-flow">
                    <div class="booking-layout-main">
                        <div class="booking-top-row">
                            <div class="booking-step panel booking-step-compact">
                                <span class="step-badge">1</span>
                                <h3 class="section-title">Номер</h3>
                                <div class="booking-room-card">
                                    <div class="room-card room-card-horizontal">
                                        <img id="booking-room-image" class="room-photo" src="/images/room-default.svg" alt="Фото номера">
                                        <div class="room-meta">
                                            <div class="room-title" id="booking-room-title">Номер не выбран</div>
                                            <div class="room-sub" id="booking-room-sub">Выберите в разделе «Номера»</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="booking-step panel booking-step-compact admin-only">
                                <span class="step-badge">2</span>
                                <h3 class="section-title">Клиент</h3>
                                <p class="muted booking-step-note">Бронь за клиента — подгрузятся его гости.</p>
                                <div class="filter-group">
                                    <span class="filter-label">Аккаунт</span>
                                    <select id="booking-client-user-id"></select>
                                    <input id="booking-client-user-id-manual" type="number" min="1" placeholder="или ID">
                                </div>
                            </div>
                        </div>

                        <div class="booking-step panel">
                            <span class="step-badge admin-only">3</span>
                            <span class="step-badge guest-only">2</span>
                            <h3 class="section-title">Даты и гости</h3>
                            <form id="booking-form" class="form-grid booking-dates-form booking-dates-inline">
                                <input id="booking-room-id" type="hidden">
                                <label>Заезд <input id="booking-start-date" type="date" required></label>
                                <label>Выезд <input id="booking-end-date" type="date" required></label>
                                <p class="muted form-hint booking-hint-inline">Выезд — следующий день после заезда (не та же дата).</p>
                                <button class="btn btn-primary" type="submit">Создать бронь</button>
                            </form>

                            <div class="booking-guests-block">
                                <div class="view-header compact">
                                    <h4>Гости в бронировании</h4>
                                    <div class="muted" id="booking-capacity-hint"></div>
                                </div>
                                <div id="booking-guests-list" class="cards compact-cards"></div>
                            </div>

                            <details class="booking-extra-guest-details">
                                <summary>Добавить гостя</summary>
                                <form id="booking-extra-guest-form" class="form-grid form-grid-2col">
                                    <label>Фамилия <input id="extra-guest-surname" required></label>
                                    <label>Имя <input id="extra-guest-first-name" required></label>
                                    <label>Отчество <input id="extra-guest-patronymic"></label>
                                    <label>Дата рождения <input id="extra-guest-birthdate" type="date" required></label>
                                    <label class="form-span-2">Паспорт РФ <input id="extra-guest-passport" maxlength="11" placeholder="1234 567890" required></label>
                                    <button class="btn btn-secondary form-span-2" type="submit">Добавить в бронь</button>
                                </form>
                            </details>
                            <div id="booking-result" class="form-result"></div>
                        </div>
                    </div>

                    <div class="booking-layout-side">
                        <div class="booking-step panel">
                            <h3 class="section-title">Услуги</h3>
                            <div class="muted" id="selected-booking-hint">Выберите бронь в «Бронирования» → «Выбрать».</div>
                            <div class="service-picker">
                                <select id="booking-service-guest-id"></select>
                                <select id="service-select"></select>
                                <input id="service-qty" type="number" min="1" value="1">
                                <button class="btn btn-secondary" id="add-service-btn" type="button">Добавить</button>
                                <button class="btn btn-secondary" id="refresh-services-btn" type="button">Обновить</button>
                            </div>
                            <div id="service-add-result" class="muted"></div>
                            <div id="booking-service-lines" class="cards compact-cards"></div>
                        </div>
                        <div class="booking-step panel">
                            <h3 class="section-title">Оплата</h3>
                            <div class="form-grid pay-form-compact">
                                <label>Карта <input id="pay-card" inputmode="numeric" placeholder="0000 0000 0000 0000"></label>
                                <label>Срок <input id="pay-exp" placeholder="12/30"></label>
                                <label>CVC <input id="pay-cvc" inputmode="numeric" placeholder="123"></label>
                                <button class="btn btn-primary" id="pay-now-btn" type="button">Оплатить</button>
                            </div>
                            <div id="pay-result" class="muted"></div>
                        </div>
                    </div>
                </div>
`;

const b0 = html.indexOf('<div class="booking-flow" id="booking-flow">');
const b1 = html.indexOf('            </section>', b0);
if (b0 < 0 || b1 < 0) {
  console.error("booking markers", b0, b1);
  process.exit(1);
}
html = html.slice(0, b0) + bookingNew + html.slice(b1);

html = html.replace(/style\.css\?v=\d+/, "style.css?v=18");
html = html.replace(/app\.js\?v=\d+/, "app.js?v=24");

fs.writeFileSync(htmlPath, html, "utf8");
console.log("ok");
