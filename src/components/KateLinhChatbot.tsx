import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  ExternalLink,
  KeyRound,
  Image as ImageIcon,
  CheckCircle2,
  Bot,
  ChevronRight,
} from 'lucide-react';
import {
  TIMELINE_MILESTONES,
  HALL_OF_FAME_2026,
  OFFICIAL_DOCS,
  GALA_PROGRAM_CHAPTERS,
  YEARBOOK_STRUCTURE,
  GALLERY_PHOTOS,
} from '../data/landingData';
import {
  VTF_ALL_8_LISTS_ITEMS,
  VTF_8_LISTS_SUMMARY,
  VTF_TOTAL_TOP4_UNIQUE,
} from '../data/vtf8ListsData';

export interface ChatLinkItem {
  label: string;
  sectionId?: string;
  href?: string;
}

export interface ChatImageItem {
  src: string;
  title: string;
  caption?: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  links: ChatLinkItem[];
  images: ChatImageItem[];
  timestamp: string;
  sourceMode?: 'kiraai' | 'knowledge_engine';
  modelUsed?: string;
}

interface KateLinhChatbotProps {
  onNavigateSection: (sectionId: string) => void;
}

// Official KiraAI API Key configured for VTF 30th Anniversary Portal
const DEFAULT_KIRA_API_KEY = 'kira_f1d4002a2519f3ea0c9110c3ea0e79c4';
const DEFAULT_KIRA_MODEL = 'kira-flash';

const KIRA_API_STORAGE_KEY = 'vtf30_kira_api_key_v2';
const KIRA_MODEL_STORAGE_KEY = 'vtf30_kira_model_v2';

