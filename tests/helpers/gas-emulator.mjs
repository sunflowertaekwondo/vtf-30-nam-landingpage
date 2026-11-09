// Giả lập tối thiểu môi trường Google Apps Script để chạy NGUYÊN VĂN apps-script/Code.gs trong Node.
// Chỉ giả lập các hàm mà đường nhận hồ sơ (doPost, doGet, nhanHoSo_) dùng. Phần dựng giao diện Sheet (thietLap) thì
// được kiểm trên Google Sheet thật bằng kiemThuToanBo().
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CODE = fs.readFileSync(path.join(HERE, '..', '..', 'apps-script', 'Code.gs'), 'utf8');

class Sheet {
  constructor(ten, maxRows = 1000, dau = []) { this.ten = ten; this.rows = dau.map((d) => [...d]); this.formulas = new Map(); this.maxRows = maxRows; this.chen = 0; }
  getLastRow() { return this.rows.length; }
  getMaxRows() { return this.maxRows; }
  insertRowsAfter(_, n) { this.maxRows += n; this.chen++; }
  appendRow(arr) { this.rows.push([...arr]); }
  deleteRows(start, n) { this.rows.splice(start - 1, n); }
  getRange(r, c, nr = 1, nc = 1) {
    const sh = this;
    if (r + nr - 1 > sh.maxRows) throw new Error('Toạ độ nằm ngoài kích thước trang tính');
    return {
      getRow: () => r,
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (sh.rows[r - 1 + i] || [])[c - 1 + j] ?? '')),
      getValue: () => (sh.rows[r - 1] || [])[c - 1] ?? '',
      setValues: (vals) => { for (let i = 0; i < nr; i++) { sh.rows[r - 1 + i] = sh.rows[r - 1 + i] || []; for (let j = 0; j < nc; j++) sh.rows[r - 1 + i][c - 1 + j] = vals[i][j]; } for (let i = 0; i < r - 1; i++) sh.rows[i] = sh.rows[i] || []; },
      setFormula: (f) => { sh.formulas.set(`${r}:${c}`, f); },
      getFormula: () => sh.formulas.get(`${r}:${c}`) || '',
      createTextFinder: (text) => {
        let entire = false, matchCase = false;
        const tf = {
          matchEntireCell(v) { entire = v; return tf; },
          matchCase(v) { matchCase = v; return tf; },
          findNext() {
            for (let i = 0; i < nr; i++) {
              const v = String((sh.rows[r - 1 + i] || [])[c - 1] ?? '');
              const a = matchCase ? v : v.toLowerCase(), b = matchCase ? text : String(text).toLowerCase();
              if (entire ? a === b : a.includes(b)) return { getRow: () => r + i };
            }
            return null;
          },
        };
        return tf;
      },
    };
  }
}

export function taoMoiTruong({ rieng = true, choPhepCha = true } = {}) {
  const dongHo = { now: Date.UTC(2026, 10, 9, 3, 0, 0) }; // 09/11/2026 10:00 giờ Việt Nam
  class NgayGia extends Date {
    constructor(...a) { if (a.length) super(...a); else super(dongHo.now); }
    static now() { return dongHo.now; }
  }
  const thuocTinh = new Map();
  const boNho = new Map();
  // bảng thật có dòng 1 là tiêu đề, hồ sơ đầu tiên nằm ở dòng 2
  const sheets = { 'Tất cả hồ sơ': new Sheet('Tất cả hồ sơ', 1000, [['Mã hồ sơ', 'Thời gian nhận']]), 'Nhật ký': new Sheet('Nhật ký') };
  const trangThaiDrive = { file: rieng ? 'PRIVATE' : 'ANYONE_WITH_LINK', cha: choPhepCha ? 'PRIVATE' : 'ANYONE_WITH_LINK' };
  const log = [];
  const sandbox = {
    Date: NgayGia, JSON, Math, Object, Array, String, Number, Error, RegExp, isFinite, parseInt, parseFloat,
    Logger: { log: (s) => log.push(s) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (thuocTinh.has(k) ? thuocTinh.get(k) : null), setProperty: (k, v) => thuocTinh.set(k, String(v)) }) },
    CacheService: { getScriptCache: () => ({ get: (k) => boNho.get(k) ?? null, put: (k, v) => boNho.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    DriveApp: {
      Access: { PRIVATE: 'PRIVATE', ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' },
      getFileById: () => ({
        getSharingAccess: () => trangThaiDrive.file,
        getParents: () => { let da = false; return { hasNext: () => !da, next: () => { da = true; return { getSharingAccess: () => trangThaiDrive.cha }; } }; },
      }),
    },
    SpreadsheetApp: { flush() {}, openById: () => ({ getSheetByName: (t) => sheets[t] || null }) },
    Utilities: {
      formatDate: (d, tz, fmt) => {
        const g = new Date(d.getTime() + 7 * 3600 * 1000);
        const p = (n, k = 2) => String(n).padStart(k, '0');
        const map = { yyyy: g.getUTCFullYear(), MM: p(g.getUTCMonth() + 1), dd: p(g.getUTCDate()), HH: p(g.getUTCHours()), mm: p(g.getUTCMinutes()) };
        return fmt.replace(/yyyy|MM|dd|HH|mm/g, (m) => map[m]);
      },
      computeHmacSha256Signature: (v, key) => [...crypto.createHmac('sha256', key).update(v).digest()].map((b) => (b > 127 ? b - 256 : b)),
      getUuid: () => crypto.randomUUID(),
      sleep() {},
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ noiDung: s, setMimeType() { return this; }, getContent() { return s; } }) },
  };
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox, { filename: 'Code.gs' });
  const chay = (code) => vm.runInContext(code, sandbox);
  thuocTinh.set('SHEET_ID', 'sheet-gia');
  thuocTinh.set('MUOI', 'muoi-thu-nghiem-0123456789');
  const goi = (body) => JSON.parse(sandbox.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).getContent());
  return { sandbox, chay, goi, sheets, thuocTinh, boNho, dongHo, trangThaiDrive, log, doGet: () => JSON.parse(sandbox.doGet({}).getContent()) };
}

/** Một hồ sơ hợp lệ (Hệ A, 85 điểm) để các bài kiểm thử sửa đổi từng phần. */
export function hoSoMau(ghiDe = {}) {
  return {
    requestId: 'req-' + crypto.randomUUID().replace(/-/g, ''),
    fullName: 'Nguyễn Văn Thử', phone: '0909 123 456', email: 'thu@example.com', organization: 'Liên đoàn Taekwondo TP. Thử',
    submissionType: 'nomination_a', submissionTypeLabel: 'bị bỏ qua', yearsContributed: 18,
    scoreClaimed: 85, scoreServer: 85, scoreAxes: [45, 20, 15, 5], scoreDetail: { he: 'A', medal: 45, accumulated: 20, years: 18, training: 0, management: 5 }, scoreCheck: 'Khớp',
    message: 'HCV Châu Á 2024, nhiều năm huấn luyện đội tuyển tỉnh.', photoAlbumUrl: 'https://drive.google.com/drive/folders/abc', photoCaptions: '2019 - SEA Games', consent: true,
    ...ghiDe,
  };
}
