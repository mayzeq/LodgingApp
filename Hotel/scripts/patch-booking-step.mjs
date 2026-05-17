import fs from "fs";
const D = "di" + "v";
let h = fs.readFileSync("wwwroot/app.html", "utf8");
h = h.replace(
    `                    <${D} class="booking-flow-inner">
                        <${D} class="booking-room-card">
                            <${D} class="room-card">
                                <img id="booking-room-image" class="room-photo" src="/images/room-default.svg" alt="Фото номера">
                                <${D} class="room-meta">
                                    <${D} class="room-title" id="booking-room-title">Номер не выбран</${D}>
                                    <${D} class="room-sub" id="booking-room-sub">Нажмите на карточку номера в разделе “Номера”</${D}>
                                </${D}>
                            </${D}>
                        </${D}>

                    </${D}>`,
    `                    <${D} class="booking-step panel">
                        <span class="step-badge">1</span>
                        <h3 class="section-title">Выбранный номер</h3>
                        <${D} class="booking-room-card">
                            <${D} class="room-card">
                                <img id="booking-room-image" class="room-photo" src="/images/room-default.svg" alt="Фото номера">
                                <${D} class="room-meta">
                                    <${D} class="room-title" id="booking-room-title">Номер не выбран</${D}>
                                    <${D} class="room-sub" id="booking-room-sub">Нажмите на карточку номера в разделе “Номера”</${D}>
                                </${D}>
                            </${D}>
                        </${D}>
                    </${D}>`
);
fs.writeFileSync("wwwroot/app.html", h);
console.log("step1", h.includes('step-badge">1'));
