// Máy chủ thử cục bộ: phục vụ thư mục dist và chạy /api/submit-nomination thật, nhưng thay Google Sheet bằng
// trình giả lập chạy NGUYÊN VĂN apps-script/Code.gs. Không gọi ra Internet, không đụng dữ liệu thật.
// Chạy: npm run build && node tools/dev-server.mjs   (mặc định http://localhost:8730)
// Điều khiển lỗi: GET /__dev/mode?m=ok|down|html|riengtu   (down = Google không trả lời, html = trả trang lỗi, riengtu = bảng đang chia sẻ công khai)
// Xem dữ liệu giả lập: GET /__dev/rows
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler } from '../api/submit-nomination.js';
import { taoMoiTruong } from '../tests/helpers/gas-emulator.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '..', process.env.SERVE_DIR || 'dist');
const PORT = Number(process.env.PORT || 8730);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

const gas = taoMoiTruong();
let mode = 'ok';
const fetchFn = async (url, init) => {
  if (mode === 'down') throw new Error('Google không trả lời (giả lập)');
  if (mode === 'html') return { status: 200, text: async () => '<html><body>Lỗi của Google (giả lập)</body></html>' };
  gas.trangThaiDrive.file = mode === 'riengtu' ? 'ANYONE_WITH_LINK' : 'PRIVATE';
  gas.boNho.clear();
  gas.dongHo.now = Date.now();
  return { status: 200, text: async () => JSON.stringify(gas.goi(JSON.parse(init.body))) };
};
const handler = createHandler({ env: { VTF_GOOGLE_SHEET_WEBHOOK: 'https://script.google.com/macros/s/AKfycbzDEV_0123456789abcdefghij/exec' }, fetchFn });

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/__dev/mode') { mode = u.searchParams.get('m') || 'ok'; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ mode })); }
  if (u.pathname === '/__dev/rows') { res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.end(JSON.stringify({ goc: gas.sheets['Tất cả hồ sơ'].rows, nhatKy: gas.sheets['Nhật ký'].rows }, null, 1)); }
  if (u.pathname === '/api/submit-nomination') {
    const parts = []; for await (const d of req) parts.push(d);
    const raw = Buffer.concat(parts).toString('utf8');
    let body; try { body = raw ? JSON.parse(raw) : undefined; } catch { body = raw; }
    const shim = { status(c) { res.statusCode = c; return shim; }, setHeader: (k, v) => res.setHeader(k, v), json(o) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); return shim; }, end() { res.end(); return shim; } };
    return handler({ method: req.method, headers: req.headers, body, socket: req.socket }, shim);
  }
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  let f = path.normalize(path.join(DIST, p));
  if (!f.startsWith(DIST)) { res.statusCode = 403; return res.end(); }
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) f = path.join(DIST, 'index.html'); // ứng dụng một trang
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`Máy chủ thử VTF30: http://localhost:${PORT}/`));
