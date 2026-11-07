import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { evaluate, kiemTra, xepHang, RULES } = require('../tools/tinh-diem/src/engine.cjs');

/* ---------- Hàm dựng hồ sơ cho test ---------- */
const nenDat = (soNam, extra = {}) => ({
  soNam,
  soNamCoMinhChung: true,
  vaiTroNen: ['hlv'],
  vaiTroNenMinhChung: true,
  viPhamKyLuat: false,
  ...extra,
});
const hc = (giai, huyChuong, nam, extra = {}) => ({ giai, huyChuong, nam, minhChung: true, ...extra });
const mc = (muc) => ({ muc, minhChung: true });
const heA = (o = {}) => ({ he: 'A', nen: nenDat(o.soNam ?? 0, o.nen), thanhTich: o.thanhTich || [], daoTao: o.daoTao, chuyenMon: o.chuyenMon });
const heB = (o = {}) => ({
  he: 'B',
  nen: nenDat(o.soNam ?? 0, o.nen),
  dauAn: o.dauAn === undefined ? { chon: ['xay_dung_phong_trao'], minhChung: true } : o.dauAn,
  clb: o.clb, heThong: o.heThong, daoTaoVdv: o.daoTaoVdv, daoTaoHlv: o.daoTaoHlv, vaiTro: o.vaiTro || [],
});
const diemTruc = (kq) => Object.fromEntries(kq.truc.map((t) => [t.id, t.diem]));

/* ---------- Ca mẫu Phụ lục A của brief (dữ liệu giả) ---------- */
test('A1: Olympic HCB + 3 huy chương khác, 20 năm, đào tạo VĐV quốc tế, đội tuyển QG = 95, Đặc biệt', () => {
  const kq = evaluate(heA({
    soNam: 20,
    thanhTich: [hc('olympic', 'HCB', 2000), hc('sea_games', 'HCV', 2001), hc('sea_games', 'HCV', 2003), hc('sea_games', 'HCV', 2005)],
    daoTao: mc('vdv_quoc_te'),
    chuyenMon: mc('doi_tuyen_qg'),
  }));
  assert.deepEqual(diemTruc(kq), { truc1: 45, truc2: 20, truc3: 15, truc4: 15 });
  assert.equal(kq.tong, 95);
  assert.equal(kq.duocXet, true);
  assert.equal(kq.hang.id, 'dac_biet');
});

test('A2: chỉ 1 HCV SEA Games, 6 năm, không đóng góp khác = 40, chưa đạt mức xét, có cảnh báo IX.3', () => {
  const kq = evaluate(heA({ soNam: 6, thanhTich: [hc('sea_games', 'HCV', 2023)] }));
  assert.deepEqual(diemTruc(kq), { truc1: 35, truc2: 0, truc3: 5, truc4: 0 });
  assert.equal(kq.tong, 40);
  assert.equal(kq.duocXet, true);
  assert.equal(kq.hang.id, 'chua_dat');
  assert.equal(kq.canhBao.some((c) => c.includes('IX.3')), true);
});

test('A3: nhập trùng một thành tích hai lần chỉ tính một lần, Trục 2 = 0', () => {
  const kq = evaluate(heA({ soNam: 6, thanhTich: [hc('sea_games', 'HCV', 2023), hc('sea_games', 'HCV', 2023)] }));
  assert.equal(diemTruc(kq).truc1, 35);
  assert.equal(diemTruc(kq).truc2, 0);
  assert.equal(kq.mucBiLoai.some((m) => m.lyDo.includes('Trùng')), true);
});

test('A4: thành tích thiếu minh chứng không được tính, hồ sơ không đủ điều kiện Hệ A', () => {
  const kq = evaluate(heA({ soNam: 10, thanhTich: [{ giai: 'sea_games', huyChuong: 'HCV', nam: 2023, minhChung: false }] }));
  assert.equal(diemTruc(kq).truc1, 0);
  assert.equal(kq.duocXet, false);
  assert.equal(kq.hang, null);
  assert.equal(kq.dieuKien.find((d) => d.id === 'he_a_thanh_tich').dat, false);
  assert.equal(kq.mucBiLoai.length, 1);
});

