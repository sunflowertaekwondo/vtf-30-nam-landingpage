// Tính điểm sơ bộ theo Bản tiêu chí 036/VTF (máy tính nhanh trên trang chủ).
// Đây là NGUỒN DUY NHẤT của công thức: trình duyệt (src/components/InteractiveBoosters.tsx) và máy chủ nhận hồ sơ
// (api/submit-nomination.js) cùng dùng tệp này, nên điểm máy chủ tính lại luôn khớp điểm người dùng thấy.
// Không phụ thuộc thư viện nào, chạy được cả trong trình duyệt và Node.
// Lưu ý: đây là điểm tự chấm sơ bộ (chưa kiểm điều kiện nền và minh chứng). Điểm chính thức do Hội đồng quyết định.

/** Các giá trị hợp lệ của từng ô chọn trong máy tính nhanh (đúng như danh sách lựa chọn trên trang). */
export const LUA_CHON = {
  A: {
    medal: [50, 45, 40, 35, 30],
    accumulated: [20, 15, 10, 0],
    training: [10, 7, 5, 0],
    management: [5, 3, 0],
  },
  B: {
    club: [20, 15, 10, 0],
    system: [10, 7, 5],
    athletes: [10, 8, 5, 0],
    coaches: [10, 7, 5],
    role1: [20, 15, 10, 5],
    role2: [15, 10, 5, 0],
  },
};

/** Khoảng số năm cho phép (thanh trượt trên trang: A 5-35, B 5-50; máy chủ cho rộng hơn một chút). */
export const SO_NAM = { min: 0, max: 80 };

export const HANG = {
  'dac-biet': { ma: 'dac-biet', tieuDe: 'HẠNG ĐẶC BIỆT (90 – 100 điểm)', ngan: 'Đặc biệt', tu: 90 },
  'xuat-sac': { ma: 'xuat-sac', tieuDe: 'HẠNG XUẤT SẮC (75 – 89 điểm)', ngan: 'Xuất sắc', tu: 75 },
  'tieu-bieu': { ma: 'tieu-bieu', tieuDe: 'HẠNG TIÊU BIỂU (60 – 74 điểm)', ngan: 'Tiêu biểu', tu: 60 },
  'ghi-nhan': { ma: 'ghi-nhan', tieuDe: 'HẠNG GHI NHẬN (50 – 59 điểm)', ngan: 'Ghi nhận', tu: 50 },
  'chua-dat': { ma: 'chua-dat', tieuDe: 'CHƯA ĐẠT NGƯỠNG XÉT DUYỆT (< 50 điểm)', ngan: 'Chưa đạt ngưỡng', tu: 0 },
};

/** Hạng theo tổng điểm: >= 90 Đặc biệt, >= 75 Xuất sắc, >= 60 Tiêu biểu, >= 50 Ghi nhận, còn lại chưa đạt. */
export function hangTheoDiem(diem) {
  const d = Number(diem);
  if (d >= 90) return HANG['dac-biet'];
  if (d >= 75) return HANG['xuat-sac'];
  if (d >= 60) return HANG['tieu-bieu'];
  if (d >= 50) return HANG['ghi-nhan'];
  return HANG['chua-dat'];
}

/**
 * Tính điểm. Đầu vào đã hợp lệ (xem kiemTraDauVao). Trả về điểm 4 trục và tổng.
 * Hệ A: Trục 1 = mức thành tích cao nhất; Trục 2 = tích lũy; Trục 3 = số năm (>=15: 15, >=10: 10, còn lại 5);
 *       Trục 4 = đào tạo + quản lý, tối đa 15.
 * Hệ B: Trục 1 = số năm cộng dồn (>=30: 30, >=20: 25, >=10: 15, còn lại 10); Trục 2 = CLB + hệ thống, tối đa 30;
 *       Trục 3 = đào tạo VĐV + HLV, tối đa 20; Trục 4 = vai trò 1 + vai trò 2, tối đa 20.
 */
export function tinhDiem(dauVao) {
  if (dauVao.he === 'A') {
    const t1 = dauVao.medal;
    const t2 = dauVao.accumulated;
    const t3 = dauVao.years >= 15 ? 15 : dauVao.years >= 10 ? 10 : 5;
    const t4 = Math.min(15, dauVao.training + dauVao.management);
    const tong = Math.min(100, t1 + t2 + t3 + t4);
    return { he: 'A', truc: [t1, t2, t3, t4], tong, hang: hangTheoDiem(tong) };
  }
  const t1 = dauVao.years >= 30 ? 30 : dauVao.years >= 20 ? 25 : dauVao.years >= 10 ? 15 : 10;
  const t2 = Math.min(30, dauVao.club + dauVao.system);
  const t3 = Math.min(20, dauVao.athletes + dauVao.coaches);
  const t4 = Math.min(20, dauVao.role1 + dauVao.role2);
  const tong = Math.min(100, t1 + t2 + t3 + t4);
  return { he: 'B', truc: [t1, t2, t3, t4], tong, hang: hangTheoDiem(tong) };
}

const laSoNguyen = (v) => typeof v === 'number' && Number.isInteger(v);

/**
 * Kiểm tra đầu vào do máy khách gửi lên (không tin dữ liệu từ trình duyệt).
 * Trả về { ok: true, giaTri } với giaTri là bản chuẩn hóa (chỉ giữ các khóa đã biết),
 * hoặc { ok: false, loi: [thông báo tiếng Việt] }.
 */
export function kiemTraDauVao(raw) {
  const loi = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, loi: ['Thiếu chi tiết chấm điểm.'] };
  const he = raw.he;
  if (he !== 'A' && he !== 'B') return { ok: false, loi: ['Hệ chấm điểm phải là A hoặc B.'] };
  const out = { he };
  const cho = (khoa, tap) => {
    if (!laSoNguyen(raw[khoa]) || !tap.includes(raw[khoa])) loi.push(`Giá trị "${khoa}" không nằm trong các lựa chọn của máy tính điểm.`);
    else out[khoa] = raw[khoa];
  };
  if (!laSoNguyen(raw.years) || raw.years < SO_NAM.min || raw.years > SO_NAM.max) loi.push('Số năm không hợp lệ.');
  else out.years = raw.years;
  for (const [khoa, tap] of Object.entries(LUA_CHON[he])) cho(khoa, tap);
  return loi.length ? { ok: false, loi } : { ok: true, giaTri: out };
}
