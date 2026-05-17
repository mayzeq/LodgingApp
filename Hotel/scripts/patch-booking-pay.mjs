import fs from "fs";
import path from "path";

const htmlPath = path.join(process.cwd(), "wwwroot", "app.html");
let html = fs.readFileSync(htmlPath, "utf8");

const payBlock = `                        <motion class="panel booking-side-panel">
                            <h3 class="section-title booking-panel-title">Оплата</h3>
                            <div class="form-grid pay-form-compact">
                                <label>Карта <input id="pay-card" inputmode="numeric" placeholder="0000 0000 0000 0000"></label>
                                <label>Срок <input id="pay-exp" placeholder="12/30"></label>
                                <label>CVC <input id="pay-cvc" inputmode="numeric" placeholder="123"></label>
                                <button class="btn btn-primary" id="pay-now-btn" type="button">Оплатить</button>
                            </div>
                            <div id="pay-result" class="muted"></div>
                        </div>`;

const payBlockFixed = payBlock.replace(/<motion /g, "<motion ").replace(/<\/motion>/g, "</motion>");
const payBlockDiv = payBlock.replace(/<motion /g, "<div ").replace(/<\/motion>/g, "</div>");

if (!html.includes(payBlockDiv)) {
  console.error("pay block not found");
  process.exit(1);
}

html = html.replace(payBlockDiv, "");

const insertAfter = '<div id="booking-result" class="form-result"></div>';
const payInsert = `${insertAfter}

                            <div class="panel booking-pay-panel">
                                <h4 class="booking-block-title">Оплата выбранной брони</h4>
                                <div class="form-grid pay-form-compact">
                                    <label>Карта <input id="pay-card" inputmode="numeric" placeholder="0000 0000 0000 0000"></label>
                                    <label>Срок <input id="pay-exp" placeholder="12/30"></label>
                                    <label>CVC <input id="pay-cvc" inputmode="numeric" placeholder="123"></label>
                                    <button class="btn btn-primary" id="pay-now-btn" type="button">Оплатить</button>
                                </div>
                                <div id="pay-result" class="muted"></div>
                            </motion>`;

html = html.replace(insertAfter, payInsert.replace(/<\/motion>/g, "</div>"));

html = html.replace(
  'id="booking-service-lines" class="cards compact-cards"',
  'id="booking-service-lines" class="booking-service-lines"'
);

html = html.replace(/style\.css\?v=\d+/, "style.css?v=22");
html = html.replace(/app\.js\?v=\d+/, "app.js?v=27");

fs.writeFileSync(htmlPath, html);
console.log("html ok");
