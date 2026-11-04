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
}

interface KateLinhChatbotProps {
  onNavigateSection: (sectionId: string) => void;
}

const KIRA_API_STORAGE_KEY = 'vtf30_kira_api_key_v1';
const KIRA_MODEL_STORAGE_KEY = 'vtf30_kira_model_v1';

// Helper to normalize Vietnamese strings for fast fuzzy matching
function normalizeVi(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

interface RetrievedKnowledge {
  contextText: string;
  fallbackReply: string;
  links: ChatLinkItem[];
  images: ChatImageItem[];
}

function retrieveWebsiteKnowledge(query: string): RetrievedKnowledge {
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

  // 1. Search in Hall of Fame (12 Legends)
  const matchedHof = HALL_OF_FAME_2026.filter((m) => {
    const hay = normalizeVi(`${m.name} ${m.title} ${m.categoryLabel} ${m.danRank ?? ''} ${m.achievements.join(' ')}`);
    const words = qNorm.split(/\s+/).filter((w) => w.length >= 3);
    return (
      hay.includes(qNorm) ||
      (qNorm.includes('truong ngoc de') && hay.includes('truong ngoc de')) ||
      (qNorm.includes('nguyen thanh huy') && hay.includes('nguyen thanh huy')) ||
      (qNorm.includes('tran hieu ngan') && hay.includes('tran hieu ngan')) ||
      (qNorm.includes('chau tuyet van') && hay.includes('chau tuyet van')) ||
      (qNorm.includes('tran quang ha') && hay.includes('tran quang ha')) ||
      (qNorm.includes('ho nhat thong') && hay.includes('ho nhat thong')) ||
      (qNorm.includes('khuc van bon') && hay.includes('khuc van bon')) ||
      (qNorm.includes('dang quoc tien') && hay.includes('dang quoc tien')) ||
      words.filter((w) => hay.includes(w)).length >= 2
    );
  });

  if (matchedHof.length > 0) {
    addLink({ label: 'Đại sảnh Danh vọng (Hall of Fame 2026)', sectionId: 'hall-of-fame' });
    matchedHof.slice(0, 3).forEach((m) => {
      contextParts.push(
        `[Hall of Fame] ${m.name} (${m.danRank || m.categoryLabel}) - ${m.title} (${m.era}, ${m.region}). Thành tựu: ${m.achievements.join('; ')}. Câu nói: "${m.quote}"`
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
    const fullNorm = normalizeVi(`${p.name} ${p.locality} ${p.role} ${p.highlight} ${p.groupCode} ${p.danOrLevel ?? ''}`);
    if (qNorm.length >= 3 && nameNorm.includes(qNorm)) return true;
    // Check if query contains person's name
    const cleanPersonName = normalizeVi(p.name.replace(/\([^)]*\)/g, ''));
    if (cleanPersonName.length >= 5 && qNorm.includes(cleanPersonName)) return true;
    if (qNorm.includes(normalizeVi(p.groupCode))) return true;
    const words = qNorm.split(/\s+/).filter((w) => w.length >= 3);
    return words.length >= 2 && words.every((w) => fullNorm.includes(w));
  });

  if (matchedPersons.length > 0) {
    addLink({ label: 'Tra cứu 8 Danh sách Nhân sự 30 năm (429 hồ sơ)', sectionId: 'directory-120' });
    addLink({
      label: 'Tải File Excel 8 Danh sách (.XLSX)',
      href: '/docs/VTF_8_Danh_Sach_30_Nam.xlsx',
    });
    matchedPersons.slice(0, 6).forEach((p) => {
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
    qNorm.includes('dang')
  ) {
    addLink({ label: 'Bảng Tổng hợp 8 Danh sách Nhân sự 30 Năm', sectionId: 'directory-120' });
    addLink({
      label: 'Mở Google Sheets 8 Danh sách Trực tuyến',
      href: 'https://docs.google.com/spreadsheets/d/1KkX9yWIAV3kcActDIkDrzIFd-uFxkXbjJn68uLZzWzQ/edit?usp=sharing',
    });
    contextParts.push(
      `[Tổng hợp 8 Danh sách Nhân sự 30 năm VTF]: Tổng 4 DS TOP không trùng = ${VTF_TOTAL_TOP4_UNIQUE} người; Tổng cả 8 DS = ${VTF_ALL_8_LISTS_ITEMS.length} hồ sơ. Chi tiết: ` +
        VTF_8_LISTS_SUMMARY.map((s) => `DS${s.stt} (${s.code} - ${s.title}: ${s.count} người - ${s.note})`).join('; ')
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
      qNorm.includes('2000') ||
      qNorm.includes('sydney') ||
      qNorm.includes('358/ttg') ||
      hay.includes(qNorm)
    );
  });

  if (matchedTimeline.length > 0) {
    addLink({ label: 'Biên niên sử 6 Giai đoạn (1962 – 1996 – 2026)', sectionId: 'timeline-30years' });
    matchedTimeline.slice(0, 3).forEach((ms) => {
      contextParts.push(`[Biên niên sử ${ms.year} - ${ms.phase}] ${ms.title}: ${ms.description}`);
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
    qNorm.includes('lien he')
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

  // Default fallback if general greeting or unmatched query
  if (contextParts.length === 0) {
    addLink({ label: 'Khám phá Biên niên sử 30 năm VTF', sectionId: 'timeline-30years' });
    addLink({ label: 'Đại sảnh Danh vọng (Hall of Fame 2026)', sectionId: 'hall-of-fame' });
    addLink({ label: 'Tra cứu 8 Danh sách Nhân sự (429 hồ sơ)', sectionId: 'directory-120' });
    addLink({ label: 'Công cụ Chấm điểm 036/VTF', sectionId: 'cong-cu-tuong-tac' });
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
    addImage({
      src: '/images/timeline-stage3-sydney-2000.jpg',
      title: 'Đón đoàn Olympic Sydney 2000 – Trần Hiếu Ngân',
      caption: 'Tấm HCB Olympic đầu tiên của Thể thao Việt Nam',
    });
    contextParts.push(
      `[Tổng quan Website Kỷ niệm 30 năm VTF (22/12/1996 – 22/12/2026)]: Chủ đề "Khát Vọng Hóa Rồng – Nối Nhịp Olympic". Chủ tịch VTF: Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon); Phó Chủ tịch kiêm Tổng Thư ký: Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon). Website gồm: (1) Thư chúc mừng Cục TDTT & Diễn văn Chủ tịch VTF; (2) Biên niên sử 6 giai đoạn 1962–2046; (3) Đại sảnh Danh vọng Class of 2026 (12 huyền thoại); (4) Hệ thống 8 Danh sách Nhân sự (91 hồ sơ TOP không trùng, 429 tổng hồ sơ gồm Cán bộ xây dựng, HLV/VĐV xuất sắc, HĐKT & Trọng tài QG, HLV địa phương, HĐKT hiện nay, Trọng tài Cấp 1-2, HLV 6-7 Đẳng VTF, HLV 7+ Đẳng Kukkiwon); (5) Đêm Gala 19/12/2026 & Kỷ yếu 120 trang; (6) Công cụ tự chấm điểm 036/VTF & Cổng nộp hồ sơ.`
    );
  }

  // Always ensure at least 1-2 relevant images from gallery/site
  if (images.length === 0) {
    const samplePhoto = GALLERY_PHOTOS[0];
    addImage({
      src: samplePhoto.src,
      title: samplePhoto.title,
      caption: samplePhoto.caption,
    });
  }

  // Construct structured Vietnamese reply as KateLinh
  let fallbackReply = `Dạ, em là **KateLinh, là thư ký VTF** (Liên đoàn Taekwondo Việt Nam). Em xin gửi tới anh/chị thông tin chi tiết trên website Kỷ niệm 30 năm VTF (22/12/1996 – 22/12/2026) như sau ạ:\n\n`;

  if (matchedPersons.length > 0) {
    fallbackReply += `📌 **Thông tin trong Hệ thống 8 Danh sách Nhân sự 30 năm VTF (${matchedPersons.length} kết quả phù hợp):**\n`;
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
    matchedHof.slice(0, 2).forEach((m) => {
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
    fallbackReply += contextParts.map((c) => `• ${c}`).join('\n') + '\n\n';
  }

  fallbackReply += `🔗 Anh/chị có thể bấm trực tiếp vào **các đường link mục lục / tài liệu** và xem **hình ảnh tư liệu đã cập nhật trên website** ngay bên dưới tin nhắn này ạ!`;

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
      return localStorage.getItem(KIRA_API_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [kiraModel, setKiraModel] = useState<string>(() => {
    try {
      return localStorage.getItem(KIRA_MODEL_STORAGE_KEY) || 'kira-mini-1.0';
    } catch {
      return 'kira-mini-1.0';
    }
  });
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewImg, setPreviewImg] = useState<ChatImageItem | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-katelinh',
      role: 'assistant',
      text: 'Dạ, em là **KateLinh, là thư ký VTF** (Liên đoàn Taekwondo Việt Nam). Em đã đọc toàn bộ dữ liệu trên website Kỷ niệm 30 năm VTF (1996 – 2026): từ Biên niên sử 6 giai đoạn, Đại sảnh Danh vọng, đầy đủ **8 Danh sách Nhân sự (429 hồ sơ)**, Thư chúc mừng Cục TDTT, đến Tiêu chí chấm điểm 036/VTF.\n\nAnh/chị cần tra cứu thông tin nhân sự, lịch sử, văn bản hay hình ảnh nào cứ hỏi em nhé ạ!',
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
      timestamp: 'Trực tuyến 24/7',
      sourceMode: 'knowledge_engine',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSaveApiKey = (newKey: string, newModel: string) => {
    const trimmed = newKey.trim();
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

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // 1. Retrieve exact website knowledge, links, and images
    const retrieved = retrieveWebsiteKnowledge(cleanQ);

    // 2. If KiraAI API key is configured, call https://kiraai.vn/api/v1/chat/completions
    let finalAnswerText = retrieved.fallbackReply;
    let usedMode: 'kiraai' | 'knowledge_engine' = 'knowledge_engine';

    if (kiraApiKey.trim()) {
      try {
        const systemPrompt = `Bạn là KateLinh, thư ký Liên đoàn Taekwondo Việt Nam (VTF).
Luôn bắt đầu câu trả lời bằng cách xưng hô lễ phép: "Dạ, em là KateLinh, là thư ký VTF...".
Nhiệm vụ của bạn là trả lời khách hàng dựa chính xác trên toàn bộ thông tin của website Kỷ niệm 30 năm Liên đoàn Taekwondo Việt Nam (22/12/1996 – 22/12/2026) tại https://vtf30.tkdai.vn.
Quy tắc bắt buộc:
1. Luôn ghi rõ "Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)" và "Đại võ sư Trương Ngọc Để (9 Đẳng Kukkiwon)" khi nhắc tới hai vị lãnh đạo này.
2. Trả lời đầy đủ: (a) Thông tin trên website, (b) Hướng dẫn khách bấm vào Link liên quan trên website ở ngay dưới tin nhắn, (c) Giới thiệu các Hình ảnh liên quan đã cập nhật trên website hiển thị kèm theo.
Dữ liệu trích xuất trực tiếp từ website cho câu hỏi này:
${retrieved.contextText}`;

        const res = await fetch('https://kiraai.vn/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${kiraApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: kiraModel || 'kira-mini-1.0',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: cleanQ },
            ],
            temperature: 0.3,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const aiContent = data?.choices?.[0]?.message?.content;
          if (aiContent && typeof aiContent === 'string' && aiContent.trim().length > 10) {
            finalAnswerText = aiContent.trim();
            usedMode = 'kiraai';
          }
        }
      } catch {
        // Fallback seamlessly to full local knowledge engine if CORS or key issue
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
                  <span className="katelinh-ai-pill">KiraAI</span>
                </div>
                <p>Hỗ trợ tra cứu toàn bộ 8 Danh sách & Dữ liệu 30 năm VTF</p>
              </div>
            </div>

            <div className="katelinh-header-actions">
              <button
                type="button"
                className={`katelinh-icon-btn ${kiraApiKey ? 'key-active' : ''}`}
                onClick={() => setShowKeyConfig((prev) => !prev)}
                title="Cấu hình KiraAI API Key (https://kiraai.vn/api/v1)"
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
                <strong>Kết nối API KiraAI (`https://kiraai.vn/api/v1`)</strong>
                <span>Tương thích chuẩn OpenAI Chat Completions</span>
              </div>
              <input
                type="password"
                value={kiraApiKey}
                onChange={(e) => setKiraApiKey(e.target.value)}
                placeholder="Dán API Key từ kiraai.vn (VD: sk-...) vào đây"
                className="key-config-input"
              />
              <div className="key-config-row">
                <select
                  value={kiraModel}
                  onChange={(e) => setKiraModel(e.target.value)}
                  className="key-config-select"
                >
                  <option value="kira-mini-1.0">Model: kira-mini-1.0</option>
                  <option value="kira-chatbox">Model: kira-chatbox</option>
                  <option value="kira-3.5-flash">Model: kira-3.5-flash</option>
                </select>
                <button
                  type="button"
                  className="key-save-btn"
                  onClick={() => handleSaveApiKey(kiraApiKey, kiraModel)}
                >
                  <CheckCircle2 size={14} /> Lưu kết nối
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
                      <span className="box-sub-label">🔗 Link liên quan trên website:</span>
                      <div className="katelinh-links-list">
                        {msg.links.map((lk) =>
                          lk.sectionId ? (
                            <button
                              key={lk.label}
                              type="button"
                              className="katelinh-jump-link"
                              onClick={() => {
                                onNavigateSection(lk.sectionId!);
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
                        <ImageIcon size={12} /> Hình ảnh liên quan trên website:
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
                  <span>Thư ký KateLinh đang tra cứu dữ liệu VTF...</span>
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
