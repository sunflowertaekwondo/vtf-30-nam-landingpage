import test from 'node:test';
import assert from 'node:assert/strict';
import { taoMoiTruong, hoSoMau } from './helpers/gas-emulator.mjs';

const nhan = (env, record) => env.goi({ action: 'submit', record });
const cot = (env, khoa) => env.chay(`chiSoCot_(${JSON.stringify(khoa)})`) - 1;
const dong = (env, n) => env.sheets['Tất cả hồ sơ'].rows[n - 1];

test('Ghi hồ sơ hợp lệ: đúng cột, mã VTF30-0001, SĐT chuẩn hóa, nhóm Hệ A, có công thức và nhật ký', () => {
  const env = taoMoiTruong();
  const kq = nhan(env, hoSoMau());
  assert.equal(kq.ok, true);
  assert.equal(kq.id, 'VTF30-0001');
  assert.match(kq.receipt, /^VTF-[0-9A-F]{10}$/);
  assert.equal(kq.trung, false);
  assert.ok(!Number.isNaN(Date.parse(kq.savedAt)));
  const r = dong(env, 2);
  const c = (k) => r[cot(env, k)];
  assert.equal(c('id'), 'VTF30-0001');
  assert.equal(c('hoTen'), 'Nguyễn Văn Thử');
  assert.equal(c('sdt'), '0909123456');
  assert.equal(c('nhom'), 'Hệ A');
  assert.equal(c('hangMuc'), 'Đề cử Hệ A – Thành tích Đỉnh cao (036/VTF)'); // nhãn do máy chủ đặt, không tin nhãn gửi lên
  assert.equal(c('diemTuCham'), 85);
  assert.equal(c('diemMayChu'), 85);
  assert.deepEqual([c('truc1'), c('truc2'), c('truc3'), c('truc4')], [45, 20, 15, 5]);
  assert.equal(c('doiChieu'), 'Khớp');
  assert.equal(c('trangThai'), 'Mới');
  assert.equal(c('dongY'), 'Có');
  assert.equal(c('bienNhan'), kq.receipt);
  const ct = env.sheets['Tất cả hồ sơ'].formulas;
  for (const k of ['diemXepHang', 'hang', 'sauHan', 'trung', 'khoaXepHang']) assert.ok(ct.get(`2:${cot(env, k) + 1}`)?.startsWith('='), `thiếu công thức ${k}`);
  assert.match(ct.get(`2:${cot(env, 'diemXepHang') + 1}`), /^=IF\(ISNUMBER\(L2\),L2,IF\(ISNUMBER\(K2\),K2,""\)\)$/); // chỉ nhận số; không dùng điểm người nộp tự gửi (cột J)
  const nk = env.sheets['Nhật ký'].rows;
  assert.equal(nk.length, 1);
  assert.equal(nk[0][1], 'ĐÃ GHI');
  assert.ok(!JSON.stringify(nk).includes('Nguyễn') && !JSON.stringify(nk).includes('0909'), 'nhật ký không được chứa thông tin cá nhân');
});

test('Mã hồ sơ tăng dần 0001, 0002, 0003; mất bộ đếm thì lấy tiếp từ mã cuối trong bảng', () => {
  const env = taoMoiTruong();
  assert.equal(nhan(env, hoSoMau()).id, 'VTF30-0001');
  assert.equal(nhan(env, hoSoMau()).id, 'VTF30-0002');
  env.thuocTinh.delete('SEQ');
  assert.equal(nhan(env, hoSoMau()).id, 'VTF30-0003');
  env.thuocTinh.set('SEQ', '9999');
  assert.equal(nhan(env, hoSoMau()).id, 'VTF30-10000');
});

test('Gửi lại cùng mã yêu cầu: không thêm dòng, trả lại đúng hồ sơ cũ', () => {
  const env = taoMoiTruong();
  const h = hoSoMau();
  const a = nhan(env, h);
  const b = nhan(env, { ...h, fullName: 'Tên khác không được ghi đè' });
  assert.equal(b.ok, true);
  assert.equal(b.trung, true);
  assert.equal(b.id, a.id);
  assert.equal(b.receipt, a.receipt);
  assert.equal(env.sheets['Tất cả hồ sơ'].getLastRow(), 2);
  assert.equal(dong(env, 2)[cot(env, 'hoTen')], 'Nguyễn Văn Thử');
});

