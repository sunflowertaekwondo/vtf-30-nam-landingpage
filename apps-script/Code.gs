/**
 * VTF 30 năm - Tiếp nhận hồ sơ đề cử và đăng ký (Google Apps Script)
 *
 * Nhận hồ sơ từ máy chủ của trang vtf30.tkdai.vn (api/submit-nomination.js) và ghi vào MỘT Google Sheet RIÊNG TƯ.
 * Không có dữ liệu nào đi qua trình duyệt của người nộp tới đây: chỉ máy chủ của trang biết địa chỉ /exec.
 *
 * Việc cần làm một lần (xem apps-script/HUONG-DAN.md): chạy thietLap(), rồi Triển khai > Ứng dụng web
 * (Thực thi bằng: Tôi; Ai có quyền truy cập: Bất kỳ ai), chép địa chỉ /exec vào biến VTF_GOOGLE_SHEET_WEBHOOK trên Vercel.
 *
 * Sheet gồm các tab:
 *   Tất cả hồ sơ      : nơi script ghi (mỗi hồ sơ một dòng, chỉ thêm, không sửa dữ liệu gốc)
 *   Hệ A - Xếp hạng   : tự lọc Hệ A, xếp điểm cao xuống thấp (công thức, tự cập nhật)
 *   Hệ B - Xếp hạng   : tự lọc Hệ B, xếp điểm cao xuống thấp
 *   Hồ sơ khác        : kỷ yếu 34 tỉnh/thành, đăng ký Gala, Kỷ yếu Bản Vàng
 *   Tổng quan         : số liệu, hạn nộp (sửa được), hướng dẫn
 *   Nhật ký           : mỗi lần nhận (không chứa thông tin cá nhân)
 *
 * Quy tắc an toàn:
 *  - Từ chối ghi nếu file dữ liệu hoặc thư mục chứa nó đang chia sẻ công khai.
 *  - Mọi ô chữ là "văn bản thuần" và được chặn chèn công thức (=, +, -, @ ở đầu).
 *  - Mã yêu cầu (requestId) chống ghi trùng khi trình duyệt/máy chủ gửi lại.
 *  - Giới hạn tốc độ để chống tràn dữ liệu rác.
 */

var PHIEN_BAN = '1.0';
var TEN_FILE = 'VTF 30 năm - Hồ sơ đề cử và đăng ký (RIÊNG TƯ)';
// Thư mục riêng tư dùng chung của VTF (đã tắt kế thừa quyền). Nếu không mở được, script tự tạo thư mục riêng ở Drive gốc.
var THU_MUC_RIENG_TU_ID = '1UN_B_8T-Iz-EN9v2YCvto6EaD6n-4NKP';
var TEN_THU_MUC_DU_PHONG = 'VTF30 - RIÊNG TƯ';
var MUI_GIO = 'Asia/Ho_Chi_Minh';
var HAN_NOP_MAC_DINH = new Date(Date.UTC(2026, 9, 29, 17, 0, 0)); // 00:00 ngày 30/10/2026 giờ Việt Nam, hạn theo Thông báo 038/TB-VTF (sửa được trong tab Tổng quan)
var SO_DONG_TOI_THIEU = 3000;
var MAX_BYTE_GUI = 60000;
var GIOI_HAN_PHUT = 40;   // số hồ sơ tối đa mỗi phút
var GIOI_HAN_NGAY = 2000; // số hồ sơ tối đa mỗi ngày

var TAB = {
  goc: 'Tất cả hồ sơ',
  heA: 'Hệ A - Xếp hạng',
  heB: 'Hệ B - Xếp hạng',
  khac: 'Hồ sơ khác',
  tongQuan: 'Tổng quan',
  nhatKy: 'Nhật ký'
};

// Danh sách cột của tab gốc, theo thứ tự. kieu: 'chu' = văn bản thuần, 'so', 'ngay', 'cth' = công thức, 'tay' = nhập tay
var COT = [
  { k: 'id', t: 'Mã hồ sơ', kieu: 'chu', rong: 95 },
  { k: 'thoiGian', t: 'Thời gian nhận', kieu: 'ngay', rong: 140 },
  { k: 'hoTen', t: 'Họ và tên', kieu: 'chu', rong: 190 },
  { k: 'sdt', t: 'Số điện thoại', kieu: 'chu', rong: 110 },
  { k: 'email', t: 'Email', kieu: 'chu', rong: 190 },
  { k: 'donVi', t: 'Đơn vị', kieu: 'chu', rong: 220 },
  { k: 'hangMuc', t: 'Hạng mục đăng ký', kieu: 'chu', rong: 260 },
  { k: 'nhom', t: 'Nhóm', kieu: 'chu', rong: 70 },
  { k: 'soNam', t: 'Số năm cống hiến', kieu: 'so', rong: 80 },
  { k: 'diemTuCham', t: 'Điểm người nộp tự gửi (chỉ để đối chiếu)', kieu: 'so', rong: 110 },
  { k: 'diemMayChu', t: 'Điểm máy chủ tính lại', kieu: 'so', rong: 100 },
  { k: 'diemHoiDong', t: 'Điểm Hội đồng chấm (NHẬP TAY)', kieu: 'tay', rong: 110 },
  { k: 'diemXepHang', t: 'Điểm dùng để xếp hạng', kieu: 'cth', rong: 100 },
  { k: 'hang', t: 'Hạng', kieu: 'cth', rong: 110 },
  { k: 'doiChieu', t: 'Đối chiếu điểm', kieu: 'chu', rong: 120 },
  { k: 'truc1', t: 'Trục 1', kieu: 'so', rong: 55 },
  { k: 'truc2', t: 'Trục 2', kieu: 'so', rong: 55 },
  { k: 'truc3', t: 'Trục 3', kieu: 'so', rong: 55 },
  { k: 'truc4', t: 'Trục 4', kieu: 'so', rong: 55 },
  { k: 'chiTiet', t: 'Chi tiết các lựa chọn chấm điểm (JSON)', kieu: 'chu', rong: 200 },
  { k: 'tomTat', t: 'Tóm tắt thành tích / nội dung', kieu: 'chu', rong: 420 },
  { k: 'linkAnh', t: 'Link kho ảnh tư liệu', kieu: 'chu', rong: 220 },
  { k: 'chuThichAnh', t: 'Chú thích ảnh', kieu: 'chu', rong: 220 },
  { k: 'dongY', t: 'Đồng ý (NĐ 13/2023)', kieu: 'chu', rong: 80 },
  { k: 'trangThai', t: 'Trạng thái xử lý (NHẬP TAY)', kieu: 'tay', rong: 140 },
  { k: 'ghiChu', t: 'Ghi chú Hội đồng / BTC (NHẬP TAY)', kieu: 'tay', rong: 240 },
  { k: 'sauHan', t: 'Nộp sau hạn?', kieu: 'cth', rong: 90 },
  { k: 'trung', t: 'Trùng hồ sơ?', kieu: 'cth', rong: 200 },
  { k: 'bienNhan', t: 'Mã biên nhận', kieu: 'chu', rong: 130 },
  { k: 'maYeuCau', t: 'Mã yêu cầu (chống gửi trùng)', kieu: 'chu', rong: 130 },
  { k: 'khoaXepHang', t: 'Khóa sắp xếp (ẩn)', kieu: 'cth', rong: 80 }
];

