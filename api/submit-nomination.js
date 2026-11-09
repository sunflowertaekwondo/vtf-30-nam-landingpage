// Vercel Serverless Function: POST /api/submit-nomination
// Nhận hồ sơ đề cử và đăng ký của VTF 30 năm (038/TB-VTF, CV 128/VTF-VP) và GHI VÀO GOOGLE SHEET RIÊNG TƯ qua Apps Script.
//
// Nguyên tắc:
//  - Chỉ trả "thành công" khi Google Sheet đã xác nhận ghi xong (không còn "thành công giả" khi chưa lưu).
//  - Không còn đường đọc công khai: GET trả 405, không có danh sách hồ sơ nào được trả về cho trình duyệt.
//  - Dữ liệu cá nhân không được ghi vào nhật ký của máy chủ.
//  - Biến môi trường VTF_GOOGLE_SHEET_WEBHOOK (địa chỉ /exec của Apps Script) là bí mật, chỉ đặt trên Vercel.
import crypto from 'node:crypto';
import { chuanHoaHoSo } from './_lib/ho-so.js';

const TOI_DA_MOI_IP = 8;           // số hồ sơ tối đa mỗi IP trong cửa sổ bên dưới (mức best-effort theo từng máy chủ)
const CUA_SO_MS = 10 * 60 * 1000;  // 10 phút
const HAN_GOI_SHEET_MS = 20000;
const THONG_BAO = {
  luu_that_bai: 'Hệ thống chưa lưu được hồ sơ của anh/chị. Thông tin đã nhập vẫn còn trên màn hình, anh/chị vui lòng bấm gửi lại sau ít phút. Nếu vẫn lỗi, xin liên hệ Văn phòng VTF qua Zalo/điện thoại 0909 576 776.',
  chua_cau_hinh: 'Cổng tiếp nhận đang được bảo trì. Anh/chị vui lòng quay lại sau hoặc liên hệ Văn phòng VTF qua Zalo/điện thoại 0909 576 776.',
  qua_nhieu: 'Anh/chị gửi quá nhiều lần trong thời gian ngắn. Vui lòng đợi vài phút rồi gửi lại.',
  khong_hop_le: 'Thông tin hồ sơ chưa hợp lệ. Vui lòng kiểm tra lại.',
  phuong_thuc: 'Phương thức không được hỗ trợ.',
};

const demIp = new Map();
function vuotGioiHanIp(ip, bay) {
  const mang = (demIp.get(ip) || []).filter((t) => bay - t < CUA_SO_MS);
  if (mang.length >= TOI_DA_MOI_IP) { demIp.set(ip, mang); return true; }
  mang.push(bay);
  demIp.set(ip, mang);
  if (demIp.size > 5000) for (const [k, v] of demIp) if (!v.length || bay - v[v.length - 1] > CUA_SO_MS) demIp.delete(k);
  return false;
}

/** Địa chỉ /exec của Apps Script: chỉ chấp nhận https://script.google.com/macros/s/.../exec (chống đặt nhầm biến môi trường). */
export function diaChiHopLe(url) {
  return typeof url === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(url.trim());
}

async function goiSheet({ url, banGhi, fetchFn }) {
  const gui = async () => {
    const dk = new AbortController();
    const hen = setTimeout(() => dk.abort(), HAN_GOI_SHEET_MS);
    try {
      const res = await fetchFn(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', record: banGhi }), redirect: 'follow', signal: dk.signal });
      const chu = await res.text();
      let kq = null;
      try { kq = JSON.parse(chu); } catch { /* Google trả trang lỗi HTML */ }
      return { http: res.status, kq };
    } finally { clearTimeout(hen); }
  };
  const batDau = Date.now();
  let lan1;
  try { lan1 = await gui(); } catch (e) { lan1 = { loiMang: String(e && e.name || e) }; }
  const thatBai = (r) => r.loiMang || !r.kq || (r.kq.ok !== true && (r.kq.thuLai || r.http >= 500));
  // thử lại một lần nếu lỗi mạng/tạm thời và còn thời gian (mã yêu cầu bảo đảm không ghi trùng)
  if (thatBai(lan1) && Date.now() - batDau < 8000) {
    await new Promise((r) => setTimeout(r, 800));
    try { return await gui(); } catch (e) { return { loiMang: String(e && e.name || e) }; }
  }
  return lan1;
}

export function createHandler({ env = process.env, fetchFn = (...a) => fetch(...a), now = () => Date.now() } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.setHeader('Allow', 'POST, OPTIONS'); return res.status(204).end(); }
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return res.status(405).json({ ok: false, code: 'phuong_thuc', thongBao: THONG_BAO.phuong_thuc }); }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch { body = null; } }
    const kt = chuanHoaHoSo(body, () => 'srv-' + crypto.randomUUID().replace(/-/g, ''));
    if (!kt.ok) return res.status(400).json({ ok: false, code: 'khong_hop_le', thongBao: THONG_BAO.khong_hop_le, loi: kt.loi });

    const url = (env.VTF_GOOGLE_SHEET_WEBHOOK || '').trim();
    if (!diaChiHopLe(url)) {
      console.error('submit-nomination: chua cau hinh hoac sai bien VTF_GOOGLE_SHEET_WEBHOOK');
      return res.status(503).json({ ok: false, code: 'chua_cau_hinh', thongBao: THONG_BAO.chua_cau_hinh });
    }

    const ip = ((req.headers && req.headers['x-forwarded-for']) || '').toString().split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'khong-ro';
    if (vuotGioiHanIp(ip, now())) return res.status(429).json({ ok: false, code: 'qua_nhieu', thongBao: THONG_BAO.qua_nhieu });

    const kq = await goiSheet({ url, banGhi: kt.banGhi, fetchFn });
    const r = kq.kq;
    if (r && r.ok === true && r.id) {
      return res.status(200).json({ ok: true, id: r.id, serverReceiptHash: r.receipt, savedAt: r.savedAt, duplicate: r.trung === true });
    }
    if (r && r.ok === false && ['qua_nhieu', 'ban'].includes(r.loi)) {
      return res.status(429).json({ ok: false, code: 'qua_nhieu', thongBao: THONG_BAO.qua_nhieu });
    }
    // Apps Script từ chối dữ liệu mà bước kiểm tra ở đây đã cho qua (hai bên kiểm tra khác nhau), hoặc bảng chưa sẵn sàng: coi là chưa lưu
    console.error('submit-nomination: luu that bai', JSON.stringify({ requestId: kt.banGhi.requestId, http: kq.http, loi: r && r.loi, mang: kq.loiMang }));
    return res.status(502).json({ ok: false, code: 'luu_that_bai', thongBao: THONG_BAO.luu_that_bai });
  };
}

export default createHandler();