// Helper to normalize Vietnamese strings for fast fuzzy matching
function normalizeVi(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

// Master Website Knowledge Base always available to KiraAI
const MASTER_VTF_WEBSITE_SUMMARY = `
=== TỔNG QUAN WEBSITE KỶ NIỆM 30 NĂM LIÊN ĐOÀN TAEKWONDO VIỆT NAM (VTF) ===
- Tên chính thức: Liên đoàn Taekwondo Việt Nam (Vietnam Taekwondo Federation – VTF).
- Cột mốc kỷ niệm: 30 năm thành lập (22/12/1996 – 22/12/2026) theo Quyết định số 358/TTg của Thủ tướng Chính phủ.
- Khẩu hiệu / Chủ đề: "Khát Vọng Hóa Rồng – Nối Nhịp Olympic".
- Địa chỉ website chính thức: https://vtf30.tkdai.vn
- Trụ sở VTF: Số 219 Lý Thường Kiệt, Phường 15, Quận 11, TP. Hồ Chí Minh.
- Đầu mối tiếp nhận hồ sơ & truyền thông 30 năm: Bà Nguyễn Thị Anh Thư – SĐT/Zalo: 0909 576 776 – Email: tkdvn1996@gmail.com.
- Lãnh đạo chủ chốt:
  + Chủ tịch VTF: Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon) – Chủ tịch VTF nhiệm kỳ IV, V, VI; HLV trưởng ĐTQG tại Olympic Sydney 2000.
  + Phó Chủ tịch kiêm Tổng Thư ký VTF: Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) – HLV Trưởng Đội tuyển Quyền Taekwondo Quốc gia, Huân chương Lao động hạng Nhất (2025), người ký ban hành Tiêu chí 036/VTF và Thông báo 038/TB-VTF.
  + Chủ tịch Danh dự VTF đầu tiên (Nhiệm kỳ I, II, III): Ông Đặng Quốc Tiến (Nguyên Thứ trưởng Bộ Nội vụ) & Ông Hà Văn Dũng.
- Quy mô phong trào hiện nay: Hơn 1.500 CLB, >100.000 môn sinh thường xuyên tại 34 tỉnh/thành phố mới, >400.000 hồ sơ định danh điện tử VTF Digital ID.
- 6 Giai đoạn Biên niên sử (Mục #timeline-30years):
  1. Giai đoạn I (1962 – 1995): Khởi nguyên & Việt hóa – Các bậc tiền bối Cố võ sư Khúc Văn Bón, Nguyễn Long Vân, Nguyễn Quốc Tâm, Trương Ngọc Để; HCV SEA Games 1991 & HCV ASIAD 1994 (Trần Quang Hạ).
  2. Giai đoạn II (1996): Xác lập Định chế Quốc gia – Thủ tướng ký QĐ 358/TTg, Đại hội VTF lần I ngày 22/12/1996.
  3. Giai đoạn III (2000 – 2010): Kỷ nguyên Vàng Olympic & SEA Games – Trần Hiếu Ngân giành HCB Olympic Sydney 2000 (-57kg nữ, tấm huy chương Olympic đầu tiên của Thể thao Việt Nam), Hồ Nhất Thống (HCV Châu Á 1998, Olympic 2000), Nguyễn Văn Hùng (5 HCV SEA Games), Nguyễn Thị Huyền Diệu (4 HCV SEA Games).
  4. Giai đoạn IV (2011 – 2024): Cường quốc Quyền (Poomsae) Thế giới – Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) cùng thế hệ Châu Tuyết Vân, Nguyễn Thiên Phụng, Nguyễn Thị Lệ Kim, Trương Thị Kim Tuyền, Bạc Thị Khiêm.
  5. Giai đoạn V (2025): Đỉnh cao mới & Chuyển đổi số – Đại võ sư Trương Ngọc Để nhận 9 Đẳng Kukkiwon, Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) nhận Huân chương Lao động hạng Nhất.
  6. Giai đoạn VI (2026 – 2046): Đại lễ 30 năm (19/12/2026), Đại hội VTF nhiệm kỳ VII & Tầm nhìn Olympic 2028–2046.
- Hệ thống 8 Danh sách Nhân sự 30 năm VTF (Mục #directory-120, File tải: /docs/VTF_8_Danh_Sach_30_Nam.xlsx):
  + Tổng 4 Danh sách TOP không trùng (DS1–DS4): ${VTF_TOTAL_TOP4_UNIQUE} người.
  + Tổng toàn bộ 8 Danh sách (DS1–DS8): ${VTF_ALL_8_LISTS_ITEMS.length} hồ sơ.
  + DS1: TOP 50 Cán bộ & Võ sư xây dựng phong trào (27 người).
  + DS2: TOP 50 HLV & VĐV thành tích cao xuất sắc (28 người).
  + DS3: TOP 30 HĐKT & Trọng tài Quốc gia đóng góp lâu năm (21 người).
  + DS4: TOP 30 Võ sư & HLV phát triển địa phương (15 người).
  + DS5: Thành viên Hội đồng Kỹ thuật VTF hiện nay (27 người).
  + DS6: Trọng tài Quốc gia Cấp 1 & Cấp 2 (58 người).
  + DS7: HLV & Võ sư đạt 6–7 Đẳng VTF toàn quốc (248 người).
  + DS8: Đại võ sư & Võ sư đạt từ 7 Đẳng Kukkiwon trở lên (5 người).
- Đại lễ Gala "Đêm Ngọn Lửa Huyền Thoại" & Kỷ yếu 120 trang (Mục #gala-yearbook):
  + Thời gian Gala: 18:00 – 21:30 Thứ Bảy, ngày 19/12/2026 tại TP.HCM (NTĐ Quân khu 7 / KS Tân Sơn Nhất).
  + Kỷ yếu 120 trang (6 phần) + 50 cuốn Bản Vàng giới hạn có chữ ký Chủ tịch WT Chungwon Choue, Chủ tịch ATU Lee Kyu-seok, Chủ tịch VTF Trương Ngọc Để gây Quỹ Ngọn lửa Olympic.
- Văn bản pháp lý & Thời hạn nộp hồ sơ (Mục #cong-cu-tuong-tac & #portal-register):
  + Bản Tiêu chí số 036/VTF (04/04/2026): Chia 2 hệ độc lập Hệ A (Đỉnh cao) và Hệ B (Di sản phong trào), thang điểm 100.
  + Thông báo số 038/TB-VTF (06/04/2026): Hạn chót nộp hồ sơ khen thưởng 30 năm là 30/10/2026.
  + Công văn số 128/VTF-VP (08/08/2026): Hạn gửi bài viết 300–500 chữ & 5–10 ảnh Kỷ yếu 34 tỉnh/thành là 10/09/2026.
`.trim();

interface RetrievedKnowledge {
  contextText: string;
  fallbackReply: string;
  links: ChatLinkItem[];
  images: ChatImageItem[];
}

export function retrieveWebsiteKnowledge(query: string): RetrievedKnowledge {
  const qNorm = normalizeVi(query);
  const links: ChatLinkItem[] = [];
  const images: ChatImageItem[] = [];
  const contextParts: string[] = [];

  const addLink = (link: ChatLinkItem) => {
    if (!links.some((l) => l.label === link.label)) {
      links.push(link);
    }
  };

  const addImage = (img: ChatImageItem) => {
    if (img.src && !images.some((i) => i.src === img.src)) {
      images.push(img);
    }
  };

  // Stopwords to ignore when token-matching Vietnamese queries
  const stopWords = new Set([
    'cho',
    'hoi',
    'toi',
    'anh',
    'chi',
    'em',
    'vtf',
    'taekwondo',
    'viet',
    'nam',
    'thong',
    'tin',
    'hinh',
    'anh',
    'link',
    'cua',
    'nhung',
    'cac',
    'nao',
    'trong',
    'tren',
    'web',
    'website',
    'la',
    'ai',
    'gi',
    'o',
    'tai',
    'co',
    'bao',
    'nhieu',
  ]);

  const queryTokens = qNorm
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  // 1. Search in Hall of Fame (12 Legends)
  const matchedHof = HALL_OF_FAME_2026.filter((m) => {
    const hay = normalizeVi(
      `${m.name} ${m.title} ${m.categoryLabel} ${m.danRank ?? ''} ${m.region} ${m.achievements.join(' ')}`
    );
    if (
      (qNorm.includes('truong ngoc de') && hay.includes('truong ngoc de')) ||
      (qNorm.includes('nguyen thanh huy') && hay.includes('nguyen thanh huy')) ||
      (qNorm.includes('tran hieu ngan') && hay.includes('tran hieu ngan')) ||
      (qNorm.includes('chau tuyet van') && hay.includes('chau tuyet van')) ||
      (qNorm.includes('tran quang ha') && hay.includes('tran quang ha')) ||
      (qNorm.includes('ho nhat thong') && hay.includes('ho nhat thong')) ||
      (qNorm.includes('khuc van bon') && hay.includes('khuc van bon')) ||
      (qNorm.includes('dang quoc tien') && hay.includes('dang quoc tien')) ||
      (qNorm.includes('kim tuyen') && hay.includes('kim tuyen')) ||
      (qNorm.includes('nguyen van hung') && hay.includes('nguyen van hung')) ||
      (qNorm.includes('le minh khuong') && hay.includes('le minh khuong')) ||
      (qNorm.includes('chungwon') && hay.includes('chungwon'))
    ) {
      return true;
    }
    if (
      qNorm.includes('chu tich') &&
      (hay.includes('truong ngoc de') || hay.includes('dang quoc tien'))
    ) {
      return true;
    }
    if (
      (qNorm.includes('tong thu ky') || qNorm.includes('hlv truong')) &&
      hay.includes('nguyen thanh huy')
    ) {
      return true;
    }
    return queryTokens.length >= 2 && queryTokens.filter((w) => hay.includes(w)).length >= 2;
  });

  if (matchedHof.length > 0) {
    addLink({ label: 'Đại sảnh Danh vọng (Hall of Fame 2026)', sectionId: 'hall-of-fame' });
    matchedHof.slice(0, 4).forEach((m) => {
      contextParts.push(
        `[Hall of Fame 2026] ${m.name} (${m.danRank || m.categoryLabel}) - ${m.title} (${m.era}, ${m.region}). Thành tựu: ${m.achievements.join('; ')}. Câu nói: "${m.quote}". Ảnh trên web: ${m.image}`
      );
      addImage({
        src: m.image,
        title: `${m.name} (${m.danRank || m.categoryLabel})`,
        caption: m.title,
      });
    });
  }

  // 2. Search in 8 Personnel Lists (429 records)
  const matchedPersons = VTF_ALL_8_LISTS_ITEMS.filter((p) => {
    const nameNorm = normalizeVi(p.name);
    const locNorm = normalizeVi(p.locality);
    const fullNorm = normalizeVi(
      `${p.name} ${p.locality} ${p.role} ${p.highlight} ${p.groupCode} ${p.danOrLevel ?? ''}`
    );

    const cleanPersonName = normalizeVi(p.name.replace(/\([^)]*\)/g, ''));
    if (cleanPersonName.length >= 5 && qNorm.includes(cleanPersonName)) return true;
    if (qNorm.length >= 4 && nameNorm.includes(qNorm)) return true;

    // Match specific list code like ds1, ds2, ds3, ds4, ds5, ds6, ds7, ds8
    const gCodeNorm = normalizeVi(p.groupCode);
    if (
      qNorm.includes(gCodeNorm) ||
      qNorm.includes(`danh sach ${p.groupCode.replace('DS', '')}`)
    ) {
      return true;
    }

    // Match locality (e.g. đà nẵng, hà nội, an giang, sơn la, đồng tháp, lâm đồng...)
    if (locNorm.length >= 4 && qNorm.includes(locNorm)) return true;

    return queryTokens.length >= 2 && queryTokens.every((w) => fullNorm.includes(w));
  });

  if (matchedPersons.length > 0) {
    addLink({ label: 'Tra cứu 8 Danh sách Nhân sự 30 năm (429 hồ sơ)', sectionId: 'directory-120' });
    addLink({
      label: 'Tải File Excel 8 Danh sách (.XLSX)',
      href: '/docs/VTF_8_Danh_Sach_30_Nam.xlsx',
    });
    matchedPersons.slice(0, 12).forEach((p) => {
      contextParts.push(
        `[${p.groupLabel}] STT #${p.stt}: ${p.name} | Đơn vị: ${p.locality} | Chức vụ/Cấp bậc: ${p.role} (${p.danOrLevel || p.branch}) | Ghi chú/Thành tích: ${p.highlight}`
      );
      if (p.photo) {
        addImage({
          src: p.photo,
          title: `${p.name} (${p.groupCode} #${p.stt})`,
          caption: `${p.role} · ${p.locality}`,
        });
      }
    });
  }

  // 3. Check if asking about the 8 Lists / Summary / Kukkiwon / Trọng tài / HĐKT
  if (
    qNorm.includes('danh sach') ||
    qNorm.includes('8 ds') ||
    qNorm.includes('tong hop') ||
    qNorm.includes('trong tai') ||
    qNorm.includes('hdkt') ||
    qNorm.includes('kukkiwon') ||
    qNorm.includes('dang') ||
    qNorm.includes('nhan su')
  ) {
    addLink({ label: 'Bảng Tổng hợp 8 Danh sách Nhân sự 30 Năm', sectionId: 'directory-120' });
    addLink({
      label: 'Mở Google Sheets 8 Danh sách Trực tuyến',
      href: 'https://docs.google.com/spreadsheets/d/1KkX9yWIAV3kcActDIkDrzIFd-uFxkXbjJn68uLZzWzQ/edit?usp=sharing',
    });
    addLink({
      label: 'Tải File Excel 8 Danh sách (.XLSX)',
      href: '/docs/VTF_8_Danh_Sach_30_Nam.xlsx',
    });
    contextParts.push(
      `[Tổng hợp 8 Danh sách Nhân sự 30 năm VTF]: Tổng 4 DS TOP không trùng = ${VTF_TOTAL_TOP4_UNIQUE} người; Tổng cả 8 DS = ${VTF_ALL_8_LISTS_ITEMS.length} hồ sơ. Chi tiết: ` +
        VTF_8_LISTS_SUMMARY.map(
          (s) => `DS${s.stt} (${s.code} - ${s.title}: ${s.count} người - ${s.note})`
        ).join('; ')
    );
  }

  // 4. Search in Timeline (6 Stages 1962 - 2046)
  const matchedTimeline = TIMELINE_MILESTONES.filter((ms) => {
    const hay = normalizeVi(`${ms.year} ${ms.phase} ${ms.title} ${ms.subtitle} ${ms.description}`);
    return (
      qNorm.includes('lich su') ||
      qNorm.includes('bien nien su') ||
      qNorm.includes('giai doan') ||
      qNorm.includes('1996') ||
      qNorm.includes('1962') ||
      qNorm.includes('1995') ||
      qNorm.includes('2000') ||
      qNorm.includes('sydney') ||
      qNorm.includes('olympic') ||
      qNorm.includes('358/ttg') ||
      hay.includes(qNorm)
    );
  });

  if (matchedTimeline.length > 0) {
    addLink({ label: 'Biên niên sử 6 Giai đoạn (1962 – 1996 – 2026)', sectionId: 'timeline-30years' });
    matchedTimeline.slice(0, 3).forEach((ms) => {
      contextParts.push(
        `[Biên niên sử ${ms.year} - ${ms.phase}] ${ms.title}: ${ms.description}. Ảnh trên web: ${ms.image}`
      );
      addImage({
        src: ms.image,
        title: `${ms.year}: ${ms.title}`,
        caption: ms.phase,
      });
    });
  }

  // 5. Check if asking about Speeches / Congratulatory Letter / Cục TDTT / Chủ tịch phát biểu
  if (
    qNorm.includes('thu chuc mung') ||
    qNorm.includes('cuc tdtt') ||
    qNorm.includes('phat bieu') ||
    qNorm.includes('dien van') ||
    qNorm.includes('thong diep') ||
    qNorm.includes('nguyen danh hoang viet')
  ) {
    addLink({ label: 'Thông điệp Lãnh đạo & Thư chúc mừng Cục TDTT', sectionId: 'messages-honor' });
    addLink({
      label: 'Tải Thư chúc mừng Cục TDTT (.DOCX)',
      href: '/docs/Cuc_TDTT_Thu_Chuc_Mung_VTF_30_Nam.docx',
    });
    addLink({
      label: 'Tải Báo cáo 30 năm Chủ tịch VTF (.DOCX)',
      href: '/docs/VTF_Bao_Cao_Thanh_Tich_30_Nam_Chu_Tich_Truong_Ngoc_De.docx',
    });
    contextParts.push(
      `[Thông điệp & Thư chúc mừng]: (1) Thư chúc mừng của Cục trưởng Cục TDTT Việt Nam Nguyễn Danh Hoàng Việt ghi nhận toàn diện đóng góp 30 năm VTF. (2) Diễn văn & Báo cáo thành tích 30 năm của Chủ tịch VTF Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon) với chủ đề "Khát Vọng Hóa Rồng – Nối Nhịp Olympic".`
    );
    addImage({
      src: '/images/truong-ngoc-de-9-dan-kukkiwon.jpg',
      title: 'Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon)',
      caption: 'Chủ tịch Liên đoàn Taekwondo Việt Nam',
    });
  }

  // 6. Check if asking about Gala / Kỷ yếu / 036 / 038 / 128 / Chấm điểm / Nộp hồ sơ
  if (
    qNorm.includes('gala') ||
    qNorm.includes('ky yeu') ||
    qNorm.includes('19/12') ||
    qNorm.includes('036') ||
    qNorm.includes('038') ||
    qNorm.includes('128') ||
    qNorm.includes('cham diem') ||
    qNorm.includes('khen thuong') ||
    qNorm.includes('nop ho so') ||
    qNorm.includes('lien he') ||
    qNorm.includes('tieu chi')
  ) {
    addLink({ label: 'Đêm Gala 19/12/2026 & Kỷ yếu 120 Trang', sectionId: 'gala-yearbook' });
    addLink({ label: 'Công cụ Tự chấm điểm Vinh danh 036/VTF', sectionId: 'cong-cu-tuong-tac' });
    addLink({ label: 'Cổng Nộp Hồ Sơ Đề Cử & Kỷ Yếu', sectionId: 'portal-register' });
    OFFICIAL_DOCS.forEach((doc) => {
      addLink({ label: `Tải ${doc.code} (PDF)`, href: doc.fileUrl });
    });
    contextParts.push(
      `[Văn bản Pháp lý & Sự kiện Gala 30 Năm]: Đại lễ Gala "Đêm Ngọn Lửa Huyền Thoại" diễn ra lúc 18:00–21:30 ngày 19/12/2026 tại TP.HCM (NTĐ Quân khu 7 / KS Tân Sơn Nhất) gồm 5 chương (${GALA_PROGRAM_CHAPTERS.map((c) => c.title).join(', ')}). Kỷ yếu 120 trang (${YEARBOOK_STRUCTURE.length} phần) kèm 50 Bản Vàng giới hạn có chữ ký Chủ tịch WT Chungwon Choue, Chủ tịch ATU Lee Kyu-seok và Chủ tịch VTF Trương Ngọc Để. Hạn gửi tư liệu Kỷ yếu 34 tỉnh/thành (CV 128/VTF-VP): 10/09/2026; Hạn nộp hồ sơ khen thưởng Hệ A & Hệ B (TB 038/TB-VTF & Tiêu chí 036/VTF do PCT kiêm Tổng Thư ký - Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) ký): 30/10/2026. Liên hệ: Bà Nguyễn Thị Anh Thư (0909 576 776) - Email: tkdvn1996@gmail.com.`
    );
    addImage({
      src: '/images/poster-30nam-giac-mo-olympic.jpg',
      title: 'Đại lễ Kỷ niệm 30 năm VTF & Khát vọng Olympic',
      caption: 'Gala Đêm Ngọn Lửa Huyền Thoại · 19/12/2026 tại TP.HCM',
    });
  }

  // Default links & images when query is general
  if (links.length === 0) {
    addLink({ label: 'Biên niên sử 6 Giai đoạn (1962 – 2026)', sectionId: 'timeline-30years' });
    addLink({ label: 'Đại sảnh Danh vọng (Hall of Fame 2026)', sectionId: 'hall-of-fame' });
    addLink({ label: 'Hệ thống 8 Danh sách Nhân sự (429 hồ sơ)', sectionId: 'directory-120' });
    addLink({ label: 'Công cụ Chấm điểm 036/VTF', sectionId: 'cong-cu-tuong-tac' });
  }

  if (images.length === 0) {
    if (qNorm.includes('huy') || qNorm.includes('quyen') || qNorm.includes('tong thu ky')) {
      addImage({
        src: '/images/dai-vo-su-nguyen-thanh-huy.jpg',
        title: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)',
        caption: 'Phó Chủ tịch kiêm Tổng Thư ký VTF · HLV Trưởng ĐT Quyền QG',
      });
    } else if (qNorm.includes('ngan') || qNorm.includes('sydney') || qNorm.includes('olympic')) {
      addImage({
        src: '/images/timeline-stage3-sydney-2000.jpg',
        title: 'Đón đoàn Olympic Sydney 2000 – Trần Hiếu Ngân',
        caption: 'Tấm HCB Olympic đầu tiên của Thể thao Việt Nam',
      });
    } else {
      addImage({
        src: '/images/truong-ngoc-de-9-dan-kukkiwon.jpg',
        title: 'Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon)',
        caption: 'Chủ tịch Liên đoàn Taekwondo Việt Nam',
      });
      addImage({
        src: '/images/dai-vo-su-nguyen-thanh-huy.jpg',
        title: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)',
        caption: 'Phó Chủ tịch kiêm Tổng Thư ký VTF · HLV Trưởng ĐT Quyền QG',
      });
      const samplePhoto = GALLERY_PHOTOS[0];
      if (samplePhoto) {
        addImage({
          src: samplePhoto.src,
          title: samplePhoto.title,
          caption: samplePhoto.caption,
        });
      }
    }
  }

  // Construct structured Vietnamese fallback reply as KateLinh
  let fallbackReply = `Dạ, **em là KateLinh, là thư ký VTF** (Liên đoàn Taekwondo Việt Nam). Em xin gửi tới anh/chị thông tin chi tiết trên website Kỷ niệm 30 năm VTF (22/12/1996 – 22/12/2026) như sau ạ:\n\n`;

  if (matchedPersons.length > 0) {
    fallbackReply += `📌 **Thông tin trên website – Hệ thống 8 Danh sách Nhân sự 30 năm VTF (${matchedPersons.length} hồ sơ phù hợp):**\n`;
    matchedPersons.slice(0, 5).forEach((p) => {
      fallbackReply += `• **${p.name}** (${p.groupCode} #${p.stt} – *${p.groupLabel}*): ${p.role} tại **${p.locality}**. Đẳng cấp/Phân hệ: **${p.danOrLevel || p.branch}**. Thành tích/Ghi chú: ${p.highlight}.\n`;
    });
    if (matchedPersons.length > 5) {
      fallbackReply += `• *(Và ${matchedPersons.length - 5} hồ sơ liên quan khác trong bảng danh bạ)*.\n`;
    }
    fallbackReply += `\n`;
  }

  if (matchedHof.length > 0) {
    fallbackReply += `🏆 **Thông tin tại Đại sảnh Danh vọng – Vietnam Taekwondo Hall of Fame (Class of 2026):**\n`;
    matchedHof.slice(0, 3).forEach((m) => {
      fallbackReply += `• **${m.name}** (*${m.danRank || m.categoryLabel}*): ${m.title} (${m.era} · ${m.region}).\n  - Dấu ấn: ${m.achievements.join('; ')}.\n`;
    });
    fallbackReply += `\n`;
  }

  if (matchedTimeline.length > 0 && matchedPersons.length === 0) {
    fallbackReply += `📜 **Thông tin Biên niên sử 30 năm VTF:**\n`;
    matchedTimeline.slice(0, 2).forEach((ms) => {
      fallbackReply += `• **Giai đoạn ${ms.year} (${ms.phase}) – ${ms.title}:** ${ms.description}\n`;
    });
    fallbackReply += `\n`;
  }

  if (matchedPersons.length === 0 && matchedHof.length === 0 && matchedTimeline.length === 0) {
    if (contextParts.length > 0) {
      fallbackReply += contextParts.map((c) => `• ${c}`).join('\n') + '\n\n';
    } else {
      fallbackReply += `• **Chủ tịch VTF:** Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon).\n• **Phó Chủ tịch kiêm Tổng Thư ký VTF:** Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon).\n• **Hệ thống dữ liệu trên web:** Gồm Biên niên sử 6 giai đoạn (1962–2026), Đại sảnh Danh vọng 12 Huyền thoại, 8 Danh sách Nhân sự (91 hồ sơ TOP không trùng & 429 tổng hồ sơ), Đêm Gala 19/12/2026, Kỷ yếu 120 trang và Bộ tiêu chí chấm điểm 036/VTF.\n\n`;
    }
  }

  fallbackReply += `🔗 **Link liên quan & Hình ảnh trên website:** Anh/chị có thể bấm trực tiếp vào các nút đường dẫn chuyên mục/tài liệu và xem hình ảnh tư liệu đính kèm ngay bên dưới tin nhắn này ạ!`;

  return {
    contextText: contextParts.join('\n'),
    fallbackReply,
    links: links.slice(0, 4),
    images: images.slice(0, 3),
  };
}