test('Từ chối dữ liệu xấu với đúng mã lỗi và không ghi dòng nào', () => {
  const env = taoMoiTruong();
  const cac = [
    [{ submissionType: 'khong_co' }, 'loai_ho_so'], [{ submissionType: 'constructor' }, 'loai_ho_so'], [{ submissionType: '__proto__' }, 'loai_ho_so'],
    [{ requestId: 'ngan' }, 'ma_yeu_cau'], [{ requestId: 'co ky tu la !!!!!!!!!!!!' }, 'ma_yeu_cau'],
    [{ fullName: 'ab' }, 'thieu_truong'], [{ organization: '' }, 'thieu_truong'], [{ message: 'quá ngắn' }, 'thieu_truong'],
    [{ phone: '123' }, 'sdt'], [{ phone: '1909123456' }, 'sdt'], [{ email: 'khong-phai-email' }, 'email'],
    [{ consent: false }, 'dong_y'], [{ consent: 'true' }, 'dong_y'],
    [{ photoAlbumUrl: 'javascript:alert(1)' }, 'link_anh'], [{ yearsContributed: 99 }, 'so_nam'], [{ yearsContributed: 'abc' }, 'so_nam'],
    [{ scoreClaimed: 150 }, 'diem'], [{ scoreClaimed: 'abc' }, 'diem'], [{ requestId: '-abcdefghijklmnop1234' }, 'ma_yeu_cau'], [{ requestId: '=IMAGE("http://x")aaaaaaaaaaaa' }, 'ma_yeu_cau'],
  ];
  for (const [ghiDe, loi] of cac) {
    const kq = nhan(env, hoSoMau(ghiDe));
    assert.equal(kq.ok, false, JSON.stringify(ghiDe));
    assert.equal(kq.loi, loi, JSON.stringify(ghiDe));
  }
  assert.equal(nhan(env, null).loi, 'thieu_du_lieu');
  assert.equal(env.sheets['Tất cả hồ sơ'].getLastRow(), 1);
});

test('Số điện thoại: chấp nhận +84, dấu cách, dấu chấm; ghi dạng 0xxxxxxxxx', () => {
  const env = taoMoiTruong();
  for (const [vao, ra] of [['+84 912 345 678', '0912345678'], ['0912.345.678', '0912345678'], ['(091) 234-5678', '0912345678'], ['0243 856 7890', '02438567890']]) {
    const kq = nhan(env, hoSoMau({ phone: vao }));
    assert.equal(kq.ok, true, vao);
    assert.equal(dong(env, env.sheets['Tất cả hồ sơ'].getLastRow())[cot(env, 'sdt')], ra);
  }
});

test('Chặn chèn công thức: ô bắt đầu bằng = + - @ được thêm dấu nháy; chữ thường giữ nguyên', () => {
  const env = taoMoiTruong();
  const kq = nhan(env, hoSoMau({ fullName: '=HYPERLINK("http://x","y")', organization: '-cmd|calc', message: '@SUM(1+1) nội dung dài đủ 15 ký tự', photoCaptions: '+84 ảnh', email: 'a@example.com' }));
  assert.equal(kq.ok, true);
  const r = dong(env, 2);
  assert.equal(r[cot(env, 'hoTen')], '\'=HYPERLINK("http://x","y")');
  assert.equal(r[cot(env, 'donVi')], '\'-cmd|calc');
  assert.equal(r[cot(env, 'tomTat')], '\'@SUM(1+1) nội dung dài đủ 15 ký tự');
  assert.equal(r[cot(env, 'chuThichAnh')], '\'+84 ảnh');
  assert.equal(r[cot(env, 'email')], 'a@example.com');
});

