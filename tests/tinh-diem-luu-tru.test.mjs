import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { evaluate } = require('../tools/tinh-diem/src/engine.cjs');
const H = require('../tools/tinh-diem/src/history.cjs');
const { createStore } = require('../tools/tinh-diem/src/store.cjs');

/* ---------- Dữ liệu mẫu ---------- */
const nen = (soNam) => ({ soNam, soNamCoMinhChung: true, vaiTroNen: ['hlv'], vaiTroNenMinhChung: true, viPhamKyLuat: false });
const mc = (muc) => ({ muc, minhChung: true });
function hoSoB(hoTen, donVi, soNam, extra = {}) {
  return {
    he: 'B', thongTin: { hoTen, donVi, ngayCham: '2026-11-07', nguoiCham: 'Cán bộ A', ghiChu: '' },
    nen: nen(soNam), dauAn: { chon: ['xay_dung_phong_trao'], minhChung: true }, vaiTro: [], ...extra,
  };
}
const ketQua = (ho) => evaluate(ho);
const tao = (ho, now) => H.createRecord({ input: ho, ketQua: ketQua(ho), nguoiCham: ho.thongTin.nguoiCham, now });

/* ---------- history.cjs ---------- */
test('Tạo hồ sơ: phiên bản 1, chưa chốt, có nhật ký tạo', () => {
  const ho = hoSoB('Nguyễn Văn An', 'CLB Quận 1', 12);
  const rec = tao(ho, '2026-11-07T01:00:00Z');
  assert.equal(rec.versions.length, 1);
  assert.equal(rec.versions[0].v, 1);
  assert.equal(rec.locked, false);
  assert.equal(rec.nhatKy[0].loai, 'tao');
  assert.equal(rec.versions[0].ruleVersion, '036/VTF-2026-04-04');
  assert.equal(rec.versions[0].ketQua.tong, ketQua(ho).tong);
});

test('Hồ sơ lưu là bản sao: sửa dữ liệu gốc sau đó không làm đổi phiên bản đã lưu', () => {
  const ho = hoSoB('Trần Thị Bình', 'Lâm Đồng', 12);
  const rec = tao(ho);
  ho.thongTin.hoTen = 'Đã bị đổi';
  assert.equal(rec.versions[0].input.thongTin.hoTen, 'Trần Thị Bình');
});

test('Sửa hồ sơ: bắt buộc ghi lý do, tạo phiên bản mới và giữ phiên bản cũ', () => {
  const ho1 = hoSoB('Lê Văn Cường', 'Huế', 6);
  const rec1 = tao(ho1, '2026-11-07T01:00:00Z');
  const ho2 = hoSoB('Lê Văn Cường', 'Huế', 12);
  assert.throws(() => H.addVersion(rec1, { input: ho2, ketQua: ketQua(ho2), nguoiCham: 'B', lyDo: '  ' }), /lý do/);
  const rec2 = H.addVersion(rec1, { input: ho2, ketQua: ketQua(ho2), nguoiCham: 'B', lyDo: 'Bổ sung quyết định xác nhận 12 năm', now: '2026-11-08T02:00:00Z' });
  assert.equal(rec2.versions.length, 2);
  assert.equal(rec2.versions[1].v, 2);
  assert.equal(rec2.versions[0].ketQua.tong, ketQua(ho1).tong); // bản cũ nguyên vẹn
  assert.equal(rec2.versions[1].ketQua.tong, ketQua(ho2).tong);
  assert.equal(rec1.versions.length, 1); // bản gốc không bị đổi
  assert.equal(rec2.nhatKy.at(-1).loai, 'sua');
  assert.equal(rec2.nhatKy.at(-1).lyDo, 'Bổ sung quyết định xác nhận 12 năm');
});

