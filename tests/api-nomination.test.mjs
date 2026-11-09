import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, diaChiHopLe } from '../api/submit-nomination.js';
import { chuanHoaHoSo, chuanSdt } from '../api/_lib/ho-so.js';

const URL_SHEET = 'https://script.google.com/macros/s/AKfycbzTEST_0123456789abcdefghij/exec';
let ipN = 0;
const ip = () => `10.1.0.${++ipN}`;

function fakeRes() {
  const r = { code: 200, headers: {}, body: null, setHeader(k, v) { r.headers[k.toLowerCase()] = v; }, status(c) { r.code = c; return r; }, json(o) { r.body = o; return r; }, end() { return r; } };
  return r;
}
async function goi(handler, { method = 'POST', body, ipAddr } = {}) {
  const res = fakeRes();
  await handler({ method, body, headers: { 'x-forwarded-for': ipAddr || ip() }, socket: { remoteAddress: '1.1.1.1' } }, res);
  return res;
}
const phanHoi = (obj, status = 200) => ({ status, text: async () => (typeof obj === 'string' ? obj : JSON.stringify(obj)) });
/** Apps Script giả: ghi lại mọi lần gọi, trả lời theo kịch bản. */
function sheetGia(...kichBan) {
  const goiDen = [];
  const fetchFn = async (url, init) => {
    goiDen.push({ url, init, body: JSON.parse(init.body) });
    const k = kichBan[Math.min(goiDen.length - 1, kichBan.length - 1)];
    if (typeof k === 'function') return k(goiDen.length);
    return phanHoi(k);
  };
  return { fetchFn, goiDen };
}
const dongY = { ok: true, id: 'VTF30-0007', receipt: 'VTF-ABCDEF1234', savedAt: '2026-11-09T03:00:00.000Z', trung: false };
const taoHandler = (sheet, env = { VTF_GOOGLE_SHEET_WEBHOOK: URL_SHEET }) => createHandler({ env, fetchFn: sheet.fetchFn });

const chiTietA = { he: 'A', medal: 45, accumulated: 20, years: 18, training: 10, management: 5 }; // 45 + 20 + 15 + 15 = 95
const hoSo = (ghiDe = {}) => ({
  requestId: 'abcdefghijklmnop1234', fullName: 'Nguyễn Văn Thử', phone: '+84 909 123 456', email: 'thu@example.com', organization: 'Liên đoàn TKD TP. Thử',
  submissionType: 'nomination_a', submissionTypeLabel: 'NHÃN GIẢ DO TRÌNH DUYỆT', yearsContributed: 18, estimatedScore: 95, estimatedRank: 'HẠNG ĐẶC BIỆT', scoreDetail: chiTietA,
  messageOrAchievement: 'HCV Châu Á 2024, huấn luyện đội tuyển tỉnh nhiều năm.', photoAlbumUrl: 'https://drive.google.com/drive/folders/x', photoCaptions: '2019', consentAccepted: true, ...ghiDe,
});

test('OPTIONS trả 204; GET và các phương thức khác trả 405 và KHÔNG trả danh sách hồ sơ nào', async () => {
  const s = sheetGia(dongY);
  const h = taoHandler(s);
  assert.equal((await goi(h, { method: 'OPTIONS' })).code, 204);
  for (const m of ['GET', 'PUT', 'DELETE']) {
    const r = await goi(h, { method: m });
    assert.equal(r.code, 405);
    assert.equal(r.body.ok, false);
    assert.ok(!('submissions' in r.body) && !('count' in r.body));
    assert.equal(r.headers.allow, 'POST, OPTIONS');
  }
  assert.equal(s.goiDen.length, 0);
});

