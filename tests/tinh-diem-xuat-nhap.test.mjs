import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { evaluate } = require('../tools/tinh-diem/src/engine.cjs');
const H = require('../tools/tinh-diem/src/history.cjs');
const B = require('../tools/tinh-diem/src/backup.cjs');
const X = require('../tools/tinh-diem/src/xlsx.cjs');
const { createStore } = require('../tools/tinh-diem/src/store.cjs');

/* ---------- Dữ liệu mẫu ---------- */
const nen = (soNam) => ({ soNam, soNamSoVanBan: 'QĐ 12/2020', soNamCoMinhChung: true, vaiTroNen: ['hlv', 'bch'], vaiTroNenSoVanBan: 'QĐ bổ nhiệm', vaiTroNenMinhChung: true, viPhamKyLuat: false });
const mc = (muc, so = 'QĐ 1') => ({ muc, soVanBan: so, minhChung: true });
function hoSoB(hoTen, donVi, soNam, extra = {}) {
  return {
    he: 'B', thongTin: { hoTen, donVi, vaiTroChinh: 'HLV', ngayCham: '2026-11-07', nguoiCham: 'Cán bộ A', ghiChu: 'Ghi chú thử' },
    nen: nen(soNam), dauAn: { chon: ['xay_dung_phong_trao'], soVanBan: 'Bằng khen', minhChung: true }, vaiTro: [], ...extra,
  };
}
const tao = (ho, now, id) => H.createRecord({ id, input: ho, ketQua: evaluate(ho), nguoiCham: ho.thongTin.nguoiCham, now });
function boMau() {
  const a = tao(hoSoB('Nguyễn Đình Đức', 'Đà Nẵng', 35, { clb: mc('clb_100'), heThong: mc('xay_dung_tinh'), daoTaoVdv: mc('vdv_quoc_te'), daoTaoHlv: mc('hlv_10'), vaiTro: [{ id: 'ubch_qg', soVanBan: 'QĐ 99', minhChung: true }] }), '2026-11-01T01:00:00Z', 'hs-a');
  const hoA2 = hoSoB('Hoàng Thị Mai', 'Hà Nội', 6);
  const b0 = tao(hoA2, '2026-11-02T01:00:00Z', 'hs-b');
  const b = H.lock(H.addVersion(b0, { input: hoSoB('Hoàng Thị Mai', 'Hà Nội', 12), ketQua: evaluate(hoSoB('Hoàng Thị Mai', 'Hà Nội', 12)), nguoiCham: 'Cán bộ A', lyDo: 'Bổ sung minh chứng', now: '2026-11-03T01:00:00Z' }), { nguoi: 'Cán bộ A', now: '2026-11-04T01:00:00Z' });
  const c = tao({ he: 'A', thongTin: { hoTen: '=cmd|"/c calc"!A1', donVi: '-Đơn vị', ngayCham: '2026-11-05', nguoiCham: 'C', ghiChu: '' }, nen: nen(10), thanhTich: [{ giai: 'sea_games', huyChuong: 'HCV', nam: 2019, minhChung: true, soVanBan: 'KQ SEA' }] }, '2026-11-05T01:00:00Z', 'hs-c');
  return [a, b, c];
}

/* ---------- Bảng và CSV ---------- */
test('Bảng tổng hợp: một dòng mỗi hồ sơ, số liệu khớp kết quả tính', () => {
  const recs = boMau();
  const t = B.bangTongHop(recs);
  assert.equal(t.length, 4);
  const cot = t[0];
  const dong = t[1];
  assert.equal(dong[cot.indexOf('Họ và tên')], 'Nguyễn Đình Đức');
  assert.equal(dong[cot.indexOf('Tổng điểm')], recs[0].versions[0].ketQua.tong);
  assert.equal(dong[cot.indexOf('Hạng')], 'Hạng Đặc biệt');
  assert.equal(t[2][cot.indexOf('Phiên bản')], 2);
  assert.equal(t[2][cot.indexOf('Trạng thái')], 'Đã chốt');
  assert.equal(dong[cot.indexOf('Tiêu chí áp dụng')], '036/VTF-2026-04-04');
  const tongTruc = ['Điểm Trục 1', 'Điểm Trục 2', 'Điểm Trục 3', 'Điểm Trục 4'].reduce((s, k) => s + dong[cot.indexOf(k)], 0);
  assert.equal(tongTruc, dong[cot.indexOf('Tổng điểm')]);
});