test('Chốt hồ sơ: không sửa được; mở khóa phải ghi lý do; mọi bước vào nhật ký', () => {
  const ho = hoSoB('Phạm Văn Dũng', 'Cần Thơ', 12);
  const rec = tao(ho);
  const chot = H.lock(rec, { nguoi: 'Thư ký', now: '2026-11-09T01:00:00Z' });
  assert.equal(chot.locked, true);
  assert.throws(() => H.addVersion(chot, { input: ho, ketQua: ketQua(ho), lyDo: 'sửa' }), /đã chốt/);
  assert.throws(() => H.unlock(chot, { nguoi: 'Thư ký' }), /lý do/);
  const mo = H.unlock(chot, { nguoi: 'Thư ký', lyDo: 'Hội đồng yêu cầu rà lại', now: '2026-11-10T01:00:00Z' });
  assert.equal(mo.locked, false);
  assert.deepEqual(mo.nhatKy.map((x) => x.loai), ['tao', 'chot', 'mo_khoa']);
  assert.equal(H.lock(chot, {}).nhatKy.length, chot.nhatKy.length); // chốt lần hai không thêm nhật ký
  const sua = H.addVersion(mo, { input: ho, ketQua: ketQua(ho), lyDo: 'Rà lại theo yêu cầu Hội đồng' });
  assert.equal(sua.versions.length, 2);
});

test('Tóm tắt lấy từ phiên bản mới nhất, hồ sơ chưa đủ điều kiện được gắn riêng', () => {
  const du = tao(hoSoB('Đủ Điều Kiện', 'A', 12, { clb: mc('clb_100') }));
  const thieu = tao(hoSoB('Thiếu Năm', 'B', 3));
  const s1 = H.summarize(du); const s2 = H.summarize(thieu);
  assert.equal(s1.duocXet, true);
  assert.equal(s1.hangKey, H.hangKey(du.versions[0].ketQua));
  assert.equal(s2.hangKey, 'chua_du_dk');
  assert.equal(s2.hangTen, 'Chưa đủ điều kiện xét');
  assert.equal(s1.soPhienBan, 1);
});

test('Lọc: theo hệ, hạng, năm, và tìm kiếm không dấu / hoa thường', () => {
  const a = tao(hoSoB('Nguyễn Đình Đức', 'Đà Nẵng', 35, { clb: mc('clb_100'), heThong: mc('xay_dung_tinh'), daoTaoVdv: mc('vdv_quoc_te'), daoTaoHlv: mc('hlv_10'), vaiTro: [{ id: 'ubch_qg', minhChung: true }] }), '2026-11-01T00:00:00Z');
  const b = tao(hoSoB('Hoàng Thị Mai', 'Hà Nội', 6), '2026-11-02T00:00:00Z');
  const c = tao({ he: 'A', thongTin: { hoTen: 'Vũ Quang Huy', donVi: 'TP.HCM', ngayCham: '2026-11-03', nguoiCham: 'C', ghiChu: '' }, nen: nen(10), thanhTich: [{ giai: 'sea_games', huyChuong: 'HCV', nam: 2019, minhChung: true }] }, '2027-01-05T00:00:00Z');
  const all = [a, b, c];
  assert.equal(H.filterSort(all, {}).length, 3);
  assert.deepEqual(H.filterSort(all, { he: 'A' }).map((s) => s.hoTen), ['Vũ Quang Huy']);
  assert.deepEqual(H.filterSort(all, { q: 'dinh duc' }).map((s) => s.hoTen), ['Nguyễn Đình Đức']);
  assert.deepEqual(H.filterSort(all, { q: 'HA NOI' }).map((s) => s.hoTen), ['Hoàng Thị Mai']);
  assert.deepEqual(H.filterSort(all, { hang: 'dac_biet' }).map((s) => s.hoTen), ['Nguyễn Đình Đức']);
  assert.deepEqual(H.filterSort(all, { nam: 2027 }).map((s) => s.hoTen), ['Vũ Quang Huy']);
  assert.equal(H.filterSort(all, { q: 'khong co ai' }).length, 0);
});