test('A5: giải WT khác do Hội đồng quy đổi không vượt khung Vô địch Thế giới (45)', () => {
  const kq = evaluate(heA({
    soNam: 10, nen: { hoiDongXacNhanTuongDuong: true },
    thanhTich: [{ giai: 'wt_khac', tenGiai: 'WT Grand Prix', huyChuong: 'HCV', nam: 2022, minhChung: true, hoiDongXacNhan: true, diemQuyDoi: 50 }],
  }));
  assert.equal(diemTruc(kq).truc1, 45);
  const chuaXacNhan = evaluate(heA({
    soNam: 10, thanhTich: [{ giai: 'wt_khac', tenGiai: 'WT Grand Prix', huyChuong: 'HCV', nam: 2022, minhChung: true, hoiDongXacNhan: false, diemQuyDoi: 40 }],
  }));
  assert.equal(diemTruc(chuaXacNhan).truc1, 0);
});

test('A6: chỉ có HCB SEA Games thì chưa đủ điều kiện Hệ A, trừ khi Hội đồng xác nhận tương đương', () => {
  const khong = evaluate(heA({ soNam: 10, thanhTich: [hc('sea_games', 'HCB', 2019)] }));
  assert.equal(khong.duocXet, false);
  const co = evaluate(heA({ soNam: 10, nen: { hoiDongXacNhanTuongDuong: true }, thanhTich: [hc('sea_games', 'HCB', 2019)] }));
  assert.equal(co.duocXet, true);
  const chauA = evaluate(heA({ soNam: 10, thanhTich: [hc('chau_a', 'HCD', 2019)] }));
  assert.equal(chauA.duocXet, true);
});

test('A7: Trục 1 lấy thành tích cao nhất; bằng điểm thì ưu tiên cấp cao hơn; Trục 2 đếm các huy chương còn lại', () => {
  // ASIAD HCV = 45 và Thế giới HCV = 45: chọn ASIAD (cấp cao hơn trong bảng)
  const kq = evaluate(heA({ soNam: 10, thanhTich: [hc('the_gioi', 'HCV', 2010), hc('asiad', 'HCV', 2010), hc('sea_games', 'HCV', 2011)] }));
  assert.equal(diemTruc(kq).truc1, 45);
  assert.equal(kq.truc[0].chiTiet.find((c) => c.tinh).nhan.includes('ASIAD'), true);
  assert.equal(diemTruc(kq).truc2, 15); // 3 huy chương, trừ 1 = 2 => 15
});

test('A8: Trục 4 mỗi nhóm chỉ lấy một mức cao nhất, thiếu minh chứng thì không tính', () => {
  const kq = evaluate(heA({ soNam: 10, thanhTich: [hc('sea_games', 'HCV', 2020)], daoTao: { muc: 'vdv_quoc_te', minhChung: false }, chuyenMon: mc('cap_tinh') }));
  assert.equal(diemTruc(kq).truc4, 3);
  assert.equal(kq.mucBiLoai.length, 1);
});

/* ---------- Hệ B ---------- */
test('B1: 32 năm, CLB 120 võ sinh, xây dựng hệ thống tỉnh, đào tạo VĐV quốc tế, ≥10 HLV, UV BCH QG + HLV trưởng tỉnh = 100, Đặc biệt', () => {
  const kq = evaluate(heB({
    soNam: 32, clb: mc('clb_100'), heThong: mc('xay_dung_tinh'), daoTaoVdv: mc('vdv_quoc_te'), daoTaoHlv: mc('hlv_10'),
    vaiTro: [{ id: 'ubch_qg', minhChung: true }, { id: 'hlv_truong_tinh', minhChung: true }],
  }));
  assert.deepEqual(diemTruc(kq), { truc1: 30, truc2: 30, truc3: 20, truc4: 20 });
  assert.equal(kq.tong, 100);
  assert.equal(kq.hang.id, 'dac_biet');
  assert.equal(kq.truc[3].ghiChu.some((g) => g.includes('cắt')), true);
});

test('B2: 6 năm, CLB nhỏ, HLV phong trào = 25, chưa đạt mức xét', () => {
  const kq = evaluate(heB({ soNam: 6, clb: mc('clb_nho'), vaiTro: [{ id: 'hlv_phong_trao', minhChung: true }] }));
  assert.deepEqual(diemTruc(kq), { truc1: 10, truc2: 10, truc3: 0, truc4: 5 });
  assert.equal(kq.tong, 25);
  assert.equal(kq.duocXet, true);
  assert.equal(kq.hang.id, 'chua_dat');
});

test('B3: 4 năm 11 tháng (4,92) không đủ điều kiện nền và không được điểm thời gian', () => {
  const kq = evaluate(heB({ soNam: 4.92, clb: mc('clb_100') }));
  assert.equal(kq.duocXet, false);
  assert.equal(kq.hang, null);
  assert.equal(kq.dieuKien.find((d) => d.id === 'thoi_gian').dat, false);
  assert.equal(diemTruc(kq).truc1, 0);
});