test('Hồ sơ "Khác" (Gala, Kỷ yếu, Bản Vàng): nhóm Khác, xóa điểm dù người gửi kèm điểm', () => {
  const env = taoMoiTruong();
  for (const [loai, nhan_] of [['gala_registration', 'Đăng ký Đại biểu tham dự Đêm Gala 19/12/2026'], ['yearbook_34_provinces', 'Gửi Bài viết & Ảnh Kỷ yếu 34 Tỉnh/Thành (CV 128/VTF-VP)'], ['gold_yearbook_bid', 'Đặt mua / Đấu giá Kỷ yếu Bản Vàng (Quỹ Ngọn lửa Olympic)']]) {
    const kq = nhan(env, hoSoMau({ submissionType: loai }));
    assert.equal(kq.ok, true, loai);
    const r = dong(env, env.sheets['Tất cả hồ sơ'].getLastRow());
    assert.equal(r[cot(env, 'nhom')], 'Khác');
    assert.equal(r[cot(env, 'hangMuc')], nhan_);
    for (const k of ['diemTuCham', 'diemMayChu', 'truc1', 'truc2', 'truc3', 'truc4', 'doiChieu', 'chiTiet']) assert.equal(r[cot(env, k)], '', `${loai} ${k}`);
  }
});

test('Hệ B không có điểm (chưa dùng máy tính): ghi được với ô điểm trống', () => {
  const env = taoMoiTruong();
  const kq = nhan(env, hoSoMau({ submissionType: 'nomination_b', scoreClaimed: null, scoreServer: null, scoreAxes: null, scoreDetail: null, scoreCheck: 'Không có chi tiết' }));
  assert.equal(kq.ok, true);
  const r = dong(env, 2);
  assert.equal(r[cot(env, 'nhom')], 'Hệ B');
  assert.equal(r[cot(env, 'diemTuCham')], '');
  assert.equal(r[cot(env, 'diemMayChu')], '');
  assert.equal(r[cot(env, 'doiChieu')], 'Không có chi tiết');
});

test('Từ chối ghi khi bảng dữ liệu hoặc thư mục chứa nó đang chia sẻ công khai', () => {
  for (const cauHinh of [{ rieng: false }, { choPhepCha: false }]) {
    const env = taoMoiTruong(cauHinh);
    const kq = nhan(env, hoSoMau());
    assert.equal(kq.ok, false);
    assert.equal(kq.loi, 'bang_cong_khai');
    assert.equal(env.sheets['Tất cả hồ sơ'].getLastRow(), 1);
    assert.equal(env.sheets['Nhật ký'].rows[0][1], 'TỪ CHỐI');
  }
});

test('Khi bảng được chuyển về riêng tư thì ghi được lại (kết quả kiểm tra được lưu đệm tối đa 5 phút)', () => {
  const env = taoMoiTruong({ rieng: false });
  assert.equal(nhan(env, hoSoMau()).ok, false);
  env.trangThaiDrive.file = 'PRIVATE';
  assert.equal(nhan(env, hoSoMau()).ok, true);
  env.trangThaiDrive.file = 'ANYONE_WITH_LINK'; // đã có kết quả "riêng tư" trong bộ nhớ đệm: vẫn ghi trong thời gian đệm
  assert.equal(nhan(env, hoSoMau()).ok, true);
  env.boNho.clear();
  assert.equal(nhan(env, hoSoMau()).loi, 'bang_cong_khai');
});

test('Giới hạn tốc độ: quá số hồ sơ mỗi phút thì từ chối có thể thử lại; sang phút mới ghi lại được; gửi lại không bị tính', () => {
  const env = taoMoiTruong();
  env.chay('GIOI_HAN_PHUT = 3');
  const dau = hoSoMau();
  for (let i = 0; i < 3; i++) assert.equal(nhan(env, i === 0 ? dau : hoSoMau()).ok, true);
  const bi = nhan(env, hoSoMau());
  assert.deepEqual([bi.ok, bi.loi, bi.thuLai], [false, 'qua_nhieu', true]);
  assert.equal(nhan(env, dau).trung, true); // gửi lại hồ sơ đã ghi vẫn được trả về, không bị giới hạn
  assert.equal(env.sheets['Tất cả hồ sơ'].getLastRow(), 4);
  env.dongHo.now += 61 * 1000;
  assert.equal(nhan(env, hoSoMau()).ok, true);
});