var LOAI_HO_SO = {
  nomination_a: { nhom: 'Hệ A', nhan: 'Đề cử Hệ A – Thành tích Đỉnh cao (036/VTF)' },
  nomination_b: { nhom: 'Hệ B', nhan: 'Đề cử Hệ B – Cống hiến Di sản Phong trào (036/VTF)' },
  yearbook_34_provinces: { nhom: 'Khác', nhan: 'Gửi Bài viết & Ảnh Kỷ yếu 34 Tỉnh/Thành (CV 128/VTF-VP)' },
  gala_registration: { nhom: 'Khác', nhan: 'Đăng ký Đại biểu tham dự Đêm Gala 19/12/2026' },
  gold_yearbook_bid: { nhom: 'Khác', nhan: 'Đặt mua / Đấu giá Kỷ yếu Bản Vàng (Quỹ Ngọn lửa Olympic)' }
};

var TRANG_THAI = ['Mới', 'Đang thẩm định', 'Cần bổ sung minh chứng', 'Đạt sơ duyệt', 'Không đạt', 'Đã đưa vào danh sách xét'];

/* ============================== Tiện ích cột ============================== */

function chiSoCot_(khoa) {
  for (var i = 0; i < COT.length; i++) if (COT[i].k === khoa) return i + 1;
  throw new Error('Không có cột ' + khoa);
}
function chuCai_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function cot_(khoa) { return chuCai_(chiSoCot_(khoa)); }
function dai_(khoa) { return '\'' + TAB.goc + '\'!' + cot_(khoa) + '2:' + cot_(khoa); }

/* ============================== Kiểm tra và chuẩn hóa ============================== */

function catChuoi_(v, toiDa) {
  var s = (v === null || v === undefined) ? '' : String(v);
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/\r\n?/g, '\n').trim();
  return s.length > toiDa ? s.slice(0, toiDa) : s;
}

// Chặn chèn công thức khi mở bằng Excel/Sheets: ô bắt đầu bằng = + - @ (hoặc tab/CR) được thêm dấu nháy đơn phía trước.
function anToanO_(s) {
  if (typeof s !== 'string' || s === '') return s;
  return /^[=+\-@\t\r]/.test(s) ? '\'' + s : s;
}

function chuanSdt_(v) {
  var s = catChuoi_(v, 30).replace(/[\s.\-()]/g, '');
  if (/^\+84[0-9]{8,10}$/.test(s)) s = '0' + s.slice(3);
  return /^0[0-9]{8,10}$/.test(s) ? s : null;
}

function soHoacRong_(v, toiThieu, toiDa) {
  if (v === null || v === undefined || v === '') return '';
  var n = Number(v);
  if (!isFinite(n) || n < toiThieu || n > toiDa) return null;
  return Math.round(n * 100) / 100;
}

// Trả về { ok:true, r:{...} } hoặc { ok:false, loi:'...' }
function chuanHoaHoSo_(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, loi: 'thieu_du_lieu' };
  if (typeof raw.submissionType !== 'string' || !Object.prototype.hasOwnProperty.call(LOAI_HO_SO, raw.submissionType)) return { ok: false, loi: 'loai_ho_so' };
  var loai = LOAI_HO_SO[raw.submissionType];
  var maYeuCau = catChuoi_(raw.requestId, 80);
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(maYeuCau)) return { ok: false, loi: 'ma_yeu_cau' };
  var hoTen = catChuoi_(raw.fullName, 120);
  var email = catChuoi_(raw.email, 120);
  var donVi = catChuoi_(raw.organization, 200);
  var tomTat = catChuoi_(raw.message, 4000);
  var sdt = chuanSdt_(raw.phone);
  if (hoTen.length < 3 || !donVi || tomTat.length < 15) return { ok: false, loi: 'thieu_truong' };
  if (!sdt) return { ok: false, loi: 'sdt' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, loi: 'email' };
  if (raw.consent !== true) return { ok: false, loi: 'dong_y' };
  var link = catChuoi_(raw.photoAlbumUrl, 500);
  if (link && !/^https?:\/\/\S+$/i.test(link)) return { ok: false, loi: 'link_anh' };
  var soNam = soHoacRong_(raw.yearsContributed, 0, 80);
  if (soNam === null) return { ok: false, loi: 'so_nam' };
  var diemTuCham = soHoacRong_(raw.scoreClaimed, 0, 100);
  var diemMayChu = soHoacRong_(raw.scoreServer, 0, 100);
  if (diemTuCham === null || diemMayChu === null) return { ok: false, loi: 'diem' };
  var truc = ['', '', '', ''];
  if (raw.scoreAxes !== null && raw.scoreAxes !== undefined) {
    if (!Array.isArray(raw.scoreAxes) || raw.scoreAxes.length !== 4) return { ok: false, loi: 'truc' };
    for (var i = 0; i < 4; i++) { truc[i] = soHoacRong_(raw.scoreAxes[i], 0, 100); if (truc[i] === null) return { ok: false, loi: 'truc' }; }
  }
  var chiTiet = '';
  if (raw.scoreDetail !== null && raw.scoreDetail !== undefined) {
    try { chiTiet = JSON.stringify(raw.scoreDetail); } catch (e) { return { ok: false, loi: 'chi_tiet' }; }
    if (chiTiet.length > 600) return { ok: false, loi: 'chi_tiet' };
  }
  var doiChieu = catChuoi_(raw.scoreCheck, 40);
  if (loai.nhom === 'Khác') { diemTuCham = ''; diemMayChu = ''; truc = ['', '', '', '']; chiTiet = ''; doiChieu = ''; }
  return {
    ok: true,
    r: {
      maYeuCau: maYeuCau, hoTen: hoTen, sdt: sdt, email: email, donVi: donVi, loai: raw.submissionType, nhom: loai.nhom, hangMuc: loai.nhan,
      soNam: soNam, diemTuCham: diemTuCham, diemMayChu: diemMayChu, truc: truc, chiTiet: chiTiet, doiChieu: doiChieu,
      tomTat: tomTat, linkAnh: link, chuThichAnh: catChuoi_(raw.photoCaptions, 600)
    }
  };
}