test('B4: ba vai trò, chỉ tính 2 vai trò cao nhất rồi cắt trần 20', () => {
  const kq = evaluate(heB({
    soNam: 12, vaiTro: [{ id: 'ubch_tinh', minhChung: true }, { id: 'tt_quoc_te', minhChung: true }, { id: 'ubch_qg', minhChung: true }],
  }));
  assert.equal(diemTruc(kq).truc4, 20);
  const chiTiet = kq.truc[3].chiTiet;
  assert.equal(chiTiet.filter((c) => c.tinh).length, 2);
  assert.equal(chiTiet.filter((c) => !c.tinh).length, 1);
});

test('B5: vai trò thiếu quyết định bổ nhiệm không được tính và không chiếm suất 2 vai trò', () => {
  const kq = evaluate(heB({
    soNam: 12, vaiTro: [{ id: 'ubch_qg', minhChung: false }, { id: 'ubch_tinh', minhChung: true }, { id: 'hdkt_qg', minhChung: true }],
  }));
  assert.equal(diemTruc(kq).truc4, 20); // 15 + 15 = 30, cắt 20; vai trò thiếu minh chứng bị loại
  assert.equal(kq.mucBiLoai.some((m) => m.lyDo.includes('quyết định bổ nhiệm')), true);
});

test('B6: thiếu dấu ấn hoặc dấu ấn không minh chứng thì không đủ điều kiện Hệ B', () => {
  assert.equal(evaluate(heB({ soNam: 12, dauAn: { chon: [], minhChung: true } })).duocXet, false);
  assert.equal(evaluate(heB({ soNam: 12, dauAn: { chon: ['xay_dung_phong_trao'], minhChung: false } })).duocXet, false);
  assert.equal(evaluate(heB({ soNam: 12 })).duocXet, true);
});

test('B7: số năm không có minh chứng bị tính là 0 năm', () => {
  const kq = evaluate(heB({ soNam: 25, nen: { soNamCoMinhChung: false } }));
  assert.equal(kq.duocXet, false);
  assert.equal(diemTruc(kq).truc1, 0);
  assert.equal(kq.mucBiLoai.some((m) => m.truc === 'nen'), true);
});

/* ---------- Ngưỡng biên ---------- */
test('Biên Hệ B Trục 1 (thời gian): 4,99/5/9,99/10/19,99/20/29,99/30', () => {
  const cases = [[4.99, 0], [5, 10], [9.99, 10], [10, 15], [19.99, 15], [20, 25], [29.99, 25], [30, 30], [45, 30]];
  for (const [n, diem] of cases) {
    assert.equal(diemTruc(evaluate(heB({ soNam: n }))).truc1, diem, `${n} năm`);
  }
});

test('Biên Hệ A Trục 3 (thời gian): 4,99/5/9,99/10/14,99/15', () => {
  const cases = [[4.99, 0], [5, 5], [9.99, 5], [10, 10], [14.99, 10], [15, 15], [40, 15]];
  for (const [n, diem] of cases) {
    assert.equal(diemTruc(evaluate(heA({ soNam: n }))).truc3, diem, `${n} năm`);
  }
});

test('Biên Hệ A Trục 2 theo số huy chương ngoài thành tích chính', () => {
  const nam = [2001, 2002, 2003, 2004, 2005];
  const cases = [[1, 0], [2, 10], [3, 15], [4, 20], [5, 20]]; // tổng huy chương -> điểm Trục 2
  for (const [soHc, diem] of cases) {
    const tt = nam.slice(0, soHc).map((n) => hc('sea_games', 'HCV', n));
    assert.equal(diemTruc(evaluate(heA({ soNam: 10, thanhTich: tt }))).truc2, diem, `${soHc} huy chương`);
  }
});

test('Bảng điểm Trục 1 Hệ A khớp từng ô của 036/VTF', () => {
  const bang = {
    olympic: [50, 45, 40], asiad: [45, 40, 35], the_gioi: [45, 40, 35], chau_a: [40, 35, 30], sea_games: [35, 30, 25],
  };
  for (const [giai, [v, b, d]] of Object.entries(bang)) {
    for (const [huy, diem] of [['HCV', v], ['HCB', b], ['HCD', d]]) {
      const kq = evaluate(heA({ soNam: 5, thanhTich: [hc(giai, huy, 2010)] }));
      assert.equal(diemTruc(kq).truc1, diem, `${giai} ${huy}`);
    }
  }
});