test('Hồ sơ hợp lệ: ghi qua Sheet, trả mã hồ sơ + mã biên nhận; gửi sang Sheet bản đã chuẩn hóa, nhãn và điểm do máy chủ đặt', async () => {
  const s = sheetGia(dongY);
  const r = await goi(taoHandler(s), { body: hoSo() });
  assert.equal(r.code, 200);
  assert.deepEqual(r.body, { ok: true, id: 'VTF30-0007', serverReceiptHash: 'VTF-ABCDEF1234', savedAt: '2026-11-09T03:00:00.000Z', duplicate: false });
  assert.equal(r.headers['cache-control'], 'no-store');
  assert.equal(s.goiDen.length, 1);
  assert.equal(s.goiDen[0].url, URL_SHEET);
  assert.equal(s.goiDen[0].init.method, 'POST');
  const g = s.goiDen[0].body;
  assert.equal(g.action, 'submit');
  const b = g.record;
  assert.equal(b.phone, '0909123456');
  assert.equal(b.submissionTypeLabel, 'Đề cử Hệ A – Thành tích Đỉnh cao (036/VTF)');
  assert.equal(b.scoreServer, 95);
  assert.equal(b.scoreClaimed, 95);
  assert.deepEqual(b.scoreAxes, [45, 20, 15, 15]);
  assert.equal(b.scoreCheck, 'Khớp');
  assert.deepEqual(b.scoreDetail, chiTietA);
  assert.equal(b.requestId, 'abcdefghijklmnop1234');
  assert.ok(!('estimatedRank' in b) && !('submissionTypeLabel' in b && b.submissionTypeLabel.includes('GIẢ')));
});

test('Điểm lệch: máy chủ dùng điểm tự tính lại, không dùng điểm trình duyệt gửi, và gắn cờ LỆCH', async () => {
  const s = sheetGia(dongY);
  await goi(taoHandler(s), { body: hoSo({ estimatedScore: 100 }) });
  const b = s.goiDen[0].body.record;
  assert.equal(b.scoreServer, 95);
  assert.equal(b.scoreClaimed, 100);
  assert.equal(b.scoreCheck, 'LỆCH');
});

test('Không có chi tiết chấm điểm: không có điểm máy chủ (điểm người nộp chỉ để đối chiếu)', async () => {
  const s = sheetGia(dongY);
  await goi(taoHandler(s), { body: hoSo({ scoreDetail: undefined }) });
  const b = s.goiDen[0].body.record;
  assert.deepEqual([b.scoreServer, b.scoreAxes, b.scoreDetail, b.scoreCheck, b.scoreClaimed], [null, null, null, 'Không có chi tiết', 95]);
});

test('Chấm theo Hệ B nhưng nộp hạng mục Hệ A: gắn cờ "Sai hệ", không ghi điểm', async () => {
  const s = sheetGia(dongY);
  await goi(taoHandler(s), { body: hoSo({ scoreDetail: { he: 'B', years: 30, club: 20, system: 10, athletes: 10, coaches: 10, role1: 15, role2: 5 } }) });
  const b = s.goiDen[0].body.record;
  assert.deepEqual([b.scoreServer, b.scoreClaimed, b.scoreAxes, b.scoreCheck], [null, null, null, 'Sai hệ']);
});

test('Chi tiết chấm điểm bị sửa (giá trị ngoài danh sách): gắn cờ, không ghi điểm', async () => {
  const s = sheetGia(dongY);
  await goi(taoHandler(s), { body: hoSo({ scoreDetail: { ...chiTietA, medal: 99 }, estimatedScore: 100 }) });
  const b = s.goiDen[0].body.record;
  assert.deepEqual([b.scoreServer, b.scoreCheck, b.scoreDetail], [null, 'Chi tiết không hợp lệ', null]);
});

test('Hồ sơ không phải đề cử (Gala, Kỷ yếu, Bản Vàng): bỏ hết điểm dù trình duyệt gửi kèm', async () => {
  const s = sheetGia(dongY);
  await goi(taoHandler(s), { body: hoSo({ submissionType: 'gala_registration' }) });
  const b = s.goiDen[0].body.record;
  assert.deepEqual([b.scoreServer, b.scoreClaimed, b.scoreAxes, b.scoreDetail, b.scoreCheck], [null, null, null, null, '']);
  assert.equal(b.submissionTypeLabel, 'Đăng ký Đại biểu tham dự Đêm Gala 19/12/2026');
});

