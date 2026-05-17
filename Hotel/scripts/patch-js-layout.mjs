import fs from "fs";
import path from "path";

const jsPath = path.join(process.cwd(), "wwwroot", "js", "app.js");
let js = fs.readFileSync(jsPath, "utf8");

function replaceBetween(startMarker, endMarker, replacement) {
  const start = js.indexOf(startMarker);
  const end = js.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`markers not found: ${startMarker}`);
  js = js.slice(0, start) + replacement + js.slice(end);
}

replaceBetween(
  "function renderRoomTypesAdmin() {",
  "function resetRoomTypeForm() {",
  `function renderRoomTypesAdmin() {
    const list = document.getElementById("room-types-admin-list");
    if (!list) return;

    const selectedId = Number(document.getElementById("room-type-id")?.value || 0);
    list.innerHTML = "";
    if (!state.roomTypes.length) {
        list.innerHTML = \`<div class="muted">Нет типов номеров.</div>\`;
        return;
    }

    state.roomTypes.forEach((type) => {
        const tf = roomTypeFields(type);
        const id = type.roomTypeId ?? type.RoomTypeId;
        const item = document.createElement("button");
        item.type = "button";
        item.className = \`admin-type-item\${Number(id) === selectedId ? " is-selected" : ""}\`;
        item.innerHTML = \`
            <div class="admin-type-item-title">\${escapeHtml(roomTypeLabelRu(tf.typeName))}</div>
            <div class="admin-type-item-sub">\${escapeHtml(tf.description || tf.typeName || "")} • ID \${escapeHtml(id)}</div>
            <div class="admin-type-item-meta">
                <span>до \${escapeHtml(tf.maxGuests)} гостей</span>
                <span>\${escapeHtml(formatMoney(tf.pricePerNight))} / ночь</span>
            </div>
        \`;
        item.addEventListener("click", () => populateRoomTypeForm(type));
        list.appendChild(item);
    });
}

`
);

js = js.replace(
  `            <td>\${escapeHtml(roomOperationalStatusRu(room.status))}</td>
            <td><button class="btn btn-secondary btn-small" type="button">Редактировать</button></td>
        \`;
        tr.querySelector("button")?.addEventListener("click", () => populateRoomForm(room));`,
  `            <td>\${escapeHtml(roomOperationalStatusRu(room.status))}</td>
        \`;
        const selectedRoomId = Number(document.getElementById("room-form-id")?.value || 0);
        if (room.roomId === selectedRoomId) tr.classList.add("is-selected");
        tr.addEventListener("click", () => populateRoomForm(room));`
);

js = js.replace(
  '        const tr = document.createElement("tr");\n        tr.innerHTML = `',
  '        const tr = document.createElement("tr");\n        tr.dataset.roomId = String(room.roomId);\n        tr.innerHTML = `'
);

if (!js.includes("function highlightAdminRoomRow")) {
  js = js.replace(
    "function populateRoomForm(room) {",
    `function highlightAdminRoomRow(roomId) {
    document.querySelectorAll("#admin-rooms-table tr").forEach((tr) => {
        tr.classList.toggle("is-selected", Number(tr.dataset.roomId) === Number(roomId) && Number(roomId) > 0);
    });
}

function populateRoomForm(room) {`
  );
  js = js.replace(
    '    document.getElementById("room-form-photo").value = room.photoUrl || "";\n}\n\nfunction resetRoomForm()',
    '    document.getElementById("room-form-photo").value = room.photoUrl || "";\n    highlightAdminRoomRow(room.roomId);\n    renderAdminRooms();\n}\n\nfunction resetRoomForm()'
  );
  js = js.replace(
    '    document.getElementById("room-form-photo").value = "";\n}\n\nasync function saveRoom(event)',
    '    document.getElementById("room-form-photo").value = "";\n    highlightAdminRoomRow(0);\n    renderAdminRooms();\n}\n\nasync function saveRoom(event)'
  );
}

if (!js.includes("function highlightGuestCard")) {
  js = js.replace(
    "function resetGuestForm() {",
    `function highlightGuestCard() {
    const id = Number(document.getElementById("guest-id")?.value || 0);
    document.querySelectorAll("#guests-list .card").forEach((card) => {
        card.classList.toggle("is-selected", Number(card.dataset.guestId) === id && id > 0);
    });
}

function resetGuestForm() {`
  );
  js = js.replace(
    '    document.getElementById("guest-passport").value = "";\n}\n\nfunction populateGuestForm(guest)',
    '    document.getElementById("guest-passport").value = "";\n    highlightGuestCard();\n}\n\nfunction populateGuestForm(guest)'
  );
  js = js.replace(
    '    document.getElementById("guest-passport").value = guest.passport || "";\n}\n\nasync function loadGuests()',
    '    document.getElementById("guest-passport").value = guest.passport || "";\n    highlightGuestCard();\n}\n\nasync function loadGuests()'
  );
}

js = js.replace(
  `        if (state.guests.length > 0 && !document.getElementById("guest-id").value) {
            populateGuestForm(state.guests[0]);
        } else if (state.guests.length === 0) {
            resetGuestForm();
        }`,
  `        if (state.guests.length === 0) {
            resetGuestForm();
        } else {
            highlightGuestCard();
        }`
);

js = js.replace(
  '        const card = document.createElement("motion");\n        card.className = "card";',
  '        const card = document.createElement("div");\n        card.className = "card";\n        card.dataset.guestId = String(guest.guestId);'
);
js = js.replace('const card = document.createElement("motion");', 'const card = document.createElement("div");');

js = js.replace(
  '        card.querySelector(".btn-secondary")?.addEventListener("click", () => populateGuestForm(guest));',
  `        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-delete-guest]") || e.target.closest("button")) return;
            populateGuestForm(guest);
        });
        card.querySelector(".btn-secondary")?.addEventListener("click", (e) => {
            e.stopPropagation();
            populateGuestForm(guest);
        });`
);

fs.writeFileSync(jsPath, js, "utf8");
console.log("ok");