test('Sắp xếp: mới nhất, điểm cao xuống thấp, tên A-Z', () => {
  const a = tao(hoSoB('Bình', 'x', 6), '2026-11-01T00:00:00Z'); // 10 điểm thời gian
  const b = tao(hoSoB('An', 'x', 25), '2026-11-02T00:00:00Z');
  const c = tao(hoSoB('Cường', 'x', 12), '2026-11-03T00:00:00Z');
  const all = [a, b, c];
  assert.deepEqual(H.filterSort(all, { sort: 'moi' }).map((s) => s.hoTen), ['Cường', 'An', 'Bình']);
  assert.deepEqual(H.filterSort(all, { sort: 'diem' }).map((s) => s.hoTen), ['An', 'Cường', 'Bình']);
  assert.deepEqual(H.filterSort(all, { sort: 'ten' }).map((s) => s.hoTen), ['An', 'Bình', 'Cường']);
});

/* ---------- store.cjs ---------- */
function fakeLocalStorage() {
  const m = new Map();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

async function thuLuuTru(store) {
  const ho = hoSoB('Người Thử', 'Đơn vị', 12);
  const rec = tao(ho);
  await store.put(rec);
  assert.equal((await store.list()).length, 1);
  assert.equal((await store.get(rec.id)).versions[0].input.thongTin.hoTen, 'Người Thử');
  const moi = H.addVersion(rec, { input: ho, ketQua: ketQua(ho), lyDo: 'Thử' });
  await store.put(moi);
  assert.equal((await store.get(rec.id)).versions.length, 2);
  assert.equal((await store.list()).length, 1); // ghi đè cùng id, không nhân đôi
  assert.equal(await store.getDraft(), null);
  await store.setDraft({ S: { he: 'B' }, ctx: { mode: 'new' } });
  assert.deepEqual((await store.getDraft()).S, { he: 'B' });
  await store.clearDraft();
  assert.equal(await store.getDraft(), null);
  await store.remove(rec.id);
  assert.equal((await store.list()).length, 0);
  await store.put(rec); await store.setDraft({ a: 1 });
  await store.clear();
  assert.equal((await store.list()).length, 0);
  assert.equal(await store.getDraft(), null);
}

test('Lưu trữ bằng localStorage: thêm, sửa, xóa, nháp, xóa toàn bộ', async () => {
  const store = createStore({ localStorage: fakeLocalStorage() });
  const info = await store.init();
  assert.equal(info.backend, 'localstorage');
  await thuLuuTru(store);
});

test('Không có nơi lưu bền: chuyển bộ nhớ tạm và có cảnh báo', async () => {
  const store = createStore({});
  const info = await store.init();
  assert.equal(info.backend, 'memory');
  assert.match(info.warning, /mất khi đóng trang/);
  await thuLuuTru(store);
});

test('localStorage bị chặn (ném lỗi khi ghi): tự chuyển bộ nhớ tạm', async () => {
  const hong = fakeLocalStorage();
  hong.setItem = () => { throw new Error('QuotaExceeded'); };
  const store = createStore({ localStorage: hong });
  const info = await store.init();
  assert.equal(info.backend, 'memory');
});

test('Dữ liệu trong localStorage còn nguyên khi mở lại (giả lập đóng và mở trình duyệt)', async () => {
  const ls = fakeLocalStorage();
  const s1 = createStore({ localStorage: ls });
  await s1.init();
  const ho = hoSoB('Còn Mãi', 'Đơn vị', 12);
  const rec = tao(ho);
  await s1.put(rec);
  await s1.setDraft({ S: { he: 'B', thongTin: { hoTen: 'Đang gõ dở' } } });
  const s2 = createStore({ localStorage: ls });
  await s2.init();
  assert.equal((await s2.list())[0].id, rec.id);
  assert.equal((await s2.getDraft()).S.thongTin.hoTen, 'Đang gõ dở');
});

test('Bản ghi hỏng trong localStorage không làm sập danh sách', async () => {
  const ls = fakeLocalStorage();
  const store = createStore({ localStorage: ls });
  await store.init();
  const rec = tao(hoSoB('Bình Thường', 'X', 12));
  await store.put(rec);
  ls.setItem('vtfTD.hoso.hong', '{khong phai json');
  const ds = await store.list();
  assert.equal(ds.length, 1);
  assert.equal(ds[0].id, rec.id);
});