test('Dữ liệu sai: trả 400 kèm lý do, KHÔNG gọi sang Sheet', async () => {
  const xau = [
    { fullName: 'ab' }, { phone: '12345' }, { email: 'sai' }, { organization: '   ' }, { messageOrAchievement: 'ngắn' }, { consentAccepted: false },
    { submissionType: 'khac' }, { submissionType: 'constructor' }, { photoAlbumUrl: 'ftp://x' }, { yearsContributed: 500 }, { requestId: 'không hợp lệ!!' },
  ];
  for (const g of xau) {
    const s = sheetGia(dongY);
    const r = await goi(taoHandler(s), { body: hoSo(g) });
    assert.equal(r.code, 400, JSON.stringify(g));
    assert.equal(r.body.code, 'khong_hop_le');
    assert.ok(r.body.loi.length >= 1);
    assert.equal(s.goiDen.length, 0);
  }
  for (const body of [null, 'khong phai json', [], 42]) {
    const s = sheetGia(dongY);
    assert.equal((await goi(taoHandler(s), { body })).code, 400);
    assert.equal(s.goiDen.length, 0);
  }
});

test('Thân yêu cầu là chuỗi JSON vẫn đọc được', async () => {
  const s = sheetGia(dongY);
  assert.equal((await goi(taoHandler(s), { body: JSON.stringify(hoSo()) })).code, 200);
});

test('Ô bẫy ghi_chu_noi_bo_vtf bị điền: từ chối, không ghi', async () => {
  const s = sheetGia(dongY);
  const r = await goi(taoHandler(s), { body: hoSo({ ghi_chu_noi_bo_vtf: 'http://spam.example' }) });
  assert.equal(r.code, 400);
  assert.equal(s.goiDen.length, 0);
});

test('Thiếu hoặc sai biến môi trường: báo bảo trì 503, không gọi đi đâu, không báo thành công', async () => {
  for (const env of [{}, { VTF_GOOGLE_SHEET_WEBHOOK: '' }, { VTF_GOOGLE_SHEET_WEBHOOK: 'http://evil.example/exec' }, { VTF_GOOGLE_SHEET_WEBHOOK: 'https://script.google.com.evil.example/macros/s/AKfycbzTEST_0123456789abcdefghij/exec' }, { VTF_GOOGLE_SHEET_WEBHOOK: 'https://example.com/macros/s/AKfycbzTEST_0123456789abcdefghij/exec' }]) {
    const s = sheetGia(dongY);
    const r = await goi(taoHandler(s, env), { body: hoSo() });
    assert.equal(r.code, 503, JSON.stringify(env));
    assert.equal(r.body.ok, false);
    assert.equal(r.body.code, 'chua_cau_hinh');
    assert.equal(s.goiDen.length, 0);
  }
  assert.equal(diaChiHopLe(URL_SHEET), true);
  assert.equal(diaChiHopLe(URL_SHEET + '?x=1'), false);
});

test('Sheet từ chối (bảng công khai, chưa thiết lập, lỗi nội bộ): trả 502, tuyệt đối không báo thành công', async () => {
  for (const kb of [{ ok: false, loi: 'bang_cong_khai' }, { ok: false, loi: 'chua_thiet_lap' }, { ok: false, loi: 'noi_bo' }, { ok: false, loi: 'sdt' }, '<html>Lỗi của Google</html>']) {
    const s = sheetGia(kb);
    const r = await goi(taoHandler(s), { body: hoSo() });
    assert.equal(r.code, 502, JSON.stringify(kb));
    assert.equal(r.body.ok, false);
    assert.equal(r.body.code, 'luu_that_bai');
    assert.match(r.body.thongBao, /chưa lưu được hồ sơ/);
    assert.ok(!('id' in r.body));
  }
});

test('Lỗi mạng lần đầu rồi thành công lần hai: ghi nhận, và lần gửi lại mang cùng mã yêu cầu (không ghi trùng)', async () => {
  const s = sheetGia(() => { throw new Error('mạng đứt'); }, dongY);
  const r = await goi(taoHandler(s), { body: hoSo() });
  assert.equal(r.code, 200);
  assert.equal(s.goiDen.length, 2);
  assert.equal(s.goiDen[0].body.record.requestId, s.goiDen[1].body.record.requestId);
});

test('Sheet báo bận (thuLai) lần đầu rồi ghi được: thành công sau khi thử lại', async () => {
  const s = sheetGia({ ok: false, loi: 'ban', thuLai: true }, dongY);
  const r = await goi(taoHandler(s), { body: hoSo() });
  assert.equal(r.code, 200);
  assert.equal(s.goiDen.length, 2);
});

