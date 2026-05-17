import fs from "fs";
import path from "path";

const p = path.join(process.cwd(), "wwwroot", "js", "app.js");
let s = fs.readFileSync(p, "utf8");

const start = s.indexOf("        card.innerHTML = `");
const end = s.indexOf("        lines.appendChild(card);", start);
if (start < 0 || end < 0) {
  console.error("block not found", start, end);
  process.exit(1);
}

const replacement = `        row.innerHTML = \`
            <div class="service-line-info">
                <motion class="service-line-title">\${escapeHtml(title)}</div>
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
        lines.appendChild(row);`;

let rep = replacement.replace(/<motion /g, "<div ").replace(/<\/motion>/g, "</motion>").replace(/<\/motion>/g, "</motion>");
rep = rep.replace(/<\/motion>/g, "</motion>");
// fix wrong replacements
rep = rep.replace('<div class="service-line-title">', '<div class="service-line-title">');
rep = rep.replace('</motion>', '</div>').replace('</motion>', '</motion>');
// simpler - write correct from scratch
const repFixed = `        row.innerHTML = \`
            <motion class="service-line-info">
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
        lines.appendChild(row);`;

const finalRep = repFixed.replace(/<motion /g, "<div ").replace(/<\/motion>/g, "</div>");

s = s.slice(0, start) + finalRep + s.slice(end + "        lines.appendChild(card);".length);
fs.writeFileSync(p, s);
console.log("ok");