test('Bảng chi tiết: có từng trục, tổng trục, điều kiện nền và mục không tính', () => {
  const ho = hoSoB('Thiếu Minh Chứng', 'X', 12, { clb: { muc: 'clb_100', soVanBan: '', minhChung: false } });
  const t = B.bangChiTiet([tao(ho)]);
  assert.equal(t[0][2], 'Trục');
  assert.equal(t.some((r) => r[2] === 'Điều kiện nền'), true);
  assert.equal(t.filter((r) => r[3] === 'Cộng trục').length, 4);
  assert.equal(t.some((r) => r[2] === 'Mục không tính' && /minh chứng/.test(r[6])), true);
});

test('Bảng phiên bản và nhật ký liệt kê đủ lịch sử', () => {
  const recs = boMau();
  assert.equal(B.bangPhienBan(recs).length, 1 + 1 + 2 + 1);
  assert.deepEqual(B.bangNhatKy(recs).slice(1).map((r) => r[3]).filter((x) => x === 'Chốt hồ sơ'), ['Chốt hồ sơ']);
});

test('CSV: BOM, dấu chấm phẩy, không có dòng sep= (làm Excel bỏ qua BOM), CRLF, bọc dấu nháy, chặn chèn công thức', () => {
  const csv = B.toCsv([['a', 'b;c', 'd"e'], ['=1+1', '-x', 'dòng 1\ndòng 2'], [5, null, '+84 9']]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.equal(csv.startsWith('﻿a;'), true);
  assert.equal(csv.includes('sep='), false);
  assert.match(csv, /a;"b;c";"d""e"\r\n/);
  assert.match(csv, /'=1\+1;'-x;"dòng 1\ndòng 2"\r\n/);
  assert.match(csv, /5;;'\+84 9\r\n$/);
  const t = B.bangTongHop(boMau());
  const dong = B.toCsv(t).split('\r\n').find((l) => l.includes('hs-c'));
  assert.equal(dong.includes(`;"'=cmd`), true); // tên bắt đầu bằng "=" được vô hiệu hóa (có dấu nháy vì chứa ký tự ")
  assert.equal(dong.includes(";'-Đơn vị;"), true);
});

/* ---------- Gói JSON ---------- */
test('Xuất JSON rồi nhập lại cho ra đúng bản sao hồ sơ', () => {
  const recs = boMau();
  const text = JSON.stringify(B.envelope(recs, '2026-11-07T03:00:00Z'));
  const kq = B.docGoi(text);
  assert.equal(kq.ok, true);
  assert.equal(kq.loi.length, 0);
  assert.deepEqual(kq.records, recs);
});

test('Nhập JSON: từ chối tệp hỏng, sai ứng dụng, phiên bản mới hơn; bỏ qua bản ghi sai', () => {
  assert.equal(B.docGoi('không phải json').ok, false);
  assert.equal(B.docGoi('').ok, false);
  assert.equal(B.docGoi(JSON.stringify({ app: 'khac', records: [] })).ok, false);
  assert.match(B.docGoi(JSON.stringify({ app: 'vtf-tinh-diem', schema: 99, records: [] })).loi[0], /mới hơn/);
  assert.equal(B.docGoi(JSON.stringify({ x: 1 })).ok, false);
  const tot = boMau()[0];
  const hong = { id: 'hong', versions: [{ v: 1 }] };
  const kq = B.docGoi(JSON.stringify({ app: 'vtf-tinh-diem', schema: 1, records: [tot, hong, tot] }));
  assert.equal(kq.ok, true);
  assert.equal(kq.records.length, 1);
  assert.equal(kq.loi.length, 1);
  assert.equal(kq.canhBao.some((c) => /nhiều lần/.test(c)), true);
});

test('Nhập JSON: cảnh báo khi hồ sơ tính theo phiên bản tiêu chí khác', () => {
  const r = boMau()[0];
  r.versions[0].ruleVersion = '036/VTF-CU';
  const kq = B.docGoi(JSON.stringify([r]));
  assert.equal(kq.ok, true);
  assert.equal(kq.canhBao.some((c) => /tiêu chí khác/.test(c)), true);
});

test('Nhập JSON: khóa "__proto__" trong tệp bị loại, không đổi nguyên mẫu đối tượng', () => {
  const r = boMau()[0];
  const text = JSON.stringify({ app: 'vtf-tinh-diem', schema: 1, records: [r] }).replace('"thongTin":{', '"thongTin":{"__proto__":{"daBiDoi":true},');
  assert.equal(text.includes('__proto__'), true);
  const kq = B.docGoi(text);
  assert.equal(kq.ok, true);
  const tt = kq.records[0].versions[0].input.thongTin;
  assert.equal(Object.prototype.hasOwnProperty.call(tt, '__proto__'), false);
  assert.equal(tt.daBiDoi, undefined);
  assert.equal(({}).daBiDoi, undefined);
});

/* ---------- Gộp ---------- */
test('Kế hoạch gộp: mới, giống, cập nhật, cũ hơn, xung đột, nghi trùng', () => {
  const [a, b, c] = boMau();
  const existing = [a, c];
  const aNew = H.addVersion(a, { input: hoSoB('Nguyễn Đình Đức', 'Đà Nẵng', 30), ketQua: evaluate(hoSoB('Nguyễn Đình Đức', 'Đà Nẵng', 30)), lyDo: 'Sửa', now: '2026-12-01T00:00:00Z' });
  const cXung = tao({ ...JSON.parse(JSON.stringify(c.versions[0].input)), nen: nen(20) }, '2026-11-09T00:00:00Z', 'hs-c'); // cùng mã, lịch sử khác
  const trung = tao(hoSoB('NGUYEN DINH DUC', 'da nang', 12), '2026-11-10T00:00:00Z', 'hs-khac'); // khác mã, trùng tên + đơn vị (không dấu)
  const plan = B.lapKeHoachGop(existing, [b, a, aNew, cXung, trung]);
  assert.deepEqual(plan.map((p) => p.loai), ['moi', 'giong', 'cap_nhat', 'xung_dot', 'nghi_trung']);
  assert.deepEqual(plan.map((p) => p.macDinh), ['them', 'bo_qua', 'ghi_de', 'bo_qua', 'them']);
  const cuHon = B.lapKeHoachGop([aNew], [a]);
  assert.equal(cuHon[0].loai, 'cu_hon');
  assert.equal(cuHon[0].macDinh, 'bo_qua');
});

test('Hồ sơ khác hệ hoặc khác đơn vị không bị coi là trùng', () => {
  const [a] = boMau();
  const khacDonVi = tao(hoSoB('Nguyễn Đình Đức', 'Huế', 12), '2026-11-10T00:00:00Z', 'hs-z');
  assert.equal(B.lapKeHoachGop([a], [khacDonVi])[0].loai, 'moi');
});

test('Áp dụng kế hoạch gộp theo lựa chọn; "thêm mới" cấp mã mới, không đè hồ sơ cũ', () => {
  const [a, b, c] = boMau();
  const cXung = tao({ ...JSON.parse(JSON.stringify(c.versions[0].input)), nen: nen(20) }, '2026-11-09T00:00:00Z', 'hs-c');
  const plan = B.lapKeHoachGop([a, c], [b, cXung]);
  const macDinh = B.ganKeHoach(plan);
  assert.deepEqual(macDinh.thongKe, { them: 1, ghiDe: 0, themMoi: 0, boQua: 1 });
  const chon = B.ganKeHoach(plan, ['them', 'them_moi']);
  assert.equal(chon.toPut.length, 2);
  assert.notEqual(chon.toPut[1].id, 'hs-c');
  assert.equal(chon.thongKe.themMoi, 1);
});

test('Gộp vào kho thật: nhập hai lần liên tiếp không nhân đôi hồ sơ', async () => {
  const kho = createStore({});
  await kho.init();
  const recs = boMau();
  for (const r of recs) await kho.put(r);
  const goi = B.docGoi(JSON.stringify(B.envelope(recs)));
  const plan = B.lapKeHoachGop(await kho.list(), goi.records);
  assert.ok(plan.every((p) => p.loai === 'giong'));
  const ap = B.ganKeHoach(plan);
  for (const r of ap.toPut) await kho.put(r);
  assert.equal((await kho.list()).length, 3);
});

/* ---------- Minh chứng và nhắc sao lưu ---------- */
test('Danh sách minh chứng cho phiếu in: có số văn bản và trạng thái', () => {
  const a = boMau()[0];
  const ds = B.danhSachMinhChung(a.versions[0].input);
  assert.equal(ds.some((m) => /QĐ 99/.test(m.soVanBan)), true);
  assert.equal(ds.some((m) => /Vai trò: Ủy viên Ban Chấp hành Liên đoàn quốc gia/.test(m.nhan)), true);
  assert.equal(ds.every((m) => typeof m.coMinhChung === 'boolean'), true);
  const c = boMau()[2];
  assert.equal(B.danhSachMinhChung(c.versions[0].input).some((m) => /SEA Games/.test(m.nhan) && m.soVanBan === 'KQ SEA'), true);
});

test('Nhắc sao lưu: sau 20 thay đổi, hoặc 7 ngày có thay đổi chưa sao lưu; không nhắc khi chưa có gì', () => {
  const now = '2026-11-20T00:00:00Z';
  assert.equal(B.trangThaiSaoLuu({ thayDoi: 0 }, 5, now).canNhac, false);
  assert.equal(B.trangThaiSaoLuu({ thayDoi: 5, firstChangeAt: '2026-11-19T00:00:00Z' }, 5, now).canNhac, false);
  assert.equal(B.trangThaiSaoLuu({ thayDoi: 20 }, 5, now).canNhac, true);
  assert.equal(B.trangThaiSaoLuu({ thayDoi: 2, firstChangeAt: '2026-11-10T00:00:00Z' }, 5, now).canNhac, true);
  assert.equal(B.trangThaiSaoLuu({ thayDoi: 2, lastBackupAt: '2026-11-18T00:00:00Z', firstChangeAt: '2026-11-10T00:00:00Z' }, 5, now).canNhac, false);
  assert.equal(B.trangThaiSaoLuu({ thayDoi: 2, lastBackupAt: '2026-11-01T00:00:00Z' }, 5, now).canNhac, true);
  assert.equal(B.trangThaiSaoLuu({ thayDoi: 30 }, 0, now).canNhac, false);
});

/* ---------- XLSX ---------- */
test('XLSX: tạo, đọc lại dữ liệu đầy đủ từ trang tính ẩn, khớp từng byte', async () => {
  const recs = boMau();
  const json = JSON.stringify(B.envelope(recs));
  const bytes = X.buildXlsx(B.cacTrang(recs), json, new Date('2026-11-07T03:00:00Z'));
  assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4b);
  const lai = await X.readHiddenData(bytes);
  assert.equal(lai, json);
  const goi = B.docGoi(lai);
  assert.equal(goi.ok, true);
  assert.deepEqual(goi.records, recs);
});

test('XLSX: dữ liệu lớn được chia ô và ghép lại đúng', async () => {
  const lon = JSON.stringify({ app: 'vtf-tinh-diem', schema: 1, records: [], pad: 'Việt Nam '.repeat(20000) });
  const bytes = X.buildXlsx([{ name: 'T', rows: [['a'], ['b']] }], lon);
  assert.equal(await X.readHiddenData(bytes), lon);
});

test('XLSX: tệp không phải xlsx hoặc không có trang tính ẩn bị từ chối rõ ràng', async () => {
  await assert.rejects(() => X.readHiddenData(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])), /xlsx/);
  const khongCo = X.buildXlsx([{ name: 'T', rows: [['a']] }]);
  assert.equal(await X.readHiddenData(khongCo), null);
});

