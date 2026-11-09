// Kiểm tra, chuẩn hóa hồ sơ do trình duyệt gửi lên và tính lại điểm ở máy chủ.
// Không tin dữ liệu từ trình duyệt: mọi trường đều được kiểm tra lại, nhãn hạng mục do máy chủ đặt,
// điểm do máy chủ tự tính lại từ các lựa chọn (cùng công thức với máy tính nhanh trên trang).
import { kiemTraDauVao, tinhDiem } from '../../src/lib/diem036.js';

export const LOAI_HO_SO = {
  nomination_a: { nhom: 'Hệ A', nhan: 'Đề cử Hệ A – Thành tích Đỉnh cao (036/VTF)' },
  nomination_b: { nhom: 'Hệ B', nhan: 'Đề cử Hệ B – Cống hiến Di sản Phong trào (036/VTF)' },
  yearbook_34_provinces: { nhom: 'Khác', nhan: 'Gửi Bài viết & Ảnh Kỷ yếu 34 Tỉnh/Thành (CV 128/VTF-VP)' },
  gala_registration: { nhom: 'Khác', nhan: 'Đăng ký Đại biểu tham dự Đêm Gala 19/12/2026' },
  gold_yearbook_bid: { nhom: 'Khác', nhan: 'Đặt mua / Đấu giá Kỷ yếu Bản Vàng (Quỹ Ngọn lửa Olympic)' },
};

const GIOI_HAN = { hoTen: [3, 120], email: 120, donVi: [1, 200], tomTat: [15, 4000], link: 500, chuThich: 600 };

/** Cắt chuỗi, bỏ ký tự điều khiển (giữ xuống dòng và tab), gọn khoảng trắng hai đầu. */
export function catChuoi(v, toiDa) {
  const s = v === null || v === undefined ? '' : String(v);
  const sach = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').trim();
  return sach.length > toiDa ? sach.slice(0, toiDa) : sach;
}

/** Số điện thoại Việt Nam: bỏ dấu cách, chấm, gạch, ngoặc; đổi +84 thành 0; trả về null nếu không hợp lệ. */
export function chuanSdt(v) {
  let s = catChuoi(v, 30).replace(/[\s.\-()]/g, '');
  if (/^\+84[0-9]{8,10}$/.test(s)) s = '0' + s.slice(3);
  return /^0[0-9]{8,10}$/.test(s) ? s : null;
}

const laSo = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Trả về { ok: true, banGhi } để gửi sang Google Sheet, hoặc { ok: false, loi: [thông báo tiếng Việt] }.
 * `taoMa` sinh mã yêu cầu khi trình duyệt cũ không gửi kèm (để mỗi hồ sơ vẫn có mã).
 */
export function chuanHoaHoSo(body, taoMa) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, loi: ['Dữ liệu gửi lên không hợp lệ.'] };
  const loi = [];
  if (typeof body.ghi_chu_noi_bo_vtf === 'string' && body.ghi_chu_noi_bo_vtf !== '') return { ok: false, loi: ['Yêu cầu không hợp lệ.'], spam: true };

  const loaiKhoa = typeof body.submissionType === 'string' && Object.prototype.hasOwnProperty.call(LOAI_HO_SO, body.submissionType) ? body.submissionType : null;
  if (!loaiKhoa) loi.push('Hạng mục hồ sơ không hợp lệ.');
  const loai = loaiKhoa ? LOAI_HO_SO[loaiKhoa] : null;

  const hoTen = catChuoi(body.fullName, GIOI_HAN.hoTen[1]);
  if (hoTen.length < GIOI_HAN.hoTen[0]) loi.push('Vui lòng nhập đầy đủ Họ và Tên (tối thiểu 3 ký tự).');
  const sdt = chuanSdt(body.phone);
  if (!sdt) loi.push('Số điện thoại chưa đúng chuẩn Việt Nam (10 số bắt đầu bằng 0 hoặc +84).');
  const email = catChuoi(body.email, GIOI_HAN.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) loi.push('Địa chỉ Email chưa hợp lệ.');
  const donVi = catChuoi(body.organization, GIOI_HAN.donVi[1]);
  if (donVi.length < GIOI_HAN.donVi[0]) loi.push('Vui lòng ghi rõ đơn vị.');
  const tomTat = catChuoi(body.messageOrAchievement, GIOI_HAN.tomTat[1]);
  if (tomTat.length < GIOI_HAN.tomTat[0]) loi.push('Vui lòng tóm tắt thành tích hoặc nội dung đăng ký (tối thiểu 15 ký tự).');
  const link = catChuoi(body.photoAlbumUrl, GIOI_HAN.link);
  if (link && !/^https?:\/\/\S+$/i.test(link)) loi.push('Link thư mục ảnh phải bắt đầu bằng http:// hoặc https://.');
  if (body.consentAccepted !== true) loi.push('Vui lòng xác nhận đồng ý cung cấp thông tin.');

  let soNam = Number(body.yearsContributed);
  if (!Number.isFinite(soNam) || soNam === 0) soNam = 5; // giống mặc định của biểu mẫu
  soNam = Math.round(soNam);
  if (soNam < 0 || soNam > 80) loi.push('Số năm hoạt động không hợp lệ.');

  let requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
  if (requestId && !/^[A-Za-z0-9][A-Za-z0-9_-]{15,79}$/.test(requestId)) loi.push('Mã yêu cầu không hợp lệ.');
  if (!requestId) requestId = taoMa();

  if (loi.length) return { ok: false, loi };

  // ---- điểm: chỉ cho hồ sơ đề cử Hệ A, Hệ B
  const banGhi = {
    requestId, fullName: hoTen, phone: sdt, email, organization: donVi, submissionType: loaiKhoa, submissionTypeLabel: loai.nhan,
    yearsContributed: soNam, message: tomTat, photoAlbumUrl: link, photoCaptions: catChuoi(body.photoCaptions, GIOI_HAN.chuThich), consent: true,
    scoreClaimed: null, scoreServer: null, scoreAxes: null, scoreDetail: null, scoreCheck: '',
  };
  if (loai.nhom !== 'Khác') {
    const tuCham = laSo(body.estimatedScore) && body.estimatedScore >= 0 && body.estimatedScore <= 100 ? body.estimatedScore : null;
    const heCuaLoai = loai.nhom === 'Hệ A' ? 'A' : 'B';
    if (body.scoreDetail === undefined || body.scoreDetail === null) {
      banGhi.scoreClaimed = tuCham;
      banGhi.scoreCheck = 'Không có chi tiết';
    } else {
      const kt = kiemTraDauVao(body.scoreDetail);
      if (!kt.ok) {
        banGhi.scoreClaimed = tuCham;
        banGhi.scoreCheck = 'Chi tiết không hợp lệ';
      } else if (kt.giaTri.he !== heCuaLoai) {
        banGhi.scoreCheck = 'Sai hệ'; // điểm chấm theo hệ khác hạng mục đã chọn: không ghi điểm
        banGhi.scoreDetail = kt.giaTri;
      } else {
        const kq = tinhDiem(kt.giaTri);
        banGhi.scoreClaimed = tuCham;
        banGhi.scoreServer = kq.tong;
        banGhi.scoreAxes = kq.truc;
        banGhi.scoreDetail = kt.giaTri;
        banGhi.scoreCheck = tuCham === null || tuCham === kq.tong ? 'Khớp' : 'LỆCH';
      }
    }
  }
  return { ok: true, banGhi };
}
