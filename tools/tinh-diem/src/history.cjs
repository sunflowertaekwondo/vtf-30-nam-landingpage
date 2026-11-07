/* Logic hồ sơ đã lưu: tạo hồ sơ, phiên bản, chốt/mở khóa, lọc và sắp xếp lịch sử.
 * Hàm thuần (không đọc/ghi bộ nhớ), chạy trong trình duyệt (globalThis.VTF_HISTORY) và Node (require).
 *
 * Mô hình: một hồ sơ = một người được chấm. Mỗi lần lưu lại là một PHIÊN BẢN mới, không ghi đè phiên bản cũ.
 * Sửa hồ sơ đã có bắt buộc ghi lý do. Hồ sơ đã chốt không sửa được cho tới khi mở khóa (cũng bắt buộc ghi lý do).
 * Mọi thao tác ghi vào nhật ký của hồ sơ để phục vụ biên bản và kiểm tra lại. */
(function (root) {
  'use strict';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function newId() { return 'hs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function iso(now) { return (now instanceof Date ? now : new Date(now || Date.now())).toISOString(); }
  function latest(rec) { return rec.versions[rec.versions.length - 1]; }

  function makeVersion(n, o, lyDo, t) {
    return {
      v: n,
      savedAt: t,
      nguoiCham: (o.nguoiCham || '').trim(),
      lyDo: lyDo,
      ruleVersion: o.ketQua.ruleVersion,
      input: clone(o.input),
      ketQua: clone(o.ketQua)
    };
  }

  /* Hồ sơ mới, phiên bản 1. */
  function createRecord(o) {
    var t = iso(o.now);
    var v = makeVersion(1, o, '', t);
    return {
      id: o.id || newId(),
      he: o.ketQua.he,
      createdAt: t,
      updatedAt: t,
      locked: false,
      versions: [v],
      nhatKy: [{ t: t, loai: 'tao', nguoi: v.nguoiCham, lyDo: '', v: 1 }]
    };
  }

  /* Thêm phiên bản mới. Cần lý do; hồ sơ đã chốt thì không được. Trả bản sao mới, không sửa bản gốc. */
  function addVersion(rec, o) {
    if (rec.locked) throw new Error('Hồ sơ đã chốt. Cần mở khóa (ghi lý do) trước khi sửa.');
    var ly = (o.lyDo || '').trim();
    if (!ly) throw new Error('Cần ghi lý do sửa để lưu phiên bản mới.');
    var r = clone(rec);
    var t = iso(o.now);
    var n = latest(r).v + 1;
    r.versions.push(makeVersion(n, o, ly, t));
    r.he = o.ketQua.he;
    r.updatedAt = t;
    r.nhatKy.push({ t: t, loai: 'sua', nguoi: (o.nguoiCham || '').trim(), lyDo: ly, v: n });
    return r;
  }

  function lock(rec, o) {
    var r = clone(rec);
    if (r.locked) return r;
    var t = iso(o && o.now);
    r.locked = true;
    r.updatedAt = t;
    r.nhatKy.push({ t: t, loai: 'chot', nguoi: ((o && o.nguoi) || '').trim(), lyDo: ((o && o.lyDo) || '').trim(), v: latest(r).v });
    return r;
  }

  function unlock(rec, o) {
    var ly = ((o && o.lyDo) || '').trim();
    if (!ly) throw new Error('Cần ghi lý do mở khóa.');
    var r = clone(rec);
    if (!r.locked) return r;
    var t = iso(o && o.now);
    r.locked = false;
    r.updatedAt = t;
    r.nhatKy.push({ t: t, loai: 'mo_khoa', nguoi: ((o && o.nguoi) || '').trim(), lyDo: ly, v: latest(r).v });
    return r;
  }

  /* Khóa hạng dùng để lọc: hồ sơ chưa đủ điều kiện nền gom riêng. */
  function hangKey(kq) { return !kq.duocXet ? 'chua_du_dk' : kq.hang.id; }

  function summarize(rec) {
    var v = latest(rec);
    var tt = (v.input && v.input.thongTin) || {};
    var kq = v.ketQua;
    return {
      id: rec.id,
      he: rec.he,
      hoTen: tt.hoTen || '',
      donVi: tt.donVi || '',
      nguoiCham: v.nguoiCham,
      ngayCham: tt.ngayCham || '',
      ghiChu: tt.ghiChu || '',
      tong: kq.tong,
      duocXet: kq.duocXet,
      hangKey: hangKey(kq),
      hangTen: kq.duocXet ? kq.hang.ten : 'Chưa đủ điều kiện xét',
      soPhienBan: rec.versions.length,
      locked: !!rec.locked,
      savedAt: v.savedAt,
      namLuu: new Date(v.savedAt).getFullYear()
    };
  }

  /* Bỏ dấu, hạ chữ thường để tìm kiếm gõ không dấu vẫn khớp. */
  function chuanHoa(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
  }

  /* Lọc và sắp xếp. opt: { q, he, hang, nam, sort: 'moi' | 'diem' | 'ten' }. Trả mảng tóm tắt. */
  function filterSort(records, opt) {
    opt = opt || {};
    var q = chuanHoa(opt.q);
    var list = records.map(summarize).filter(function (s) {
      if (opt.he && s.he !== opt.he) return false;
      if (opt.hang && s.hangKey !== opt.hang) return false;
      if (opt.nam && String(s.namLuu) !== String(opt.nam)) return false;
      if (q) {
        var hay = chuanHoa([s.hoTen, s.donVi, s.nguoiCham, s.ghiChu].join(' '));
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    var sort = opt.sort || 'moi';
    list.sort(function (a, b) {
      if (sort === 'diem') return b.tong - a.tong || (a.savedAt < b.savedAt ? 1 : -1);
      if (sort === 'ten') return chuanHoa(a.hoTen).localeCompare(chuanHoa(b.hoTen), 'vi') || (a.savedAt < b.savedAt ? 1 : -1);
      return a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : 0;
    });
    return list;
  }

  var API = {
    newId: newId, latest: latest, createRecord: createRecord, addVersion: addVersion,
    lock: lock, unlock: unlock, summarize: summarize, filterSort: filterSort, chuanHoa: chuanHoa, hangKey: hangKey
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.VTF_HISTORY = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
