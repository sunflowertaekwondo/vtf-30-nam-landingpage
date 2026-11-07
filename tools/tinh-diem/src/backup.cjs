/* Xuất dữ liệu, nhập/gộp và nhắc sao lưu. Hàm thuần, chạy trong trình duyệt (globalThis.VTF_BACKUP) và Node (require).
 *  - Bảng xuất (tổng hợp, chi tiết điểm, phiên bản, nhật ký) cho Excel/CSV.
 *  - Gói JSON đầy đủ để sao lưu và nhập lại.
 *  - Kiểm tra tệp nhập, lập kế hoạch gộp (phát hiện trùng, xung đột phiên bản).
 *  - Quy tắc nhắc sao lưu. */
(function (root) {
  'use strict';

  var HS = (typeof require === 'function' && typeof module !== 'undefined' && module.exports) ? require('./history.cjs') : root.VTF_HISTORY;
  var RULES = (typeof require === 'function' && typeof module !== 'undefined' && module.exports) ? require('./rules-036.cjs') : root.VTF_RULES;

  var APP = 'vtf-tinh-diem';
  var SCHEMA = 1;
  var MAX_BYTES = 20 * 1024 * 1024;
  var NGUONG_THAY_DOI = 20;   // nhắc sao lưu sau ngần ấy thay đổi chưa sao lưu
  var NGUONG_NGAY = 7;        // hoặc sau ngần ấy ngày kể từ lần sao lưu/thay đổi đầu tiên

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtGio(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || '');
    return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function fmtNgay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : (s || '');
  }
  function tenFile(ext, now) {
    var d = now instanceof Date ? now : new Date(now || Date.now());
    return 'VTF-tinh-diem-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.' + ext;
  }

  /* ---------- Bảng xuất ---------- */
  var COT_TONG_HOP = ['Mã hồ sơ', 'Hệ', 'Họ và tên', 'Đơn vị', 'Vai trò chính', 'Người chấm', 'Ngày chấm', 'Phiên bản', 'Trạng thái',
    'Điều kiện nền', 'Điểm Trục 1', 'Điểm Trục 2', 'Điểm Trục 3', 'Điểm Trục 4', 'Tổng điểm', 'Hạng', 'Tiêu chí áp dụng',
    'Cập nhật lúc', 'Số mục không tính', 'Lưu ý', 'Ghi chú'];

  function diemTruc(kq, id) {
    for (var i = 0; i < kq.truc.length; i++) if (kq.truc[i].id === id) return kq.truc[i].diem;
    return 0;
  }

  function bangTongHop(records) {
    var rows = [COT_TONG_HOP.slice()];
    records.forEach(function (rec) {
      var v = HS.latest(rec); var kq = v.ketQua; var tt = (v.input && v.input.thongTin) || {};
      rows.push([
        rec.id, kq.he, tt.hoTen || '', tt.donVi || '', tt.vaiTroChinh || '', v.nguoiCham || '', fmtNgay(tt.ngayCham),
        rec.versions.length, rec.locked ? 'Đã chốt' : 'Chưa chốt',
        kq.duocXet ? 'Đạt' : 'Chưa đạt',
        diemTruc(kq, 'truc1'), diemTruc(kq, 'truc2'), diemTruc(kq, 'truc3'), diemTruc(kq, 'truc4'), kq.tong,
        kq.duocXet ? kq.hang.ten : 'Chưa đủ điều kiện xét',
        v.ruleVersion, fmtGio(v.savedAt), (kq.mucBiLoai || []).length, (kq.canhBao || []).join(' | '), tt.ghiChu || ''
      ]);
    });
    return rows;
  }

  function bangChiTiet(records) {
    var rows = [['Mã hồ sơ', 'Họ và tên', 'Trục', 'Nội dung', 'Điểm', 'Được tính', 'Ghi chú']];
    records.forEach(function (rec) {
      var v = HS.latest(rec); var kq = v.ketQua; var ten = ((v.input && v.input.thongTin) || {}).hoTen || '';
      kq.dieuKien.forEach(function (d) {
        rows.push([rec.id, ten, 'Điều kiện nền', d.nhan, '', d.dat ? 'Đạt' : 'Chưa đạt', d.lyDo || '']);
      });
      kq.truc.forEach(function (t) {
        t.chiTiet.forEach(function (c) {
          rows.push([rec.id, ten, t.ten, (c.nhom ? c.nhom + ': ' : '') + c.nhan, c.tinh ? c.diem : 0, c.tinh ? 'Có' : 'Không', c.ghiChu || '']);
        });
        rows.push([rec.id, ten, t.ten, 'Cộng trục', t.diem, '', 'Tối đa ' + t.toiDa]);
      });
      (kq.mucBiLoai || []).forEach(function (m) {
        rows.push([rec.id, ten, 'Mục không tính', m.nhan, 0, 'Không', m.lyDo]);
      });
    });
    return rows;
  }

  function bangPhienBan(records) {
    var rows = [['Mã hồ sơ', 'Họ và tên', 'Phiên bản', 'Lưu lúc', 'Người chấm', 'Lý do sửa', 'Tổng điểm', 'Hạng', 'Tiêu chí áp dụng']];
    records.forEach(function (rec) {
      rec.versions.forEach(function (v) {
        var kq = v.ketQua;
        rows.push([rec.id, ((v.input && v.input.thongTin) || {}).hoTen || '', v.v, fmtGio(v.savedAt), v.nguoiCham || '', v.lyDo || '',
          kq.tong, kq.duocXet ? kq.hang.ten : 'Chưa đủ điều kiện xét', v.ruleVersion]);
      });
    });
    return rows;
  }

  var LOAI_NK = { tao: 'Tạo hồ sơ', sua: 'Sửa hồ sơ', chot: 'Chốt hồ sơ', mo_khoa: 'Mở khóa' };
  function bangNhatKy(records) {
    var rows = [['Mã hồ sơ', 'Họ và tên', 'Thời điểm', 'Thao tác', 'Phiên bản', 'Người thực hiện', 'Lý do']];
    records.forEach(function (rec) {
      var ten = ((HS.latest(rec).input && HS.latest(rec).input.thongTin) || {}).hoTen || '';
      (rec.nhatKy || []).forEach(function (n) {
        rows.push([rec.id, ten, fmtGio(n.t), LOAI_NK[n.loai] || n.loai, n.v || '', n.nguoi || '', n.lyDo || '']);
      });
    });
    return rows;
  }

  function cacTrang(records) {
    return [
      { name: 'Tổng hợp', rows: bangTongHop(records) },
      { name: 'Chi tiết điểm', rows: bangChiTiet(records) },
      { name: 'Phiên bản', rows: bangPhienBan(records) },
      { name: 'Nhật ký', rows: bangNhatKy(records) }
    ];
  }

  /* ---------- CSV ---------- */
  /* Dấu chấm phẩy (Excel tiếng Việt dùng dấu phẩy làm dấu thập phân) và BOM UTF-8 để đúng tiếng Việt.
   * KHÔNG thêm dòng "sep=;": đã thử với Excel 16 thật, dòng này làm Excel bỏ qua BOM và hiện sai dấu tiếng Việt. */
  function csvCell(v) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s; // chặn chèn công thức khi mở bằng Excel
    if (/[;"\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function toCsv(rows) {
    return '﻿' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n') + '\r\n';
  }

  /* ---------- Gói JSON ---------- */
  function envelope(records, now) {
    return {
      app: APP, schema: SCHEMA,
      exportedAt: (now instanceof Date ? now : new Date(now || Date.now())).toISOString(),
      ruleVersion: RULES.version,
      soHoSo: records.length,
      records: records
    };
  }

  function kiemTraBanGhi(r) {
    if (!r || typeof r !== 'object') return 'không phải đối tượng';
    if (typeof r.id !== 'string' || !r.id || r.id.length > 80) return 'thiếu mã hồ sơ';
    if (!Array.isArray(r.versions) || !r.versions.length) return 'không có phiên bản nào';
    for (var i = 0; i < r.versions.length; i++) {
      var v = r.versions[i];
      if (!v || typeof v.v !== 'number' || typeof v.savedAt !== 'string' || isNaN(new Date(v.savedAt).getTime())) return 'phiên bản ' + (i + 1) + ' thiếu số hoặc thời điểm lưu';
      if (!v.input || typeof v.input !== 'object') return 'phiên bản ' + (i + 1) + ' thiếu dữ liệu nhập';
      var kq = v.ketQua;
      if (!kq || typeof kq.tong !== 'number' || typeof kq.duocXet !== 'boolean' || (kq.he !== 'A' && kq.he !== 'B') ||
        !Array.isArray(kq.truc) || !Array.isArray(kq.dieuKien)) return 'phiên bản ' + (i + 1) + ' thiếu kết quả tính điểm';
      if (kq.duocXet && !(kq.hang && typeof kq.hang.id === 'string' && typeof kq.hang.ten === 'string')) return 'phiên bản ' + (i + 1) + ' thiếu hạng';
    }
    return null;
  }

  function chuanHoaBanGhi(r) {
    var c = clone(r);
    c.he = c.versions[c.versions.length - 1].ketQua.he;
    c.locked = !!c.locked;
    c.nhatKy = Array.isArray(c.nhatKy) ? c.nhatKy : [];
    c.createdAt = typeof c.createdAt === 'string' ? c.createdAt : c.versions[0].savedAt;
    c.updatedAt = typeof c.updatedAt === 'string' ? c.updatedAt : c.versions[c.versions.length - 1].savedAt;
    c.versions.forEach(function (v) {
      v.input.thongTin = (v.input.thongTin && typeof v.input.thongTin === 'object') ? v.input.thongTin : {};
      v.nguoiCham = typeof v.nguoiCham === 'string' ? v.nguoiCham : '';
      v.lyDo = typeof v.lyDo === 'string' ? v.lyDo : '';
      v.ketQua.canhBao = Array.isArray(v.ketQua.canhBao) ? v.ketQua.canhBao : [];
      v.ketQua.mucBiLoai = Array.isArray(v.ketQua.mucBiLoai) ? v.ketQua.mucBiLoai : [];
    });
    return c;
  }

  /* Đọc JSON và bỏ khóa "__proto__" (tệp lạ không được đổi nguyên mẫu đối tượng khi gộp vào dữ liệu). */
  function parseSafe(t) { return JSON.parse(t, function (k, v) { return k === '__proto__' ? undefined : v; }); }

  /* text: nội dung JSON. Trả { ok, records, loi: [], canhBao: [] }. */
  function docGoi(text) {
    var out = { ok: false, records: [], loi: [], canhBao: [] };
    if (typeof text !== 'string' || !text.trim()) { out.loi.push('Tệp trống.'); return out; }
    if (text.length > MAX_BYTES) { out.loi.push('Tệp quá lớn (trên 20 MB).'); return out; }
    var data;
    try { data = parseSafe(text.replace(/^﻿/, '')); } catch (e) { out.loi.push('Tệp không phải JSON hợp lệ.'); return out; }
    var list;
    if (Array.isArray(data)) list = data;
    else if (data && typeof data === 'object' && Array.isArray(data.records)) {
      if (data.app && data.app !== APP) { out.loi.push('Tệp này không phải bản sao lưu của công cụ này.'); return out; }
      if (typeof data.schema === 'number' && data.schema > SCHEMA) { out.loi.push('Tệp được tạo bởi phiên bản công cụ mới hơn, chưa đọc được. Hãy cập nhật công cụ.'); return out; }
      list = data.records;
    } else { out.loi.push('Không tìm thấy danh sách hồ sơ trong tệp.'); return out; }
    var seen = {};
    list.forEach(function (r, i) {
      var e = kiemTraBanGhi(r);
      if (e) { out.loi.push('Hồ sơ thứ ' + (i + 1) + ' bị bỏ qua: ' + e + '.'); return; }
      if (seen[r.id]) { out.canhBao.push('Mã hồ sơ ' + r.id + ' xuất hiện nhiều lần trong tệp, chỉ lấy bản đầu tiên.'); return; }
      seen[r.id] = 1;
      var c = chuanHoaBanGhi(r);
      var khac = c.versions.filter(function (v) { return v.ruleVersion !== RULES.version; }).length;
      if (khac) out.canhBao.push('Hồ sơ "' + (HS.latest(c).input.thongTin.hoTen || c.id) + '" có ' + khac + ' phiên bản tính theo tiêu chí khác (' + (c.versions[0].ruleVersion || '?') + '). Điểm giữ nguyên như đã lưu.');
      out.records.push(c);
    });
    out.ok = out.records.length > 0;
    if (!out.ok && !out.loi.length) out.loi.push('Tệp không có hồ sơ nào.');
    return out;
  }

  /* ---------- Gộp ---------- */
  function khoaTrung(rec) {
    var v = HS.latest(rec); var tt = (v.input && v.input.thongTin) || {};
    return [rec.he, HS.chuanHoa(tt.hoTen), HS.chuanHoa(tt.donVi)].join('|');
  }
  function phanKy(a, b) { // true nếu phiên bản của a trùng với phần đầu của b
    for (var i = 0; i < a.versions.length; i++) {
      if (!b.versions[i] || a.versions[i].v !== b.versions[i].v || a.versions[i].savedAt !== b.versions[i].savedAt) return true;
    }
    return false;
  }

  /* Trả danh sách mục: { rec, loai, macDinh, tuyChon:[{v, t}], hienCo? }.
   * loai: moi | nghi_trung | giong | cap_nhat | cu_hon | xung_dot */
  function lapKeHoachGop(existing, incoming) {
    var byId = {}; var byKey = {};
    existing.forEach(function (r) { byId[r.id] = r; var k = khoaTrung(r); (byKey[k] = byKey[k] || []).push(r); });
    return incoming.map(function (inc) {
      var ex = byId[inc.id];
      if (ex) {
        var a = ex; var b = inc;
        var xungDot = a.versions.length <= b.versions.length ? phanKy(a, b) : phanKy(b, a);
        if (xungDot) return { rec: inc, hienCo: ex, loai: 'xung_dot', macDinh: 'bo_qua', tuyChon: [{ v: 'bo_qua', t: 'Giữ bản trong máy' }, { v: 'them_moi', t: 'Thêm bản nhập thành hồ sơ mới' }] };
        var ra = [a.versions.length, (a.nhatKy || []).length]; var rb = [b.versions.length, (b.nhatKy || []).length];
        var cmp = rb[0] - ra[0] || rb[1] - ra[1];
        if (cmp > 0) return { rec: inc, hienCo: ex, loai: 'cap_nhat', macDinh: 'ghi_de', tuyChon: [{ v: 'ghi_de', t: 'Cập nhật bằng bản nhập (mới hơn)' }, { v: 'bo_qua', t: 'Giữ bản trong máy' }] };
        if (cmp < 0) return { rec: inc, hienCo: ex, loai: 'cu_hon', macDinh: 'bo_qua', tuyChon: [{ v: 'bo_qua', t: 'Giữ bản trong máy (mới hơn)' }, { v: 'ghi_de', t: 'Ghi đè bằng bản nhập (cũ hơn)' }] };
        return { rec: inc, hienCo: ex, loai: 'giong', macDinh: 'bo_qua', tuyChon: [{ v: 'bo_qua', t: 'Bỏ qua (giống nhau)' }] };
      }
      var trung = byKey[khoaTrung(inc)];
      if (trung && trung.length) return { rec: inc, hienCo: trung[0], loai: 'nghi_trung', macDinh: 'them', tuyChon: [{ v: 'them', t: 'Thêm cả hai (giữ bản trong máy và bản nhập)' }, { v: 'bo_qua', t: 'Bỏ qua bản nhập' }] };
      return { rec: inc, loai: 'moi', macDinh: 'them', tuyChon: [{ v: 'them', t: 'Thêm vào máy' }, { v: 'bo_qua', t: 'Bỏ qua' }] };
    });
  }

  /* choices: mảng giá trị đã chọn theo thứ tự kế hoạch. Trả { toPut, thongKe }. */
  function ganKeHoach(plan, choices) {
    var toPut = []; var tk = { them: 0, ghiDe: 0, themMoi: 0, boQua: 0 };
    plan.forEach(function (it, i) {
      var c = (choices && choices[i]) || it.macDinh;
      if (c === 'them') { toPut.push(clone(it.rec)); tk.them++; }
      else if (c === 'ghi_de') { toPut.push(clone(it.rec)); tk.ghiDe++; }
      else if (c === 'them_moi') { var n = clone(it.rec); n.id = HS.newId(); toPut.push(n); tk.themMoi++; }
      else tk.boQua++;
    });
    return { toPut: toPut, thongKe: tk };
  }

  /* ---------- Minh chứng đã khai (in trên phiếu) ---------- */
  function danhSachMinhChung(input) {
    var out = [];
    var nen = input.nen || {};
    function them(nhan, so, co) { out.push({ nhan: nhan, soVanBan: so || '', coMinhChung: !!co }); }
    if (nen.soNam !== '' && nen.soNam !== undefined) them('Thời gian hoạt động: ' + nen.soNam + ' năm', nen.soNamSoVanBan, nen.soNamCoMinhChung);
    if ((nen.vaiTroNen || []).length) {
      var ten = nen.vaiTroNen.map(function (id) { var f = RULES.nen.vaiTroNen.filter(function (x) { return x.id === id; })[0]; return f ? f.ten : id; }).join('; ');
      them('Vai trò nền: ' + ten, nen.vaiTroNenSoVanBan, nen.vaiTroNenMinhChung);
    }
    function nhom(n, sel) {
      if (!sel || !sel.muc) return;
      var m = n.muc.filter(function (x) { return x.id === sel.muc; })[0];
      if (m) them(n.ten + ': ' + m.nhan, sel.soVanBan, sel.minhChung);
    }
    if (input.he === 'A') {
      (input.thanhTich || []).forEach(function (t) {
        var g = t.giai === 'wt_khac' ? RULES.heA.wtKhac : RULES.heA.giai.filter(function (x) { return x.id === t.giai; })[0];
        var hc = RULES.heA.huyChuong.filter(function (x) { return x.id === t.huyChuong; })[0];
        them('Thành tích: ' + (g ? g.ten : t.giai) + (t.tenGiai ? ' (' + t.tenGiai + ')' : '') + ' – ' + (hc ? hc.ten : t.huyChuong) + (t.nam ? ' (' + t.nam + ')' : ''), t.soVanBan, t.minhChung);
      });
      nhom(RULES.heA.truc4.daoTao, input.daoTao);
      nhom(RULES.heA.truc4.chuyenMon, input.chuyenMon);
    } else {
      var da = input.dauAn || {};
      if ((da.chon || []).length) {
        var tenDa = da.chon.map(function (id) { var f = RULES.heB.dauAn.filter(function (x) { return x.id === id; })[0]; return f ? f.ten : id; }).join('; ');
        them('Dấu ấn đóng góp: ' + tenDa, da.soVanBan, da.minhChung);
      }
      nhom(RULES.heB.truc2.clb, input.clb);
      nhom(RULES.heB.truc2.heThong, input.heThong);
      nhom(RULES.heB.truc3.vdv, input.daoTaoVdv);
      nhom(RULES.heB.truc3.hlv, input.daoTaoHlv);
      (input.vaiTro || []).forEach(function (v) {
        var r = RULES.heB.truc4.vaiTro.filter(function (x) { return x.id === v.id; })[0];
        if (r) them('Vai trò: ' + r.nhan, v.soVanBan, v.minhChung);
      });
    }
    return out;
  }

  /* ---------- Nhắc sao lưu ---------- */
  /* meta: { lastBackupAt, thayDoi, firstChangeAt }. Trả { canNhac, lyDo }. */
  function trangThaiSaoLuu(meta, soHoSo, now) {
    meta = meta || {};
    var t = (now instanceof Date ? now : new Date(now || Date.now())).getTime();
    var n = meta.thayDoi || 0;
    if (!soHoSo || n <= 0) return { canNhac: false, lyDo: '' };
    if (n >= NGUONG_THAY_DOI) return { canNhac: true, lyDo: 'Đã có ' + n + ' thay đổi chưa sao lưu.' };
    var moc = meta.lastBackupAt || meta.firstChangeAt;
    if (moc) {
      var ngay = (t - new Date(moc).getTime()) / 86400000;
      if (ngay >= NGUONG_NGAY) return { canNhac: true, lyDo: (meta.lastBackupAt ? 'Lần sao lưu gần nhất cách đây ' : 'Chưa từng sao lưu, hồ sơ đầu tiên lưu cách đây ') + Math.floor(ngay) + ' ngày, và có ' + n + ' thay đổi chưa sao lưu.' };
    }
    return { canNhac: false, lyDo: '' };
  }

  var API = {
    APP: APP, SCHEMA: SCHEMA, NGUONG_THAY_DOI: NGUONG_THAY_DOI, NGUONG_NGAY: NGUONG_NGAY, MAX_BYTES: MAX_BYTES,
    tenFile: tenFile, fmtGio: fmtGio, fmtNgay: fmtNgay,
    bangTongHop: bangTongHop, bangChiTiet: bangChiTiet, bangPhienBan: bangPhienBan, bangNhatKy: bangNhatKy, cacTrang: cacTrang,
    csvCell: csvCell, toCsv: toCsv, envelope: envelope, docGoi: docGoi,
    lapKeHoachGop: lapKeHoachGop, ganKeHoach: ganKeHoach, danhSachMinhChung: danhSachMinhChung, trangThaiSaoLuu: trangThaiSaoLuu
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.VTF_BACKUP = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