test('Giới hạn theo ngày', () => {
  const env = taoMoiTruong();
  env.chay('GIOI_HAN_NGAY = 2');
  assert.equal(nhan(env, hoSoMau()).ok, true);
  assert.equal(nhan(env, hoSoMau()).ok, true);
  assert.equal(nhan(env, hoSoMau()).loi, 'qua_nhieu');
  env.dongHo.now += 24 * 3600 * 1000;
  assert.equal(nhan(env, hoSoMau()).ok, true);
});

test('doPost: JSON hỏng, hành động lạ, quá lớn, chưa thiết lập đều trả lỗi gọn, không văng ngoại lệ', () => {
  const env = taoMoiTruong();
  assert.equal(env.goi('{khong phai json').loi, 'noi_bo');
  assert.equal(env.goi({ action: 'xoa', record: hoSoMau() }).loi, 'hanh_dong');
  assert.equal(env.goi({ record: hoSoMau() }).loi, 'hanh_dong');
  assert.equal(env.goi('x'.repeat(61000)).loi, 'qua_lon');
  assert.equal(env.goi('null').loi, 'hanh_dong');
  env.thuocTinh.delete('SHEET_ID');
  assert.equal(nhan(env, hoSoMau()).loi, 'chua_thiet_lap');
});

test('doGet chỉ báo sức khỏe, không trả dữ liệu hồ sơ', () => {
  const env = taoMoiTruong();
  nhan(env, hoSoMau());
  const g = env.doGet();
  assert.deepEqual(Object.keys(g).sort(), ['dich_vu', 'ok', 'phien_ban', 'rieng_tu', 'san_sang']);
  assert.equal(g.san_sang, true);
  assert.equal(g.rieng_tu, true);
  assert.ok(!JSON.stringify(g).includes('Nguyễn'));
});

test('Khi vượt số dòng của bảng thì tự thêm dòng (không lỗi "ngoài kích thước")', () => {
  const env = taoMoiTruong();
  env.sheets['Tất cả hồ sơ'].maxRows = 2;
  assert.equal(nhan(env, hoSoMau()).ok, true);
  assert.equal(nhan(env, hoSoMau()).ok, true);
  assert.equal(nhan(env, hoSoMau()).ok, true);
  assert.ok(env.sheets['Tất cả hồ sơ'].chen >= 1);
  assert.equal(env.sheets['Tất cả hồ sơ'].getLastRow(), 4);
});

test('Mã biên nhận khác nhau giữa các hồ sơ và ổn định khi gửi lại', () => {
  const env = taoMoiTruong();
  const a = nhan(env, hoSoMau()), b = nhan(env, hoSoMau());
  assert.notEqual(a.receipt, b.receipt);
});

test('Công thức từng dòng tham chiếu đúng cột và đúng dòng', () => {
  const env = taoMoiTruong();
  const f = env.chay('congThucDong_(7)');
  const L = (k) => env.chay(`cot_("${k}")`) + '7';
  assert.ok(f.diemXepHang.includes(L('diemHoiDong')) && f.diemXepHang.includes(L('diemMayChu')) && !f.diemXepHang.includes(L('diemTuCham')), 'điểm xếp hạng không được lấy điểm người nộp tự gửi');
  assert.ok(f.sauHan.includes(`${L('thoiGian')}>'Tổng quan'!$B$3+1`));
  assert.ok(f.trung.includes('SUMPRODUCT(') && !f.trung.includes('COUNTIFS('), 'so sánh nguyên văn chuỗi, không dùng COUNTIFS');
  assert.equal(f.khoaXepHang, `=IF(${L('diemXepHang')}="",-1,${L('diemXepHang')})`);
});
