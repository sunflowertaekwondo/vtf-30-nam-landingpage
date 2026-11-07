/* Bộ tính điểm theo Bản tiêu chí 036/VTF. Hàm thuần: nhận hồ sơ, trả kết quả + breakdown. Không đụng giao diện, không đọc/ghi dữ liệu.
 * Chạy được trong trình duyệt (script thường, gán globalThis.VTF_ENGINE) và trong Node (require).
 *
 * Quy tắc đã chốt với Huy (07/11/2026) cho những chỗ 036 chưa nói rõ:
 *  - Mỗi nhóm "tối đa N điểm" lấy MỘT mức cao nhất; các nhóm cộng với nhau.
 *  - Hệ A Trục 2 đếm huy chương quốc tế NGOÀI huy chương đã dùng ở Trục 1 (tổng trừ 1).
 *  - Hệ A đủ điều kiện nếu có HCV SEA Games, hoặc huy chương bất kỳ ở Châu Á/ASIAD/Thế giới/Olympic,
 *    hoặc Hội đồng xác nhận "tương đương".
 *  - Mục chưa có minh chứng KHÔNG được tính điểm (nguyên tắc "không truyền miệng").
 *  - Quy tắc IX.3 (1 HCV SEA Games nhưng không có đóng góp hệ thống) chỉ cảnh báo, không tự hạ hạng. */