test('Lỗi mạng cả hai lần: trả 502', async () => {
  const s = sheetGia(() => { throw new Error('mạng đứt'); });
  const r = await goi(taoHandler(s), { body: hoSo() });
  assert.equal(r.code, 502);
  assert.equal(s.goiDen.length, 2);
});

test('Sheet báo đã có hồ sơ này (gửi lại cùng mã yêu cầu): vẫn thành công, đánh dấu duplicate', async () => {
  const s = sheetGia({ ...dongY, trung: true });
  const r = await goi(taoHandler(s), { body: hoSo() });
  assert.equal(r.code, 200);
  assert.equal(r.body.duplicate, true);
  assert.equal(r.body.id, 'VTF30-0007');
});

test('Trình duyệt cũ không gửi mã yêu cầu: máy chủ tự sinh mã hợp lệ', async () => {
  const s = sheetGia(dongY);
  const r = await goi(taoHandler(s), { body: hoSo({ requestId: undefined }) });
  assert.equal(r.code, 200);
  assert.match(s.goiDen[0].body.record.requestId, /^srv-[0-9a-f]{32}$/);
});

test('Giới hạn theo IP: hồ sơ thứ 9 trong 10 phút bị từ chối 429; IP khác không bị ảnh hưởng; hết cửa sổ thì gửi lại được', async () => {
  let t = 1_000_000;
  const s = sheetGia(dongY);
  const h = createHandler({ env: { VTF_GOOGLE_SHEET_WEBHOOK: URL_SHEET }, fetchFn: s.fetchFn, now: () => t });
  const A = '10.9.9.9';
  for (let i = 0; i < 8; i++) assert.equal((await goi(h, { body: hoSo(), ipAddr: A })).code, 200);
  const r = await goi(h, { body: hoSo(), ipAddr: A });
  assert.equal(r.code, 429);
  assert.equal(r.body.code, 'qua_nhieu');
  assert.equal((await goi(h, { body: hoSo(), ipAddr: '10.9.9.10' })).code, 200);
  t += 10 * 60 * 1000 + 1;
  assert.equal((await goi(h, { body: hoSo(), ipAddr: A })).code, 200);
});

test('Nhật ký lỗi của máy chủ không chứa thông tin cá nhân', async () => {
  const dong = [];
  const goc = console.error;
  console.error = (...a) => dong.push(a.join(' '));
  try {
    const s = sheetGia({ ok: false, loi: 'noi_bo' });
    await goi(taoHandler(s), { body: hoSo({ fullName: 'Trần Thị Bí Mật', phone: '0987654321', email: 'bimat@example.com', messageOrAchievement: 'Nội dung rất riêng tư của hồ sơ này' }) });
  } finally { console.error = goc; }
  assert.ok(dong.length >= 1);
  const tat = dong.join('\n');
  for (const nhay of ['Bí Mật', '0987654321', 'bimat@', 'riêng tư']) assert.ok(!tat.includes(nhay), `nhật ký lộ: ${nhay}`);
});

test('chuanHoaHoSo: cắt độ dài, bỏ ký tự điều khiển, giữ nguyên nội dung hợp lệ', () => {
  const r = chuanHoaHoSo(hoSo({ fullName: '  Nguyễn\u0000 Văn\u0007 Thử  ', messageOrAchievement: 'x'.repeat(9000), photoCaptions: 'c'.repeat(2000) }), () => 'zzzzzzzzzzzzzzzzzz');
  assert.equal(r.ok, true);
  assert.equal(r.banGhi.fullName, 'Nguyễn Văn Thử');
  assert.equal(r.banGhi.message.length, 4000);
  assert.equal(r.banGhi.photoCaptions.length, 600);
});

test('chuanSdt', () => {
  assert.equal(chuanSdt('+84 912 345 678'), '0912345678');
  assert.equal(chuanSdt('0912.345.678'), '0912345678');
  for (const x of ['', '123', '1912345678', '09123456789012', 'abc', null, undefined, '+8591234567']) assert.equal(chuanSdt(x), null, String(x));
});