/* ============================== Truy cập Sheet ============================== */

function props_() { return PropertiesService.getScriptProperties(); }

function mo_() {
  var id = props_().getProperty('SHEET_ID');
  if (!id) throw new Error('chua_thiet_lap');
  return SpreadsheetApp.openById(id);
}

function tabGoc_() {
  var sh = mo_().getSheetByName(TAB.goc);
  if (!sh) throw new Error('mat_tab_goc');
  return sh;
}

// File dữ liệu và thư mục chứa nó phải RIÊNG TƯ (không "bất kỳ ai", không "bất kỳ ai có liên kết", không cả tên miền).
function laRiengTu_(tuyetDoi) {
  var cache = CacheService.getScriptCache();
  if (!tuyetDoi && cache.get('RIENG_TU') === 'ok') return true;
  var id = props_().getProperty('SHEET_ID');
  var f = DriveApp.getFileById(id);
  var ok = f.getSharingAccess() === DriveApp.Access.PRIVATE;
  if (ok) {
    var cha = f.getParents();
    while (ok && cha.hasNext()) ok = cha.next().getSharingAccess() === DriveApp.Access.PRIVATE;
  }
  if (ok) cache.put('RIENG_TU', 'ok', 300);
  return ok;
}

function hexHmac_(chuoi) {
  var muoi = props_().getProperty('MUOI') || '';
  var bytes = Utilities.computeHmacSha256Signature(chuoi, muoi);
  var s = '';
  for (var i = 0; i < bytes.length; i++) { var b = (bytes[i] + 256) % 256; s += (b < 16 ? '0' : '') + b.toString(16); }
  return s.toUpperCase();
}

function soTuId_(id) {
  var m = /^VTF30-(\d+)$/.exec(String(id || ''));
  return m ? Number(m[1]) : 0;
}

function dinhDangId_(n) { return 'VTF30-' + (n < 10000 ? ('000' + n).slice(-4) : String(n)); }

// Giới hạn tốc độ: bộ đếm theo phút và theo ngày (Asia/Ho_Chi_Minh)
function vuotGioiHan_() {
  var p = props_();
  var ban = JSON.parse(p.getProperty('GIOI_HAN') || '{}');
  var phut = Utilities.formatDate(new Date(), MUI_GIO, 'yyyyMMddHHmm');
  var ngay = phut.slice(0, 8);
  if (ban.phut !== phut) { ban.phut = phut; ban.soPhut = 0; }
  if (ban.ngay !== ngay) { ban.ngay = ngay; ban.soNgay = 0; }
  if (ban.soPhut >= GIOI_HAN_PHUT || ban.soNgay >= GIOI_HAN_NGAY) { p.setProperty('GIOI_HAN', JSON.stringify(ban)); return true; }
  ban.soPhut++; ban.soNgay++;
  p.setProperty('GIOI_HAN', JSON.stringify(ban));
  return false;
}

function ghiNhatKy_(suKien, maHoSo, maYeuCau, ghiChu) {
  try {
    var sh = mo_().getSheetByName(TAB.nhatKy);
    if (!sh) return;
    sh.appendRow([new Date(), suKien, maHoSo || '', maYeuCau || '', ghiChu || '']);
    var n = sh.getLastRow();
    if (n > 3000) sh.deleteRows(2, n - 2000); // giữ khoảng 2000 dòng mới nhất
  } catch (e) { /* nhật ký lỗi không được làm hỏng việc nhận hồ sơ */ }
}

function timDongTheoMa_(sh, khoa, giaTri) {
  var c = chiSoCot_(khoa);
  var n = sh.getLastRow();
  if (n < 2) return 0;
  var f = sh.getRange(2, c, n - 1, 1).createTextFinder(giaTri).matchEntireCell(true).matchCase(true).findNext();
  return f ? f.getRow() : 0;
}

function hangText_(d) {
  return d >= 90 ? 'Đặc biệt' : d >= 75 ? 'Xuất sắc' : d >= 60 ? 'Tiêu biểu' : d >= 50 ? 'Ghi nhận' : 'Chưa đạt ngưỡng';
}

// Công thức từng dòng (các ô "cth"), dùng dấu phẩy (Apps Script luôn dùng cú pháp tiếng Anh)
function congThucDong_(r) {
  var L = function (k) { return cot_(k) + r; };
  var out = {};
  out.diemXepHang = '=IF(' + L('diemHoiDong') + '<>"",' + L('diemHoiDong') + ',IF(' + L('diemMayChu') + '<>"",' + L('diemMayChu') + ',""))';
  out.hang = '=IF(' + L('diemXepHang') + '="","",IF(' + L('diemXepHang') + '>=90,"Đặc biệt",IF(' + L('diemXepHang') + '>=75,"Xuất sắc",IF(' + L('diemXepHang') + '>=60,"Tiêu biểu",IF(' + L('diemXepHang') + '>=50,"Ghi nhận","Chưa đạt ngưỡng")))))';
  out.sauHan = '=IF(OR(' + L('nhom') + '="Hệ A",' + L('nhom') + '="Hệ B"),IF(AND(ISNUMBER(\'' + TAB.tongQuan + '\'!$B$3),' + L('thoiGian') + '>\'' + TAB.tongQuan + '\'!$B$3+1),"Sau hạn",""),"")';
  var dt = '$' + cot_('sdt') + '$2:$' + cot_('sdt');
  var hm = '$' + cot_('hangMuc') + '$2:$' + cot_('hangMuc');
  out.trung = '=IF(' + L('sdt') + '="","",IF(COUNTIFS(' + dt + ',' + L('sdt') + ',' + hm + ',' + L('hangMuc') + ')>1,"Trùng "&COUNTIFS(' + dt + ',' + L('sdt') + ',' + hm + ',' + L('hangMuc') + ')&" hồ sơ cùng SĐT và hạng mục",""))';
  out.khoaXepHang = '=IF(' + L('diemXepHang') + '="",-1,' + L('diemXepHang') + ')';
  return out;
}

/* ============================== Nhận hồ sơ ============================== */

