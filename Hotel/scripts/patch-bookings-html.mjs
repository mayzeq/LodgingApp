import fs from "fs";
const p = "wwwroot/app.html";
const D = "di" + "v";
let h = fs.readFileSync(p, "utf8");
const start = h.indexOf('<div class="filters-grid bookings-filters">');
const end = h.indexOf('<motion id="bookings-list"', start).toString().replace("motion", "div");
const end2 = h.indexOf(`<${D} id="bookings-list"`, start);
if (start < 0 || end2 < 0) {
    console.log("markers", start, end2);
    process.exit(1);
}
const repl = `<${D} class="filter-toolbar bookings-filters">
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
                `;
h = h.slice(0, start) + repl + h.slice(end2);
fs.writeFileSync(p, h);
console.log("ok", h.includes("filter-row"));
