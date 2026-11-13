/* Giao diện máy tính điểm vinh danh 036/VTF. JavaScript thuần, không phụ thuộc thư viện.
 * Đọc thang điểm từ VTF_RULES và tính bằng VTF_ENGINE (cùng mã với bộ kiểm thử). */
(function () {
  'use strict';

  var R = window.VTF_RULES;
  var E = window.VTF_ENGINE;

  /* ---------- Trạng thái hồ sơ đang nhập ---------- */
  function homNay() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function sel() { return { muc: '', soVanBan: '', minhChung: false }; }
  function newState(he) {
    return {
      he: he || null,
      thongTin: { hoTen: '', donVi: '', vaiTroChinh: '', nguoiCham: '', ngayCham: homNay(), ghiChu: '' },
      nen: {
        soNam: '', soNamSoVanBan: '', soNamCoMinhChung: false,
        vaiTroNen: [], vaiTroNenSoVanBan: '', vaiTroNenMinhChung: false,
        viPhamKyLuat: false, hoiDongXacNhanTuongDuong: false
      },
      thanhTich: [],
      daoTao: sel(), chuyenMon: sel(),
      clb: sel(), heThong: sel(), daoTaoVdv: sel(), daoTaoHlv: sel(),
      dauAn: { chon: [], soVanBan: '', minhChung: false },
      vaiTro: []
    };
  }
  var S = newState();

  /* Ngữ cảnh lưu: đang nhập hồ sơ mới ('new'), sửa hồ sơ đã lưu ('edit') hoặc chỉ xem một phiên bản ('view'). */
  function newCtx() { return { recordId: null, version: null, mode: 'new', lyDo: '', soPhienBan: 0, locked: false }; }
  var ctx = newCtx();
  var dirty = false;          // có thay đổi chưa lưu vào lịch sử
  var storeReady = false;
  var draftRestoring = false;
  var draftTimer = null;
  var HS = window.VTF_HISTORY;
  var B = window.VTF_BACKUP;
  var X = window.VTF_XLSX;
  var backupMeta = { lastBackupAt: null, thayDoi: 0, firstChangeAt: null };
  var recCount = 0;
  var storeInfo = null;
  var showDraftNote = false;
  var store = null;
  var histCache = [];
  var HF = { q: '', he: '', hang: '', nam: '', sort: 'moi' };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function safeLocalStorage() { try { return window.localStorage; } catch (e) { return null; } }

  /* ---------- Tiện ích dựng DOM ---------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') el.textContent = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split('.'); var last = ks.pop();
    ks.reduce(function (a, k) { return a[k]; }, o)[last] = v;
  }
  function $(id) { return document.getElementById(id); }

  function lbl(text, control, hint) {
    return h('label', { class: 'field' }, [h('span', { class: 'lbl', text: text }), control, hint ? h('span', { class: 'small', text: hint }) : null]);
  }
  function inp(path, type, extra) {
    var v = getPath(S, path);
    var a = { type: type, 'data-path': path, value: v === null || v === undefined ? '' : String(v) };
    if (extra) Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });
    return h('input', a);
  }
  function check(path, text) {
    return h('label', { class: 'check' }, [h('input', { type: 'checkbox', 'data-path': path, checked: !!getPath(S, path) }), h('span', { text: text })]);
  }
  function checkArr(arrPath, id, text) {
    var arr = getPath(S, arrPath) || [];
    return h('label', { class: 'check' }, [h('input', { type: 'checkbox', 'data-arr': arrPath, 'data-val': id, checked: arr.indexOf(id) >= 0 }), h('span', { text: text })]);
  }
  function select(path, options, extra) {
    var cur = getPath(S, path);
    var a = { 'data-path': path };
    if (extra) Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });
    return h('select', a, options.map(function (o) {
      return h('option', { value: o.v, selected: String(cur) === String(o.v) }, [o.t]);
    }));
  }
  function evid(base, soLabel) {
    return h('div', { class: 'evid' }, [
      lbl(soLabel || 'Số văn bản / quyết định minh chứng', inp(base + '.soVanBan', 'text', { placeholder: 'Ví dụ: QĐ số …/…' })),
      check(base + '.minhChung', 'Đã có minh chứng')
    ]);
  }
  function card(title, hint, kids) {
    return h('section', { class: 'card' }, [h('h2', { text: title }), hint ? h('p', { class: 'hint', text: hint }) : null].concat(kids));
  }
  function selMuc(nhom, base) {
    var opts = [{ v: '', t: '— Chưa chọn —' }].concat(nhom.muc.map(function (m) { return { v: m.id, t: m.nhan + ' (' + m.diem + ' điểm)' }; }));
    return h('fieldset', null, [
      h('legend', { text: nhom.ten + ' (tối đa ' + nhom.toiDa + ' điểm)' }),
      lbl('Mức cao nhất đạt được', select(base + '.muc', opts)),
      evid(base)
    ]);
  }

  /* ---------- Các khối của biểu mẫu ---------- */
  function cardThongTin() {
    return card('2. Thông tin chung', 'Chỉ để nhận diện hồ sơ, không dùng để tính điểm. Không nhập số CCCD hay số điện thoại.', [
      h('div', { class: 'row two' }, [
        lbl('Họ và tên', inp('thongTin.hoTen', 'text', { autocomplete: 'off' })),
        lbl('Đơn vị (CLB, tỉnh/thành, ngành)', inp('thongTin.donVi', 'text'))
      ]),
      h('div', { class: 'row two' }, [
        lbl('Vai trò chính', select('thongTin.vaiTroChinh', [
          { v: '', t: '— Chưa chọn —' }, { v: 'VĐV', t: 'Vận động viên' }, { v: 'HLV', t: 'Huấn luyện viên' },
          { v: 'Cán bộ', t: 'Cán bộ quản lý' }, { v: 'Trọng tài', t: 'Trọng tài' }, { v: 'Khác', t: 'Khác' }
        ])),
        lbl('Người chấm điểm', inp('thongTin.nguoiCham', 'text'))
      ]),
      h('div', { class: 'row two' }, [
        lbl('Ngày chấm', inp('thongTin.ngayCham', 'date')),
        lbl('Ghi chú', h('textarea', { 'data-path': 'thongTin.ghiChu', rows: '2' }, [S.thongTin.ghiChu]))
      ])
    ]);
  }

  function cardNen() {
    var kids = [
      h('fieldset', null, [
        h('legend', { text: 'Thời gian hoạt động' }),
        lbl('Tổng số năm tham gia hoạt động, công tác, đóng góp (cộng dồn)',
          inp('nen.soNam', 'number', { min: '0', step: '0.5', inputmode: 'decimal', placeholder: 'Ví dụ: 12' }),
          'Cần tối thiểu ' + R.nen.soNamToiThieu + ' năm. Số năm này cũng dùng để tính điểm thời gian cống hiến.'),
        evidNen()
      ]),
      h('fieldset', null, [
        h('legend', { text: 'Vai trò đảm nhiệm (chọn ít nhất 1)' }),
        h('div', { class: 'checks cols' }, R.nen.vaiTroNen.map(function (v) { return checkArr('nen.vaiTroNen', v.id, v.ten); })),
        h('div', { class: 'evid' }, [
          lbl('Số văn bản / quyết định xác nhận vai trò', inp('nen.vaiTroNenSoVanBan', 'text', { placeholder: 'Ví dụ: QĐ bổ nhiệm số …' })),
          check('nen.vaiTroNenMinhChung', 'Đã có minh chứng')
        ])
      ]),
      h('fieldset', null, [
        h('legend', { text: 'Đạo đức, tổ chức' }),
        check('nen.viPhamKyLuat', 'Có vi phạm kỷ luật nghiêm trọng, hoặc làm ảnh hưởng uy tín hệ thống (chỉ đánh dấu nếu có)')
      ])
    ];
    if (S.he === 'A') {
      kids.push(h('fieldset', null, [
        h('legend', { text: 'Điều kiện riêng của Hệ A' }),
        h('p', { class: 'hint', text: 'Cần có ít nhất 01 HCV SEA Games, hoặc huy chương cấp Châu Á, ASIAD, Thế giới, Olympic (nhập ở phần Thành tích quốc tế bên dưới).' }),
        check('nen.hoiDongXacNhanTuongDuong', 'Hội đồng đã xác nhận thành tích tương đương (dùng cho trường hợp đặc biệt)')
      ]));
    } else {
      kids.push(h('fieldset', null, [
        h('legend', { text: 'Điều kiện riêng của Hệ B: dấu ấn đóng góp (chọn ít nhất 1)' }),
        h('div', { class: 'checks' }, R.heB.dauAn.map(function (d) { return checkArr('dauAn.chon', d.id, d.ten); })),
        h('div', { class: 'evid' }, [
          lbl('Số văn bản / minh chứng dấu ấn', inp('dauAn.soVanBan', 'text')),
          check('dauAn.minhChung', 'Đã có minh chứng')
        ])
      ]));
    }
    return card('3. Điều kiện nền (bắt buộc, không đạt thì bị loại)', null, kids);
  }
  function evidNen() {
    return h('div', { class: 'evid' }, [
      lbl('Số văn bản / quyết định xác nhận thời gian', inp('nen.soNamSoVanBan', 'text', { placeholder: 'Ví dụ: QĐ, giấy xác nhận của tổ chức' })),
      check('nen.soNamCoMinhChung', 'Đã có minh chứng')
    ]);
  }

  /* ----- Hệ A ----- */
  function rowThanhTich(i) {
    var p = 'thanhTich.' + i;
    var t = S.thanhTich[i];
    var giaiOpts = R.heA.giai.map(function (g) { return { v: g.id, t: g.ten }; }).concat([{ v: 'wt_khac', t: R.heA.wtKhac.ten }]);
    var hcOpts = R.heA.huyChuong.map(function (x) { return { v: x.id, t: x.ten }; });
    return h('div', { class: 'item' }, [
      h('div', { class: 'item-head' }, [
        h('strong', { text: 'Thành tích ' + (i + 1) }),
        h('button', { type: 'button', class: 'btn danger-link', 'data-del': 'thanhTich', 'data-i': i, 'aria-label': 'Xóa thành tích ' + (i + 1), text: 'Xóa dòng' })
      ]),
      h('div', { class: 'cols3' }, [
        lbl('Giải đấu', select(p + '.giai', giaiOpts, { 'data-togglewt': '1' })),
        lbl('Huy chương', select(p + '.huyChuong', hcOpts)),
        lbl('Năm', inp(p + '.nam', 'number', { min: '1960', max: '2100', step: '1', inputmode: 'numeric', placeholder: '2023' }))
      ]),
      evid(p),
      h('div', { class: 'wt-extra', hidden: t.giai !== 'wt_khac' }, [
        h('div', { class: 'row two' }, [
          lbl('Tên giải', inp(p + '.tenGiai', 'text', { placeholder: 'Ví dụ: WT Grand Prix' })),
          lbl('Điểm Hội đồng quy đổi (tối đa ' + R.heA.wtKhac.tran + ')', inp(p + '.diemQuyDoi', 'number', { min: '0', max: String(R.heA.wtKhac.tran), step: '1', inputmode: 'numeric' }))
        ]),
        check(p + '.hoiDongXacNhan', 'Hội đồng chuyên môn đã xác nhận quy đổi')
      ])
    ]);
  }
  function renderListThanhTich() {
    var box = $('list-tt'); box.innerHTML = '';
    if (!S.thanhTich.length) box.appendChild(h('p', { class: 'empty', text: 'Chưa có thành tích nào. Bấm "Thêm thành tích" để nhập.' }));
    S.thanhTich.forEach(function (_, i) { box.appendChild(rowThanhTich(i)); });
  }
  function cardThanhTich() {
    return card('4. Thành tích quốc tế (Trục 1 và Trục 2)',
      'Nhập tất cả huy chương quốc tế đã có minh chứng. Hệ thống tự lấy thành tích cao nhất cho Trục 1 và đếm các huy chương còn lại cho Trục 2. Chỉ tính giải thuộc hệ thống chính thức; không tính giải phong trào, giải mời.', [
        h('div', { id: 'list-tt' }),
        h('div', { class: 'actions' }, [h('button', { type: 'button', class: 'btn', 'data-add': 'thanhTich', text: '+ Thêm thành tích' })])
      ]);
  }
  function cardTruc4A() {
    return card('5. Đóng góp cho hệ thống (Trục 4)', 'Mỗi nhóm chỉ chọn một mức cao nhất. HLV được tính tương đương VĐV nếu có quyết định chính thức hoặc chứng minh trực tiếp đào tạo.', [
      selMuc(R.heA.truc4.daoTao, 'daoTao'),
      selMuc(R.heA.truc4.chuyenMon, 'chuyenMon')
    ]);
  }

  /* ----- Hệ B ----- */
  function cardHeThongB() {
    return card('4. Xây dựng và phát triển hệ thống (Trục 2)', 'Mỗi nhóm chỉ chọn một mức cao nhất.', [
      selMuc(R.heB.truc2.clb, 'clb'),
      selMuc(R.heB.truc2.heThong, 'heThong')
    ]);
  }
  function cardLucLuongB() {
    return card('5. Đào tạo và phát triển lực lượng (Trục 3)', 'Mỗi nhóm chỉ chọn một mức cao nhất.', [
      selMuc(R.heB.truc3.vdv, 'daoTaoVdv'),
      selMuc(R.heB.truc3.hlv, 'daoTaoHlv')
    ]);
  }
  function rowVaiTro(i) {
    var p = 'vaiTro.' + i;
    var opts = [{ v: '', t: '— Chọn vai trò —' }].concat(R.heB.truc4.vaiTro.map(function (v) { return { v: v.id, t: v.nhan + ' (' + v.diem + ' điểm)' }; }));
    return h('div', { class: 'item' }, [
      h('div', { class: 'item-head' }, [
        h('strong', { text: 'Vai trò ' + (i + 1) }),
        h('button', { type: 'button', class: 'btn danger-link', 'data-del': 'vaiTro', 'data-i': i, 'aria-label': 'Xóa vai trò ' + (i + 1), text: 'Xóa dòng' })
      ]),
      lbl('Vai trò đảm nhiệm', select(p + '.id', opts)),
      evid(p, 'Số quyết định bổ nhiệm / xác nhận chính thức')
    ]);
  }
  function renderListVaiTro() {
    var box = $('list-vt'); box.innerHTML = '';
    if (!S.vaiTro.length) box.appendChild(h('p', { class: 'empty', text: 'Chưa có vai trò nào. Bấm "Thêm vai trò" để nhập.' }));
    S.vaiTro.forEach(function (_, i) { box.appendChild(rowVaiTro(i)); });
    var add = document.querySelector('[data-add="vaiTro"]');
    if (add) add.disabled = S.vaiTro.length >= R.heB.truc4.vaiTro.length;
  }
  function cardVaiTroB() {
    return card('6. Vai trò quản lý và chuyên môn (Trục 4)',
      'Nhập mọi vai trò đã đảm nhiệm. Hệ thống chỉ tính tối đa 02 vai trò có điểm cao nhất và cắt trần 20 điểm. Mỗi vai trò phải có quyết định bổ nhiệm hoặc xác nhận chính thức.', [
        h('div', { id: 'list-vt' }),
        h('div', { class: 'actions' }, [h('button', { type: 'button', class: 'btn', 'data-add': 'vaiTro', text: '+ Thêm vai trò' })])
      ]);
  }

  function cardActions() {
    return h('div', { class: 'actions' }, [
      h('button', { type: 'button', class: 'btn danger-link', 'data-reset': '1', text: 'Làm lại hồ sơ từ đầu' })
    ]);
  }

  /* ---------- Dựng biểu mẫu ---------- */
  var form, resultEl, heBox, workEl, totalbar, tbScore;

  function renderForm() {
    form.innerHTML = '';
    form.appendChild(cardThongTin());
    form.appendChild(cardNen());
    if (S.he === 'A') {
      form.appendChild(cardThanhTich());
      form.appendChild(cardTruc4A());
    } else {
      form.appendChild(cardHeThongB());
      form.appendChild(cardLucLuongB());
      form.appendChild(cardVaiTroB());
    }
    form.appendChild(cardActions());
    if (S.he === 'A') renderListThanhTich(); else renderListVaiTro();
  }

  function renderChooser() {
    var defs = [
      { id: 'A', t: R.heA.ten, d: 'Vận động viên, hoặc huấn luyện viên trực tiếp đào tạo VĐV, có HCV SEA Games trở lên (hoặc thành tích tương đương cao hơn).' },
      { id: 'B', t: R.heB.ten, d: 'Cán bộ, võ sư, HLV, trọng tài, người xây dựng phong trào, có đóng góp dài hạn. Không bắt buộc có huy chương quốc tế.' }
    ];
    heBox.innerHTML = '';
    defs.forEach(function (x) {
      heBox.appendChild(h('label', { class: 'he-card' }, [
        h('input', { type: 'radio', name: 'he', value: x.id, checked: S.he === x.id }),
        h('span', { class: 't', text: x.t }),
        h('span', { class: 'd', text: x.d })
      ]));
    });
  }

  /* ---------- Kết quả ---------- */
  var TRUC_NGAN = { nen: 'Điều kiện nền', truc1: 'Trục 1', truc2: 'Trục 2', truc3: 'Trục 3', truc4: 'Trục 4' };

  function tenHang(kq) {
    if (!kq.duocXet) return { cls: 'r-loai', text: 'CHƯA ĐỦ ĐIỀU KIỆN XÉT' };
    if (kq.hang.id === 'chua_dat') return { cls: 'r-chua_dat', text: kq.hang.ten };
    return { cls: 'r-' + kq.hang.id, text: kq.hang.ten + ' (' + kq.hang.tu + '–' + kq.hang.den + ' điểm)' };
  }

  function renderResult(kq, loi) {
    resultEl.innerHTML = '';
    if (!kq) {
      resultEl.appendChild(h('div', { class: 'card score-card' }, [h('p', { class: 'empty', text: 'Chọn hệ xét để bắt đầu. Điểm sẽ hiện ngay khi bạn nhập.' })]));
      return;
    }
    var hg = tenHang(kq);

    /* Điểm tổng */
    var scoreKids = [
      h('div', { class: 'score-num', 'aria-live': 'polite', 'aria-atomic': 'true' }, [String(kq.tong), h('small', { text: ' / 100' })]),
      h('div', { class: 'rank ' + hg.cls, text: hg.text })
    ];
    if (!kq.duocXet) scoreKids.push(h('p', { class: 'ref-note', text: 'Điểm chỉ để tham khảo. Hồ sơ chưa đạt điều kiện nền nên không được xếp hạng.' }));
    scoreKids.push(h('p', { class: 'score-note', text: 'Kết quả chấm sơ bộ theo ' + R.vanBan.so + ' ngày ' + R.vanBan.ngay + '. Hạng cuối cùng do Hội đồng quyết định.' }));
    resultEl.appendChild(h('section', { class: 'card score-card', id: 'ket-qua' }, scoreKids));

    /* Lỗi nhập */
    if (loi && loi.length) {
      resultEl.appendChild(h('section', { class: 'card err-card', role: 'alert' }, [
        h('h2', { text: 'Cần sửa dữ liệu nhập' }),
        h('ul', { class: 'note-list' }, loi.map(function (m) { return h('li', { text: m }); }))
      ]));
    }

    /* Điều kiện nền */
    resultEl.appendChild(h('section', { class: 'card' }, [
      h('h2', { text: 'Điều kiện nền' }),
      h('ul', { class: 'dk' }, kq.dieuKien.map(function (d) {
        return h('li', null, [
          h('span', { class: 'tag ' + (d.dat ? 'ok' : 'no'), text: d.dat ? 'Đạt' : 'Chưa đạt' }),
          h('span', null, [d.nhan, d.lyDo ? h('span', { class: 'why' + (d.dat ? ' ok' : ''), text: d.lyDo }) : null])
        ]);
      }))
    ]));

    /* Điểm từng trục */
    var trucKids = [h('h2', { text: 'Điểm từng trục' })];
    kq.truc.forEach(function (t) {
      var items = t.chiTiet.map(function (c) {
        return h('li', { class: c.tinh ? '' : 'off' }, [
          h('span', null, [
            (c.nhom ? c.nhom + ': ' : '') + c.nhan,
            c.ghiChu ? h('span', { class: 'g', text: c.ghiChu }) : null
          ]),
          h('span', { class: 'p', text: (c.tinh ? '+' : '') + c.diem + (c.tinh ? '' : ' (không tính)') })
        ]);
      });
      t.ghiChu.forEach(function (g) { items.push(h('li', null, [h('span', { class: 'g', text: g }), h('span')])); });
      trucKids.push(h('div', { class: 'truc' }, [
        h('div', { class: 'truc-head' }, [h('h3', { text: t.ten }), h('span', { class: 'pts', text: t.diem + ' / ' + t.toiDa })]),
        h('div', { class: 'bar', role: 'presentation' }, [h('i', { style: 'width:' + Math.round(t.diem / t.toiDa * 100) + '%' })]),
        h('details', null, [h('summary', { text: 'Xem cách tính' }), h('ul', { class: 'ct' }, items)])
      ]));
    });
    resultEl.appendChild(h('section', { class: 'card' }, trucKids));

    /* Cảnh báo */
    if (kq.canhBao.length) {
      resultEl.appendChild(h('section', { class: 'card warn-card' }, [
        h('h2', { text: 'Lưu ý' }),
        h('ul', { class: 'note-list' }, kq.canhBao.map(function (m) { return h('li', { text: m }); }))
      ]));
    }

    /* Mục không được tính */
    if (kq.mucBiLoai.length) {
      resultEl.appendChild(h('section', { class: 'card' }, [
        h('h2', { text: 'Mục không được tính điểm' }),
        h('ul', { class: 'note-list' }, kq.mucBiLoai.map(function (m) {
          return h('li', null, [h('strong', { text: (TRUC_NGAN[m.truc] || m.truc) + ': ' }), m.nhan + ' – ' + m.lyDo]);
        }))
      ]));
    }
  }

  var curView = 'calc';
  function renderBar(kq) {
    if (!kq || curView !== 'calc') { totalbar.hidden = true; return; }
    totalbar.hidden = false;
    var hg = tenHang(kq);
    tbScore.innerHTML = '';
    tbScore.appendChild(h('strong', { text: String(kq.tong) }));
    tbScore.appendChild(document.createTextNode(' / 100 · ' + (kq.duocXet ? hg.text.replace(/ \(.*\)$/, '') : 'Chưa đủ điều kiện')));
  }

  /* Hồ sơ đưa vào bộ tính: bỏ các dòng chưa chọn vai trò. */
  function buildHoSo() {
    var ho = JSON.parse(JSON.stringify(S));
    ho.vaiTro = (ho.vaiTro || []).filter(function (v) { return v.id; });
    return ho;
  }

  function update() {
    if (!S.he) { renderResult(null); renderBar(null); return; }
    var ho = buildHoSo();
    var loi = E.kiemTra(ho);
    var kq = E.evaluate(ho);
    renderResult(kq, loi);
    renderBar(kq);
    scheduleDraft();
  }

  /* ---------- Nháp tự động ---------- */
  function flushDraft() {
    if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }
    if (!storeReady || !dirty || ctx.mode === 'view' || !S.he) return;
    store.setDraft({ S: clone(S), ctx: clone(ctx), savedAt: new Date().toISOString() }).catch(function () {});
  }
  function scheduleDraft() {
    if (!storeReady || !dirty || ctx.mode === 'view' || !S.he) return;
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(flushDraft, 500);
  }

  /* ---------- Thông báo ---------- */
  var toastEl, toastTimer, statusEl, saveBox, histEl, tabsEl;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 4500);
  }
  function setMsg(text, ok) {
    var m = $('save-msg');
    if (!m) return;
    m.textContent = text || '';
    m.className = 'save-msg' + (text ? (ok ? ' ok' : ' bad') : '');
  }

  /* ---------- Khung Lưu hồ sơ (đầu cột kết quả) ---------- */
  function renderSaveBox() {
    saveBox.innerHTML = '';
    var kids = [h('h2', { text: 'Lưu hồ sơ' })];
    var acts = [];
    if (ctx.mode === 'new') {
      kids.push(h('p', { class: 'hint', text: 'Hồ sơ đang nhập được giữ tự động trên máy này. Bấm Lưu để đưa vào Lịch sử.' }));
      acts.push(h('button', { type: 'button', class: 'btn primary', 'data-act': 'save', text: 'Lưu vào lịch sử' }));
    } else if (ctx.mode === 'edit') {
      kids.push(h('p', { class: 'hint', text: 'Đang sửa hồ sơ đã lưu (hiện có ' + ctx.soPhienBan + ' phiên bản). Mỗi lần lưu tạo thêm một phiên bản mới, phiên bản cũ vẫn được giữ.' }));
      var ly = h('input', { type: 'text', id: 'ly-do', value: ctx.lyDo, placeholder: 'Ví dụ: Bổ sung quyết định bổ nhiệm' });
      ly.addEventListener('input', function (e) { ctx.lyDo = e.target.value; setMsg(''); });
      kids.push(lbl('Lý do sửa (bắt buộc)', ly));
      acts.push(h('button', { type: 'button', class: 'btn primary', 'data-act': 'save', text: 'Lưu phiên bản mới' }));
      acts.push(h('button', { type: 'button', class: 'btn', 'data-act': 'new', text: 'Hồ sơ mới' }));
    } else {
      kids.push(h('p', { class: 'hint view-note', text: 'Đang xem phiên bản ' + ctx.version + ' (chỉ đọc)' + (ctx.locked ? '. Hồ sơ đã chốt.' : '.') }));
      if (ctx.locked) acts.push(h('button', { type: 'button', class: 'btn primary', 'data-act': 'unlock', text: 'Mở khóa để sửa' }));
      else acts.push(h('button', { type: 'button', class: 'btn primary', 'data-act': 'editview', text: 'Sửa từ bản này' }));
      acts.push(h('button', { type: 'button', class: 'btn', 'data-act': 'new', text: 'Hồ sơ mới' }));
    }
    acts.push(h('button', { type: 'button', class: 'btn', 'data-act': 'print', text: 'In phiếu chấm điểm' }));
    kids.push(h('div', { class: 'actions' }, acts));
    kids.push(h('p', { id: 'save-msg', class: 'save-msg', role: 'status' }));
    saveBox.appendChild(h('section', { class: 'card save-card' }, kids));
    saveBox.appendChild(renderGuiBox());
  }

  /* ---------- Gửi hồ sơ chính thức về Văn phòng VTF (ghi vào Google Sheet riêng tư qua /api/submit-nomination) ---------- */
  var GUI = { open: false, phone: '', email: '', dongY: false, sending: false, requestId: '', dauVan: '', daGui: null, msg: '', ok: false };
  function taoMaYeuCau() {
    try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID().replace(/-/g, ''); } catch (e) { /* dùng dự phòng */ }
    var s = ''; for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }
  function soTruc(kq) {
    return kq.truc.map(function (t) { return t.ten.replace(/^Trục (\d) – /, 'T$1 ') + ': ' + t.diem + '/' + t.toiDa; }).join(' | ');
  }
  function soanHoSoGui() {
    var ho = buildHoSo();
    var kq = E.evaluate(ho);
    var tt = ho.thongTin || {};
    var dk = kq.duocXet ? 'Đạt điều kiện nền' : 'CHƯA đạt điều kiện nền (' + kq.dieuKien.filter(function (d) { return !d.dat; }).map(function (d) { return d.nhan; }).join('; ') + ')';
    var hangTen = kq.hang ? kq.hang.ten : 'Chưa xếp hạng';
    var tom = '[Máy tính chi tiết 036/VTF (' + R.version + '): ' + kq.tong + '/100đ - ' + hangTen + ' - ' + dk + '] ' + soTruc(kq) +
      (kq.mucBiLoai.length ? ' | ' + kq.mucBiLoai.length + ' mục không được tính (thiếu minh chứng/thông tin)' : '') +
      (tt.vaiTroChinh ? ' | Vai trò chính: ' + tt.vaiTroChinh : '') +
      (tt.nguoiCham ? ' | Người chấm: ' + tt.nguoiCham : '') +
      (tt.ghiChu ? ' | Ghi chú: ' + tt.ghiChu : '');
    return {
      ho: ho, kq: kq,
      payload: {
        fullName: String(tt.hoTen || '').trim(),
        phone: GUI.phone.trim(),
        email: GUI.email.trim(),
        organization: String(tt.donVi || '').trim(),
        submissionType: ho.he === 'A' ? 'nomination_a' : 'nomination_b',
        yearsContributed: Number(ho.nen && ho.nen.soNam) || 5,
        estimatedScore: kq.tong,
        estimatedRank: hangTen,
        messageOrAchievement: tom.slice(0, 3900),
        consentAccepted: GUI.dongY === true,
        ghi_chu_noi_bo_vtf: ''
      }
    };
  }
  function renderGuiBox() {
    var kids = [h('h2', { text: 'Gửi hồ sơ chính thức về VTF' })];
    if (GUI.daGui) {
      kids.push(h('p', { class: 'save-msg ok', role: 'status', text: 'Văn phòng VTF đã nhận hồ sơ. Mã hồ sơ: ' + GUI.daGui.id + (GUI.daGui.hash ? ' · Mã biên nhận: ' + GUI.daGui.hash : '') + '. Hãy ghi lại mã này.' }));
      kids.push(h('div', { class: 'actions' }, [h('button', { type: 'button', class: 'btn', 'data-act': 'gui-lai', text: 'Gửi một hồ sơ khác / gửi lại bản sửa' })]));
      return h('section', { class: 'card save-card gui-card' }, kids);
    }
    kids.push(h('p', { class: 'hint', text: 'Lưu vào lịch sử chỉ giữ hồ sơ trên máy này. Muốn Ban Tổ chức nhận và xếp hạng, bấm gửi bên dưới: kết quả chấm được ghi vào bảng tổng hợp của Văn phòng VTF.' }));
    if (!GUI.open) {
      kids.push(h('div', { class: 'actions' }, [h('button', { type: 'button', class: 'btn primary', 'data-act': 'gui-mo', text: 'Gửi hồ sơ này về VTF' })]));
      return h('section', { class: 'card save-card gui-card' }, kids);
    }
    function bind(el, key) { el.addEventListener('input', function (e) { GUI[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; GUI.msg = ''; var m = $('gui-msg'); if (m) { m.textContent = ''; m.className = 'save-msg'; } }); return el; }
    kids.push(lbl('Số điện thoại liên hệ', bind(h('input', { type: 'tel', id: 'gui-phone', value: GUI.phone, autocomplete: 'tel', placeholder: '0909 xxx xxx' }), 'phone')));
    kids.push(lbl('Email liên hệ', bind(h('input', { type: 'email', id: 'gui-email', value: GUI.email, autocomplete: 'email', placeholder: 'ten@donvi.vn' }), 'email')));
    var cb = bind(h('input', { type: 'checkbox', id: 'gui-dongy', checked: GUI.dongY }), 'dongY');
    kids.push(h('label', { class: 'check' }, [cb, h('span', { text: 'Tôi đồng ý cung cấp thông tin và tư liệu cho Ban Biên tập Kỷ yếu & Khen thưởng 30 năm VTF (NĐ 13/2023/NĐ-CP). Họ tên, đơn vị lấy từ mục "Thông tin chung".' })]));
    kids.push(h('div', { class: 'actions' }, [
      h('button', { type: 'button', class: 'btn primary', 'data-act': 'gui-gui', disabled: GUI.sending, text: GUI.sending ? 'Đang gửi…' : 'Gửi về VTF' }),
      h('button', { type: 'button', class: 'btn', 'data-act': 'gui-dong', disabled: GUI.sending, text: 'Đóng' })
    ]));
    kids.push(h('p', { id: 'gui-msg', class: 'save-msg' + (GUI.msg ? (GUI.ok ? ' ok' : ' bad') : ''), role: 'status', text: GUI.msg }));
    return h('section', { class: 'card save-card gui-card' }, kids);
  }
  function guiMsg(text, ok) { GUI.msg = text; GUI.ok = !!ok; var m = $('gui-msg'); if (m) { m.textContent = text; m.className = 'save-msg ' + (ok ? 'ok' : 'bad'); } }
  function doGui() {
    if (GUI.sending) return;
    if (!/^https?:$/.test(window.location.protocol)) { guiMsg('Bản chạy từ tệp tải về không gửi được. Hãy mở máy tính tại vtf30.tkdai.vn/tinh-diem/index.html để gửi.'); return; }
    if (!S.he) { guiMsg('Hãy chọn hệ xét trước khi gửi.'); return; }
    if (!String(S.thongTin.hoTen).trim()) { guiMsg('Nhập họ tên ở mục "Thông tin chung" trước khi gửi.'); return; }
    if (!String(S.thongTin.donVi).trim()) { guiMsg('Nhập đơn vị (CLB, tỉnh/thành, ngành) ở mục "Thông tin chung" trước khi gửi.'); return; }
    var ho0 = buildHoSo(); var loi = E.kiemTra(ho0);
    if (loi.length) { guiMsg('Cần sửa dữ liệu nhập trước khi gửi: ' + loi[0]); return; }
    if (!/^(0|\+84)[0-9\s.\-]{8,14}$/.test(GUI.phone.trim())) { guiMsg('Số điện thoại chưa đúng chuẩn Việt Nam (10 số bắt đầu bằng 0 hoặc +84).'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(GUI.email.trim())) { guiMsg('Địa chỉ email chưa hợp lệ.'); return; }
    if (!GUI.dongY) { guiMsg('Vui lòng tích đồng ý cung cấp thông tin trước khi gửi.'); return; }
    var p = soanHoSoGui().payload;
    var dauVan = JSON.stringify(p);
    if (!GUI.requestId || GUI.dauVan !== dauVan) { GUI.requestId = taoMaYeuCau(); GUI.dauVan = dauVan; }
    p.requestId = GUI.requestId;
    GUI.sending = true; renderSaveBox(); guiMsg('Đang gửi hồ sơ…', true);
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 35000);
    fetch('/api/submit-nomination', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p), signal: ctl ? ctl.signal : undefined })
      .then(function (res) { return res.json().catch(function () { return null; }).then(function (d) { return { res: res, d: d }; }); })
      .then(function (r) {
        GUI.sending = false;
        if (r.res.ok && r.d && r.d.ok && r.d.id) {
          GUI.daGui = { id: r.d.id, hash: r.d.serverReceiptHash || '' };
          GUI.requestId = ''; GUI.dauVan = ''; GUI.msg = '';
          renderSaveBox();
          toast('Đã gửi hồ sơ về VTF. Mã hồ sơ: ' + r.d.id);
        } else {
          renderSaveBox();
          var ct = r.d && r.d.loi && r.d.loi.length ? ' ' + r.d.loi.join(' ') : '';
          guiMsg(((r.d && r.d.thongBao) || 'Hồ sơ CHƯA được gửi đi. Vui lòng thử lại sau ít phút.') + ct);
        }
      })
      .catch(function () { GUI.sending = false; renderSaveBox(); guiMsg('Hồ sơ CHƯA được gửi đi (mất kết nối hoặc quá thời gian). Thông tin vẫn còn trên màn hình, hãy bấm gửi lại.'); })
      .then(function () { clearTimeout(timer); });
  }

  function applyReadOnly(flag) {
    var all = form.querySelectorAll('input, select, textarea, button');
    for (var i = 0; i < all.length; i++) all[i].disabled = !!flag;
    var radios = heBox.querySelectorAll('input');
    for (var j = 0; j < radios.length; j++) radios[j].disabled = !!flag;
    if (!flag) syncAddButtons();
    form.classList.toggle('readonly', !!flag);
  }
  function syncAddButtons() {
    var add = document.querySelector('[data-add="vaiTro"]');
    if (add) add.disabled = S.vaiTro.length >= R.heB.truc4.vaiTro.length;
  }

  /* Dựng lại toàn bộ giao diện nhập theo S và ctx. */
  function refreshAll() {
    if (showDraftNote && !draftRestoring) { showDraftNote = false; renderStatus(); }
    workEl.hidden = !S.he;
    renderChooser();
    renderForm();
    update();
    renderSaveBox();
    applyReadOnly(ctx.mode === 'view');
  }

  /* ---------- Lưu hồ sơ ---------- */
  function doSave() {
    setMsg('');
    if (!S.he) { setMsg('Hãy chọn hệ xét trước khi lưu.'); return; }
    if (!String(S.thongTin.hoTen).trim()) { setMsg('Nhập họ tên ở mục "Thông tin chung" để lưu hồ sơ.'); return; }
    var ho = buildHoSo();
    var loi = E.kiemTra(ho);
    if (loi.length) { setMsg('Cần sửa dữ liệu nhập trước khi lưu: ' + loi[0]); return; }
    var kq = E.evaluate(ho);
    var nguoi = S.thongTin.nguoiCham;
    if (draftTimer) { clearTimeout(draftTimer); draftTimer = null; }

    var pending;
    if (ctx.mode === 'edit' && ctx.recordId) {
      pending = store.get(ctx.recordId).then(function (rec) {
        if (!rec) return HS.createRecord({ input: ho, ketQua: kq, nguoiCham: nguoi });
        return HS.addVersion(rec, { input: ho, ketQua: kq, nguoiCham: nguoi, lyDo: ctx.lyDo });
      });
    } else {
      pending = Promise.resolve(HS.createRecord({ input: ho, ketQua: kq, nguoiCham: nguoi }));
    }
    pending.then(function (rec) {
      return store.put(rec).then(function () { return rec; });
    }).then(function (rec) {
      ctx = { recordId: rec.id, version: HS.latest(rec).v, mode: 'edit', lyDo: '', soPhienBan: rec.versions.length, locked: false };
      dirty = false;
      store.clearDraft().catch(function () {});
      renderSaveBox();
      setMsg('Đã lưu: ' + (ho.thongTin.hoTen) + ', phiên bản ' + ctx.version + ', ' + kq.tong + ' điểm.', true);
      toast('Đã lưu hồ sơ vào Lịch sử (phiên bản ' + ctx.version + ').');
      bumpChanges(1);
    }).catch(function (err) {
      setMsg(err && err.message ? err.message : 'Không lưu được hồ sơ.');
    });
  }

  function newRecord() {
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu và làm hồ sơ mới?')) return;
    S = newState(S.he);
    ctx = newCtx();
    dirty = false;
    if (storeReady) store.clearDraft().catch(function () {});
    refreshAll();
    showView('calc');
    window.scrollTo(0, 0);
  }

  function loadInto(rec, versionNo, mode) {
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu và mở hồ sơ khác?')) return;
    var ver = rec.versions.filter(function (v) { return v.v === versionNo; })[0] || HS.latest(rec);
    S = Object.assign(newState(ver.input.he), clone(ver.input));
    ctx = { recordId: rec.id, version: ver.v, mode: mode, lyDo: '', soPhienBan: rec.versions.length, locked: !!rec.locked };
    dirty = false;
    if (storeReady) store.clearDraft().catch(function () {});
    refreshAll();
    showView('calc');
    window.scrollTo(0, 0);
  }

  function duplicate(rec) {
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu và nhân bản hồ sơ?')) return;
    var ver = HS.latest(rec);
    S = Object.assign(newState(ver.input.he), clone(ver.input));
    S.thongTin.hoTen = (S.thongTin.hoTen || '') + ' (bản sao)';
    S.thongTin.ngayCham = homNay();
    ctx = newCtx();
    dirty = true;
    refreshAll();
    scheduleDraft();
    showView('calc');
    window.scrollTo(0, 0);
    toast('Đã nhân bản. Sửa thông tin rồi bấm Lưu vào lịch sử.');
  }

  function editFromView() {
    store.get(ctx.recordId).then(function (rec) {
      if (!rec) { setMsg('Không tìm thấy hồ sơ này trong lịch sử.'); return; }
      if (rec.locked) { ctx.locked = true; renderSaveBox(); setMsg('Hồ sơ đã chốt, cần mở khóa trước.'); return; }
      var cu = ctx.version !== HS.latest(rec).v;
      var base = ctx.version;
      ctx = { recordId: rec.id, version: HS.latest(rec).v, mode: 'edit', lyDo: cu ? 'Khôi phục từ phiên bản ' + base : '', soPhienBan: rec.versions.length, locked: false };
      dirty = cu;
      renderSaveBox();
      applyReadOnly(false);
      scheduleDraft();
    });
  }

  function unlockRecord(id, done) {
    var ly = window.prompt('Lý do mở khóa hồ sơ (bắt buộc, sẽ ghi vào nhật ký):');
    if (ly === null) return;
    if (!String(ly).trim()) { toast('Cần ghi lý do mở khóa.'); return; }
    store.get(id).then(function (rec) {
      if (!rec) return;
      var r2 = HS.unlock(rec, { nguoi: HS.latest(rec).nguoiCham, lyDo: ly });
      return store.put(r2).then(function () { toast('Đã mở khóa hồ sơ.'); bumpChanges(1); if (done) done(r2); });
    }).catch(function (err) { toast(err.message); });
  }

  /* ---------- Hướng dẫn nhanh (lần đầu) ---------- */
  var guideHidden = false;
  function renderGuide(force) {
    var box = $('guide');
    if (!box) return;
    box.innerHTML = '';
    if (guideHidden && !force) return;
    function step(n, t, d) {
      return h('li', null, [h('span', { class: 'step-n', 'aria-hidden': 'true', text: String(n) }), h('span', null, [h('strong', { text: t + ' ' }), d])]);
    }
    box.appendChild(h('section', { class: 'card guide-card', 'aria-labelledby': 'guide-title' }, [
      h('h2', { id: 'guide-title', text: 'Hướng dẫn nhanh: 3 bước' }),
      h('ol', { class: 'guide-steps' }, [
        step(1, 'Chọn hệ xét.', 'Hệ A cho người có thành tích quốc tế (từ HCV SEA Games trở lên). Hệ B cho cán bộ, võ sư, HLV, trọng tài có đóng góp dài hạn cho phong trào.'),
        step(2, 'Nhập thông tin.', 'Với mỗi mục, đánh dấu "Đã có minh chứng" và ghi số văn bản. Mục thiếu minh chứng không được tính điểm. Điểm, hạng và cách tính hiện ngay bên cạnh (trên điện thoại là thanh ở cuối màn hình).'),
        step(3, 'Lưu và xuất.', 'Bấm "Lưu vào lịch sử" rồi xem lại ở tab Lịch sử. Xuất Excel, tải bản sao lưu ở tab Xuất & Sao lưu; in phiếu chấm điểm A4 để đưa vào biên bản.')
      ]),
      h('p', { class: 'guide-warn', text: 'Hồ sơ bấm "Lưu vào lịch sử" chỉ nằm trong trình duyệt của máy này. Muốn Văn phòng VTF nhận và xếp hạng, hãy bấm "Gửi hồ sơ này về VTF". Nếu xóa dữ liệu duyệt web hoặc đổi máy thì sẽ mất, nên hãy tải bản sao lưu sau mỗi đợt chấm.' }),
      h('div', { class: 'actions' }, [
        h('button', { type: 'button', class: 'btn primary', 'data-act': 'guide-hide', text: 'Đã hiểu, ẩn hướng dẫn' }),
        h('button', { type: 'button', class: 'btn', 'data-act': 'guide-rules', text: 'Xem bảng tiêu chí 036/VTF' })
      ])
    ]));
  }
  function onGuideClick(ev) {
    var b = ev.target.closest ? ev.target.closest('button') : null;
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'guide-hide') {
      guideHidden = true;
      renderGuide();
      if (storeReady) store.setMeta('guide', { hidden: true }).catch(function () {});
    } else if (act === 'guide-rules') showView('rules');
  }

  /* ---------- Bảng tiêu chí (đọc thẳng từ rules-036, không gõ lại số liệu) ---------- */
  var rulesEl, rulesBuilt = false;
  function rtable(caption, heads, rows, cls) {
    return h('div', { class: 'tbl-wrap' }, [h('table', { class: 'rt' + (cls ? ' ' + cls : '') }, [
      h('caption', { text: caption }),
      h('thead', null, [h('tr', null, heads.map(function (t, i) { return h('th', { scope: 'col', class: i > 0 && cls === 'num' ? 'r' : '', text: t }); }))]),
      h('tbody', null, rows.map(function (r) { return h('tr', null, r.map(function (c, i) { return h('td', { class: i > 0 && cls === 'num' ? 'r' : '', text: String(c) }); })); }))
    ])]);
  }
  function bandRows(bands) { return bands.map(function (b) { return [b.nhan, b.diem]; }); }
  function nhomRows(nhom) { return nhom.muc.map(function (m) { return [m.nhan, m.diem]; }); }
  function ul(items) { return h('ul', { class: 'note-list' }, items.map(function (t) { return h('li', { text: t }); })); }

  function buildRules() {
    rulesEl.innerHTML = '';
    var A = R.heA; var Bb = R.heB;
    rulesEl.appendChild(card('Văn bản căn cứ', null, [
      h('p', { text: R.vanBan.ten + '.' }),
      h('p', { text: 'Bản tiêu chí số ' + R.vanBan.so + ' ngày ' + R.vanBan.ngay + '; kèm Thông báo ' + R.vanBan.thongBao + '. Phiên bản tiêu chí công cụ đang áp dụng: ' + R.version + '.' }),
      h('div', { class: 'actions' }, [
        h('a', { class: 'btn', href: 'https://vtf30.tkdai.vn/docs/VTF_036_Tieu_Chi_Vinh_Danh_30_Nam.pdf', target: '_blank', rel: 'noopener', text: 'Xem PDF 036/VTF' }),
        h('a', { class: 'btn', href: 'https://vtf30.tkdai.vn/docs/VTF_038_TB_Khen_Thuong_30_Nam.pdf', target: '_blank', rel: 'noopener', text: 'Xem PDF 038/TB-VTF' })
      ])
    ]));

    rulesEl.appendChild(card('Tầng 1: điều kiện nền (bắt buộc, không đạt thì bị loại)', null, [
      ul([
        'Thời gian: tối thiểu ' + R.nen.soNamToiThieu + ' năm tham gia hoạt động, công tác hoặc đóng góp, có đầy đủ minh chứng xác nhận. Tính cộng dồn, không cần liên tục.',
        'Vai trò: đảm nhiệm ít nhất 1 trong: ' + R.nen.vaiTroNen.map(function (v) { return v.ten; }).join('; ') + '.',
        'Đạo đức, tổ chức: không vi phạm kỷ luật nghiêm trọng và không làm ảnh hưởng uy tín hệ thống.'
      ])
    ]));

    var rowsG = A.giai.map(function (g) { return [g.ten, g.diem.HCV, g.diem.HCB, g.diem.HCD]; });
    rulesEl.appendChild(card('Hệ A – Thành tích đỉnh cao (tổng 100 điểm)', 'Điều kiện riêng: có ít nhất một HCV SEA Games hoặc thành tích tương đương trở lên tại giải thuộc hệ thống chính thức của khu vực, châu lục hoặc thế giới.', [
      rtable('Trục 1 – Thành tích quốc tế (tối đa ' + A.toiDa.truc1 + ' điểm). Chỉ tính 01 thành tích cao nhất.', ['Cấp độ giải đấu', 'HCV', 'HCB', 'HCĐ'], rowsG, 'num'),
      h('p', { class: 'small-note', text: 'Giải thuộc hệ thống WT khác (Grand Prix, World Cup…) do Hội đồng quy đổi, không vượt khung Vô địch Thế giới (' + A.wtKhac.tran + ' điểm). Không tính giải phong trào, giải mời không chính thức.' }),
      rtable('Trục 2 – Thành tích tích lũy (tối đa ' + A.toiDa.truc2 + ' điểm). Không tính trùng với thành tích đã dùng ở Trục 1.', ['Số huy chương quốc tế (từ cấp SEA Games trở lên)', 'Điểm'], bandRows(A.truc2), 'num'),
      rtable('Trục 3 – Thời gian cống hiến (tối đa ' + A.toiDa.truc3 + ' điểm)', ['Thời gian có xác minh', 'Điểm'], bandRows(A.truc3), 'num'),
      rtable('Trục 4 – Đóng góp cho hệ thống (tối đa ' + A.toiDa.truc4 + ' điểm)', ['Tiêu chí', 'Điểm'],
        [[A.truc4.daoTao.ten + ' (tối đa ' + A.truc4.daoTao.toiDa + ')', '']].concat(nhomRows(A.truc4.daoTao), [[A.truc4.chuyenMon.ten + ' (tối đa ' + A.truc4.chuyenMon.toiDa + ')', '']], nhomRows(A.truc4.chuyenMon)), 'num')
    ]));

    rulesEl.appendChild(card('Hệ B – Cống hiến, di sản phong trào (tổng 100 điểm)', 'Điều kiện riêng: tối thiểu ' + Bb.soNamToiThieu + ' năm đóng góp và có ít nhất một dấu ấn cụ thể: ' + Bb.dauAn.map(function (d) { return d.ten.charAt(0).toLowerCase() + d.ten.slice(1); }).join('; ') + '.', [
      rtable('Trục 1 – Thời gian cống hiến (tối đa ' + Bb.toiDa.truc1 + ' điểm). Tính cộng dồn, có minh chứng theo từng giai đoạn.', ['Thời gian đóng góp có xác minh', 'Điểm'], bandRows(Bb.truc1), 'num'),
      rtable('Trục 2 – Xây dựng và phát triển hệ thống (tối đa ' + Bb.toiDa.truc2 + ' điểm)', ['Tiêu chí', 'Điểm'],
        [[Bb.truc2.clb.ten + ' (tối đa ' + Bb.truc2.clb.toiDa + ')', '']].concat(nhomRows(Bb.truc2.clb), [[Bb.truc2.heThong.ten + ' (tối đa ' + Bb.truc2.heThong.toiDa + ')', '']], nhomRows(Bb.truc2.heThong)), 'num'),
      rtable('Trục 3 – Đào tạo và phát triển lực lượng (tối đa ' + Bb.toiDa.truc3 + ' điểm)', ['Tiêu chí', 'Điểm'],
        [[Bb.truc3.vdv.ten + ' (tối đa ' + Bb.truc3.vdv.toiDa + ')', '']].concat(nhomRows(Bb.truc3.vdv), [[Bb.truc3.hlv.ten + ' (tối đa ' + Bb.truc3.hlv.toiDa + ')', '']], nhomRows(Bb.truc3.hlv)), 'num'),
      rtable('Trục 4 – Vai trò quản lý và chuyên môn (tối đa ' + Bb.toiDa.truc4 + ' điểm). Chỉ tính tối đa ' + Bb.truc4.toiDaVaiTro + ' vai trò điểm cao nhất; phải có quyết định bổ nhiệm hoặc xác nhận chính thức.', ['Vai trò đảm nhiệm', 'Điểm'], bandRows(Bb.truc4.vaiTro.map(function (v) { return { nhan: v.nhan, diem: v.diem }; })), 'num')
    ]));

    rulesEl.appendChild(card('Phân hạng vinh danh', 'Hạng xếp theo tổng điểm trong từng hệ. Hai hệ không xếp chung và không so sánh chéo.', [
      rtable('Hạng theo điểm', ['Hạng', 'Điểm'], R.hang.map(function (x) { return [x.ten, x.tu + ' – ' + x.den]; }).concat([[R.hangDuoiNguong.ten, 'dưới ' + R.hang[R.hang.length - 1].tu]]), 'num')
    ]));

    rulesEl.appendChild(card('Quy tắc quan trọng của 036/VTF', null, [ul(R.quyTac)]));
    rulesEl.appendChild(card('Quy trình xét duyệt 3 cấp', 'Công cụ chỉ hỗ trợ chấm điểm và lưu hồ sơ; bỏ phiếu và kiểm soát xung đột lợi ích do Hội đồng thực hiện ngoài công cụ.', [ul(R.quyTrinh)]));
    rulesEl.appendChild(card('Công cụ hiểu những chỗ 036/VTF chưa nói rõ như sau', 'Các quy ước này đã được thống nhất khi xây dựng công cụ. Nếu Hội đồng hiểu khác, cần cập nhật công cụ.', [ul(R.quyUoc)]));
    rulesBuilt = true;
  }

  /* ---------- Điều hướng giữa các màn hình ---------- */
  function showView(v) {
    curView = v;
    $('view-calc').hidden = v !== 'calc';
    histEl.hidden = v !== 'history';
    dataEl.hidden = v !== 'data';
    rulesEl.hidden = v !== 'rules';
    if (v === 'rules' && !rulesBuilt) buildRules();
    if (v !== 'calc') window.scrollTo(0, 0);
    if (v !== 'calc') totalbar.hidden = true; else update();
    var tabs = tabsEl.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-view') === v) tabs[i].setAttribute('aria-current', 'page');
      else tabs[i].removeAttribute('aria-current');
    }
    if (v === 'history') renderHistory();
    if (v === 'data') renderData();
  }
  function updateHistCount() {
    if (!storeReady) return;
    store.list().then(function (l) {
      recCount = l.length;
      $('hist-count').textContent = l.length ? '(' + l.length + ')' : '';
      renderStatus();
    });
  }

  /* ---------- Lịch sử ---------- */
  function fmtNgay(s) {
    if (!s) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : s;
  }
  function fmtGio(iso) {
    var d = new Date(iso);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  var LOAI_NK = { tao: 'Tạo hồ sơ', sua: 'Sửa hồ sơ', chot: 'Chốt hồ sơ', mo_khoa: 'Mở khóa' };

  function buildHistoryShell() {
    histEl.innerHTML = '';
    var q = h('input', { type: 'text', id: 'hf-q', placeholder: 'Gõ tên, đơn vị hoặc người chấm (không cần dấu)' });
    q.addEventListener('input', function () { HF.q = q.value; renderHistoryList(); });
    function sl(id, key, opts) {
      var s = h('select', { id: id }, opts.map(function (o) { return h('option', { value: o.v }, [o.t]); }));
      s.addEventListener('change', function () { HF[key] = s.value; renderHistoryList(); });
      return s;
    }
    var filters = h('div', { class: 'filters' }, [
      lbl('Tìm kiếm', q),
      h('div', { class: 'row four' }, [
        lbl('Hệ', sl('hf-he', 'he', [{ v: '', t: 'Tất cả' }, { v: 'A', t: 'Hệ A' }, { v: 'B', t: 'Hệ B' }])),
        lbl('Hạng', sl('hf-hang', 'hang', [
          { v: '', t: 'Tất cả' }, { v: 'dac_biet', t: 'Đặc biệt' }, { v: 'xuat_sac', t: 'Xuất sắc' }, { v: 'tieu_bieu', t: 'Tiêu biểu' },
          { v: 'ghi_nhan', t: 'Ghi nhận' }, { v: 'chua_dat', t: 'Chưa đạt mức xét' }, { v: 'chua_du_dk', t: 'Chưa đủ điều kiện' }
        ])),
        lbl('Năm lưu', sl('hf-nam', 'nam', [{ v: '', t: 'Tất cả' }])),
        lbl('Sắp xếp', sl('hf-sort', 'sort', [{ v: 'moi', t: 'Mới nhất' }, { v: 'diem', t: 'Điểm cao đến thấp' }, { v: 'ten', t: 'Tên A đến Z' }]))
      ]),
      h('div', { class: 'actions' }, [h('button', { type: 'button', class: 'btn', id: 'hf-clear', text: 'Xóa bộ lọc' })])
    ]);
    histEl.appendChild(h('section', { class: 'card' }, [h('h2', { text: 'Lịch sử hồ sơ đã lưu' }), filters, h('p', { id: 'hf-count', class: 'hint', 'aria-live': 'polite' })]));
    histEl.appendChild(h('div', { id: 'hf-list' }));
    $('hf-clear').addEventListener('click', function () {
      HF = { q: '', he: '', hang: '', nam: '', sort: 'moi' };
      $('hf-q').value = ''; $('hf-he').value = ''; $('hf-hang').value = ''; $('hf-nam').value = ''; $('hf-sort').value = 'moi';
      renderHistoryList();
    });
    $('hf-list').addEventListener('click', onHistClick);
  }

  function renderHistory() {
    if (!storeReady) return;
    store.list().then(function (recs) {
      histCache = recs;
      $('hist-count').textContent = recs.length ? '(' + recs.length + ')' : '';
      var nam = {};
      recs.forEach(function (r) { nam[new Date(HS.latest(r).savedAt).getFullYear()] = 1; });
      var sel = $('hf-nam');
      var cur = HF.nam;
      sel.innerHTML = '';
      sel.appendChild(h('option', { value: '' }, ['Tất cả']));
      Object.keys(nam).sort().reverse().forEach(function (y) { sel.appendChild(h('option', { value: y, selected: String(cur) === y }, [y])); });
      renderHistoryList();
    });
  }

  function hangTag(s) {
    var cls = s.hangKey === 'chua_du_dk' ? 'no' : (s.hangKey === 'chua_dat' ? 'skip' : 'ok');
    return h('span', { class: 'tag ' + cls, text: s.hangTen });
  }
  function actBtn(text, act, id, label, extra) {
    var a = { type: 'button', class: 'btn' + (extra ? ' ' + extra : ''), 'data-act': act, 'data-id': id, 'aria-label': label, text: text };
    return h('button', a);
  }
  function histItem(s, rec) {
    var vers = rec.versions.slice().reverse().map(function (v) {
      return h('li', null, [
        h('span', null, [
          'Phiên bản ' + v.v + ' · ' + fmtGio(v.savedAt) + (v.nguoiCham ? ' · ' + v.nguoiCham : '') + ' · ' + v.ketQua.tong + ' điểm',
          v.lyDo ? h('span', { class: 'g', text: 'Lý do: ' + v.lyDo }) : null
        ]),
        h('button', { type: 'button', class: 'btn small', 'data-act': 'openv', 'data-id': rec.id, 'data-v': v.v, 'aria-label': 'Mở phiên bản ' + v.v + ' của ' + s.hoTen, text: 'Mở bản này' })
      ]);
    });
    var nk = rec.nhatKy.slice().reverse().map(function (n) {
      return h('li', null, [h('span', null, [
        fmtGio(n.t) + ' · ' + (LOAI_NK[n.loai] || n.loai) + (n.v ? ' (phiên bản ' + n.v + ')' : '') + (n.nguoi ? ' · ' + n.nguoi : ''),
        n.lyDo ? h('span', { class: 'g', text: 'Lý do: ' + n.lyDo }) : null
      ])]);
    });
    var ten = s.hoTen || '(chưa có tên)';
    return h('article', { class: 'hs' }, [
      h('div', { class: 'hs-top' }, [
        h('div', { class: 'hs-main' }, [
          h('h3', { text: ten }),
          h('p', { class: 'meta', text: [s.donVi, 'Hệ ' + s.he, s.ngayCham ? 'Chấm ngày ' + fmtNgay(s.ngayCham) : '', s.nguoiCham ? 'Người chấm: ' + s.nguoiCham : ''].filter(Boolean).join(' · ') })
        ]),
        h('div', { class: 'hs-score' }, [h('strong', { text: String(s.tong) }), h('span', { text: ' / 100' })])
      ]),
      h('div', { class: 'hs-tags' }, [hangTag(s), s.locked ? h('span', { class: 'tag ok', text: 'Đã chốt' }) : null, h('span', { class: 'tag skip', text: 'Phiên bản ' + s.soPhienBan })]),
      h('div', { class: 'actions' }, [
        actBtn('Mở', 'open', rec.id, 'Mở hồ sơ ' + ten),
        actBtn('Nhân bản', 'dup', rec.id, 'Nhân bản hồ sơ ' + ten),
        actBtn('In phiếu', 'print', rec.id, 'In phiếu chấm điểm của ' + ten),
        s.locked ? actBtn('Mở khóa', 'unlock', rec.id, 'Mở khóa hồ sơ ' + ten) : actBtn('Chốt hồ sơ', 'lock', rec.id, 'Chốt hồ sơ ' + ten),
        actBtn('Xóa', 'del', rec.id, 'Xóa hồ sơ ' + ten, 'danger-link')
      ]),
      h('details', null, [
        h('summary', { text: 'Phiên bản và nhật ký' }),
        h('p', { class: 'sub-h', text: 'Các phiên bản' }), h('ul', { class: 'ct' }, vers),
        h('p', { class: 'sub-h', text: 'Nhật ký' }), h('ul', { class: 'ct' }, nk)
      ])
    ]);
  }

  function renderHistoryList() {
    var box = $('hf-list');
    box.innerHTML = '';
    var list = HS.filterSort(histCache, HF);
    $('hf-count').textContent = histCache.length
      ? 'Hiển thị ' + list.length + ' / ' + histCache.length + ' hồ sơ.'
      : '';
    if (!histCache.length) {
      box.appendChild(h('section', { class: 'card' }, [h('p', { class: 'empty', text: 'Chưa có hồ sơ nào được lưu. Vào "Tính điểm", nhập hồ sơ rồi bấm "Lưu vào lịch sử".' })]));
      return;
    }
    if (!list.length) {
      box.appendChild(h('section', { class: 'card' }, [h('p', { class: 'empty', text: 'Không có hồ sơ nào khớp bộ lọc.' })]));
      return;
    }
    var byId = {};
    histCache.forEach(function (r) { byId[r.id] = r; });
    list.forEach(function (s) { box.appendChild(histItem(s, byId[s.id])); });
  }

  function onHistClick(ev) {
    var b = ev.target.closest ? ev.target.closest('button') : null;
    if (!b || !b.getAttribute('data-act')) return;
    var act = b.getAttribute('data-act');
    var id = b.getAttribute('data-id');
    store.get(id).then(function (rec) {
      if (!rec) { toast('Không tìm thấy hồ sơ.'); renderHistory(); return; }
      var last = HS.latest(rec);
      if (act === 'open') loadInto(rec, last.v, rec.locked ? 'view' : 'edit');
      else if (act === 'openv') {
        var v = Number(b.getAttribute('data-v'));
        loadInto(rec, v, (v === last.v && !rec.locked) ? 'edit' : 'view');
      } else if (act === 'dup') duplicate(rec);
      else if (act === 'print') inPhieu(clone(last.input), clone(last.ketQua), { version: last.v, locked: rec.locked, recordId: rec.id });
      else if (act === 'lock') {
        if (!window.confirm('Chốt hồ sơ "' + (last.input.thongTin.hoTen || '') + '"? Sau khi chốt không sửa được, trừ khi mở khóa và ghi lý do.')) return;
        return store.put(HS.lock(rec, { nguoi: last.nguoiCham })).then(function () { toast('Đã chốt hồ sơ.'); bumpChanges(1); renderHistory(); });
      } else if (act === 'unlock') unlockRecord(id, function () { renderHistory(); });
      else if (act === 'del') {
        if (!window.confirm('Xóa hồ sơ "' + (last.input.thongTin.hoTen || '') + '" cùng toàn bộ phiên bản? Không khôi phục được.')) return;
        return store.remove(id).then(function () {
          if (ctx.recordId === id) { ctx = newCtx(); renderSaveBox(); applyReadOnly(false); }
          toast('Đã xóa hồ sơ.'); bumpChanges(1); renderHistory();
        });
      }
    }).catch(function (err) { toast(err && err.message ? err.message : 'Có lỗi xảy ra.'); });
  }

  /* Khung trạng thái lưu trữ (dưới dòng ghi chú đầu trang). */
  function renderStatus() {
    if (!statusEl || !storeInfo) return;
    var info = storeInfo;
    statusEl.innerHTML = '';
    if (info.warning) statusEl.appendChild(h('p', { class: 'status-warn', text: info.warning }));
    else statusEl.appendChild(h('p', { class: 'status-ok', text: 'Đang lưu trên máy này (' + (info.backend === 'indexeddb' ? 'IndexedDB' : info.backend) + ').' +
      (info.persisted === false ? ' Trình duyệt chưa cam kết giữ lâu dài; hãy sao lưu định kỳ.' : '') }));
    if (showDraftNote) statusEl.appendChild(h('p', { class: 'status-ok status-draft', text: 'Đã khôi phục hồ sơ bạn đang nhập dở lần trước. Bấm "Hồ sơ mới" nếu muốn bỏ.' }));
    var bs = B.trangThaiSaoLuu(backupMeta, recCount);
    if (bs.canNhac) {
      statusEl.appendChild(h('p', { class: 'status-warn' }, [bs.lyDo + ' ',
        h('button', { type: 'button', class: 'btn small', 'data-act': 'bk-json', text: 'Tải bản sao lưu ngay' })]));
    }
  }

  /* ---------- Sao lưu, xuất, nhập ---------- */
  var dataEl, impPlan = null;

  function persistBackup() { if (storeReady) store.setMeta('backup', backupMeta).catch(function () {}); }
  function bumpChanges(n) {
    n = n || 1;
    if (!backupMeta.thayDoi) backupMeta.firstChangeAt = new Date().toISOString();
    backupMeta.thayDoi += n;
    persistBackup();
    updateHistCount();
  }
  function markBackup() {
    backupMeta = { lastBackupAt: new Date().toISOString(), thayDoi: 0, firstChangeAt: null };
    persistBackup();
    renderStatus();
    renderBackupStatus();
  }
  function renderBackupStatus() {
    var el = $('bk-status');
    if (!el) return;
    var s = recCount + ' hồ sơ trong máy. ';
    s += backupMeta.lastBackupAt ? 'Sao lưu gần nhất: ' + B.fmtGio(backupMeta.lastBackupAt) + '. ' : 'Chưa từng sao lưu. ';
    s += backupMeta.thayDoi ? backupMeta.thayDoi + ' thay đổi chưa sao lưu.' : 'Không có thay đổi chưa sao lưu.';
    el.textContent = s;
  }

  function download(name, mime, data) {
    var blob = new Blob([data], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function recordsForScope(scope) {
    return store.list().then(function (all) {
      if (scope !== 'filtered') return all.sort(function (x, y) { return HS.latest(x).savedAt < HS.latest(y).savedAt ? 1 : -1; });
      var ids = HS.filterSort(all, HF).map(function (s) { return s.id; });
      var byId = {}; all.forEach(function (r) { byId[r.id] = r; });
      return ids.map(function (id) { return byId[id]; });
    });
  }

  function doExport(fmt, scope) {
    return recordsForScope(scope).then(function (recs) {
      if (!recs.length) { toast('Không có hồ sơ nào để xuất.'); return; }
      var now = new Date();
      if (fmt === 'json') {
        download(B.tenFile('json', now), 'application/json;charset=utf-8', JSON.stringify(B.envelope(recs, now)));
      } else if (fmt === 'csv') {
        download(B.tenFile('csv', now), 'text/csv;charset=utf-8', B.toCsv(B.bangTongHop(recs)));
      } else {
        var bytes = X.buildXlsx(B.cacTrang(recs), JSON.stringify(B.envelope(recs, now)), now);
        download(B.tenFile('xlsx', now), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes);
      }
      if (scope === 'all' && (fmt === 'json' || fmt === 'xlsx')) markBackup();
      toast('Đã tạo tệp ' + (fmt === 'xlsx' ? 'Excel' : fmt.toUpperCase()) + ' (' + recs.length + ' hồ sơ). Kiểm tra thư mục Tải xuống.');
    }).catch(function (err) { toast('Không xuất được: ' + (err && err.message ? err.message : 'lỗi không rõ')); });
  }

  /* ----- Nhập và gộp ----- */
  var LOAI_GOP = {
    moi: 'Mới', nghi_trung: 'Nghi trùng với hồ sơ trong máy', giong: 'Giống bản trong máy',
    cap_nhat: 'Bản nhập mới hơn', cu_hon: 'Bản trong máy mới hơn', xung_dot: 'Xung đột: cùng mã nhưng lịch sử khác'
  };

  function docTep(file) {
    if (file.size > B.MAX_BYTES) return Promise.reject(new Error('Tệp quá lớn (trên 20 MB).'));
    var ten = (file.name || '').toLowerCase();
    if (/\.xlsx$/.test(ten)) {
      return file.arrayBuffer().then(function (ab) { return X.readHiddenData(new Uint8Array(ab)); }).then(function (t) {
        if (t === null) throw new Error('Tệp Excel này không chứa dữ liệu của công cụ. Chỉ nhập được tệp Excel xuất từ chính công cụ này; hoặc hãy dùng tệp .json.');
        return t;
      });
    }
    if (/\.json$/.test(ten)) return file.text();
    return Promise.reject(new Error('Chỉ nhập được tệp .json hoặc .xlsx do công cụ này xuất ra.'));
  }

  function onFile(ev) {
    var input = ev.target;
    var file = input.files && input.files[0];
    if (!file) return;
    var body = $('imp-body');
    body.innerHTML = '';
    docTep(file).then(function (text) {
      var goi = B.docGoi(text);
      return store.list().then(function (existing) { return { goi: goi, plan: goi.ok ? B.lapKeHoachGop(existing, goi.records) : [] }; });
    }).then(function (r) {
      renderImport(r.goi, r.plan, file.name);
    }).catch(function (err) {
      body.appendChild(h('p', { class: 'save-msg bad', role: 'alert', text: err && err.message ? err.message : 'Không đọc được tệp.' }));
    }).then(function () { input.value = ''; });
  }

  function renderImport(goi, plan, tenTep) {
    var body = $('imp-body');
    body.innerHTML = '';
    impPlan = plan;
    if (goi.loi.length) body.appendChild(h('div', { class: 'card err-card', role: 'alert' }, [h('h3', { text: 'Không đọc được một phần tệp' }), h('ul', { class: 'note-list' }, goi.loi.map(function (m) { return h('li', { text: m }); }))]));
    if (goi.canhBao.length) body.appendChild(h('div', { class: 'card warn-card' }, [h('h3', { text: 'Lưu ý' }), h('ul', { class: 'note-list' }, goi.canhBao.map(function (m) { return h('li', { text: m }); }))]));
    if (!goi.ok) return;
    var dem = {};
    plan.forEach(function (p) { dem[p.loai] = (dem[p.loai] || 0) + 1; });
    body.appendChild(h('p', { class: 'hint', text: 'Tệp "' + tenTep + '": ' + plan.length + ' hồ sơ. ' + Object.keys(dem).map(function (k) { return dem[k] + ' ' + LOAI_GOP[k].toLowerCase(); }).join('; ') + '.' }));
    plan.forEach(function (p, i) {
      var v = HS.latest(p.rec); var s = HS.summarize(p.rec);
      var sel = h('select', { 'data-i': i, 'aria-label': 'Cách xử lý hồ sơ ' + (s.hoTen || p.rec.id) },
        p.tuyChon.map(function (o) { return h('option', { value: o.v, selected: o.v === p.macDinh }, [o.t]); }));
      var kids = [
        h('div', { class: 'item-head' }, [h('strong', { text: (s.hoTen || '(chưa có tên)') }), h('span', { class: 'tag ' + (p.loai === 'moi' ? 'ok' : (p.loai === 'giong' || p.loai === 'cu_hon' ? 'skip' : 'no')), text: LOAI_GOP[p.loai] })]),
        h('p', { class: 'meta', text: [s.donVi, 'Hệ ' + s.he, s.tong + ' điểm', s.hangTen, 'Phiên bản ' + s.soPhienBan, 'Lưu ' + B.fmtGio(v.savedAt)].filter(Boolean).join(' · ') })
      ];
      if (p.hienCo) {
        var hs = HS.summarize(p.hienCo);
        kids.push(h('p', { class: 'meta', text: 'Hồ sơ trong máy: ' + (hs.hoTen || '') + ' · ' + hs.tong + ' điểm · Phiên bản ' + hs.soPhienBan + ' · Lưu ' + B.fmtGio(HS.latest(p.hienCo).savedAt) }));
      }
      kids.push(lbl('Cách xử lý', sel));
      body.appendChild(h('div', { class: 'item' }, kids));
    });
    body.appendChild(h('div', { class: 'actions' }, [
      h('button', { type: 'button', class: 'btn primary', 'data-act': 'imp-apply', text: 'Áp dụng nhập' }),
      h('button', { type: 'button', class: 'btn', 'data-act': 'imp-cancel', text: 'Hủy' })
    ]));
  }

  function applyImport() {
    if (!impPlan) return;
    var plan = impPlan;
    var choices = plan.map(function (p, i) {
      var s = $('imp-body').querySelector('select[data-i="' + i + '"]');
      return s ? s.value : p.macDinh;
    });
    var ap = B.ganKeHoach(plan, choices);
    ap.toPut.reduce(function (pr, r) { return pr.then(function () { return store.put(r); }); }, Promise.resolve()).then(function () {
      var tk = ap.thongKe;
      toast('Đã nhập: thêm ' + (tk.them + tk.themMoi) + ', cập nhật ' + tk.ghiDe + ', bỏ qua ' + tk.boQua + '.');
      $('imp-body').innerHTML = '';
      impPlan = null;
      if (ap.toPut.length) bumpChanges(ap.toPut.length);
      renderData();
    }).catch(function (err) { toast('Không nhập được: ' + (err && err.message ? err.message : 'lỗi không rõ')); });
  }

  function xoaTatCa() {
    store.clear().then(function () {
      S = newState(); ctx = newCtx(); dirty = false;
      backupMeta = { lastBackupAt: null, thayDoi: 0, firstChangeAt: null };
      histCache = []; recCount = 0;
      refreshAll();
      $('xoa-xn').value = ''; $('xoa-btn').disabled = true;
      renderStatus(); renderData(); updateHistCount();
      toast('Đã xóa toàn bộ dữ liệu trên máy này.');
    }).catch(function (err) { toast('Không xóa được: ' + (err && err.message ? err.message : 'lỗi không rõ')); });
  }

  function buildDataShell() {
    dataEl.innerHTML = '';
    dataEl.appendChild(card('Sao lưu toàn bộ', 'Bản sao lưu chứa mọi hồ sơ, phiên bản và nhật ký. Dùng để chuyển sang máy khác hoặc phòng khi trình duyệt xóa dữ liệu. Nên sao lưu sau mỗi đợt chấm.', [
      h('p', { id: 'bk-status', class: 'bk-status', 'aria-live': 'polite' }),
      h('div', { class: 'actions' }, [
        h('button', { type: 'button', class: 'btn primary', 'data-act': 'bk-json', text: 'Tải bản sao lưu (.json)' }),
        h('button', { type: 'button', class: 'btn', 'data-act': 'bk-xlsx', text: 'Tải toàn bộ ra Excel (.xlsx)' })
      ])
    ]));
    dataEl.appendChild(card('Xuất báo cáo', 'Excel có 4 trang tính (tổng hợp, chi tiết điểm, phiên bản, nhật ký) và vẫn nhập lại được. CSV chỉ có bảng tổng hợp, dùng dấu chấm phẩy để Excel tiếng Việt mở đúng cột.', [
      h('fieldset', null, [
        h('legend', { text: 'Phạm vi' }),
        h('label', { class: 'check' }, [h('input', { type: 'radio', name: 'xs', value: 'all', checked: true }), h('span', { id: 'xs-all', text: 'Toàn bộ hồ sơ' })]),
        h('label', { class: 'check' }, [h('input', { type: 'radio', name: 'xs', value: 'filtered' }), h('span', { id: 'xs-fil', text: 'Theo bộ lọc đang chọn ở Lịch sử' })])
      ]),
      h('div', { class: 'actions' }, [
        h('button', { type: 'button', class: 'btn', 'data-act': 'ex-xlsx', text: 'Xuất Excel (.xlsx)' }),
        h('button', { type: 'button', class: 'btn', 'data-act': 'ex-csv', text: 'Xuất CSV' }),
        h('button', { type: 'button', class: 'btn', 'data-act': 'ex-json', text: 'Xuất JSON' })
      ])
    ]));
    var f = h('input', { type: 'file', id: 'imp-file', accept: '.json,.xlsx,application/json' });
    f.addEventListener('change', onFile);
    dataEl.appendChild(card('Nhập và gộp dữ liệu', 'Chọn bản sao lưu (.json) hoặc tệp Excel do chính công cụ này xuất, kể cả của đơn vị khác gửi. Công cụ so với hồ sơ trong máy, báo trùng hoặc xung đột để bạn chọn cách xử lý trước khi áp dụng. Không có gì bị ghi trước khi bạn bấm "Áp dụng nhập".', [
      lbl('Chọn tệp .json hoặc .xlsx', f),
      h('div', { id: 'imp-body' })
    ]));
    var xn = h('input', { type: 'text', id: 'xoa-xn', placeholder: 'Gõ XOA', autocomplete: 'off' });
    var xb = h('button', { type: 'button', class: 'btn danger-solid', id: 'xoa-btn', 'data-act': 'xoa-all', disabled: true, text: 'Xóa toàn bộ dữ liệu' });
    xn.addEventListener('input', function () { xb.disabled = xn.value.trim().toUpperCase() !== 'XOA'; });
    dataEl.appendChild(card('Xóa toàn bộ dữ liệu trên máy này', 'Xóa mọi hồ sơ, phiên bản, nhật ký và nháp trong trình duyệt này. Không khôi phục được; hãy tải bản sao lưu trước.', [
      lbl('Gõ XOA để xác nhận', xn), h('div', { class: 'actions' }, [xb])
    ]));
    dataEl.addEventListener('click', onDataClick);
  }

  function renderData() {
    if (!storeReady) return;
    store.list().then(function (all) {
      recCount = all.length;
      $('xs-all').textContent = 'Toàn bộ hồ sơ (' + all.length + ')';
      $('xs-fil').textContent = 'Theo bộ lọc đang chọn ở Lịch sử (' + HS.filterSort(all, HF).length + ')';
      renderBackupStatus();
      renderStatus();
    });
  }

  function onDataClick(ev) {
    var b = ev.target.closest ? ev.target.closest('button') : null;
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    var scope = (dataEl.querySelector('input[name="xs"]:checked') || {}).value || 'all';
    if (act === 'bk-json') doExport('json', 'all');
    else if (act === 'bk-xlsx') doExport('xlsx', 'all');
    else if (act === 'ex-xlsx') doExport('xlsx', scope);
    else if (act === 'ex-csv') doExport('csv', scope);
    else if (act === 'ex-json') doExport('json', scope);
    else if (act === 'imp-apply') applyImport();
    else if (act === 'imp-cancel') { impPlan = null; $('imp-body').innerHTML = ''; }
    else if (act === 'xoa-all') xoaTatCa();
  }

  /* ---------- In phiếu chấm điểm ---------- */
  function cell(text, cls, attrs) {
    var a = attrs || {};
    if (cls) a['class'] = cls;
    a.text = text === null || text === undefined ? '' : String(text);
    return h('td', a);
  }

  function dungPhieu(input, kq, meta) {
    var tt = input.thongTin || {};
    var root = h('div', { class: 'phieu-in' });
    root.appendChild(h('div', { class: 'ph-head' }, [
      h('div', { class: 'ph-org' }, [h('strong', { text: 'LIÊN ĐOÀN TAEKWONDO VIỆT NAM' }), h('span', { text: 'Kỷ niệm 30 năm thành lập (1996 – 2026)' })]),
      h('div', { class: 'ph-title' }, [h('strong', { text: 'PHIẾU CHẤM ĐIỂM VINH DANH' }), h('span', { text: kq.tenHe })])
    ]));
    root.appendChild(h('p', { class: 'ph-sub', text: 'Theo Bản tiêu chí số ' + R.vanBan.so + ' ngày ' + R.vanBan.ngay + ' · Phiên bản tiêu chí áp dụng: ' + kq.ruleVersion }));

    var pb = meta.version ? String(meta.version) + (meta.locked ? ' (đã chốt)' : '') : 'Chưa lưu';
    root.appendChild(h('h2', { text: 'I. Thông tin chung' }));
    root.appendChild(h('table', { class: 'ph-info' }, [h('tbody', null, [
      h('tr', null, [h('th', { text: 'Họ và tên' }), cell(tt.hoTen || ''), h('th', { text: 'Đơn vị' }), cell(tt.donVi || '')]),
      h('tr', null, [h('th', { text: 'Vai trò chính' }), cell(tt.vaiTroChinh || ''), h('th', { text: 'Người chấm' }), cell(tt.nguoiCham || '')]),
      h('tr', null, [h('th', { text: 'Ngày chấm' }), cell(B.fmtNgay(tt.ngayCham)), h('th', { text: 'Phiên bản hồ sơ' }), cell(pb)]),
      tt.ghiChu ? h('tr', null, [h('th', { text: 'Ghi chú' }), cell(tt.ghiChu, '', { colspan: '3' })]) : null
    ])]));

    root.appendChild(h('h2', { text: 'II. Điều kiện nền' }));
    root.appendChild(h('table', { class: 'ph-tbl' }, [
      h('thead', null, [h('tr', null, [h('th', { text: 'Điều kiện' }), h('th', { class: 'w-kq', text: 'Kết quả' })])]),
      h('tbody', null, kq.dieuKien.map(function (d) { return h('tr', null, [cell(d.nhan + (d.lyDo ? ' (' + d.lyDo + ')' : '')), cell(d.dat ? 'Đạt' : 'Chưa đạt', 'c')]); }))
    ]));

    root.appendChild(h('h2', { text: 'III. Điểm từng trục' }));
    var rows = [];
    kq.truc.forEach(function (t) {
      rows.push(h('tr', { class: 'ph-truc' }, [h('td', { text: t.ten }), cell(t.diem + ' / ' + t.toiDa, 'r')]));
      t.chiTiet.forEach(function (c) {
        rows.push(h('tr', null, [cell((c.nhom ? c.nhom + ': ' : '') + c.nhan + (c.ghiChu ? ' – ' + c.ghiChu : ''), 'sub'), cell(c.tinh ? '+' + c.diem : '0 (không tính)', 'r')]));
      });
      t.ghiChu.forEach(function (g) { rows.push(h('tr', null, [cell(g, 'sub'), cell('')])); });
    });
    root.appendChild(h('table', { class: 'ph-tbl' }, [
      h('thead', null, [h('tr', null, [h('th', { text: 'Nội dung tính' }), h('th', { class: 'w-kq', text: 'Điểm' })])]),
      h('tbody', null, rows)
    ]));

    var hangTxt = kq.duocXet ? kq.hang.ten + (kq.hang.id === 'chua_dat' ? '' : ' (' + kq.hang.tu + '–' + kq.hang.den + ' điểm)') : 'Chưa đủ điều kiện xét';
    root.appendChild(h('p', { class: 'ph-total' }, [h('span', { text: 'TỔNG ĐIỂM: ' }), h('strong', { text: kq.tong + ' / 100' }), h('span', { text: '   ·   Xếp hạng sơ bộ: ' }), h('strong', { text: hangTxt })]));

    /* Dòng tóm tắt "Có N mục không được tính" bị bỏ: danh sách từng mục ngay bên dưới đã đủ. */
    var luuY = kq.canhBao.filter(function (m) { return !/^Có d+ mục không được tính điểm/.test(m); });
    kq.mucBiLoai.forEach(function (m) { luuY.push('Không tính: ' + m.nhan + ' (' + m.lyDo + ')'); });
    if (luuY.length) {
      root.appendChild(h('h2', { text: 'IV. Lưu ý' }));
      root.appendChild(h('ul', { class: 'ph-ul' }, luuY.map(function (m) { return h('li', { text: m }); })));
    }

    var mc = B.danhSachMinhChung(input);
    if (mc.length) {
      root.appendChild(h('h2', { text: (luuY.length ? 'V' : 'IV') + '. Minh chứng đã khai' }));
      root.appendChild(h('table', { class: 'ph-tbl' }, [
        h('thead', null, [h('tr', null, [h('th', { text: 'Nội dung' }), h('th', { class: 'w-so', text: 'Số văn bản / quyết định' }), h('th', { class: 'w-kq', text: 'Minh chứng' })])]),
        h('tbody', null, mc.map(function (m) { return h('tr', null, [cell(m.nhan), cell(m.soVanBan), cell(m.coMinhChung ? 'Có' : 'Chưa có', 'c')]); }))
      ]));
    }

    root.appendChild(h('div', { class: 'ph-sign' }, [
      h('div', null, [h('strong', { text: 'Người chấm điểm' }), h('span', { text: '(ký, ghi rõ họ tên)' })]),
      h('div', null, [h('strong', { text: 'Đại diện Hội đồng' }), h('span', { text: '(ký, ghi rõ họ tên)' })])
    ]));
    root.appendChild(h('p', { class: 'ph-foot', text: 'Chấm điểm sơ bộ theo tiêu chí; hạng cuối cùng do Hội đồng quyết định. Phiếu in lúc ' + B.fmtGio(new Date().toISOString()) + (meta.recordId ? ' · Mã hồ sơ: ' + meta.recordId : '') + '.' }));
    return root;
  }

  /* Đo chiều cao phiếu ở bề rộng vùng in (A4 trừ lề); nếu dài hơn một trang thì thu gọn cỡ chữ theo 2 mức. */
  function chieuCaoMm(pa) {
    var s = pa.style;
    s.display = 'block'; s.position = 'absolute'; s.visibility = 'hidden'; s.left = '-9999px'; s.width = '186mm';
    var mm = pa.scrollHeight / 3.7795;
    s.display = ''; s.position = ''; s.visibility = ''; s.left = ''; s.width = '';
    return mm;
  }
  function vuaMotTrang(pa) {
    var goc = pa.firstChild;
    goc.classList.remove('dense', 'denser');
    if (chieuCaoMm(pa) <= 262) return;
    goc.classList.add('dense');
    if (chieuCaoMm(pa) <= 262) return;
    goc.classList.add('denser');
  }

  function inPhieu(input, kq, meta) {
    var pa = $('print-area');
    pa.innerHTML = '';
    pa.appendChild(dungPhieu(input, kq, meta || {}));
    vuaMotTrang(pa);
    var cu = document.title;
    var slug = HS.chuanHoa((input.thongTin || {}).hoTen || 'ho-so').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ho-so';
    document.title = 'Phieu-cham-diem-' + slug;
    var xong = function () { document.title = cu; window.removeEventListener('afterprint', xong); };
    window.addEventListener('afterprint', xong);
    window.print();
  }

  function inPhieuHienTai() {
    if (!S.he) { toast('Hãy chọn hệ xét và nhập hồ sơ trước khi in phiếu.'); return; }
    var ho = buildHoSo();
    inPhieu(ho, E.evaluate(ho), { version: ctx.recordId ? ctx.version : 0, locked: ctx.locked, recordId: ctx.recordId });
  }

  /* ---------- Sự kiện ---------- */
  function onField(ev) {
    var t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.disabled) return;
    if (t.getAttribute('data-path') || t.getAttribute('data-arr')) { dirty = true; setMsg(''); }
    var arr = t.getAttribute('data-arr');
    if (arr) {
      var list = getPath(S, arr) || [];
      var val = t.getAttribute('data-val');
      var idx = list.indexOf(val);
      if (t.checked && idx < 0) list.push(val);
      if (!t.checked && idx >= 0) list.splice(idx, 1);
      setPath(S, arr, list);
      update();
      return;
    }
    var path = t.getAttribute('data-path');
    if (!path) return;
    var v = t.type === 'checkbox' ? t.checked : t.value;
    setPath(S, path, v);
    if (t.hasAttribute('data-togglewt')) {
      var item = t.closest('.item');
      var extra = item && item.querySelector('.wt-extra');
      if (extra) extra.hidden = v !== 'wt_khac';
    }
    update();
  }

  function onClick(ev) {
    var t = ev.target.closest ? ev.target.closest('button') : null;
    if (!t) return;
    var add = t.getAttribute('data-add');
    var del = t.getAttribute('data-del');
    if (add || del) { dirty = true; setMsg(''); }
    if (add === 'thanhTich') {
      S.thanhTich.push({ giai: 'sea_games', huyChuong: 'HCV', nam: '', soVanBan: '', minhChung: false, tenGiai: '', diemQuyDoi: '', hoiDongXacNhan: false });
      renderListThanhTich(); update();
      var rows = document.querySelectorAll('#list-tt .item');
      var first = rows[rows.length - 1] && rows[rows.length - 1].querySelector('select');
      if (first) first.focus();
    } else if (add === 'vaiTro') {
      if (S.vaiTro.length >= R.heB.truc4.vaiTro.length) return;
      S.vaiTro.push({ id: '', soVanBan: '', minhChung: false });
      renderListVaiTro(); update();
      var rv = document.querySelectorAll('#list-vt .item');
      var fv = rv[rv.length - 1] && rv[rv.length - 1].querySelector('select');
      if (fv) fv.focus();
    } else if (del) {
      var i = Number(t.getAttribute('data-i'));
      S[del].splice(i, 1);
      if (del === 'thanhTich') renderListThanhTich(); else renderListVaiTro();
      update();
      var addBtn = document.querySelector('[data-add="' + del + '"]');
      if (addBtn) addBtn.focus();
    } else if (t.hasAttribute('data-reset')) {
      newRecord();
    }
  }

  function onHe(ev) {
    var t = ev.target;
    if (!t || t.name !== 'he') return;
    S.he = t.value;
    dirty = true;
    workEl.hidden = false;
    renderForm();
    update();
  }

  function onSaveBoxClick(ev) {
    var b = ev.target.closest ? ev.target.closest('button') : null;
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'save') doSave();
    else if (act === 'new') newRecord();
    else if (act === 'editview') editFromView();
    else if (act === 'print') inPhieuHienTai();
    else if (act === 'gui-mo') { GUI.open = true; renderSaveBox(); }
    else if (act === 'gui-dong') { GUI.open = false; GUI.msg = ''; renderSaveBox(); }
    else if (act === 'gui-lai') { GUI.daGui = null; GUI.open = true; GUI.msg = ''; renderSaveBox(); }
    else if (act === 'gui-gui') doGui();
    else if (act === 'unlock') {
      unlockRecord(ctx.recordId, function () { ctx.locked = false; renderSaveBox(); });
    }
  }

  function restoreDraft(d) {
    S = Object.assign(newState(), d.S);
    ctx = Object.assign(newCtx(), d.ctx);
    if (ctx.mode === 'view') ctx.mode = 'edit';
    dirty = true;
    draftRestoring = true;
    refreshAll();
    draftRestoring = false;
  }

  function init() {
    form = $('form'); heBox = $('he-chooser');
    workEl = $('work'); totalbar = $('totalbar'); tbScore = $('tb-score');
    toastEl = $('toast'); statusEl = $('status'); histEl = $('view-history'); dataEl = $('view-data'); rulesEl = $('view-rules'); tabsEl = document.querySelector('.tabs');
    $('guide').addEventListener('click', onGuideClick);
    $('tab-guide').addEventListener('click', function () { showView('calc'); renderGuide(true); window.scrollTo(0, 0); });
    var off = $('offline-link');
    if (/^https?:$/.test(window.location.protocol)) {
      off.href = window.location.pathname; off.hidden = false;
      /* Tải qua Blob để tên tệp luôn là VTF-Tinh-diem.html: máy chủ Vercel gửi "Content-Disposition: filename=tinh-diem" (không có đuôi .html) và header này thắng thuộc tính download. */
      off.addEventListener('click', function (ev) {
        ev.preventDefault();
        fetch(window.location.pathname, { cache: 'no-store' }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        }).then(function (t) {
          download('VTF-Tinh-diem.html', 'text/html;charset=utf-8', t);
          toast('Đã tạo tệp VTF-Tinh-diem.html. Mở bằng cách bấm đúp, không cần mạng.');
        }).catch(function () { toast('Không tải được tệp. Hãy kiểm tra mạng rồi thử lại.'); });
      });
    }
    statusEl.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('button') : null;
      if (b && b.getAttribute('data-act') === 'bk-json') doExport('json', 'all');
    });
    window.addEventListener('beforeunload', function (ev) {
      if (B.trangThaiSaoLuu(backupMeta, recCount).canNhac) { ev.preventDefault(); ev.returnValue = ''; }
    });
    var aside = $('result');
    saveBox = h('div', { id: 'save-box' });
    resultEl = h('div', { id: 'res-body' });
    aside.appendChild(saveBox);
    aside.appendChild(resultEl);

    renderChooser();
    heBox.addEventListener('change', onHe);
    form.addEventListener('input', onField);
    form.addEventListener('change', onField);
    form.addEventListener('click', onClick);
    saveBox.addEventListener('click', onSaveBoxClick);
    tabsEl.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('.tab') : null;
      if (b && b.getAttribute('data-view')) showView(b.getAttribute('data-view'));
    });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushDraft(); });
    window.addEventListener('pagehide', flushDraft);
    buildHistoryShell();
    buildDataShell();
    renderResult(null);
    renderSaveBox();

    store = window.VTF_STORE_API.createStore({ indexedDB: window.indexedDB, localStorage: safeLocalStorage(), navigator: window.navigator });
    store.init().then(function (info) {
      storeReady = true;
      storeInfo = info;
      return store.getMeta('backup').then(function (m) {
        if (m && typeof m === 'object') backupMeta = { lastBackupAt: m.lastBackupAt || null, thayDoi: m.thayDoi || 0, firstChangeAt: m.firstChangeAt || null };
        return store.getMeta('guide');
      }).then(function (g) {
        guideHidden = !!(g && g.hidden);
        return store.getDraft();
      }).then(function (draft) {
        var khoiPhuc = !!(draft && draft.S && draft.S.he);
        if (khoiPhuc) { restoreDraft(draft); guideHidden = true; }
        renderGuide();
        showDraftNote = khoiPhuc;
        renderStatus();
        updateHistCount();
      });
    }).catch(function () {
      renderGuide();
      statusEl.appendChild(h('p', { class: 'status-warn', text: 'Không khởi tạo được nơi lưu dữ liệu. Hồ sơ sẽ không được lưu.' }));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