test('Xếp hạng theo điểm: 49/50/59/60/74/75/89/90/100', () => {
  const cases = [[0, 'chua_dat'], [49, 'chua_dat'], [50, 'ghi_nhan'], [59, 'ghi_nhan'], [60, 'tieu_bieu'], [74, 'tieu_bieu'], [75, 'xuat_sac'], [89, 'xuat_sac'], [90, 'dac_biet'], [100, 'dac_biet']];
  for (const [diem, id] of cases) assert.equal(xepHang(diem).id, id, `${diem} điểm`);
});

/* ---------- Dữ liệu và tính nhất quán ---------- */
test('Điểm tối đa mỗi hệ cộng đúng 100 và thang điểm không vượt trần trục', () => {
  const a = RULES.heA.toiDa; const b = RULES.heB.toiDa;
  assert.equal(a.truc1 + a.truc2 + a.truc3 + a.truc4, 100);
  assert.equal(b.truc1 + b.truc2 + b.truc3 + b.truc4, 100);
  for (const g of RULES.heA.giai) assert.ok(Math.max(...Object.values(g.diem)) <= a.truc1);
  assert.equal(Math.max(...RULES.heA.truc2.map((x) => x.diem)), a.truc2);
  assert.equal(Math.max(...RULES.heA.truc3.map((x) => x.diem)), a.truc3);
  assert.equal(RULES.heA.truc4.daoTao.toiDa + RULES.heA.truc4.chuyenMon.toiDa, a.truc4);
  assert.equal(Math.max(...RULES.heB.truc1.map((x) => x.diem)), b.truc1);
  assert.equal(RULES.heB.truc2.clb.toiDa + RULES.heB.truc2.heThong.toiDa, b.truc2);
  assert.equal(RULES.heB.truc3.vdv.toiDa + RULES.heB.truc3.hlv.toiDa, b.truc3);
  assert.equal(Math.max(...RULES.heB.truc4.vaiTro.map((x) => x.diem)), b.truc4);
});

test('Điểm tối đa thực tế của mỗi hệ là 100 và hồ sơ trống là 0', () => {
  const toiDaB = evaluate(heB({
    soNam: 40, clb: mc('clb_100'), heThong: mc('xay_dung_tinh'), daoTaoVdv: mc('vdv_quoc_te'), daoTaoHlv: mc('hlv_10'),
    vaiTro: [{ id: 'ubch_qg', minhChung: true }],
  }));
  assert.equal(toiDaB.tong, 100);
  const trongA = evaluate({ he: 'A' });
  const trongB = evaluate({ he: 'B' });
  assert.equal(trongA.tong, 0);
  assert.equal(trongB.tong, 0);
  assert.equal(trongA.duocXet, false);
  assert.equal(trongB.duocXet, false);
});

test('Đạo đức: có vi phạm kỷ luật nghiêm trọng thì bị loại dù điểm cao', () => {
  const kq = evaluate(heB({ soNam: 40, clb: mc('clb_100'), nen: { viPhamKyLuat: true } }));
  assert.equal(kq.duocXet, false);
  assert.equal(kq.hang, null);
  assert.equal(kq.dieuKien.find((d) => d.id === 'dao_duc').dat, false);
});

test('Vai trò nền: phải có ít nhất 1 vai trò hợp lệ và có minh chứng', () => {
  assert.equal(evaluate(heB({ soNam: 10, nen: { vaiTroNen: [] } })).duocXet, false);
  assert.equal(evaluate(heB({ soNam: 10, nen: { vaiTroNen: ['khong_co'] } })).duocXet, false);
  assert.equal(evaluate(heB({ soNam: 10, nen: { vaiTroNenMinhChung: false } })).duocXet, false);
});

test('kiemTra: báo lỗi số năm âm, năm thành tích sai, thiếu hệ', () => {
  assert.equal(kiemTra({ he: 'B', nen: { soNam: -1 } }).length, 1);
  assert.equal(kiemTra({ he: 'B', nen: { soNam: 90 } }).length, 1);
  assert.equal(kiemTra({ he: 'A', thanhTich: [{ giai: 'sea_games', huyChuong: 'HCV', nam: 1800 }] }).length, 1);
  assert.equal(kiemTra({}).length, 1);
  assert.equal(kiemTra({ he: 'B', nen: { soNam: 12 } }).length, 0);
  assert.throws(() => evaluate({}), /he/);
});

test('Kết quả luôn mang phiên bản tiêu chí và không thay đổi hồ sơ đầu vào', () => {
  const ho = heB({ soNam: 12, vaiTro: [{ id: 'ubch_tinh', minhChung: true }] });
  const truoc = JSON.stringify(ho);
  const kq = evaluate(ho);
  assert.equal(kq.ruleVersion, '036/VTF-2026-04-04');
  assert.equal(JSON.stringify(ho), truoc);
});