// Trả về { ok:true, id, savedAt, receipt, trung } hoặc { ok:false, loi }
function nhanHoSo_(raw) {
  var kt = chuanHoaHoSo_(raw);
  if (!kt.ok) { ghiNhatKy_('TỪ CHỐI', '', raw && raw.requestId, 'Không hợp lệ: ' + kt.loi); return { ok: false, loi: kt.loi }; }
  var r = kt.r;
  var khoa = LockService.getScriptLock();
  try { khoa.waitLock(25000); } catch (e) { return { ok: false, loi: 'ban', thuLai: true }; }
  try {
    if (!laRiengTu_(false)) { ghiNhatKy_('TỪ CHỐI', '', r.maYeuCau, 'Bảng dữ liệu đang chia sẻ công khai, không ghi'); return { ok: false, loi: 'bang_cong_khai' }; }
    var sh = tabGoc_();
    var dongCu = timDongTheoMa_(sh, 'maYeuCau', r.maYeuCau);
    if (dongCu) {
      var cu = sh.getRange(dongCu, 1, 1, COT.length).getValues()[0];
      ghiNhatKy_('GỬI LẠI (đã có)', cu[chiSoCot_('id') - 1], r.maYeuCau, '');
      var t = cu[chiSoCot_('thoiGian') - 1];
      return { ok: true, id: cu[chiSoCot_('id') - 1], savedAt: (t instanceof Date ? t.toISOString() : String(t)), receipt: cu[chiSoCot_('bienNhan') - 1], trung: true };
    }
    if (vuotGioiHan_()) { ghiNhatKy_('TỪ CHỐI', '', r.maYeuCau, 'Vượt giới hạn tốc độ'); return { ok: false, loi: 'qua_nhieu', thuLai: true }; }

    var p = props_();
    var dongCuoi = sh.getLastRow();
    var idCuoi = dongCuoi >= 2 ? soTuId_(sh.getRange(dongCuoi, 1).getValue()) : 0;
    var so = Math.max(Number(p.getProperty('SEQ') || 0), idCuoi) + 1;
    var id = dinhDangId_(so);
    var bay = new Date();
    var bienNhan = 'VTF-' + hexHmac_(id + '|' + r.maYeuCau + '|' + bay.toISOString()).slice(0, 10);
    var dong = dongCuoi + 1;
    if (dong > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 500);
    var hang = new Array(COT.length);
    for (var i = 0; i < COT.length; i++) hang[i] = '';
    var dat = function (k, v) { hang[chiSoCot_(k) - 1] = (typeof v === 'string') ? anToanO_(v) : v; };
    dat('id', id); dat('thoiGian', bay); dat('hoTen', r.hoTen); dat('sdt', r.sdt); dat('email', r.email); dat('donVi', r.donVi);
    dat('hangMuc', r.hangMuc); dat('nhom', r.nhom); dat('soNam', r.soNam); dat('diemTuCham', r.diemTuCham); dat('diemMayChu', r.diemMayChu);
    dat('truc1', r.truc[0]); dat('truc2', r.truc[1]); dat('truc3', r.truc[2]); dat('truc4', r.truc[3]);
    dat('doiChieu', r.doiChieu); dat('chiTiet', r.chiTiet); dat('tomTat', r.tomTat); dat('linkAnh', r.linkAnh); dat('chuThichAnh', r.chuThichAnh);
    dat('dongY', 'Có'); dat('trangThai', 'Mới'); dat('bienNhan', bienNhan); dat('maYeuCau', r.maYeuCau);
    sh.getRange(dong, 1, 1, COT.length).setValues([hang]);
    var ct = congThucDong_(dong);
    ['diemXepHang', 'hang', 'sauHan', 'trung', 'khoaXepHang'].forEach(function (k) { sh.getRange(dong, chiSoCot_(k)).setFormula(ct[k]); });
    p.setProperty('SEQ', String(so));
    ghiNhatKy_('ĐÃ GHI', id, r.maYeuCau, r.nhom + (r.doiChieu ? ' · ' + r.doiChieu : ''));
    return { ok: true, id: id, savedAt: bay.toISOString(), receipt: bienNhan, trung: false };
  } finally {
    try { khoa.releaseLock(); } catch (e2) { /* đã nhả */ }
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var noiDung = (e && e.postData && e.postData.contents) || '';
    if (noiDung.length > MAX_BYTE_GUI) return json_({ ok: false, loi: 'qua_lon' });
    var body = JSON.parse(noiDung);
    if (!body || body.action !== 'submit') return json_({ ok: false, loi: 'hanh_dong' });
    return json_(nhanHoSo_(body.record));
  } catch (err) {
    var msg = String(err && err.message || err);
    if (msg === 'chua_thiet_lap') return json_({ ok: false, loi: 'chua_thiet_lap' });
    try { ghiNhatKy_('LỖI', '', '', msg.slice(0, 200)); } catch (e2) { /* bỏ qua */ }
    return json_({ ok: false, loi: 'noi_bo' });
  }
}

// Kiểm tra sức khỏe, KHÔNG trả dữ liệu hồ sơ: GET ...?ping=1
function doGet(e) {
  var san = false, rieng = false;
  try { san = !!mo_().getSheetByName(TAB.goc); rieng = san && laRiengTu_(true); } catch (err) { /* chưa thiết lập */ }
  return json_({ ok: true, dich_vu: 'vtf30-ho-so', phien_ban: PHIEN_BAN, san_sang: san, rieng_tu: rieng });
}

/* ============================== Thiết lập (chạy một lần) ============================== */

function timHoacTaoThuMuc_() {
  try { return DriveApp.getFolderById(THU_MUC_RIENG_TU_ID); } catch (e) { /* dự phòng */ }
  var it = DriveApp.getFoldersByName(TEN_THU_MUC_DU_PHONG);
  return it.hasNext() ? it.next() : DriveApp.createFolder(TEN_THU_MUC_DU_PHONG);
}

function taoTab_(ss, ten) {
  var sh = ss.getSheetByName(ten);
  sh = sh ? sh : ss.insertSheet(ten);
  // đủ dòng để công thức xếp hạng không bị "hết chỗ" khi có nhiều hồ sơ
  if (sh.getMaxRows() < SO_DONG_TOI_THIEU) sh.insertRowsAfter(sh.getMaxRows(), SO_DONG_TOI_THIEU - sh.getMaxRows());
  return sh;
}