export const KateLinhChatbot: React.FC<KateLinhChatbotProps> = ({ onNavigateSection }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [kiraApiKey, setKiraApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(KIRA_API_STORAGE_KEY) || DEFAULT_KIRA_API_KEY;
    } catch {
      return DEFAULT_KIRA_API_KEY;
    }
  });
  const [kiraModel, setKiraModel] = useState<string>(() => {
    try {
      return localStorage.getItem(KIRA_MODEL_STORAGE_KEY) || DEFAULT_KIRA_MODEL;
    } catch {
      return DEFAULT_KIRA_MODEL;
    }
  });
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewImg, setPreviewImg] = useState<ChatImageItem | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-katelinh',
      role: 'assistant',
      text: 'Dạ, **em là KateLinh, là thư ký VTF** (Liên đoàn Taekwondo Việt Nam). Em đã kết nối trực tiếp với hệ thống AI KiraAI và nắm trọn vẹn toàn bộ dữ liệu trên website Kỷ niệm 30 năm VTF (22/12/1996 – 22/12/2026):\n• Biên niên sử 6 giai đoạn (1962 – 2026)\n• Đại sảnh Danh vọng (12 Huyền thoại Class of 2026)\n• Đầy đủ **8 Danh sách Nhân sự (91 TOP & 429 hồ sơ)**\n• Thư chúc mừng Cục TDTT, Diễn văn Chủ tịch VTF, Đêm Gala 19/12/2026 & Tiêu chí 036/VTF.\n\nAnh/chị cần tra cứu thông tin, đường link hay hình ảnh nào trên website cứ hỏi em nhé ạ!',
      links: [
        { label: 'Xem 8 Danh sách Nhân sự (429 hồ sơ)', sectionId: 'directory-120' },
        { label: 'Đại sảnh Danh vọng (Hall of Fame)', sectionId: 'hall-of-fame' },
        { label: 'Công cụ Chấm điểm 036/VTF', sectionId: 'cong-cu-tuong-tac' },
      ],
      images: [
        {
          src: '/images/truong-ngoc-de-9-dan-kukkiwon.jpg',
          title: 'Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon)',
          caption: 'Chủ tịch Liên đoàn Taekwondo Việt Nam',
        },
        {
          src: '/images/dai-vo-su-nguyen-thanh-huy.jpg',
          title: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)',
          caption: 'PCT kiêm Tổng Thư ký VTF',
        },
      ],
      timestamp: 'KiraAI Online',
      sourceMode: 'kiraai',
      modelUsed: DEFAULT_KIRA_MODEL,
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSaveApiKey = (newKey: string, newModel: string) => {
    const trimmed = newKey.trim() || DEFAULT_KIRA_API_KEY;
    setKiraApiKey(trimmed);
    setKiraModel(newModel);
    try {
      localStorage.setItem(KIRA_API_STORAGE_KEY, trimmed);
      localStorage.setItem(KIRA_MODEL_STORAGE_KEY, newModel);
    } catch {
      // ignore storage errors
    }
    setShowKeyConfig(false);
  };

  const sendQuestion = async (questionText: string) => {
    const cleanQ = questionText.trim();
    if (!cleanQ || isLoading) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanQ,
      links: [],
      images: [],
      timestamp: timeStr,
    };

    const recentConversation = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // 1. Retrieve exact website knowledge, links, and images for this query
    const retrieved = retrieveWebsiteKnowledge(cleanQ);

    // 2. Call https://kiraai.vn/api/v1/chat/completions with fast multi-model failover
    let finalAnswerText = retrieved.fallbackReply;
    let usedMode: 'kiraai' | 'knowledge_engine' = 'knowledge_engine';
    let successfulModel = '';

    const activeKey = (kiraApiKey || DEFAULT_KIRA_API_KEY).trim();
    if (activeKey) {
      const systemPrompt = `Bạn là KateLinh, thư ký Liên đoàn Taekwondo Việt Nam (VTF - Vietnam Taekwondo Federation, thành lập 22/12/1996).
TUYỆT ĐỐI LƯU Ý: VTF là Liên đoàn Taekwondo Việt Nam (KHÔNG PHẢI Liên đoàn Bóng bàn hay Quần vợt).

QUY TẮC BẮT BUỘC TRONG MỌI CÂU TRẢ LỜI:
1. Xưng hô: Luôn mở đầu câu trả lời bằng câu: "Dạ, **em là KateLinh, là thư ký VTF**..." và xưng "em", gọi khách là "anh/chị".
2. Luôn ghi đúng danh hiệu: "**Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon)**" và "**Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)**".
3. Cấu trúc câu trả lời gồm 3 phần rõ ràng, ngắn gọn, súc tích:
   - **📌 Thông tin trên website:** Trả lời chính xác dựa trên dữ liệu website bên dưới (nêu rõ số liệu, chức vụ, đơn vị, STT danh sách nếu có).
   - **🔗 Link liên quan đến nội dung trên website:** Nêu tên các mục hoặc tài liệu liên quan trên website (${retrieved.links.map((l) => l.label).join(', ')}) và mời anh/chị bấm vào các nút link ngay bên dưới.
   - **🖼️ Hình ảnh liên quan đã cập nhật trên website:** Giới thiệu ngắn gọn các bức ảnh tư liệu liên quan (${retrieved.images.map((img) => img.title).join(', ')}) đang hiển thị ngay bên dưới tin nhắn.

${MASTER_VTF_WEBSITE_SUMMARY}

=== DỮ LIỆU CHI TIẾT TRÍCH XUẤT TỪ WEBSITE CHO CÂU HỎI NÀY ===
${retrieved.contextText || 'Sử dụng thông tin Tổng quan Website ở trên.'}`;

      // Priority model chain (benchmarked < 2s latency on kiraai.vn)
      const candidateModels = Array.from(
        new Set([
          kiraModel || DEFAULT_KIRA_MODEL,
          'kira-flash',
          'deepseek-v4.1-flash',
          'kira-2.5-flash',
          'glm-4.7-flash',
        ])
      );

      for (const modelName of candidateModels) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 9000);
        try {
          const res = await fetch('https://kiraai.vn/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeKey}`,
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: systemPrompt },
                ...recentConversation,
                { role: 'user', content: cleanQ },
              ],
              temperature: 0.25,
            }),
          });
          window.clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const aiContent = data?.choices?.[0]?.message?.content;
            if (aiContent && typeof aiContent === 'string' && aiContent.trim().length > 15) {
              finalAnswerText = aiContent.trim();
              usedMode = 'kiraai';
              successfulModel = modelName;
              break;
            }
          }
        } catch {
          window.clearTimeout(timeoutId);
          // Try next fast model in chain
        }
      }
    }

    const assistantMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      text: finalAnswerText,
      links: retrieved.links,
      images: retrieved.images,
      timestamp: timeStr,
      sourceMode: usedMode,
      modelUsed: successfulModel || undefined,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const quickPrompts = [
    'Đại võ sư Trương Ngọc Để & Đại võ sư Nguyễn Thanh Huy',
    'Tra cứu 8 Danh sách Nhân sự 30 năm (429 hồ sơ)',
    'Khoảnh khắc HCB Olympic Sydney 2000 Trần Hiếu Ngân',
    'Cách chấm điểm 036/VTF & Hạn nộp hồ sơ 30 năm',
  ];

  // Simple bold markdown formatter for chat text
  const renderFormattedText = (raw: string) => {
    return raw.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="katelinh-msg-line">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="katelinh-floating-Launcher">
        {!isOpen && (
          <button
            type="button"
            className="katelinh-trigger-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Mở khung chat với Thư ký VTF KateLinh"
          >
            <div className="katelinh-avatar-badge">
              <Bot size={22} />
              <span className="katelinh-online-dot" />
            </div>
            <div className="katelinh-trigger-text">
              <span className="katelinh-trigger-kicker">TRỢ LÝ AI · KIRA AI</span>
              <strong>KateLinh – Thư ký VTF</strong>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <aside className="katelinh-chat-window" aria-label="Trợ lý AI KateLinh Thư ký VTF">
          {/* Header */}
          <div className="katelinh-chat-header">
            <div className="katelinh-header-left">
              <div className="katelinh-header-avatar">
                <img
                  src="/images/logos/logo-vietnam-taekwondo.png"
                  alt="KateLinh Thư ký VTF"
                  width={38}
                  height={24}
                />
                <span className="katelinh-online-dot" />
              </div>
              <div>
                <div className="katelinh-name-row">
                  <h3>KateLinh – Thư ký VTF</h3>
                  <span className="katelinh-ai-pill">KiraAI Live</span>
                </div>
                <p>Đã kết nối API KiraAI · Đọc toàn bộ dữ liệu 30 năm VTF</p>
              </div>
            </div>

            <div className="katelinh-header-actions">
              <button
                type="button"
                className={`katelinh-icon-btn ${kiraApiKey ? 'key-active' : ''}`}
                onClick={() => setShowKeyConfig((prev) => !prev)}
                title="Cấu hình KiraAI API Key & Model (https://kiraai.vn/api/v1)"
              >
                <KeyRound size={16} />
              </button>
              <button
                type="button"
                className="katelinh-icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Thu gọn cửa sổ chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Optional KiraAI API Key Configuration Drawer */}
          {showKeyConfig && (
            <div className="katelinh-key-config">
              <div className="key-config-top">
                <strong>Đã kết nối API KiraAI (`https://kiraai.vn/api/v1`)</strong>
                <span>Key mặc định của VTF đã kích hoạt sẵn sàng</span>
              </div>
              <input
                type="password"
                value={kiraApiKey}
                onChange={(e) => setKiraApiKey(e.target.value)}
                placeholder="Dán API Key từ kiraai.vn (VD: kira_...) vào đây"
                className="key-config-input"
              />
              <div className="key-config-row">
                <select
                  value={kiraModel}
                  onChange={(e) => setKiraModel(e.target.value)}
                  className="key-config-select"
                >
                  <option value="kira-flash">Model: Kira Flash (~1.5s - Khuyên dùng)</option>
                  <option value="deepseek-v4.1-flash">Model: DeepSeek V4.1 Flash (~1.2s)</option>
                  <option value="kira-2.5-flash">Model: Kira 2.5 Flash</option>
                  <option value="glm-4.7-flash">Model: GLM 4.7 Flash</option>
                </select>
                <button
                  type="button"
                  className="key-save-btn"
                  onClick={() => handleSaveApiKey(kiraApiKey, kiraModel)}
                >
                  <CheckCircle2 size={14} /> Lưu cài đặt
                </button>
              </div>
            </div>
          )}

          {/* Messages Body */}
          <div className="katelinh-messages-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`katelinh-msg-row ${msg.role}`}>
                <div className="katelinh-msg-bubble">
                  {msg.role === 'assistant' && (
                    <div className="katelinh-sender-tag">
                      <Sparkles size={12} />
                      <span>Em là KateLinh, là thư ký VTF</span>
                      <span className="msg-time">{msg.timestamp}</span>
                    </div>
                  )}

                  <div className="katelinh-msg-text">{renderFormattedText(msg.text)}</div>

                  {/* Related Website Links */}
                  {msg.links.length > 0 && (
                    <div className="katelinh-links-box">
                      <span className="box-sub-label">🔗 Link liên quan đến nội dung trên website:</span>
                      <div className="katelinh-links-list">
                        {msg.links.map((lk) =>
                          lk.sectionId ? (
                            <button
                              key={lk.label}
                              type="button"
                              className="katelinh-jump-link"
                              onClick={() => {
                                onNavigateSection(lk.sectionId!);
                                if (window.innerWidth <= 768) {
                                  setIsOpen(false);
                                }
                              }}
                            >
                              <ChevronRight size={13} />
                              <span>{lk.label}</span>
                            </button>
                          ) : (
                            <a
                              key={lk.label}
                              href={lk.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="katelinh-jump-link"
                            >
                              <ExternalLink size={13} />
                              <span>{lk.label}</span>
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Related Website Images */}
                  {msg.images.length > 0 && (
                    <div className="katelinh-images-box">
                      <span className="box-sub-label">
                        <ImageIcon size={12} /> Hình ảnh liên quan đã cập nhật trên website:
                      </span>
                      <div className="katelinh-images-grid">
                        {msg.images.map((im) => (
                          <div
                            key={im.src}
                            className="katelinh-img-card"
                            onClick={() => setPreviewImg(im)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') setPreviewImg(im);
                            }}
                          >
                            <img src={im.src} alt={im.title} loading="lazy" />
                            <div className="katelinh-img-caption">
                              <strong>{im.title}</strong>
                              {im.caption && <span>{im.caption}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="katelinh-msg-row assistant">
                <div className="katelinh-msg-bubble loading-bubble">
                  <span>Thư ký KateLinh đang đọc dữ liệu VTF & phản hồi qua KiraAI...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="katelinh-quick-prompts">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                type="button"
                className="katelinh-prompt-chip"
                onClick={() => sendQuestion(qp)}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            className="katelinh-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi KateLinh (VD: Nguyễn Thanh Huy, Trần Hiếu Ngân, DS1...)"
              aria-label="Nhập câu hỏi cho Thư ký VTF KateLinh"
            />
            <button type="submit" className="katelinh-send-btn" disabled={!input.trim() || isLoading}>
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}

      {/* Image Preview Modal from Chat */}
      {previewImg && (
        <div
          className="vtf-modal-backdrop"
          onClick={() => setPreviewImg(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="vtf-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setPreviewImg(null)}
              aria-label="Đóng ảnh"
            >
              <X size={20} />
            </button>
            <img src={previewImg.src} alt={previewImg.title} className="lightbox-full-img" />
            <div className="lightbox-caption-bar">
              <h3>{previewImg.title}</h3>
              {previewImg.caption && <p>{previewImg.caption}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