test('XLSX: openpyxl mở được, thấy các trang tính, trang ẩn, và đọc lại được sau khi lưu bằng thư viện khác (nén deflate, chuỗi dùng chung)', async (t) => {
  const py = spawnSync('python', ['-c', 'import openpyxl'], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('Không có Python + openpyxl trong máy này'); return; }
  const recs = boMau();
  const json = JSON.stringify(B.envelope(recs));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vtfxl-'));
  const f1 = path.join(dir, 'a.xlsx'); const f2 = path.join(dir, 'b.xlsx');
  fs.writeFileSync(f1, X.buildXlsx(B.cacTrang(recs), json));
  const code = `
import openpyxl, json, sys
wb = openpyxl.load_workbook(sys.argv[1])
print(json.dumps({"sheets": [[w.title, w.sheet_state] for w in wb.worksheets], "hs": [[c.value for c in r] for r in wb["Tổng hợp"].iter_rows(min_row=1, max_row=2)]}, ensure_ascii=False))
wb.save(sys.argv[2])
`;
  const r = spawnSync('python', ['-c', code, f1, f2], { encoding: 'utf8', cwd: dir });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.deepEqual(out.sheets, [['Tổng hợp', 'visible'], ['Chi tiết điểm', 'visible'], ['Phiên bản', 'visible'], ['Nhật ký', 'visible'], ['_du_lieu', 'hidden']]);
  assert.equal(out.hs[1][2], 'Nguyễn Đình Đức');
  assert.equal(out.hs[1][14], recs[0].versions[0].ketQua.tong);
  assert.equal(await X.readHiddenData(new Uint8Array(fs.readFileSync(f2))), json);
  fs.rmSync(dir, { recursive: true, force: true });
});
