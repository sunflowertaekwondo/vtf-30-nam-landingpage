/* Bộ quy tắc: Bản tiêu chí số 036/VTF ngày 04/04/2026 (Liên đoàn Taekwondo Việt Nam).
 * Nguồn duy nhất cho thang điểm. Giao diện, bảng tiêu chí và bộ kiểm thử đều đọc từ đây.
 * Chạy được trong trình duyệt (script thường, gán globalThis.VTF_RULES) và trong Node (require).
 * Không sửa số liệu ở nơi khác. Đổi tiêu chí => đổi `version` và thêm bộ kiểm thử mới. */
(function (root) {
  'use strict';

  var RULES = {
    version: '036/VTF-2026-04-04',
    vanBan: {
      so: '036/VTF',
      ngay: '04/04/2026',
      ten: 'Bản tiêu chí đánh giá, xét khen thưởng và vinh danh cán bộ, huấn luyện viên, võ sinh đóng góp cho phong trào Taekwondo Việt Nam (1996 – 2026)',
      thongBao: '038/TB-VTF ngày 06/04/2026'
    },

    /* Tầng 1: điều kiện nền (bắt buộc, cả hai hệ) */
    nen: {
      soNamToiThieu: 5,
      vaiTroNen: [
        { id: 'bch', ten: 'Ban chấp hành (tỉnh/thành/quốc gia)' },
        { id: 'hdkt', ten: 'Hội đồng kỹ thuật' },
        { id: 'trong_tai', ten: 'Trọng tài' },
        { id: 'hlv', ten: 'Huấn luyện viên' },
        { id: 'vdv_doi_tuyen', ten: 'Vận động viên đội tuyển tỉnh/thành, ngành' },
        { id: 'hlv_phong_trao', ten: 'Huấn luyện viên xây dựng phong trào CLB/võ đường' }
      ]
    },

    /* Hạng vinh danh. Xếp theo điểm; hạng cuối cùng do Hội đồng quyết định. */
    hang: [
      { id: 'dac_biet', ten: 'Hạng Đặc biệt', tu: 90, den: 100 },
      { id: 'xuat_sac', ten: 'Hạng Xuất sắc', tu: 75, den: 89 },
      { id: 'tieu_bieu', ten: 'Hạng Tiêu biểu', tu: 60, den: 74 },
      { id: 'ghi_nhan', ten: 'Hạng Ghi nhận', tu: 50, den: 59 }
    ],
    hangDuoiNguong: { id: 'chua_dat', ten: 'Chưa đạt mức xét (dưới 50 điểm)' },

    /* Nguyên văn tinh thần các quy tắc của 036/VTF (mục IV, V, VIII, IX), dùng cho trang Bảng tiêu chí. */
    quyTac: [
      'Không so sánh chéo nhánh: mỗi hệ có bảng vinh danh riêng; người có huy chương quốc tế không bị so sánh trực tiếp với người chỉ làm phong trào.',
      'Không tuyệt đối hóa thâm niên: 30 năm không tự động được vinh danh ở hạng cao.',
      'Không tuyệt đối hóa huy chương: có 01 HCV SEA Games nhưng không có đóng góp hệ thống thì không thể xếp hạng cao nhất.',
      'Bắt buộc có xác minh: không tính thông tin truyền miệng; phải có hồ sơ, quyết định, minh chứng.'
    ],
    quyTrinh: [
      'Cấp cơ sở (CLB/đơn vị): lập danh sách, kiểm tra hồ sơ, đối chiếu minh chứng và chấm điểm sơ bộ.',
      'Cấp tỉnh/thành: Hội đồng chuyên môn thẩm định, rà soát điểm và lập danh sách đề xuất kèm biên bản.',
      'Cấp Liên đoàn quốc gia: Hội đồng chấm điểm độc lập, đối chiếu, thảo luận và bỏ phiếu; được công nhận khi đạt tối thiểu 70% số phiếu đồng ý. Thành viên có quan hệ trực tiếp với ứng viên không tham gia chấm điểm trường hợp đó.'
    ],
    /* Cách công cụ hiểu những chỗ 036/VTF chưa nói rõ (đã thống nhất ngày 07/11/2026). */
    quyUoc: [
      'Mỗi nhóm có ghi "tối đa N điểm" chỉ lấy MỘT mức cao nhất; các nhóm trong cùng trục được cộng với nhau.',
      'Hệ A, Trục 2: đếm số huy chương quốc tế (từ cấp SEA Games trở lên) NGOÀI huy chương đã dùng ở Trục 1, tức là tổng số huy chương trừ 1.',
      'Điều kiện Hệ A: có HCV SEA Games, hoặc huy chương bất kỳ ở cấp Châu Á, ASIAD, Thế giới, Olympic; các trường hợp khác cần Hội đồng xác nhận "tương đương".',
      'Giải thuộc hệ thống WT khác (Grand Prix, World Cup…): Hội đồng quy đổi điểm, tối đa 45, và phải được đánh dấu đã xác nhận mới được tính.',
      'Mục chưa có minh chứng KHÔNG được tính điểm. Thành tích quốc tế phải có năm đạt được; nhập trùng cùng giải, huy chương, năm thì chỉ tính một lần.',
      'Hệ B, Trục 4: chỉ tính tối đa 02 vai trò có điểm cao nhất rồi cắt trần 20 điểm; vai trò thiếu quyết định bổ nhiệm bị loại và không chiếm suất.',
      'Hạng chỉ xếp theo điểm. Quy tắc "không tuyệt đối hóa huy chương" chỉ hiện cảnh báo, công cụ không tự hạ hạng. Hạng cuối cùng do Hội đồng quyết định.'
    ],

    /* ===== HỆ A: Thành tích đỉnh cao (tổng 100 = 50 + 20 + 15 + 15) ===== */
    heA: {
      ten: 'Hệ A – Thành tích đỉnh cao',
      toiDa: { truc1: 50, truc2: 20, truc3: 15, truc4: 15 },
      /* Trục 1: chỉ lấy 01 thành tích cao nhất. Thứ tự mảng = cấp từ cao xuống thấp (dùng để phân thắng bại khi bằng điểm). */
      giai: [
        { id: 'olympic', ten: 'Olympic', diem: { HCV: 50, HCB: 45, HCD: 40 } },
        { id: 'asiad', ten: 'ASIAD', diem: { HCV: 45, HCB: 40, HCD: 35 } },
        { id: 'the_gioi', ten: 'Giải Vô địch Thế giới', diem: { HCV: 45, HCB: 40, HCD: 35 } },
        { id: 'chau_a', ten: 'Giải Vô địch Châu Á', diem: { HCV: 40, HCB: 35, HCD: 30 } },
        { id: 'sea_games', ten: 'SEA Games', diem: { HCV: 35, HCB: 30, HCD: 25 } }
      ],
      huyChuong: [
        { id: 'HCV', ten: 'Huy chương Vàng' },
        { id: 'HCB', ten: 'Huy chương Bạc' },
        { id: 'HCD', ten: 'Huy chương Đồng' }
      ],
      /* Giải thuộc hệ thống chính thức WT khác (Grand Prix, World Cup…): Hội đồng quy đổi, không vượt khung Vô địch Thế giới. */
      wtKhac: { id: 'wt_khac', ten: 'Giải WT chính thức khác (Grand Prix, World Cup…), do Hội đồng quy đổi', tran: 45 },
      /* Trục 2: số huy chương quốc tế (từ SEA Games trở lên), KHÔNG tính huy chương đã dùng ở Trục 1. */
      truc2: [
        { tu: 3, diem: 20, nhan: 'Từ 03 huy chương quốc tế trở lên' },
        { tu: 2, diem: 15, nhan: '02 huy chương quốc tế' },
        { tu: 1, diem: 10, nhan: '01 huy chương quốc tế' }
      ],
      /* Trục 3: thời gian cống hiến (năm). */
      truc3: [
        { tu: 15, diem: 15, nhan: 'Từ 15 năm trở lên' },
        { tu: 10, diem: 10, nhan: 'Từ 10 đến dưới 15 năm' },
        { tu: 5, diem: 5, nhan: 'Từ 05 đến dưới 10 năm' }
      ],
      /* Trục 4: mỗi nhóm lấy MỘT mức cao nhất. */
      truc4: {
        daoTao: {
          ten: 'Đào tạo và phát triển lực lượng', toiDa: 10,
          muc: [
            { id: 'vdv_quoc_te', diem: 10, nhan: 'Đào tạo VĐV đạt huy chương quốc tế' },
            { id: 'vdv_doi_tuyen_qg', diem: 7, nhan: 'Đào tạo VĐV tham gia đội tuyển quốc gia' },
            { id: 'vdv_hc_quoc_gia', diem: 5, nhan: 'Đào tạo VĐV đạt huy chương quốc gia trở lên' }
          ]
        },
        chuyenMon: {
          ten: 'Tham gia công tác chuyên môn, quản lý', toiDa: 5,
          muc: [
            { id: 'doi_tuyen_qg', diem: 5, nhan: 'Tham gia đội tuyển quốc gia hoặc hệ thống chuyên môn cấp quốc gia' },
            { id: 'cap_tinh', diem: 3, nhan: 'Tham gia công tác huấn luyện/đào tạo cấp tỉnh/thành' }
          ]
        }
      }
    },

    /* ===== HỆ B: Cống hiến – di sản phong trào (tổng 100 = 30 + 30 + 20 + 20) ===== */
    heB: {
      ten: 'Hệ B – Cống hiến, di sản phong trào',
      toiDa: { truc1: 30, truc2: 30, truc3: 20, truc4: 20 },
      soNamToiThieu: 5,
      dauAn: [
        { id: 'xay_dung_phong_trao', ten: 'Xây dựng phong trào lớn tại địa phương' },
        { id: 'dao_tao_nhieu_the_he', ten: 'Đào tạo nhiều thế hệ HLV/VĐV' },
        { id: 'duy_tri_giai_doan_kho', ten: 'Giữ vai trò tổ chức, duy trì hệ thống qua giai đoạn khó khăn' },
        { id: 'xay_dung_chuyen_mon', ten: 'Góp phần xây dựng hệ thống chuyên môn' }
      ],
      truc1: [
        { tu: 30, diem: 30, nhan: 'Từ 30 năm trở lên' },
        { tu: 20, diem: 25, nhan: 'Từ 20 đến dưới 30 năm' },
        { tu: 10, diem: 15, nhan: 'Từ 10 đến dưới 20 năm' },
        { tu: 5, diem: 10, nhan: 'Từ 05 đến dưới 10 năm' }
      ],
      truc2: {
        clb: {
          ten: 'Xây dựng và phát triển câu lạc bộ', toiDa: 20,
          muc: [
            { id: 'clb_100', diem: 20, nhan: 'Thành lập và duy trì CLB từ 100 võ sinh, hoạt động ổn định từ 05 năm' },
            { id: 'clb_50', diem: 15, nhan: 'Thành lập và duy trì CLB 50–99 võ sinh, hoạt động từ 05 năm' },
            { id: 'clb_nho', diem: 10, nhan: 'Duy trì CLB ổn định từ 05 năm (quy mô nhỏ hơn)' }
          ]
        },
        heThong: {
          ten: 'Phát triển hệ thống cấp địa phương/quốc gia', toiDa: 10,
          muc: [
            { id: 'xay_dung_tinh', diem: 10, nhan: 'Tham gia xây dựng, mở rộng hệ thống Taekwondo cấp tỉnh/thành' },
            { id: 'duy_tri_10nam', diem: 7, nhan: 'Duy trì và phát triển phong trào ổn định tại địa phương từ 10 năm' },
            { id: 'ho_tro_chuyen_mon', diem: 5, nhan: 'Đóng góp hỗ trợ hoạt động hệ thống chuyên môn' }
          ]
        }
      },
      truc3: {
        vdv: {
          ten: 'Đào tạo vận động viên', toiDa: 10,
          muc: [
            { id: 'vdv_quoc_te', diem: 10, nhan: 'Đào tạo từ 01 VĐV đạt huy chương quốc tế' },
            { id: 'vdv_dtqg_3', diem: 8, nhan: 'Đào tạo từ 03 VĐV cấp đội tuyển quốc gia' },
            { id: 'vdv_tinh_5', diem: 5, nhan: 'Đào tạo từ 05 VĐV cấp tỉnh/thành' }
          ]
        },
        hlv: {
          ten: 'Đào tạo huấn luyện viên, trọng tài', toiDa: 10,
          muc: [
            { id: 'hlv_10', diem: 10, nhan: 'Đào tạo từ 10 HLV hoặc trọng tài hoạt động trong hệ thống' },
            { id: 'hlv_5_9', diem: 7, nhan: 'Đào tạo 05–09 HLV hoặc trọng tài' },
            { id: 'giang_day', diem: 5, nhan: 'Tham gia giảng dạy, tập huấn chuyên môn' }
          ]
        }
      },
      /* Trục 4: chỉ tính tối đa 02 vai trò có điểm cao nhất, tổng trần 20; cần quyết định bổ nhiệm hoặc xác nhận chính thức. */
      truc4: {
        toiDaVaiTro: 2,
        vaiTro: [
          { id: 'ubch_qg', diem: 20, nhan: 'Ủy viên Ban Chấp hành Liên đoàn quốc gia' },
          { id: 'ubch_tinh', diem: 15, nhan: 'Ủy viên Ban Chấp hành cấp tỉnh/thành' },
          { id: 'hdkt_qg', diem: 15, nhan: 'Thành viên Hội đồng kỹ thuật, ban chuyên môn quốc gia' },
          { id: 'tt_quoc_te', diem: 15, nhan: 'Trọng tài quốc tế' },
          { id: 'hlv_truong_tinh', diem: 10, nhan: 'Huấn luyện viên trưởng cấp tỉnh/thành' },
          { id: 'hlv_phong_trao', diem: 5, nhan: 'Huấn luyện viên phong trào' }
        ]
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = RULES;
  root.VTF_RULES = RULES;
})(typeof globalThis !== 'undefined' ? globalThis : this);