function thietLap() {
  var p = props_();
  var ss, id = p.getProperty('SHEET_ID');
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(TEN_FILE);
    var file = DriveApp.getFileById(ss.getId());
    file.moveTo(timHoacTaoThuMuc_());
    p.setProperty('SHEET_ID', ss.getId());
  }
  if (!p.getProperty('MUOI')) p.setProperty('MUOI', Utilities.getUuid() + Utilities.getUuid());
  ss.setSpreadsheetTimeZone(MUI_GIO);
  try { ss.setSpreadsheetLocale('vi_VN'); } catch (e) { /* giữ ngôn ngữ mặc định nếu không hỗ trợ */ }

  var goc = taoTab_(ss, TAB.goc);
  var heA = taoTab_(ss, TAB.heA), heB = taoTab_(ss, TAB.heB), khac = taoTab_(ss, TAB.khac);
  var tq = taoTab_(ss, TAB.tongQuan), nk = taoTab_(ss, TAB.nhatKy);
  var macDinh = ss.getSheetByName('Trang tính1') || ss.getSheetByName('Sheet1');
  if (macDinh && ss.getSheets().length > 1) { try { ss.deleteSheet(macDinh); } catch (e) { /* còn dữ liệu */ } }

  dungTongQuan_(tq);
  dungTabGoc_(goc);
  dungXepHang_(heA, 'Hệ A', 'HỆ A – THÀNH TÍCH ĐỈNH CAO: xếp điểm từ cao xuống thấp');
  dungXepHang_(heB, 'Hệ B', 'HỆ B – CỐNG HIẾN DI SẢN PHONG TRÀO: xếp điểm từ cao xuống thấp');
  dungHoSoKhac_(khac);
  dungNhatKy_(nk);
  ss.setActiveSheet(tq);
  [tq, heA, heB, khac, goc, nk].forEach(function (s, i) { ss.setActiveSheet(s); ss.moveActiveSheet(i + 1); });
  ss.setActiveSheet(tq);

  var rieng = laRiengTu_(true);
  Logger.log('Bảng dữ liệu: ' + ss.getUrl());
  Logger.log('Riêng tư (không chia sẻ công khai): ' + (rieng ? 'ĐÚNG' : 'SAI - HÃY TẮT CHIA SẺ CÔNG KHAI TRƯỚC KHI DÙNG'));
  return { url: ss.getUrl(), id: ss.getId(), rieng_tu: rieng };
}

function dungNhatKy_(sh) {
  if (sh.getLastRow() < 1) {
    sh.getRange(1, 1, 1, 5).setValues([['Thời gian', 'Sự kiện', 'Mã hồ sơ', 'Mã yêu cầu', 'Ghi chú (không chứa thông tin cá nhân)']]);
  }
  sh.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#0B1F4D').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.getRange('A2:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sh.setColumnWidths(1, 1, 150); sh.setColumnWidths(2, 1, 150); sh.setColumnWidths(3, 2, 150); sh.setColumnWidths(5, 1, 420);
}

function dungTabGoc_(sh) {
  var n = COT.length;
  var tieuDe = COT.map(function (c) { return c.t; });
  sh.getRange(1, 1, 1, n).setValues([tieuDe]).setFontWeight('bold').setFontColor('#FFFFFF').setWrap(true).setVerticalAlignment('middle').setBackground('#0B1F4D');
  COT.forEach(function (c, i) {
    var cc = i + 1;
    if (c.kieu === 'tay') sh.getRange(1, cc).setBackground('#B45309');
    if (c.kieu === 'cth') sh.getRange(1, cc).setBackground('#475569');
    sh.setColumnWidth(cc, c.rong);
    var vung = sh.getRange(2, cc, sh.getMaxRows() - 1, 1);
    if (c.kieu === 'chu') vung.setNumberFormat('@');
    if (c.kieu === 'ngay') vung.setNumberFormat('dd/MM/yyyy HH:mm:ss');
    if (c.k === 'doiChieu' || c.k === 'trangThai' || c.k === 'ghiChu') vung.setNumberFormat('@');
  });
  sh.setRowHeight(1, 52);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);
  sh.hideColumns(chiSoCot_('khoaXepHang'));
  sh.hideColumns(chiSoCot_('chiTiet'));
  sh.hideColumns(chiSoCot_('maYeuCau'));
  // danh sách chọn cho Trạng thái
  var ruleTT = SpreadsheetApp.newDataValidation().requireValueInList(TRANG_THAI, true).setAllowInvalid(true).build();
  sh.getRange(2, chiSoCot_('trangThai'), sh.getMaxRows() - 1, 1).setDataValidation(ruleTT);
  // điểm Hội đồng phải là số 0-100 (nếu nhập)
  var ruleDiem = SpreadsheetApp.newDataValidation().requireNumberBetween(0, 100).setAllowInvalid(false).setHelpText('Nhập điểm từ 0 đến 100, hoặc để trống').build();
  sh.getRange(2, chiSoCot_('diemHoiDong'), sh.getMaxRows() - 1, 1).setDataValidation(ruleDiem);
  // tô màu
  var cdd = [];
  var vungHang = sh.getRange(2, chiSoCot_('hang'), sh.getMaxRows() - 1, 1);
  var mau = [['Đặc biệt', '#FDE68A'], ['Xuất sắc', '#BBF7D0'], ['Tiêu biểu', '#BFDBFE'], ['Ghi nhận', '#E5E7EB']];
  mau.forEach(function (m) { cdd.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(m[0]).setBackground(m[1]).setRanges([vungHang]).build()); });
  cdd.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('LỆCH').setBackground('#FCA5A5').setBold(true).setRanges([sh.getRange(2, chiSoCot_('doiChieu'), sh.getMaxRows() - 1, 1)]).build());
  cdd.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Sau hạn').setBackground('#FDBA74').setRanges([sh.getRange(2, chiSoCot_('sauHan'), sh.getMaxRows() - 1, 1)]).build());
  cdd.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Trùng').setBackground('#FCA5A5').setRanges([sh.getRange(2, chiSoCot_('trung'), sh.getMaxRows() - 1, 1)]).build());
  sh.setConditionalFormatRules(cdd);
  // bảo vệ: cảnh báo khi sửa dữ liệu gốc, trừ ba cột nhập tay
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (pr) { pr.remove(); });
  var bv = sh.protect().setDescription('Dữ liệu gốc do hệ thống ghi. Chỉ sửa các cột có chữ NHẬP TAY.').setWarningOnly(true);
  var tay = [chiSoCot_('diemHoiDong'), chiSoCot_('trangThai'), chiSoCot_('ghiChu')].map(function (c) { return sh.getRange(2, c, sh.getMaxRows() - 1, 1); });
  bv.setUnprotectedRanges(tay);
}

