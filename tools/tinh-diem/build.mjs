// Ghép các tệp nguồn của máy tính điểm thành MỘT tệp HTML tự đủ: public/tinh-diem/index.html
// Không CDN, không type=module (để bấm đúp mở bằng file:// vẫn chạy). Đầu ra ổn định (không có ngày giờ) để kiểm tra khớp nguồn.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = (f) => fs.readFileSync(path.join(here, 'src', f), 'utf8').replace(/\r\n/g, '\n');

export function buildHtml() {
  const parts = {
    '/*__CSS__*/': { text: src('style.css'), bad: '</style' },
    '/*__RULES__*/': { text: src('rules-036.cjs'), bad: '</script' },
    '/*__ENGINE__*/': { text: src('engine.cjs'), bad: '</script' },
    '/*__HISTORY__*/': { text: src('history.cjs'), bad: '</script' },
    '/*__XLSX__*/': { text: src('xlsx.cjs'), bad: '</script' },
    '/*__BACKUP__*/': { text: src('backup.cjs'), bad: '</script' },
    '/*__STORE__*/': { text: src('store.cjs'), bad: '</script' },
    '/*__UI__*/': { text: src('ui.js'), bad: '</script' },
  };
  let html = src('template.html');
  for (const [marker, { text, bad }] of Object.entries(parts)) {
    if (text.toLowerCase().includes(bad)) throw new Error(`Tệp nguồn chứa "${bad}", sẽ làm vỡ trang ghép.`);
    if (!html.includes(marker)) throw new Error(`Thiếu ${marker} trong template.html`);
    html = html.replace(marker, () => text.trimEnd());
  }
  return html;
}

export const OUTPUT = path.resolve(here, '..', '..', 'public', 'tinh-diem', 'index.html');

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = buildHtml();
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, html, 'utf8');
  console.log(`Đã ghép ${OUTPUT} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
}