(function (root) {
  'use strict';

  var RULES = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
    ? require('./rules-036.cjs')
    : root.VTF_RULES;
  if (!RULES) throw new Error('Thiếu bộ quy tắc VTF_RULES: nạp rules-036 trước engine.');

  var HC_HOP_LE = { HCV: 1, HCB: 1, HCD: 1 };
  var GIAI_CAO_HON_SEA = { asiad: 1, the_gioi: 1, chau_a: 1, olympic: 1 };

  function toNum(x) {
    var n = Number(x);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* Tìm bậc đầu tiên có n >= tu (mảng xếp từ cao xuống thấp). */
  function bac(bands, n) {
    for (var i = 0; i < bands.length; i++) if (n >= bands[i].tu) return bands[i];
    return null;
  }

  function xepHang(tong) {
    for (var i = 0; i < RULES.hang.length; i++) {
      if (tong >= RULES.hang[i].tu) return RULES.hang[i];
    }
    return RULES.hangDuoiNguong;
  }

  /* Kiểm tra dữ liệu nhập. Trả mảng thông báo lỗi (rỗng = hợp lệ). */
  function kiemTra(hoSo) {
    var loi = [];
    if (!hoSo || (hoSo.he !== 'A' && hoSo.he !== 'B')) {
      loi.push('Chưa chọn hệ xét (Hệ A hoặc Hệ B).');
      return loi;
    }
    var nen = hoSo.nen || {};
    if (nen.soNam !== undefined && nen.soNam !== null && nen.soNam !== '') {
      var n = Number(nen.soNam);
      if (!isFinite(n) || n < 0) loi.push('Số năm hoạt động phải là số không âm.');
      else if (n > 80) loi.push('Số năm hoạt động lớn bất thường (trên 80 năm), vui lòng kiểm tra lại.');
    }
    (hoSo.thanhTich || []).forEach(function (t, i) {
      if (t.nam !== undefined && t.nam !== null && t.nam !== '') {
        var y = Number(t.nam);
        if (!(Math.floor(y) === y && y >= 1960 && y <= 2100)) loi.push('Thành tích dòng ' + (i + 1) + ': năm không hợp lệ.');
      }
      if (t.giai === 'wt_khac' && t.diemQuyDoi !== undefined && Number(t.diemQuyDoi) < 0) {
        loi.push('Thành tích dòng ' + (i + 1) + ': điểm quy đổi không được âm.');
      }
    });
    return loi;
  }

  function evaluate(hoSo) {
    if (!hoSo || (hoSo.he !== 'A' && hoSo.he !== 'B')) throw new Error('Hồ sơ phải có he = "A" hoặc "B".');
    var he = hoSo.he;
    var cfg = he === 'A' ? RULES.heA : RULES.heB;
    var nen = hoSo.nen || {};
    var canhBao = [];
    var mucBiLoai = [];

    function loai(truc, nhan, lyDo) { mucBiLoai.push({ truc: truc, nhan: nhan, lyDo: lyDo }); }

    /* Chọn một mức trong nhóm (có minh chứng mới tính). Trả điểm. */
    function chonMuc(nhom, sel, trucId, chiTiet) {
      var diem = 0;
      if (sel && sel.muc) {
        var m = find(nhom.muc, sel.muc);
        if (!m) {
          canhBao.push('Mức không hợp lệ trong nhóm "' + nhom.ten + '": ' + sel.muc);
        } else if (sel.minhChung === true) {
          diem = m.diem;
          chiTiet.push({ nhom: nhom.ten, nhan: m.nhan, diem: m.diem, tinh: true });
        } else {
          chiTiet.push({ nhom: nhom.ten, nhan: m.nhan, diem: 0, tinh: false, ghiChu: 'Thiếu minh chứng, chưa được tính' });
          loai(trucId, m.nhan, 'Chưa có minh chứng');
        }
      } else {
        chiTiet.push({ nhom: nhom.ten, nhan: 'Chưa chọn', diem: 0, tinh: false });
      }
      return Math.min(diem, nhom.toiDa);
    }

    /* ----- Thời gian có minh chứng (dùng cho điều kiện nền và trục thời gian) ----- */
    var soNamKhaiBao = toNum(nen.soNam);
    var soNam = nen.soNamCoMinhChung === true ? soNamKhaiBao : 0;
    if (soNamKhaiBao > 0 && nen.soNamCoMinhChung !== true) {
      loai('nen', 'Thời gian hoạt động ' + soNamKhaiBao + ' năm', 'Chưa có minh chứng, không được tính thời gian');
    }

    /* ----- Tầng 1: điều kiện nền ----- */
    var dieuKien = [];
    dieuKien.push({
      id: 'thoi_gian',
      nhan: 'Tối thiểu ' + RULES.nen.soNamToiThieu + ' năm tham gia hoạt động, có minh chứng',
      dat: soNam >= RULES.nen.soNamToiThieu,
      lyDo: soNam >= RULES.nen.soNamToiThieu ? ''
        : (soNamKhaiBao > 0 && nen.soNamCoMinhChung !== true
          ? 'Chưa có minh chứng thời gian'
          : 'Mới có ' + soNam + ' năm (cần từ ' + RULES.nen.soNamToiThieu + ' năm)')
    });

    var vaiTroNenHopLe = (nen.vaiTroNen || []).filter(function (id) { return !!find(RULES.nen.vaiTroNen, id); });
    var vaiTroOk = vaiTroNenHopLe.length >= 1 && nen.vaiTroNenMinhChung === true;
    dieuKien.push({
      id: 'vai_tro',
      nhan: 'Đảm nhiệm ít nhất 1 vai trò: BCH, Hội đồng kỹ thuật, Trọng tài, HLV, VĐV đội tuyển, HLV phong trào CLB',
      dat: vaiTroOk,
      lyDo: vaiTroOk ? '' : (vaiTroNenHopLe.length === 0 ? 'Chưa chọn vai trò nào' : 'Chưa có minh chứng vai trò')
    });

    dieuKien.push({
      id: 'dao_duc',
      nhan: 'Không vi phạm kỷ luật nghiêm trọng, không ảnh hưởng uy tín hệ thống',
      dat: nen.viPhamKyLuat !== true,
      lyDo: nen.viPhamKyLuat === true ? 'Có vi phạm kỷ luật nghiêm trọng hoặc ảnh hưởng uy tín' : ''
    });

    var truc = [];

    if (he === 'A') {
      /* ======================= HỆ A ======================= */
      var seen = {};
      var hop = [];
      (hoSo.thanhTich || []).forEach(function (t, i) {
        var laWt = t.giai === 'wt_khac';
        var g = laWt ? RULES.heA.wtKhac : find(RULES.heA.giai, t.giai);
        var tenHc = (find(RULES.heA.huyChuong, t.huyChuong) || {}).ten || '';
        var nhan = g
          ? g.ten + (laWt && t.tenGiai ? ' (' + t.tenGiai + ')' : '') + (tenHc ? ' – ' + tenHc : '') + (t.nam ? ' (' + t.nam + ')' : '')
          : 'Dòng ' + (i + 1);
        if (!g) { loai('truc1', nhan, 'Giải không hợp lệ'); return; }
        if (!HC_HOP_LE[t.huyChuong]) { loai('truc1', nhan, 'Huy chương không hợp lệ'); return; }
        if (t.minhChung !== true) { loai('truc1', nhan, 'Chưa có minh chứng'); return; }
        if (!t.nam) { loai('truc1', nhan, 'Thiếu năm đạt thành tích'); return; }
        var key = [t.giai, t.tenGiai || '', t.huyChuong, t.nam].join('|');
        if (seen[key]) { loai('truc1', nhan, 'Trùng với dòng đã nhập, chỉ tính một lần'); return; }
        seen[key] = true;
        var diem;
        if (laWt) {
          if (t.hoiDongXacNhan !== true) { loai('truc1', nhan, 'Chưa có xác nhận quy đổi của Hội đồng'); return; }
          diem = Math.min(toNum(t.diemQuyDoi), RULES.heA.wtKhac.tran);
          if (diem <= 0) { loai('truc1', nhan, 'Hội đồng chưa quy đổi điểm'); return; }
        } else {
          diem = g.diem[t.huyChuong];
        }
        var capIdx = laWt ? 50 : RULES.heA.giai.indexOf(g);
        hop.push({ giai: t.giai, hc: t.huyChuong, nam: t.nam, nhan: nhan, diem: diem, capIdx: capIdx, thuTu: i });
      });

      /* Trục 1: một thành tích cao nhất (bằng điểm thì ưu tiên cấp cao hơn, rồi dòng nhập trước). */
      var chon = null;
      hop.forEach(function (h) {
        if (!chon || h.diem > chon.diem || (h.diem === chon.diem && h.capIdx < chon.capIdx)) chon = h;
      });
      var t1 = { id: 'truc1', ten: 'Trục 1 – Thành tích quốc tế', toiDa: cfg.toiDa.truc1, diem: 0, chiTiet: [], ghiChu: [] };
      hop.forEach(function (h) {
        var laChon = h === chon;
        t1.chiTiet.push({
          nhan: h.nhan, diem: h.diem, tinh: laChon,
          ghiChu: laChon ? 'Thành tích cao nhất, được tính' : 'Không tính ở Trục 1: chỉ lấy 01 thành tích cao nhất'
        });
      });
      if (chon) t1.diem = Math.min(chon.diem, t1.toiDa);
      else t1.ghiChu.push('Chưa có thành tích quốc tế hợp lệ (có minh chứng, đủ năm, không trùng).');
      truc.push(t1);

      /* Trục 2: huy chương quốc tế ngoài huy chương đã dùng ở Trục 1. */
      var soHc = hop.length;
      var them = soHc > 0 ? soHc - 1 : 0;
      var b2 = bac(RULES.heA.truc2, them);
      var t2 = { id: 'truc2', ten: 'Trục 2 – Thành tích tích lũy trong sự nghiệp', toiDa: cfg.toiDa.truc2, diem: b2 ? b2.diem : 0, chiTiet: [], ghiChu: [] };
      t2.chiTiet.push({
        nhan: 'Có ' + soHc + ' huy chương quốc tế hợp lệ, trừ 1 huy chương đã tính ở Trục 1 → còn ' + them,
        diem: b2 ? b2.diem : 0, tinh: !!b2, ghiChu: b2 ? b2.nhan : 'Chưa đủ 01 huy chương ngoài thành tích chính'
      });
      truc.push(t2);

      /* Trục 3: thời gian cống hiến. */
      var b3 = bac(RULES.heA.truc3, soNam);
      var t3 = { id: 'truc3', ten: 'Trục 3 – Thời gian cống hiến', toiDa: cfg.toiDa.truc3, diem: b3 ? b3.diem : 0, chiTiet: [], ghiChu: [] };
      t3.chiTiet.push({ nhan: soNam + ' năm có minh chứng', diem: b3 ? b3.diem : 0, tinh: !!b3, ghiChu: b3 ? b3.nhan : 'Dưới 05 năm: không có điểm' });
      truc.push(t3);

      /* Trục 4: đào tạo + chuyên môn, mỗi nhóm một mức cao nhất. */
      var t4 = { id: 'truc4', ten: 'Trục 4 – Đóng góp cho hệ thống', toiDa: cfg.toiDa.truc4, diem: 0, chiTiet: [], ghiChu: [] };
      var d4a = chonMuc(RULES.heA.truc4.daoTao, hoSo.daoTao, 'truc4', t4.chiTiet);
      var d4b = chonMuc(RULES.heA.truc4.chuyenMon, hoSo.chuyenMon, 'truc4', t4.chiTiet);
      t4.diem = Math.min(d4a + d4b, t4.toiDa);
      truc.push(t4);

      /* Điều kiện riêng Hệ A. */
      var coHcvSea = hop.some(function (h) { return h.giai === 'sea_games' && h.hc === 'HCV'; });
      var coCaoHon = hop.some(function (h) { return !!GIAI_CAO_HON_SEA[h.giai]; });
      var tuongDuong = nen.hoiDongXacNhanTuongDuong === true;
      var datA = coHcvSea || coCaoHon || tuongDuong;
      dieuKien.push({
        id: 'he_a_thanh_tich',
        nhan: 'Có ít nhất 01 HCV SEA Games, hoặc huy chương cấp Châu Á/ASIAD/Thế giới/Olympic (hoặc Hội đồng xác nhận tương đương)',
        dat: datA,
        lyDo: datA ? (!coHcvSea && !coCaoHon ? 'Đạt nhờ Hội đồng xác nhận tương đương' : '')
          : 'Chưa có HCV SEA Games hoặc huy chương cấp cao hơn có minh chứng'
      });

      /* Quy tắc IX.3: không tuyệt đối hóa huy chương. */
      if (t4.diem === 0) {
        canhBao.push('Chưa có đóng góp cho hệ thống (Trục 4 = 0): theo quy tắc IX.3 của 036/VTF, có huy chương nhưng không có đóng góp hệ thống thì không thể xếp hạng cao nhất. Hội đồng cân nhắc khi xếp hạng.');
      }
    } else {
      /* ======================= HỆ B ======================= */
      /* Trục 1: thời gian cống hiến cộng dồn có xác minh. */
      var bb1 = bac(RULES.heB.truc1, soNam);
      var u1 = { id: 'truc1', ten: 'Trục 1 – Thời gian cống hiến', toiDa: cfg.toiDa.truc1, diem: bb1 ? bb1.diem : 0, chiTiet: [], ghiChu: [] };
      u1.chiTiet.push({ nhan: soNam + ' năm có minh chứng (cộng dồn)', diem: bb1 ? bb1.diem : 0, tinh: !!bb1, ghiChu: bb1 ? bb1.nhan : 'Dưới 05 năm: không có điểm' });
      truc.push(u1);

      /* Trục 2: CLB + hệ thống. */
      var u2 = { id: 'truc2', ten: 'Trục 2 – Xây dựng và phát triển hệ thống', toiDa: cfg.toiDa.truc2, diem: 0, chiTiet: [], ghiChu: [] };
      var d2a = chonMuc(RULES.heB.truc2.clb, hoSo.clb, 'truc2', u2.chiTiet);
      var d2b = chonMuc(RULES.heB.truc2.heThong, hoSo.heThong, 'truc2', u2.chiTiet);
      u2.diem = Math.min(d2a + d2b, u2.toiDa);
      truc.push(u2);

      /* Trục 3: đào tạo VĐV + HLV/trọng tài. */
      var u3 = { id: 'truc3', ten: 'Trục 3 – Đào tạo và phát triển lực lượng', toiDa: cfg.toiDa.truc3, diem: 0, chiTiet: [], ghiChu: [] };
      var d3a = chonMuc(RULES.heB.truc3.vdv, hoSo.daoTaoVdv, 'truc3', u3.chiTiet);
      var d3b = chonMuc(RULES.heB.truc3.hlv, hoSo.daoTaoHlv, 'truc3', u3.chiTiet);
      u3.diem = Math.min(d3a + d3b, u3.toiDa);
      truc.push(u3);

      /* Trục 4: tối đa 02 vai trò cao nhất, trần 20. */
      var u4 = { id: 'truc4', ten: 'Trục 4 – Vai trò quản lý và chuyên môn', toiDa: cfg.toiDa.truc4, diem: 0, chiTiet: [], ghiChu: [] };
      var daThay = {};
      var hopLe = [];
      (hoSo.vaiTro || []).forEach(function (v) {
        var r = find(RULES.heB.truc4.vaiTro, v && v.id);
        if (!r) { canhBao.push('Vai trò không hợp lệ: ' + (v && v.id)); return; }
        if (daThay[r.id]) { loai('truc4', r.nhan, 'Nhập trùng vai trò, chỉ tính một lần'); return; }
        daThay[r.id] = true;
        if (v.minhChung !== true) {
          u4.chiTiet.push({ nhan: r.nhan, diem: 0, tinh: false, ghiChu: 'Thiếu quyết định bổ nhiệm/xác nhận, chưa được tính' });
          loai('truc4', r.nhan, 'Chưa có quyết định bổ nhiệm hoặc xác nhận chính thức');
          return;
        }
        hopLe.push(r);
      });
      hopLe.sort(function (a, b) { return b.diem - a.diem; });
      var tong4 = 0;
      hopLe.forEach(function (r, idx) {
        if (idx < RULES.heB.truc4.toiDaVaiTro) {
          tong4 += r.diem;
          u4.chiTiet.push({ nhan: r.nhan, diem: r.diem, tinh: true, ghiChu: 'Thuộc 02 vai trò điểm cao nhất' });
        } else {
          u4.chiTiet.push({ nhan: r.nhan, diem: r.diem, tinh: false, ghiChu: 'Không tính: chỉ lấy tối đa 02 vai trò cao nhất' });
        }
      });
      u4.diem = Math.min(tong4, u4.toiDa);
      if (tong4 > u4.toiDa) u4.ghiChu.push('Tổng hai vai trò là ' + tong4 + ' điểm, cắt theo trần ' + u4.toiDa + ' điểm của Trục 4.');
      truc.push(u4);

      /* Điều kiện riêng Hệ B: có ít nhất 01 dấu ấn. */
      var da = hoSo.dauAn || {};
      var dauAnHopLe = (da.chon || []).filter(function (id) { return !!find(RULES.heB.dauAn, id); });
      var datB = dauAnHopLe.length >= 1 && da.minhChung === true;
      dieuKien.push({
        id: 'he_b_dau_an',
        nhan: 'Có ít nhất 01 dấu ấn đóng góp cụ thể, có minh chứng',
        dat: datB,
        lyDo: datB ? '' : (dauAnHopLe.length === 0 ? 'Chưa chọn dấu ấn nào' : 'Chưa có minh chứng dấu ấn')
      });
    }

    var tong = Math.min(100, truc.reduce(function (s, t) { return s + t.diem; }, 0));
    var duocXet = dieuKien.every(function (d) { return d.dat; });
    var hang = duocXet ? xepHang(tong) : null;

    if (mucBiLoai.length) {
      canhBao.push('Có ' + mucBiLoai.length + ' mục không được tính điểm (thiếu minh chứng hoặc thông tin): xem danh sách bên dưới.');
    }

    return {
      ruleVersion: RULES.version,
      he: he,
      tenHe: cfg.ten,
      duocXet: duocXet,
      dieuKien: dieuKien,
      truc: truc,
      tong: tong,
      tongToiDa: 100,
      hang: hang,
      canhBao: canhBao,
      mucBiLoai: mucBiLoai
    };
  }

  var API = { evaluate: evaluate, kiemTra: kiemTra, xepHang: xepHang, RULES: RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.VTF_ENGINE = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