var COT_XEP_HANG = [
  ['id', 'Mã hồ sơ', 95], ['hoTen', 'Họ và tên', 190], ['donVi', 'Đơn vị', 220], ['diemXepHang', 'Điểm xếp hạng', 85], ['hang', 'Hạng', 110],
  ['diemTuCham', 'Điểm người nộp gửi (chỉ để đối chiếu)', 100], ['diemMayChu', 'Điểm máy chủ tính lại', 90], ['diemHoiDong', 'Điểm Hội đồng', 80], ['doiChieu', 'Đối chiếu điểm', 110],
  ['truc1', 'Trục 1', 55], ['truc2', 'Trục 2', 55], ['truc3', 'Trục 3', 55], ['truc4', 'Trục 4', 55], ['soNam', 'Số năm', 60],
  ['sdt', 'Số điện thoại', 105], ['email', 'Email', 190], ['thoiGian', 'Thời gian nhận', 135], ['trangThai', 'Trạng thái', 140], ['sauHan', 'Nộp sau hạn?', 90], ['tomTat', 'Tóm tắt thành tích', 420]
];

function dungXepHang_(sh, nhom, tieuDe) {
  sh.clear();
  sh.clearConditionalFormatRules();
  var soCot = COT_XEP_HANG.length + 1; // +1: cột thứ tự
  sh.getRange(1, 1).setValue(tieuDe).setFontWeight('bold').setFontSize(13).setFontColor('#0B1F4D');
  var hang2 = ['Thứ tự'].concat(COT_XEP_HANG.map(function (c) { return c[1]; }));
  sh.getRange(2, 1, 1, soCot).setValues([hang2]).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#0B1F4D').setWrap(true).setVerticalAlignment('middle');
  sh.setRowHeight(2, 44);
  sh.setFrozenRows(2);
  sh.setFrozenColumns(3);
  var mang = COT_XEP_HANG.map(function (c) { return dai_(c[0]); }).join(', ');
  var dk = dai_('nhom') + '="' + nhom + '"';
  var f = '=IFERROR(SORT(FILTER({' + mang + '}, ' + dk + '), FILTER(' + dai_('khoaXepHang') + ', ' + dk + '), FALSE, FILTER(' + dai_('thoiGian') + ', ' + dk + '), TRUE), "Chưa có hồ sơ nào thuộc nhóm này.")';
  sh.getRange(3, 2).setFormula(f);
  sh.getRange(3, 1).setFormula('=ARRAYFORMULA(IF(C3:C="","",ROW(C3:C)-2))');
  sh.setColumnWidth(1, 55);
  COT_XEP_HANG.forEach(function (c, i) { sh.setColumnWidth(i + 2, c[2]); });
  var idx = function (k) { for (var i = 0; i < COT_XEP_HANG.length; i++) if (COT_XEP_HANG[i][0] === k) return i + 2; return 0; };
  var dongDem = sh.getMaxRows() - 2;
  sh.getRange(3, idx('thoiGian'), dongDem, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(3, idx('sdt'), dongDem, 1).setNumberFormat('@');
  var cdd = [];
  var vh = sh.getRange(3, idx('hang'), dongDem, 1);
  [['Đặc biệt', '#FDE68A'], ['Xuất sắc', '#BBF7D0'], ['Tiêu biểu', '#BFDBFE'], ['Ghi nhận', '#E5E7EB']].forEach(function (m) {
    cdd.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(m[0]).setBackground(m[1]).setRanges([vh]).build());
  });
  cdd.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('LỆCH').setBackground('#FCA5A5').setBold(true).setRanges([sh.getRange(3, idx('doiChieu'), dongDem, 1)]).build());
  cdd.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Sau hạn').setBackground('#FDBA74').setRanges([sh.getRange(3, idx('sauHan'), dongDem, 1)]).build());
  sh.setConditionalFormatRules(cdd);
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (pr) { pr.remove(); });
  sh.protect().setDescription('Bảng xếp hạng tự động từ tab Tất cả hồ sơ. Nhập điểm Hội đồng ở tab Tất cả hồ sơ.').setWarningOnly(true);
}

function dungHoSoKhac_(sh) {
  sh.clear();
  sh.getRange(1, 1).setValue('HỒ SƠ KHÁC: Kỷ yếu 34 tỉnh/thành, đăng ký Gala 19/12/2026, Kỷ yếu Bản Vàng (mới nhất ở trên)').setFontWeight('bold').setFontSize(13).setFontColor('#0B1F4D');
  var cacCot = [['id', 'Mã hồ sơ', 95], ['thoiGian', 'Thời gian nhận', 135], ['hoTen', 'Họ và tên', 190], ['donVi', 'Đơn vị', 220], ['hangMuc', 'Hạng mục', 280], ['sdt', 'Số điện thoại', 105], ['email', 'Email', 190], ['tomTat', 'Nội dung', 420], ['linkAnh', 'Link kho ảnh', 220], ['chuThichAnh', 'Chú thích ảnh', 220], ['trangThai', 'Trạng thái', 140], ['trung', 'Trùng hồ sơ?', 200]];
  sh.getRange(2, 1, 1, cacCot.length).setValues([cacCot.map(function (c) { return c[1]; })]).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#0B1F4D').setWrap(true);
  sh.setFrozenRows(2);
  var mang = cacCot.map(function (c) { return dai_(c[0]); }).join(', ');
  var dk = dai_('nhom') + '="Khác"';
  sh.getRange(3, 1).setFormula('=IFERROR(SORT(FILTER({' + mang + '}, ' + dk + '), FILTER(' + dai_('thoiGian') + ', ' + dk + '), FALSE), "Chưa có hồ sơ nào thuộc nhóm này.")');
  cacCot.forEach(function (c, i) { sh.setColumnWidth(i + 1, c[2]); });
  sh.getRange(3, 2, sh.getMaxRows() - 2, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(3, 6, sh.getMaxRows() - 2, 1).setNumberFormat('@');
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (pr) { pr.remove(); });
  sh.protect().setDescription('Danh sách tự động từ tab Tất cả hồ sơ.').setWarningOnly(true);
}

