import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();
const out = path.join(root, 'public', 'tinh-diem', 'index.html');
const { buildHtml } = await import('../tools/tinh-diem/build.mjs');
const RULES = require('../tools/tinh-diem/src/rules-036.cjs');

test('Tệp public/tinh-diem/index.html khớp đúng mã nguồn (chạy "npm run build:tinh-diem" nếu lệch)', () => {
  assert.equal(fs.existsSync(out), true, 'Chưa có public/tinh-diem/index.html');
  const dung = buildHtml();
  const hienCo = fs.readFileSync(out, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(hienCo === dung, true, 'public/tinh-diem/index.html đã cũ so với tools/tinh-diem/src. Chạy: npm run build:tinh-diem');
});

test('Tệp một-mình chạy được khi mở bằng file://: không type=module, không tài nguyên ngoài, không còn dấu mốc chưa thay', () => {
  const html = fs.readFileSync(out, 'utf8');
  assert.equal(/type\s*=\s*["']module["']/i.test(html), false, 'không được dùng type="module" (Chrome chặn khi mở file://)');
  assert.equal(/<script[^>]+\bsrc\s*=/i.test(html), false, 'không được nạp script ngoài');
  assert.equal(/<link[^>]+rel\s*=\s*["']?(stylesheet|preload|modulepreload)/i.test(html), false, 'không được nạp CSS/phông ngoài');
  assert.equal(/@import\s|url\(\s*["']?https?:/i.test(html), false, 'CSS không được gọi tài nguyên ngoài');
  assert.equal(/\/\*__[A-Z]+__\*\//.test(html), false, 'còn dấu mốc chưa thay');
  const ngoai = [...html.matchAll(/\b(?:href|src)\s*=\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  for (const u of ngoai) assert.match(u, /^https:\/\/vtf30\.tkdai\.vn\//, 'liên kết ngoài lạ: ' + u);
  assert.ok(Buffer.byteLength(html) < 400 * 1024, 'tệp quá lớn');
});

test('Mọi khối <script> đều biên dịch được và chạy được trong môi trường trình duyệt giả (không ném lỗi khi nạp)', () => {
  const html = fs.readFileSync(out, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 7); // rules, engine, history, xlsx, backup, store, ui
  scripts.forEach((s, i) => assert.doesNotThrow(() => new vm.Script(s), `script ${i} lỗi cú pháp`));
  // Nạp theo thứ tự trong cùng một "window" giả có DOM tối thiểu; ui.js chờ DOMContentLoaded nên chỉ kiểm việc nạp.
  const noop = () => {};
  const el = () => ({ addEventListener: noop, appendChild: noop, setAttribute: noop, classList: { add: noop, remove: noop, toggle: noop }, style: {}, querySelector: () => null, querySelectorAll: () => [] });
  const win = { document: { readyState: 'loading', addEventListener: noop, getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], createElement: el, createTextNode: () => ({}) },
    addEventListener: noop, location: { protocol: 'file:' }, navigator: {}, indexedDB: undefined, TextEncoder, TextDecoder, Blob, Response };
  win.window = win; win.globalThis = win;
  const ctx = vm.createContext(win);
  for (const s of scripts) vm.runInContext(s, ctx);
  for (const k of ['VTF_RULES', 'VTF_ENGINE', 'VTF_HISTORY', 'VTF_XLSX', 'VTF_BACKUP', 'VTF_STORE_API']) assert.ok(win[k], `thiếu ${k} sau khi nạp`);
});

test('Bảng tiêu chí hiển thị lấy từ cùng bộ quy tắc: đủ văn bản quy tắc, quy trình và quy ước', () => {
  assert.equal(RULES.quyTac.length, 4);
  assert.equal(RULES.quyTrinh.length, 3);
  assert.ok(RULES.quyUoc.length >= 7);
  for (const t of [...RULES.quyTac, ...RULES.quyTrinh, ...RULES.quyUoc]) assert.ok(typeof t === 'string' && t.length > 20);
  const ui = fs.readFileSync(path.join(root, 'tools', 'tinh-diem', 'src', 'ui.js'), 'utf8');
  for (const k of ['R.quyTac', 'R.quyTrinh', 'R.quyUoc', 'R.heA.giai', 'R.heB.truc4.vaiTro', 'R.hang']) assert.ok(ui.includes(k), `Bảng tiêu chí chưa dùng ${k}`);
});

test('Trang chủ có liên kết tới /tinh-diem/index.html và không đổi các điểm vào cũ', () => {
  const tsx = fs.readFileSync(path.join(root, 'src', 'components', 'InteractiveBoosters.tsx'), 'utf8');
  assert.ok(tsx.includes('href="/tinh-diem/index.html"'));
  assert.ok(tsx.includes('Máy tính chấm điểm chi tiết'));
  assert.ok(tsx.includes("onApplyScoreToForm"), 'nút "Đẩy kết quả vào hồ sơ đề cử" cũ phải còn');
});

test('Sau khi build Vite, dist/tinh-diem/index.html giống bản nguồn (bỏ qua nếu chưa build)', (t) => {
  const d = path.join(root, 'dist', 'tinh-diem', 'index.html');
  if (!fs.existsSync(d)) { t.skip('chưa có dist'); return; }
  assert.equal(fs.readFileSync(d, 'utf8'), fs.readFileSync(out, 'utf8'));
});