function dungTongQuan_(sh) {
  var giuHan = sh.getRange('B3').getValue();
  sh.clear();
  sh.getRange('A1').setValue('VTF 30 NĂM - TỔNG QUAN HỒ SƠ ĐỀ CỬ VÀ ĐĂNG KÝ (RIÊNG TƯ)').setFontWeight('bold').setFontSize(14).setFontColor('#0B1F4D');
  var hang = [
    ['Hạn nộp hồ sơ khen thưởng Hệ A, Hệ B (sửa được)', giuHan instanceof Date ? giuHan : HAN_NOP_MAC_DINH],
    ['Tổng số hồ sơ', '=COUNTA(' + dai_('id') + ')'],
    ['  Hệ A - Thành tích đỉnh cao', '=COUNTIF(' + dai_('nhom') + ',"Hệ A")'],
    ['  Hệ B - Cống hiến di sản', '=COUNTIF(' + dai_('nhom') + ',"Hệ B")'],
    ['  Hồ sơ khác (kỷ yếu, Gala, Bản Vàng)', '=COUNTIF(' + dai_('nhom') + ',"Khác")'],
    ['Hồ sơ Hệ A/B chưa có điểm xếp hạng (chưa có chi tiết chấm điểm và chưa có điểm Hội đồng)', '=COUNTIFS(' + dai_('nhom') + ',"Hệ A",' + dai_('diemXepHang') + ',"")+COUNTIFS(' + dai_('nhom') + ',"Hệ B",' + dai_('diemXepHang') + ',"")'],
    ['Hồ sơ có điểm LỆCH giữa người nộp và máy chủ', '=COUNTIF(' + dai_('doiChieu') + ',"LỆCH")'],
    ['Hồ sơ nộp sau hạn', '=COUNTIF(' + dai_('sauHan') + ',"Sau hạn")'],
    ['Hồ sơ trùng SĐT và hạng mục', '=COUNTIF(' + dai_('trung') + ',"Trùng*")'],
    ['Hồ sơ nhận gần nhất', '=IFERROR(MAX(' + dai_('thoiGian') + '),"")']
  ];
  sh.getRange(3, 1, hang.length, 2).setValues(hang.map(function (h) { return [h[0], '']; }));
  hang.forEach(function (h, i) { if (String(h[1]).charAt(0) === '=') sh.getRange(3 + i, 2).setFormula(h[1]); else sh.getRange(3 + i, 2).setValue(h[1]); });
  sh.getRange('B3').setNumberFormat('dd/MM/yyyy').setBackground('#FEF3C7');
  sh.getRange('B12').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  // bảng hạng theo hệ
  sh.getRange('A15').setValue('Số hồ sơ theo hạng (theo điểm dùng để xếp hạng)').setFontWeight('bold');
  sh.getRange('A16:D16').setValues([['Hạng', 'Hệ A', 'Hệ B', 'Ngưỡng điểm']]).setFontWeight('bold').setBackground('#E2E8F0');
  var cacHang = [['Đặc biệt', '90 - 100'], ['Xuất sắc', '75 - 89'], ['Tiêu biểu', '60 - 74'], ['Ghi nhận', '50 - 59'], ['Chưa đạt ngưỡng', 'dưới 50']];
  cacHang.forEach(function (h, i) {
    var r = 17 + i;
    sh.getRange(r, 1).setValue(h[0]);
    sh.getRange(r, 2).setFormula('=COUNTIFS(' + dai_('nhom') + ',"Hệ A",' + dai_('hang') + ',A' + r + ')');
    sh.getRange(r, 3).setFormula('=COUNTIFS(' + dai_('nhom') + ',"Hệ B",' + dai_('hang') + ',A' + r + ')');
    sh.getRange(r, 4).setValue(h[1]);
  });
  var huongDan = [
    'HƯỚNG DẪN CHO BAN TỔ CHỨC / HỘI ĐỒNG',
    '1. Hồ sơ mới tự động xuất hiện ở tab "Tất cả hồ sơ"; các tab Hệ A, Hệ B, Hồ sơ khác tự cập nhật, không cần làm gì.',
    '2. Xếp hạng: điểm cao xuống thấp; bằng điểm thì hồ sơ nộp trước đứng trước. Điểm dùng để xếp hạng = Điểm Hội đồng (nếu đã nhập), nếu chưa thì Điểm máy chủ tính lại từ các lựa chọn. Điểm do người nộp tự gửi KHÔNG dùng để xếp hạng, chỉ để đối chiếu. Hồ sơ chưa có điểm nằm cuối bảng.',
    '3. Điểm máy chủ tính lại là điểm SƠ BỘ từ máy tính nhanh trên trang (chưa kiểm điều kiện nền và minh chứng). Điểm chính thức do Hội đồng quyết định: nhập vào cột "Điểm Hội đồng chấm" ở tab "Tất cả hồ sơ" thì bảng xếp hạng tự đổi theo.',
    '4. Cột "Đối chiếu điểm": Khớp = điểm người nộp gửi bằng điểm máy chủ tính lại; LỆCH = không bằng nhau (cần kiểm tra); Không có chi tiết = hồ sơ không kèm các lựa chọn chấm điểm; Sai hệ = điểm chấm theo hệ khác hạng mục đã chọn; Chi tiết không hợp lệ = các lựa chọn gửi lên không đúng danh sách của máy tính điểm. Ba trường hợp sau không có điểm xếp hạng cho đến khi Hội đồng nhập điểm.',
    '5. Chỉ nhập tay vào 3 cột có chữ NHẬP TAY (Điểm Hội đồng, Trạng thái, Ghi chú). Không chèn/xóa cột ở tab "Tất cả hồ sơ" vì các bảng xếp hạng đọc theo cột.',
    '6. Bảng này RIÊNG TƯ. Không chia sẻ "bất kỳ ai có liên kết". Cần cho người khác xem thì thêm đích danh email của họ. Hệ thống tự từ chối ghi nếu bảng bị chia sẻ công khai.',
    '7. Hạn nộp ở ô B3 chỉ dùng để đánh dấu "Sau hạn", không chặn việc nhận hồ sơ.'
  ];
  huongDan.forEach(function (t, i) { sh.getRange(24 + i, 1).setValue(t); });
  sh.getRange('A24').setFontWeight('bold');
  sh.setColumnWidth(1, 520); sh.setColumnWidth(2, 150); sh.setColumnWidth(3, 110); sh.setColumnWidth(4, 110);
  sh.getRange(24, 1, huongDan.length, 1).setWrap(false);
}

/* ============================== Kiểm thử trong trình soạn thảo (không dùng khi chạy thật) ============================== */

var TIEN_TO_THU = 'ZZ-KIEM-THU';

function banGhiThu_(i, loai, diem, dieuChinh) {
  var he = loai === 'nomination_a' ? 'A' : 'B';
  var raw = {
    requestId: 'thu-' + Utilities.getUuid().replace(/-/g, '').slice(0, 20),
    fullName: TIEN_TO_THU + ' ' + i, phone: '09' + ('00000000' + (10000000 + i)).slice(-8), email: 'kiem-thu-' + i + '@example.invalid',
    organization: 'Đơn vị kiểm thử', submissionType: loai, yearsContributed: 10,
    scoreClaimed: diem, scoreServer: diem, scoreAxes: diem === null ? null : [Math.floor(diem / 2), 10, 10, diem - Math.floor(diem / 2) - 20],
    scoreDetail: diem === null ? null : { he: he, years: 10 }, scoreCheck: diem === null ? 'Không có chi tiết' : 'Khớp',
    message: 'Hồ sơ kiểm thử tự động, sẽ bị xóa ngay sau khi kiểm tra xong.', photoAlbumUrl: '', photoCaptions: '', consent: true
  };
  if (dieuChinh) for (var k in dieuChinh) raw[k] = dieuChinh[k];
  return raw;
}

function xoaBanGhiThu_() {
  var sh = tabGoc_();
  var n = sh.getLastRow();
  var xoa = 0;
  for (var r = n; r >= 2; r--) {
    if (String(sh.getRange(r, chiSoCot_('hoTen')).getValue()).indexOf(TIEN_TO_THU) === 0) { sh.deleteRow(r); xoa++; }
  }
  var cuoi = sh.getLastRow();
  props_().setProperty('SEQ', String(cuoi >= 2 ? soTuId_(sh.getRange(cuoi, 1).getValue()) : 0));
  return xoa;
}

// Chạy hàm này trong trình soạn thảo: ghi 7 hồ sơ thử, kiểm tra thứ tự các bảng xếp hạng, rồi XÓA hồ sơ thử.
function kiemThuToanBo() {
  var kq = { loi: [], ghi: [] };
  var ok = function (dieuKien, mota) { if (!dieuKien) kq.loi.push(mota); };
  xoaBanGhiThu_();
  var truoc = tabGoc_().getLastRow();
  var cacHoSo = [
    banGhiThu_(1, 'nomination_a', 80), banGhiThu_(2, 'nomination_a', 95), banGhiThu_(3, 'nomination_a', 95),
    banGhiThu_(4, 'nomination_b', 60), banGhiThu_(5, 'nomination_b', 88), banGhiThu_(6, 'nomination_b', null),
    banGhiThu_(7, 'gala_registration', null)
  ];
  cacHoSo.forEach(function (h, i) { Utilities.sleep(1100); var r = nhanHoSo_(h); kq.ghi.push(r.id); ok(r.ok && !r.trung, 'ghi hồ sơ ' + (i + 1)); });
  // gửi lại cùng requestId: không tạo dòng mới
  var lai = nhanHoSo_(cacHoSo[0]);
  ok(lai.ok && lai.trung === true && lai.id === kq.ghi[0], 'gửi lại phải trả về hồ sơ cũ');
  ok(tabGoc_().getLastRow() === truoc + 7, 'không được thêm dòng khi gửi lại');
  // chặn công thức
  var doc = nhanHoSo_(banGhiThu_(8, 'nomination_b', 70, { message: '=HYPERLINK("http://x","y") nội dung kiểm thử công thức bị chặn' }));
  ok(doc.ok, 'ghi hồ sơ có công thức');
  var dong = tabGoc_().getLastRow();
  var oTomTat = tabGoc_().getRange(dong, chiSoCot_('tomTat'));
  ok(oTomTat.getFormula() === '' && String(oTomTat.getValue()).indexOf('=HYPERLINK') === 1, 'công thức trong nội dung phải thành văn bản (có dấu nháy chặn): ' + oTomTat.getValue());
  // từ chối dữ liệu xấu
  ok(nhanHoSo_(banGhiThu_(9, 'nomination_a', 50, { phone: '123' })).ok === false, 'sdt xấu phải bị từ chối');
  ok(nhanHoSo_(banGhiThu_(9, 'nomination_a', 50, { email: 'abc' })).ok === false, 'email xấu phải bị từ chối');
  ok(nhanHoSo_(banGhiThu_(9, 'khong_co', 50)).ok === false, 'loại lạ phải bị từ chối');
  ok(nhanHoSo_(banGhiThu_(9, 'nomination_a', 150)).ok === false, 'điểm 150 phải bị từ chối');
  ok(nhanHoSo_(banGhiThu_(9, 'nomination_a', 50, { consent: false })).ok === false, 'không đồng ý phải bị từ chối');
  SpreadsheetApp.flush(); Utilities.sleep(1500);
  // thứ tự bảng xếp hạng
  var layTen = function (tenTab) {
    var sh = mo_().getSheetByName(tenTab); var v = sh.getRange(3, 1, 12, 5).getValues();
    return v.filter(function (x) { return String(x[2]).indexOf(TIEN_TO_THU) === 0; }).map(function (x) { return x[0] + ':' + String(x[2]).replace(TIEN_TO_THU + ' ', '') + ':' + x[4]; });
  };
  var a = layTen(TAB.heA), b = layTen(TAB.heB);
  kq.heA = a; kq.heB = b;
  ok(a.length === 3 && a[0].indexOf(':2:') > 0 && a[1].indexOf(':3:') > 0 && a[2].indexOf(':1:') > 0, 'Hệ A phải là 2 (95, nộp trước), 3 (95), 1 (80): ' + JSON.stringify(a));
  ok(b.length >= 3 && b[0].indexOf(':5:') > 0 && b[1].indexOf(':8:') > 0, 'Hệ B phải bắt đầu 5 (88), 8 (70): ' + JSON.stringify(b));
  var hangB = b.map(function (s) { return s.split(':')[1]; });
  ok(hangB.indexOf('6') === hangB.length - 1, 'hồ sơ chưa có điểm (6) phải nằm cuối Hệ B: ' + JSON.stringify(b));
  var k = mo_().getSheetByName(TAB.khac).getRange(3, 1, 3, 3).getValues();
  ok(String(k[0][2]).indexOf(TIEN_TO_THU + ' 7') === 0, 'tab Hồ sơ khác phải có hồ sơ gala');
  // điểm Hội đồng ghi đè
  var sh = tabGoc_();
  var dong1 = timDongTheoMa_(sh, 'id', kq.ghi[0]);
  sh.getRange(dong1, chiSoCot_('diemHoiDong')).setValue(99);
  SpreadsheetApp.flush(); Utilities.sleep(1500);
  var a2 = layTen(TAB.heA);
  ok(a2.length === 3 && a2[0].indexOf(':1:') > 0, 'điểm Hội đồng 99 phải đưa hồ sơ 1 lên đầu: ' + JSON.stringify(a2));
  ok(laRiengTu_(true), 'bảng dữ liệu phải riêng tư');
  var daXoa = xoaBanGhiThu_();
  kq.daXoa = daXoa;
  ok(tabGoc_().getLastRow() === truoc, 'sau khi xóa phải về số dòng ban đầu');
  kq.ketQua = kq.loi.length ? 'CÓ LỖI' : 'TẤT CẢ ĐẠT';
  Logger.log(JSON.stringify(kq, null, 1));
  return kq;
}
